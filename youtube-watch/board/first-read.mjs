#!/usr/bin/env node
// The first check's lines, gift and offers, written only through here so the board can show
// them as they come. Only on the first check (no data.json yet). Run it from anywhere:
//   node <app>/first-read.mjs start                 new data/reading.json and data/.work/
//   node <app>/first-read.mjs push '<line>'         add one line (single quotes: "$" stays "$", in bash
//                                                   and PowerShell alike), right after the YouTube call
//                                                   that found it. A line with an apostrophe: write it
//                                                   to data/.work/line.txt and push @line.txt
//   node <app>/first-read.mjs gift @<file>          the one thing for the person, shown while you read:
//                                                   {"kind":"urgent","title","who","video","at","gist",
//                                                   "link"} or {"kind":"calm"}; who, video, at and link
//                                                   copied from a YouTube answer
//   node <app>/first-read.mjs offer @<file>         one more thing they can do now, under the gift, at
//                                                   most 2: {"kind":"drop","video"} or
//                                                   {"kind":"business","from","ask"}
//   node <app>/first-read.mjs done                  mark the reading done, delete data/.work/
// A line is one short sentence about their channel, the finding in **bold**:
//   "**3 angry comments** under Desk Shelf Build since Sunday"
// Every number in it is counted from what YouTube answered, never guessed.
// Nothing here writes to YouTube: every press on the board asks the agent in the chat.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA = "youtube-watch";
const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const readingFile = path.join(dataDir, "reading.json");
const boardFile = path.join(here, "data.json");
const DAY = 86400000;
const ASKS = ["Sponsorship", "Collaboration", "Hiring", "Consulting", "Partnership", "Bulk order", "Press"];

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

/** A raw YouTube id: a channel (UC...), a playlist (UU...), or a comment or video link. */
const RAW_ID = /\bU[CU][\w-]{22}\b|watch\?v=|[?&]lc=|\bUgw[\w-]{10,}|\bUgx[\w-]{10,}|\bUgz[\w-]{10,}/;

/** A line the board can show: one sentence about their channel, never about the reading itself. */
function checkLine(line) {
  if (!line) fail("refused, an empty line: say what that call found, or push nothing");
  // "$4" in double quotes reaches here as "": refuse what the shell ate.
  if (/(^|[\s(*])[,.]\d/.test(line)) fail("refused, a number lost its start (a $ in double quotes?): use single quotes");
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object|\{|\}/.test(line) || RAW_ID.test(line)) fail(`refused, the line is broken or carries a raw id: ${line}`);
  if (line.length > 200) fail("refused, the line is longer than 200 characters");
  if (/—/.test(line)) fail("refused, an em-dash: use a comma or a period");
  if (!/\*\*[^*]+\*\*/.test(line)) fail("refused, mark the finding in **bold**, like '**3 angry comments** since Sunday'");
  if (/^(I|I'm|I've|Searching|Reading|Looking|Checking|Opening|Trying)\b/i.test(line.replace(/\*/g, ""))) fail("refused, a line about the reading: say what you found on their channel");
  // "**0 comments**" is not a finding: a line whose numbers are all 0 says nothing.
  const bold = (line.match(/\*\*[^*]+\*\*/g) || []).join(" ");
  const nums = (bold.replace(/\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}/g, "").match(/\d[\d,.]*/g) || []);
  if (nums.length && nums.every((x) => Number(x.replace(/,/g, "")) === 0)) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
}

// ── What the board shows beside the lines: copied from YouTube's answers, checked here ──
/** Your own words for the board: no raw ids, no em-dash, nothing broken. */
function checkWords(text, what) {
  if (/—/.test(text)) fail(`refused, an em-dash in ${what}: use a comma or a period`);
  if (RAW_ID.test(text)) fail(`refused, a raw YouTube id or link in ${what}: write the name or the title`);
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object/.test(text)) fail(`refused, ${what} is broken: ${text}`);
}
/** A name or a title as YouTube shows it ("@sam.codes", "Desk Shelf Build"), never an address. */
function wordsOf(value, max, key, what) {
  const words = String(value || "").replace(/\s+/g, " ").trim();
  if (!words) fail(`${what} needs ${key}`);
  if (words.length > max) fail(`${what}: ${key} is longer than ${max} characters`);
  if (/\S@\S+\.\S/.test(words)) fail(`refused, ${what}: ${key} is an email address. Give the name YouTube shows`);
  checkWords(words, what);
  return words;
}
/** When a comment was written, copied from its publishedAt, never a typed date. */
function atOf(value, what) {
  const at = new Date(String(value || ""));
  if (!value || isNaN(at.getTime())) fail(`${what}: at is the comment's publishedAt as YouTube wrote it`);
  if (at.getTime() > Date.now() + 5 * 60000 || at.getTime() < Date.now() - 14 * DAY) fail(`refused, ${what} is not from the last 14 days`);
  return iso(at);
}
function linkOf(value, what) {
  const link = String(value || "").trim();
  if (!/^https:\/\/(www\.|m\.)?youtube\.com\/watch\?v=[\w-]{11}(&lc=[\w.-]+)?$/i.test(link)) fail(`${what}: link is https://www.youtube.com/watch?v=<videoId>&lc=<commentId>`);
  return link;
}

// ── The gift: one thing the person can act on now, shown while the reading goes on ──
function giftOf(g) {
  if (!g || typeof g !== "object" || Array.isArray(g)) fail("the gift must be an object");
  const kind = String(g.kind || "");
  if (kind === "calm") return { kind };
  if (kind !== "urgent") fail(`the gift kind is urgent or calm, not "${kind}"`);
  const out = { kind, title: wordsOf(g.title, 80, "title", "the gift"), who: wordsOf(g.who, 80, "who", "the gift"), video: wordsOf(g.video, 120, "video", "the gift") };
  out.since = atOf(g.at || g.since, "the gift");
  out.link = linkOf(g.link, "the gift");
  // The gist is one line in your words: what they said. No numbers, no quote of the comment.
  const gist = String(g.gist || "").replace(/\s+/g, " ").trim();
  if (gist) {
    if (gist.length > 140) fail("the gift: the gist is longer than 140 characters");
    if (/\d/.test(gist)) fail("refused, a number in the gift's gist: say what they want, without numbers");
    checkWords(gist, "the gift");
    out.gist = gist;
  }
  return out;
}

// ── More things to do now, under the gift: each one a look or a draft in the chat ──
const OFFER_KINDS = ["drop", "business"];
const MAX_OFFERS = 2;
function offerOf(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) fail("the offer must be an object");
  const kind = String(o.kind || "");
  if (!OFFER_KINDS.includes(kind)) fail(`the offer kind is ${OFFER_KINDS.join(" or ")}, not "${kind}"`);
  if (kind === "drop") return { kind, video: wordsOf(o.video, 120, "video", "the drop offer") };
  const ask = String(o.ask || "");
  if (!ASKS.includes(ask)) fail(`the business offer's ask is ${ASKS.join(", ")}, not "${ask}"`);
  return { kind, from: wordsOf(o.from, 80, "from", "the business offer"), ask };
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
