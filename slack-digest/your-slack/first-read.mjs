#!/usr/bin/env node
// The first catch-up's lines, gift and files, written only through here so the page can show
// them as they come. Only on the first catch-up (no data/latest.json yet). Run it from anywhere:
//   node <app>/first-read.mjs start                 new data/reading.json and data/.work/
//   node <app>/first-read.mjs push '<line>'         add one line (single quotes: "$" stays "$"),
//                                                   right after the Slack lookup that found it
//   node <app>/first-read.mjs gift @<file>          the one thing for the person, shown while you read:
//                                                   {"kind":"waiting","who","channel","channelId","ts",
//                                                   "gist","link"} or {"kind":"calm"}; who, channel,
//                                                   channelId, ts and link copied from a Slack answer
//   node <app>/first-read.mjs latest @<file> ['why'] write data/latest.json, today's day file and
//                                                   data/status.json from your file in data/.work/
//                                                   (generatedAt, schema and example set here)
//   node <app>/first-read.mjs done                  mark the reading done, delete data/.work/
// A line is one short sentence about their Slack, the finding in **bold**:
//   "**#support**: 4 new questions, 1 still waiting since yesterday"
// Every number in it is counted from what Slack answered, never guessed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA = "slack-digest";
const LATEST_SCHEMA = "slack-digest/your-slack@1";
const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const readingFile = path.join(dataDir, "reading.json");
const latestFile = path.join(dataDir, "latest.json");
const DAY = 86400000;
const URGENCY = ["High", "Medium", "Low"];

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
/** "@your-slack/data/.work/gift.json" means "@gift.json". */
function workJson(arg, what) {
  if (!arg.startsWith("@")) fail(`give ${what} as @<file>: the JSON you wrote into data/.work/`);
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

/** A line the page can show: one sentence about their Slack, never about the reading itself. */
function checkLine(line) {
  if (!line) fail("refused, an empty line: say what that lookup found, or push nothing");
  // "$4" in double quotes reaches here as "": refuse what the shell ate.
  if (/(^|[\s(*])[,.]\d/.test(line)) fail("refused, a number lost its start (a $ in double quotes?): use single quotes");
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object|\{|\}|<@?[UW][A-Z0-9]{6,}>/.test(line)) fail(`refused, the line is broken: ${line}`);
  if (line.length > 200) fail("refused, the line is longer than 200 characters");
  if (/\u2014/.test(line)) fail("refused, an em-dash: use a comma or a period");
  if (!/\*\*[^*]+\*\*/.test(line)) fail("refused, mark the finding in **bold**, like '**#support**: 4 new questions'");
  if (/^(I|I'm|I've|Searching|Reading|Looking|Checking|Opening|Trying)\b/i.test(line.replace(/\*/g, ""))) fail("refused, a line about the reading: say what you found in their Slack");
  // "**0 mentions**" is not a finding: a line whose numbers are all 0 says nothing.
  const bold = (line.match(/\*\*[^*]+\*\*/g) || []).join(" ");
  const nums = (bold.replace(/\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}/g, "").match(/\d[\d,.]*/g) || []);
  if (nums.length && nums.every((x) => Number(x.replace(/,/g, "")) === 0)) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
}

// ── The gift: one thing the person can act on now, shown while the reading goes on ──
function giftOf(g) {
  if (!g || typeof g !== "object" || Array.isArray(g)) fail("the gift must be an object");
  const kind = String(g.kind || "");
  if (kind === "calm") return { kind };
  if (kind !== "waiting") fail(`the gift kind is waiting or calm, not "${kind}"`);
  const out = { kind };
  const who = String(g.who || "").trim();
  if (!who) fail("a waiting gift needs who: the person's Slack display name");
  if (who.length > 80) fail("who is longer than 80 characters");
  if (/^[UW][A-Z0-9]{6,}$|<@|@.+\./.test(who)) fail("refused, who is an id or an address: give their Slack display name");
  out.who = who;
  const channel = String(g.channel || "").trim();
  if (!/^#[^\s#]{1,80}$/.test(channel)) fail("channel is the channel's name as Slack shows it, like #support (a direct message is never the gift)");
  out.channel = channel;
  if (g.channelId !== undefined && g.channelId !== "") {
    const id = String(g.channelId).trim();
    if (!/^[CG][A-Z0-9]{6,}$/.test(id)) fail("channelId is Slack's channel id, like C0123ABCD");
    out.channelId = id;
  }
  // When they asked comes from the message's own ts, never a typed date.
  const ts = String(g.ts || "").trim();
  if (!/^\d{9,11}(\.\d{1,6})?$/.test(ts)) fail("ts is the message's ts as Slack wrote it, like 1760432100.123456");
  const at = new Date(Number(ts) * 1000);
  if (at.getTime() > Date.now() + 5 * 60000 || at.getTime() < Date.now() - 14 * DAY) fail("refused, that message is not from the last 14 days");
  out.ts = ts;
  out.since = iso(at);
  if (g.link !== undefined && g.link !== "" && g.link !== null) {
    const link = String(g.link).trim();
    if (!/^https:\/\/[a-z0-9-]+\.slack\.com\//i.test(link) || link.length > 400) fail("link is the message's permalink on slack.com, or leave it out");
    out.link = link;
  }
  // The gist is one line in your words: what they want. No numbers, no quote of the message.
  if (g.gist !== undefined && g.gist !== "") {
    const gist = String(g.gist).trim();
    if (gist.length > 140) fail("the gist is longer than 140 characters");
    if (/\d/.test(gist)) fail("refused, a number in the gist: say what they want, without numbers");
    out.gist = gist;
  }
  return out;
}

/** latest.json in the page's own shape: a channel row the page cannot show is refused here. */
function latestOf(l) {
  if (!l || typeof l !== "object" || Array.isArray(l)) fail("latest.json must be an object");
  if (!Array.isArray(l.channels)) fail("latest.json needs channels (an empty list on a quiet day)");
  if (typeof l.headline !== "string" || !l.headline.trim()) fail("latest.json needs a headline (\"Here is what moved in your Slack\" or \"Your Slack was quiet\")");
  l.channels.forEach((c, i) => {
    if (!c || typeof c !== "object" || typeof c.name !== "string" || !c.name.trim()) fail(`channels[${i}] needs a name`);
    if (!URGENCY.includes(c.urgency)) fail(`channels[${i}].urgency is High, Medium or Low, not "${c.urgency}"`);
    if (!c.id) c.id = "c" + (i + 1);
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
  lockReading();
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  if (r.done) fail("the reading is done: no more lines");
  const line = String(args.join(" ") || "").replace(/\s+/g, " ").trim();
  checkLine(line);
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
  const note = why.join(" ").replace(/\s+/g, " ").trim().slice(0, 200);
  writeJson(path.join(dataDir, "status.json"), { at: iso(n), ok: true, ...(note ? { why: note } : {}) });
  console.log(`latest.json written (${l.channels.length} channels), days/${ymd(n)}.json and status.json`);
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
