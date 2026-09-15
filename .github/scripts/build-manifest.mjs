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
 * Flags:
 *   --check        validate and print, write nothing, exit 1 on any error
 *   --root <dir>   the repo root to walk (default: this repo; the tests
 *                  point it at fixtures)
 *   --ids <path>   the connector id vocabulary (default:
 *                  <root>/.github/connector-ids.json)
 *
 * Every error is collected and printed as a GitHub annotation before the
 * script exits 1, and nothing is written when there is one.
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
import { fileURLToPath, pathToFileURL } from "node:url";
import matter from "gray-matter";
import yaml from "js-yaml";
import {
  annotation,
  loadConnectorIds,
  normalizeForWire,
  validateCabinet,
} from "./connectors.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const IDS_FILE = path.join(".github", "connector-ids.json");

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
function listFiles(root, slug) {
  const out = execFileSync("git", ["ls-files", "-z", "--", slug], {
    cwd: root,
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

/** True when `root` is the top of a git work tree, so `git ls-files` speaks for it. */
function isGitRoot(root) {
  try {
    const top = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return fs.realpathSync(top) === fs.realpathSync(root);
  } catch {
    return false;
  }
}

/**
 * A cabinet's agents, each with its persona body and the path of its persona
 * relative to the cabinet, for the connector checks.
 */
function readAgents(cabinetDir) {
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
      summary: {
        name: fm.name || e.name,
        slug: fm.slug || e.name,
        emoji: fm.emoji || "",
        type: fm.type || "specialist",
        department: fm.department || "",
        role: fm.role || "",
        heartbeat: fm.heartbeat || "",
      },
      file: `.agents/${e.name}/persona.md`,
      body: readBody(persona),
    });
  }
  return agents;
}

function collectAgents(cabinetDir) {
  return readAgents(cabinetDir).map((agent) => agent.summary);
}

/** A cabinet's jobs, each with its prompt and the path of its file relative to the cabinet. */
function readJobs(cabinetDir) {
  const dir = path.join(cabinetDir, ".jobs");
  if (!fs.existsSync(dir)) return [];
  const jobs = [];
  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith(".yaml") && !f.endsWith(".yml")) continue;
    const data = readYamlFile(path.join(dir, f));
    if (!data?.id) continue;
    jobs.push({
      summary: {
        id: data.id,
        name: data.name || "",
        description: data.description || "",
        ownerAgent: data.ownerAgent || "",
        enabled: data.enabled !== false,
        schedule: data.schedule || "",
      },
      file: `.jobs/${f}`,
      prompt: typeof data.prompt === "string" ? data.prompt : "",
    });
  }
  return jobs;
}

function collectJobs(cabinetDir) {
  return readJobs(cabinetDir).map((job) => job.summary);
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

/**
 * Walks every root cabinet under `root`, validates its connectors and
 * prompts, and returns what would be written. Nothing is written here.
 *
 * - `root`: the repo root (default: this repo)
 * - `idsPath`: the connector id vocabulary (default: `<root>/.github/connector-ids.json`)
 * - `withFiles`: list each cabinet's committed files through git; off, or
 *   with a root that is not the top of a git work tree, `files` is []
 *
 * Returns `{ manifest, details, errors, warnings }`; errors and warnings are
 * lists of `{ file, message }`, and a caller must not write when errors is
 * not empty.
 */
export function build({ root = ROOT, idsPath, withFiles = true } = {}) {
  const repoRoot = path.resolve(root);
  const errors = [];
  const warnings = [];
  const vocabularyPath = path.resolve(idsPath ?? path.join(repoRoot, IDS_FILE));
  let ids;
  try {
    ids = loadConnectorIds(vocabularyPath);
  } catch (error) {
    errors.push({ file: IDS_FILE, message: error.message });
    return { manifest: null, details: [], errors, warnings };
  }
  const listCommitted = withFiles && isGitRoot(repoRoot);
  // One map across the walk, so a second hero for an id names the first.
  const heroes = new Map();

  const cabinets = [];
  const details = [];
  const entries = fs
    .readdirSync(repoRoot, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const dir = path.join(repoRoot, entry.name);
    const cabinetFile = path.join(dir, ".cabinet");
    if (!fs.existsSync(cabinetFile)) continue;

    const meta = readYamlFile(cabinetFile) || {};
    if (meta.kind && meta.kind !== "root") continue;

    const entryFile = path.join(dir, meta.entry || "index.md");
    const fm = readFrontmatter(entryFile);
    const tags = Array.isArray(fm.tags) ? fm.tags : [];

    const agentSources = readAgents(dir);
    const jobSources = readJobs(dir);
    const agents = agentSources.map((agent) => agent.summary);
    const jobs = jobSources.map((job) => job.summary);
    const children = collectChildCabinets(dir);
    const name = meta.name || entry.name;
    const description = meta.description || "";
    const version = meta.version || "0.1.0";

    const report = validateCabinet({
      slug: entry.name,
      meta,
      jobs: jobs.map((job) => job.id),
      agents: agents.map((agent) => agent.slug),
      jobPrompts: jobSources.map((job) => ({
        id: job.summary.id,
        ownerAgent: job.summary.ownerAgent,
        file: `${entry.name}/${job.file}`,
        text: job.prompt,
      })),
      personaTexts: agentSources.map((agent) => ({
        slug: agent.summary.slug,
        file: `${entry.name}/${agent.file}`,
        text: agent.body,
      })),
      tags,
      ids,
      heroes,
    });
    errors.push(...report.errors);
    warnings.push(...report.warnings);
    const { manifestRefs, detailConnectors, prompts } = normalizeForWire(meta);

    // Declarations are added only when present, so an undeclared cabinet's
    // entry and detail file stay byte-identical to before they existed.
    const cabinet = {
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
    };
    if (manifestRefs.length) cabinet.connectors = manifestRefs;
    cabinets.push(cabinet);

    // Markdown, not rendered HTML: the app renders it, so the wiki-link
    // stripping and the remark pipeline stay versioned with the app instead
    // of freezing into 164 generated files here.
    const detail = {
      schemaVersion: 1,
      slug: entry.name,
      meta: { name, description, version },
      tags,
      readme: readBody(entryFile),
      agents,
      jobs,
      children,
    };
    if (detailConnectors.length) detail.connectors = detailConnectors;
    if (prompts.length) detail.prompts = prompts;
    detail.files = listCommitted ? listFiles(repoRoot, entry.name) : [];
    details.push(detail);
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
    errors,
    warnings,
  };
}

function writeOutputs(root, manifest, details) {
  const outPath = path.join(root, "manifest.json");
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");

  // No generatedAt in a detail file, so it only changes when the cabinet does
  // and the commit-back stays empty on a no-op build. Files for cabinets that
  // no longer exist are deleted, otherwise a removed slug keeps answering.
  const detailDir = path.join(root, DETAIL_DIR);
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
  return outPath;
}

function parseArgs(argv) {
  const options = { check: false, root: ROOT, idsPath: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--check") {
      options.check = true;
    } else if (arg === "--root" || arg === "--ids") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) throw new Error(`${arg} needs a path.`);
      if (arg === "--root") options.root = path.resolve(value);
      else options.idsPath = path.resolve(value);
      i += 1;
    } else {
      throw new Error(`Unknown option ${arg}. Use --check, --root <dir> or --ids <path>.`);
    }
  }
  return options;
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return;
  }
  const { manifest, details, errors, warnings } = build({
    root: options.root,
    idsPath: options.idsPath,
    withFiles: !options.check,
  });

  for (const warning of warnings) console.log(annotation("warning", warning));
  for (const error of errors) console.log(annotation("error", error));
  if (errors.length) {
    console.log(
      `${errors.length} error${errors.length === 1 ? "" : "s"} in cabinet declarations. Nothing was written.`
    );
    // exitCode, not process.exit(): on macOS a piped stdout is asynchronous,
    // and exiting at once drops the error lines printed last.
    process.exitCode = 1;
    return;
  }

  if (options.check) {
    console.log(
      `Checked ${manifest.cabinetCount} cabinet${manifest.cabinetCount === 1 ? "" : "s"}: no errors, ${warnings.length} warning${warnings.length === 1 ? "" : "s"}.`
    );
    return;
  }

  const outPath = writeOutputs(options.root, manifest, details);
  console.log(
    `Wrote ${path.relative(options.root, outPath)} — ${manifest.cabinetCount} cabinets.`
  );
  console.log(`Wrote ${DETAIL_DIR}/ (${details.length} detail files).`);
}

// Run only as a script, so the tests can import build(). Compared through
// realpath, since argv[1] keeps a symlinked path (macOS /tmp) and the module
// URL does not.
function isMainModule() {
  if (!process.argv[1]) return false;
  try {
    return import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href;
  } catch {
    return false;
  }
}

if (isMainModule()) main();
