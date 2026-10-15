#!/usr/bin/env node
// The first catch-up's lines, gift and files, written only through here so the page can show
// them as they come. Only on the first catch-up (no data/latest.json yet). Run it from anywhere:
//   node <app>/first-read.mjs start                 new data/reading.json and data/.work/
//   node <app>/first-read.mjs push '<line>'         add one line (single quotes: "$" stays "$", in bash
//                                                   and PowerShell alike), right after the Instagram call
//                                                   that found it. A line with an apostrophe: write it
//                                                   to data/.work/line.txt and push @line.txt
//   node <app>/first-read.mjs recent @<file>        the newest comments, shown at once, very early:
//                                                   a list of up to 5 {"who","post","gist","at","link"},
//                                                   copied from an Instagram answer
//   node <app>/first-read.mjs gift @<file>          the one thing for the person, shown while you read:
//                                                   {"kind":"waiting","who","post","mediaId","commentId",
//                                                   "at","gist","link"} or {"kind":"calm"}; who, post,
//                                                   ids, at and link copied from an Instagram answer
//   node <app>/first-read.mjs offer @<file>         one more thing they can do now, under the gift, at
//                                                   most 2: {"kind":"asked","what","people"} or
//                                                   {"kind":"next"}
//   node <app>/first-read.mjs latest @<file> [@why.txt] write data/latest.json, today's day file and
//                                                   data/status.json from your file in data/.work/
//                                                   (schema and generatedAt set here, example dropped);
//                                                   a partial run's why: write it to data/.work/why.txt
//   node <app>/first-read.mjs done                  mark the reading done, delete data/.work/
// A line is one short sentence about their account, the finding in **bold**:
//   "**23 new comments** since yesterday, 5 of them questions"
// Every number in it is counted from what Instagram answered, never guessed.
// Nothing here writes to Instagram: every press on the page asks the agent in the chat.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA = "instagram-digest";
const LATEST_SCHEMA = "instagram-digest/your-instagram@1";
const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const readingFile = path.join(dataDir, "reading.json");
const latestFile = path.join(dataDir, "latest.json");
const DAY = 86400000;
const MARKS = ["best", "quiet", ""];
const KINDS = ["reel", "photo", "video", "carousel"];

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
/** "@your-instagram/data/.work/gift.json" means "@gift.json". */
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

/** A raw Instagram id (a long run of digits for an account, a post or a comment) or a link. */
const RAW_ID = /\b\d{12,}\b|instagram\.com\//i;

/** A line the page can show: one sentence about their account, never about the reading itself. */
function checkLine(line) {
  if (!line) fail("refused, an empty line: say what that call found, or push nothing");
  // "$4" in double quotes reaches here as "": refuse what the shell ate.
  if (/(^|[\s(*])[,.]\d/.test(line)) fail("refused, a number lost its start (a $ in double quotes?): use single quotes");
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object|\{|\}/.test(line) || RAW_ID.test(line)) fail(`refused, the line is broken or carries a raw id: ${line}`);
  if (line.length > 200) fail("refused, the line is longer than 200 characters");
  if (/—/.test(line)) fail("refused, an em-dash: use a comma or a period");
  if (!/\*\*[^*]+\*\*/.test(line)) fail("refused, mark the finding in **bold**, like '**23 new comments** since yesterday'");
  if (/^(I|I'm|I've|Searching|Reading|Looking|Checking|Opening|Trying)\b/i.test(line.replace(/\*/g, ""))) fail("refused, a line about the reading: say what you found on their account");
  // "**0 comments**" is not a finding: a line whose numbers are all 0 says nothing.
  const bold = (line.match(/\*\*[^*]+\*\*/g) || []).join(" ");
  const nums = (bold.replace(/\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}/g, "").match(/\d[\d,.]*/g) || []);
  if (nums.length && nums.every((x) => Number(x.replace(/,/g, "")) === 0)) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
}

// ── What the page shows beside the lines: copied from Instagram's answers, checked here ──
/** Your own words for the page: no raw ids, no em-dash, nothing broken. */
function checkWords(text, what) {
  if (/—/.test(text)) fail(`refused, an em-dash in ${what}: use a comma or a period`);
  if (RAW_ID.test(text)) fail(`refused, a raw Instagram id or link in ${what}: write the name or the post`);
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object/.test(text)) fail(`refused, ${what} is broken: ${text}`);
}
/** A commenter's username as Instagram shows it, "@" first ("@maya.home"), never an address. */
function nameOf(value, what) {
  const raw = String(value || "").trim();
  const who = raw && !raw.startsWith("@") ? "@" + raw : raw;
  if (!raw) fail(`${what} needs who: the author's username as Instagram gave it`);
  if (who.length > 80) fail(`${what}: who is longer than 80 characters`);
  if (/\S@\S+\.\S/.test(who)) fail(`refused, ${what}: who is an email address. Give their Instagram username`);
  checkWords(who, what);
  return who;
}
/** A post's name on the page: the start of its caption in a few words, as the persona says. */
function titleOf(value, what) {
  const title = String(value || "").replace(/\s+/g, " ").trim();
  if (!title) fail(`${what} needs the post: the start of its caption, or "A reel from Oct 7"`);
  if (title.length > 120) fail(`${what}: the post's name is longer than 120 characters`);
  checkWords(title, what);
  return title;
}
/** When a comment was written, copied from its publishedAt, never a typed date. */
function atOf(value, days, what) {
  const at = new Date(String(value || ""));
  if (!value || isNaN(at.getTime())) fail(`${what}: at is the comment's timestamp as Instagram wrote it`);
  if (at.getTime() > Date.now() + 5 * 60000 || at.getTime() < Date.now() - days * DAY) fail(`refused, ${what} is not from the last ${days} days`);
  return iso(at);
}
function idOf(value, pattern, words, what) {
  const id = String(value || "").trim();
  if (!pattern.test(id)) fail(`${what}: ${words}`);
  return id;
}
function linkOf(value, what) {
  if (value === undefined || value === "" || value === null) return "";
  const link = String(value).trim();
  if (!/^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+\/?$/i.test(link)) fail(`${what}: link is the post's permalink as Instagram gave it (https://www.instagram.com/p/<code>/), or leave it out`);
  return link;
}
/** One line in your words, at most `max` characters; without numbers when `noNumbers`. */
function gistOf(value, max, noNumbers, what) {
  const gist = String(value || "").replace(/\s+/g, " ").trim();
  if (!gist) return "";
  if (gist.length > max) fail(`${what}: the gist is longer than ${max} characters`);
  if (noNumbers && /\d/.test(gist)) fail(`refused, a number in ${what}: say what they want, without numbers`);
  checkWords(gist, what);
  return gist;
}

// ── The newest comments: a few real ones, so the person sees their account within seconds ──
function recentOf(list) {
  if (!Array.isArray(list) || !list.length) fail("the newest comments are a JSON list of 1 to 5 comments");
  if (list.length > 5) fail("at most 5 newest comments");
  const seen = new Set();
  return list.map((m, i) => {
    const what = `comment ${i + 1}`;
    if (!m || typeof m !== "object" || Array.isArray(m)) fail(`${what} must be an object`);
    const out = { who: nameOf(m.who, what), post: titleOf(m.post, what), at: atOf(m.at, 14, what) };
    const gist = gistOf(m.gist, 120, false, what);
    if (!gist) fail(`${what} needs a gist: what it says, in a few of your own words`);
    out.gist = gist;
    const link = linkOf(m.link, what);
    if (link) out.link = link;
    const key = out.who + out.at + out.post;
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
  if (kind !== "waiting") fail(`the gift kind is waiting or calm, not "${kind}"`);
  const out = { kind, who: nameOf(g.who, "the gift"), post: titleOf(g.post, "the gift") };
  out.mediaId = idOf(g.mediaId, /^\d{5,32}$/, "mediaId is the post's id, as Instagram gave it (digits)", "the gift");
  out.commentId = idOf(g.commentId, /^\d{5,32}$/, "commentId is the comment's id, as Instagram gave it (digits)", "the gift");
  // When they asked comes from the comment's own timestamp, never a typed date.
  out.since = atOf(g.at || g.since, 14, "the gift");
  const link = linkOf(g.link, "the gift");
  if (link) out.link = link;
  // The gist is one line in your words: what they asked. No numbers, no quote of the comment.
  const gist = gistOf(g.gist, 140, true, "the gift");
  if (gist) out.gist = gist;
  return out;
}

// ── More things to do now, under the gift: each one ideas or a draft in the chat ──
const OFFER_KINDS = ["asked", "next"];
const MAX_OFFERS = 2;
function offerOf(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) fail("the offer must be an object");
  const kind = String(o.kind || "");
  if (!OFFER_KINDS.includes(kind)) fail(`the offer kind is ${OFFER_KINDS.join(", ")}, not "${kind}"`);
  const out = { kind };
  if (kind === "asked") {
    out.what = gistOf(o.what, 100, false, "the asked offer");
    if (!out.what) fail("the asked offer needs what: the question, in a few plain words");
    const n = Number(o.people);
    if (!Number.isInteger(n) || n < 2) fail("people is how many different people asked it, at least 2");
    out.people = n;
  }
  return out;
}

/** latest.json in the page's own shape: a row the page cannot show is refused here. */
function latestOf(l) {
  if (!l || typeof l !== "object" || Array.isArray(l)) fail("latest.json must be an object");
  if (!Array.isArray(l.posts)) fail("latest.json needs posts (an empty list on a new account)");
  for (const key of ["waiting", "recent", "asks", "next", "known"]) {
    if (l[key] !== undefined && !Array.isArray(l[key])) fail(`latest.json: ${key} is a list (leave it out, or [] when there is none)`);
  }
  l.posts.forEach((v, i) => {
    if (!v || typeof v !== "object" || typeof v.title !== "string" || !v.title.trim()) fail(`posts[${i}] needs a title: the start of its caption`);
    if (v.mark !== undefined && !MARKS.includes(v.mark)) fail(`posts[${i}].mark is best, quiet or "", not "${v.mark}"`);
    if (v.kind !== undefined && !KINDS.includes(v.kind)) fail(`posts[${i}].kind is ${KINDS.join(", ")}, not "${v.kind}"`);
    const others = v.viewerComments;
    if (others !== undefined && !(Number.isInteger(others) && others >= 0)) fail(`posts[${i}].viewerComments is a whole number, 0 or more`);
    if (Number.isInteger(others) && Number.isInteger(v.comments) && others > v.comments) fail(`posts[${i}].viewerComments is at most its comments: the account's own are left out, never added`);
    if (!v.id) v.id = "p" + (i + 1);
  });
  for (const mark of ["best", "quiet"]) {
    if (l.posts.filter((v) => v.mark === mark).length > 1) fail(`only one post is ${mark}`);
  }
  if (l.insights !== undefined) insightsOf(l.insights);
  const n = new Date();
  l.schema = LATEST_SCHEMA;
  l.generatedAt = iso(n);
  if (!l.since) l.since = iso(dayStart(-1));
  delete l.example;
  delete l.headline;
  return l;
}

/**
 * Instagram's numbers (insights) in the page's shape: ok with until and the spans, or ok:false
 * with why. A number Instagram left empty is null, never a 0 and never a guess.
 */
function insightsOf(a) {
  if (!a || typeof a !== "object" || Array.isArray(a)) fail("insights is an object: {\"ok\": true, ...} or {\"ok\": false, \"why\": ...}");
  if (a.ok === false) {
    if (!["not-allowed", "unavailable"].includes(a.why)) fail(`insights.why is not-allowed or unavailable, not "${a.why}"`);
    return;
  }
  if (a.ok !== true) fail("insights.ok is true or false");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(a.until || ""))) fail("insights.until is the last day Instagram has numbers for, YYYY-MM-DD");
  const whole = (v) => Number.isInteger(v) && v >= 0;
  const wholeOrNull = (v) => v === null || v === undefined || whole(v);
  for (const key of ["last7", "last28"]) {
    const s = a[key];
    if (!s || typeof s !== "object") fail(`insights.${key} is missing`);
    for (const f of ["views", "reach", "engaged", "interactions", "likes", "comments", "saves", "shares", "linkTaps"]) {
      if (!wholeOrNull(s[f])) fail(`insights.${key}.${f} is a whole number from Instagram's answer, or null when it sent none`);
    }
    if (!(s.newFollowers === null || s.newFollowers === undefined || Number.isInteger(s.newFollowers))) fail(`insights.${key}.newFollowers is a whole number, or null under 100 followers`);
  }
  if (!Array.isArray(a.daily) || !a.daily.every((x) => x && /^\d{4}-\d{2}-\d{2}$/.test(String(x.day)) && whole(x.reach))) fail(`insights.daily is a list of {"day", "reach"}`);
  if (a.online != null && !(Array.isArray(a.online) && a.online.every((x) => x && whole(x.hour) && x.hour < 24 && whole(x.followers)))) fail(`insights.online is a list of {"hour", "followers"}, hour 0 to 23, or null`);
  if (a.countries != null && !(Array.isArray(a.countries) && a.countries.every((x) => x && /^[A-Z]{2}$/.test(String(x.code)) && whole(x.followers)))) fail(`insights.countries is a list of {"code", "followers"}, code like "US", or null`);
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
} else if (cmd === "recent") {
  const recent = recentOf(workJson(args.join(" ").trim(), "the newest comments"));
  lockReading();
  const r = readReading();
  if (r.done) fail("the reading is done: the newest comments come while you read");
  if (r.recent) fail("the newest comments are there already: once is enough");
  r.recent = recent;
  writeJson(readingFile, r);
  console.log(`newest comments: ${recent.length}`);
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
} else if (cmd === "latest") {
  const [file, ...why] = args;
  const l = latestOf(workJson(String(file || "").trim(), "latest.json"));
  const n = new Date();
  writeJson(latestFile, l);
  // The same catch-up under today's date for the picker, and day files past 30 days go.
  const days = path.join(dataDir, "days");
  fs.mkdirSync(days, { recursive: true });
  writeJson(path.join(days, ymd(n) + ".json"), l);
  const oldest = ymd(dayStart(-30));
  for (const f of fs.readdirSync(days)) if (/^\d{4}-\d{2}-\d{2}\.json$/.test(f) && f.slice(0, 10) < oldest) fs.rmSync(path.join(days, f), { force: true });
  // "@why.txt" reads the note from data/.work/, for a note no shell can quote ("Instagram's limit").
  const said = why.join(" ").trim();
  const note = (/^@[\w.-]+$/.test(said) ? fs.readFileSync(workFile(said.slice(1)), "utf8") : said).replace(/\s+/g, " ").trim().slice(0, 200);
  writeJson(path.join(dataDir, "status.json"), { at: iso(n), ok: true, ...(note ? { why: note } : {}) });
  console.log(`latest.json written (${l.posts.length} posts), days/${ymd(n)}.json and status.json`);
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
