#!/usr/bin/env node
// Every number the page shows comes through here, on every catch-up, and the agent adds only its
// own words. Every file the page reads is written here too, whole or not at all, so a broken
// catch-up never replaces a good one. Instagram's answers go into data/.work/ as they came, under
// fixed names. Run it from anywhere:
//   node <app>/first-read.mjs start [--morning]   empties data/.work/; the first catch-up also starts
//                                                 data/reading.json, a later one says --morning
//   node <app>/first-read.mjs cursor              the next page's cursor from media.json, or "none"
//   node <app>/first-read.mjs calls <which>       the reads to make, one "<file> <path>" a line:
//                                                 posts, account, comments, more or retry
//   node <app>/first-read.mjs compute             counts everything from data/.work/, prints what it
//                                                 found and keeps it in computed.json. A failed read
//                                                 writes status.json and exits 4: stop.
//   node <app>/first-read.mjs latest @words.json [@why.txt]  your words on top of what compute
//                                                 counted, checked, then data/latest.json, today's
//                                                 day file and data/status.json
//   node <app>/first-read.mjs fail <kind> [@why.txt]  the run could not read Instagram: status.json only
//   node <app>/first-read.mjs done                marks a reading done, deletes data/.work/
// Only on the first catch-up, for the person watching:
//   node <app>/first-read.mjs push '<line>'       one line, or @line.txt when it has an apostrophe
//   node <app>/first-read.mjs recent              the newest comments, shown at once
//   node <app>/first-read.mjs gift @gift.json     {"kind":"waiting","id":"c3","gist":"..."} or {"kind":"calm"}
//   node <app>/first-read.mjs offer @offer.json   {"kind":"asked","what":"...","ids":["c1","c2"]} or {"kind":"next"}
// Nothing here writes to Instagram: replying happens only in a chat, after the person's yes.
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
const COUNTS = ["views", "likes", "comments", "saves", "shares"];
/** The newest posts the page lists. */
const ROWS = 10;
/** Posts read fresh each run; an older post keeps the numbers `known` holds, to spend fewer calls. */
const FRESH_POSTS = 12;
const FRESH_DAYS = 14;
const POST_CALLS = 30;
const THREAD_CALLS = 12;
/** How far back a comment can still be waiting. */
const COMMENT_DAYS = 14;
const COMMENT_ROWS = 80;
const MAX_WAITING = 12;
const MAX_ASKS = 6;
const RECENT_ROWS = 10;
/** What the What works box looks at, and the fewest posts a group may show. */
const WORKS_POSTS = 40;
const WORKS_MIN_GROUP = 3;
/** Younger than this a post is still climbing: its total says little yet. */
const CLIMBING_DAYS = 3;
const KNOWN_MAX = 400;
const HISTORY_MAX = 30;
const FORMATS = ["Reel", "Carousel", "Photo", "Video", "Story"];
const POST_FIELDS = "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count";
const COMMENT_FIELDS = "id,text,username,timestamp,like_count,hidden,replies{id,text,username,timestamp}";

// ── Time, in this machine's zone (the person's own) ──
const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, "0");
const hhmm = (d) => pad(d.getHours()) + ":" + pad(d.getMinutes());
const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
function offsetOf(d) { const o = -d.getTimezoneOffset(); return (o >= 0 ? "+" : "-") + pad(o / 60) + ":" + pad(o % 60); }
function iso(d) { return ymd(d) + "T" + hhmm(d) + ":" + pad(d.getSeconds()) + offsetOf(d); }
/** Midnight, `days` from today, in local time (safe across a clock change). */
function dayStart(days, from = new Date()) { const d = new Date(from); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + days); return d; }
function timeZone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; } }
/** A written time; "+0300", as Instagram and `date +%z` print it, reads like "+03:00". */
const timeOf = (value) => new Date(String(value || "").replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));

/** A refusal: the command stops and says why, and nothing more is written. */
class Stop extends Error {}
function fail(msg) { throw new Stop(msg); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function tryJson(file) { try { return readJson(file); } catch { return null; } }
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
/** "@your-instagram/data/.work/gift.json" means "@gift.json". */
function workJson(arg, what) {
  if (!arg.startsWith("@")) fail(`give ${what} as @<file>: the JSON you wrote into data/.work/`);
  try { return JSON.parse(workText("@" + arg.slice(1).replace(/^.*data[\\/]\.work[\\/]/, ""))); } catch { return fail(`${arg.slice(1)} is not JSON in data/.work/`); }
}
/** One of Instagram's answers as curl saved it, or null. */
const answer = (name) => tryJson(path.join(workDir, name));

// ── The reading the person watches ──
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
 * A lock older than 5 seconds was left by a call that died, so it goes before the 8 seconds a call waits.
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

/** A raw Instagram id (a long run of digits) or a link: never in words the page shows. */
const RAW_ID = /\b\d{12,}\b|instagram\.com\//i;

/** A line the page can show: one sentence about their account, never about the reading itself. */
function checkLine(line) {
  if (!line) fail("refused, an empty line: say what that call found, or push nothing");
  // "$4" in double quotes reaches here as "": refuse what the shell ate.
  if (/(^|[\s(*])[,.]\d/.test(line)) fail("refused, a number lost its start (a $ in double quotes?): use single quotes");
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object|\{|\}/.test(line) || RAW_ID.test(line)) fail(`refused, the line is broken or carries a raw id or link: ${line}`);
  if (line.length > 200) fail("refused, the line is longer than 200 characters");
  if (/[—–]/.test(line)) fail("refused, a long dash: use a comma or a period");
  if (!/\*\*[^*]+\*\*/.test(line)) fail("refused, mark the finding in **bold**, like '**23 new comments** since yesterday'");
  if (/^(I|I'm|I've|Searching|Reading|Looking|Checking|Opening|Trying)\b/i.test(line.replace(/\*/g, ""))) fail("refused, a line about the reading: say what you found on their account");
  // "**0 comments**" is not a finding: a line whose numbers are all 0 says nothing.
  const bold = (line.match(/\*\*[^*]+\*\*/g) || []).join(" ");
  const nums = (bold.replace(/\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}/g, "").match(/\d[\d,.]*/g) || []);
  if (nums.length && nums.every((x) => Number(x.replace(/,/g, "")) === 0)) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
  const allowed = numbersSoFar();
  if (allowed) checkNumbers(line, allowed, "the line", 100);
}

// ── Numbers the agent may say: only ones Instagram answered or compute printed ──
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
  for (const [name, read] of [["computed.json", (t) => JSON.parse(t).sheet], ["me.json", (t) => t]]) {
    try { return new Set(numbersIn(read(fs.readFileSync(path.join(workDir, name), "utf8")))); } catch { /* not there yet */ }
  }
  return null;
}

/** Words for the page: no raw ids, no long dash, nothing broken. */
function checkWords(text, what) {
  if (/[—–]/.test(text)) fail(`refused, a long dash in ${what}: use a comma or a period`);
  if (RAW_ID.test(text)) fail(`refused, a raw Instagram id or link in ${what}: write the name or the post`);
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object/.test(text)) fail(`refused, ${what} is broken: ${text}`);
}
/**
 * Words someone else wrote, for the page. They are cleaned, never refused: a long dash turns into a
 * comma, a link or a raw id goes, and text that is only a broken word is no text. Cut at `max`.
 */
export function cleanText(value, max = 120) {
  let out = String(value ?? "").replace(/\[object \w+\]/g, " ");
  out = out.replace(/https?:\/\/\S+|\S*instagram\.com\/\S*/gi, " ").replace(/\b\d{12,}\b/g, " ");
  out = out.replace(/\s*[—–]+\s*/g, ", ").replace(/\s+/g, " ").replace(/^[,\s]+|[,\s]+$/g, "").replace(/\s+,/g, ",");
  if (/^(null|undefined|nan)$/i.test(out)) return "";
  return out.length > max ? out.slice(0, max).replace(/\s+\S*$/, "").replace(/[,\s]+$/, "") : out;
}
/** A post's name: the caption's first line in about eight words, without hashtags or emoji. "" when it has none. */
export function titleFrom(caption) {
  const first = String(caption ?? "").split(/\r?\n/).map((l) => l.replace(/(^|\s)#\S+/g, " ").replace(/\p{Extended_Pictographic}|‍|️/gu, "").trim()).find(Boolean) || "";
  return cleanText(first.split(/\s+/).slice(0, 8).join(" "), 80);
}
function gistOf(value, max, what) {
  const gist = String(value || "").replace(/\s+/g, " ").trim();
  if (gist.length > max) fail(`${what} is longer than ${max} characters`);
  checkWords(gist, what);
  return gist;
}

// ── Instagram's answers, as curl saved them ──
const WHY = {
  "not-connected": "Instagram isn't connected yet.",
  "signed-out": "Instagram needs a new sign-in.",
  personal: "This is a personal Instagram account. Instagram lets apps read only Business and Creator accounts.",
  "rate-limited": "Instagram asked Cabinet to slow down. Try again in a few minutes.",
  unreachable: "Instagram could not be reached. Try again in a moment.",
  other: "The catch-up could not read Instagram."
};
const LIMIT_CODES = new Set(["4", "17", "32", "613", "80002"]);
/** What went wrong with an answer, or null when it is a good one. The string codes are the relay's, the numbers Meta's. */
export function troubleOf(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "unreachable";
  if (!raw.error) return null;
  const code = String(raw.error?.code ?? "");
  if (code === "signed-out" || code === "190") return "signed-out";
  if (LIMIT_CODES.has(code)) return "rate-limited";
  if (code === "unreachable") return "unreachable";
  return "other";
}
/** Instagram refused the numbers themselves: no permission, not a passing failure. */
const notAllowed = (raw) => ["10", "200", "not-allowed"].includes(String(raw?.error?.code ?? ""));
/** The relay's word that this run has no comments level. */
const commentsLevel = (raw) => raw?.error?.code === "comments-level";
/** Instagram turned down a metric by name: asking for each alone keeps the others. */
const badMetric = (raw) => String(raw?.error?.code ?? "") === "100";

const whole = (value) => (Number.isFinite(Number(value)) && Number(value) > 0 ? Math.round(Number(value)) : 0);
/** A count Instagram sent, or null: a number it did not send is never a 0. */
const orNull = (value) => (value === null || value === undefined || value === "" || !Number.isFinite(Number(value)) ? null : Math.max(0, Math.round(Number(value))));
function median(values) {
  const v = values.slice().sort((a, b) => a - b);
  if (!v.length) return 0;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}
const oneDecimal = (n) => Math.round(n * 10) / 10;
const words = (n) => Number(n).toLocaleString("en-US");
const usable = (d) => !!d && typeof d === "object" && !d.example && Array.isArray(d.posts);
const userOf = (me) => ({ id: String(me?.user_id || me?.id || ""), name: String(me?.username || "").replace(/^@/, "").toLowerCase() });
/** The same account: by its id, which survives a new username; by the username when an id is missing. */
function sameAccount(d, me) {
  const u = userOf(me);
  const id = String(d?.account?.userId || "");
  return id && u.id ? id === u.id : String(d?.account?.username || "").toLowerCase() === u.name;
}

/** One number from an insights answer: a post's `values`, or an account's `total_value`. */
function metricOf(raw, name) {
  const entry = (Array.isArray(raw?.data) ? raw.data : []).find((m) => m?.name === name);
  if (!entry) return null;
  const t = entry.total_value;
  if (t && typeof t === "object") {
    if (t.value !== undefined) return orNull(t.value);
    const parts = t.breakdowns?.[0]?.results;
    return Array.isArray(parts) ? parts.reduce((m, r) => m + whole(r?.value), 0) : null;
  }
  return orNull(entry.values?.[0]?.value);
}

// ── The reads a run makes ──
const postKind = (m) => (m?.media_product_type === "REELS" ? "reel" : m?.media_type === "CAROUSEL_ALBUM" ? "carousel" : m?.media_type === "VIDEO" ? "video" : "photo");
const ageDays = (m, now) => (now - timeOf(m.timestamp)) / DAY;
function readableMedia(pages) {
  const seen = new Set();
  return pages.flatMap((p) => (Array.isArray(p?.data) ? p.data : []))
    .filter((m) => m?.id && !isNaN(timeOf(m.timestamp)) && !seen.has(m.id) && seen.add(m.id))
    .sort((a, b) => timeOf(b.timestamp) - timeOf(a.timestamp));
}
/** The posts worth a call: the newest, then older ones `known` holds no numbers for. */
export function postsToRead(media, known, now) {
  const has = new Map((known || []).filter((k) => k?.mediaId).map((k) => [String(k.mediaId), k]));
  const needs = (m, i) => i < FRESH_POSTS || ageDays(m, now) < FRESH_DAYS || orNull(has.get(String(m.id))?.saves) === null;
  return media.filter(needs).slice(0, POST_CALLS);
}
/** Posts young enough to have someone waiting, with a comment under them. */
export function threadsToRead(media, now) {
  return media.filter((m) => whole(m.comments_count) > 0 && ageDays(m, now) <= COMMENT_DAYS).slice(0, THREAD_CALLS);
}
const secs = (d) => Math.floor(d.getTime() / 1000);
/** Instagram's account numbers, in small groups, so one it turns down never costs the others. */
export function accountCalls(followers, now) {
  const end = secs(dayStart(-1, now));
  const range = (days) => `period=day&since=${secs(dayStart(-(days + 1), now))}&until=${end}`;
  const groups = [[7, "7"], [28, "28"]].flatMap(([days, tag]) => [
    [`acc-${tag}-a.json`, "views,reach,accounts_engaged,total_interactions", `metric_type=total_value&${range(days)}`],
    [`acc-${tag}-b.json`, "likes,comments,saves,shares", `metric_type=total_value&${range(days)}`],
    [`acc-${tag}-c.json`, "profile_links_taps", `metric_type=total_value&breakdown=contact_button_type&${range(days)}`],
    ...(followers >= 100 ? [[`acc-${tag}-f.json`, "follows_and_unfollows", `metric_type=total_value&breakdown=follow_type&${range(days)}`]] : [])
  ]);
  groups.unshift(["acc-daily.json", "reach", `metric_type=time_series&${range(28)}`]);
  if (followers >= 100) {
    groups.push(["acc-online.json", "online_followers", `period=lifetime&since=${secs(dayStart(-8, now))}&until=${end}`]);
    groups.push(["acc-countries.json", "follower_demographics", "period=lifetime&metric_type=total_value&breakdown=country&timeframe=this_month"]);
  }
  return groups.map(([file, metrics, rest]) => ({ file, path: `me/insights?metric=${metrics}&${rest}`, metrics: metrics.split(","), rest }));
}
const commentsPath = (id, after) => `${id}/comments?fields=${COMMENT_FIELDS}&limit=50${after ? "&after=" + after : ""}`;
/** The reads of one kind as "<file> <path>" lines. */
export function callsFor(which, { me, media, known, access, now, get = () => null }) {
  const posts = () => postsToRead(media, known, now).map((m) => ({ file: `post-${m.id}.json`, path: `${m.id}/insights?metric=views,reach,saved,shares` }));
  const account = () => accountCalls(whole(me?.followers_count), now);
  const comments = () => (access === "read" ? [] : threadsToRead(media, now).map((m) => ({ file: `comments-${m.id}.json`, path: commentsPath(m.id) })));
  if (which === "posts") return posts();
  if (which === "account") return account();
  if (which === "comments") return comments();
  if (which === "more") {
    return comments().flatMap((c) => {
      const page = get(c.file);
      return page?.paging?.next && page.paging.cursors?.after ? [{ file: c.file.replace(/\.json$/, "-2.json"), path: commentsPath(c.file.slice(9, -5), page.paging.cursors.after) }] : [];
    });
  }
  if (which === "retry") {
    const limited = [...posts(), ...account(), ...comments()].filter((c) => troubleOf(get(c.file)) === "rate-limited");
    const singles = account().filter((c) => c.metrics.length > 1 && badMetric(get(c.file)))
      .flatMap((c) => c.metrics.map((m) => ({ file: c.file.replace(/\.json$/, `--${m}.json`), path: `me/insights?metric=${m}&${c.rest}` })));
    return [...limited, ...singles];
  }
  return fail("calls takes posts, account, comments, more or retry");
}

// ── Instagram's numbers for the account ──
/** One group's answer, with what `calls retry` asked metric by metric. */
function groupOf(get, file, metrics) {
  return [get(file), ...metrics.map((m) => get(file.replace(/\.json$/, `--${m}.json`)))].filter((a) => a && !troubleOf(a));
}
function spanFrom(get, tag, from) {
  const a = groupOf(get, `acc-${tag}-a.json`, ["views", "reach", "accounts_engaged", "total_interactions"]);
  const b = groupOf(get, `acc-${tag}-b.json`, ["likes", "comments", "saves", "shares"]);
  const pick = (answers, name) => answers.map((x) => metricOf(x, name)).find((v) => v !== null) ?? null;
  const out = {
    from, views: pick(a, "views"), reach: pick(a, "reach"), engaged: pick(a, "accounts_engaged"), interactions: pick(a, "total_interactions"),
    likes: pick(b, "likes"), comments: pick(b, "comments"), saves: pick(b, "saves"), shares: pick(b, "shares"),
    linkTaps: metricOf(get(`acc-${tag}-c.json`), "profile_links_taps"), follows: null, unfollows: null
  };
  const parts = (Array.isArray(get(`acc-${tag}-f.json`)?.data) ? get(`acc-${tag}-f.json`).data : []).find((m) => m?.name === "follows_and_unfollows")?.total_value?.breakdowns?.[0]?.results;
  for (const r of Array.isArray(parts) ? parts : []) {
    if (r?.dimension_values?.[0] === "FOLLOWER") out.follows = orNull(r.value);
    if (r?.dimension_values?.[0] === "NON_FOLLOWER") out.unfollows = orNull(r.value);
  }
  return out;
}
/** Instagram counts online_followers in Pacific time: the hours move to the person's own clock. */
function pacificShift(now) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hourCycle: "h23", day: "numeric" }).formatToParts(now);
  const v = (t) => Number(parts.find((p) => p.type === t).value);
  const dayGap = v("day") === now.getDate() ? 0 : v("day") > now.getDate() ? (v("day") - now.getDate() > 1 ? -1 : 1) : (now.getDate() - v("day") > 1 ? 1 : -1);
  return now.getHours() - v("hour") - dayGap * 24;
}
function onlineFrom(raw, now) {
  const values = (Array.isArray(raw?.data) ? raw.data : []).find((m) => m?.name === "online_followers")?.values;
  const day = (Array.isArray(values) ? values : []).slice().reverse().find((x) => x?.value && Object.keys(x.value).length);
  if (!day) return null;
  const shift = pacificShift(now);
  return Object.entries(day.value).map(([h, n]) => ({ hour: (Number(h) + shift + 48) % 24, followers: whole(n) })).sort((a, b) => a.hour - b.hour);
}
function countriesFrom(raw) {
  const parts = (Array.isArray(raw?.data) ? raw.data : []).find((m) => m?.name === "follower_demographics")?.total_value?.breakdowns?.[0]?.results;
  if (!Array.isArray(parts) || !parts.length) return null;
  return parts.map((r) => ({ code: String(r?.dimension_values?.[0] || ""), followers: whole(r?.value) })).filter((c) => /^[A-Z]{2}$/.test(c.code))
    .sort((a, b) => b.followers - a.followers).slice(0, 5);
}
/** The account's numbers from the saved answers, read through `get` so tests can give them. */
export function insightsFrom(get, now) {
  const has = (s) => s.views !== null || s.reach !== null;
  const last7 = spanFrom(get, "7", ymd(dayStart(-8, now)));
  const last28 = spanFrom(get, "28", ymd(dayStart(-29, now)));
  const series = (Array.isArray(get("acc-daily.json")?.data) ? get("acc-daily.json").data : []).find((m) => m?.name === "reach")?.values;
  // Each value's day is the day before the date in its end_time.
  const daily = (Array.isArray(series) ? series : []).filter((x) => x?.end_time && orNull(x.value) !== null).map((x) => {
    const d = new Date(String(x.end_time).slice(0, 10) + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() - 1);
    return { day: d.toISOString().slice(0, 10), reach: whole(x.value) };
  }).sort((a, b) => (a.day < b.day ? -1 : 1));
  if (!has(last7) && !has(last28) && !daily.length) {
    const refused = ["acc-28-a.json", "acc-daily.json"].some((f) => notAllowed(get(f)));
    return { ok: false, why: refused ? "not-allowed" : "unavailable" };
  }
  return {
    ok: true, until: daily.length ? daily[daily.length - 1].day : ymd(dayStart(-2, now)),
    last7, last28, daily, online: onlineFrom(get("acc-online.json"), now), countries: countriesFrom(get("acc-countries.json"))
  };
}

// ── Comments ──
/**
 * Everyone else's comments in the last 14 days, top-level and replies. A comment is `answered` when
 * the account replied in its thread after it. commentId is always the top-level one: Instagram
 * puts a reply to a reply under the comment that started the thread.
 */
export function commentsFrom(threads, owner, posts, now) {
  const mine = (c) => String(c?.username || "").toLowerCase() === owner;
  const from = now.getTime() - COMMENT_DAYS * DAY;
  const out = [];
  const own = {};
  for (const [mediaId, list] of Object.entries(threads)) {
    const post = posts.find((p) => p.mediaId === mediaId);
    own[mediaId] = 0;
    for (const top of list) {
      const replies = Array.isArray(top?.replies?.data) ? top.replies.data : [];
      const ownTimes = [top, ...replies].filter(mine).map((c) => timeOf(c.timestamp).getTime());
      own[mediaId] += ownTimes.length;
      const lastOwn = ownTimes.length ? Math.max(...ownTimes) : 0;
      for (const c of [top, ...replies]) {
        if (mine(c) || !c?.id || c.hidden === true || top.hidden === true) continue;
        const at = timeOf(c.timestamp);
        if (isNaN(at) || at.getTime() < from) continue;
        const text = cleanText(c.text, 200);
        if (!text) continue;
        out.push({ who: "@" + String(c.username || "someone").replace(/^@/, ""), post: post ? nameOf(post) : "a post", mediaId, commentId: String(top.id), text, at: iso(at), likes: whole(c.like_count), answered: lastOwn >= at.getTime(), url: post?.url || "" });
      }
    }
  }
  out.sort((a, b) => timeOf(b.at) - timeOf(a.at));
  return { list: out.slice(0, COMMENT_ROWS).map((c, i) => ({ id: "c" + (i + 1), ...c })), own };
}

// ── Counting ──
const nameOf = (p) => p.title || `A ${p.kind} from ` + new Date(p.published).toLocaleDateString("en-US", { month: "short", day: "numeric" });
/** Posts that have this number, which an account without insights may not. */
const metricFor = (read, key, fallback) => (read.some((p) => p[key] !== null) ? key : fallback);

/** One post as the page and the counting want it, or null without an id or a posting time. */
function readPost(m, numbers, was, now) {
  const at = timeOf(m?.timestamp);
  if (!m?.id || isNaN(at)) return null;
  const n = numbers || {};
  const pick = (k) => (n[k] !== undefined && n[k] !== null ? n[k] : orNull(was?.[k]));
  const out = {
    mediaId: String(m.id), kind: postKind(m), title: titleFrom(m.caption), published: iso(at),
    views: pick("views"), reach: pick("reach"), likes: whole(m.like_count), comments: whole(m.comments_count),
    saves: pick("saves"), shares: pick("shares"), url: linkOr(m.permalink)
  };
  Object.defineProperty(out, "ageHours", { value: (now - at) / 3600000 });
  return out;
}
function linkOr(value) {
  const link = String(value || "").trim();
  return /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+\/?(\?\S*)?$/i.test(link) && link.length <= 400 ? link : "";
}
/** Number of a post's four insights the answer gave, or {} for an answer that failed. */
export function postNumbers(raw) {
  if (!raw || troubleOf(raw)) return {};
  return { views: metricOf(raw, "views"), reach: metricOf(raw, "reach"), saves: metricOf(raw, "saved"), shares: metricOf(raw, "shares") };
}
/**
 * The read this one is compared with. The last catch-up, unless that was today: then a second
 * press of Catch up now stays against the day before, so nothing counts twice and today's day file
 * holds one honest day. Another account's reads compare with nothing.
 */
function baselineOf(prev, earlier, me, today) {
  const mine = (d) => (usable(d) && sameAccount(d, me) ? d : null);
  const last = mine(prev);
  if (!last) return null;
  const lastAt = timeOf(last.generatedAt);
  return !isNaN(lastAt) && ymd(lastAt) === today ? mine(earlier) || last : last;
}

/** Saves and shares per 1,000 people reached by format, posting day and posting time, over posts old enough to compare. */
function worksOf(read) {
  const old = read.filter((p) => p.ageHours >= CLIMBING_DAYS * 24).slice(0, WORKS_POSTS);
  const rated = old.filter((p) => whole(p.reach) >= 100 && p.saves !== null && p.shares !== null);
  // Without Instagram's numbers likes are all there is; the page says which it counts.
  const byRate = rated.length >= WORKS_MIN_GROUP;
  const pool = byRate ? rated : old;
  const value = byRate ? (p) => ((p.saves + p.shares) / p.reach) * 1000 : (p) => p.likes;
  const group = (buckets, pick) => buckets.map((label, i) => {
    const vals = pool.filter((p) => pick(p) === i).map(value);
    return { label, posts: vals.length, median: oneDecimal(median(vals)) };
  }).filter((g) => g.posts >= WORKS_MIN_GROUP);
  const rate = (k) => oneDecimal(median(rated.map((p) => (p[k] / p.reach) * 1000)));
  return {
    posts: pool.length, measure: byRate ? "kept" : "likes",
    usual: { reach: Math.round(median(rated.map((p) => p.reach))), saves: rate("saves"), shares: rate("shares"), likes: Math.round(median(old.map((p) => p.likes))) },
    format: group(["Reels", "Carousels", "Photos", "Videos"], (p) => ["reel", "carousel", "photo", "video"].indexOf(p.kind)),
    // Monday first, as a week reads.
    weekday: group(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], (p) => (new Date(p.published).getDay() + 6) % 7),
    hour: group(["Morning, 5 to noon", "Afternoon, noon to 5", "Evening, 5 to 9", "Night, 9 to 5"], (p) => {
      const h = new Date(p.published).getHours();
      return h >= 5 && h < 12 ? 0 : h >= 12 && h < 17 ? 1 : h >= 17 && h < 21 ? 2 : 3;
    })
  };
}
/** Moved most: most views gained, or on a first read most views per day since posting, never on its first day. */
function pickBest(read, first) {
  const key = metricFor(read, "views", "likes");
  const pool = read.filter((p) => (first ? whole(p[key]) > 0 && p.ageHours >= 24 : (p.gained?.[key] || 0) > 0));
  const score = (p) => (first ? p[key] / (p.ageHours / 24) : p.gained[key]);
  return pool.reduce((top, p) => (!top || score(p) > score(top) ? p : top), null);
}
/** The smallest reach among posts 7 to 60 days old, when that is under half the group's middle. */
function pickQuiet(read, best) {
  const key = metricFor(read, "reach", "likes");
  const pool = read.filter((p) => p.ageHours >= 7 * 24 && p.ageHours <= 60 * 24 && p[key] !== null);
  if (pool.length < 3) return null;
  const low = pool.reduce((m, p) => (p[key] < m[key] ? p : m));
  return low !== best && low[key] < median(pool.map((p) => p[key])) / 2 ? low : null;
}

/**
 * Everything the page's numbers come from, counted from Instagram's answers and the earlier reads.
 * `prev` is latest.json, `earlier` the last day file before today. Pure: tests give it a clock.
 */
export function computeRead({ me, media, numbers = {}, threads = {}, missed = [], readComments = true, insights = { ok: false, why: "unavailable" }, hasMore = false, note = "", prev = null, earlier = null, now = new Date() }) {
  const today = ymd(now);
  const username = String(me.username || "").replace(/^@/, "");
  const owner = username.toLowerCase();
  const account = {
    name: cleanText(me.name, 80) || username, username, userId: String(me.user_id || me.id || ""),
    followers: whole(me.followers_count), following: whole(me.follows_count), posts: whole(me.media_count),
    url: username ? `https://www.instagram.com/${username}/` : ""
  };
  const same = usable(prev) && sameAccount(prev, me) ? prev : null;
  const base = baselineOf(prev, earlier, me, today);
  const first = !base;
  const since = first ? dayStart(-1, now) : timeOf(base.generatedAt);
  const toMap = (list) => new Map((list || []).filter((k) => k?.mediaId).map((k) => [String(k.mediaId), k]));
  const baseKnown = toMap(base?.known);
  const lastKnown = toMap(same?.known);

  const seen = new Set();
  const read = media.map((m) => readPost(m, numbers[m?.id], lastKnown.get(String(m?.id)), now))
    .filter((p) => p && !seen.has(p.mediaId) && seen.add(p.mediaId))
    .sort((a, b) => new Date(b.published) - new Date(a.published));

  // A post in known always subtracts. Only one missing from it, posted since that read, counts
  // whole. An older one never read before says nothing about this window, so it gains nothing.
  if (!first) for (const p of read) {
    const was = baseKnown.get(p.mediaId);
    const isNew = !was && new Date(p.published) >= since;
    if (!was && !isNew) continue;
    p.gained = {};
    for (const k of COUNTS) if (p[k] !== null) {
      if (isNew) p.gained[k] = p[k];
      else if (was[k] !== null && was[k] !== undefined) p.gained[k] = Math.max(0, p[k] - whole(was[k]));
    }
  }

  const { list: comments, own } = commentsFrom(threads, owner, read, now);
  // Own comments seen earlier stay counted, so a thread read shorter today cannot inflate others'.
  for (const p of read) {
    const held = whole(lastKnown.get(p.mediaId)?.own);
    if (own[p.mediaId] !== undefined) {
      own[p.mediaId] = Math.max(own[p.mediaId], held);
      p.viewerComments = Math.max(0, p.comments - own[p.mediaId]);
    } else if (held) own[p.mediaId] = held;
  }

  // Views at the first read after a day, kept for good: the only first-day number Instagram allows.
  const day1 = new Map();
  for (const p of read) {
    const saved = lastKnown.get(p.mediaId)?.day1;
    if (saved) day1.set(p.mediaId, saved);
    else if (p.ageHours >= 24 && p.ageHours < 72 && p.views !== null) day1.set(p.mediaId, { views: p.views, hours: Math.round(p.ageHours) });
  }
  for (const [id, k] of lastKnown) if (k.day1 && !day1.has(id)) day1.set(id, k.day1);

  const best = pickBest(read, first);
  const quiet = pickQuiet(read, best);
  const rows = read.slice(0, ROWS);
  for (const p of [best, quiet]) if (p && !rows.includes(p)) { p.older = true; rows.push(p); }
  rows.forEach((p, i) => {
    p.id = "p" + (i + 1);
    p.mark = p === best ? "best" : p === quiet ? "quiet" : "";
    const mine = day1.get(p.mediaId);
    const others = [...day1].filter(([id]) => id !== p.mediaId).map(([, d]) => d.views);
    if (mine && others.length >= 3) {
      const usual = Math.round(median(others));
      p.firstDay = { views: mine.views, usual, pace: mine.views >= usual * 1.25 ? "ahead" : mine.views <= usual * 0.75 ? "behind" : "even" };
    }
  });

  const totals = { newPosts: read.filter((p) => new Date(p.published) >= since).length };
  const gainedSum = (k) => read.reduce((m, p) => m + (p.gained?.[k] || 0), 0);
  if (!first) {
    for (const k of COUNTS) totals[k] = gainedSum(k);
    totals.followers = account.followers - whole(base.account?.followers);
  }
  if (readComments) totals.comments = comments.filter((c) => timeOf(c.at) >= since).length;

  const spanOf = (days) => {
    const from = ymd(dayStart(-(days - 1), now));
    const inSpan = read.filter((p) => ymd(new Date(p.published)) >= from);
    const out = { from, posts: inSpan.length };
    for (const k of COUNTS) out[k] = inSpan.reduce((m, p) => m + whole(p[k]), 0);
    const kept = (p) => whole(p.saves) + whole(p.shares);
    out.top = inSpan.slice().sort((a, b) => kept(b) - kept(a) || b.likes - a.likes).slice(0, 4).map((p) => {
      const t = { mediaId: p.mediaId, kind: p.kind, title: p.title, published: p.published, kept: kept(p), likes: p.likes };
      if (p.url) t.url = p.url;
      return t;
    });
    return out;
  };
  const spans = { last7: spanOf(7), last28: spanOf(28) };
  const oldest = read[read.length - 1];
  if (hasMore && oldest && ymd(new Date(oldest.published)) >= spans.last28.from) spans.last28.partial = true;

  const entry = { day: today, followers: account.followers, following: account.following, posts: account.posts };
  if (!first) entry.viewsGained = totals.views;
  const history = [...(same?.history || []).filter((h) => h?.day && h.day !== today), entry].slice(-HISTORY_MAX);

  // Every post read, then what earlier reads knew of the others (a post this run did not reach).
  const at = iso(now);
  const known = read.map((p) => {
    const k = { mediaId: p.mediaId, views: p.views, reach: p.reach, likes: p.likes, comments: p.comments, saves: p.saves, shares: p.shares, at };
    if (own[p.mediaId]) k.own = own[p.mediaId];
    if (day1.has(p.mediaId)) k.day1 = day1.get(p.mediaId);
    return k;
  });
  for (const [id, k] of lastKnown) if (!seen.has(id)) known.push(k);

  const recent = comments.slice(0, RECENT_ROWS).map((c, i) => ({ id: "r" + (i + 1), who: c.who, post: c.post, text: cleanText(c.text, 140), at: c.at, url: c.url }));
  const latest = {
    schema: LATEST_SCHEMA, generatedAt: at, since: iso(since), timeZone: timeZone(), account, readComments, commentsMissed: missed.length, totals, spans, history,
    insights, works: worksOf(read), posts: rows, waiting: [], recent, asks: [], next: [], known: known.slice(0, KNOWN_MAX)
  };
  // A thread that could not be read keeps who was waiting there: a failed read clears nobody.
  const carried = (same?.waiting || []).filter((w) => missed.includes(String(w?.mediaId)) && now - timeOf(w.since) <= COMMENT_DAYS * DAY);
  return {
    latest, first, note, comments, carried, sheet: sheetOf(latest, read, first),
    lastNext: (same?.next || []).map((n) => String(n?.title || "")).filter(Boolean)
  };
}

/** What compute prints: the facts for the agent's words, and the only numbers it may use. */
function sheetOf(l, read, first) {
  const a = l.account;
  const per = (n, of) => (of ? oneDecimal((n / of) * 1000) : 0);
  const t = l.totals;
  const lines = [
    `Account: ${a.name}, @${a.username}, ${words(a.followers)} followers, ${words(a.following)} following, ${words(a.posts)} posts.`,
    first ? "First catch-up: nothing to compare with yet." : `Since the last read: ${words(t.views)} views, ${words(t.likes)} likes, ${words(t.saves)} saves, ${words(t.shares)} shares, ${t.followers} followers.`,
    `Posts read: ${read.length}. Posted in the window: ${t.newPosts}.` + (t.comments !== undefined ? ` Comments from others in the window: ${t.comments}.` : "")
  ];
  const u = l.works.usual;
  if (u.reach) lines.push(`Usual: ${words(u.reach)} people reached, ${u.saves} saves and ${u.shares} shares per 1,000 reached.`);
  else if (u.likes) lines.push(`Usual: ${words(u.likes)} likes.`);
  for (const p of l.posts) {
    const age = Math.floor(read.find((r) => r.mediaId === p.mediaId).ageHours / 24);
    const facts = [["views", p.views], ["reached", p.reach], ["likes", p.likes], ["comments", p.comments], ["saves", p.saves], ["shares", p.shares]].filter(([, n]) => n !== null).map(([k, n]) => `${words(n)} ${k}`);
    const gained = p.gained ? Object.entries(p.gained).filter(([, n]) => n).map(([k, n]) => `${words(n)} ${k}`) : [];
    lines.push(`${p.id}${p.mark ? " [" + p.mark + "]" : ""}${p.older ? " [older]" : ""} ${p.kind} "${nameOf(p)}", ${age} days old: ${facts.join(", ")}` +
      (gained.length ? `, gained ${gained.join(", ")}` : "") +
      (whole(p.reach) >= 100 && p.saves !== null ? `, ${per(p.saves, p.reach)} saves and ${per(p.shares ?? 0, p.reach)} shares per 1,000 reached` : "") +
      (p.firstDay ? `, ${words(p.firstDay.views)} views after its first day against your usual ${words(p.firstDay.usual)} (${p.firstDay.pace})` : "") + ".");
  }
  return lines.join("\n");
}
/** The comments, for the agent to choose from. Kept apart from the sheet: their numbers are not the page's. */
function commentsSheet(c) {
  if (!c.latest.readComments) return "Comments: not read (Instagram is connected to read only).";
  if (!c.comments.length) return "Comments from others in the last 14 days: none.";
  return ["Comments from others in the last 14 days, newest first:"].concat(c.comments.map((x) => `${x.id} ${x.who} under "${x.post}"${x.likes ? `, ${x.likes} likes` : ""}${x.answered ? " [answered]" : ""}: ${x.text}`)).join("\n");
}

// ── The agent's words on top of what was counted ──
const titleKey = (t) => String(t).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
/** Takes only the gists, the choices and the ideas from the agent's file: no number it typed reaches the page. */
export function wordsOn(c, w) {
  if (!w || typeof w !== "object" || Array.isArray(w)) fail('your words are {"posts":[{"id":"p1","gist":"..."}],"waiting":[{"id":"c1","gist":"...","short":"..."}],"asks":[{"what":"...","ids":["c1","c2"]}],"next":[...]}');
  const l = structuredClone(c.latest);
  const allowed = new Set(numbersIn(c.sheet));
  const refs = new Map(l.posts.map((p) => [p.id, p]));
  const said = new Map((c.comments || []).map((x) => [x.id, x]));
  const comment = (id, what) => said.get(String(id)) || fail(`there is no comment ${id} in ${what}: use the ids compute printed`);

  for (const item of Array.isArray(w.posts) ? w.posts : []) {
    const p = refs.get(String(item?.id));
    if (!p) fail(`there is no post ${item?.id}: use the ids compute printed`);
    const gist = gistOf(item.gist, 120, `${p.id}'s gist`);
    if (!gist) continue;
    checkNumbers(gist, allowed, `${p.id}'s gist`);
    if (/\bfirst day\b|\bon pace\b/i.test(gist) && !p.firstDay) fail(`refused, ${p.id} has no first-day number yet: say something else`);
    p.gist = gist;
  }

  const waiting = Array.isArray(w.waiting) ? w.waiting : [];
  if (waiting.length && !l.readComments) fail("no comments were read: leave waiting out");
  if (waiting.length > MAX_WAITING) fail(`at most ${MAX_WAITING} waiting`);
  const picked = waiting.map((item) => {
    const x = comment(item?.id, "waiting");
    if (x.answered) fail(`${x.id} is answered already: it is not waiting`);
    const mine = new Set([...allowed, ...numbersIn(x.text)]);
    const gist = gistOf(item.gist, 140, `${x.id}'s gist`);
    const short = gistOf(item.short, 300, `${x.id}'s short`);
    if (!gist) fail(`${x.id} needs a gist: what they ask, in your words`);
    checkNumbers(gist, mine, `${x.id}'s gist`);
    checkNumbers(short, mine, `${x.id}'s short`);
    return { who: x.who, post: x.post, mediaId: x.mediaId, commentId: x.commentId, gist, ...(short ? { short } : {}), since: x.at, likes: x.likes, url: x.url };
  });
  const seenWaiting = new Set();
  l.waiting = picked.concat(c.carried || []).filter((x) => { const k = x.commentId + x.since; if (seenWaiting.has(k)) return false; seenWaiting.add(k); return true; })
    .sort((a, b) => timeOf(b.since) - timeOf(a.since)).slice(0, MAX_WAITING).map((x, i) => ({ ...x, id: "w" + (i + 1) }));
  l.totals.waiting = l.waiting.length;

  const asks = Array.isArray(w.asks) ? w.asks : [];
  if (asks.length > MAX_ASKS) fail(`at most ${MAX_ASKS} asks`);
  l.asks = asks.map((item, i) => {
    const what = gistOf(item?.what, 140, `ask ${i + 1}`);
    if (!what) fail(`ask ${i + 1} needs what: the question, in a few plain words`);
    checkNumbers(what, allowed, `ask ${i + 1}`);
    const items = (Array.isArray(item.ids) ? item.ids : []).map((id) => comment(id, `ask ${i + 1}`));
    const people = new Set(items.map((x) => x.who.toLowerCase())).size;
    if (people < 2) fail(`ask ${i + 1} needs at least 2 different people: name their comments in ids`);
    return { id: "a" + (i + 1), what, people, posts: [...new Set(items.map((x) => x.post))], answered: items.some((x) => x.answered), url: items[0].url };
  }).sort((a, b) => b.people - a.people);

  const next = Array.isArray(w.next) ? w.next : [];
  if (next.length > 3) fail("at most 3 ideas");
  const lastSaid = new Set((c.lastNext || []).map(titleKey));
  const askIds = new Set(l.asks.map((a) => a.id));
  l.next = next.map((idea, i) => {
    const title = gistOf(idea?.title, 120, `idea ${i + 1}'s title`);
    const why = gistOf(idea?.why, 200, `idea ${i + 1}'s why`);
    if (!title || !why) fail(`idea ${i + 1} needs a title and a why`);
    checkNumbers(why, allowed, `idea ${i + 1}'s why`);
    const format = String(idea?.format || "");
    if (format && !FORMATS.includes(format)) fail(`idea ${i + 1}: format is ${FORMATS.join(", ")}`);
    const fromId = String(idea?.from || "");
    const from = refs.get(fromId);
    if (fromId && !from && !askIds.has(fromId)) fail(`idea ${i + 1}: from is a post id compute printed, or an ask's id, or leave it out`);
    // Yesterday's idea comes back only when something new backs it.
    if (lastSaid.has(titleKey(title)) && !(from && (from.mark === "best" || new Date(from.published) >= new Date(l.since)))) {
      fail(`refused, "${title}" was an idea last time and nothing new backs it: give another, or build it on the post that moved`);
    }
    const out = { id: "n" + (i + 1), title, why };
    if (format) out.format = format;
    if (fromId) out.from = fromId;
    return out;
  });
  return l;
}

/** latest.json in the page's own shape: checked on every catch-up, so a row the page cannot show is refused. */
export function latestOf(l) {
  if (!l || typeof l !== "object" || Array.isArray(l)) fail("latest.json must be an object");
  if (!Array.isArray(l.posts)) fail("latest.json needs posts (an empty list on a new account)");
  for (const key of ["waiting", "recent", "asks", "next", "known", "history"]) {
    if (l[key] !== undefined && !Array.isArray(l[key])) fail(`latest.json: ${key} is a list`);
  }
  if (!l.account || typeof l.account !== "object") fail("latest.json needs account");
  l.posts.forEach((p, i) => {
    if (!p || typeof p !== "object") fail(`posts[${i}] must be an object`);
    if (typeof p.title !== "string") fail(`posts[${i}].title is a string ("" when the post has no caption)`);
    if (!Number.isInteger(p.likes) || p.likes < 0) fail(`posts[${i}].likes is a whole number`);
  });
  for (const mark of ["best", "quiet"]) if (l.posts.filter((p) => p.mark === mark).length > 1) fail(`only one post is ${mark}`);
  for (const key of ["last7", "last28"]) {
    const s = l.spans && l.spans[key];
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(String(s.from || ""))) fail(`spans.${key}.from is a day, YYYY-MM-DD`);
  }
  (l.history || []).forEach((h, i) => { if (!h || !/^\d{4}-\d{2}-\d{2}$/.test(String(h.day || ""))) fail(`history[${i}].day is YYYY-MM-DD`); });
  delete l.example;
  return l;
}

// ── The gift and offers ──
/** One thing the person can do now: the comment the agent picked, with everything but its gist from compute. */
export function giftOf(g, comments) {
  if (!g || typeof g !== "object" || Array.isArray(g)) fail("the gift must be an object");
  const kind = String(g.kind || "");
  if (kind === "calm") return { kind };
  if (kind !== "waiting") fail(`the gift kind is waiting or calm, not "${kind}"`);
  const x = comments.find((c) => c.id === String(g.id));
  if (!x) fail("the gift's id is a comment compute printed");
  if (x.answered) fail(`${x.id} is answered already: pick one still waiting, or give calm`);
  const gist = gistOf(g.gist, 140, "the gift");
  if (/\d/.test(gist)) fail("refused, a number in the gift: say what they want, without numbers");
  const out = { kind, who: x.who, post: x.post, mediaId: x.mediaId, commentId: x.commentId, since: x.at, gist };
  if (x.url) out.link = x.url;
  return out;
}
const OFFER_KINDS = ["asked", "next"];
/** The page's cleanOffers shows no more than 2, and cuts what at the same 100. */
const MAX_OFFERS = 2;
function offerOf(o, comments) {
  if (!o || typeof o !== "object" || Array.isArray(o)) fail("the offer must be an object");
  const kind = String(o.kind || "");
  if (!OFFER_KINDS.includes(kind)) fail(`the offer kind is ${OFFER_KINDS.join(" or ")}, not "${kind}"`);
  if (kind === "next") return { kind };
  const what = gistOf(o.what, 100, "the asked offer");
  if (!what) fail("the asked offer needs what: the question, in a few plain words");
  const who = new Set((Array.isArray(o.ids) ? o.ids : []).map((id) => comments.find((c) => c.id === String(id))?.who.toLowerCase()).filter(Boolean));
  if (who.size < 2) fail("the asked offer's ids are the comments of at least 2 different people");
  return { kind, what, people: who.size };
}

// ── Files ──
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
/** The run could not read Instagram: latest.json stays as it was and the page shows why. */
function failRun(kind, why) {
  if (!WHY[kind]) fail(`the kind is ${Object.keys(WHY).join(", ")}, not "${kind}"`);
  fs.mkdirSync(dataDir, { recursive: true });
  writeJson(path.join(dataDir, "status.json"), { at: iso(new Date()), ok: false, kind, why: String(why || WHY[kind]).replace(/\s+/g, " ").trim().slice(0, 200) });
  finishReading();
  console.log(`status.json written (${kind}). latest.json is as it was. Stop here.`);
  if (kind === "signed-out") console.log("NEEDS_CONNECTION: instagram | Instagram needs a new sign-in");
  process.exitCode = 4;
}
function computed() {
  const c = tryJson(path.join(workDir, "computed.json"));
  return c || fail("run compute first");
}
function compute() {
  const me = answer("me.json");
  const stop = troubleOf(me);
  if (stop) return failRun(stop);
  if (!me.username && !me.user_id && !me.id) return failRun("other");
  if (String(me.account_type || "").toUpperCase() === "PERSONAL") return failRun("personal");
  const first = answer("media.json");
  const stopFirst = troubleOf(first);
  if (stopFirst) return failRun(stopFirst);
  const second = fs.existsSync(path.join(workDir, "media-2.json")) ? answer("media-2.json") : null;
  const secondFailed = !!second && !!troubleOf(second);
  const media = readableMedia([first, secondFailed ? null : second]);
  const now = new Date();
  const prev = tryJson(latestFile);
  const hadPosts = usable(prev) && prev.posts.length > 0;
  let note = secondFailed ? `Only your newest ${media.length === 1 ? "post was" : media.length + " posts were"} read this time.` : "";
  if (!media.length && whole(me.media_count) > 0) {
    if (hadPosts) return failRun("other", "Instagram sent no posts this time. Try again in a moment.");
    note = "Instagram sent none of your posts.";
  }
  const numbers = {};
  for (const f of fs.readdirSync(workDir)) {
    const hit = /^post-(\w+)\.json$/.exec(f);
    if (hit) numbers[hit[1]] = postNumbers(answer(f));
  }
  const access = process.env.CABINET_INSTAGRAM_ACCESS;
  const threads = {};
  const missed = [];
  let readComments = access !== "read";
  if (readComments) for (const m of threadsToRead(media, now)) {
    const page = answer(`comments-${m.id}.json`);
    if (commentsLevel(page)) { readComments = false; break; }
    if (!page || troubleOf(page)) { missed.push(String(m.id)); continue; }
    const more = answer(`comments-${m.id}-2.json`);
    threads[m.id] = [...(page.data || []), ...(more && !troubleOf(more) ? more.data || [] : [])];
  }
  if (!readComments) { missed.length = 0; for (const k of Object.keys(threads)) delete threads[k]; }
  if (missed.length) note = [note, `Comments on ${missed.length === 1 ? "one post" : missed.length + " posts"} could not be read this time.`].filter(Boolean).join(" ");
  const hasMore = secondFailed || !!(second || first).paging?.next;
  const c = computeRead({ me, media, numbers, threads, missed, readComments, insights: insightsFrom(answer, now), hasMore, note, prev, earlier: dayBefore(ymd(now)), now });
  writeJson(path.join(workDir, "computed.json"), c);
  console.log(c.sheet);
  console.log(commentsSheet(c));
  if (c.lastNext.length) console.log("Last ideas: " + c.lastNext.join("; "));
}

function main(argv) {
  const [cmd, ...args] = argv;
  if (cmd === "start") {
    fs.rmSync(workDir, { recursive: true, force: true });
    fs.mkdirSync(workDir, { recursive: true });
    if (args[0] === "--morning") { console.log("ready; save your files in " + path.relative(process.cwd(), workDir)); return; }
    // Later catch-ups are told the usual way: the reading is only for the first one.
    if (fs.existsSync(latestFile)) fail("data/latest.json is there, so this is not the first catch-up: use start --morning");
    lockReading();
    writeJson(readingFile, { schema: `${SCHEMA}/reading@1`, startedAt: iso(new Date()), done: false, lines: [] });
    console.log("reading started; save your files in " + path.relative(process.cwd(), workDir));
  } else if (cmd === "cursor") {
    const page = answer("media.json");
    console.log(page?.paging?.next && page.paging.cursors?.after ? String(page.paging.cursors.after) : "none");
  } else if (cmd === "calls") {
    const media = readableMedia([answer("media.json"), answer("media-2.json")]);
    const prev = tryJson(latestFile);
    const lines = callsFor(args[0], { me: answer("me.json"), media, known: prev?.known, access: process.env.CABINET_INSTAGRAM_ACCESS, now: new Date(), get: answer });
    for (const c of lines) console.log(c.file + " " + c.path);
  } else if (cmd === "compute") {
    compute();
  } else if (cmd === "fail") {
    const [kind, why] = args;
    failRun(kind, why ? workText(why) : "");
  } else if (cmd === "push") {
    editReading("the reading is done: no more lines", (r) => {
      const line = workText(args.join(" ")).replace(/\s+/g, " ").trim();
      checkLine(line);
      if (r.lines.includes(line)) fail("that line is already there");
      r.lines.push(line);
      return `line ${r.lines.length}: ${line}`;
    });
  } else if (cmd === "recent") {
    const recent = computed().latest.recent.slice(0, 5).map((m) => ({ who: m.who, post: m.post, gist: m.text, at: m.at, ...(m.url ? { link: m.url } : {}) }));
    editReading("the reading is done: the newest comments come while you read", (r) => {
      if (r.recent) fail("the newest comments are there already: once is enough");
      r.recent = recent;
      return `newest comments: ${recent.length}`;
    });
  } else if (cmd === "offer") {
    const offer = offerOf(workJson(args.join(" ").trim(), "the offer"), computed().comments);
    editReading("the reading is done: offers come while you read", (r) => {
      const offers = Array.isArray(r.offers) ? r.offers : [];
      if (offers.length >= MAX_OFFERS) fail(`there are ${MAX_OFFERS} offers already: that is enough`);
      if (offers.some((x) => x.kind === offer.kind)) fail("that offer is there already");
      offers.push({ ...offer, at: iso(new Date()) });
      r.offers = offers;
      return "offer: " + offer.kind;
    });
  } else if (cmd === "gift") {
    const gift = giftOf(workJson(args.join(" ").trim(), "the gift"), computed().comments);
    editReading("the reading is done: the gift comes while you read", (r) => {
      if (r.gift) fail("there is a gift already: one is enough");
      r.gift = { ...gift, at: iso(new Date()) };
      return "gift: " + gift.kind;
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
    const note = (workText(why.join(" ")).replace(/\s+/g, " ").trim() || c.note || "").slice(0, 200);
    writeJson(path.join(dataDir, "status.json"), { at: iso(n), ok: true, ...(note ? { why: note } : {}) });
    console.log(`latest.json written (${l.posts.length} posts, ${l.waiting.length} waiting), days/${ymd(n)}.json and status.json`);
  } else if (cmd === "done") {
    finishReading();
    try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("data/.work/ is busy: delete it in your next call"); }
    console.log("done");
  } else {
    fail("use start, cursor, calls, compute, latest, fail, push, recent, gift, offer or done");
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
