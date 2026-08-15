#!/usr/bin/env node
// Regenerates the "Browse the Registry" table in README.md from the cabinets
// themselves (same data the manifest builder reads). Run after adding cabinets:
//   node .github/scripts/build-readme-table.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// Fallback domains for cabinets whose .cabinet has no domain: (mirrors build-manifest.mjs)
let SLUG_DOMAIN = {};
try {
  const src = fs.readFileSync(path.join(ROOT, ".github/scripts/build-manifest.mjs"), "utf8");
  const m = src.match(/const SLUG_DOMAIN = \{[\s\S]*?\};/);
  if (m) SLUG_DOMAIN = eval("(" + m[0].replace("const SLUG_DOMAIN = ", "").replace(/;$/, "") + ")");
} catch {}

const rows = [];
for (const slug of fs.readdirSync(ROOT).sort()) {
  const dir = path.join(ROOT, slug);
  const cabFile = path.join(dir, ".cabinet");
  if (slug.startsWith(".") || !fs.existsSync(cabFile) || !fs.statSync(dir).isDirectory()) continue;
  let cab = {};
  try { cab = yaml.load(fs.readFileSync(cabFile, "utf8")) || {}; } catch {}
  const domain = cab.domain || SLUG_DOMAIN[slug] || "Other";
  const agents = fs.existsSync(path.join(dir, ".agents"))
    ? fs.readdirSync(path.join(dir, ".agents")).filter(a => !a.startsWith(".") &&
        fs.existsSync(path.join(dir, ".agents", a, "persona.md"))).length : 0;
  const jobs = fs.existsSync(path.join(dir, ".jobs"))
    ? fs.readdirSync(path.join(dir, ".jobs")).filter(f => f.endsWith(".yaml") || f.endsWith(".yml")).length : 0;
  const children = fs.readdirSync(dir).filter(c => {
    const p = path.join(dir, c);
    return !c.startsWith(".") && fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, ".cabinet"));
  }).length;
  let desc = String(cab.description || "").replace(/\s+/g, " ").trim();
  const firstSentence = desc.match(/^.{20,}?[.!?](?=\s|$)/);
  if (firstSentence) desc = firstSentence[0].replace(/[.!?]$/, "");
  if (desc.length > 140) desc = desc.slice(0, 137).trimEnd() + "…";
  desc = desc.replace(/\|/g, "\\|");
  rows.push(`| [${slug}](./${slug}) | ${domain} | ${agents} | ${jobs} | ${children} | ${desc} |`);
}

const section = `## Browse the Registry

Each top-level directory in this repo is a complete cabinet template you can install and customize — **${rows.length} templates**: the original personal & creator cabinets, a department-organized enterprise suite, per-integration showcases (Gmail, Asana, Stripe, Notion, …), and the wooden lifestyle templates. Install any of them with \`npx cabinets add <name>\`.

### All templates

| Cabinet | Domain | Agents | Jobs | Children | Description |
|---------|--------|--------|------|----------|-------------|
${rows.join("\n")}

`;

const readmePath = path.join(ROOT, "README.md");
const readme = fs.readFileSync(readmePath, "utf8");
const start = readme.indexOf("## Browse the Registry");
const end = readme.indexOf("## Cabinet File Format");
if (start < 0 || end < 0 || end < start) { console.error("README anchors not found"); process.exit(1); }
fs.writeFileSync(readmePath, readme.slice(0, start) + section + readme.slice(end));
console.log(`README table rebuilt — ${rows.length} cabinets.`);
