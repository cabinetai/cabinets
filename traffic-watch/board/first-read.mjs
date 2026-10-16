#!/usr/bin/env node
// The first check's lines, gift and offers, written only through here so the board can show
// them as they come. Only on the first check (no data/latest.json yet). Run it from anywhere:
//   node <app>/first-read.mjs start                 new data/reading.json and data/.work/
//   node <app>/first-read.mjs push '<line>'         add one line (single quotes: "$" stays "$", in bash
//                                                   and PowerShell alike), right after the report
//                                                   that found it. A line with an apostrophe: write it
//                                                   to data/.work/line.txt and push @line.txt
//   node <app>/first-read.mjs gift @<file>          the one thing for the person, shown while you read:
//                                                   {"kind":"item","level","title","summary"} or {"kind":"calm"},
//                                                   from this run's reports
//   node <app>/first-read.mjs offer @<file>         one more thing they can do now, under the gift, at
//                                                   most 2: {"kind":"drop","what"} or {"kind":"note"}
//   node <app>/first-read.mjs done                  mark the reading done, delete data/.work/
// A line is one short sentence about their website, the finding in **bold**:
//   "**294 visitors** yesterday, about the usual 318"
// Every number in it is from what Google Analytics answered, never guessed.
// Nothing here changes Google Analytics: every press on the page asks the agent in the chat.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA = "traffic-watch";
const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const readingFile = path.join(dataDir, "reading.json");
const latestFile = path.join(dataDir, "latest.json");

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
  if (!fs.existsSync(file)) fail(`${name} is not in data/.work/ (write it there first)`);
  return file;
}
/** "@board/data/.work/gift.json" means "@gift.json". */
function workJson(arg, what) {
  if (!arg.startsWith("@")) fail(`give ${what} as @<file>: the JSON you wrote into data/.work/`);
  try { return readJson(workFile(arg.slice(1).replace(/^.*data[\\/]\.work[\\/]/, ""))); } catch { return fail(`${arg.slice(1)} is not JSON in data/.work/`); }
}

/** data/reading.json as start wrote it, or a plain stop when it is missing or broken. */
function readReading() {
  if (!fs.existsSync(readingFile)) fail("run start first");
  try { return readJson(readingFile); } catch { return fail("data/reading.json is broken (not JSON): carry on without the helper"); }
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

/** A raw Google Analytics id: a property or account path, a measurement id, a bare long number. */
const RAW_ID = /\b(properties|accounts)\/\d+|\bG-[A-Z0-9]{6,}\b|\bUA-\d{4,}-\d+\b|\b\d{9,}\b/;

/** A line the page can show: one sentence about their website, never about the reading itself. */
function checkLine(line) {
  if (!line) fail("refused, an empty line: say what that report found, or push nothing");
  // "$4" in double quotes reaches here as "": refuse what the shell ate.
  if (/(^|[\s(*])[,.]\d/.test(line)) fail("refused, a number lost its start (a $ in double quotes?): use single quotes");
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object|\{|\}/.test(line) || RAW_ID.test(line)) fail(`refused, the line is broken or carries a raw id: ${line}`);
  if (line.length > 200) fail("refused, the line is longer than 200 characters");
  if (/[—–]/.test(line)) fail("refused, a long dash: use a comma or a period");
  if (!/\*\*[^*]+\*\*/.test(line)) fail("refused, mark the finding in **bold**, like '**294 visitors** yesterday'");
  if (/^(I|I'm|I've|Searching|Reading|Looking|Checking|Opening|Trying)\b/i.test(line.replace(/\*/g, ""))) fail("refused, a line about the reading: say what you found on their website");
  // "**0 visitors**" is not a finding: a line whose numbers are all 0 says nothing.
  const bold = (line.match(/\*\*[^*]+\*\*/g) || []).join(" ");
  const nums = (bold.replace(/\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}/g, "").match(/\d[\d,.]*/g) || []);
  if (nums.length && nums.every((x) => Number(x.replace(/,/g, "")) === 0)) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
}

// ── What the page shows beside the lines: from this run's reports, checked here ──
/** Your own words for the page: no raw ids, no long dash, nothing broken. */
function checkWords(text, what) {
  if (/[—–]/.test(text)) fail(`refused, a long dash in ${what}: use a comma or a period`);
  if (RAW_ID.test(text)) fail(`refused, a raw Google Analytics id in ${what}: write the name`);
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object/.test(text)) fail(`refused, ${what} is broken: ${text}`);
}
/** A few plain words or one short sentence, at most `max` characters. */
function wordsOf(value, max, what) {
  const words = String(value || "").replace(/\s+/g, " ").trim();
  if (!words) return "";
  if (words.length > max) fail(`${what} is longer than ${max} characters`);
  checkWords(words, what);
  return words;
}

// ── The gift: one thing the person can act on now, shown while the reading goes on ──
const LEVELS = ["High", "Medium", "Low"];
function giftOf(g) {
  if (!g || typeof g !== "object" || Array.isArray(g)) fail("the gift must be an object");
  const kind = String(g.kind || "");
  if (kind === "calm") return { kind };
  if (kind !== "item") fail(`the gift kind is item or calm, not "${kind}"`);
  const level = String(g.level || "");
  if (!LEVELS.includes(level)) fail(`the gift's level is High, Medium or Low, not "${level}"`);
  const title = wordsOf(g.title, 80, "the gift's title");
  if (!title) fail("the gift needs a title: the problem in a few plain words");
  // The summary carries the numbers behind it, from this run's reports.
  const summary = wordsOf(g.summary, 160, "the gift's summary");
  if (!summary || !/\d/.test(summary)) fail("the gift needs a summary: one or two sentences with the numbers");
  return { kind, level, title, summary };
}

// ── More things to do now, under the gift: each one a check or a note in the chat ──
const OFFER_KINDS = ["drop", "note"];
const MAX_OFFERS = 2;
function offerOf(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) fail("the offer must be an object");
  const kind = String(o.kind || "");
  if (!OFFER_KINDS.includes(kind)) fail(`the offer kind is ${OFFER_KINDS.join(" or ")}, not "${kind}"`);
  if (kind === "note") return { kind };
  const what = wordsOf(o.what, 100, "the drop offer");
  if (!what) fail("the drop offer needs what: the biggest drop, in a few plain words");
  return { kind, what };
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "start") {
  // Later checks are told the usual way: the reading is only for the first one.
  if (fs.existsSync(latestFile)) fail("data/latest.json is there, so this is not the first check: carry on without the helper");
  fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });
  lockReading();
  writeJson(readingFile, { schema: `${SCHEMA}/reading@1`, startedAt: iso(new Date()), done: false, lines: [] });
  console.log("reading started; write your files in " + path.relative(process.cwd(), workDir));
} else if (cmd === "push") {
  lockReading();
  const r = readReading();
  if (r.done) fail("the reading is done: no more lines");
  // "@line.txt" reads the line from data/.work/, for a line no shell can quote.
  const raw = args.join(" ");
  const fromFile = /^@[\w.-]+$/.test(raw.trim()) ? fs.readFileSync(workFile(raw.trim().slice(1)), "utf8") : raw;
  const line = String(fromFile || "").replace(/\s+/g, " ").trim();
  checkLine(line);
  if (r.lines.includes(line)) fail("that line is already there");
  r.lines.push(line);
  writeJson(readingFile, r);
  console.log(`line ${r.lines.length}: ${line}`);
} else if (cmd === "offer") {
  const offer = offerOf(workJson(args.join(" ").trim(), "the offer"));
  lockReading();
  const r = readReading();
  if (r.done) fail("the reading is done: offers come while you read");
  const offers = Array.isArray(r.offers) ? r.offers : [];
  if (offers.length >= MAX_OFFERS) fail(`there are ${MAX_OFFERS} offers already: that is enough`);
  if (offers.some((x) => x.kind === offer.kind)) fail("that offer is there already");
  offers.push({ ...offer, at: iso(new Date()) });
  r.offers = offers;
  writeJson(readingFile, r);
  console.log("offer: " + JSON.stringify(offer));
} else if (cmd === "gift") {
  const gift = giftOf(workJson(args.join(" ").trim(), "the gift"));
  lockReading();
  const r = readReading();
  if (r.done) fail("the reading is done: the gift comes while you read");
  if (r.gift) fail("there is a gift already: one is enough");
  r.gift = { ...gift, at: iso(new Date()) };
  writeJson(readingFile, r);
  console.log("gift: " + JSON.stringify(r.gift));
} else if (cmd === "done") {
  lockReading();
  const r = readReading();
  r.done = true;
  writeJson(readingFile, r);
  try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("data/.work/ is busy: delete it in your next call"); }
  console.log("reading done");
} else {
  fail("use start, push, gift, offer or done");
}
