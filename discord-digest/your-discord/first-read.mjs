#!/usr/bin/env node
// The first read's lines, written only through here, so the page never gets a broken file
// while it watches. Run it from anywhere:
//   node <app>/first-read.mjs start                 new data/reading.json and data/.work/
//   node <app>/first-read.mjs recent @<file>        the latest messages, shown at once (very early, again
//                                                   later to refresh): a JSON list of 1 to 8
//                                                   {"who","where","parent","gist","at","link"}
//   node <app>/first-read.mjs push '<line>'         add one line (single quotes: "$" stays "$")
//   node <app>/first-read.mjs gift @<file>          the one thing for the person, shown while you read:
//                                                   {"kind":"question","who","channel","since","gist","link"}
//                                                   {"kind":"busy","name","parent","messages","link"}
//                                                   {"kind":"calm"}
//                                                   who, channel, name, since and link copied from
//                                                   Discord's answers as they came.
//   node <app>/first-read.mjs offer @<file>         one more thing the person can do now (at most 3):
//                                                   {"kind":"reply","who","channel","since","gist","link"}
//                                                   {"kind":"catchup","name","parent","gist","link"}
//                                                   {"kind":"summary","name","parent","gist","link"}
//                                                   {"kind":"announce","channel","level":"write","gist"}
//   node <app>/first-read.mjs latest @<file>        write data/latest.json from your script's file, its
//                                                   copy in data/days/, and data/status.json
//                                                   (schema, generatedAt and the day set here; a
//                                                   top-level "why" goes to status.json)
//   node <app>/first-read.mjs done                  mark the reading done, delete data/.work/
// A <file> is relative to data/.work/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA = "discord-digest";
const LATEST_SCHEMA = "discord-digest/your-discord@1";
const GIFT_KINDS = { question: ["who", "channel", "since"], busy: ["name"], calm: [] };
const OFFER_KINDS = { reply: ["who", "channel", "since"], catchup: ["name"], summary: ["name"], announce: ["channel", "level"] };
const MAX_OFFERS = 3;
const MAX_RECENT = 8;
const DISCORD_LINK = /^https:\/\/(ptb\.|canary\.)?discord\.com\/channels\/[\d@me/]+$/i;

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const daysDir = path.join(dataDir, "days");
const readingFile = path.join(dataDir, "reading.json");
const DAY = 86400000;

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
/** "@your-discord/data/.work/gift.json" means "@gift.json". */
function argFile(args, what) {
  const arg = args.join(" ").trim();
  if (!arg.startsWith("@")) fail(`give ${what} as @<file>: the JSON your script wrote into data/.work/`);
  const name = arg.slice(1).replace(/^.*data[\\/]\.work[\\/]/, "");
  try { return readJson(workFile(name)); } catch { return fail(`${name} is not JSON in data/.work/`); }
}

/** A line or a field the page shows: plain words, never a raw id or a broken value. */
function checkWords(s, where) {
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object|\{|\}/.test(s)) fail(`refused, ${where} is broken: ${s}`);
  // <@194...> or <#1290...>: a raw mention. Name people and channels as Discord shows them.
  if (/<[@#][!&]?\d+>/.test(s)) fail(`refused, a raw Discord mention in ${where}: write the display name or the #channel`);
  if (/\b\d{17,20}\b/.test(s)) fail(`refused, a Discord id in ${where}: write the name instead`);
  // A long dash reads as written by a machine: a comma, a period or plain words instead.
  if (/[\u2014\u2013]/.test(s)) fail(`refused, a dash like "\u2014" in ${where}: use a comma or a period`);
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

// ── The gift: one thing the person can do now, shown while the reading goes on ──
/** A time as discord_read_channel gave it ("at"), in the last 14 days. */
function timeOf(value, key) {
  const d = new Date(String(value).trim());
  if (isNaN(d.getTime())) fail(`${key} "${value}" is not a time: copy the message's "at" as Discord gave it`);
  if (d.getTime() > Date.now() + 5 * 60000 || d.getTime() < Date.now() - 14 * DAY) fail(`${key} must be a time in the last 14 days`);
  return iso(d);
}
function linkOf(value) {
  const link = String(value).trim();
  if (!DISCORD_LINK.test(link) || link.length > 400) fail("link is the message's link exactly as Discord gave it (https://discord.com/channels/...)");
  return link;
}
/** The words of a gift or an offer: each field plain, short, and copied as Discord wrote it. */
function fieldsOf(g, kinds, what) {
  if (!g || typeof g !== "object" || Array.isArray(g)) fail(`the ${what} must be an object`);
  const kind = String(g.kind || "");
  if (!kinds[kind]) fail(`the ${what} kind is ${Object.keys(kinds).join(", ")}, not "${kind}"`);
  for (const key of kinds[kind]) if (typeof g[key] !== "string" || !g[key].trim()) fail(`a ${kind} ${what} needs ${key}`);
  const out = { kind };
  for (const [key, max] of [["who", 80], ["channel", 80], ["name", 100], ["parent", 80], ["gist", 140]]) {
    if (g[key] === undefined || g[key] === null || g[key] === "") continue;
    const v = String(g[key]).trim();
    if (v.length > max) fail(`${key} is longer than ${max} characters`);
    checkWords(v, `the ${what}'s ${key}`);
    out[key] = v;
  }
  if (out.channel && !out.channel.startsWith("#")) fail(`channel is the #channel as Discord spells it, like "#help", not "${out.channel}"`);
  // When they asked: the message's "at" as discord_read_channel gave it.
  if (g.since !== undefined && g.since !== "") out.since = timeOf(g.since, "since");
  if (g.link !== undefined && g.link !== "") out.link = linkOf(g.link);
  return out;
}
function offerOf(o) {
  const out = fieldsOf(o, OFFER_KINDS, "offer");
  // An announcement only where the team may write: the channel's level from discord_list_channels.
  if (out.kind === "announce" && String(o.level).trim() !== "write") fail("an announce offer is only for a channel set to write (level \"write\" in discord_list_channels)");
  return out;
}
function giftOf(g) {
  const out = fieldsOf(g, GIFT_KINDS, "gift");
  if (g.messages !== undefined && g.messages !== "") {
    const n = Number(g.messages);
    if (!Number.isInteger(n) || n < 1 || n > 100000) fail("messages is a whole number of messages you read there, 1 or more");
    out.messages = n;
  }
  return out;
}
/** The latest messages: who, where, what in a few words, and when, as Discord gave them. */
function recentOf(list) {
  if (!Array.isArray(list) || !list.length) fail("recent is a JSON list of 1 to 8 messages");
  if (list.length > MAX_RECENT) fail(`recent holds at most ${MAX_RECENT} messages: the newest ones`);
  return list.map((m, i) => {
    if (!m || typeof m !== "object" || Array.isArray(m)) fail(`message ${i + 1} must be an object`);
    const out = {};
    for (const [key, max, need] of [["who", 60, true], ["where", 80, true], ["parent", 40, false], ["gist", 140, true]]) {
      const v = m[key] === undefined || m[key] === null ? "" : String(m[key]).trim();
      if (!v) { if (need) fail(`message ${i + 1} needs ${key}`); continue; }
      if (v.length > max) fail(`message ${i + 1}: ${key} is longer than ${max} characters`);
      checkWords(v, `message ${i + 1}'s ${key}`);
      out[key] = v;
    }
    if (!m.at) fail(`message ${i + 1} needs at, its time as Discord gave it`);
    out.at = timeOf(m.at, `message ${i + 1}'s at`);
    if (m.link) out.link = linkOf(m.link);
    return out;
  });
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "start") {
  // Files left from an earlier run are not this run's; ones written in the last 15 minutes are.
  if (fs.existsSync(workDir)) for (const f of fs.readdirSync(workDir)) {
    const p = path.join(workDir, f);
    try { if (Date.now() - fs.statSync(p).mtimeMs > 15 * 60000) fs.rmSync(p, { recursive: true, force: true }); } catch { /* busy: left */ }
  }
  fs.mkdirSync(workDir, { recursive: true });
  writeJson(readingFile, { schema: `${SCHEMA}/reading@1`, startedAt: iso(new Date()), done: false, lines: [] });
  console.log("reading started; write your files in " + path.relative(process.cwd(), workDir));
} else if (cmd === "push") {
  lockReading();
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  if (r.done) fail("the reading is done: no more lines");
  const line = String(args.join(" ") || "").trim();
  if (!line || !line.replace(/\*/g, "").trim()) fail("refused, an empty line: say what you found");
  // "$2,679" in double quotes reaches here as ",679": refuse what the shell ate.
  if (/(^|[\s(*])[,.]\d/.test(line)) fail("refused, a number lost its start (a $ in double quotes?): use single quotes");
  checkWords(line, "the line");
  // "**0 messages**" is not a finding: a line whose numbers are all 0 says nothing.
  const bold = (line.match(/\*\*[^*]+\*\*/g) || []).join(" ");
  const nums = ((bold || line).replace(/\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}/g, "").match(/\d[\d,.]*/g) || []);
  if (nums.length && nums.every((x) => Number(x.replace(/,/g, "")) === 0)) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
  if (line.length > 200) fail("refused, the line is longer than 200 characters");
  if (r.lines.includes(line)) fail("that line is already there");
  r.lines.push(line);
  writeJson(readingFile, r);
  console.log(`line ${r.lines.length}: ${line}`);
} else if (cmd === "gift") {
  const gift = giftOf(argFile(args, "the gift"));
  lockReading();
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  if (r.done) fail("the reading is done: the gift comes while you read");
  if (r.gift) fail("there is a gift already: one is enough");
  r.gift = { ...gift, at: iso(new Date()) };
  writeJson(readingFile, r);
  console.log("gift: " + JSON.stringify(r.gift));
} else if (cmd === "recent") {
  const recent = recentOf(argFile(args, "the latest messages"));
  lockReading();
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  if (r.done) fail("the reading is done: the latest messages come while you read");
  r.recent = recent;
  writeJson(readingFile, r);
  console.log(`recent: ${recent.length} ${recent.length === 1 ? "message" : "messages"}`);
} else if (cmd === "offer") {
  const offer = offerOf(argFile(args, "the offer"));
  lockReading();
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  if (r.done) fail("the reading is done: offers come while you read");
  const offers = Array.isArray(r.offers) ? r.offers : [];
  if (offers.length >= MAX_OFFERS) fail(`there are ${MAX_OFFERS} offers already: that is enough`);
  const same = (a) => a.kind === offer.kind && (a.name || a.channel || a.who) === (offer.name || offer.channel || offer.who);
  if (offers.some(same) || (r.gift && r.gift.kind === "question" && offer.kind === "reply" && r.gift.who === offer.who && r.gift.channel === offer.channel)) fail("that one is offered already");
  offers.push({ ...offer, at: iso(new Date()) });
  r.offers = offers;
  writeJson(readingFile, r);
  console.log(`offer ${offers.length}: ` + JSON.stringify(offers[offers.length - 1]));
} else if (cmd === "latest") {
  // latest.json from the JSON your script wrote into data/.work/: the helper sets what it can
  // know for sure (the schema and the time), keeps the day's copy and writes status.json.
  const l = argFile(args, "latest.json");
  if (!l || typeof l !== "object" || Array.isArray(l)) fail("latest.json must be an object");
  if (!Array.isArray(l.channels)) fail("latest.json needs channels, a list ([] when nothing moved)");
  if (typeof l.server !== "string" || !l.server.trim()) fail("latest.json needs server, the name discord_list_channels gave");
  const why = typeof l.why === "string" ? l.why.trim() : "";
  delete l.why;
  delete l.example;
  const n = new Date();
  l.schema = LATEST_SCHEMA;
  l.generatedAt = iso(n);
  writeJson(path.join(dataDir, "latest.json"), l);
  fs.mkdirSync(daysDir, { recursive: true });
  writeJson(path.join(daysDir, ymd(n) + ".json"), l);
  // Day files older than 30 days go.
  for (const f of fs.readdirSync(daysDir)) {
    const m = /^(\d{4})-(\d{2})-(\d{2})\.json$/.exec(f);
    if (m && n.getTime() - new Date(+m[1], +m[2] - 1, +m[3]).getTime() > 30 * DAY) fs.rmSync(path.join(daysDir, f), { force: true });
  }
  writeJson(path.join(dataDir, "status.json"), why ? { at: iso(n), ok: true, why } : { at: iso(n), ok: true });
  console.log(`latest.json written, its copy in days/${ymd(n)}.json, and status.json`);
} else if (cmd === "done") {
  lockReading();
  const r =fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  r.done = true;
  writeJson(readingFile, r);
  try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("data/.work/ is busy: delete it in your next call"); }
  console.log("reading done");
} else {
  fail("use start, recent, push, gift, offer, latest or done");
}
