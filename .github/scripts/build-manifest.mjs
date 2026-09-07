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
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

// Per-cabinet detail files live here, deliberately outside every cabinet
// directory: an import copies a cabinet folder verbatim, and a generated
// file inside one would land in the user's workspace.
const DETAIL_DIR = "details";

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

// gray-matter, not a regex: the app parses these same files with it, and a
// hand-rolled fence match disagrees with it on an empty `---\n---` block, an
// unterminated block, a trailing space after the fence, a language tag and a
// BOM. Returns null when the frontmatter will not parse, which is what the
// app does with an agent it cannot read.
function parseFrontmatter(p) {
  if (!fs.existsSync(p)) return null;
  try {
    return matter(fs.readFileSync(p, "utf8")).data || {};
  } catch {
    return null;
  }
}

function readFrontmatter(p) {
  return parseFrontmatter(p) || {};
}

function readBody(p) {
  if (!fs.existsSync(p)) return "";
  try {
    return matter(fs.readFileSync(p, "utf8")).content.trim();
  } catch {
    return "";
  }
}

/**
 * The committed files under a cabinet, relative to it. Read from git rather
 * than the filesystem: .gitignore excludes runtime output (transcripts,
 * .cabinet-state, dated agent artefacts) that exists in a working copy but
 * never reaches GitHub, and a path in this list that is not in the repo is a
 * 404 for the importer downloading it.
 */
function listFiles(slug) {
  const out = execFileSync("git", ["ls-files", "-z", "--", slug], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const prefix = `${slug}/`;
  return out
    .split("\0")
    .filter((f) => f.startsWith(prefix))
    .map((f) => f.slice(prefix.length))
    .sort();
}

function collectAgents(cabinetDir) {
  const dir = path.join(cabinetDir, ".agents");
  if (!fs.existsSync(dir)) return [];
  const agents = [];
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const persona = path.join(dir, e.name, "persona.md");
    if (!fs.existsSync(persona)) continue;
    const fm = parseFrontmatter(persona);
    if (!fm) continue;
    agents.push({
      name: fm.name || e.name,
      slug: fm.slug || e.name,
      emoji: fm.emoji || "",
      type: fm.type || "specialist",
      department: fm.department || "",
      role: fm.role || "",
      heartbeat: fm.heartbeat || "",
    });
  }
  return agents;
}

function collectJobs(cabinetDir) {
  const dir = path.join(cabinetDir, ".jobs");
  if (!fs.existsSync(dir)) return [];
  const jobs = [];
  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith(".yaml") && !f.endsWith(".yml")) continue;
    const data = readYamlFile(path.join(dir, f));
    if (!data?.id) continue;
    jobs.push({
      id: data.id,
      name: data.name || "",
      description: data.description || "",
      ownerAgent: data.ownerAgent || "",
      enabled: data.enabled !== false,
      schedule: data.schedule || "",
    });
  }
  return jobs;
}

function collectChildCabinets(rootDir) {
  const children = [];
  function scan(dir) {
    const entries = fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith(".")) continue;
      const full = path.join(dir, e.name);
      if (fs.existsSync(path.join(full, ".cabinet"))) {
        const meta = readYamlFile(path.join(full, ".cabinet")) || {};
        children.push({
          path: path.relative(rootDir, full).split(path.sep).join("/"),
          name: meta.name || e.name,
          agents: collectAgents(full),
          jobs: collectJobs(full),
        });
      }
      scan(full);
    }
  }
  scan(rootDir);
  return children;
}

function findCover(cabinetDir) {
  for (const name of ["cover.jpg", "cover.png", "cover.webp"]) {
    if (fs.existsSync(path.join(cabinetDir, name))) return name;
  }
  return null;
}

function build() {
  const cabinets = [];
  const details = [];
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const dir = path.join(ROOT, entry.name);
    const cabinetFile = path.join(dir, ".cabinet");
    if (!fs.existsSync(cabinetFile)) continue;

    const meta = readYamlFile(cabinetFile) || {};
    if (meta.kind && meta.kind !== "root") continue;

    const entryFile = path.join(dir, meta.entry || "index.md");
    const fm = readFrontmatter(entryFile);
    const tags = Array.isArray(fm.tags) ? fm.tags : [];

    const agents = collectAgents(dir);
    const jobs = collectJobs(dir);
    const children = collectChildCabinets(dir);
    const name = meta.name || entry.name;
    const description = meta.description || "";
    const version = meta.version || "0.1.0";

    cabinets.push({
      slug: entry.name,
      name,
      description,
      version,
      domain: meta.domain || SLUG_DOMAIN[entry.name] || "Other",
      cover: findCover(dir),
      agentCount: agents.length,
      jobCount: jobs.length,
      childCount: children.length,
      tags,
    });

    // Markdown, not rendered HTML: the app renders it, so the wiki-link
    // stripping and the remark pipeline stay versioned with the app instead
    // of freezing into 164 generated files here.
    details.push({
      schemaVersion: 1,
      slug: entry.name,
      meta: { name, description, version },
      tags,
      readme: readBody(entryFile),
      agents,
      jobs,
      children,
      files: listFiles(entry.name),
    });
  }
  cabinets.sort((a, b) => a.slug.localeCompare(b.slug));
  details.sort((a, b) => a.slug.localeCompare(b.slug));
  return {
    manifest: {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      cabinetCount: cabinets.length,
      cabinets,
    },
    details,
  };
}

const { manifest, details } = build();

const outPath = path.join(ROOT, "manifest.json");
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");

// No generatedAt in a detail file, so it only changes when the cabinet does
// and the commit-back stays empty on a no-op build. Files for cabinets that
// no longer exist are deleted, otherwise a removed slug keeps answering.
const detailDir = path.join(ROOT, DETAIL_DIR);
fs.mkdirSync(detailDir, { recursive: true });
const wanted = new Set(details.map((d) => `${d.slug}.json`));
for (const f of fs.readdirSync(detailDir)) {
  if (f.endsWith(".json") && !wanted.has(f)) fs.rmSync(path.join(detailDir, f));
}
for (const detail of details) {
  fs.writeFileSync(
    path.join(detailDir, `${detail.slug}.json`),
    JSON.stringify(detail, null, 2) + "\n"
  );
}

console.log(
  `Wrote ${path.relative(ROOT, outPath)} — ${manifest.cabinetCount} cabinets.`
);
console.log(`Wrote ${DETAIL_DIR}/ (${details.length} detail files).`);
