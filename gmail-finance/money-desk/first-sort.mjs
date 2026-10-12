#!/usr/bin/env node
// The first sort's lines and profile, written only through here so every number is counted
// from the saved Gmail or Calendar answers, never typed. Run it from anywhere:
//   node <app>/first-sort.mjs start                 new data/reading.json, empty data/.work/
//   node <app>/first-sort.mjs count <file>...       the exact count in each saved answer
//   node <app>/first-sort.mjs push '<line>'         add one line (single quotes: "$" stays "$")
//   node <app>/first-sort.mjs profile @<file>       write data/profile.json from the JSON your script
//                                                   wrote into data/.work/ (the counts are added here)
//   node <app>/first-sort.mjs done                  mark the reading done, delete data/.work/
// In a line, and in a string of the profile file:
//   {count:<file>}     the exact count in a saved answer; {count:<file>@20} when +triage
//                      was asked for --max 20 (40 when left out): a full list says "at least".
//                      {count:<file>|event|events} adds the word, singular or plural.
//   {sum:<file>}       the sum of a JSON list of amounts your script saved, such as
//                      ["₪289.00","₪200.00"]; each amount must be written in a saved answer.
// A money amount typed straight into a line must be written, as it is, in a saved answer.
// A <file> is relative to data/.work/. It may be a saved +triage or messages list answer,
// a --page-all answer (one JSON page per line), a calendar events answer, or empty (= 0).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CONFIG = /*CONFIG*/ {"schema":"gmail-finance","counts":{"mail30":"inbox30.ndjson","money30":"money30.ndjson"}} /*END*/;

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const readingFile = path.join(dataDir, "reading.json");
const MONEY = /(?:[$€£₪¥]\s?\d[\d,]*(?:\.\d+)?)|(?:\d[\d,]*(?:\.\d+)?\s?(?:USD|EUR|GBP|ILS|NIS|₪|€))/g;

function now() {
  const d = new Date();
  const off = -d.getTimezoneOffset();
  const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, "0");
  const local = new Date(d.getTime() + off * 60000).toISOString().slice(0, 19);
  return local + (off >= 0 ? "+" : "-") + pad(off / 60) + ":" + pad(off % 60);
}
function fail(msg) { console.error("first-sort: " + msg); process.exit(1); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function writeJson(file, value) {
  const tmp = file + ".part";
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}
function workFile(name) {
  const file = path.resolve(workDir, name);
  if (!file.startsWith(workDir + path.sep)) fail(`${name} is not inside data/.work/`);
  if (!fs.existsSync(file)) fail(`${name} is not in data/.work/ (save the answer there first)`);
  return file;
}
/** Every saved answer as one text, to check that an amount was really written in the mail. */
function savedText() {
  if (!fs.existsSync(workDir)) return "";
  return fs.readdirSync(workDir).map((f) => { try { return fs.readFileSync(path.join(workDir, f), "utf8"); } catch { return ""; } }).join("\n");
}

/** The exact count in one saved answer: { n, more } where more means there is more than counted. */
function countFile(spec) {
  const at = spec.lastIndexOf("@");
  const name = at > 0 ? spec.slice(0, at) : spec;
  const max = at > 0 ? Number(spec.slice(at + 1)) || 40 : 40;
  const raw = fs.readFileSync(workFile(name), "utf8").trim();
  if (!raw) return { n: 0, more: false };
  const pages = [];
  try { pages.push(JSON.parse(raw)); } catch {
    for (const line of raw.split(/\r?\n/)) if (line.trim()) {
      try { pages.push(JSON.parse(line)); } catch { fail(`${name} is not JSON: check the command that saved it`); }
    }
  }
  let n = 0, more = false, capped = false;
  for (const p of pages) {
    let list = Array.isArray(p) ? p : p.messages || p.items || p.threads || p.events || [];
    if (!Array.isArray(list)) fail(`${name} has no list in it`);
    // Calendar events: cancelled ones, the ones they declined and all-day ones do not count.
    list = list.filter((e) => !(e && typeof e === "object" && (e.status === "cancelled" ||
      (e.start && e.start.date && !e.start.dateTime) ||
      (Array.isArray(e.attendees) && e.attendees.some((a) => a && a.self && a.responseStatus === "declined")))));
    n += list.length;
    more = !!(p && p.nextPageToken);
    // gws gmail +triage stops at --max and says nothing more: a full list is a cap.
    if (p && !Array.isArray(p) && "query" in p && list.length >= max) capped = true;
  }
  return { n, more: more || capped };
}
function countWords(spec) {
  const [file, one, many] = spec.split("|").map((s) => s.trim());
  const c = countFile(file);
  const n = (c.more ? "at least " : "") + c.n.toLocaleString("en-US");
  return one ? `${n} ${c.n === 1 && !c.more ? one : many || one}` : n;
}

/** The sum of a saved list of amounts, each one written in a saved answer, all one currency. */
function sumWords(name) {
  let list;
  try { list = readJson(workFile(name)); } catch { fail(`${name} is not a JSON list of amounts`); }
  if (!Array.isArray(list) || !list.length) fail(`${name} must be a JSON list of amounts, like ["₪289.00","₪200.00"]`);
  const text = savedText().replace(fs.readFileSync(workFile(name), "utf8"), "");
  let total = 0, unit = null, decimals = 0;
  for (const a of list) {
    const s = String(a).trim();
    if (!text.includes(s)) fail(`${s} is not written in any saved answer: copy amounts from the mail`);
    const m = /^([^\d\s]*)\s?(\d[\d,]*(?:\.(\d+))?)\s?([^\d\s]*)$/.exec(s);
    if (!m) fail(`${s} is not an amount`);
    const u = (m[1] || "") + "|" + (m[4] || "");
    if (unit !== null && u !== unit) fail("the amounts are in different currencies: leave the sum out");
    unit = u;
    decimals = Math.max(decimals, (m[3] || "").length);
    total += Number(m[2].replace(/,/g, ""));
  }
  const [pre, post] = unit.split("|");
  return pre + total.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + (post ? " " + post : "");
}

/** Fill {count:} and {sum:}; then every amount left in the text must be written in the mail. */
function fill(text, where) {
  const made = [];
  const out = String(text).replace(/\{(count|sum):([^}]+)\}/g, (_, kind, spec) => {
    const v = kind === "count" ? countWords(spec.trim()) : sumWords(spec.trim());
    made.push(v);
    return v;
  });
  let rest = out;
  for (const v of made) rest = rest.replace(v, "");
  const saved = (rest.match(MONEY) || []).length ? savedText() : "";
  for (const amount of rest.match(MONEY) || []) {
    if (!saved.includes(amount.trim())) fail(`refused, ${amount.trim()} in ${where} is not written in any saved answer: use {sum:<file>} for a total`);
  }
  return out;
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "start") {
  // Answers left from an earlier run that failed are not this run's.
  fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  fs.mkdirSync(workDir, { recursive: true });
  writeJson(readingFile, { schema: `${CONFIG.schema}/reading@1`, startedAt: now(), done: false, lines: [] });
  console.log("reading started; save answers in " + path.relative(process.cwd(), workDir));
} else if (cmd === "count") {
  for (const spec of args) { const c = countFile(spec); console.log(`${spec}: ${c.n}${c.more ? " (there is more than this)" : ""}`); }
} else if (cmd === "push") {
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  if (r.done) fail("the reading is done: no more lines");
  const typed = String(args.join(" ") || "").trim();
  // "$2,679" in double quotes reaches here as ",679": refuse what the shell ate.
  if (/(^|[\s(*])[,.]\d/.test(typed)) fail("refused, a number lost its start (a $ in double quotes?): use single quotes");
  const line = fill(typed, "the line");
  if (!line) fail("empty line");
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object|\{|\}/.test(line)) fail(`refused, the line is broken: ${line}`);
  if (line.length > 200) fail("refused, the line is longer than 200 characters");
  if (r.lines.includes(line)) fail("that line is already there");
  r.lines.push(line);
  writeJson(readingFile, r);
  console.log(`line ${r.lines.length}: ${line}`);
} else if (cmd === "profile") {
  let p;
  const arg = args.join(" ").trim();
  if (!arg.startsWith("@")) fail("give the profile as @<file>: the JSON your script wrote into data/.work/");
  try { p = readJson(workFile(arg.slice(1))); } catch { fail(`${arg.slice(1)} is not JSON in data/.work/`); }
  if (!p || typeof p !== "object" || Array.isArray(p)) fail("the profile must be an object");
  // The helper's own schema, time and counts; nothing typed for those.
  delete p.schema; delete p.at;
  for (const key of Object.keys(CONFIG.counts)) delete p[key];
  tidy(p, "profile");
  for (const [key, name] of Object.entries(CONFIG.counts)) {
    if (!fs.existsSync(path.join(workDir, name))) fail(`${name} is missing: run its --page-all count first, saved under that name`);
    const c = countFile(name);
    // A 0 here can mean Gmail did not sort at all (its tabs are off): not a finding.
    if (!c.more && !(c.n === 0 && (CONFIG.zeroUnknown || []).includes(key))) p[key] = c.n;
  }
  writeJson(path.join(dataDir, "profile.json"), { ...p, schema: `${CONFIG.schema}/profile@1`, at: now() });
  console.log("profile written: " + Object.keys(p).join(", "));
} else if (cmd === "done") {
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  r.done = true;
  writeJson(readingFile, r);
  try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("data/.work/ is busy: delete it in your next call"); }
  console.log("reading done");
} else {
  fail("use start, count, push, profile or done");
}

/** Strings get their {count:} and {sum:}; money must be in the mail; zero money, a typed 0
 *  and empty fields are left out, at any depth: "₪0 came in" is not a finding. */
function tidy(o, where) {
    for (const [key, v] of Object.entries(o)) {
      if (v && typeof v === "object" && !Array.isArray(v)) { tidy(v, where + "." + key); if (!Object.keys(v).length) delete o[key]; continue; }
      if (typeof v === "string") {
        const s = fill(v, where + "." + key);
        if (/^\D{0,4}0+([.,]0+)?\D{0,4}$/.test(s.trim()) || !s.trim()) { delete o[key]; continue; }
        o[key] = s;
      }
      if (v === null || v === 0 || (Array.isArray(v) && !v.length)) delete o[key];
    }
}
