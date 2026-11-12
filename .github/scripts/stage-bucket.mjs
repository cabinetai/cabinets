#!/usr/bin/env node
/**
 * stage-bucket.mjs <out-dir>
 *
 * Writes what the templates bucket serves into <out-dir>, in the bucket's
 * layout, so the workflow copies that folder as it is:
 *
 *   manifest.json          the template list
 *   details/<slug>.json    what a template's page shows
 *   <slug>/<cover>         the cover image, at the path it has in this repo
 *   archives/<slug>.zip    every committed file of the template
 *
 * Run it after build-manifest.mjs: it reads the manifest and the details that
 * script wrote. The Cabinet app installs a template from its one archive.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const out = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!out) {
  console.error("Usage: node .github/scripts/stage-bucket.mjs <out-dir>");
  process.exit(2);
}
fs.mkdirSync(out, { recursive: true });
if (fs.readdirSync(out).length > 0) {
  console.error(`${out} is not empty. Give an empty or a new folder.`);
  process.exit(2);
}

const { cabinets } = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));

fs.copyFileSync(path.join(ROOT, "manifest.json"), path.join(out, "manifest.json"));
fs.cpSync(path.join(ROOT, "details"), path.join(out, "details"), { recursive: true });
fs.mkdirSync(path.join(out, "archives"));

for (const { slug, cover } of cabinets) {
  // From the commit, not from the folder: a working copy holds runtime output
  // (transcripts, agent memory) that .gitignore keeps out of the repo.
  execFileSync(
    "git",
    ["archive", "--format=zip", `--output=${path.join(out, "archives", `${slug}.zip`)}`, `HEAD:${slug}`],
    { cwd: ROOT }
  );
  if (cover) {
    fs.mkdirSync(path.join(out, slug), { recursive: true });
    fs.copyFileSync(path.join(ROOT, slug, cover), path.join(out, slug, cover));
  }
}

console.log(`Staged ${cabinets.length} templates in ${out}.`);
