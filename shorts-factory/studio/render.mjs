#!/usr/bin/env node
/**
 * Turns one video plan (studio/data/videos/<id>/video.json) into a HyperFrames project and
 * renders it to studio/data/videos/<id>/video.mp4. Run from the cabinet root:
 *   node studio/render.mjs <video-id>
 * The composition is built here, the same way every time, so a video never depends on
 * hand-written animation code. Progress goes to render.json beside the plan for the Studio.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const HYPERFRAMES = "hyperframes@0.9.9";
const W = 1080;
const PHOTO_MOVES = [
  ["{ scale: 1.02 }", "{ scale: 1.14 }"],
  ["{ scale: 1.16 }", "{ scale: 1.05 }"],
  ["{ scale: 1.12, xPercent: -3 }", "{ scale: 1.12, xPercent: 3 }"],
  ["{ scale: 1.12, xPercent: 3 }", "{ scale: 1.12, xPercent: -3 }"],
];
const H = 1920;

const id = process.argv[2];
if (!id || !/^[a-z0-9-]+$/.test(id)) {
  console.error("Usage: node studio/render.mjs <video-id>");
  process.exit(2);
}
const dir = path.resolve("studio/data/videos", id);
const planPath = path.join(dir, "video.json");
const statusPath = path.join(dir, "render.json");

function status(state, extra = {}) {
  const body = { state, at: new Date().toISOString(), ...extra };
  fs.writeFileSync(statusPath, `${JSON.stringify(body, null, 2)}\n`);
}

function esc(text) {
  return String(text ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
}

const Compose = new Function(
  "self",
  `${fs.readFileSync(new URL("./compose.js", import.meta.url), "utf8")}\nreturn self.Compose;`,
)({});

const work = path.join(dir, ".render");

/**
 * A scene's voice, cut to the line it says: a copy in the work folder that starts just before
 * the first word and ends just after the last, with where it speaks, so captions land on the
 * voice and every scene is as long as its line. The file the voice tool made is never changed.
 * A file that cannot be read this way (not 16-bit sound, no speech found) plays whole.
 */
function voiceOf(name, text, i) {
  try {
    const b = fs.readFileSync(path.join(dir, name));
    let rate = 24000, channels = 1, bits = 16, kind = 1;
    for (let at = 12; at + 8 <= b.length; ) {
      const tag = b.toString("ascii", at, at + 4);
      const size = b.readUInt32LE(at + 4);
      if (tag === "fmt ") {
        kind = b.readUInt16LE(at + 8);
        channels = b.readUInt16LE(at + 10);
        rate = b.readUInt32LE(at + 12);
        bits = b.readUInt16LE(at + 22);
      }
      if (tag === "data") {
        if (kind !== 1 || bits !== 16 || channels !== 1) return null;
        const data = b.subarray(at + 8, at + 8 + Math.min(size, b.length - at - 8));
        const samples = Math.floor(data.length / 2);
        // A copy, so the samples sit on an even address whatever the file's layout.
        const pcm = new Int16Array(samples);
        for (let n = 0; n < samples; n++) pcm[n] = data.readInt16LE(n * 2);
        const cut = Compose.voiceCut(Compose.speechSpans(pcm, rate), text, samples / rate);
        if (!cut) return null;
        const first = Math.round(cut.from * rate), last = Math.min(samples, Math.round(cut.to * rate));
        const body = data.subarray(first * 2, last * 2);
        const head = Buffer.alloc(44);
        head.write("RIFF", 0); head.writeUInt32LE(36 + body.length, 4); head.write("WAVEfmt ", 8);
        head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(1, 22);
        head.writeUInt32LE(rate, 24); head.writeUInt32LE(rate * 2, 28); head.writeUInt16LE(2, 32);
        head.writeUInt16LE(16, 34); head.write("data", 36); head.writeUInt32LE(body.length, 40);
        fs.writeFileSync(path.join(work, `voice-${i}.wav`), Buffer.concat([head, body]));
        return { src: `voice-${i}.wav`, seconds: (last - first) / rate, spans: cut.spans, long: cut.long };
      }
      at += 8 + size + (size % 2);
    }
  } catch {}
  return null;
}

function build(plan) {
  const look = Compose.resolveLook(plan.look);
  const palette = Array.isArray(plan.palette) && plan.palette.length >= 2 ? plan.palette : ["#7a4a2e", "#1c120d"];
  let t = 0;
  const scenes = plan.scenes.map((scene, i) => {
    // A voice made earlier stays on disk while the voice is off, so turning it back on is free.
    const audio = plan.speak !== false && scene.audio && fs.existsSync(path.join(dir, scene.audio)) ? scene.audio : null;
    const line = Compose.lineOf(scene, !!audio);
    const voice = audio ? voiceOf(audio, line, i) : null;
    // A voiced scene is as long as its line is said, measured from the file itself.
    const seconds = Compose.sceneSeconds(voice ? { ...scene, audioSeconds: voice.seconds } : scene, !!audio);
    const start = t;
    t += seconds;
    // The captions are the spoken line itself, each word shown as it is said.
    const words = Compose.syncedWords(line, start, seconds, voice ? voice.spans : null);
    const key = Number.isInteger(scene.key) && scene.key >= 0 && scene.key < words.length ? scene.key : Compose.keyIndex(words);
    return { ...scene, i, start, seconds, words, key, audio, voice, spot: Compose.captionSpot(scene, look) };
  });
  const total = Math.round(t * 100) / 100;

  // Moving scenes play their clip, muted under the voice; the rest show their picture.
  const motion = plan.motion === "hook" || plan.motion === "all" ? plan.motion : "still";
  const clipOf = (s) => (motion === "all" || (motion === "hook" && s.i === 0)) && s.clip && fs.existsSync(path.join(dir, s.clip)) ? s.clip : null;

  // One of the business's own pictures, popping out over the scene.
  const popOf = (s) => (s.popImage && fs.existsSync(path.join(dir, s.popImage)) ? s.popImage : null);

  const sceneHtml = scenes
    .map((s) => {
      const image = s.image && fs.existsSync(path.join(dir, s.image)) ? s.image : null;
      const clip = clipOf(s);
      const bg = clip
        ? `<video class="photo" id="vid-${s.i}" src="../${esc(clip)}" muted playsinline data-start="${s.start}" data-duration="${s.seconds}" data-track-index="1"></video>`
        : image
        ? `<img class="photo" id="photo-${s.i}" src="../${esc(image)}" alt="" />`
        : `<div class="field" style="background: radial-gradient(120% 75% at ${30 + ((s.i * 23) % 40)}% ${18 + ((s.i * 17) % 30)}%, ${palette[s.i % palette.length]}, ${palette[(s.i + 1) % palette.length]} 72%, #0b0807);"></div><div class="orb" id="orb-${s.i}"></div><div class="orb two" id="orb2-${s.i}" style="background: radial-gradient(circle, ${palette[(s.i + 2) % palette.length]}cc, transparent 62%);"></div>`;
      const caption = Compose.pages(s.words)
        .map((page, k) => `<p class="cap" id="p-${s.i}-${k}" style="left:${s.spot.x}%;top:${s.spot.y}%;max-width:${s.spot.w}%">` + page
          .map((j) => `<span class="w${j === s.key ? " key" : ""}" id="w-${s.i}-${j}">${esc(s.words[j].word)}</span>`)
          .join(" ") + "</p>")
        .join("\n  ");
      const at = Compose.popSpot(s.spot);
      const pop = popOf(s) ? `<div class="popw" style="left:${at.x}%;top:${at.y}%"><div class="pop" id="pop-${s.i}"><img src="../${esc(popOf(s))}" alt="" /></div></div>` : "";
      return `<section class="clip scene" id="scene-${s.i}" data-start="${s.start}" data-duration="${s.seconds}" data-track-index="0">
  ${bg}
  <div class="shade"></div>
  ${pop}
  ${caption}
</section>`;
    })
    .join("\n");

  const timeline = scenes
    .map((s) => {
      const lines = [];
      lines.push(`tl.fromTo("#scene-${s.i}", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" }, ${s.start});`);
      if (clipOf(s)) {
        // A clip already moves.
      } else if (s.image && fs.existsSync(path.join(dir, s.image))) {
        // The camera moves a different way in each scene: in, out, then a slow pan each side.
        const [from, to] = PHOTO_MOVES[s.i % PHOTO_MOVES.length];
        if (look.motion) lines.push(`tl.fromTo("#photo-${s.i}", ${from}, { ...${to}, duration: ${s.seconds}, ease: "sine.inOut" }, ${s.start});`);
      } else if (look.motion) {
        lines.push(`tl.fromTo("#orb-${s.i}", { x: -60, y: 40, scale: 0.9 }, { x: 80, y: -60, scale: 1.15, duration: ${s.seconds}, ease: "sine.inOut" }, ${s.start});`);
        lines.push(`tl.fromTo("#orb2-${s.i}", { x: 70, y: -30, scale: 1.1 }, { x: -90, y: 70, scale: 0.92, duration: ${s.seconds}, ease: "sine.inOut" }, ${s.start});`);
      }
      if (popOf(s) && look.motion) {
        // It pops in just after the cut and, unless the video ends on it, leaves before the next.
        lines.push(`tl.fromTo("#pop-${s.i}", { opacity: 0, scale: 0.4, rotation: -10 }, { opacity: 1, scale: 1, rotation: ${s.i % 2 ? 2 : -2}, duration: 0.4, ease: "back.out(1.9)" }, ${(s.start + 0.3).toFixed(2)});`);
        if (s.i < scenes.length - 1 && s.seconds > 1.6) lines.push(`tl.to("#pop-${s.i}", { opacity: 0, scale: 0.8, duration: 0.2, ease: "power2.in" }, ${(s.start + s.seconds - 0.22).toFixed(2)});`);
      }
      const pg = Compose.pages(s.words);
      pg.forEach((page, k) => {
        const from = s.words[page[0]].at;
        const nextPage = pg[k + 1];
        const until = nextPage ? s.words[nextPage[0]].at : s.start + s.seconds;
        lines.push(`tl.fromTo("#p-${s.i}-${k}", { opacity: 0, scale: 0.88, y: 24 }, { opacity: 1, scale: 1, y: 0, duration: 0.18, ease: "back.out(2.2)" }, ${from.toFixed(2)});`);
        if (nextPage) lines.push(`tl.set("#p-${s.i}-${k}", { opacity: 0 }, ${until.toFixed(2)});`);
        page.forEach((j, n) => {
          const w = s.words[j];
          const next = page[n + 1] !== undefined ? s.words[page[n + 1]].at : until;
          lines.push(`tl.set("#w-${s.i}-${j}", { className: "w on${j === s.key ? " key" : ""}" }, ${w.at.toFixed(2)});`);
          lines.push(`tl.set("#w-${s.i}-${j}", { className: "w${j === s.key ? " key" : ""}" }, ${next.toFixed(2)});`);
        });
      });
      return lines.join("\n      ");
    })
    .join("\n      ");

  const audio = scenes
    .filter((s) => s.audio)
    .map((s) => `<audio id="voice-${s.i}" class="clip" src="${s.voice ? esc(s.voice.src) : `../${esc(s.audio)}`}" data-start="${s.start}" data-duration="${s.seconds}" data-track-index="2"></audio>`)
    .join("\n");

  const html = `<!doctype html>
<html lang="en" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <link href="${Compose.fontsUrl(look)}" rel="stylesheet" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #0b0807; }
      #root { position: relative; width: 100%; height: 100%; font-family: Inter, "Helvetica Neue", Arial, sans-serif; }
      .clip { position: absolute; inset: 0; }
      .scene { overflow: hidden; }
      .field, .photo { position: absolute; inset: 0; width: 100%; height: 100%; }
      .photo { object-fit: cover; transform-origin: 50% 45%; }
      .orb { position: absolute; width: 900px; height: 900px; left: 90px; top: 380px; border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,0.14), rgba(255,255,255,0) 65%); }
      .orb.two { width: 1100px; height: 1100px; left: -260px; top: 1050px; mix-blend-mode: screen; opacity: 0.55; }
      .shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.35)); }
      .cap { transform: translate(-50%, -50%); opacity: 0; }
${Compose.captionCss(look, (px) => `${Math.round(px * 100) / 100}px`)}
${Compose.popCss((px) => `${px}px`)}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${sceneHtml}
${audio}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      ${timeline}
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;
  // What each voiced scene really runs, and the scenes whose voice says more than their line.
  const heard = scenes.map((s) => (s.voice ? Math.round(s.voice.seconds * 100) / 100 : null));
  const long = scenes.filter((s) => s.voice && s.voice.long).map((s) => s.i + 1);
  return { html, total, heard, long };
}

function run(cmd, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env, HYPERFRAMES_SKIP_SKILLS: "1" }, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (d) => { out += d; });
    child.stderr.on("data", (d) => { out += d; });
    child.on("close", (code) => resolve({ code, out }));
    child.on("error", (err) => resolve({ code: 1, out: String(err) }));
  });
}

async function main() {
  if (!fs.existsSync(planPath)) {
    console.error(`No plan at ${planPath}`);
    process.exit(2);
  }
  // The person's changes from the Studio go in first, so a render is never behind them.
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  if (!Array.isArray(plan.scenes) || !plan.scenes.length) {
    status("failed", { why: "The video has no scenes yet." });
    process.exit(2);
  }
  fs.mkdirSync(work, { recursive: true });
  const built = build(plan);
  fs.writeFileSync(path.join(work, "index.html"), built.html);
  fs.writeFileSync(path.join(work, "meta.json"), JSON.stringify({ id: `shorts-${id}`, name: plan.title || id }, null, 2));
  fs.writeFileSync(path.join(work, "hyperframes.json"), JSON.stringify({ paths: { assets: "assets" }, media: { autoProxy: false } }, null, 2));

  status("rendering");
  const started = Date.now();
  const out = path.join(dir, "video.next.mp4");
  // Made for the apps it is posted to: 1080 by 1920 at about 5 Mbps, what TikTok and Reels
  // ask for, so the file stays light. The computer's video encoder is tried first (much
  // faster); a computer without one encodes on the processor instead.
  let result = await run("npx", ["-y", HYPERFRAMES, "render", "--gpu", "--video-bitrate", "5M", "-o", out], work);
  if (result.code !== 0 || !fs.existsSync(out)) {
    fs.rmSync(out, { force: true });
    result = await run("npx", ["-y", HYPERFRAMES, "render", "--crf", "23", "--max-bitrate", "5M", "-o", out], work);
  }
  if (result.code !== 0 || !fs.existsSync(out)) {
    fs.rmSync(out, { force: true });
    fs.writeFileSync(path.join(work, "render.log"), result.out);
    const why = /ffmpeg/i.test(result.out) ? "FFmpeg is missing on this computer." : /chrome|browser/i.test(result.out) ? "The browser used to draw the video did not start." : "The video could not be made.";
    status("failed", { why });
    console.error(result.out.slice(-2000));
    process.exit(1);
  }
  fs.renameSync(out, path.join(dir, "video.mp4"));
  // A video's folder keeps only what the video plays: voice and picture files that no scene
  // uses any more (their words or picture changed, so they got a new name) are removed.
  // The copies sent to the image tool (`ref-`) have done their work.
  const used = new Set(plan.scenes.flatMap((s) => [s.audio, s.image, s.clip, s.popImage]).filter(Boolean));
  for (const f of fs.readdirSync(dir)) {
    if (/^(scene|pop|ref)-/.test(f) && !used.has(f)) fs.rmSync(path.join(dir, f), { force: true });
  }
  // The plan learns how long each voice really runs, so the Studio shows the same lengths.
  // It is read again here: the plan may have changed while the video was drawn.
  try {
    const now = JSON.parse(fs.readFileSync(planPath, "utf8"));
    let changed = false;
    (now.scenes || []).forEach((scene, i) => {
      const before = plan.scenes[i];
      if (built.heard[i] && before && scene.audio && scene.audio === before.audio && scene.audioSeconds !== built.heard[i]) {
        scene.audioSeconds = built.heard[i];
        changed = true;
      }
    });
    if (changed) {
      const temp = `${planPath}.${process.pid}.tmp`;
      fs.writeFileSync(temp, `${JSON.stringify(now, null, 2)}\n`);
      fs.renameSync(temp, planPath);
    }
  } catch (err) {
    console.log(`The plan keeps its old voice lengths: ${err.message}`);
  }
  const bytes = fs.statSync(path.join(dir, "video.mp4")).size;
  // `seconds` is how long the video runs; `tookSeconds` is how long making it took.
  status("ready", { seconds: Math.round(built.total), tookSeconds: Math.round((Date.now() - started) / 1000), bytes, file: "video.mp4" });
  console.log(`Rendered studio/data/videos/${id}/video.mp4 (${Math.round(bytes / 1024)} KB)`);
  for (const n of built.long) console.log(`Scene ${n}: the voice says more than its line.`);
}

main().catch((err) => {
  status("failed", { why: "The video could not be made." });
  console.error(err);
  process.exit(1);
});
