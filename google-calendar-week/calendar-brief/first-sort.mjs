#!/usr/bin/env node
// The first sort's lines and profile, written only through here so every number is counted
// from the saved Gmail or Calendar answers, never typed. Run it from anywhere:
//   node <app>/first-sort.mjs start                 new data/reading.json, empty data/.work/
//   node <app>/first-sort.mjs count <file>...       the exact count in each saved answer
//   node <app>/first-sort.mjs push "<line>"         add one line; {count:<file>} is counted here
//   node <app>/first-sort.mjs profile '<json>'      write data/profile.json (the counts are added here)
//   node <app>/first-sort.mjs done                  mark the reading done, delete data/.work/
// A <file> is relative to data/.work/. It may be a saved +triage or messages list answer,
// a --page-all answer (one JSON page per line), a calendar events answer, or empty (= 0).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CONFIG = /*CONFIG*/ {"schema":"google-calendar-week","counts":{}} /*END*/;

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const readingFile = path.join(dataDir, "reading.json");

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

/** The exact count in one saved answer: { n, more } where more means Gmail had another page. */
function countFile(name) {
  const file = path.resolve(workDir, name);
  if (!file.startsWith(workDir)) fail(`${name} is not inside data/.work/`);
  if (!fs.existsSync(file)) fail(`${name} is not in data/.work/ (save the answer there first)`);
  const raw = fs.readFileSync(file, "utf8").trim();
  if (!raw) return { n: 0, more: false };
  const pages = [];
  try { pages.push(JSON.parse(raw)); } catch {
    for (const line of raw.split(/\r?\n/)) if (line.trim()) {
      try { pages.push(JSON.parse(line)); } catch { fail(`${name} is not JSON: check the command that saved it`); }
    }
  }
  let n = 0, more = false, capped = false;
  for (const p of pages) {
    const list = Array.isArray(p) ? p : p.messages || p.items || p.threads || p.events || [];
    if (!Array.isArray(list)) fail(`${name} has no list in it`);
    n += list.length;
    more = !!(p && p.nextPageToken);
    // gws gmail +triage stops at --max (40) and says nothing more: a full list is a cap.
    if (p && !Array.isArray(p) && "query" in p && list.length >= 40) capped = true;
  }
  return { n, more: more || capped };
}
function countWords(name) { const c = countFile(name); return c.more ? `at least ${c.n.toLocaleString("en-US")}` : c.n.toLocaleString("en-US"); }

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "start") {
  fs.mkdirSync(workDir, { recursive: true });
  writeJson(readingFile, { schema: `${CONFIG.schema}/reading@1`, startedAt: now(), done: false, lines: [] });
  console.log("reading started; save answers in " + path.relative(process.cwd(), workDir));
} else if (cmd === "count") {
  for (const name of args) { const c = countFile(name); console.log(`${name}: ${c.n}${c.more ? " (more pages not read)" : ""}`); }
} else if (cmd === "push") {
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  if (r.done) fail("the reading is done: no more lines");
  let line = String(args.join(" ") || "").trim();
  line = line.replace(/\{count:([^}]+)\}/g, (_, name) => countWords(name.trim()));
  if (!line) fail("empty line");
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object|\{|\}/.test(line)) fail(`refused, the line is broken: ${line}`);
  if (line.length > 200) fail("refused, the line is longer than 200 characters");
  if (r.lines.includes(line)) fail("that line is already there");
  r.lines.push(line);
  writeJson(readingFile, r);
  console.log(`line ${r.lines.length}: ${line}`);
} else if (cmd === "profile") {
  let p;
  try { p = JSON.parse(args.join(" ")); } catch { fail("the profile is not JSON"); }
  if (!p || typeof p !== "object" || Array.isArray(p)) fail("the profile must be an object");
  // Counts come from the saved answers, never from what was typed.
  for (const key of Object.keys(CONFIG.counts)) delete p[key];
  for (const [key, name] of Object.entries(CONFIG.counts)) {
    if (!fs.existsSync(path.join(workDir, name))) continue;
    const c = countFile(name);
    if (!c.more) p[key] = c.n;
  }
  // Money that is zero, or not money, is left out: "₪0 came in" is not a finding.
  for (const [key, v] of Object.entries(p)) {
    if (typeof v === "string" && /^\D{0,4}0+([.,]0+)?\D{0,4}$/.test(v.trim())) delete p[key];
    if (v === null || v === "" || (Array.isArray(v) && !v.length)) delete p[key];
  }
  writeJson(path.join(dataDir, "profile.json"), { schema: `${CONFIG.schema}/profile@1`, at: now(), ...p });
  console.log("profile written: " + Object.keys(p).join(", "));
} else if (cmd === "done") {
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  r.done = true;
  writeJson(readingFile, r);
  fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  console.log("reading done");
} else {
  fail("use start, count, push, profile or done");
}
