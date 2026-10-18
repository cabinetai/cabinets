#!/usr/bin/env node
// The first check's lines, gift, offers and board, written only through here so the page can
// show them as they come. Only on the first check (no data/latest.json yet). Run it from anywhere:
//   node <app>/first-read.mjs start                 new data/reading.json and data/.work/
//   node <app>/first-read.mjs push '<line>'         add one line (single quotes: "$" stays "$", in bash
//                                                   and PowerShell alike), right after the Salesforce
//                                                   query that found it. A line with an apostrophe:
//                                                   write it to data/.work/line.txt and push @line.txt
//   node <app>/first-read.mjs gift @<file>          the one thing for the person, shown while you read:
//                                                   {"kind":"item","level","title","account","amount",
//                                                   "why","next","link"} or {"kind":"calm"}, from this
//                                                   run's answers
//   node <app>/first-read.mjs offer @<file>         one more thing they can do now, under the gift, at
//                                                   most 2: {"kind":"nudges"} or {"kind":"leads"}
//   node <app>/first-read.mjs latest @<file> [@why.txt] write data/latest.json and data/status.json
//                                                   from your file in data/.work/ (schema and
//                                                   generatedAt set here, example dropped); a partial
//                                                   run's why: write it to data/.work/why.txt
//   node <app>/first-read.mjs done                  mark the reading done, delete data/.work/
// A line is one short sentence about their deals, the finding in **bold**:
//   "Found **12 open deals**, $263,750 in all"
// Every number in it is counted from what Salesforce answered, never guessed.
// Nothing here changes Salesforce: every press on the page asks the agent in the chat.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA = "deal-watch";
const LATEST_SCHEMA = "deal-watch/board@1";
const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const readingFile = path.join(dataDir, "reading.json");
const latestFile = path.join(dataDir, "latest.json");
const KINDS = ["Slipping", "Quiet", "Late", "Task", "NoStep", "Lead", "Other"];
const LEVELS = ["High", "Medium", "Low"];

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

/**
 * A raw Salesforce record id: 15 or 18 letters and digits that start with the prefix of a
 * deal (006), lead (00Q), task (00T), account (001), contact (003), user (005 or 00U) or case
 * (500). Only those prefixes, so a long word or number that merely looks like one passes.
 */
const RAW_ID = /\b(006|00Q|00T|001|003|005|00U|500)[0-9A-Za-z]{12}([0-9A-Za-z]{3})?\b/;
/** A link to one record, on the person's own Salesforce address, as the page accepts it. */
const RECORD_LINK = /^https:\/\/[a-z0-9-]+(\.sandbox|\.develop)?\.(my\.salesforce\.com|lightning\.force\.com)\/lightning\/r\/[A-Za-z]+\/[a-zA-Z0-9]{15,18}\/view$/;

/** A line the page can show: one sentence about their deals, never about the reading itself. */
function checkLine(line) {
  if (!line) fail("refused, an empty line: say what that query found, or push nothing");
  // "$4" in double quotes reaches here as "": refuse what the shell ate.
  if (/(^|[\s(*])[,.]\d/.test(line)) fail("refused, a number lost its start (a $ in double quotes?): use single quotes");
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object|\{|\}/.test(line) || RAW_ID.test(line)) fail(`refused, the line is broken or carries a raw id: ${line}`);
  if (/https?:\/\//i.test(line)) fail("refused, a link in a line: name the deal instead");
  if (line.length > 200) fail("refused, the line is longer than 200 characters");
  if (/[\u2014\u2013]/.test(line)) fail("refused, a long dash: use a comma or a period");
  if (!/\*\*[^*]+\*\*/.test(line)) fail("refused, mark the finding in **bold**, like 'Found **12 open deals**, $263,750 in all'");
  if (/^(I|I'm|I've|Searching|Reading|Looking|Checking|Opening|Trying|Querying)\b/i.test(line.replace(/\*/g, ""))) fail("refused, a line about the reading: say what you found in their deals");
  // "**0 deals**" is not a finding: a line whose numbers are all 0 says nothing.
  const bold = (line.match(/\*\*[^*]+\*\*/g) || []).join(" ");
  const nums = (bold.replace(/\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}/g, "").match(/\d[\d,.]*/g) || []);
  if (nums.length && nums.every((x) => Number(x.replace(/,/g, "")) === 0)) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
}

// ── What the page shows beside the lines: from this run's answers, checked here ──
/** Your own words for the page: no raw ids, no links, no long dash, nothing broken. */
function checkWords(text, what) {
  if (/[\u2014\u2013]/.test(text)) fail(`refused, a long dash in ${what}: use a comma or a period`);
  if (RAW_ID.test(text)) fail(`refused, a raw Salesforce id in ${what}: write the name`);
  if (/https?:\/\//i.test(text)) fail(`refused, a link in ${what}: the link goes in link`);
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
/** A record link built from the address in setup.md and an Id Salesforce returned, or "". */
function linkOf(value, what) {
  if (value === undefined || value === "" || value === null) return "";
  const link = String(value).trim();
  if (!RECORD_LINK.test(link)) fail(`${what}: link is <your Salesforce address>/lightning/r/<Type>/<Id>/view, or leave it out`);
  return link;
}

// ── The gift: one thing the person can act on now, shown while the reading goes on ──
function giftOf(g) {
  if (!g || typeof g !== "object" || Array.isArray(g)) fail("the gift must be an object");
  const kind = String(g.kind || "");
  if (kind === "calm") return { kind };
  if (kind !== "item") fail(`the gift kind is item or calm, not "${kind}"`);
  const level = String(g.level || "");
  if (!LEVELS.includes(level)) fail(`the gift's level is High, Medium or Low, not "${level}"`);
  const title = wordsOf(g.title, 100, "the gift's title");
  if (!title) fail("the gift needs a title: the deal's or the lead's name as Salesforce has it");
  // The why carries the facts behind it (dates, days, amounts), from this run's answers.
  const why = wordsOf(g.why, 220, "the gift's why");
  if (!why || !/\d/.test(why)) fail("the gift needs a why: one or two sentences with the facts (dates, days, amounts)");
  const out = { kind, level, title, why };
  const account = wordsOf(g.account, 100, "the gift's account");
  if (account) out.account = account;
  if (g.amount !== undefined && g.amount !== null) {
    const n = Number(g.amount);
    if (!isFinite(n) || n < 0) fail("the gift's amount is the deal's Amount as a number, or leave it out");
    out.amount = n;
  }
  const next = wordsOf(g.next, 200, "the gift's next");
  if (next) out.next = next;
  const link = linkOf(g.link, "the gift");
  if (link) out.link = link;
  return out;
}

// ── More things to do now, under the gift: each one a draft or a list in the chat ──
const OFFER_KINDS = ["nudges", "leads"];
const MAX_OFFERS = 2;
function offerOf(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) fail("the offer must be an object");
  const kind = String(o.kind || "");
  if (!OFFER_KINDS.includes(kind)) fail(`the offer kind is ${OFFER_KINDS.join(" or ")}, not "${kind}"`);
  return { kind };
}

/** latest.json in the page's own shape: a row the page cannot show is refused here. */
function latestOf(l) {
  if (!l || typeof l !== "object" || Array.isArray(l)) fail("latest.json must be an object");
  if (!Array.isArray(l.items)) fail("latest.json needs items (an empty list on a calm day)");
  for (const key of ["settled", "weeks", "known"]) {
    if (l[key] !== undefined && !Array.isArray(l[key])) fail(`latest.json: ${key} is a list (leave it out, or [] when there is none)`);
  }
  if (l.items.length > 8) fail("at most 8 items: keep the most urgent");
  // The first check has nothing to compare with: no close date can have moved since yesterday,
  // and nothing was on a board to leave it. `first` lets the page say there is no comparison yet.
  const first = !fs.existsSync(latestFile);
  const ids = new Set();
  l.items.forEach((x, i) => {
    const what = `items[${i}]`;
    if (!x || typeof x !== "object" || typeof x.title !== "string" || !x.title.trim()) fail(`${what} needs a title`);
    if (!KINDS.includes(x.kind)) fail(`${what}.kind is ${KINDS.join(", ")}, not "${x.kind}"`);
    if (first && x.kind === "Slipping") fail(`${what}: nothing slips on the first check (there is no yesterday to compare with): give it its other reason, or leave it off`);
    if (!LEVELS.includes(x.level)) fail(`${what}.level is High, Medium or Low, not "${x.level}"`);
    if (typeof x.id !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(x.id)) fail(`${what}.id is short kebab-case words, the same every day`);
    if (ids.has(x.id)) fail(`${what}.id "${x.id}" is there twice: one item per record`);
    ids.add(x.id);
    for (const key of ["title", "why", "next", "account", "company", "stage", "status", "owner"]) {
      if (typeof x[key] === "string") checkWords(x[key], `${what}.${key}`);
    }
    if (x.facts !== undefined) {
      if (!Array.isArray(x.facts) || !x.facts.every((f) => typeof f === "string")) fail(`${what}.facts is a list of short strings`);
      x.facts.forEach((f) => checkWords(f, `${what}.facts`));
    }
    if (x.amount !== undefined && x.amount !== null && !(typeof x.amount === "number" && x.amount >= 0)) fail(`${what}.amount is a number, or null`);
    if (x.url !== undefined && x.url !== "") linkOf(x.url, what);
  });
  (l.weeks || []).forEach((w, i) => {
    if (!w || !/^\d{4}-\d{2}-\d{2}$/.test(String(w.from || "")) || !Number.isInteger(w.count) || typeof w.amount !== "number") fail(`weeks[${i}] is {"from": "YYYY-MM-DD", "count", "amount"}`);
  });
  (l.known || []).forEach((k, i) => {
    if (!k || typeof k.id !== "string" || !k.id) fail(`known[${i}] needs id: the deal's record Id`);
  });
  if ((l.known || []).length > 200) fail("known holds at most 200 deals");
  if (first) {
    l.settled = [];
    l.first = true;
  } else delete l.first;
  const n = new Date();
  l.schema = LATEST_SCHEMA;
  l.generatedAt = iso(n);
  delete l.example;
  return l;
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
} else if (cmd === "latest") {
  const [file, ...why] = args;
  const l = latestOf(workJson(String(file || "").trim(), "latest.json"));
  const n = new Date();
  writeJson(latestFile, l);
  // "@why.txt" reads the note from data/.work/, for a note no shell can quote ("the company's limit").
  const said = why.join(" ").trim();
  const note = (/^@[\w.-]+$/.test(said) ? fs.readFileSync(workFile(said.slice(1)), "utf8") : said).replace(/\s+/g, " ").trim().slice(0, 200);
  writeJson(path.join(dataDir, "status.json"), { at: iso(n), ok: true, ...(note ? { why: note } : {}) });
  console.log(`latest.json written (${l.items.length} items) and status.json`);
} else if (cmd === "done") {
  lockReading();
  const r = readReading();
  r.done = true;
  writeJson(readingFile, r);
  try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("data/.work/ is busy: delete it in your next call"); }
  console.log("reading done");
} else {
  fail("use start, push, gift, offer, latest or done");
}
