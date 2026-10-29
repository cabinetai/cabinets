#!/usr/bin/env node
// The first save's lines and gift, written only through here so the page can show them as they
// come. Only on the first save (no saved video in data.json yet). Run it from anywhere:
//   node <app>/first-read.mjs start                 new reading.json and .work/ next to the page
//   node <app>/first-read.mjs push '<line>'         add one line (single quotes: "$" stays "$", in bash
//                                                   and PowerShell alike), as the step it tells starts,
//                                                   at most 14. A line with an apostrophe: write it to
//                                                   .work/line.txt and push @line.txt
//   node <app>/first-read.mjs gift @<file>          the one thing for the person, shown while you save:
//                                                   {"kind":"summary","video":"<title>"}, the title as
//                                                   the line that found it has it in **bold**
//   node <app>/first-read.mjs offer @<file>         one more thing they can do now, under the gift, at
//                                                   most 2: {"kind":"more","video":"<title>"} or
//                                                   {"kind":"weekly"}
//   node <app>/first-read.mjs done                  mark the save told, delete .work/
// A line is one short sentence about their video, the finding or the step in **bold**:
//   "Found the video: **How Tiny Houses Are Built**, from Small Space Studio, 18 min"
// Every number in it is copied from what the save tools answered, never guessed.
// Nothing here posts anything: the page only asks the agent in the chat.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA = "video-library";
const here = path.dirname(fileURLToPath(import.meta.url));
const workDir = path.join(here, ".work");
const readingFile = path.join(here, "reading.json");
const libraryFile = path.join(here, "data.json");

// ── Time, in this machine's zone (the person's own) ──
const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, "0");
const hhmm = (d) => pad(d.getHours()) + ":" + pad(d.getMinutes());
const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
function offsetOf(d) { const o = -d.getTimezoneOffset(); return (o >= 0 ? "+" : "-") + pad(o / 60) + ":" + pad(o % 60); }
function iso(d) { return ymd(d) + "T" + hhmm(d) + ":" + pad(d.getSeconds()) + offsetOf(d); }

function fail(msg) { console.error("first-read: " + msg); process.exit(1); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
/** Written whole or not at all. The part file starts with a dot, so Cabinet's look at the folder skips it. */
function writeJson(file, value) {
  const tmp = path.join(path.dirname(file), "." + path.basename(file) + ".part");
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}
function workFile(name) {
  const file = path.resolve(workDir, name);
  if (!file.startsWith(workDir + path.sep)) fail(`${name} is not inside library/.work/`);
  if (!fs.existsSync(file)) fail(`${name} is not in library/.work/ (write it there first)`);
  return file;
}
/** "@line.txt" is the text of that file in library/.work/, for words no shell can quote; anything else is the words themselves. */
function workText(arg) {
  const said = String(arg || "").trim();
  return /^@[\w.-]+$/.test(said) ? fs.readFileSync(workFile(said.slice(1)), "utf8") : said;
}
/** "@library/.work/gift.json" means "@gift.json". */
function workJson(arg, what) {
  if (!arg.startsWith("@")) fail(`give ${what} as @<file>: the JSON you wrote into library/.work/`);
  try { return readJson(workFile(arg.slice(1).replace(/^.*\.work[\\/]/, ""))); } catch { return fail(`${arg.slice(1)} is not JSON in library/.work/`); }
}

/** reading.json as start wrote it, or a plain stop when it is missing or broken. */
function readReading() {
  if (!fs.existsSync(readingFile)) fail("run start first");
  try { return readJson(readingFile); } catch { return fail("reading.json is broken (not JSON): carry on without the helper"); }
}
/** Every write says when, so the page knows the save is still going. */
function writeReading(r) {
  r.updatedAt = iso(new Date());
  writeJson(readingFile, r);
}
/** One change to a save still being told (`doneMsg` when it is told): `change` makes it and says what it did. */
function editReading(doneMsg, change) {
  lockReading();
  const r = readReading();
  if (r.done) fail(doneMsg);
  const said = change(r);
  writeReading(r);
  console.log(said);
}

/**
 * One write to reading.json at a time: two at once would each write their own copy and lose one.
 * A lock older than 5 seconds was left by a call that died (a write takes a moment), so it goes
 * well before the 8 seconds a call waits.
 */
function lockReading() {
  const lock = path.join(here, ".reading.lock");
  const until = Date.now() + 8000;
  const nap = new Int32Array(new SharedArrayBuffer(4));
  for (;;) {
    try { fs.mkdirSync(lock); break; } catch {
      try { if (Date.now() - fs.statSync(lock).mtimeMs > 5000) { fs.rmSync(lock, { recursive: true, force: true }); continue; } } catch { continue; }
      if (Date.now() > until) fail("another push is still running: push one line at a time");
      Atomics.wait(nap, 0, 0, 100);
    }
  }
  process.on("exit", () => { try { fs.rmSync(lock, { recursive: true, force: true }); } catch { /* gone */ } });
}

/** A link, a file, a path or a tool's name: never in words the page shows. */
const RAW = /https?:\/\/|www\.|youtu\.be\/|youtube\.com\/|\bvideos\/|\.(json|md|mp4|m4a|mjs)\b|\b(youtube_\w+|video_info|save_video\w*)\b/i;

/** The library already holds a saved video of the person's own: this is not the first save. */
function savedBefore() {
  if (!fs.existsSync(libraryFile)) return false;
  try {
    const d = readJson(libraryFile);
    return d && d.example !== true && Array.isArray(d.videos) && d.videos.some((v) => v && v.status === "saved");
  } catch { return false; }
}

/** A line the page can show: one sentence about their video, never about yourself. */
function checkLine(line) {
  if (!line) fail("refused, an empty line: say what that step found, or push nothing");
  // "$4" in double quotes reaches here as "": refuse what the shell ate.
  if (/(^|[\s(*])[,.]\d/.test(line)) fail("refused, a number lost its start (a $ in double quotes?): use single quotes");
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object|\{|\}/.test(line) || RAW.test(line)) fail(`refused, the line is broken or carries a link, a file or a tool: ${line}`);
  if (line.length > 200) fail("refused, the line is longer than 200 characters");
  if (/[—–]/.test(line)) fail("refused, a long dash: use a comma or a period");
  if (!/\*\*[^*]+\*\*/.test(line)) fail("refused, mark the finding in **bold**, like 'Found the video: **How Tiny Houses Are Built**, from Small Space Studio'");
  if (/^(I|I'm|I've|I'll|Let me)\b/i.test(line.replace(/\*/g, ""))) fail("refused, a line about yourself: say what is happening to their video");
  // "**0 MB**" is not a finding: a line whose numbers are all 0 says nothing.
  const bold = (line.match(/\*\*[^*]+\*\*/g) || []).join(" ");
  const nums = (bold.replace(/\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}/g, "").match(/\d[\d,.]*/g) || []);
  if (nums.length && nums.every((x) => Number(x.replace(/,/g, "")) === 0)) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
}

// ── What the page shows beside the lines: titles come from the lines already pushed ──
/** The video's title exactly as a pushed line has it in **bold**, so the page never shows a guess. */
function titleOf(value, what, r) {
  const title = String(value || "").replace(/\s+/g, " ").trim();
  if (!title) fail(`${what} needs the video's title`);
  if (title.length > 120) fail(`${what}: the title is longer than 120 characters`);
  if (/[—–]/.test(title)) fail(`refused, a long dash in ${what}: write the title as the line has it`);
  if (!r.lines.some((l) => l.includes("**" + title + "**"))) fail(`${what}: push the line that found it first, with the title in **bold**: 'Found the video: **${title}**'`);
  return title;
}

// ── The gift: one thing the person can do now, shown while the save goes on ──
function giftOf(g, r) {
  if (!g || typeof g !== "object" || Array.isArray(g)) fail("the gift must be an object");
  const kind = String(g.kind || "");
  if (kind !== "summary") fail(`the gift kind is summary, not "${kind}"`);
  return { kind, video: titleOf(g.video, "the gift", r) };
}

// ── More things to do now, under the gift: each one an answer in the chat, nothing saved ──
const OFFER_KINDS = ["more", "weekly"];
const MAX_OFFERS = 2;
function offerOf(o, r) {
  if (!o || typeof o !== "object" || Array.isArray(o)) fail("the offer must be an object");
  const kind = String(o.kind || "");
  if (!OFFER_KINDS.includes(kind)) fail(`the offer kind is ${OFFER_KINDS.join(" or ")}, not "${kind}"`);
  return kind === "more" ? { kind, video: titleOf(o.video, "the more offer", r) } : { kind };
}

/** The page's cleanReading keeps the last 14: a 15th would push out the line that found the video. */
const MAX_LINES = 14;

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "start") {
  // Later saves are told the usual way, on the video's card: the reading is only for the first one.
  if (savedBefore()) fail("the library has a saved video already, so this is not the first save: carry on without the helper");
  fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });
  lockReading();
  writeReading({ schema: `${SCHEMA}/reading@1`, startedAt: iso(new Date()), done: false, lines: [] });
  console.log("save started; write your files in " + path.relative(process.cwd(), workDir));
} else if (cmd === "push") {
  editReading("the save is told: no more lines", (r) => {
    const line = workText(args.join(" ")).replace(/\s+/g, " ").trim();
    checkLine(line);
    if (r.lines.includes(line)) fail("that line is already there");
    if (r.lines.length >= MAX_LINES) fail(`refused, there are ${MAX_LINES} lines already: the page shows no more`);
    r.lines.push(line);
    return `line ${r.lines.length}: ${line}`;
  });
} else if (cmd === "offer") {
  const file = workJson(args.join(" ").trim(), "the offer");
  editReading("the save is told: offers come while you save", (r) => {
    const offer = offerOf(file, r);
    const offers = Array.isArray(r.offers) ? r.offers : [];
    if (offers.length >= MAX_OFFERS) fail(`there are ${MAX_OFFERS} offers already: that is enough`);
    if (offers.some((x) => x.kind === offer.kind)) fail("that offer is there already");
    offers.push({ ...offer, at: iso(new Date()) });
    r.offers = offers;
    return "offer: " + JSON.stringify(offer);
  });
} else if (cmd === "gift") {
  const file = workJson(args.join(" ").trim(), "the gift");
  editReading("the save is told: the gift comes while you save", (r) => {
    if (r.gift) fail("there is a gift already: one is enough");
    r.gift = { ...giftOf(file, r), at: iso(new Date()) };
    return "gift: " + JSON.stringify(r.gift);
  });
} else if (cmd === "done") {
  lockReading();
  const r = readReading();
  r.done = true;
  writeReading(r);
  try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("library/.work/ is busy: delete it in your next call"); }
  console.log("save told");
} else {
  fail("use start, push, gift, offer or done");
}
