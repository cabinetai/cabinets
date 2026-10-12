#!/usr/bin/env node
// The first sort's lines and profile, written only through here so every number is counted
// from the saved Gmail or Calendar answers, never typed. Run it from anywhere:
//   node <app>/first-sort.mjs window                shell lines to eval: NOW TODAY YESTERDAY WEEK_END
//                                                   END7 FROM90 TO30 OFFSET TZ. Never type a date.
//   node <app>/first-sort.mjs start                 new data/reading.json and data/.work/
//   node <app>/first-sort.mjs count <file>...       the exact count in each saved answer
//   node <app>/first-sort.mjs push '<line>'         add one line (single quotes: "$" stays "$")
//   node <app>/first-sort.mjs profile @<file>       write data/profile.json from the JSON your script
//                                                   wrote into data/.work/ (counts are added here)
//   node <app>/first-sort.mjs latest @<file>        write data/latest.json from your script's file (times, today,
//                                                   arrived and timeZone set here)
//   node <app>/first-sort.mjs done                  mark the reading done, delete data/.work/
// In a line, and in a string of the profile file:
//   {count:<file>|one|many}  the exact count and its word ("1 event", "4 events"); a +triage list
//                      asked for --max 20 is {count:<file>@20|..} (40 when left out), and a full
//                      list says "at least".
//   {sum:<file>}       the sum of a JSON list of amounts your script saved, such as
//                      ["₪289.00","₪200.00"]; each amount must be written in a saved answer.
//   {free:<file>}      Calendar: the first free stretch of 3 hours or more from now.
//   {evenings:<file>}  Calendar: free evenings (18:00 to 22:00) in the next 7 days.
//   {dates:<file>|one|many}  Calendar: birthdays and anniversaries in the next 30 days.
// A money amount typed straight into a line must be written, as it is, in a saved answer.
// A <file> is relative to data/.work/: a saved +triage or messages list answer, a --page-all
// answer (one JSON page per line), a calendar events answer, or empty (= 0).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CONFIG = /*CONFIG*/ {"schema":"google-calendar-week","counts":{"events90":"past.json"},"free":"work","noClaimWords":true} /*END*/;

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const readingFile = path.join(dataDir, "reading.json");
const MONEY = /(?:[$€£₪¥]\s?\d[\d,]*(?:\.\d+)?)|(?:\d[\d,]*(?:\.\d+)?\s?(?:USD|EUR|GBP|ILS|NIS|₪|€))/g;
const DAY = 86400000;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ── Time, in this machine's zone (the person's own) ──
const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, "0");
const hhmm = (d) => pad(d.getHours()) + ":" + pad(d.getMinutes());
const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
function offsetOf(d) { const o = -d.getTimezoneOffset(); return (o >= 0 ? "+" : "-") + pad(o / 60) + ":" + pad(o % 60); }
function iso(d) { return ymd(d) + "T" + hhmm(d) + ":" + pad(d.getSeconds()) + offsetOf(d); }
/** Midnight, `days` from today, in local time (safe across a clock change). */
function dayStart(days) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + days); return d; }
function at(day, hour) { const d = new Date(day); d.setHours(hour, 0, 0, 0); return d.getTime(); }

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
/** Every saved Gmail or Calendar answer as one text, to check that an amount was really written
 *  in the mail. The agent's own files (the profile, lists of amounts, scripts) are not proof. */
function savedText() {
  if (!fs.existsSync(workDir)) return "";
  return fs.readdirSync(workDir).filter((f) => !/^profile|^latest|\.(m?js|py|sh)$/i.test(f)).map((f) => {
    try {
      const t = fs.readFileSync(path.join(workDir, f), "utf8");
      let j = null;
      try { j = JSON.parse(t); } catch { /* --page-all pages, one per line */ }
      return Array.isArray(j) && j.every((x) => typeof x === "string") ? "" : t;
    } catch { return ""; }
  }).join("\n");
}
/** How often an amount is written, whole: "₪20" is not inside "₪200.00". */
function timesWritten(text, amount) {
  const esc = amount.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (text.match(new RegExp(esc + "(?!\\d|[.,]\\d)", "g")) || []).length;
}

// ── Saved answers ──
function pagesOf(name) {
  const raw = fs.readFileSync(workFile(name), "utf8").trim();
  if (!raw) return [];
  try { return [JSON.parse(raw)]; } catch {
    return raw.split(/\r?\n/).filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return fail(`${name} is not JSON: check the command that saved it`); } });
  }
}
const declined = (e) => Array.isArray(e.attendees) && e.attendees.some((a) => a && a.self && a.responseStatus === "declined");
const allDay = (e) => !!(e.start && e.start.date && !e.start.dateTime);
/** Calendar events that count: not cancelled, not declined. */
function eventsOf(name) {
  return pagesOf(name).flatMap((p) => p.items || p.events || []).filter((e) => e && e.status !== "cancelled" && !declined(e));
}
function timeZoneOf(name) { for (const p of pagesOf(name)) if (p && typeof p.timeZone === "string") return p.timeZone; return ""; }

/** The exact count in one saved answer: { n, more } where more means there is more than counted. */
function countFile(spec) {
  const atSign = spec.lastIndexOf("@");
  const name = atSign > 0 ? spec.slice(0, atSign) : spec;
  const max = atSign > 0 ? Number(spec.slice(atSign + 1)) || 40 : 40;
  let n = 0, more = false, capped = false;
  for (const p of pagesOf(name)) {
    let list = Array.isArray(p) ? p : p.messages || p.items || p.threads || p.events || [];
    if (!Array.isArray(list)) fail(`${name} has no list in it`);
    // Calendar events: cancelled ones, the ones they declined and all-day ones do not count.
    list = list.filter((e) => !(e && typeof e === "object" && (e.status === "cancelled" || allDay(e) || declined(e))));
    n += list.length;
    more = !!(p && p.nextPageToken);
    // gws gmail +triage stops at --max and says nothing more: a full list is a cap.
    if (p && !Array.isArray(p) && "query" in p && list.length >= max) capped = true;
  }
  return { n, more: more || capped };
}
function withWord(n, more, one, many) {
  const num = (more ? "at least " : "") + n.toLocaleString("en-US");
  return one ? `${num} ${n === 1 && !more ? one : many || one}` : num;
}
function countWords(spec) { const [file, one, many] = spec.split("|").map((s) => s.trim()); const c = countFile(file); return withWord(c.n, c.more, one, many); }

/** The sum of a saved list of amounts, each one written in a saved answer, all one currency. */
function sumWords(name) {
  let list;
  try { list = readJson(workFile(name)); } catch { fail(`${name} is not a JSON list of amounts`); }
  if (!Array.isArray(list) || !list.length) fail(`${name} must be a JSON list of amounts, like ["₪289.00","₪200.00"]`);
  const text = savedText();
  let total = 0, unit = null, decimals = 0;
  const used = {};
  for (const a of list) {
    const s = String(a).trim();
    used[s] = (used[s] || 0) + 1;
    if (timesWritten(text, s) < used[s]) fail(`${s} is not written ${used[s] > 1 ? used[s] + " times " : ""}in the saved answers: copy amounts from the mail, each one once`);
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

// ── Calendar findings the helper works out itself ──
function busyOf(name) {
  return eventsOf(name).filter((e) => !allDay(e)).map((e) => [new Date(e.start.dateTime).getTime(), new Date((e.end && e.end.dateTime) || e.start.dateTime).getTime()]);
}
/** Where a free stretch may sit on a day: weekdays 8 to 17 for work, evenings and weekends for Personal. */
function windowsFor(day) {
  const wd = day.getDay();
  if (CONFIG.free === "personal") return wd === 0 || wd === 6 ? [[9, 22]] : [[18, 22]];
  return wd === 0 || wd === 6 ? [] : [[8, 17]];
}
/** The first gap of 3 hours or more from now (rounded up to the quarter hour), in 14 days. */
function freeWords(name) {
  const busy = busyOf(name);
  const q = 15 * 60000;
  const from = Math.ceil(Date.now() / q) * q;
  for (let i = 0; i < 14; i++) {
    const day = dayStart(i);
    for (const [a, b] of windowsFor(day)) {
      let start = Math.max(from, at(day, a));
      const end = at(day, b);
      if (start >= end) continue;
      const inside = busy.filter(([s, e]) => e > start && s < end).sort((x, y) => x[0] - y[0]);
      for (const [s, e] of [...inside, [end, end]]) {
        if (s - start >= 3 * 3600000) return WEEKDAYS[new Date(start).getDay()] + " " + hhmm(new Date(start)) + " to " + hhmm(new Date(s));
        start = Math.max(start, e);
      }
    }
  }
  return "";
}
/** Evenings (18:00 to 22:00) with nothing booked, today and the six days after. */
function eveningsCount(name) {
  const busy = busyOf(name);
  let n = 0;
  for (let i = 0; i < 7; i++) { const d = dayStart(i), s = at(d, 18), e = at(d, 22); if (!busy.some(([a, b]) => b > s && a < e)) n++; }
  return n;
}
/** Birthdays and anniversaries in the next 30 days. */
function datesCount(name) {
  const end = dayStart(30).getTime();
  return eventsOf(name).filter((e) => {
    const t = new Date((e.start && (e.start.dateTime || e.start.date)) || 0).getTime();
    return t >= dayStart(0).getTime() && t < end && (e.eventType === "birthday" || (allDay(e) && /birthday|anniversary|יום הולדת/i.test(e.summary || "")));
  }).length;
}

/** Fill the placeholders; then every amount left must be in the mail, and no claim word typed. */
function fill(text, where) {
  const made = [];
  const out = String(text).replace(/\{(count|sum|free|evenings|dates):([^}]+)\}/g, (_, kind, spec) => {
    const [file, one, many] = spec.split("|").map((s) => s.trim());
    const v = kind === "count" ? countWords(spec.trim())
      : kind === "sum" ? sumWords(file)
      : kind === "free" ? freeWords(file)
      : kind === "evenings" ? withWord(eveningsCount(file), false, one || "free evening", many || "free evenings")
      : withWord(datesCount(file), false, one || "birthday or date", many || "birthdays and dates");
    made.push(v);
    return v;
  });
  let rest = out;
  for (const v of made) rest = rest.replace(v, "");
  if (/(^|\D)1\*{0,2} [a-z]+s\b/i.test(out) && !/1\*{0,2} (hours?|days?)\b/.test(out)) fail(`refused, "1 ...s": use {count:<file>|one|many}`);
  // On a calendar, "all", "only", "none" and the like are facts the helper cannot check.
  if (CONFIG.noClaimWords && /\b(all|every|everyone|none|nothing|only|nearly|always|never|nobody)\b/i.test(rest)) fail(`refused, a word like "all" or "only" in ${where} states a fact nobody counted: leave it out`);
  const saved = (rest.match(MONEY) || []).length ? savedText() : "";
  for (const amount of rest.match(MONEY) || []) {
    if (!timesWritten(saved, amount.trim())) fail(`refused, ${amount.trim()} in ${where} is not written in any saved answer: use {sum:<file>} for a total`);
  }
  return out;
}

/** Strings get their placeholders; money must be in the mail; zero money, a typed 0 and
 *  empty fields are left out, at any depth: "₪0 came in" is not a finding. */
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

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "window") {
  const n = new Date();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  console.log([
    `NOW='${iso(n)}'`, `TODAY='${ymd(dayStart(0))}'`, `YESTERDAY='${ymd(dayStart(-1))}'`, `WEEK_END='${ymd(dayStart(6))}'`,
    `END7='${iso(dayStart(7))}'`, `FROM90='${iso(dayStart(-90))}'`, `TO30='${iso(dayStart(30))}'`, `OFFSET='${offsetOf(n)}'`, `TZ_NAME='${tz}'`,
  ].join("\n"));
} else if (cmd === "start") {
  // Answers left from an earlier run are not this run's; ones saved in the last 15 minutes are.
  if (fs.existsSync(workDir)) for (const f of fs.readdirSync(workDir)) {
    const p = path.join(workDir, f);
    try { if (Date.now() - fs.statSync(p).mtimeMs > 15 * 60000) fs.rmSync(p, { recursive: true, force: true }); } catch { /* busy: left */ }
  }
  fs.mkdirSync(workDir, { recursive: true });
  writeJson(readingFile, { schema: `${CONFIG.schema}/reading@1`, startedAt: iso(new Date()), done: false, lines: [] });
  console.log("reading started; save answers in " + path.relative(process.cwd(), workDir));
} else if (cmd === "count") {
  for (const spec of args) { const c = countFile(spec); console.log(`${spec}: ${c.n}${c.more ? " (there is more than this)" : ""}`); }
} else if (cmd === "push") {
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  if (r.done) fail("the reading is done: no more lines");
  const typed = String(args.join(" ") || "").trim();
  // "$2,679" in double quotes reaches here as ",679": refuse what the shell ate.
  if (/(^|[\s(*])[,.]\d/.test(typed)) fail("refused, a number lost its start (a $ in double quotes?): use single quotes");
  // "$489.00" in double quotes reaches here as "89.00": an amount with no currency.
  if (/(^|[^\d$€£₪¥,.])\d[\d,]*\.\d\d(?!\d)(?!\s?(USD|EUR|GBP|ILS|NIS|₪|€))/.test(typed.replace(/\{[^}]*\}/g, ""))) fail("refused, an amount with no currency (a $ in double quotes?): use single quotes and copy the currency");
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
  // "@money-desk/data/.work/profile.json" means "@profile.json".
  try { p = readJson(workFile(arg.slice(1).replace(/^.*data[\\/]\.work[\\/]/, ""))); } catch { fail(`${arg.slice(1)} is not JSON in data/.work/`); }
  if (!p || typeof p !== "object" || Array.isArray(p)) fail("the profile must be an object");
  // What the helper works out itself is never taken from the file.
  const own = ["schema", "at", ...Object.keys(CONFIG.counts), ...(CONFIG.free ? ["timeZone", "nextFree", "freeEvenings", "dates30"] : [])];
  for (const key of own) delete p[key];
  tidy(p, "profile");
  for (const [key, name] of Object.entries(CONFIG.counts)) {
    if (!fs.existsSync(path.join(workDir, name))) fail(`${name} is missing: save that answer under that name first`);
    const c = countFile(name);
    // A 0 here can mean Gmail did not sort at all (its tabs are off): not a finding.
    if (!c.more && !(c.n === 0 && (CONFIG.zeroUnknown || []).includes(key))) p[key] = c.n;
  }
  if (CONFIG.free) {
    const ev = fs.existsSync(path.join(workDir, "events.json")) ? "events.json" : fail("events.json is missing: save the coming days' answer under that name first");
    const tz = timeZoneOf(ev);
    if (tz) p.timeZone = tz;
    const free = freeWords(ev);
    if (free) p.nextFree = free;
    if (CONFIG.free === "personal") { p.freeEvenings = eveningsCount(ev); const d = datesCount(ev); if (d) p.dates30 = d; }
  }
  writeJson(path.join(dataDir, "profile.json"), { ...p, schema: `${CONFIG.schema}/profile@1`, at: iso(new Date()) });
  console.log("profile written: " + Object.keys(p).join(", "));
} else if (cmd === "latest") {
  // latest.json from the JSON your script wrote into data/.work/: the helper sets what it can
  // know for sure (the times, today, the count of what arrived, the time zone).
  const arg = args.join(" ").trim();
  if (!arg.startsWith("@")) fail("give it as @<file>: the latest.json your script wrote into data/.work/");
  let l;
  try { l = readJson(workFile(arg.slice(1).replace(/^.*data[\\/]\.work[\\/]/, ""))); } catch { fail(`${arg.slice(1)} is not JSON in data/.work/`); }
  if (!l || typeof l !== "object" || Array.isArray(l)) fail("latest.json must be an object");
  const n = new Date();
  l.generatedAt = iso(n);
  if (CONFIG.free) {
    l.checkedAt = iso(n);
    l.today = ymd(dayStart(0));
    l.readThrough = ymd(dayStart(-1));
    const tz = fs.existsSync(path.join(workDir, "events.json")) ? timeZoneOf("events.json") : "";
    if (tz) l.timeZone = tz;
  } else if (CONFIG.counts.mail30 && fs.existsSync(path.join(workDir, CONFIG.counts.mail30))) {
    const c = countFile(CONFIG.counts.mail30);
    if (!c.more) l.arrived = c.n;
  }
  writeJson(path.join(dataDir, "latest.json"), l);
  console.log("latest.json written");
} else if (cmd === "done") {
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  r.done = true;
  writeJson(readingFile, r);
  try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("data/.work/ is busy: delete it in your next call"); }
  console.log("reading done");
} else {
  fail("use window, start, count, push, profile, latest or done");
}
