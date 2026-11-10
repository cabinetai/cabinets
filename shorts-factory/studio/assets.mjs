#!/usr/bin/env node
/**
 * Lists the business's own pictures and how past videos used them, the same exact way every
 * time, with no model in between. Run from the cabinet root:
 *   node studio/assets.mjs [<video-id>]
 * Writes studio/data/assets.json. It looks in this folder and in the folder Shorts Factory
 * was added to (`..`), unless that folder is a workspace. It never enters another cabinet,
 * a hidden folder or `studio/`. What a picture shows (`kind`, `shows`) is written by the
 * Producer, once per picture, and kept here for as long as the file does not change.
 * `<video-id>` is the video being written now: its own uses are not counted.
 */

import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("studio/data/assets.json");
const VIDEOS = path.resolve("studio/data/videos");
const TYPES = [".jpg", ".jpeg", ".png", ".webp", ".svg"];
/** Smaller files are icons and bullets, never a picture worth showing. A logo drawn as SVG is small. */
const MIN_BYTES = 5 * 1024;
const MIN_SVG_BYTES = 500;
/** A bigger picture is too heavy to send to the image tool with two others. */
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_FILES = 80;
const MAX_DEPTH = 4;

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

/** Every picture under `root`, as paths from the cabinet root. */
function walk(root, depth, found) {
  let entries = [];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (found.length >= MAX_FILES) return;
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (depth >= MAX_DEPTH) continue;
      // This cabinet's own app, and any other cabinet, are not the business's pictures.
      if (full === path.resolve("studio") || full === path.resolve(".")) continue;
      if (fs.existsSync(path.join(full, ".cabinet"))) continue;
      walk(full, depth + 1, found);
    } else if (entry.isFile() && TYPES.includes(path.extname(entry.name).toLowerCase())) {
      // The cover is this template's own picture, not the business's.
      if (root === path.resolve(".") && /^cover\./i.test(entry.name)) continue;
      const bytes = fs.statSync(full).size;
      const least = path.extname(entry.name).toLowerCase() === ".svg" ? MIN_SVG_BYTES : MIN_BYTES;
      if (bytes < least || bytes > MAX_BYTES) continue;
      found.push({ path: path.relative(path.resolve("."), full).split(path.sep).join("/"), bytes });
    }
  }
}

/** How each picture was used: in how many videos, and how in the newest one. */
function uses(skipId) {
  const videos = [];
  let ids = [];
  try {
    ids = fs.readdirSync(VIDEOS);
  } catch {}
  for (const id of ids) {
    if (id === skipId) continue;
    const plan = readJson(path.join(VIDEOS, id, "video.json"));
    if (plan && Array.isArray(plan.scenes)) videos.push(plan);
  }
  videos.sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
  const count = new Map();
  const last = new Map();
  videos.forEach((plan, n) => {
    const seen = new Map();
    if (plan.castFrom) seen.set(plan.castFrom, "refs");
    for (const scene of plan.scenes) {
      if (scene.photo) seen.set(scene.photo, "photo");
      if (scene.pop) seen.set(scene.pop, "pop");
      for (const ref of Array.isArray(scene.refs) ? scene.refs : []) if (!seen.has(ref)) seen.set(ref, "refs");
    }
    for (const [file, how] of seen) {
      count.set(file, (count.get(file) || 0) + 1);
      if (n === videos.length - 1) last.set(file, how);
    }
  });
  return { count, last };
}

const skipId = /^[a-z0-9-]+$/.test(process.argv[2] || "") ? process.argv[2] : "";
const found = [];
walk(path.resolve("."), 0, found);
const parent = fs.existsSync(path.resolve("../.cabinet")) ? fs.readFileSync(path.resolve("../.cabinet"), "utf8") : "";
if (!/^kind:\s*workspace\s*$/m.test(parent)) walk(path.resolve(".."), 0, found);

const known = new Map(((readJson(OUT) || {}).assets || []).map((a) => [a.path, a]));
const { count, last } = uses(skipId);
const assets = found.map((file) => {
  const old = known.get(file.path);
  const same = old && old.bytes === file.bytes;
  const entry = { path: file.path, bytes: file.bytes, kind: same ? old.kind || null : null, shows: same ? old.shows || null : null, uses: count.get(file.path) || 0 };
  if (last.has(file.path)) entry.last = last.get(file.path);
  return entry;
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const temp = `${OUT}.${process.pid}.tmp`;
fs.writeFileSync(temp, `${JSON.stringify({ schema: "shorts/assets@1", assets }, null, 2)}\n`);
fs.renameSync(temp, OUT);

const fresh = assets.filter((a) => !a.kind);
console.log(`${assets.length} pictures in studio/data/assets.json, ${fresh.length} new.`);
for (const a of fresh) console.log(`new: ${a.path} (${Math.round(a.bytes / 1024)} KB)`);
