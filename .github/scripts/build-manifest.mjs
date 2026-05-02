#!/usr/bin/env node
/**
 * build-manifest.mjs
 *
 * Walks every top-level cabinet in this repo and emits `manifest.json`
 * at the repo root. The manifest is the single source of truth consumed
 * by downstream surfaces (Cabinet app home carousel + registry browser,
 * potential other clients) so they don't have to re-walk the repo.
 *
 * Run from repo root: `node .github/scripts/build-manifest.mjs`
 * Or from this dir:   `npm run manifest`
 *
 * Author guidance:
 *   - One entry per top-level directory that contains a `.cabinet` file
 *   - `domain` is read from `.cabinet` if present; otherwise falls back
 *     to the SLUG_DOMAIN map below. Add new cabinets there.
 *   - `cover` is the filename of the first cover.{jpg,png,webp} found in
 *     the cabinet root. Clients build a URL via raw.githubusercontent.com.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

const SLUG_DOMAIN = {
  agency: "Professional Services",
  "ai-hero": "Education",
  audits: "Operations",
  "biology-experiments": "Education",
  "book-factory": "Media",
  "career-ops": "Operations",
  "content-creator": "Media",
  cooking: "Lifestyle",
  "course-factory": "Education",
  ecommerce: "E-commerce",
  fitness: "Lifestyle",
  "job-hunt-hq": "Operations",
  "keto-hq": "Lifestyle",
  "mom-command": "Lifestyle",
  "music-factory": "Media",
  newborn: "Lifestyle",
  "newsletter-factory": "Media",
  "personal-os": "Operations",
  "physics-101": "Education",
  "physics-experiments": "Education",
  "podcast-factory": "Media",
  "reading-room": "Education",
  "real-estate": "Sales",
  "saas-startup": "Software",
  "text-your-mom": "Software",
  "usa-travel-planner": "Lifestyle",
  "wedding-planner": "Lifestyle",
  "youtube-channel-factory": "Media",
};

function readYamlFile(p) {
  if (!fs.existsSync(p)) return null;
  try {
    return yaml.load(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function readFrontmatter(p) {
  if (!fs.existsSync(p)) return {};
  const raw = fs.readFileSync(p, "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  try {
    return yaml.load(m[1]) || {};
  } catch {
    return {};
  }
}

function countAgents(cabinetDir) {
  const dir = path.join(cabinetDir, ".agents");
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (fs.existsSync(path.join(dir, e.name, "persona.md"))) n += 1;
  }
  return n;
}

function countJobs(cabinetDir) {
  const dir = path.join(cabinetDir, ".jobs");
  if (!fs.existsSync(dir)) return 0;
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml")).length;
}

function countChildCabinets(rootDir) {
  let count = 0;
  function scan(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory() || e.name.startsWith(".")) continue;
      const full = path.join(dir, e.name);
      if (fs.existsSync(path.join(full, ".cabinet"))) {
        count += 1;
        scan(full);
      } else {
        scan(full);
      }
    }
  }
  scan(rootDir);
  return count;
}

function findCover(cabinetDir) {
  for (const name of ["cover.jpg", "cover.png", "cover.webp"]) {
    if (fs.existsSync(path.join(cabinetDir, name))) return name;
  }
  return null;
}

function build() {
  const cabinets = [];
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const dir = path.join(ROOT, entry.name);
    const cabinetFile = path.join(dir, ".cabinet");
    if (!fs.existsSync(cabinetFile)) continue;

    const meta = readYamlFile(cabinetFile) || {};
    if (meta.kind && meta.kind !== "root") continue;

    const fm = readFrontmatter(path.join(dir, meta.entry || "index.md"));
    const tags = Array.isArray(fm.tags) ? fm.tags : [];

    cabinets.push({
      slug: entry.name,
      name: meta.name || entry.name,
      description: meta.description || "",
      version: meta.version || "0.1.0",
      domain: meta.domain || SLUG_DOMAIN[entry.name] || "Other",
      cover: findCover(dir),
      agentCount: countAgents(dir),
      jobCount: countJobs(dir),
      childCount: countChildCabinets(dir),
      tags,
    });
  }
  cabinets.sort((a, b) => a.slug.localeCompare(b.slug));
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    cabinetCount: cabinets.length,
    cabinets,
  };
}

const manifest = build();
const outPath = path.join(ROOT, "manifest.json");
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `Wrote ${path.relative(ROOT, outPath)} — ${manifest.cabinetCount} cabinets.`
);
