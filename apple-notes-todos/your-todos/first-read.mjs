#!/usr/bin/env node
// The first read's lines and gift, written only through here so the page never sees a line
// that is half written, empty or broken, and the gift only names words a note really holds.
// Run it from the cabinet root:
//   node your-todos/first-read.mjs start              new data/reading.json and data/.work/
//   node your-todos/first-read.mjs push '<line>'      add one line (single quotes: "$" stays "$")
//   node your-todos/first-read.mjs gift @<file>       the one thing the person can do now, shown while
//                                                     you read: {"kind":"plan","items":[{"text","due",
//                                                     "file"}]}, {"kind":"promise","text","file"} or
//                                                     {"kind":"calm"}. Each "text" is copied from the
//                                                     note at "file" (its index.md in the Apple Notes
//                                                     copy); the helper adds the note's title.
//   node your-todos/first-read.mjs latest @<file>     write data/latest.json and data/status.json from
//                                                     the file your script wrote into data/.work/
//                                                     (schema, example and generatedAt set here)
//   node your-todos/first-read.mjs done               mark the reading done, delete data/.work/
// A <file> is relative to data/.work/.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA = "apple-notes-todos";
const LATEST_SCHEMA = "apple-notes-todos/your-todos@1";

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
function writeJson(file, value) {
  const tmp = file + ".part";
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}
function workFile(name) {
  const file = path.resolve(workDir, name);
  if (!file.startsWith(workDir + path.sep)) fail(`${name} is not inside data/.work/`);
  if (!fs.existsSync(file)) fail(`${name} is not in data/.work/ (save it there first)`);
  return file;
}
/** "@gift.json", or "@your-todos/data/.work/gift.json", read as JSON from data/.work/. */
function workJson(arg, what) {
  if (!arg.startsWith("@")) fail(`give ${what} as @<file>: the JSON your script wrote into data/.work/`);
  try { return readJson(workFile(arg.slice(1).replace(/^.*data[\\/]\.work[\\/]/, ""))); } catch { return fail(`${arg.slice(1)} is not JSON in data/.work/`); }
}

/** One write to reading.json at a time: two at once would each write their own copy and lose one. */
function lockReading() {
  const lock = path.join(dataDir, ".reading.lock");
  const until = Date.now() + 8000;
  for (;;) {
    try { fs.mkdirSync(lock); break; } catch {
      try { if (Date.now() - fs.statSync(lock).mtimeMs > 15000) { fs.rmSync(lock, { recursive: true, force: true }); continue; } } catch { continue; }
      if (Date.now() > until) fail("another push is still running: push one line at a time");
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
  process.on("exit", () => { try { fs.rmSync(lock, { recursive: true, force: true }); } catch { /* gone */ } });
}

// ── The notes: a gift names only words a note in the copy really holds ──
/** Letters and digits only, lower case: "- [ ] **Book** the movers!" reads as "book the movers". */
function plain(s) { return String(s).toLowerCase().replace(/[‘’]/g, "'").replace(/[^\p{L}\p{N}']+/gu, " ").trim(); }
function noteOf(file) {
  if (typeof file !== "string" || !file.trim()) fail("each to-do in the gift needs \"file\": the note's index.md in the Apple Notes copy");
  const abs = path.resolve(file.trim());
  if (!abs.split(path.sep).includes("Apple Notes")) fail(`${file} is not in the Apple Notes copy`);
  if (!/\.md$/i.test(abs) || !fs.existsSync(abs)) fail(`${file} is not a note (give the path of its index.md)`);
  const raw = fs.readFileSync(abs, "utf8");
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  const t = front ? /^title:\s*(.+)$/m.exec(front[1]) : null;
  const title = t ? t[1].trim().replace(/^(["'])(.*)\1$/, "$2") : path.basename(path.dirname(abs));
  return { title, words: plain(front ? raw.slice(front[0].length) : raw), file };
}
function copied(text, note) {
  const t = typeof text === "string" ? text.trim() : "";
  if (!t) fail(`a to-do from "${note.title}" has no text`);
  if (t.length > 140) fail(`refused, "${t.slice(0, 40)}..." is longer than one short line`);
  if (!plain(t) || !note.words.includes(plain(t))) fail(`refused, "${t}" is not written in "${note.title}": copy the words as the note has them`);
  return t;
}
function dueOf(v) {
  if (v == null || v === "") return null;
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(new Date(v + "T12:00:00").getTime())) fail(`refused, due "${v}" is not YYYY-MM-DD`);
  return v;
}
function giftOf(g) {
  if (!g || typeof g !== "object" || Array.isArray(g)) fail("the gift must be an object");
  const kind = String(g.kind || "");
  if (kind === "calm") return { kind };
  if (kind === "promise") {
    const note = noteOf(g.file);
    return { kind, text: copied(g.text, note), note: note.title };
  }
  if (kind === "plan") {
    if (!Array.isArray(g.items) || !g.items.length) fail("a plan gift needs items: the to-dos due soonest, at most 3");
    const items = g.items.slice(0, 3).map((it) => {
      const note = noteOf(it && it.file);
      return { text: copied(it.text, note), due: dueOf(it.due), note: note.title };
    });
    if (!items.some((it) => it.due)) fail("a plan gift needs at least one to-do with a due date: give a promise or calm instead");
    // Soonest first; the undated ones after.
    items.sort((a, b) => (a.due || "9999") < (b.due || "9999") ? -1 : (a.due || "9999") > (b.due || "9999") ? 1 : 0);
    return { kind, items };
  }
  return fail(`the gift kind is plan, promise or calm, not "${kind}"`);
}

const count = (v) => typeof v === "number" && Number.isInteger(v) && v >= 0;

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "start") {
  if (fs.existsSync(path.join(dataDir, "latest.json"))) fail("latest.json is there: this is not the first read");
  fs.mkdirSync(workDir, { recursive: true });
  writeJson(readingFile, { schema: `${SCHEMA}/reading@1`, startedAt: iso(new Date()), done: false, lines: [] });
  console.log("reading started; save files in " + path.relative(process.cwd(), workDir));
} else if (cmd === "push") {
  lockReading();
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  if (r.done) fail("the reading is done: no more lines");
  const line = String(args.join(" ") || "").replace(/\s+/g, " ").trim();
  // An empty line, or one that is only marks ("**  **"), says nothing.
  if (!line || !/[\p{L}\p{N}]/u.test(line)) fail("refused, the line is empty");
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object|\{|\}|\$\{/.test(line)) fail(`refused, the line is broken: ${line}`);
  if (line.length > 200) fail("refused, the line is longer than 200 characters");
  // "**0 to-dos**" is not a finding: a line whose numbers are all 0 says nothing.
  const bold = (line.match(/\*\*[^*]+\*\*/g) || []).join(" ");
  const nums = ((bold || line).replace(/\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}/g, "").match(/\d[\d,.]*/g) || []);
  if (nums.length && nums.every((x) => Number(x.replace(/,/g, "")) === 0)) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
  if (r.lines.includes(line)) fail("that line is already there");
  r.lines.push(line);
  writeJson(readingFile, r);
  console.log(`line ${r.lines.length}: ${line}`);
} else if (cmd === "gift") {
  const gift = giftOf(workJson(args.join(" ").trim(), "the gift"));
  lockReading();
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  if (r.done) fail("the reading is done: the gift comes while you read");
  if (r.gift) fail("there is a gift already: one is enough");
  r.gift = { ...gift, at: iso(new Date()) };
  writeJson(readingFile, r);
  console.log("gift: " + JSON.stringify(r.gift));
} else if (cmd === "latest") {
  // latest.json in the page's own shape: the helper sets what it knows for sure.
  const l = workJson(args.join(" ").trim(), "latest.json");
  if (!l || typeof l !== "object" || Array.isArray(l)) fail("latest.json must be an object");
  if (!Array.isArray(l.notes)) fail("latest.json needs notes (an empty list when there are none)");
  const t = l.totals;
  if (!t || typeof t !== "object" || !count(t.notes) || !count(t.withTodos) || !count(t.items)) fail("latest.json needs totals: { notes, withTodos, items }, each a whole number");
  let shown = 0;
  l.notes.forEach((n, i) => {
    if (!n || typeof n !== "object" || typeof n.title !== "string" || !Array.isArray(n.items)) fail(`notes[${i}] needs a title and items`);
    for (const it of n.items) {
      if (!it || typeof it.text !== "string" || !it.text.trim()) fail(`notes[${i}] "${n.title}" has a to-do with no text`);
      dueOf(it.due);
    }
    shown += n.items.length;
  });
  if (t.withTodos < l.notes.length || t.items < shown) fail("totals count fewer to-dos than the notes show: count them again");
  const n = new Date();
  l.schema = LATEST_SCHEMA;
  l.example = false;
  l.generatedAt = iso(n);
  writeJson(path.join(dataDir, "latest.json"), l);
  writeJson(path.join(dataDir, "status.json"), { at: iso(n), ok: true });
  console.log("latest.json written, and status.json");
} else if (cmd === "done") {
  lockReading();
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  r.done = true;
  writeJson(readingFile, r);
  try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("data/.work/ is busy: delete it in your next call"); }
  console.log("reading done");
} else {
  fail("use start, push, gift, latest or done");
}
