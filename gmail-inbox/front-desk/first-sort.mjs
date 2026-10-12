#!/usr/bin/env node
// The first sort's lines and profile, written only through here so every number is counted
// from the saved Gmail or Calendar answers, never typed. Run it from anywhere:
//   node <app>/first-sort.mjs window                shell lines to eval: NOW TODAY YESTERDAY WEEK_END
//                                                   END7 FROM90 TO30 OFFSET TZ. Never type a date.
//   node <app>/first-sort.mjs start                 new data/reading.json and data/.work/
//   node <app>/first-sort.mjs count <file>...       the exact count in each saved answer
//   node <app>/first-sort.mjs push '<line>'         add one line (single quotes: "$" stays "$")
//   node <app>/first-sort.mjs gift @<file>          the one thing for the owner, shown while you read:
//                                                   {"kind":<one of CONFIG.gift.kinds>,"who","subject",
//                                                   "since","when","threadId","amount","was","gist",
//                                                   "count","unread"}; who, subject, since, when, threadId
//                                                   and amounts copied from a saved answer
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

const CONFIG = /*CONFIG*/ {"schema":"gmail-inbox","counts":{"mail30":"inbox30.ndjson"},"latest":{"schema":"gmail-inbox/front-desk@2","lanes":["waiting","quotes","fyi"]},"gift":{"kinds":{"waiting":["who","since"],"quote":["who","since"],"noise":["who","count"],"calm":[]}}} /*END*/;

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
      // Only what gws wrote: Gmail and Calendar answers carry these keys.
      return /"(messages|snippet|payload|items|body)"\s*:/.test(t) ? t : "";
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
    // ₪, ILS and NIS are one currency (and $/USD, €/EUR, £/GBP): "289.00 ILS" + "₪200.00" adds up.
    const sign = { ILS: "₪", NIS: "₪", USD: "$", EUR: "€", GBP: "£" };
    const cur = m[1] || sign[(m[4] || "").toUpperCase()] || m[4] || "";
    const u = cur + "|";
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
/** Timed events from today to the end of today + 6, the page's "next 7 days". */
function weekCount(name) {
  const s = dayStart(0).getTime(), e = dayStart(7).getTime();
  return eventsOf(name).filter((x) => !allDay(x) && (() => { const t = new Date(x.start.dateTime).getTime(); return t >= s && t < e; })()).length;
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
  const out = String(text).replace(/\{(count|sum|free|evenings|dates|week):([^}]+)\}/g, (_, kind, spec) => {
    const [file, one, many] = spec.split("|").map((s) => s.trim());
    // Like {count:}, a word is added only when it is asked for: {evenings:events.json|free evening|free evenings}.
    const v = kind === "count" ? countWords(spec.trim())
      : kind === "sum" ? sumWords(file)
      : kind === "free" ? freeWords(file)
      : kind === "evenings" ? withWord(eveningsCount(file), false, one, many)
      : kind === "week" ? withWord(weekCount(file), false, one, many)
      : withWord(datesCount(file), false, one, many);
    made.push(v);
    return v;
  });
  let rest = out;
  for (const v of made) rest = rest.replace(v, "");
  if (/(^|\D)1\*{0,2} [a-z]+s\b/i.test(out) && !/1\*{0,2} (hours?|days?)\b/.test(out)) fail(`refused, "1 ...s": use {count:<file>|one|many}`);
  // "**Two payments**": a count written as a word is a count nobody made.
  if (/\*\*[^*]*\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b[^*]*\*\*/i.test(rest)) fail("refused, a count written as a word: use {count:<file>|one|many}");
  if (/\b(\w+ \w+) \1\b/i.test(out)) fail("refused, words are doubled: the helper adds the word you give after |, don't type it again");
  // "0 birthdays" is not a finding: a line whose numbers are all 0 says nothing.
  // The finding is the bold part: "**0 birthdays** in the next 30 days" is a 0.
  const bold = (out.match(/\*\*[^*]+\*\*/g) || []).join(" ");
  const nums = ((bold || out).replace(/\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}/g, "").match(/\d[\d,.]*/g) || []);
  if (where === "the line" && nums.length && nums.every((x) => Number(x.replace(/,/g, "")) === 0)) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
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

// ── The gift: one thing the owner can act on now, shown while the reading goes on ──
// Each template names its kinds and what each one needs (CONFIG.gift).
const GIFT_KINDS = (CONFIG.gift && CONFIG.gift.kinds) || {};
/** A date as Gmail wrote it ("Tue, 23 Sep 2026 16:40:00 -0400", or internalDate in ms). A
 *  date with no year ("October 15") is the next one from today. */
function gmailDate(v) {
  const s = String(v).trim();
  let d = /^\d{12,14}$/.test(s) ? new Date(Number(s)) : new Date(s);
  if (isNaN(d.getTime())) return null;
  if (!/\b\d{4}\b/.test(s) && !/^\d{12,14}$/.test(s)) {
    d.setFullYear(new Date().getFullYear());
    if (d.getTime() < dayStart(-1).getTime()) d.setFullYear(d.getFullYear() + 1);
  }
  return d;
}
function giftOf(g) {
  if (!g || typeof g !== "object" || Array.isArray(g)) fail("the gift must be an object");
  const kind = String(g.kind || "");
  if (!GIFT_KINDS[kind]) fail(`the gift kind is ${Object.keys(GIFT_KINDS).join(", ")}, not "${kind}"`);
  for (const key of GIFT_KINDS[kind]) if (typeof g[key] !== "string" || !g[key].trim()) fail(`a ${kind} gift needs ${key}`);
  const out = { kind };
  const saved = savedText();
  // Who, what, when and where are copied from a saved answer, never typed.
  for (const key of ["who", "subject", "since", "when", "threadId"]) {
    if (g[key] === undefined || g[key] === null || g[key] === "") continue;
    const v = String(g[key]).trim();
    if (v.length > 160) fail(`${key} is longer than 160 characters`);
    if (!saved.includes(v) && !saved.includes(JSON.stringify(v).slice(1, -1))) fail(`refused, the gift's ${key} "${v}" is not written in any saved answer: copy it as Gmail wrote it`);
    out[key] = v;
  }
  if (out.since) {
    const d = gmailDate(out.since);
    if (!d) fail(`since "${out.since}" is not a date: copy the Date header or internalDate`);
    if (d.getTime() > Date.now() + 5 * 60000 || d.getTime() < Date.now() - 60 * DAY) fail("since must be a day in the last 60 days");
    out.since = iso(d);
  }
  // When it is coming: a day from today to 60 days on, copied as the mail writes it.
  if (out.when) {
    const d = gmailDate(out.when);
    if (!d) fail(`when "${out.when}" is not a date: copy the day as the mail writes it, like "October 15, 2026"`);
    if (d.getTime() < dayStart(0).getTime() || d.getTime() > Date.now() + 60 * DAY) fail("when must be a day from today to 60 days from now");
    out.when = ymd(d);
  }
  // Money as the mail writes it, each amount in a saved answer.
  for (const key of ["amount", "was"]) {
    if (g[key] === undefined || g[key] === "") continue;
    const v = String(g[key]).trim();
    const m = v.match(MONEY);
    if (!m || m.length !== 1 || m[0].trim() !== v) fail(`${key} is one amount with its currency, like "₪289.00"`);
    if (!timesWritten(saved, v)) fail(`refused, ${v} is not written in any saved answer: copy the amount as the mail writes it`);
    out[key] = v;
  }
  if (out.threadId && !/^[0-9a-f]{8,24}$/i.test(out.threadId)) fail("threadId is Gmail's thread id, like 18c2f4a9b0e1d2c3");
  // The gist is one line in your words: what they want. No numbers: those are the helper's.
  if (g.gist !== undefined && g.gist !== "") {
    const gist = fill(String(g.gist).trim(), "the gist");
    if (gist.length > 140) fail("the gist is longer than 140 characters");
    if (/\d/.test(gist)) fail("refused, a number in the gist: say what they want, without numbers");
    out.gist = gist;
  }
  // Counts only through {count:<file>}: the helper counts.
  for (const key of ["count", "unread"]) {
    if (g[key] === undefined || g[key] === "") continue;
    const typed = String(g[key]).trim();
    if (!/^\{count:[^}]+\}$/.test(typed)) fail(`${key} must be {count:<file>|one|many}, so the helper counts it`);
    out[key] = fill(typed, "the gift's " + key);
  }
  return out;
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "window") {
  const n = new Date();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  console.log([
    `NOW='${iso(n)}'`, `FROM0='${iso(dayStart(0))}'`, `TODAY='${ymd(dayStart(0))}'`, `YESTERDAY='${ymd(dayStart(-1))}'`, `WEEK_END='${ymd(dayStart(6))}'`,
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
  lockReading();
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
} else if (cmd === "gift") {
  const arg = args.join(" ").trim();
  if (!arg.startsWith("@")) fail("give the gift as @<file>: the JSON your script wrote into data/.work/");
  let g;
  try { g = readJson(workFile(arg.slice(1).replace(/^.*data[\\/]\.work[\\/]/, ""))); } catch { fail(`${arg.slice(1)} is not JSON in data/.work/`); }
  const gift = giftOf(g);
  lockReading();
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  if (r.done) fail("the reading is done: the gift comes while you read");
  if (r.gift) fail("there is a gift already: one is enough");
  r.gift = { ...gift, at: iso(new Date()) };
  writeJson(readingFile, r);
  console.log("gift: " + JSON.stringify(r.gift));
} else if (cmd === "profile") {
  let p;
  const arg = args.join(" ").trim();
  if (!arg.startsWith("@")) fail("give the profile as @<file>: the JSON your script wrote into data/.work/");
  // "@money-desk/data/.work/profile.json" means "@profile.json".
  try { p = readJson(workFile(arg.slice(1).replace(/^.*data[\\/]\.work[\\/]/, ""))); } catch { fail(`${arg.slice(1)} is not JSON in data/.work/`); }
  if (!p || typeof p !== "object" || Array.isArray(p)) fail("the profile must be an object");
  // What the helper works out itself is never taken from the file.
  // mattered30 needs every email of the 30 days sorted by the helper, which it cannot do: left out.
  const own = ["schema", "at", "mattered30", ...Object.keys(CONFIG.counts), ...(CONFIG.free ? ["timeZone", "nextFree", "freeEvenings", "dates30"] : [])];
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
    const hasEvents = fs.existsSync(path.join(workDir, "events.json"));
    const tz = hasEvents ? timeZoneOf("events.json") : "";
    if (tz) l.timeZone = tz;
    // Each event as the calendar has it: cancelled and declined ones out, the guests counted,
    // the place filled in, and the names only the ones the calendar gives.
    if (hasEvents && Array.isArray(l.events)) {
      const byId = new Map(eventsOf("events.json").map((e) => [e.id, e]));
      const raw = new Map(pagesOf("events.json").flatMap((p) => p.items || p.events || []).map((e) => [e && e.id, e]));
      l.events = l.events.filter((ev) => !ev || !ev.id || !raw.has(ev.id) || byId.has(ev.id)).map((ev) => {
        const e = ev && ev.id ? byId.get(ev.id) : null;
        if (!e) return ev;
        const guests = (e.attendees || []).filter((a) => a && !a.self && !a.resource);
        const names = new Set(guests.map((a) => a.displayName).filter(Boolean));
        const people = Array.isArray(ev.people) ? ev.people.filter((p) => names.has(p)).slice(0, 3) : [];
        const out = { ...ev, people, morePeople: Math.max(0, guests.length - people.length) };
        if (!out.place && e.location) out.place = String(e.location).split(",")[0].trim() || null;
        return out;
      });
    }
    // The headline and the note say only what was counted.
    for (const key of ["headline", "note"]) if (typeof l[key] === "string") l[key] = fill(l[key], key);
    l.status = "ok";
  } else {
    // The page shows a file only in its own shape: schema, not an example, every lane a list.
    if (typeof l.headline !== "string" || !l.headline.trim()) fail("latest.json needs a headline (\"Nobody is waiting on you\" is one)");
    // Every string, in every card: placeholders filled, and each amount written in the mail.
    const walk = (o, where) => {
      for (const [k, v] of Object.entries(o)) {
        if (typeof v === "string") o[k] = fill(v, where + "." + k);
        else if (v && typeof v === "object") walk(v, where + "." + k);
      }
    };
    walk(l, "latest");
    if (CONFIG.latest) {
      l.schema = CONFIG.latest.schema;
      for (const lane of CONFIG.latest.lanes) if (!Array.isArray(l[lane])) l[lane] = [];
    }
    l.example = false;
    // What arrived is the helper's count of the 30-day inbox, and the window says so.
    delete l.arrived;
    if (CONFIG.counts.mail30 && fs.existsSync(path.join(workDir, CONFIG.counts.mail30))) {
      const c = countFile(CONFIG.counts.mail30);
      if (!c.more) { l.arrived = c.n; l.since = ymd(dayStart(-30)); }
    }
  }
  writeJson(path.join(dataDir, "latest.json"), l);
  if (!CONFIG.free) writeJson(path.join(dataDir, "status.json"), { at: iso(n), ok: true });
  console.log("latest.json written" + (CONFIG.free ? "" : ", and status.json"));
} else if (cmd === "done") {
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  r.done = true;
  writeJson(readingFile, r);
  try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("data/.work/ is busy: delete it in your next call"); }
  console.log("reading done");
} else {
  fail("use window, start, count, push, gift, profile, latest or done");
}
