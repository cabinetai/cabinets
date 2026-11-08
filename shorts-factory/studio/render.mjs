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

/** Where a scene's voiceover speaks, read from its WAV file, so captions land on the voice. */
function spansOf(file) {
  try {
    const b = fs.readFileSync(file);
    let rate = 24000;
    for (let at = 12; at + 8 <= b.length; ) {
      const id = b.toString("ascii", at, at + 4);
      const size = b.readUInt32LE(at + 4);
      if (id === "fmt ") rate = b.readUInt32LE(at + 12);
      if (id === "data") {
        const data = b.subarray(at + 8, at + 8 + Math.min(size, b.length - at - 8));
        return Compose.speechSpans(new Int16Array(data.buffer, data.byteOffset, Math.floor(data.length / 2)), rate);
      }
      at += 8 + size + (size % 2);
    }
  } catch {}
  return [];
}

function build(plan) {
  const look = Compose.resolveLook(plan.look);
  const palette = Array.isArray(plan.palette) && plan.palette.length >= 2 ? plan.palette : ["#7a4a2e", "#1c120d"];
  let t = 0;
  const scenes = plan.scenes.map((scene, i) => {
    // A voice made earlier stays on disk while the voice is off, so turning it back on is free.
    const audio = plan.speak !== false && scene.audio && fs.existsSync(path.join(dir, scene.audio)) ? scene.audio : null;
    const seconds = Compose.sceneSeconds(scene, !!audio);
    const start = t;
    t += seconds;
    // The captions are the spoken line itself, each word shown as it is said.
    const words = Compose.syncedWords(Compose.lineOf(scene, !!audio), start, seconds, audio ? spansOf(path.join(dir, audio)) : null);
    const key = Number.isInteger(scene.key) && scene.key >= 0 && scene.key < words.length ? scene.key : Compose.keyIndex(words);
    return { ...scene, i, start, seconds, words, key, audio, spot: Compose.captionSpot(scene, look) };
  });
  const total = Math.round(t * 100) / 100;

  // Moving scenes play their clip, muted under the voice; the rest show their picture.
  const motion = plan.motion === "hook" || plan.motion === "all" ? plan.motion : "still";
  const clipOf = (s) => (motion === "all" || (motion === "hook" && s.i === 0)) && s.clip && fs.existsSync(path.join(dir, s.clip)) ? s.clip : null;

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
      return `<section class="clip scene" id="scene-${s.i}" data-start="${s.start}" data-duration="${s.seconds}" data-track-index="0">
  ${bg}
  <div class="shade"></div>
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
        if (look.motion) lines.push(`tl.fromTo("#photo-${s.i}", { scale: 1.04 }, { scale: 1.14, duration: ${s.seconds}, ease: "none" }, ${s.start});`);
      } else if (look.motion) {
        lines.push(`tl.fromTo("#orb-${s.i}", { x: -60, y: 40, scale: 0.9 }, { x: 80, y: -60, scale: 1.15, duration: ${s.seconds}, ease: "sine.inOut" }, ${s.start});`);
        lines.push(`tl.fromTo("#orb2-${s.i}", { x: 70, y: -30, scale: 1.1 }, { x: -90, y: 70, scale: 0.92, duration: ${s.seconds}, ease: "sine.inOut" }, ${s.start});`);
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
    .map((s) => `<audio id="voice-${s.i}" class="clip" src="../${esc(s.audio)}" data-start="${s.start}" data-duration="${s.seconds}" data-track-index="2"></audio>`)
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
  return { html, total };
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
  const work = path.join(dir, ".render");
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
  const used = new Set(plan.scenes.flatMap((s) => [s.audio, s.image, s.clip]).filter(Boolean));
  for (const f of fs.readdirSync(dir)) {
    if (/^scene-/.test(f) && !used.has(f)) fs.rmSync(path.join(dir, f), { force: true });
  }
  const bytes = fs.statSync(path.join(dir, "video.mp4")).size;
  // `seconds` is how long the video runs; `tookSeconds` is how long making it took.
  status("ready", { seconds: Math.round(built.total), tookSeconds: Math.round((Date.now() - started) / 1000), bytes, file: "video.mp4" });
  console.log(`Rendered studio/data/videos/${id}/video.mp4 (${Math.round(bytes / 1024)} KB)`);
}

main().catch((err) => {
  status("failed", { why: "The video could not be made." });
  console.error(err);
  process.exit(1);
});
