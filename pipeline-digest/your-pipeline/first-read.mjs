#!/usr/bin/env node
// The first catch-up's lines, gift and files, written only through here so the page can show
// them as they come. Only on the first catch-up (no data/latest.json yet). Run it from anywhere:
//   node <app>/first-read.mjs start                 new data/reading.json and data/.work/
//   node <app>/first-read.mjs push '<line>'         add one line (single quotes: "$" stays "$", in bash
//                                                   and PowerShell alike), right after the Salesforce
//                                                   query that found it. A line with an apostrophe:
//                                                   write it to data/.work/line.txt and push @line.txt
//   node <app>/first-read.mjs top @<file>           the biggest open deals, shown at once, very early:
//                                                   a list of up to 5 {"name","account","amount","stage",
//                                                   "closeDate","link"}, copied from a Salesforce answer
//   node <app>/first-read.mjs gift @<file>          the one thing for the person, shown while you read:
//                                                   {"kind":"quiet","name","account","amount","days",
//                                                   "recordId","gist","link"}, {"kind":"closing","name",
//                                                   "account","amount","closeDate","recordId","gist","link"}
//                                                   or {"kind":"calm"}
//   node <app>/first-read.mjs offer @<file>         one more thing they can do now, under the gift, at
//                                                   most 2: {"kind":"calls"} or {"kind":"leads","people"}
//   node <app>/first-read.mjs latest @<file> [@why.txt] write data/latest.json, today's day file and
//                                                   data/status.json from your file in data/.work/
//                                                   (schema and generatedAt set here, example dropped);
//                                                   a partial run's why: write it to data/.work/why.txt
//   node <app>/first-read.mjs done                  mark the reading done, delete data/.work/
// A line is one short sentence about their pipeline, the finding in **bold**:
//   "Found **12 open deals**, $263,750 in all"
// Every number in it is counted from what Salesforce answered, never guessed.
// Nothing here writes to Salesforce: every press on the page asks the agent in the chat.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA = "pipeline-digest";
const LATEST_SCHEMA = "pipeline-digest/your-pipeline@1";
const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const readingFile = path.join(dataDir, "reading.json");
const latestFile = path.join(dataDir, "latest.json");
const DAY = 86400000;
const CHANGES = ["stage", "amount", "date", "won", "lost", "new"];
/** The changes that need the last catch-up's known: none of them on the first one. */
const COMPARED = ["stage", "amount", "date"];
const DIRS = ["up", "down", "new"];
const LISTS = ["moved", "closing", "stale", "tasks", "leads", "changes", "daily", "known"];

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
/** "@your-pipeline/data/.work/gift.json" means "@gift.json". */
function workName(arg) { return arg.slice(1).replace(/^.*data[\\/]\.work[\\/]/, ""); }
function workJson(arg, what) {
  if (!arg.startsWith("@")) fail(`give ${what} as @<file>: the JSON you wrote into data/.work/`);
  try { return readJson(workFile(workName(arg))); } catch { return fail(`${arg.slice(1)} is not JSON in data/.work/`); }
}
/** "@line.txt" reads plain text from data/.work/, for words no shell can quote; anything else is the words. */
function workText(arg) {
  const said = String(arg || "").trim();
  return /^@\S+$/.test(said) ? fs.readFileSync(workFile(workName(said)), "utf8") : said;
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

/** A raw Salesforce record id (a deal, a lead, a task, an account, a contact, a person, a case). */
const RAW_ID = /\b(006|00Q|00T|00U|001|003|005|500)[a-zA-Z0-9]{12}([a-zA-Z0-9]{3})?\b|\/lightning\/r\//;
/** A record's own page on the company's Salesforce address, the only link the page opens. */
const RECORD_LINK = /^https:\/\/[a-z0-9-]+(\.sandbox|\.develop)?\.(my\.salesforce\.com|lightning\.force\.com)\/lightning\/r\/[A-Za-z]+\/[a-zA-Z0-9]{15,18}\/view$/;

/** A line the page can show: one sentence about their pipeline, never about the reading itself. */
function checkLine(line) {
  if (!line) fail("refused, an empty line: say what that query found, or push nothing");
  // "$4" in double quotes reaches here as "": refuse what the shell ate.
  if (/(^|[\s(*])[,.]\d/.test(line)) fail("refused, a number lost its start (a $ in double quotes?): use single quotes");
  if (/\{|\}/.test(line)) fail(`refused, the line is broken: ${line}`);
  checkWords(line, "the line");
  if (line.length > 200) fail("refused, the line is longer than 200 characters");
  if (!/\*\*[^*]+\*\*/.test(line)) fail("refused, mark the finding in **bold**, like 'Found **12 open deals**, $263,750 in all'");
  if (/^(I|I'm|I've|Searching|Reading|Looking|Checking|Opening|Trying|Querying)\b/i.test(line.replace(/\*/g, ""))) fail("refused, a line about the reading: say what you found in their pipeline");
  // "**0 deals**" is not a finding: a line whose numbers are all 0 says nothing.
  const bold = (line.match(/\*\*[^*]+\*\*/g) || []).join(" ");
  const nums = (bold.replace(/\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}/g, "").match(/\d[\d,.]*/g) || []);
  if (nums.length && nums.every((x) => Number(x.replace(/,/g, "")) === 0)) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
}

// ── What the page shows beside the lines: copied from Salesforce's answers, checked here ──
/** Your own words for the page: no raw ids, no long dash, nothing broken. */
function checkWords(text, what) {
  if (/[—–]/.test(text)) fail(`refused, a long dash in ${what}: use a comma or a period`);
  if (RAW_ID.test(text)) fail(`refused, a raw Salesforce id or link in ${what}: write the name`);
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object/.test(text)) fail(`refused, ${what} is broken: ${text}`);
}
/** A record's name (a deal, an account, a stage) as Salesforce shows it. */
function nameOf(value, what, field, required) {
  const name = String(value || "").replace(/\s+/g, " ").trim();
  if (!name) { if (required) fail(`${what} needs ${field}, as Salesforce shows it`); return ""; }
  if (name.length > 120) fail(`${what}: ${field} is longer than 120 characters`);
  if (/\S@\S+\.\S/.test(name)) fail(`refused, ${what}: ${field} is an email address`);
  checkWords(name, what);
  return name;
}
function amountOf(value, what) {
  if (value === undefined || value === null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) fail(`${what}: amount is the deal's Amount as Salesforce gave it, or null`);
  return n;
}
function dateOf(value, what, field) {
  const d = String(value || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || isNaN(Date.parse(d))) fail(`${what}: ${field} is YYYY-MM-DD, copied from Salesforce`);
  return d;
}
function linkOf(value, what) {
  if (value === undefined || value === "" || value === null) return "";
  const link = String(value).trim();
  if (!RECORD_LINK.test(link)) fail(`${what}: link is <your Salesforce address>/lightning/r/<Type>/<Id>/view, or leave it out`);
  return link;
}
function idOf(value, what) {
  if (value === undefined || value === "" || value === null) return "";
  const id = String(value).trim();
  if (!/^[a-zA-Z0-9]{15}([a-zA-Z0-9]{3})?$/.test(id)) fail(`${what}: recordId is the record's Id, 15 or 18 letters and digits`);
  return id;
}
/** One line in your words, at most `max` characters. */
function gistOf(value, max, what) {
  const gist = String(value || "").replace(/\s+/g, " ").trim();
  if (!gist) return "";
  if (gist.length > max) fail(`${what}: the gist is longer than ${max} characters`);
  checkWords(gist, what);
  return gist;
}

// ── The biggest open deals: a few real ones, so the person sees their pipeline within seconds ──
function topOf(list) {
  if (!Array.isArray(list) || !list.length) fail("the biggest open deals are a JSON list of 1 to 5 deals");
  if (list.length > 5) fail("at most 5 deals");
  const seen = new Set();
  return list.map((m, i) => {
    const what = `deal ${i + 1}`;
    if (!m || typeof m !== "object" || Array.isArray(m)) fail(`${what} must be an object`);
    const out = { name: nameOf(m.name, what, "name", true), stage: nameOf(m.stage, what, "stage", true), amount: amountOf(m.amount, what) };
    const account = nameOf(m.account, what, "account", false);
    if (account) out.account = account;
    if (m.closeDate) out.closeDate = dateOf(m.closeDate, what, "closeDate");
    const link = linkOf(m.link, what);
    if (link) out.link = link;
    if (seen.has(out.name + out.account)) fail(`${what} is there twice`);
    seen.add(out.name + out.account);
    return out;
  });
}

// ── The gift: one thing the person can act on now, shown while the reading goes on ──
function giftOf(g) {
  if (!g || typeof g !== "object" || Array.isArray(g)) fail("the gift must be an object");
  const kind = String(g.kind || "");
  if (kind === "calm") return { kind };
  if (kind !== "quiet" && kind !== "closing") fail(`the gift kind is quiet, closing or calm, not "${kind}"`);
  const out = { kind, name: nameOf(g.name, "the gift", "name", true), amount: amountOf(g.amount, "the gift") };
  const account = nameOf(g.account, "the gift", "account", false);
  if (account) out.account = account;
  if (kind === "quiet") {
    const days = Number(g.days);
    if (!Number.isInteger(days) || days < 1 || days > 3650) fail("the quiet gift needs days: whole days since its last activity, counted from LastActivityDate");
    out.days = days;
  } else {
    out.closeDate = dateOf(g.closeDate, "the gift", "closeDate");
    const ahead = (Date.parse(out.closeDate) - dayStart(0).getTime()) / DAY;
    if (ahead < -1 || ahead > 8) fail("refused, the closing gift is a deal set to close in the next 7 days");
  }
  const recordId = idOf(g.recordId, "the gift");
  if (recordId) out.recordId = recordId;
  const link = linkOf(g.link, "the gift");
  if (link) out.link = link;
  // The gist is one line in your words: why it matters now. No quote of a note.
  const gist = gistOf(g.gist, 140, "the gift");
  if (gist) out.gist = gist;
  return out;
}

// ── More things to do now, under the gift: each one a draft or a plan in the chat ──
const OFFER_KINDS = ["calls", "leads"];
const MAX_OFFERS = 2;
function offerOf(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) fail("the offer must be an object");
  const kind = String(o.kind || "");
  if (!OFFER_KINDS.includes(kind)) fail(`the offer kind is ${OFFER_KINDS.join(" or ")}, not "${kind}"`);
  const out = { kind };
  if (kind === "leads") {
    const n = Number(o.people);
    if (!Number.isInteger(n) || n < 1) fail("people is how many new leads came in since yesterday, at least 1");
    out.people = n;
  }
  return out;
}

/** latest.json in the page's own shape: a row the page cannot show is refused here. */
function latestOf(l) {
  if (!l || typeof l !== "object" || Array.isArray(l)) fail("latest.json must be an object");
  if (!l.totals || typeof l.totals !== "object" || !l.totals.open || typeof l.totals.open !== "object") fail("latest.json needs totals with open {count, amount}");
  if (!Array.isArray(l.moved)) fail("latest.json needs moved (an empty list when nothing moved)");
  for (const key of LISTS) {
    if (l[key] !== undefined && !Array.isArray(l[key])) fail(`latest.json: ${key} is a list (leave it out, or [] when there is none)`);
  }
  l.moved.forEach((m, i) => {
    if (!m || typeof m.name !== "string" || !m.name.trim()) fail(`moved[${i}] needs a name`);
    if (!CHANGES.includes(m.change)) fail(`moved[${i}].change is ${CHANGES.join(", ")}, not "${m.change}"`);
  });
  (l.changes || []).forEach((c, i) => { if (!DIRS.includes(c && c.dir)) fail(`changes[${i}].dir is up, down or new`); });
  for (const key of ["moved", "closing", "stale", "tasks", "leads"]) {
    (l[key] || []).forEach((x, i) => {
      if (!x || typeof x !== "object") fail(`${key}[${i}] must be an object`);
      if (!x.id) x.id = key.charAt(0) + (i + 1);
      if (x.url !== undefined && !RECORD_LINK.test(String(x.url))) fail(`${key}[${i}].url is a record link on the Salesforce address from Setup, or left out`);
    });
  }
  for (const key of ["last7", "prev7", "last28", "prev28"]) {
    const s = l.totals[key];
    if (s === undefined) continue;
    if (!s || typeof s !== "object") fail(`totals.${key} is an object`);
    if (s.winRate !== undefined && s.winRate !== null && !(typeof s.winRate === "number" && s.winRate >= 0 && s.winRate <= 1)) fail(`totals.${key}.winRate is a fraction from 0 to 1, or null when nothing closed`);
  }
  // The first catch-up has nothing to compare with: a stage, amount or close date that moved
  // needs the last catch-up's known (the persona says so), so such a row written anyway is
  // dropped, and `first` lets the page say there is no comparison yet.
  if (!fs.existsSync(latestFile)) {
    l.moved = l.moved.filter((m) => !COMPARED.includes(m.change));
    l.first = true;
  } else delete l.first;
  const n = new Date();
  l.schema = LATEST_SCHEMA;
  l.generatedAt = iso(n);
  if (!l.since) l.since = iso(dayStart(-1));
  delete l.example;
  delete l.headline;
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
} else if (cmd === "top") {
  const top = topOf(workJson(args.join(" ").trim(), "the biggest open deals"));
  editReading("the reading is done: the biggest deals come while you read", (r) => {
    if (r.top) fail("the biggest deals are there already: once is enough");
    r.top = top;
    return `biggest open deals: ${top.length}`;
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
  // The same catch-up under today's date for the picker, and day files past 30 days go.
  const days = path.join(dataDir, "days");
  fs.mkdirSync(days, { recursive: true });
  writeText(path.join(days, ymd(n) + ".json"), text);
  const oldest = ymd(dayStart(-30));
  for (const f of fs.readdirSync(days)) if (/^\d{4}-\d{2}-\d{2}\.json$/.test(f) && f.slice(0, 10) < oldest) fs.rmSync(path.join(days, f), { force: true });
  // "@why.txt" reads the note from data/.work/, for a note no shell can quote ("Salesforce's limit").
  const note = workText(why.join(" ")).replace(/\s+/g, " ").trim().slice(0, 200);
  writeJson(path.join(dataDir, "status.json"), { at: iso(n), ok: true, ...(note ? { why: note } : {}) });
  console.log(`latest.json written (${l.moved.length} moved, ${(l.closing || []).length} closing), days/${ymd(n)}.json and status.json`);
} else if (cmd === "done") {
  lockReading();
  const r = readReading();
  r.done = true;
  writeJson(readingFile, r);
  try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("data/.work/ is busy: delete it in your next call"); }
  console.log("reading done");
} else {
  fail("use start, push, top, gift, offer, latest or done");
}
