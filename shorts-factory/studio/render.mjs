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
const WORDS_PER_SECOND = 2.6;

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

/** The words of a caption, and the moment each one shows, spread over the scene. */
function timedWords(text, start, seconds) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const weights = words.map((w) => 1 + w.replace(/\W/g, "").length / 6);
  const total = weights.reduce((a, b) => a + b, 0);
  const span = Math.min(seconds * 0.82, words.length / WORDS_PER_SECOND + 0.4);
  let t = start + 0.15;
  return words.map((word, i) => {
    const at = t;
    t += (weights[i] / total) * span;
    return { word, at };
  });
}

/** Captions show a few words at a time, the way short videos do: a page ends at punctuation or after three words. */
function pages(words) {
  const out = [];
  let page = [];
  words.forEach((w, j) => {
    page.push(j);
    const short = page.length === 3 && words.slice(page[0], j + 1).every((x) => x.word.length <= 3);
    if ((page.length >= 3 && !short) || page.length >= 4 || /[.,!?;:]$/.test(w.word)) {
      out.push(page);
      page = [];
    }
  });
  if (page.length) out.push(page);
  return out;
}

/** The word that carries the caption: one with a number, else the longest. */
function keyIndex(words) {
  const n = words.findIndex((w) => /\d/.test(w.word));
  if (n >= 0) return n;
  let best = 0;
  words.forEach((w, i) => {
    if (w.word.replace(/\W/g, "").length > words[best].word.replace(/\W/g, "").length) best = i;
  });
  return best;
}

function build(plan) {
  const palette = Array.isArray(plan.palette) && plan.palette.length >= 2 ? plan.palette : ["#7a4a2e", "#1c120d"];
  const accent = /^#[0-9a-f]{6}$/i.test(plan.accent || "") ? plan.accent : "#e0336f";
  let t = 0;
  const scenes = plan.scenes.map((scene, i) => {
    const audio = scene.audio && fs.existsSync(path.join(dir, scene.audio)) ? scene.audio : null;
    // A scene with its own voice lasts as long as the line, with a breath after it.
    const voiced = audio ? Number(scene.audioSeconds) || 0 : 0;
    const seconds = Math.max(1.5, Math.min(14, voiced ? voiced + 0.35 : Number(scene.seconds) || 3.5));
    const start = t;
    t += seconds;
    const words = timedWords(scene.onScreen, start, voiced ? Math.max(1.2, voiced) / 0.82 : seconds);
    return { ...scene, i, start, seconds, words, key: keyIndex(words), audio };
  });
  const total = Math.round(t * 100) / 100;

  const sceneHtml = scenes
    .map((s) => {
      const image = s.image && fs.existsSync(path.join(dir, s.image)) ? s.image : null;
      const bg = image
        ? `<img class="photo" id="photo-${s.i}" src="../${esc(image)}" alt="" />`
        : `<div class="field" style="background: radial-gradient(120% 75% at ${30 + ((s.i * 23) % 40)}% ${18 + ((s.i * 17) % 30)}%, ${palette[s.i % palette.length]}, ${palette[(s.i + 1) % palette.length]} 72%, #0b0807);"></div><div class="orb" id="orb-${s.i}"></div>`;
      const caption = pages(s.words)
        .map((page, k) => `<p class="cap${s.i === 0 ? " hook" : ""}" id="p-${s.i}-${k}">` + page
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
      if (s.image && fs.existsSync(path.join(dir, s.image))) {
        lines.push(`tl.fromTo("#photo-${s.i}", { scale: 1.04 }, { scale: 1.14, duration: ${s.seconds}, ease: "none" }, ${s.start});`);
      } else {
        lines.push(`tl.fromTo("#orb-${s.i}", { x: -60, y: 40, scale: 0.9 }, { x: 80, y: -60, scale: 1.15, duration: ${s.seconds}, ease: "sine.inOut" }, ${s.start});`);
      }
      const pg = pages(s.words);
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

  return `<!doctype html>
<html lang="en" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@800;900&display=block" rel="stylesheet" />
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
      .shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.35)); }
      .cap { position: absolute; left: 90px; right: 90px; top: 50%; transform: translateY(-50%);
        text-align: center; color: #fff; font-weight: 900; font-size: 92px; line-height: 1.1; letter-spacing: -0.03em;
        text-shadow: 0 6px 28px rgba(0,0,0,0.45); text-wrap: balance; font-size: 100px; }
      .cap.hook { font-size: 120px; }
      .grain { position: absolute; inset: -50%; opacity: 0.07; background-image: radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1.4px); background-size: 7px 7px; }
      .cap { opacity: 0; }
      .w { display: inline-block; padding: 0 0.1em; border-radius: 0.16em; }
      .w.on { background: ${accent}; }
      .w.key:not(.on) { color: #ffe6ef; }
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
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  if (!Array.isArray(plan.scenes) || !plan.scenes.length) {
    status("failed", { why: "The video has no scenes yet." });
    process.exit(2);
  }
  const work = path.join(dir, ".render");
  fs.mkdirSync(work, { recursive: true });
  fs.writeFileSync(path.join(work, "index.html"), build(plan));
  fs.writeFileSync(path.join(work, "meta.json"), JSON.stringify({ id: `shorts-${id}`, name: plan.title || id }, null, 2));
  fs.writeFileSync(path.join(work, "hyperframes.json"), JSON.stringify({ paths: { assets: "assets" }, media: { autoProxy: false } }, null, 2));

  status("rendering");
  const started = Date.now();
  const out = path.join(dir, "video.next.mp4");
  const result = await run("npx", ["-y", HYPERFRAMES, "render", "-o", out], work);
  if (result.code !== 0 || !fs.existsSync(out)) {
    fs.writeFileSync(path.join(work, "render.log"), result.out);
    const why = /ffmpeg/i.test(result.out) ? "FFmpeg is missing on this computer." : /chrome|browser/i.test(result.out) ? "The browser used to draw the video did not start." : "The video could not be made.";
    status("failed", { why });
    console.error(result.out.slice(-2000));
    process.exit(1);
  }
  fs.renameSync(out, path.join(dir, "video.mp4"));
  const bytes = fs.statSync(path.join(dir, "video.mp4")).size;
  status("ready", { seconds: Math.round((Date.now() - started) / 1000), bytes, file: "video.mp4" });
  console.log(`Rendered studio/data/videos/${id}/video.mp4 (${Math.round(bytes / 1024)} KB)`);
}

main().catch((err) => {
  status("failed", { why: "The video could not be made." });
  console.error(err);
  process.exit(1);
});
