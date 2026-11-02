#!/usr/bin/env node
// Every number the page shows comes through here, on every catch-up, and the agent adds only its
// own words. Every file the page reads is written here too, whole or not at all, so a broken
// catch-up never replaces a good one. Run it from anywhere:
//   node <app>/first-read.mjs start [--morning]     empty data/.work/ for this run's files; the first
//                                                   catch-up also starts data/reading.json, a later
//                                                   one says --morning and shows no reading
//   node <app>/first-read.mjs cursor @<file>        the next page's cursor from a video/list answer,
//                                                   or "none"
//   node <app>/first-read.mjs compute @user.json @videos.json [@videos-2.json]
//                                                   counts everything from TikTok's answers as they
//                                                   came (curl -o into data/.work/): published,
//                                                   gained, totals, spans, history, known, works and
//                                                   mark. Prints what it found, the only numbers you
//                                                   may use, and keeps it in data/.work/computed.json.
//                                                   A failed read writes status.json and exits 4: stop.
//   node <app>/first-read.mjs latest @<file> [@why.txt] your words added to what compute counted, checked,
//                                                   then data/latest.json, today's day file and
//                                                   data/status.json. The file is
//                                                   {"videos":[{"id":"v1","gist":"..."}],"next":[...]};
//                                                   a partial run's why: data/.work/why.txt
//   node <app>/first-read.mjs fail <kind> [@why.txt]  the run could not read TikTok: writes status.json,
//                                                   keeps latest.json. kind is signed-out, not-connected,
//                                                   rate-limited, unreachable or other
//   node <app>/first-read.mjs done                  marks a reading done, deletes data/.work/
// Only on the first catch-up, for the person watching (compute writes the files):
//   node <app>/first-read.mjs push '<line>'         add one line (single quotes: "$" stays "$", in bash
//                                                   and PowerShell alike), right after the TikTok call
//                                                   that found it. A line with an apostrophe: write it
//                                                   to data/.work/line.txt and push @line.txt
//   node <app>/first-read.mjs recent @recent.json   the newest videos, shown at once
//   node <app>/first-read.mjs gift @gift.json       the one thing for the person, shown while you read
//   node <app>/first-read.mjs offer @offer-next.json  one more thing they can do now, at most 2
//                                                   (@offer-quiet.json is there on a day with a quiet video)
// A line is one short sentence about their account, the finding in **bold**:
//   "**Sourdough starter in 5 days**: 412,600 views"
// Every number in it is one TikTok answered or compute printed, never a guess.
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
/** The newest videos the page lists. */
const ROWS = 10;
/** What the What works box looks at, and the fewest videos a group may show. */
const WORKS_VIDEOS = 40;
const WORKS_MIN_GROUP = 3;
/** Younger than this a video is still climbing: its total says little yet. */
const CLIMBING_DAYS = 3;
const KNOWN_MAX = 400;
const HISTORY_MAX = 30;

// ── Time, in this machine's zone (the person's own) ──
const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, "0");
const hhmm = (d) => pad(d.getHours()) + ":" + pad(d.getMinutes());
const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
function offsetOf(d) { const o = -d.getTimezoneOffset(); return (o >= 0 ? "+" : "-") + pad(o / 60) + ":" + pad(o % 60); }
function iso(d) { return ymd(d) + "T" + hhmm(d) + ":" + pad(d.getSeconds()) + offsetOf(d); }
/** Midnight, `days` from today, in local time (safe across a clock change). */
function dayStart(days, from = new Date()) { const d = new Date(from); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + days); return d; }
function timeZone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; } }

/** A refusal: the command stops and says why, and nothing more is written. */
class Stop extends Error {}
function fail(msg) { throw new Stop(msg); }
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
    try { fs.mkdirSync(lock); break; } catch (e) {
      // Only a lock already there is worth waiting for: a missing or read-only folder never clears.
      if (e?.code !== "EEXIST") fail(`cannot write in ${path.relative(process.cwd(), dataDir)}: ${e?.code || e}`);
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
  if (!/\*\*[^*]+\*\*/.test(line)) fail("refused, mark the finding in **bold**, like '**48,200 followers**, up from last month'");
  if (/^(I|I'm|I've|Searching|Reading|Looking|Checking|Opening|Trying)\b/i.test(line.replace(/\*/g, ""))) fail("refused, a line about the reading: say what you found on their account");
  // "**0 views**" is not a finding: a line whose numbers are all 0 says nothing.
  const bold = (line.match(/\*\*[^*]+\*\*/g) || []).join(" ");
  const nums = (bold.replace(/\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}/g, "").match(/\d[\d,.]*/g) || []);
  if (nums.length && nums.every((x) => Number(x.replace(/,/g, "")) === 0)) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
  const allowed = numbersSoFar();
  if (allowed) checkNumbers(line, allowed, "the line", 100);
}

// ── Numbers the agent may say: only ones TikTok answered or compute printed ──
function numbersIn(words) {
  return (String(words).replace(/(\d),(?=\d{3})/g, "$1").match(/\d+(?:\.\d+)?/g) || []).map(Number);
}
function checkNumbers(words, allowed, what, floor = 0) {
  for (const n of numbersIn(words)) {
    if (n >= floor && !allowed.has(n)) fail(`refused, ${n} in ${what} is not a number from this catch-up: use one compute printed, or say it in words`);
  }
}
/** The numbers of this run so far: all of compute's, or before it the profile's. Null before any call. */
function numbersSoFar() {
  const read = (name) => { try { return fs.readFileSync(path.join(workDir, name), "utf8"); } catch { return null; } };
  const computed = read("computed.json");
  if (computed) return new Set(numbersIn(JSON.parse(computed).sheet));
  // Before compute, a line may carry any number TikTok answered: the profile and the saved video pages.
  const answers = ["user.json", "videos.json", "videos-2.json"].map(read).filter((t) => t !== null);
  return answers.length ? new Set(answers.flatMap((t) => numbersIn(t))) : null;
}

// ── What the page shows beside the lines: copied from TikTok's answers, checked here ──
/** Words for the page: no raw ids, no long dash, nothing broken. */
function checkWords(text, what) {
  if (/[—–]/.test(text)) fail(`refused, a long dash in ${what}: use a comma or a period`);
  if (RAW_ID.test(text)) fail(`refused, a raw TikTok id or link in ${what}: write the title`);
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object/.test(text)) fail(`refused, ${what} is broken: ${text}`);
}
/**
 * A title for the page. People write titles, so a title is cleaned, never refused: a long dash
 * turns into a comma, a link or a raw id goes, and a title that is only a broken word is no title.
 * "null" inside a real title ("The null hypothesis of bread") stays. Cut at 120, as the page cuts it.
 */
export function cleanTitle(value, max = 120) {
  let title = String(value ?? "").replace(/\[object \w+\]/g, " ");
  title = title.replace(/https?:\/\/\S+|\S*tiktok\.com\/\S*/gi, " ").replace(/\b\d{15,}\b/g, " ").replace(/\bopen_id\b/gi, " ");
  title = title.replace(/\s*[—–]+\s*/g, ", ").replace(/\s+/g, " ").replace(/^[,\s]+|[,\s]+$/g, "").replace(/\s+,/g, ",");
  if (/^(null|undefined|nan)$/i.test(title)) return "";
  return title.length > max ? title.slice(0, max).replace(/\s+\S*$/, "").replace(/[,\s]+$/, "") : title;
}
/** A video's title, or its caption's first words, as the persona says. */
function titleOf(value, what) {
  const title = cleanTitle(value);
  if (!title) fail(`${what} needs the video's title, or its caption's first words`);
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
/** At most 5: the page's cleanRecent keeps no more. An account with no videos sends []. */
function recentOf(list) {
  if (!Array.isArray(list)) fail("the newest videos are a JSON list of up to 5 videos, [] when there are none");
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
export function giftOf(g) {
  if (!g || typeof g !== "object" || Array.isArray(g)) fail("the gift must be an object");
  const kind = String(g.kind || "");
  // calm: no videos at all. early: videos, but none with a day and a view behind it yet.
  if (kind === "calm" || kind === "early") return { kind };
  if (kind !== "best") fail(`the gift kind is best, early or calm, not "${kind}"`);
  const out = { kind, video: titleOf(g.video, "the gift"), views: countOf(g.views, "the gift") };
  if (!out.views) fail("refused, the gift's video has no views yet: give early");
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

// ── TikTok's answers, as curl saved them ──
const WHY = {
  "not-connected": "TikTok isn't connected yet.",
  "signed-out": "TikTok needs a new sign-in.",
  "rate-limited": "TikTok asked Cabinet to slow down. Try again in a few minutes.",
  unreachable: "TikTok could not be reached. Try again in a moment.",
  other: "The catch-up could not read TikTok."
};
/** What went wrong with an answer, or null when it is a good one. `signed-out` is the relay's word on a 401. */
export function troubleOf(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "unreachable";
  const code = raw.error && typeof raw.error === "object" ? String(raw.error.code || "ok") : "ok";
  if (code === "ok") return null;
  if (code === "signed-out" || code === "access_token_invalid" || code === "scope_not_authorized") return "signed-out";
  if (code === "not-connected") return "not-connected";
  if (code === "rate_limit_exceeded") return "rate-limited";
  if (code === "unreachable") return "unreachable";
  return "other";
}
const whole = (value) => (Number.isFinite(Number(value)) && Number(value) > 0 ? Math.round(Number(value)) : 0);
function median(values) {
  const v = values.slice().sort((a, b) => a - b);
  if (!v.length) return 0;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}
const oneDecimal = (n) => Math.round(n * 10) / 10;
const words = (n) => Number(n).toLocaleString("en-US");
const usable = (d) => !!d && typeof d === "object" && !d.example && Array.isArray(d.videos);
const handleOf = (d) => String(d?.account?.handle || "").toLowerCase();
/** A written time; "+0300" as `date +%z` prints it reads like "+03:00". */
const timeOf = (value) => new Date(String(value || "").replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));

/** One video as the page and the counting want it, or null without an id or a posting time. */
function readVideo(v, now) {
  const time = Number(v?.create_time);
  if (!v || !v.id || !Number.isFinite(time) || time <= 0) return null;
  const at = new Date(time * 1000);
  const caption = String(v.video_description || "").replace(/(^|\s)#\S+/g, " ");
  const out = {
    videoId: String(v.id),
    title: cleanTitle(v.title) || cleanTitle(caption, 80),
    published: iso(at),
    duration: whole(v.duration),
    views: whole(v.view_count), likes: whole(v.like_count), comments: whole(v.comment_count), shares: whole(v.share_count),
    url: linkOr(v.share_url)
  };
  Object.defineProperty(out, "ageHours", { value: (now - at) / 3600000 });
  return out;
}
function linkOr(value) {
  const link = String(value || "").trim();
  return /^https:\/\/(www\.|m\.|vm\.|vt\.)?tiktok\.com\/\S+$/i.test(link) && link.length <= 400 ? link : "";
}

/**
 * The read this one is compared with. The last catch-up, unless that was today: then a second
 * press of Catch up now stays against the day before, so nothing counts twice and today's day
 * file holds one honest day. Another account's reads compare with nothing.
 */
function baselineOf(prev, earlier, handle, today) {
  const mine = (d) => (usable(d) && handleOf(d) === handle ? d : null);
  const last = mine(prev);
  if (!last) return null;
  const lastAt = timeOf(last.generatedAt);
  return !isNaN(lastAt) && ymd(lastAt) === today ? mine(earlier) || last : last;
}

/** Median views by length, posting day and posting time, over videos old enough to compare. */
function worksOf(read) {
  const pool = read.filter((v) => v.ageHours >= CLIMBING_DAYS * 24).slice(0, WORKS_VIDEOS);
  const hasRate = pool.filter((v) => v.views >= 100);
  const group = (buckets, pick) => buckets.map((label, i) => {
    const views = pool.filter((v) => pick(v) === i).map((v) => v.views);
    return { label, videos: views.length, median: Math.round(median(views)) };
  }).filter((g) => g.videos >= WORKS_MIN_GROUP);
  const rate = (k) => oneDecimal(median(hasRate.map((v) => (v[k] / v.views) * 1000)));
  return {
    videos: pool.length,
    usual: { views: Math.round(median(pool.map((v) => v.views))), shares: rate("shares"), comments: rate("comments") },
    length: group(["Under 30 seconds", "30 to 60 seconds", "1 to 3 minutes", "Over 3 minutes"],
      (v) => (v.duration < 30 ? 0 : v.duration < 60 ? 1 : v.duration <= 180 ? 2 : 3)),
    // Monday first, as a week reads.
    weekday: group(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      (v) => (new Date(v.published).getDay() + 6) % 7),
    hour: group(["Morning, 5 to noon", "Afternoon, noon to 5", "Evening, 5 to 9", "Night, 9 to 5"], (v) => {
      const h = new Date(v.published).getHours();
      return h >= 5 && h < 12 ? 0 : h >= 12 && h < 17 ? 1 : h >= 17 && h < 21 ? 2 : 3;
    })
  };
}

const nameOf = (v) => v.title || "Your video from " + new Date(v.published).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** The moved most, by views gained, or on a first read by views per day, never on its first day. */
function pickBest(read, first) {
  const pool = read.filter((v) => (first ? v.views > 0 && v.ageHours >= 24 : (v.gained?.views || 0) > 0));
  const score = (v) => (first ? v.views / (v.ageHours / 24) : v.gained.views);
  return pool.reduce((top, v) => (!top || score(v) > score(top) ? v : top), null);
}
/** The fewest total views among videos 7 to 60 days old, when that is under half the group's middle. */
function pickQuiet(read, best) {
  const pool = read.filter((v) => v.ageHours >= 7 * 24 && v.ageHours <= 60 * 24);
  if (pool.length < 3) return null;
  const low = pool.reduce((m, v) => (v.views < m.views ? v : m));
  return low !== best && low.views < median(pool.map((v) => v.views)) / 2 ? low : null;
}

/**
 * Everything the page's numbers come from, counted from TikTok's answers and the earlier reads.
 * `prev` is latest.json, `earlier` the last day file before today. Pure: tests give it a clock.
 */
export function computeRead({ user, videos, hasMore = false, note = "", prev = null, earlier = null, now = new Date() }) {
  const today = ymd(now);
  const handle = user.username ? "@" + String(user.username).replace(/^@/, "") : "";
  const account = {
    name: cleanTitle(user.display_name) || handle, handle,
    followers: whole(user.follower_count), following: whole(user.following_count), likes: whole(user.likes_count),
    videos: whole(user.video_count), verified: user.is_verified === true, url: linkOr(user.profile_deep_link)
  };
  const seen = new Set();
  const read = videos.map((v) => readVideo(v, now)).filter((v) => v && !seen.has(v.videoId) && seen.add(v.videoId))
    .sort((a, b) => new Date(b.published) - new Date(a.published));

  const same = usable(prev) && handleOf(prev) === handle.toLowerCase() ? prev : null;
  const base = baselineOf(prev, earlier, handle.toLowerCase(), today);
  const first = !base;
  const since = first ? dayStart(-1, now) : timeOf(base.generatedAt);
  const baseKnown = new Map((base?.known || []).filter((k) => k?.videoId).map((k) => [String(k.videoId), k]));
  const lastKnown = new Map((same?.known || []).filter((k) => k?.videoId).map((k) => [String(k.videoId), k]));

  // A video in known always subtracts. Only one missing from it, posted since that read, counts
  // whole. An older one never read before says nothing about this window, so it gains nothing.
  if (!first) for (const v of read) {
    const was = baseKnown.get(v.videoId);
    if (was) v.gained = Object.fromEntries(COUNTS.map((k) => [k, Math.max(0, v[k] - whole(was[k]))]));
    else if (new Date(v.published) >= since) v.gained = Object.fromEntries(COUNTS.map((k) => [k, v[k]]));
  }

  // Views at the first read after a day, kept for good: the one first-day number TikTok allows.
  const day1 = new Map();
  for (const v of read) {
    const saved = lastKnown.get(v.videoId)?.day1;
    if (saved) day1.set(v.videoId, saved);
    else if (v.ageHours >= 24 && v.ageHours < 72) day1.set(v.videoId, { views: v.views, hours: Math.round(v.ageHours) });
  }
  for (const [id, k] of lastKnown) if (k.day1 && !day1.has(id)) day1.set(id, k.day1);

  const best = pickBest(read, first);
  const quiet = pickQuiet(read, best);
  const rows = read.slice(0, ROWS);
  for (const v of [best, quiet]) if (v && !rows.includes(v)) { v.older = true; rows.push(v); }
  rows.forEach((v, i) => {
    v.id = "v" + (i + 1);
    v.mark = v === best ? "best" : v === quiet ? "quiet" : "";
    const mine = day1.get(v.videoId);
    const others = [...day1].filter(([id]) => id !== v.videoId).map(([, d]) => d.views);
    if (mine && others.length >= 3) {
      const usual = Math.round(median(others));
      v.firstDay = { views: mine.views, usual, pace: mine.views >= usual * 1.25 ? "ahead" : mine.views <= usual * 0.75 ? "behind" : "even" };
    }
  });

  const totals = { newVideos: read.filter((v) => new Date(v.published) >= since).length };
  if (!first) {
    for (const k of COUNTS) totals[k] = read.reduce((m, v) => m + (v.gained?.[k] || 0), 0);
    totals.followers = account.followers - whole(base.account?.followers);
  }

  const spanOf = (days) => {
    const from = ymd(dayStart(-(days - 1), now));
    const inSpan = read.filter((v) => ymd(new Date(v.published)) >= from);
    const out = { from, videos: inSpan.length };
    for (const k of COUNTS) out[k] = inSpan.reduce((m, v) => m + v[k], 0);
    out.top = inSpan.slice().sort((a, b) => b.views - a.views).slice(0, 4).map((v) => {
      const t = { videoId: v.videoId, title: v.title, published: v.published, views: v.views };
      if (v.url) t.url = v.url;
      return t;
    });
    return out;
  };
  const spans = { last7: spanOf(7), last28: spanOf(28) };
  const oldest = read[read.length - 1];
  if (hasMore && oldest && ymd(new Date(oldest.published)) >= spans.last28.from) spans.last28.partial = true;

  const entry = { day: today, followers: account.followers, following: account.following, likes: account.likes, videos: account.videos };
  if (!first) entry.viewsGained = totals.views;
  const history = [...(same?.history || []).filter((h) => h?.day && h.day !== today), entry].slice(-HISTORY_MAX);

  // Every video read, then what earlier reads knew of the others (a video this run did not reach).
  const at = iso(now);
  const known = read.map((v) => {
    const k = { videoId: v.videoId, views: v.views, likes: v.likes, comments: v.comments, shares: v.shares, at };
    if (day1.has(v.videoId)) k.day1 = day1.get(v.videoId);
    return k;
  });
  for (const [id, k] of lastKnown) if (!seen.has(id)) known.push(k);

  const out = {
    schema: LATEST_SCHEMA, generatedAt: at, since: iso(since), timeZone: timeZone(), account, totals, spans, history,
    works: worksOf(read), videos: rows, next: [], known: known.slice(0, KNOWN_MAX)
  };
  return { latest: out, first, note, sheet: sheetOf(out, read, first), lastNext: (same?.next || []).map((n) => String(n?.title || "")).filter(Boolean) };
}

/** What compute prints: the facts for the agent's words, and the only numbers it may use. */
function sheetOf(l, read, first) {
  const a = l.account;
  const rate = (n, of) => (of ? oneDecimal((n / of) * 1000) : 0);
  const lines = [
    `Account: ${a.name}, ${a.handle}, ${words(a.followers)} followers, ${words(a.following)} following, ${words(a.likes)} likes, ${words(a.videos)} videos.`,
    first ? "First catch-up: nothing to compare with yet." : `Since the last read: ${words(l.totals.views)} views, ${words(l.totals.likes)} likes, ${words(l.totals.comments)} comments, ${words(l.totals.shares)} shares, ${l.totals.followers} followers.`,
    `Videos read: ${read.length}. The newest ${Math.min(read.length, ROWS)}: ${words(read.slice(0, ROWS).reduce((m, v) => m + v.views, 0))} views between them. Posted in the window: ${l.totals.newVideos}.`,
    `Usual: ${words(l.works.usual.views)} views, ${l.works.usual.shares} shares and ${l.works.usual.comments} comments per 1,000 views.`
  ];
  for (const v of l.videos) {
    const age = Math.floor(read.find((r) => r.videoId === v.videoId).ageHours / 24);
    lines.push(`${v.id}${v.mark ? " [" + v.mark + "]" : ""}${v.older ? " [older]" : ""} "${nameOf(v)}", ${age} days old, ${v.duration} seconds: ${words(v.views)} views, ${words(v.likes)} likes, ${words(v.comments)} comments, ${words(v.shares)} shares` +
      (v.gained ? `, gained ${words(v.gained.views)} views, ${words(v.gained.likes)} likes, ${words(v.gained.comments)} comments, ${words(v.gained.shares)} shares` : "") +
      `, ${rate(v.shares, v.views)} shares and ${rate(v.comments, v.views)} comments per 1,000 views` +
      (v.firstDay ? `, ${words(v.firstDay.views)} views after its first day against your usual ${words(v.firstDay.usual)} (${v.firstDay.pace})` : "") + ".");
  }
  return lines.join("\n");
}

// ── The agent's words on top of what was counted ──
const titleKey = (t) => String(t).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
/** Takes only the gists and the ideas from the agent's file: no number it typed reaches the page. */
export function wordsOn(c, w) {
  if (!w || typeof w !== "object" || Array.isArray(w)) fail('your words are {"videos":[{"id":"v1","gist":"..."}],"next":[...]}');
  const l = structuredClone(c.latest);
  const allowed = new Set(numbersIn(c.sheet));
  const refs = new Map(l.videos.map((v) => [v.id, v]));
  for (const item of Array.isArray(w.videos) ? w.videos : []) {
    const v = refs.get(String(item?.id));
    if (!v) fail(`there is no video ${item?.id}: use the ids compute printed`);
    const gist = String(item.gist || "").replace(/\s+/g, " ").trim();
    if (!gist) continue;
    if (gist.length > 120) fail(`${v.id}'s gist is longer than 120 characters`);
    checkWords(gist, `${v.id}'s gist`);
    checkNumbers(gist, allowed, `${v.id}'s gist`);
    if (/\bfirst day\b|\bon pace\b/i.test(gist) && !v.firstDay) fail(`refused, ${v.id} has no first-day number yet: say something else`);
    v.gist = gist;
  }
  const next = Array.isArray(w.next) ? w.next : [];
  if (next.length > 3) fail("at most 3 ideas");
  const said = new Set(c.lastNext.map(titleKey));
  l.next = next.map((idea, i) => {
    const title = String(idea?.title || "").replace(/\s+/g, " ").trim();
    const why = String(idea?.why || "").replace(/\s+/g, " ").trim();
    if (!title || !why) fail(`idea ${i + 1} needs a title and a why`);
    if (title.length > 120 || why.length > 200) fail(`idea ${i + 1} is too long: a title is at most 120 characters, a why 200`);
    checkWords(title, `idea ${i + 1}'s title`);
    checkWords(why, `idea ${i + 1}'s why`);
    checkNumbers(why, allowed, `idea ${i + 1}'s why`);
    const from = refs.get(String(idea?.from || ""));
    if (idea?.from && !from) fail(`idea ${i + 1}: from is a video id compute printed, or leave it out`);
    // Yesterday's idea comes back only when something new backs it.
    if (said.has(titleKey(title)) && !(from && (from.mark === "best" || new Date(from.published) >= new Date(l.since)))) {
      fail(`refused, "${title}" was an idea last time and nothing new backs it: give another, or build it on the video that moved`);
    }
    const out = { id: "n" + (i + 1), title, why };
    if (from) out.from = from.id;
    return out;
  });
  return l;
}

/** latest.json in the page's own shape: checked on every catch-up, so a row the page cannot show is refused. */
export function latestOf(l) {
  if (!l || typeof l !== "object" || Array.isArray(l)) fail("latest.json must be an object");
  if (!Array.isArray(l.videos)) fail("latest.json needs videos (an empty list on a new account)");
  for (const key of ["next", "known", "history"]) {
    if (l[key] !== undefined && !Array.isArray(l[key])) fail(`latest.json: ${key} is a list (leave it out, or [] when there is none)`);
  }
  if (!l.account || typeof l.account !== "object") fail("latest.json needs account, copied from user/info");
  l.videos.forEach((v, i) => {
    if (!v || typeof v !== "object") fail(`videos[${i}] must be an object`);
    if (typeof v.title !== "string") fail(`videos[${i}].title is a string ("" when the video has no title or caption)`);
    for (const k of COUNTS) if (v[k] !== undefined && !(Number.isInteger(v[k]) && v[k] >= 0)) fail(`videos[${i}].${k} is a whole number copied from TikTok`);
    if (v.mark !== undefined && !MARKS.includes(v.mark)) fail(`videos[${i}].mark is best, quiet or "", not "${v.mark}"`);
  });
  for (const mark of ["best", "quiet"]) {
    if (l.videos.filter((v) => v.mark === mark).length > 1) fail(`only one video is ${mark}`);
  }
  for (const key of ["last7", "last28"]) {
    const s = l.spans && l.spans[key];
    if (!s || typeof s !== "object") fail(`spans.${key} is missing`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s.from || ""))) fail(`spans.${key}.from is a day, YYYY-MM-DD`);
    for (const k of ["videos", ...COUNTS]) if (!(Number.isInteger(s[k]) && s[k] >= 0)) fail(`spans.${key}.${k} is a whole number`);
  }
  (l.history || []).forEach((h, i) => {
    if (!h || !/^\d{4}-\d{2}-\d{2}$/.test(String(h.day || ""))) fail(`history[${i}].day is YYYY-MM-DD`);
  });
  delete l.example;
  return l;
}

// ── Files ──
function tryJson(file) { try { return readJson(file); } catch { return null; } }
/** The last day file before today: what a second catch-up today is compared with. */
function dayBefore(today) {
  const days = path.join(dataDir, "days");
  if (!fs.existsSync(days)) return null;
  const names = fs.readdirSync(days).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f) && f.slice(0, 10) < today).sort();
  return names.length ? tryJson(path.join(days, names[names.length - 1])) : null;
}
function finishReading() {
  if (!fs.existsSync(readingFile)) return;
  lockReading();
  const r = tryJson(readingFile);
  if (r && !r.done) { r.done = true; writeJson(readingFile, r); }
}
/** The run could not read TikTok: latest.json stays as it was and the page shows why. */
function failRun(kind, why) {
  if (!WHY[kind]) fail(`the kind is ${Object.keys(WHY).join(", ")}, not "${kind}"`);
  fs.mkdirSync(dataDir, { recursive: true });
  writeJson(path.join(dataDir, "status.json"), { at: iso(new Date()), ok: false, kind, why: String(why || WHY[kind]).replace(/\s+/g, " ").trim().slice(0, 200) });
  finishReading();
  console.log(`status.json written (${kind}). latest.json is as it was. Stop here.`);
  if (kind === "signed-out") console.log("NEEDS_CONNECTION: tiktok | TikTok needs a new sign-in");
  process.exitCode = 4;
}
function answer(arg) {
  const name = String(arg || "").replace(/^@/, "").replace(/^.*data[\\/]\.work[\\/]/, "");
  try { return JSON.parse(fs.readFileSync(path.resolve(workDir, path.basename(name)), "utf8")); } catch { return null; }
}
/** The ready-made files for the first catch-up's reading, so no number passes through typing. */
function writeReadingFiles(c) {
  const l = c.latest;
  const put = (name, value) => writeJson(path.join(workDir, name), value);
  const link = (v) => (v.url ? { link: v.url } : {});
  put("recent.json", l.videos.filter((v) => !v.older).slice(0, 5).map((v) => ({ title: nameOf(v), at: v.published, views: v.views, ...link(v) })));
  const best = l.videos.find((v) => v.mark === "best");
  const quiet = l.videos.find((v) => v.mark === "quiet");
  put("gift.json", best ? { kind: "best", video: nameOf(best), views: best.views, at: best.published, ...link(best) } : { kind: l.videos.length ? "early" : "calm" });
  if (l.videos.length) put("offer-next.json", { kind: "next" });
  if (quiet) put("offer-quiet.json", { kind: "quiet", video: nameOf(quiet) });
}
function compute(args) {
  const [userArg, ...pageArgs] = args;
  if (!userArg || !pageArgs.length) fail("use compute @user.json @videos.json [@videos-2.json]");
  const userRaw = answer(userArg);
  const stop = troubleOf(userRaw);
  if (stop) return failRun(stop);
  if (!userRaw.data?.user) return failRun("other");
  const pages = pageArgs.map(answer);
  // The first page decides: without it nothing is written, whatever the account holds.
  const stopFirst = troubleOf(pages[0]);
  if (stopFirst) return failRun(stopFirst);
  const good = pages.filter((p) => !troubleOf(p));
  const videos = good.flatMap((p) => (Array.isArray(p.data?.videos) ? p.data.videos : []));
  const user = userRaw.data?.user || {};
  const now = new Date();
  const prev = tryJson(latestFile);
  const hadVideos = usable(prev) && prev.videos.length > 0;
  let note = good.length < pages.length ? `Only your newest ${videos.length === 1 ? "video was" : videos.length + " videos were"} read this time.` : "";
  if (!videos.length && whole(user.video_count) > 0) {
    if (hadVideos) return failRun("other", "TikTok sent no videos this time. Try again in a moment.");
    note = "TikTok sent none of your videos. Only public videos can be read.";
  }
  const hasMore = good.length < pages.length || good[good.length - 1].data?.has_more === true;
  const c = computeRead({ user, videos, hasMore, note, prev, earlier: dayBefore(ymd(now)), now });
  writeJson(path.join(workDir, "computed.json"), c);
  writeReadingFiles(c);
  console.log(c.sheet);
  if (c.lastNext.length) console.log("Last ideas: " + c.lastNext.join("; "));
}

function main(argv) {
  const [cmd, ...args] = argv;
  if (cmd === "start") {
    fs.rmSync(workDir, { recursive: true, force: true });
    if (args[0] === "--morning") {
      fs.mkdirSync(workDir, { recursive: true });
      console.log("ready; write your files in " + path.relative(process.cwd(), workDir));
      return;
    }
    // Later catch-ups are told the usual way: the reading is only for the first one.
    if (fs.existsSync(latestFile)) fail("data/latest.json is there, so this is not the first catch-up: use start --morning");
    fs.mkdirSync(workDir, { recursive: true });
    lockReading();
    writeJson(readingFile, { schema: `${SCHEMA}/reading@1`, startedAt: iso(new Date()), done: false, lines: [] });
    console.log("reading started; write your files in " + path.relative(process.cwd(), workDir));
  } else if (cmd === "cursor") {
    const data = answer(args[0])?.data;
    console.log(data?.has_more === true && data.cursor !== undefined ? String(data.cursor) : "none");
  } else if (cmd === "compute") {
    compute(args);
  } else if (cmd === "fail") {
    const [kind, why] = args;
    failRun(kind, why ? workText(why) : "");
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
    const c = tryJson(path.join(workDir, "computed.json"));
    if (!c) fail("run compute first: latest adds your words to what it counted");
    const l = latestOf(wordsOn(c, workJson(String(file || "").trim(), "your words")));
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
    const note = (workText(why.join(" ")).replace(/\s+/g, " ").trim() || c.note || "").slice(0, 200);
    writeJson(path.join(dataDir, "status.json"), { at: iso(n), ok: true, ...(note ? { why: note } : {}) });
    console.log(`latest.json written (${l.videos.length} videos), days/${ymd(n)}.json and status.json`);
  } else if (cmd === "done") {
    finishReading();
    try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("data/.work/ is busy: delete it in your next call"); }
    console.log("done");
  } else {
    fail("use start, cursor, compute, latest, fail, push, recent, gift, offer or done");
  }
}

// Run as a command; imported, it only offers its counting, so tests can give it a clock.
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); } catch (e) {
    if (!(e instanceof Stop)) throw e;
    console.error("first-read: " + e.message);
    process.exit(1);
  }
}
