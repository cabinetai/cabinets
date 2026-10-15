#!/usr/bin/env node
// The first update's lines, gift and offer, written only through here so the page can show
// them as they come. Only on the first update (no dated file in triage/ yet). Run it from anywhere:
//   node <app>/first-read.mjs start              new data/reading.json and data/.work/
//   node <app>/first-read.mjs push '<line>'      add one line (single quotes: "$" stays "$"),
//                                                right after the Slack lookup that found it
//   node <app>/first-read.mjs gift @<file>       the one thing for the person, shown while you read:
//                                                {"kind":"oldest","who","channel","channelId","ts",
//                                                "item","link"} or {"kind":"calm"}; who, channel,
//                                                channelId, ts and link copied from a Slack answer
//   node <app>/first-read.mjs offer @<file>      one more thing they can make now, under the gift, at
//                                                most 1: {"kind":"checkin","item","link"}
//   node <app>/first-read.mjs done               mark the reading done, delete data/.work/
// A line is one short sentence about their Slack, the finding in **bold**:
//   "**#support**: 5 new requests since yesterday, 2 nobody has picked up"
// Every number in it is counted from what Slack answered, never guessed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA = "slack-triage";
const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const readingFile = path.join(dataDir, "reading.json");
const triageDir = path.join(here, "..", "triage");
const DAY = 86400000;
const MAX_OFFERS = 1;

// ── Time, in this machine's zone (the person's own) ──
const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, "0");
function offsetOf(d) { const o = -d.getTimezoneOffset(); return (o >= 0 ? "+" : "-") + pad(o / 60) + ":" + pad(o % 60); }
function iso(d) {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" +
    pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) + offsetOf(d);
}

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
/** "@triage-board/data/.work/gift.json" means "@gift.json". */
function workJson(arg, what) {
  if (!arg.startsWith("@")) fail(`give ${what} as @<file>: the JSON you wrote into data/.work/`);
  try { return readJson(workFile(arg.slice(1).replace(/^.*data[\\/]\.work[\\/]/, ""))); } catch { return fail(`${arg.slice(1)} is not JSON in data/.work/`); }
}

/** One write to reading.json at a time: two at once would each write their own copy and lose one. */
function lockReading() {
  if (!fs.existsSync(dataDir)) fail("run start first");
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
  if (!/\*\*[^*]+\*\*/.test(line)) fail("refused, mark the finding in **bold**, like '**#support**: 5 new requests'");
  if (/^(I|I'm|I've|Searching|Reading|Looking|Checking|Opening|Trying)\b/i.test(line.replace(/\*/g, ""))) fail("refused, a line about the reading: say what you found in their Slack");
  // "**0 requests**" is not a finding: a line whose numbers are all 0 says nothing.
  const bold = (line.match(/\*\*[^*]+\*\*/g) || []).join(" ");
  const nums = (bold.replace(/\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}/g, "").match(/\d[\d,.]*/g) || []);
  if (nums.length && nums.every((x) => Number(x.replace(/,/g, "")) === 0)) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
}

// ── What the page shows beside the lines: copied from Slack's answers, checked here ──
/** Your own words for the page: no raw ids, no em-dash, nothing broken. */
function checkWords(text, what) {
  if (/\u2014/.test(text)) fail(`refused, an em-dash in ${what}: use a comma or a period`);
  if (/<@?[UWBC][A-Z0-9]{6,}>|\b[UW][A-Z0-9]{8,}\b/.test(text)) fail(`refused, a raw Slack id in ${what}: write the name`);
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object/.test(text)) fail(`refused, ${what} is broken: ${text}`);
}
/** A person's Slack display name, never an id or an address. */
function nameOf(value, what) {
  const who = String(value || "").trim();
  if (!who) fail(`${what} needs who: the person's Slack display name`);
  if (who.length > 80) fail(`${what}: who is longer than 80 characters`);
  if (/^[UWB][A-Z0-9]{6,}$|<@|@.+\./.test(who)) fail(`refused, ${what}: who is an id or an address. Give their Slack display name`);
  checkWords(who, what);
  return who;
}
/** An item as the board writes it: what the request is, in a few of your words. */
function itemOf(value, what) {
  const item = String(value || "").replace(/\s+/g, " ").trim();
  if (!item) fail(`${what} needs item: what the request is, as the board writes it`);
  if (item.length > 80) fail(`${what}: the item is longer than 80 characters`);
  checkWords(item, what);
  return item;
}
/** When a message was written, from its own ts, never a typed date: { ts, at }. */
function tsOf(value, days, what) {
  const ts = String(value || "").trim();
  if (!/^\d{9,11}(\.\d{1,6})?$/.test(ts)) fail(`${what}: ts is the message's ts as Slack wrote it, like 1760432100.123456`);
  const at = new Date(Number(ts) * 1000);
  if (at.getTime() > Date.now() + 5 * 60000 || at.getTime() < Date.now() - days * DAY) fail(`refused, ${what} is not from the last ${days} days`);
  return { ts, at: iso(at) };
}
/** A channel's name as Slack shows it: "#support". A direct message is never shown here. */
function channelOf(value, what) {
  const channel = String(value || "").trim();
  if (!/^#[^\s#]{1,80}$/.test(channel)) fail(`${what}: channel is the channel's name as Slack shows it, like #support (never a direct message)`);
  return channel;
}
function linkOf(value, what) {
  if (value === undefined || value === "" || value === null) return "";
  const link = String(value).trim();
  if (!/^https:\/\/[a-z0-9-]+\.slack\.com\//i.test(link) || link.length > 400) fail(`${what}: link is the message's permalink on slack.com, or leave it out`);
  return link;
}

// ── The gift: the request that has waited longest for a person, or the good news that none has ──
function giftOf(g) {
  if (!g || typeof g !== "object" || Array.isArray(g)) fail("the gift must be an object");
  const kind = String(g.kind || "");
  if (kind === "calm") return { kind };
  if (kind !== "oldest") fail(`the gift kind is oldest or calm, not "${kind}"`);
  const out = { kind, who: nameOf(g.who, "the gift"), channel: channelOf(g.channel, "the gift") };
  if (g.channelId !== undefined && g.channelId !== "") {
    const id = String(g.channelId).trim();
    if (!/^[CG][A-Z0-9]{6,}$/.test(id)) fail("channelId is Slack's channel id, like C0123ABCD");
    out.channelId = id;
  }
  // When they asked comes from the message's own ts, never a typed date.
  const t = tsOf(g.ts, 14, "the gift");
  out.ts = t.ts;
  out.since = t.at;
  out.item = itemOf(g.item, "the gift");
  const link = linkOf(g.link, "the gift");
  if (link) out.link = link;
  return out;
}

// ── One more thing to make now, under the gift: a draft in the chat, never posted ──
function offerOf(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) fail("the offer must be an object");
  const kind = String(o.kind || "");
  if (kind !== "checkin") fail(`the offer kind is checkin, not "${kind}"`);
  const out = { kind, item: itemOf(o.item, "the checkin offer") };
  const link = linkOf(o.link, "the checkin offer");
  if (link) out.link = link;
  return out;
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "start") {
  // Later updates are told the usual way: the reading is only for the first one.
  const passed = fs.existsSync(triageDir) && fs.readdirSync(triageDir).some((f) => /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-triage\.md$/.test(f));
  if (passed) fail("triage/ has a dated pass, so this is not the first update: carry on without the helper");
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
} else if (cmd === "offer") {
  const offer = offerOf(workJson(args.join(" ").trim(), "the offer"));
  lockReading();
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  if (r.done) fail("the reading is done: offers come while you read");
  const offers = Array.isArray(r.offers) ? r.offers : [];
  if (offers.length >= MAX_OFFERS) fail(`there is ${MAX_OFFERS} offer already: that is enough`);
  offers.push({ ...offer, at: iso(new Date()) });
  r.offers = offers;
  writeJson(readingFile, r);
  console.log("offer: " + JSON.stringify(offer));
} else if (cmd === "gift") {
  const gift = giftOf(workJson(args.join(" ").trim(), "the gift"));
  lockReading();
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  if (r.done) fail("the reading is done: the gift comes while you read");
  if (r.gift) fail("there is a gift already: one is enough");
  r.gift = { ...gift, at: iso(new Date()) };
  writeJson(readingFile, r);
  console.log("gift: " + JSON.stringify(r.gift));
} else if (cmd === "done") {
  lockReading();
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  r.done = true;
  writeJson(readingFile, r);
  try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("data/.work/ is busy: delete it in your next call"); }
  console.log("reading done");
} else {
  fail("use start, push, gift, offer or done");
}
