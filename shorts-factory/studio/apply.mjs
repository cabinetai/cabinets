#!/usr/bin/env node
/**
 * Copies the person's changes from the Studio into a video's plan, the same exact way every
 * time, with no model in between. Run from the cabinet root:
 *   node studio/apply.mjs <video-id>
 * Reads studio/.data/shared.json (key `videos`), writes
 * studio/data/videos/<id>/video.json, and takes the applied entry out of the store.
 * A scene whose words or picture changed loses its old voice or picture link, so the next
 * step knows to make a new one. The business's own pictures a scene names (`photo`, `pop`,
 * `refs`) are copied into the video's folder. render.mjs removes the old file once the new video is made.
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

/** Writes JSON through a temp file and a rename, so a stopped write never leaves half a file. */
function writeJson(file, value) {
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temp, file);
}

const PHOTO_TYPES = [".jpg", ".jpeg", ".png", ".webp"];

/**
 * One of the business's own pictures, as a full path: in this cabinet or the folder it was
 * added to, never the Studio's own files, and only a picture type. Otherwise null. Links are
 * followed first, so a link in the cabinet cannot bring in a file from outside it.
 */
function own(file, types) {
  let from;
  try {
    from = fs.realpathSync(path.resolve(String(file)));
  } catch {
    return null;
  }
  const home = fs.realpathSync(path.resolve(".."));
  const studio = fs.realpathSync(path.resolve("studio"));
  const inside = from.startsWith(home + path.sep) && !from.startsWith(studio + path.sep);
  return inside && types.includes(path.extname(from).toLowerCase()) ? from : null;
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
  const result = { scenes: 0, voice: 0, picture: 0, photos: 0, pops: 0, look: false, post: false };

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
      if (e.pop === false) {
        delete next.pop;
        delete next.popImage;
      }
      if (!base || next.said !== (base.said || "")) {
        if (next.audio) result.voice += 1;
        delete next.audio;
        delete next.audioSeconds;
        next.uid = uid();
      }
      if (!base || next.picture !== (base.picture || "")) {
        if (next.image) result.picture += 1;
        delete next.image;
        delete next.photo;
        delete next.refs;
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

  // The photo of the person the video follows goes with the made pictures that show them,
  // so the person stays the same from scene to scene.
  delete plan.castImage;
  const look = plan.castFrom ? own(plan.castFrom, PHOTO_TYPES) : null;
  if (look && (plan.scenes || []).some((s) => !s.image && !s.photo)) {
    plan.castImage = `ref-${crypto.createHash("sha1").update(String(plan.castFrom)).digest("hex").slice(0, 8)}${path.extname(look).toLowerCase()}`;
    fs.copyFileSync(look, path.join(dir, plan.castImage));
  } else if (!look) delete plan.castFrom;

  // The business's own pictures are used as copies inside the video's folder, at no cost.
  for (const s of plan.scenes || []) {
    // A real photo is the scene's picture.
    if (s.photo && !s.image) {
      const from = own(s.photo, PHOTO_TYPES);
      if (from) {
        s.image = `scene-${s.uid}${path.extname(from).toLowerCase()}`;
        fs.copyFileSync(from, path.join(dir, s.image));
        result.photos += 1;
      } else delete s.photo;
    }
    // A pop-out shows over the scene's picture.
    if (s.pop && !(s.popImage && fs.existsSync(path.join(dir, s.popImage)))) {
      const from = own(s.pop, [...PHOTO_TYPES, ".svg"]);
      if (from) {
        s.popImage = `pop-${s.uid}${path.extname(from).toLowerCase()}`;
        fs.copyFileSync(from, path.join(dir, s.popImage));
        result.pops += 1;
      } else {
        delete s.pop;
        delete s.popImage;
      }
    }
    // Pictures the made picture keeps true go to the image tool, which reads only this cabinet.
    delete s.refImages;
    if (Array.isArray(s.refs) && !s.image) {
      s.refImages = [];
      for (const ref of s.refs.slice(0, 2)) {
        const from = own(ref, PHOTO_TYPES);
        if (!from) continue;
        const name = `ref-${crypto.createHash("sha1").update(String(ref)).digest("hex").slice(0, 8)}${path.extname(from).toLowerCase()}`;
        fs.copyFileSync(from, path.join(dir, name));
        s.refImages.push(name);
      }
      if (!s.refImages.length) delete s.refImages;
    }
  }

  writeJson(planPath, plan);
  if (edit) {
    delete shared.videos[id];
    if (!Object.keys(shared.videos).length) delete shared.videos;
    writeJson(SHARED, shared);
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
    console.log(`Applied: ${r.scenes} scenes, ${r.voice} voices and ${r.picture} pictures to remake, ${r.photos} real photos and ${r.pops} pop-outs used.`);
  } catch (err) {
    console.error(String(err.message || err));
    process.exit(1);
  }
}
