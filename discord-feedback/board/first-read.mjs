#!/usr/bin/env node
// The first check's lines, gift and offers, written only through here so the board can show
// them as they come. Only on the first check (no data.json yet). Run it from anywhere:
//   node <app>/first-read.mjs start                 new data/reading.json and data/.work/
//   node <app>/first-read.mjs push '<line>'         add one line (single quotes: "$" stays "$", in bash
//                                                   and PowerShell alike), right after the Discord call
//                                                   that found it. A line with an apostrophe: write it
//                                                   to data/.work/line.txt and push @line.txt
//   node <app>/first-read.mjs gift @<file>          the one thing for the person, shown while you read:
//                                                   {"kind":"top","title","people","gist"} or
//                                                   {"kind":"calm"}
//   node <app>/first-read.mjs offer @<file>         one more thing they can do now, under the gift, at
//                                                   most 2: {"kind":"thanks","people"} or
//                                                   {"kind":"bug","title"}
//   node <app>/first-read.mjs done                  mark the reading done, delete data/.work/
// A line is one short sentence about their community, the finding in **bold**:
//   "**Dark mode**: 6 people asked for it"
// Every number in it is counted from what Discord answered, never guessed.
// Nothing here writes to Discord: every press on the board asks the agent in the chat.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA = "discord-feedback";
const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const readingFile = path.join(dataDir, "reading.json");
const boardFile = path.join(here, "data.json");

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

/** A line or a field the board shows: plain words, never a raw id or a broken value. */
function checkWords(s, where) {
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object|\{|\}/.test(s)) fail(`refused, ${where} is broken: ${s}`);
  // <@194...> or <#1290...>: a raw mention. Name people and channels as Discord shows them.
  if (/<[@#][!&]?\d+>/.test(s)) fail(`refused, a raw Discord mention in ${where}: write the display name or the #channel`);
  if (/\b\d{17,20}\b/.test(s)) fail(`refused, a Discord id in ${where}: write the name instead`);
  // A long dash reads as written by a machine: a comma, a period or plain words instead.
  if (/[—–]/.test(s)) fail(`refused, a dash like "—" in ${where}: use a comma or a period`);
}

/** A line the board can show: one sentence about their community, never about the reading itself. */
function checkLine(line) {
  if (!line) fail("refused, an empty line: say what that call found, or push nothing");
  // "$4" in double quotes reaches here as "": refuse what the shell ate.
  if (/(^|[\s(*])[,.]\d/.test(line)) fail("refused, a number lost its start (a $ in double quotes?): use single quotes");
  checkWords(line, "the line");
  if (line.length > 200) fail("refused, the line is longer than 200 characters");
  if (!/\*\*[^*]+\*\*/.test(line)) fail("refused, mark the finding in **bold**, like '**Dark mode**: 6 people asked for it'");
  if (/^(I|I'm|I've|Searching|Reading|Looking|Checking|Opening|Trying)\b/i.test(line.replace(/\*/g, ""))) fail("refused, a line about the reading: say what you found in their server");
  // "**0 requests**" is not a finding: a line whose numbers are all 0 says nothing.
  const bold = (line.match(/\*\*[^*]+\*\*/g) || []).join(" ");
  const nums = (bold.replace(/\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}/g, "").match(/\d[\d,.]*/g) || []);
  if (nums.length && nums.every((x) => Number(x.replace(/,/g, "")) === 0)) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
}

/** A request's title or gist, in your words: plain, short, no raw ids. */
function wordsOf(value, max, key, what) {
  const words = String(value || "").replace(/\s+/g, " ").trim();
  if (!words) fail(`${what} needs ${key}`);
  if (words.length > max) fail(`${what}: ${key} is longer than ${max} characters`);
  checkWords(words, what);
  return words;
}
/** How many different people, counted from the messages you read. */
function peopleOf(value, least, what) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < least) fail(`${what}: people is how many different people, at least ${least}`);
  return n;
}

// ── The gift: one thing the person can act on now, shown while the reading goes on ──
function giftOf(g) {
  if (!g || typeof g !== "object" || Array.isArray(g)) fail("the gift must be an object");
  const kind = String(g.kind || "");
  if (kind === "calm") return { kind };
  if (kind !== "top") fail(`the gift kind is top or calm, not "${kind}"`);
  const out = { kind, title: wordsOf(g.title, 60, "title", "the gift"), people: peopleOf(g.people, 1, "the gift") };
  // The gist is one line in your words: what people want, and why when they said why.
  if (g.gist) out.gist = wordsOf(g.gist, 140, "gist", "the gift");
  return out;
}

// ── More things to do now, under the gift: each one a draft in the chat ──
const OFFER_KINDS = ["thanks", "bug"];
const MAX_OFFERS = 2;
function offerOf(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) fail("the offer must be an object");
  const kind = String(o.kind || "");
  if (!OFFER_KINDS.includes(kind)) fail(`the offer kind is ${OFFER_KINDS.join(" or ")}, not "${kind}"`);
  if (kind === "thanks") return { kind, people: peopleOf(o.people, 2, "the thanks offer") };
  return { kind, title: wordsOf(o.title, 60, "title", "the bug offer") };
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "start") {
  // Later checks are told the usual way: the reading is only for the first one.
  if (fs.existsSync(boardFile)) fail("data.json is there, so this is not the first check: carry on without the helper");
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
