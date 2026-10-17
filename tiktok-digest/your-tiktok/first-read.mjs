#!/usr/bin/env node
// The first catch-up's lines, gift and files, written only through here so the page can show
// them as they come. Only on the first catch-up (no data/latest.json yet). Run it from anywhere:
//   node <app>/first-read.mjs start                 new data/reading.json and data/.work/
//   node <app>/first-read.mjs push '<line>'         add one line (single quotes: "$" stays "$", in bash
//                                                   and PowerShell alike), right after the TikTok call
//                                                   that found it. A line with an apostrophe: write it
//                                                   to data/.work/line.txt and push @line.txt
//   node <app>/first-read.mjs recent @<file>        the newest videos, shown at once, very early:
//                                                   a list of up to 5 {"title","at","views","link"},
//                                                   copied from a TikTok answer
//   node <app>/first-read.mjs gift @<file>          the one thing for the person, shown while you read:
//                                                   {"kind":"best","video","views","at","link"} or
//                                                   {"kind":"calm"}; copied from a TikTok answer
//   node <app>/first-read.mjs offer @<file>         one more thing they can do now, under the gift, at
//                                                   most 2: {"kind":"quiet","video"} or {"kind":"next"}
//   node <app>/first-read.mjs latest @<file> [@why.txt] write data/latest.json, today's day file and
//                                                   data/status.json from your file in data/.work/
//                                                   (schema and generatedAt set here, example dropped);
//                                                   a partial run's why: write it to data/.work/why.txt
//   node <app>/first-read.mjs done                  mark the reading done, delete data/.work/
// A line is one short sentence about their account, the finding in **bold**:
//   "**Your last 10 videos**: 612,400 views between them"
// Every number in it is counted from what TikTok answered, never guessed.
// Nothing here writes to TikTok: Cabinet's TikTok only reads.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA = "tiktok-digest";
const LATEST_SCHEMA = "tiktok-digest/your-tiktok@1";
const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const readingFile = path.join(dataDir, "reading.json");
const latestFile = path.join(dataDir, "latest.json");
const DAY = 86400000;
const MARKS = ["best", "quiet", ""];
const COUNTS = ["views", "likes", "comments", "shares"];

// ── Time, in this machine's zone (the person's own) ──
const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, "0");
const hhmm = (d) => pad(d.getHours()) + ":" + pad(d.getMinutes());
const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
function offsetOf(d) { const o = -d.getTimezoneOffset(); return (o >= 0 ? "+" : "-") + pad(o / 60) + ":" + pad(o % 60); }
function iso(d) { return ymd(d) + "T" + hhmm(d) + ":" + pad(d.getSeconds()) + offsetOf(d); }
/** Midnight, `days` from today, in local time (safe across a clock change). */
function dayStart(days) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + days); return d; }

function fail(msg) { console.error("first-read: " + msg); process.exit(1); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
/** Written whole or not at all. The part file starts with a dot, so Cabinet's look at the folder skips it. */
function writeText(file, text) {
  const tmp = path.join(path.dirname(file), "." + path.basename(file) + ".part");
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, file);
}
function writeJson(file, value) { writeText(file, JSON.stringify(value, null, 2)); }
function workFile(name) {
  const file = path.resolve(workDir, name);
  if (!file.startsWith(workDir + path.sep)) fail(`${name} is not inside data/.work/`);
  if (!fs.existsSync(file)) fail(`${name} is not in data/.work/ (write it there first)`);
  return file;
}
/** "@line.txt" is the text of that file in data/.work/, for words no shell can quote; anything else is the words themselves. */
function workText(arg) {
  const said = String(arg || "").trim();
  return /^@[\w.-]+$/.test(said) ? fs.readFileSync(workFile(said.slice(1)), "utf8") : said;
}
/** "@your-tiktok/data/.work/gift.json" means "@gift.json". */
function workJson(arg, what) {
  if (!arg.startsWith("@")) fail(`give ${what} as @<file>: the JSON you wrote into data/.work/`);
  try { return JSON.parse(workText("@" + arg.slice(1).replace(/^.*data[\\/]\.work[\\/]/, ""))); } catch { return fail(`${arg.slice(1)} is not JSON in data/.work/`); }
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

/** A raw TikTok id (a video id is a long number) or a TikTok link: never in words the page shows. */
const RAW_ID = /\b\d{15,}\b|tiktok\.com\/|\bopen_id\b/i;

/** A line the page can show: one sentence about their account, never about the reading itself. */
function checkLine(line) {
  if (!line) fail("refused, an empty line: say what that call found, or push nothing");
  // "$4" in double quotes reaches here as "": refuse what the shell ate.
  if (/(^|[\s(*])[,.]\d/.test(line)) fail("refused, a number lost its start (a $ in double quotes?): use single quotes");
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object|\{|\}/.test(line) || RAW_ID.test(line)) fail(`refused, the line is broken or carries a raw id or link: ${line}`);
  if (line.length > 200) fail("refused, the line is longer than 200 characters");
  if (/[—–]/.test(line)) fail("refused, a long dash: use a comma or a period");
  if (!/\*\*[^*]+\*\*/.test(line)) fail("refused, mark the finding in **bold**, like '**Your last 10 videos**: 612,400 views between them'");
  if (/^(I|I'm|I've|Searching|Reading|Looking|Checking|Opening|Trying)\b/i.test(line.replace(/\*/g, ""))) fail("refused, a line about the reading: say what you found on their account");
  // "**0 views**" is not a finding: a line whose numbers are all 0 says nothing.
  const bold = (line.match(/\*\*[^*]+\*\*/g) || []).join(" ");
  const nums = (bold.replace(/\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}/g, "").match(/\d[\d,.]*/g) || []);
  if (nums.length && nums.every((x) => Number(x.replace(/,/g, "")) === 0)) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
}

// ── What the page shows beside the lines: copied from TikTok's answers, checked here ──
/** Words for the page: no raw ids, no long dash, nothing broken. */
function checkWords(text, what) {
  if (/[—–]/.test(text)) fail(`refused, a long dash in ${what}: use a comma or a period`);
  if (RAW_ID.test(text)) fail(`refused, a raw TikTok id or link in ${what}: write the title`);
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object/.test(text)) fail(`refused, ${what} is broken: ${text}`);
}
/** A video's title, or its caption's first words, as the persona says. The page cuts titles at the same 120. */
function titleOf(value, what) {
  const title = String(value || "").replace(/\s+/g, " ").trim();
  if (!title) fail(`${what} needs the video's title, or its caption's first words`);
  if (title.length > 120) fail(`${what}: the title is longer than 120 characters`);
  checkWords(title, what);
  return title;
}
/** When a video was posted, from its create_time, never a typed date. */
function atOf(value, days, what) {
  const at = new Date(String(value || ""));
  if (!value || isNaN(at.getTime())) fail(`${what}: at is the video's create_time, written as an ISO time`);
  if (at.getTime() > Date.now() + 5 * 60000 || at.getTime() < Date.now() - days * DAY) fail(`refused, ${what} is not from the last ${days} days`);
  return iso(at);
}
function countOf(value, what) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) fail(`${what}: views is a whole number copied from TikTok`);
  return n;
}
/** The page's ttLink takes the same TikTok addresses, with the same 400-character cap. */
function linkOf(value, what) {
  if (value === undefined || value === "" || value === null) return "";
  const link = String(value).trim();
  if (!/^https:\/\/(www\.|m\.|vm\.|vt\.)?tiktok\.com\/\S+$/i.test(link) || link.length > 400) fail(`${what}: link is the video's share_url from TikTok, or leave it out`);
  return link;
}

// ── The newest videos: a few real ones, so the person sees their account within seconds ──
/** At most 5: the page's cleanRecent keeps no more. */
function recentOf(list) {
  if (!Array.isArray(list) || !list.length) fail("the newest videos are a JSON list of 1 to 5 videos");
  if (list.length > 5) fail("at most 5 newest videos");
  const seen = new Set();
  return list.map((v, i) => {
    const what = `video ${i + 1}`;
    if (!v || typeof v !== "object" || Array.isArray(v)) fail(`${what} must be an object`);
    const out = { title: titleOf(v.title, what), at: atOf(v.at, 3650, what), views: countOf(v.views, what) };
    const link = linkOf(v.link, what);
    if (link) out.link = link;
    const key = out.title + out.at;
    if (seen.has(key)) fail(`${what} is there twice`);
    seen.add(key);
    return out;
  }).sort((a, b) => new Date(b.at) - new Date(a.at));
}

// ── The gift: one thing the person can act on now, shown while the reading goes on ──
function giftOf(g) {
  if (!g || typeof g !== "object" || Array.isArray(g)) fail("the gift must be an object");
  const kind = String(g.kind || "");
  if (kind === "calm") return { kind };
  if (kind !== "best") fail(`the gift kind is best or calm, not "${kind}"`);
  const out = { kind, video: titleOf(g.video, "the gift"), views: countOf(g.views, "the gift") };
  if (!out.views) fail("refused, the gift's video has no views yet: give calm");
  out.posted = atOf(g.at || g.posted, 3650, "the gift");
  const link = linkOf(g.link, "the gift");
  if (link) out.link = link;
  return out;
}

// ── More things to do now, under the gift: each one ideas or a draft in the chat ──
const OFFER_KINDS = ["quiet", "next"];
/** The page's cleanOffers shows no more than 2. */
const MAX_OFFERS = 2;
function offerOf(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) fail("the offer must be an object");
  const kind = String(o.kind || "");
  if (!OFFER_KINDS.includes(kind)) fail(`the offer kind is ${OFFER_KINDS.join(" or ")}, not "${kind}"`);
  return kind === "quiet" ? { kind, video: titleOf(o.video, "the quiet offer") } : { kind };
}

/** latest.json in the page's own shape: a row the page cannot show is refused here. */
function latestOf(l) {
  if (!l || typeof l !== "object" || Array.isArray(l)) fail("latest.json must be an object");
  if (!Array.isArray(l.videos)) fail("latest.json needs videos (an empty list on a new account)");
  for (const key of ["next", "known", "history"]) {
    if (l[key] !== undefined && !Array.isArray(l[key])) fail(`latest.json: ${key} is a list (leave it out, or [] when there is none)`);
  }
  if (!l.account || typeof l.account !== "object") fail("latest.json needs account, copied from user/info");
  l.videos.forEach((v, i) => {
    if (!v || typeof v !== "object") fail(`videos[${i}] must be an object`);
    if (typeof v.title !== "string") fail(`videos[${i}].title is a string ("" when the video has no title or caption)`);
    if (v.title) checkWords(v.title, `videos[${i}].title`);
    for (const k of COUNTS) if (v[k] !== undefined && !(Number.isInteger(v[k]) && v[k] >= 0)) fail(`videos[${i}].${k} is a whole number copied from TikTok`);
    if (v.mark !== undefined && !MARKS.includes(v.mark)) fail(`videos[${i}].mark is best, quiet or "", not "${v.mark}"`);
    if (v.gist) checkWords(String(v.gist), `videos[${i}].gist`);
    if (!v.id) v.id = "v" + (i + 1);
  });
  for (const mark of ["best", "quiet"]) {
    if (l.videos.filter((v) => v.mark === mark).length > 1) fail(`only one video is ${mark}`);
  }
  if (l.spans !== undefined) {
    for (const key of ["last7", "last28"]) {
      const s = l.spans && l.spans[key];
      if (!s || typeof s !== "object") fail(`spans.${key} is missing`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s.from || ""))) fail(`spans.${key}.from is a day, YYYY-MM-DD`);
      for (const k of ["videos", ...COUNTS]) if (!(Number.isInteger(s[k]) && s[k] >= 0)) fail(`spans.${key}.${k} is a whole number`);
    }
  }
  (l.history || []).forEach((h, i) => {
    if (!h || !/^\d{4}-\d{2}-\d{2}$/.test(String(h.day || ""))) fail(`history[${i}].day is YYYY-MM-DD`);
  });
  const n = new Date();
  l.schema = LATEST_SCHEMA;
  l.generatedAt = iso(n);
  if (!l.since) l.since = iso(dayStart(-1));
  delete l.example;
  return l;
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "start") {
  // Later catch-ups are told the usual way: the reading is only for the first one.
  if (fs.existsSync(latestFile)) fail("data/latest.json is there, so this is not the first catch-up: carry on without the helper");
  fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });
  lockReading();
  writeJson(readingFile, { schema: `${SCHEMA}/reading@1`, startedAt: iso(new Date()), done: false, lines: [] });
  console.log("reading started; write your files in " + path.relative(process.cwd(), workDir));
} else if (cmd === "push") {
  editReading("the reading is done: no more lines", (r) => {
    // "@line.txt" reads the line from data/.work/, for a line no shell can quote.
    const line = workText(args.join(" ")).replace(/\s+/g, " ").trim();
    checkLine(line);
    if (r.lines.includes(line)) fail("that line is already there");
    r.lines.push(line);
    return `line ${r.lines.length}: ${line}`;
  });
} else if (cmd === "recent") {
  const recent = recentOf(workJson(args.join(" ").trim(), "the newest videos"));
  editReading("the reading is done: the newest videos come while you read", (r) => {
    if (r.recent) fail("the newest videos are there already: once is enough");
    r.recent = recent;
    return `newest videos: ${recent.length}`;
  });
} else if (cmd === "offer") {
  const offer = offerOf(workJson(args.join(" ").trim(), "the offer"));
  editReading("the reading is done: offers come while you read", (r) => {
    const offers = Array.isArray(r.offers) ? r.offers : [];
    if (offers.length >= MAX_OFFERS) fail(`there are ${MAX_OFFERS} offers already: that is enough`);
    if (offers.some((x) => x.kind === offer.kind)) fail("that offer is there already");
    offers.push({ ...offer, at: iso(new Date()) });
    r.offers = offers;
    return "offer: " + JSON.stringify(offer);
  });
} else if (cmd === "gift") {
  const gift = giftOf(workJson(args.join(" ").trim(), "the gift"));
  editReading("the reading is done: the gift comes while you read", (r) => {
    if (r.gift) fail("there is a gift already: one is enough");
    r.gift = { ...gift, at: iso(new Date()) };
    return "gift: " + JSON.stringify(r.gift);
  });
} else if (cmd === "latest") {
  const [file, ...why] = args;
  const l = latestOf(workJson(String(file || "").trim(), "latest.json"));
  const n = new Date();
  const text = JSON.stringify(l, null, 2);
  writeText(latestFile, text);
  // The same catch-up under today's date for the picker, and day files past 30 days go
  // (the page's listDays reads the same names and keeps the same 30).
  const days = path.join(dataDir, "days");
  fs.mkdirSync(days, { recursive: true });
  writeText(path.join(days, ymd(n) + ".json"), text);
  const oldest = ymd(dayStart(-30));
  for (const f of fs.readdirSync(days)) if (/^\d{4}-\d{2}-\d{2}\.json$/.test(f) && f.slice(0, 10) < oldest) fs.rmSync(path.join(days, f), { force: true });
  // "@why.txt" reads the note from data/.work/, for a note no shell can quote ("TikTok's limit").
  const note = workText(why.join(" ")).replace(/\s+/g, " ").trim().slice(0, 200);
  writeJson(path.join(dataDir, "status.json"), { at: iso(n), ok: true, ...(note ? { why: note } : {}) });
  console.log(`latest.json written (${l.videos.length} videos), days/${ymd(n)}.json and status.json`);
} else if (cmd === "done") {
  lockReading();
  const r = readReading();
  r.done = true;
  writeJson(readingFile, r);
  try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("data/.work/ is busy: delete it in your next call"); }
  console.log("reading done");
} else {
  fail("use start, push, recent, gift, offer, latest or done");
}
