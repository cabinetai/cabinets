#!/usr/bin/env node
/**
 * Copies the person's changes from the Studio into a video's plan, the same exact way every
 * time, with no model in between. Run from the cabinet root:
 *   node studio/apply.mjs <video-id>
 * Reads studio/.data/shared.json (key `videos`), writes
 * studio/data/videos/<id>/video.json, and takes the applied entry out of the store.
 * A scene whose words or picture changed loses its old voice or picture link, so the next
 * step knows to make a new one. render.mjs removes the old file once the new video is made.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const SHARED = path.resolve("studio/.data/shared.json");

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function uid() {
  return crypto.randomBytes(3).toString("hex");
}

/** Applies the stored changes for one video. Returns what changed, in a few counts. */
function applyEdits(id) {
  const dir = path.resolve("studio/data/videos", id);
  const planPath = path.join(dir, "video.json");
  const plan = readJson(planPath);
  if (!plan) throw new Error(`No plan at ${planPath}`);
  const shared = readJson(SHARED) || {};
  const edit = shared.videos && typeof shared.videos === "object" ? shared.videos[id] : null;
  const result = { scenes: 0, voice: 0, picture: 0, look: false, post: false };

  // Every scene has a name for its files that never changes or repeats, whatever its place.
  const before = Array.isArray(plan.scenes) ? plan.scenes : [];
  before.forEach((s) => {
    if (!s.uid) s.uid = uid();
  });

  if (edit && Array.isArray(edit.scenes)) {
    plan.scenes = edit.scenes.map((e) => {
      const base = Number.isInteger(e.from) && before[e.from] ? before[e.from] : null;
      const next = base ? { ...base } : { uid: uid() };
      next.kind = ["hook", "point", "proof", "cta"].includes(e.kind) ? e.kind : next.kind || "point";
      next.onScreen = String(e.onScreen ?? next.onScreen ?? "").trim();
      next.said = String(e.said ?? next.said ?? "").trim();
      next.picture = String(e.picture ?? next.picture ?? "").trim();
      if (Number.isFinite(Number(e.seconds))) next.seconds = Math.max(1.5, Math.min(14, Number(e.seconds)));
      if (Number.isInteger(e.key) && e.key >= 0) next.key = e.key;
      else delete next.key;
      if (e.pos && Number.isFinite(e.pos.x) && Number.isFinite(e.pos.y)) next.pos = { x: e.pos.x, y: e.pos.y };
      else delete next.pos;
      if (!base || next.said !== (base.said || "")) {
        if (next.audio) result.voice += 1;
        delete next.audio;
        delete next.audioSeconds;
        next.uid = uid();
      }
      if (!base || next.picture !== (base.picture || "")) {
        if (next.image) result.picture += 1;
        delete next.image;
        delete next.clip;
        delete next.clipSeconds;
      }
      return next;
    });
    result.scenes = plan.scenes.length;
  }

  if (edit && edit.look && typeof edit.look === "object") {
    plan.look = { ...(plan.look || {}), ...edit.look };
    result.look = true;
  }
  if (edit && typeof edit.speak === "boolean") plan.speak = edit.speak;
  if (edit && ["still", "hook", "all"].includes(edit.motion)) plan.motion = edit.motion;
  if (edit && Array.isArray(edit.palette) && edit.palette.length >= 2 && edit.palette.every((c) => /^#[0-9a-f]{6}$/i.test(c))) plan.palette = edit.palette;
  if (edit && typeof edit.voice === "string" && edit.voice) plan.voice = edit.voice;
  if (edit && edit.post && typeof edit.post === "object") {
    plan.post = plan.post || {};
    for (const [platform, fields] of Object.entries(edit.post)) {
      plan.post[platform] = { ...(plan.post[platform] || {}) };
      for (const key of ["title", "caption"]) {
        if (typeof fields[key] === "string") plan.post[platform][key] = fields[key];
      }
      result.post = true;
    }
  }

  fs.writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`);
  if (edit) {
    delete shared.videos[id];
    if (!Object.keys(shared.videos).length) delete shared.videos;
    fs.writeFileSync(SHARED, `${JSON.stringify(shared, null, 2)}\n`);
  }
  return result;
}

if (process.argv[1] && path.basename(process.argv[1]) === "apply.mjs") {
  const id = process.argv[2];
  if (!id || !/^[a-z0-9-]+$/.test(id)) {
    console.error("Usage: node studio/apply.mjs <video-id>");
    process.exit(2);
  }
  try {
    const r = applyEdits(id);
    console.log(`Applied: ${r.scenes} scenes, ${r.voice} voices and ${r.picture} pictures to remake.`);
  } catch (err) {
    console.error(String(err.message || err));
    process.exit(1);
  }
}
