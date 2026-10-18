#!/usr/bin/env node
// The first read's lines, gift and offers, written only through here so the page never sees a
// line that is half written, empty or broken, and every number it shows is counted from the
// notes themselves. Run it from the cabinet root:
//   node your-library/first-read.mjs start            new data/reading.json and data/.work/
//   node your-library/first-read.mjs push '<line>'    add one line (single quotes: "$" stays "$"). A line
//                                                     with an apostrophe: write it to data/.work/line.txt
//                                                     and push @line.txt
//   node your-library/first-read.mjs gift @<file>     the one thing the person can do now, shown while
//                                                     you read: {"kind":"old","from"}, {"kind":"folders",
//                                                     "from"}, {"kind":"meetings","files":[...]} or
//                                                     {"kind":"calm"}. "from" is the Apple Notes copy
//                                                     folder; the helper counts the notes in it itself.
//                                                     "files" are the index.md of 2 to 5 meeting notes;
//                                                     the helper adds their titles.
//   node your-library/first-read.mjs offer @<file>    one more thing they can do now, under the gift, at
//                                                     most 2: the same shapes as the gift, never calm,
//                                                     never the gift's kind
//   node your-library/first-read.mjs latest @<file>   write data/latest.json and data/status.json from
//                                                     the file your script wrote into data/.work/
//                                                     (schema, example and generatedAt set here)
//   node your-library/first-read.mjs done             mark the reading done, delete data/.work/
// A <file> is relative to data/.work/. Nothing here reads Apple Notes itself or changes a note:
// it reads only the copy Cabinet made.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA = "apple-notes-library";
const LATEST_SCHEMA = "apple-notes-library/your-library@1";
const MAX_OFFERS = 2;
const OLD_DAYS = 365;
const OLD_MIN = 10;

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const readingFile = path.join(dataDir, "reading.json");

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
  if (!file.startsWith(workDir + path.sep)) fail(`${name} is not inside data/.work/`);
  if (!fs.existsSync(file)) fail(`${name} is not in data/.work/ (save it there first)`);
  return file;
}
/** "@line.txt" is the text of that file in data/.work/, for words no shell can quote; anything else is the words themselves. */
function workText(arg) {
  const said = String(arg || "").trim();
  return /^@[\w.-]+$/.test(said) ? fs.readFileSync(workFile(said.slice(1)), "utf8") : said;
}
/** "@gift.json", or "@your-library/data/.work/gift.json", read as JSON from data/.work/. */
function workJson(arg, what) {
  if (!arg.startsWith("@")) fail(`give ${what} as @<file>: the JSON your script wrote into data/.work/`);
  try { return readJson(workFile(arg.slice(1).replace(/^.*data[\\/]\.work[\\/]/, ""))); } catch { return fail(`${arg.slice(1)} is not JSON in data/.work/`); }
}

/** data/reading.json as start wrote it, or a plain stop when it is missing or broken. */
function readReading() {
  if (!fs.existsSync(readingFile)) fail("run start first");
  try { return readJson(readingFile); } catch { return fail("data/reading.json is broken (not JSON): carry on without the helper"); }
}
/** One change to a reading still going (`doneMsg` when it is done): `change` makes it and says what it did. */
function editReading(doneMsg, change) {
  lockReading();
  const r = readReading();
  if (r.done) fail(doneMsg);
  const said = change(r);
  writeJson(readingFile, r);
  console.log(said);
}

/**
 * One write to reading.json at a time: two at once would each write their own copy and lose one.
 * A lock older than 5 seconds was left by a call that died (a write takes a moment), so it goes
 * well before the 8 seconds a call waits.
 */
function lockReading() {
  const lock = path.join(dataDir, ".reading.lock");
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

// ── The notes: a gift counts only what the copy really holds ──
function frontOf(raw) { const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw); return m ? m[1] : ""; }
function unquote(s) { return s.trim().replace(/^(["'])(.*)\1$/, "$2"); }
/** A note's title, folder and last edit, or null when the page is not a note Cabinet copied. */
function noteAt(file, root) {
  let raw;
  try { raw = fs.readFileSync(file, "utf8"); } catch { return null; }
  const front = frontOf(raw);
  const block = /^appleNotes:[ \t]*\r?\n((?:[ \t]+.*(?:\r?\n|$))+)/m.exec(front);
  if (!block || !/^\s+id:/m.test(block[1])) return null;
  const t = /^title:\s*(.+)$/m.exec(front);
  const m = /^\s+modified:\s*(.+)$/m.exec(block[1]) || /^created:\s*(.+)$/m.exec(front);
  const edited = m ? new Date(unquote(m[1])) : null;
  const dir = path.dirname(file);
  return {
    title: t ? unquote(t[1]) : path.basename(dir),
    folder: path.relative(root, path.dirname(dir)).split(path.sep).filter(Boolean).join(" / "),
    edited: edited && !isNaN(edited.getTime()) ? edited : null
  };
}
/** Every note in the copy at `from` (the folder named "Apple Notes"). */
function notesIn(from) {
  if (typeof from !== "string" || !from.trim()) fail("give \"from\": the path of the Apple Notes copy folder, from the cabinet root");
  const root = path.resolve(from.trim());
  if (path.basename(root) !== "Apple Notes" || !fs.existsSync(root) || !fs.statSync(root).isDirectory()) fail(`${from} is not the Apple Notes copy folder`);
  const notes = [];
  (function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith(".")) continue;
      const sub = path.join(dir, e.name);
      const idx = path.join(sub, "index.md");
      if (fs.existsSync(idx)) { const n = noteAt(idx, root); if (n) notes.push(n); }
      walk(sub);
    }
  })(root);
  if (!notes.length) fail(`${from} holds no notes`);
  return notes;
}
function noteOf(file) {
  if (typeof file !== "string" || !file.trim()) fail("each meeting note needs its index.md in the Apple Notes copy");
  const abs = path.resolve(file.trim());
  const parts = abs.split(path.sep);
  const at = parts.lastIndexOf("Apple Notes");
  if (at < 0) fail(`${file} is not in the Apple Notes copy`);
  if (!/\.md$/i.test(abs) || !fs.existsSync(abs)) fail(`${file} is not a note (give the path of its index.md)`);
  const n = noteAt(abs, parts.slice(0, at + 1).join(path.sep));
  return n || fail(`${file} is not a note Cabinet copied from Apple Notes`);
}
function kindOf(g, what) {
  if (!g || typeof g !== "object" || Array.isArray(g)) fail(`${what} must be an object`);
  const kind = String(g.kind || "");
  if (kind === "calm") return { kind };
  if (kind === "old") {
    const notes = notesIn(g.from);
    const cut = Date.now() - OLD_DAYS * 86400000;
    const old = notes.filter((n) => n.edited && n.edited.getTime() < cut).length;
    if (old < OLD_MIN) fail(`refused, only ${old} notes are older than a year: give another kind`);
    return { kind, count: old };
  }
  if (kind === "folders") {
    const by = new Map();
    for (const n of notesIn(g.from)) if (n.folder) by.set(n.folder, (by.get(n.folder) || 0) + 1);
    const top = [...by].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, notes]) => ({ name: name.split(" / ").pop(), notes }));
    if (top.length < 2) fail("refused, the notes sit in fewer than 2 folders: give another kind");
    return { kind, folders: top };
  }
  if (kind === "meetings") {
    if (!Array.isArray(g.files) || g.files.length < 2) fail("a meetings gift needs files: 2 to 5 meeting notes");
    const titles = [...new Set(g.files.slice(0, 5).map((f) => noteOf(f).title))];
    if (titles.length < 2) fail("a meetings gift needs 2 different meeting notes");
    return { kind, notes: titles };
  }
  return fail(`the kind is old, folders, meetings or calm, not "${kind}"`);
}

const count = (v) => typeof v === "number" && Number.isInteger(v) && v >= 0;

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "start") {
  if (fs.existsSync(path.join(dataDir, "latest.json"))) fail("latest.json is there: this is not the first read");
  fs.mkdirSync(workDir, { recursive: true });
  writeJson(readingFile, { schema: `${SCHEMA}/reading@1`, startedAt: iso(new Date()), done: false, lines: [] });
  console.log("reading started; save files in " + path.relative(process.cwd(), workDir));
} else if (cmd === "push") {
  editReading("the reading is done: no more lines", (r) => {
    const line = workText(args.join(" ")).replace(/\s+/g, " ").trim();
    // An empty line, or one that is only marks ("**  **"), says nothing.
    if (!line || !/[\p{L}\p{N}]/u.test(line)) fail("refused, the line is empty");
    if (/\bundefined\b|\bNaN\b|\bnull\b|\[object|\{|\}|\$\{/.test(line)) fail(`refused, the line is broken: ${line}`);
    if (line.length > 200) fail("refused, the line is longer than 200 characters");
    if (/[—–]/.test(line)) fail("refused, a long dash: use a comma or a period");
    // "**0 notes**" is not a finding: a line whose numbers are all 0 says nothing.
    const bold = (line.match(/\*\*[^*]+\*\*/g) || []).join(" ");
    const nums = ((bold || line).replace(/\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}/g, "").match(/\d[\d,.]*/g) || []);
    if (nums.length && nums.every((x) => Number(x.replace(/,/g, "")) === 0)) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
    if (r.lines.includes(line)) fail("that line is already there");
    r.lines.push(line);
    return `line ${r.lines.length}: ${line}`;
  });
} else if (cmd === "gift") {
  const gift = kindOf(workJson(args.join(" ").trim(), "the gift"), "the gift");
  editReading("the reading is done: the gift comes while you read", (r) => {
    if (r.gift) fail("there is a gift already: one is enough");
    r.gift = { ...gift, at: iso(new Date()) };
    return "gift: " + JSON.stringify(r.gift);
  });
} else if (cmd === "offer") {
  const offer = kindOf(workJson(args.join(" ").trim(), "the offer"), "the offer");
  if (offer.kind === "calm") fail("calm is only a gift: an offer is old, folders or meetings");
  editReading("the reading is done: offers come while you read", (r) => {
    if (!r.gift) fail("give the gift first: offers come under it");
    const offers = Array.isArray(r.offers) ? r.offers : [];
    if (offers.length >= MAX_OFFERS) fail(`there are ${MAX_OFFERS} offers already: that is enough`);
    if (r.gift.kind === offer.kind || offers.some((x) => x.kind === offer.kind)) fail("that one is there already");
    offers.push({ ...offer, at: iso(new Date()) });
    r.offers = offers;
    return "offer: " + JSON.stringify(offer);
  });
} else if (cmd === "latest") {
  // latest.json in the page's own shape: the helper sets what it knows for sure.
  const l = workJson(args.join(" ").trim(), "latest.json");
  if (!l || typeof l !== "object" || Array.isArray(l)) fail("latest.json must be an object");
  if (!Array.isArray(l.topics)) fail("latest.json needs topics (an empty list when there are none)");
  const t = l.totals;
  if (!t || typeof t !== "object" || !count(t.notes) || !count(t.topics) || !count(t.sorted)) fail("latest.json needs totals: { notes, topics, sorted }, each a whole number");
  l.topics.forEach((x, i) => {
    if (!x || typeof x !== "object" || typeof x.title !== "string" || !x.title.trim()) fail(`topics[${i}] needs a title`);
    if (x.page != null && (typeof x.page !== "string" || !fs.existsSync(path.resolve(x.page)))) fail(`topics[${i}] "${x.title}": page ${x.page} is not there, write the topic page first`);
  });
  if (t.topics !== l.topics.length) fail("totals.topics is not the number of topics: count them again");
  if (t.sorted > t.notes) fail("totals sort more notes than there are: count them again");
  const tidy = l.tidy && typeof l.tidy === "object" ? l.tidy : {};
  l.tidy = { same: Array.isArray(tidy.same) ? tidy.same : [], empty: Array.isArray(tidy.empty) ? tidy.empty : [] };
  const n = new Date();
  l.schema = LATEST_SCHEMA;
  l.example = false;
  l.generatedAt = iso(n);
  writeJson(path.join(dataDir, "latest.json"), l);
  writeJson(path.join(dataDir, "status.json"), { at: iso(n), ok: true });
  console.log("latest.json written, and status.json");
} else if (cmd === "done") {
  lockReading();
  const r = readReading();
  r.done = true;
  writeJson(readingFile, r);
  try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("data/.work/ is busy: delete it in your next call"); }
  console.log("reading done");
} else {
  fail("use start, push, gift, offer, latest or done");
}
