#!/usr/bin/env node
// Reads the task databases in the Notion copy and writes data/latest.json for the This week
// page. Usage, from the cabinet root: node this-week/read-notion.mjs <Notion folder> [...]
// Every <Database>.csv under the folders is a database; the columns differ per database, so
// they are found by name (see COLUMNS). Read only: it never writes inside the copy.

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "data");
const DAY_MS = 86400000;
const COLUMNS = {
  title: ["name", "title", "task", "task name"],
  status: ["status", "state", "stage"],
  owner: ["assignee", "assignees", "owner", "owners", "person", "assigned to"],
  due: ["due", "due date", "deadline", "date"],
  check: ["done", "complete", "completed"],
};
const DONE = ["done", "complete", "completed", "shipped", "closed", "archived"];

function write(name, value) {
  mkdirSync(DATA, { recursive: true });
  writeFileSync(join(DATA, name), JSON.stringify(value, null, 2) + "\n");
}

function fail(why) {
  write("status.json", { at: new Date().toISOString(), ok: false, why });
  console.error(why);
  process.exit(1);
}

// RFC 4180: quoted cells hold commas, doubled quotes and line breaks.
function parseCsv(text) {
  const rows = [[]];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { rows.at(-1).push(cell); cell = ""; }
    else if (c === "\n") { rows.at(-1).push(cell.replace(/\r$/, "")); cell = ""; rows.push([]); }
    else cell += c;
  }
  rows.at(-1).push(cell);
  return rows.filter((row) => row.some((value) => value.trim()));
}

function findCsv(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) findCsv(path, out);
    else if (entry.name.toLowerCase().endsWith(".csv")) out.push(path);
  }
  return out;
}

function dayOf(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// A date cell as YYYY-MM-DD: ISO, "November 7, 2026", or the start of a range "a → b".
function dueDay(value) {
  const first = (value || "").split(/\s+(?:→|->)\s+/)[0].trim();
  if (!first) return null;
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(first);
  if (iso) return iso[1];
  const at = Date.parse(first.replace(/^@/, "").replace(/\s+\d{1,2}:\d{2}.*$/, ""));
  return Number.isNaN(at) ? null : dayOf(at);
}

function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T12:00:00`) - Date.parse(`${a}T12:00:00`)) / DAY_MS);
}

const folders = process.argv.slice(2);
if (!folders.length) fail("No Notion folder was given.");

const now = Date.now();
const today = dayOf(now);
const weekEnd = dayOf(now + 6 * DAY_MS);
const tasks = [];
const databases = [];

for (const folder of folders) {
  let files;
  try { files = findCsv(folder, []); } catch { fail(`The Notion folder ${basename(folder)} could not be read.`); }
  for (const file of files.sort()) {
    const [head = [], ...rows] = parseCsv(readFileSync(file, "utf8").replace(/^﻿/, ""));
    const names = head.map((h) => h.trim().toLowerCase());
    const col = {};
    for (const [key, wanted] of Object.entries(COLUMNS)) {
      const at = wanted.map((w) => names.indexOf(w)).find((i) => i !== -1);
      col[key] = at === undefined ? null : at;
    }
    const name = basename(file, ".csv");
    const tracked = col.status !== null || col.check !== null;
    const cell = (row, at) => (at === null ? "" : (row[at] || "").trim());
    let count = 0;
    for (const row of rows) {
      const title = cell(row, col.title ?? 0);
      if (!title) continue;
      count++;
      if (!tracked) continue;
      const status = cell(row, col.status);
      const checked = cell(row, col.check).toLowerCase();
      tasks.push({
        title,
        database: name,
        status: status || null,
        owners: cell(row, col.owner).split(",").map((o) => o.trim().replace(/^@/, "")).filter(Boolean),
        due: dueDay(cell(row, col.due)),
        done: DONE.includes(status.toLowerCase()) || checked === "true" || checked === "yes",
      });
    }
    databases.push({ name, rows: count, hasStatus: tracked, hasDue: col.due !== null });
  }
}

const open = tasks.filter((t) => !t.done);
const row = (t) => ({ title: t.title, database: t.database, owner: t.owners.join(", ") || null, status: t.status, due: t.due });
const overdue = open.filter((t) => t.due && t.due < today).sort((a, b) => a.due.localeCompare(b.due));
const dueWeek = open
  .filter((t) => t.due && t.due >= today && t.due <= weekEnd)
  .sort((a, b) => a.due.localeCompare(b.due) || a.title.localeCompare(b.title));

const statuses = new Map();
for (const t of tasks) {
  const status = t.status || (t.done ? "Done" : "No status");
  const bar = statuses.get(status) || { status, count: 0, done: t.done };
  bar.count++;
  statuses.set(status, bar);
}
const owners = new Map();
for (const t of open) {
  for (const owner of t.owners) {
    const load = owners.get(owner) || { owner, open: 0, overdue: 0 };
    load.open++;
    if (t.due && t.due < today) load.overdue++;
    owners.set(owner, load);
  }
}

write("latest.json", {
  schema: "notion/this-week@1",
  generatedAt: new Date(now).toISOString(),
  today,
  folders: folders.map((f) => basename(f)),
  totals: { tasks: tasks.length, open: open.length, overdue: overdue.length, dueWeek: dueWeek.length, done: tasks.length - open.length },
  overdue: overdue.map((t) => ({ ...row(t), late: daysBetween(t.due, today) })),
  dueWeek: dueWeek.map(row),
  byStatus: [...statuses.values()].sort((a, b) => a.done - b.done || b.count - a.count),
  byOwner: [...owners.values()].sort((a, b) => b.open - a.open || b.overdue - a.overdue || a.owner.localeCompare(b.owner)),
  databases,
});
write("status.json", { at: new Date(now).toISOString(), ok: true });
console.log(`${databases.length} databases, ${open.length} open tasks, ${overdue.length} overdue, ${dueWeek.length} due this week.`);
