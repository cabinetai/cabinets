#!/usr/bin/env node
// Reads the pages in the Notion copy and writes data/latest.json for the Wiki page.
// Usage, from the cabinet root: node wiki/read-notion.mjs <Notion folder> [...]
// A page is an index.md whose frontmatter has a notion_id; links are [[Title]].
// Read only: it never writes inside the copy.

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "data");
const DAY_MS = 86400000;
const STALE_DAYS = 90;
const EDITOR_DAYS = 30;
const ROWS = 8;

function write(name, value) {
  mkdirSync(DATA, { recursive: true });
  writeFileSync(join(DATA, name), JSON.stringify(value, null, 2) + "\n");
}

function fail(why) {
  write("status.json", { at: new Date().toISOString(), ok: false, why });
  console.error(why);
  process.exit(1);
}

function unquote(value) {
  if (/^'.*'$/s.test(value)) return value.slice(1, -1).replace(/''/g, "'");
  if (/^".*"$/s.test(value)) {
    // A YAML escape: the copy writes an emoji icon as "\U0001F517".
    return value.slice(1, -1).replace(/\\(?:u([0-9a-fA-F]{4})|U([0-9a-fA-F]{8})|(.))/g, (_, s, l, c) =>
      s || l ? String.fromCodePoint(parseInt(s || l, 16)) : c === "n" ? "\n" : c);
  }
  return value;
}

// The top-level `key: value` lines the copy writes, folded (`>-`) values included.
function frontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text.replace(/^﻿/, "").replace(/\r\n/g, "\n"));
  if (!m) return { data: {}, body: text };
  const data = {};
  const lines = m[1].split("\n");
  for (let i = 0; i < lines.length; i++) {
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(lines[i]);
    if (!kv) continue;
    let value = kv[2].trim();
    if (/^[>|][-+]?$/.test(value)) {
      const folded = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) folded.push(lines[++i].trim());
      value = folded.join(" ");
    }
    if (value) data[kv[1]] = unquote(value);
  }
  return { data, body: m[2] };
}

function findPages(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) findPages(path, out);
    else if (entry.name === "index.md") out.push(path);
  }
  return out;
}

const folders = process.argv.slice(2);
if (!folders.length) fail("No Notion folder was given.");

const pages = [];
for (const folder of folders) {
  let files;
  try { files = findPages(folder, []); } catch { fail(`The Notion folder ${basename(folder)} could not be read.`); }
  for (const file of files) {
    const { data, body } = frontmatter(readFileSync(file, "utf8"));
    if (!data.notion_id) continue;
    const heading = /^#\s+(.+)$/m.exec(body);
    const links = new Set();
    for (const link of body.matchAll(/\[\[([^\]|#\n]+)(?:[#|][^\]\n]*)?\]\]/g)) links.add(link[1].trim().toLowerCase());
    pages.push({
      title: data.title || (heading ? heading[1].trim() : basename(dirname(file))),
      icon: data.icon || null,
      url: data.notion_url || null,
      edited: data.edited || null,
      by: data.edited_by || null,
      links,
      inbound: 0,
    });
  }
}

const byTitle = new Map(pages.map((p) => [p.title.toLowerCase(), p]));
for (const page of pages) {
  for (const link of page.links) {
    const target = byTitle.get(link);
    if (target && target !== page) target.inbound++;
  }
}

const now = Date.now();
const age = (p) => (p.edited ? (now - Date.parse(p.edited)) / DAY_MS : Infinity);
const show = (p) => ({ title: p.title, icon: p.icon, url: p.url, edited: p.edited, by: p.by, links: p.inbound });
const recent = pages.filter((p) => p.edited).sort((a, b) => b.edited.localeCompare(a.edited));
const stale = pages
  .filter((p) => age(p) >= STALE_DAYS && p.inbound > 0)
  .sort((a, b) => b.inbound - a.inbound || a.title.localeCompare(b.title));
const linked = pages
  .filter((p) => p.inbound > 0)
  .sort((a, b) => b.inbound - a.inbound || a.title.localeCompare(b.title));
const counts = new Map();
for (const p of pages) if (p.by && age(p) <= EDITOR_DAYS) counts.set(p.by, (counts.get(p.by) || 0) + 1);
const editors = [...counts].map(([name, n]) => ({ name, pages: n })).sort((a, b) => b.pages - a.pages || a.name.localeCompare(b.name));

write("latest.json", {
  schema: "notion/wiki@1",
  generatedAt: new Date(now).toISOString(),
  folders: folders.map((f) => basename(f)),
  totals: { pages: pages.length, editedWeek: pages.filter((p) => age(p) <= 7).length, stale: stale.length },
  recent: recent.slice(0, ROWS).map(show),
  stale: stale.slice(0, ROWS).map(show),
  linked: linked.slice(0, ROWS).map(show),
  editors: editors.slice(0, ROWS),
});
write("status.json", { at: new Date(now).toISOString(), ok: true });
console.log(`${pages.length} pages, ${stale.length} need a review.`);
