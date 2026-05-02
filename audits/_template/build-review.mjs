#!/usr/bin/env node
// Reads every audit issue under ./issues/*.md, extracts a small data object
// (title, severity, area, status, observation, what-changed) per issue, and
// writes a single self-contained review.html slideshow into ./review/.
//
// Open the slideshow inside Cabinet by clicking the `review` node in the
// audit folder (the .app marker makes it render as a fullscreen app), or
// from any browser by pointing it at review/index.html.
//
// Re-run after editing issue files: `node build-review.mjs`
//
// This script is project-agnostic — it auto-derives the audit label from
// the folder name (e.g. `audit-2026-05-01` → "Audit 2026-05-01"). Copy it
// into any audit folder unchanged.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ISSUES_DIR = path.join(__dirname, "issues");
// Cabinet renders any folder with index.html as a website, and a folder
// containing both index.html + a `.app` marker as a fullscreen app
// (src/lib/storage/tree-builder.ts:191-205). Drop the slideshow into
// `review/` so it shows up as an "app" node in the audit cabinet tree.
const OUT_DIR = path.join(__dirname, "review");
const OUT_HTML = path.join(OUT_DIR, "index.html");
const APP_MARKER = path.join(OUT_DIR, ".app");

// Auto-derive the label from the folder name. `audit-2026-05-01` →
// "Audit 2026-05-01"; falls back to a sentence-cased folder name otherwise.
const folderName = path.basename(__dirname);
const AUDIT_LABEL = (() => {
  const m = folderName.match(/^audit-(\d{4}-\d{2}-\d{2})$/);
  if (m) return `Audit ${m[1]}`;
  return folderName.charAt(0).toUpperCase() + folderName.slice(1).replace(/-/g, " ");
})();

// Tiny YAML frontmatter parser. Only handles what the audit issue files
// produce: scalar key/value pairs (with single, double, or no quotes), the
// `>-` folded block scalar (used for long titles), and indented bullet
// lists (which we ignore — we only need the scalar fields). Anything more
// exotic and we'd swap in js-yaml.
function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: {}, body: raw };
  const fmText = m[1];
  const body = m[2];
  const fm = {};
  const lines = fmText.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) { i++; continue; }
    const key = kv[1];
    let value = kv[2];
    if (/^>-?$|^\|-?$/.test(value)) {
      // Folded/literal block scalar — collect indented continuation lines.
      const collected = [];
      i++;
      while (i < lines.length) {
        const next = lines[i];
        if (next.trim() === "" || /^\s+/.test(next)) {
          collected.push(next.replace(/^\s+/, ""));
          i++;
        } else break;
      }
      fm[key] = collected.join(" ").replace(/\s+/g, " ").trim();
      continue;
    }
    if (value === "") {
      // Empty value usually means an indented bullet list follows.
      // We don't need lists for our output; skip them.
      i++;
      while (i < lines.length && /^\s+/.test(lines[i])) i++;
      continue;
    }
    // Strip surrounding quotes; collapse YAML's doubled single-quote escape.
    if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1).replace(/''/g, "'");
    } else if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\"/g, '"');
    }
    fm[key] = value;
    i++;
  }
  return { fm, body };
}

function extractSections(body) {
  const sections = {};
  const lines = body.split("\n");
  let header = null;
  let buf = [];
  for (const line of lines) {
    const m = line.match(/^## (.+)$/);
    if (m) {
      if (header) sections[header] = buf.join("\n").trim();
      header = m[1].trim();
      buf = [];
    } else if (header) {
      buf.push(line);
    }
  }
  if (header) sections[header] = buf.join("\n").trim();
  return sections;
}

function pickResolution(sections) {
  const key = Object.keys(sections).find((k) =>
    /^(Resolution|Skip note|Deferral note)/.test(k)
  );
  if (!key) return { label: "", body: "" };
  return { label: key, body: sections[key] };
}

// Pulls the screenshot path out of a `## Screenshot` section. Issue files
// commonly format it as a single backticked string, e.g.:
//   ## Screenshot
//   `screenshots/01-homescreen-cold-boot.png`
// Some files also write the path bare or use a markdown image link.
function pickScreenshot(sections) {
  const body = sections["Screenshot"] || sections["Screenshots"] || "";
  if (!body) return null;
  // Markdown image: ![alt](path)
  const md = body.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (md) return md[1].trim();
  // Backtick code span
  const tick = body.match(/`([^`]+\.(?:png|jpe?g|gif|webp|svg|avif))`/i);
  if (tick) return tick[1].trim();
  // Plain path
  const plain = body.match(/(\S+\.(?:png|jpe?g|gif|webp|svg|avif))/i);
  if (plain) return plain[1].trim();
  return null;
}

function stripLeadingId(title) {
  return String(title).replace(/^\d+\s*[—-]\s*/, "");
}

const files = (await fs.readdir(ISSUES_DIR))
  .filter((f) => /^\d+.*\.md$/.test(f))
  .sort();

const issues = [];
for (const file of files) {
  const raw = await fs.readFile(path.join(ISSUES_DIR, file), "utf8");
  const { fm, body } = parseFrontmatter(raw);
  const idMatch = file.match(/^(\d+)/);
  const id = idMatch ? idMatch[1] : "";
  const sections = extractSections(body);
  const resolution = pickResolution(sections);
  issues.push({
    id,
    file: file.replace(/\.md$/, ""),
    title: stripLeadingId(fm.title || file),
    severity: fm.severity || "",
    area: fm.area || "",
    status: fm.status || "open",
    observation: sections["Observation"] || "",
    recommendation: sections["Recommendation"] || "",
    resolutionLabel: resolution.label,
    resolution: resolution.body,
    // Screenshot path extracted from the `## Screenshot` section. The path
    // is recorded relative to the audit folder (e.g. "screenshots/01.png");
    // the HTML lives in review/, so it prepends "../" at render time.
    screenshot: pickScreenshot(sections),
  });
}

// Plain template literal (NOT String.raw): so `\${...}` resolves to a
// literal `${...}` in the output JS, and `\`` resolves to a literal
// backtick. With String.raw the backslashes were preserved as-is and the
// browser saw "\`" / "\${" — a syntax error that aborted the script.
const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${AUDIT_LABEL} — Review</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,500;0,8..60,600;1,8..60,500&display=swap"
  rel="stylesheet"
/>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<style>
  /* Mirrors Cabinet's "paper" theme (src/lib/themes.ts:326). Light-only —
     no dark variant — to keep the review surface as calm as the brand
     theme. Tokens copied from the paper palette so the slideshow blends
     with the rest of Cabinet when opened inline. */
  :root {
    --bg:           #faf6f1;   /* paper background */
    --bg-elevated:  #ffffff;   /* card */
    --bg-soft:      #f3ede4;   /* accent / sidebar bg */
    --bg-warmer:    #faf2ea;   /* muted */
    --fg:           #3b2f2f;   /* foreground */
    --fg-muted:     #a89888;   /* muted-foreground */
    --fg-faint:     #c2b6a4;   /* slightly fainter than muted */
    --border:       #e8ddd0;   /* paper border */
    --primary:      #8b5e3c;   /* warm rust/brown */
    --primary-soft: rgba(139, 94, 60, 0.10);
    --primary-deep: #6b4a2d;   /* paper --ring */
    --pass:         #4f7a4b;   /* sage green, paper-friendly */
    --pass-soft:    rgba(79, 122, 75, 0.10);
    --fail:         #b44848;   /* warm red */
    --fail-soft:    rgba(180, 72, 72, 0.10);
    --skip:         #8e7a64;   /* muted brown */
    --skip-soft:    rgba(142, 122, 100, 0.10);
    --shadow:       0 1px 0 rgba(70, 50, 30, 0.04),
                    0 12px 28px -16px rgba(70, 50, 30, 0.22);
    --radius:       12px;
    --max-w:        940px;
    --font-sans:    "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-serif:   "Source Serif 4", "Iowan Old Style", Georgia, serif;
    --font-mono:    ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  }

  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--fg);
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }

  header.app-header {
    position: sticky;
    top: 0;
    z-index: 5;
    background: color-mix(in srgb, var(--bg) 92%, transparent);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
  }
  .header-inner {
    max-width: var(--max-w);
    margin: 0 auto;
    padding: 14px 20px 12px;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .brand {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }
  .brand-title {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 17px;
    font-weight: 500;
    letter-spacing: -0.01em;
  }
  .brand-sub {
    font-size: 12px;
    color: var(--fg-muted);
  }
  .header-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
  .header-actions button {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--fg-muted);
    border-radius: 8px;
    padding: 5px 10px;
    font-size: 12px;
    cursor: pointer;
    font-family: inherit;
  }
  .header-actions button:hover {
    background: var(--bg-soft);
    color: var(--fg);
  }

  .progress-row {
    max-width: var(--max-w);
    margin: 0 auto;
    padding: 0 20px 12px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .progress-track {
    flex: 1;
    height: 4px;
    border-radius: 999px;
    background: var(--bg-soft);
    overflow: hidden;
  }
  .progress-bar {
    height: 100%;
    background: var(--primary);
    transition: width 200ms ease-out;
  }
  .progress-stats {
    font-size: 11.5px;
    color: var(--fg-muted);
    font-variant-numeric: tabular-nums;
    min-width: 110px;
    text-align: right;
  }
  .progress-counts {
    display: inline-flex;
    gap: 8px;
  }
  .count-pass { color: var(--pass); }
  .count-fail { color: var(--fail); }
  .count-todo { color: var(--fg-faint); }

  main {
    max-width: var(--max-w);
    margin: 0 auto;
    padding: 28px 20px 100px;
  }

  /* ── Slide ───────────────────────────────────────────── */
  .slide {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 26px 28px 22px;
    animation: slideIn 220ms ease-out;
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
    align-items: center;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
    border: 1px solid transparent;
    text-transform: uppercase;
  }
  .badge-id {
    font-family: var(--font-mono);
    font-weight: 700;
    color: var(--fg);
    background: var(--bg-soft);
    border-color: var(--border);
    text-transform: none;
    letter-spacing: 0;
  }
  /* Severity badges — paper-friendly desaturated palette. P1 / P2 / P3
     read at a glance without yelling against the warm cream surface. */
  .badge-sev-P1 { color: #a23a2c; background: rgba(162, 58, 44, 0.10); border-color: rgba(162, 58, 44, 0.20); }
  .badge-sev-P2 { color: #a06b1f; background: rgba(160, 107, 31, 0.10); border-color: rgba(160, 107, 31, 0.20); }
  .badge-sev-P3 { color: #4f7a4b; background: rgba(79, 122, 75, 0.10);  border-color: rgba(79, 122, 75, 0.20);  }
  .badge-area    { color: var(--fg-muted); background: var(--bg-soft); border-color: var(--border); }
  .badge-status-fixed    { color: var(--pass); background: var(--pass-soft); border-color: transparent; }
  .badge-status-skipped  { color: var(--skip); background: var(--skip-soft); border-color: transparent; }
  .badge-status-deferred { color: #b97a1f; background: rgba(185,122,31,0.12); border-color: transparent; }
  .badge-status-open     { color: var(--fg-faint); background: var(--bg-soft); border-color: var(--border); }

  .verdict-tag {
    margin-left: auto;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .verdict-tag.pass { color: var(--pass); }
  .verdict-tag.fail { color: var(--fail); }

  /* Title in the paper theme's serif so each slide reads like a printed
     index card. Source Serif 4 falls back to the system's "Iowan Old
     Style" / Georgia stack. */
  h1.slide-title {
    margin: 4px 0 18px;
    font-family: var(--font-serif);
    font-size: 24px;
    line-height: 1.25;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: var(--fg);
  }

  /* ── Screenshot strip ─────────────────────────────────── */
  .screenshot {
    margin: 0 0 18px;
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    background: var(--bg-warmer);
  }
  .screenshot button.screenshot-trigger {
    display: block;
    width: 100%;
    border: 0;
    background: transparent;
    padding: 0;
    cursor: zoom-in;
  }
  .screenshot img {
    display: block;
    width: 100%;
    max-height: 320px;
    object-fit: cover;
    object-position: top center;
    background: var(--bg-warmer);
  }
  .screenshot-caption {
    padding: 6px 10px;
    font-size: 11px;
    color: var(--fg-muted);
    border-top: 1px solid var(--border);
    background: var(--bg-elevated);
    font-family: var(--font-mono);
    text-align: center;
  }
  /* Lightbox — click the screenshot to see it full-size. */
  .lightbox {
    position: fixed;
    inset: 0;
    background: rgba(35, 25, 18, 0.84);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 50;
    padding: 28px;
    cursor: zoom-out;
  }
  .lightbox.open { display: flex; }
  .lightbox img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
    border-radius: 8px;
  }

  .panes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    margin-bottom: 18px;
  }
  @media (max-width: 760px) {
    .panes { grid-template-columns: 1fr; }
  }
  .pane {
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 16px;
  }
  .pane-label {
    text-transform: uppercase;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--fg-muted);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .pane-label::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: var(--fg-faint);
    display: inline-block;
  }
  .pane.what-was .pane-label::before  { background: var(--fail); opacity: 0.55; }
  .pane.what-changed .pane-label::before { background: var(--pass); opacity: 0.7; }
  .pane-body {
    font-size: 14px;
    color: var(--fg);
    max-height: 280px;
    overflow-y: auto;
    padding-right: 4px;
  }
  .pane-body p:first-child { margin-top: 0; }
  .pane-body p:last-child  { margin-bottom: 0; }
  .pane-body p { margin: 8px 0; }
  .pane-body ul, .pane-body ol { margin: 6px 0 6px 22px; padding: 0; }
  .pane-body li { margin: 3px 0; }
  .pane-body code {
    font-family: var(--font-mono);
    font-size: 12.5px;
    background: var(--bg);
    padding: 1px 5px;
    border-radius: 4px;
    border: 1px solid var(--border);
  }
  .pane-body pre {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 10px;
    overflow-x: auto;
    font-size: 12.5px;
  }
  .pane-body pre code { background: transparent; border: none; padding: 0; }
  .pane-body strong { font-weight: 600; }
  .pane-body em { font-style: italic; }
  .pane-body a { color: var(--primary); }
  .pane-body table {
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 13px;
  }
  .pane-body table th, .pane-body table td {
    border: 1px solid var(--border);
    padding: 4px 8px;
    text-align: left;
  }
  .pane-body table th {
    background: var(--bg);
    font-weight: 600;
  }

  /* ── Comment ─────────────────────────────────────────── */
  .comment-row {
    margin-bottom: 18px;
  }
  .comment-row label {
    display: block;
    text-transform: uppercase;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--fg-muted);
    margin-bottom: 6px;
  }
  textarea.comment {
    width: 100%;
    min-height: 64px;
    max-height: 220px;
    resize: vertical;
    padding: 10px 12px;
    font-family: var(--font-sans);
    font-size: 14px;
    color: var(--fg);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    outline: none;
    transition: border-color 120ms, box-shadow 120ms;
  }
  textarea.comment:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-soft);
  }

  /* ── Action row ──────────────────────────────────────── */
  .actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .actions .spacer { flex: 1; }
  .btn {
    appearance: none;
    border: 1px solid var(--border);
    background: var(--bg-elevated);
    color: var(--fg);
    padding: 9px 16px;
    border-radius: 9px;
    font-size: 14px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: all 120ms;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .btn:hover { background: var(--bg-soft); }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn .kbd {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--fg-faint);
    background: var(--bg);
    padding: 1px 5px;
    border-radius: 3px;
    border: 1px solid var(--border);
    margin-left: 2px;
  }
  .btn-pass {
    color: var(--pass);
    border-color: color-mix(in srgb, var(--pass) 35%, var(--border));
  }
  .btn-pass:hover { background: var(--pass-soft); }
  .btn-pass.active {
    background: var(--pass);
    color: white;
    border-color: var(--pass);
  }
  .btn-pass.active .kbd { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.8); border-color: rgba(255,255,255,0.2); }
  .btn-fail {
    color: var(--fail);
    border-color: color-mix(in srgb, var(--fail) 35%, var(--border));
  }
  .btn-fail:hover { background: var(--fail-soft); }
  .btn-fail.active {
    background: var(--fail);
    color: white;
    border-color: var(--fail);
  }
  .btn-fail.active .kbd { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.8); border-color: rgba(255,255,255,0.2); }
  .btn-skip { color: var(--skip); }
  .btn-skip:hover { background: var(--skip-soft); }
  .btn-nav {
    color: var(--fg-muted);
  }

  /* ── Summary table ───────────────────────────────────── */
  .summary-card {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 26px 28px 24px;
    animation: slideIn 220ms ease-out;
  }
  .summary-card h2 {
    margin: 0 0 6px;
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 500;
    font-size: 22px;
  }
  .summary-card p.lead {
    margin: 0 0 18px;
    color: var(--fg-muted);
    font-size: 14px;
  }
  .summary-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .summary-actions .btn-primary {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }
  .summary-actions .btn-primary:hover { filter: brightness(1.05); }
  .summary-actions .copied {
    color: var(--pass);
    font-size: 12px;
    align-self: center;
  }
  .summary-table-wrap { overflow-x: auto; }
  table.summary-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  table.summary-table th,
  table.summary-table td {
    border-bottom: 1px solid var(--border);
    padding: 8px 10px;
    text-align: left;
    vertical-align: top;
  }
  table.summary-table th {
    color: var(--fg-muted);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
    background: var(--bg-soft);
    position: sticky;
    top: 0;
  }
  table.summary-table tr:hover td { background: var(--bg-soft); }
  table.summary-table .col-id     { font-family: var(--font-mono); white-space: nowrap; width: 50px; }
  table.summary-table .col-sev    { width: 50px; }
  table.summary-table .col-area   { width: 80px; color: var(--fg-muted); font-size: 11.5px; text-transform: uppercase; }
  table.summary-table .col-verdict { width: 90px; font-weight: 600; }
  table.summary-table .verdict-pass { color: var(--pass); }
  table.summary-table .verdict-fail { color: var(--fail); }
  table.summary-table .verdict-none { color: var(--fg-faint); }
  table.summary-table td.title-cell {
    font-weight: 500;
  }
  table.summary-table td.comment-cell {
    color: var(--fg-muted);
    font-style: italic;
    white-space: pre-wrap;
    max-width: 380px;
  }
  .summary-row-clickable { cursor: pointer; }

  /* ── Toast ───────────────────────────────────────────── */
  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--fg);
    color: var(--bg);
    padding: 10px 16px;
    border-radius: 999px;
    font-size: 13px;
    box-shadow: 0 6px 24px rgba(0,0,0,0.2);
    opacity: 0;
    pointer-events: none;
    transition: opacity 200ms, transform 200ms;
    z-index: 100;
  }
  .toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(-4px);
  }

  /* ── Footer ──────────────────────────────────────────── */
  footer.tip {
    max-width: var(--max-w);
    margin: 16px auto 0;
    padding: 0 20px;
    color: var(--fg-faint);
    font-size: 11px;
    text-align: center;
  }
  footer.tip kbd {
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 3px;
    border: 1px solid var(--border);
    background: var(--bg-elevated);
    margin: 0 2px;
  }
</style>
</head>
<body>
  <header class="app-header">
    <div class="header-inner">
      <div class="brand">
        <span class="brand-title">${AUDIT_LABEL}</span>
        <span class="brand-sub" id="hdr-sub">Review</span>
      </div>
      <div class="header-actions">
        <button id="btn-summary" title="Jump to summary table">Summary</button>
        <button id="btn-export"  title="Download reviews.json">Export JSON</button>
      </div>
    </div>
    <div class="progress-row">
      <div class="progress-track"><div class="progress-bar" id="progress-bar"></div></div>
      <div class="progress-stats">
        <span class="progress-counts">
          <span class="count-pass" id="count-pass">0✓</span>
          <span class="count-fail" id="count-fail">0✗</span>
          <span class="count-todo" id="count-todo">0·</span>
        </span>
        <span id="progress-pos" style="margin-left:8px;"></span>
      </div>
    </div>
  </header>

  <main id="main"></main>

  <footer class="tip">
    <kbd>←</kbd> <kbd>→</kbd> navigate
    · <kbd>P</kbd> pass · <kbd>F</kbd> fail · <kbd>S</kbd> skip
    · <kbd>G</kbd> summary
    — reviews autosave to your browser; <em>Export JSON</em> downloads <code>reviews.json</code>.
  </footer>

  <div class="toast" id="toast"></div>

  <div class="lightbox" id="lightbox" role="dialog" aria-label="Screenshot full view">
    <img id="lightbox-img" alt="" />
  </div>

<script>
  // ── Data ──────────────────────────────────────────────────────
  const ISSUES = ${JSON.stringify(issues)};
  const AUDIT_KEY = "cabinet-audit-${path.basename(__dirname)}-reviews-v1";

  // ── State ─────────────────────────────────────────────────────
  let state = loadState();
  let cursor = clampCursor(state.lastIndex ?? 0);
  let summaryView = false;

  function defaultState() {
    return { lastIndex: 0, reviews: {} };
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(AUDIT_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return { lastIndex: parsed.lastIndex ?? 0, reviews: parsed.reviews ?? {} };
    } catch {
      return defaultState();
    }
  }
  function saveState() {
    try {
      localStorage.setItem(
        AUDIT_KEY,
        JSON.stringify({
          lastIndex: cursor,
          updatedAt: new Date().toISOString(),
          reviews: state.reviews,
        })
      );
    } catch (err) {
      console.warn("Failed to persist:", err);
    }
  }
  function clampCursor(i) {
    if (ISSUES.length === 0) return 0;
    return Math.max(0, Math.min(ISSUES.length - 1, i));
  }

  // ── Render ────────────────────────────────────────────────────
  const main = document.getElementById("main");

  function renderProgress() {
    const total = ISSUES.length;
    let pass = 0, fail = 0;
    for (const r of Object.values(state.reviews)) {
      if (r.verdict === "pass") pass++;
      else if (r.verdict === "fail") fail++;
    }
    const reviewed = pass + fail;
    document.getElementById("progress-bar").style.width = total
      ? \`\${(reviewed / total) * 100}%\`
      : "0%";
    document.getElementById("count-pass").textContent = \`\${pass}✓\`;
    document.getElementById("count-fail").textContent = \`\${fail}✗\`;
    document.getElementById("count-todo").textContent = \`\${total - reviewed}·\`;
    document.getElementById("progress-pos").textContent = summaryView
      ? "Summary"
      : \`\${cursor + 1} / \${total}\`;
    document.getElementById("hdr-sub").textContent = summaryView
      ? "Summary"
      : \`Review · \${ISSUES[cursor]?.id ? "#" + ISSUES[cursor].id : ""}\`;
  }

  function renderSlide() {
    const issue = ISSUES[cursor];
    if (!issue) return;
    const review = state.reviews[issue.id] || { verdict: null, comment: "" };
    const sevClass = "badge-sev-" + (issue.severity || "P3");
    const statusClass = "badge-status-" + (issue.status || "open");

    main.innerHTML = \`
      <article class="slide" id="slide-\${issue.id}">
        <div class="badges">
          <span class="badge badge-id">#\${escapeHtml(issue.id)}</span>
          <span class="badge \${sevClass}">\${escapeHtml(issue.severity)}</span>
          <span class="badge badge-area">\${escapeHtml(issue.area)}</span>
          <span class="badge \${statusClass}">\${escapeHtml(issue.status)}</span>
          \${review.verdict
            ? \`<span class="verdict-tag \${review.verdict}">\${review.verdict === "pass" ? "✓ Passed" : "✗ Failed"}</span>\`
            : ""}
        </div>
        <h1 class="slide-title">\${escapeHtml(issue.title)}</h1>

        \${issue.screenshot ? \`
          <figure class="screenshot">
            <button type="button" class="screenshot-trigger" data-shot="\${escapeHtml("../" + issue.screenshot)}">
              <img src="\${escapeHtml("../" + issue.screenshot)}" alt="Screenshot for #\${escapeHtml(issue.id)}" loading="lazy" />
            </button>
            <figcaption class="screenshot-caption">\${escapeHtml(issue.screenshot)} · click to enlarge</figcaption>
          </figure>
        \` : ""}

        <div class="panes">
          <section class="pane what-was">
            <div class="pane-label">What was</div>
            <div class="pane-body">\${renderMarkdown(issue.observation || "_No observation recorded._")}</div>
          </section>
          <section class="pane what-changed">
            <div class="pane-label">What changed</div>
            <div class="pane-body">\${renderMarkdown(issue.resolution || "_No resolution / skip note recorded._")}</div>
          </section>
        </div>

        <div class="comment-row">
          <label for="comment">Comments</label>
          <textarea
            id="comment"
            class="comment"
            placeholder="Notes for #\${issue.id}…"
          >\${escapeHtml(review.comment)}</textarea>
        </div>

        <div class="actions">
          <button class="btn btn-nav" id="btn-prev" \${cursor === 0 ? "disabled" : ""}>
            ◀ Prev
          </button>
          <button class="btn btn-pass \${review.verdict === "pass" ? "active" : ""}" id="btn-pass">
            ✓ Pass <span class="kbd">P</span>
          </button>
          <button class="btn btn-fail \${review.verdict === "fail" ? "active" : ""}" id="btn-fail">
            ✗ Fail <span class="kbd">F</span>
          </button>
          <button class="btn btn-skip" id="btn-skip">
            Skip <span class="kbd">S</span>
          </button>
          <span class="spacer"></span>
          <button class="btn btn-nav" id="btn-next">
            \${cursor === ISSUES.length - 1 ? "Summary →" : "Next ▶"}
          </button>
        </div>
      </article>
    \`;

    document.getElementById("btn-prev").onclick = () => goto(cursor - 1);
    document.getElementById("btn-next").onclick = () => {
      if (cursor === ISSUES.length - 1) showSummary();
      else goto(cursor + 1);
    };
    document.getElementById("btn-pass").onclick = () => recordVerdict("pass", true);
    document.getElementById("btn-fail").onclick = () => recordVerdict("fail", false);
    document.getElementById("btn-skip").onclick = () => goto(cursor + 1);

    const ta = document.getElementById("comment");
    ta.addEventListener("input", () => persistComment(ta.value));
    ta.addEventListener("blur", () => persistComment(ta.value));

    // Screenshot click → open lightbox at full resolution.
    const trigger = main.querySelector(".screenshot-trigger");
    if (trigger) {
      trigger.addEventListener("click", () => {
        openLightbox(trigger.dataset.shot || "");
      });
    }
  }

  function openLightbox(src) {
    if (!src) return;
    const box = document.getElementById("lightbox");
    const img = document.getElementById("lightbox-img");
    if (!box || !img) return;
    img.src = src;
    box.classList.add("open");
  }
  function closeLightbox() {
    const box = document.getElementById("lightbox");
    if (box) box.classList.remove("open");
  }

  function renderSummary() {
    let pass = 0, fail = 0, blank = 0;
    const rows = ISSUES.map((issue) => {
      const r = state.reviews[issue.id] || {};
      if (r.verdict === "pass") pass++;
      else if (r.verdict === "fail") fail++;
      else blank++;
      return { issue, review: r };
    });

    main.innerHTML = \`
      <section class="summary-card">
        <h2>Review summary</h2>
        <p class="lead">
          \${pass} passed · \${fail} failed · \${blank} not yet reviewed
          (out of \${ISSUES.length} issues).
        </p>
        <div class="summary-actions">
          <button class="btn btn-primary" id="copy-md">Copy as markdown table</button>
          <button class="btn" id="copy-json">Copy JSON</button>
          <button class="btn" id="dl-json">Download reviews.json</button>
          <button class="btn" id="back-to-slides">Back to slides</button>
          <span class="copied" id="copied" style="display:none;">Copied ✓</span>
        </div>
        <div class="summary-table-wrap">
          <table class="summary-table">
            <thead>
              <tr>
                <th class="col-id">#</th>
                <th class="col-sev">Sev</th>
                <th class="col-area">Area</th>
                <th>Title</th>
                <th class="col-verdict">Verdict</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              \${rows.map(({ issue, review }, i) => \`
                <tr class="summary-row-clickable" data-i="\${i}">
                  <td class="col-id">\${escapeHtml(issue.id)}</td>
                  <td class="col-sev">\${escapeHtml(issue.severity)}</td>
                  <td class="col-area">\${escapeHtml(issue.area)}</td>
                  <td class="title-cell">\${escapeHtml(issue.title)}</td>
                  <td class="col-verdict \${
                    review.verdict ? "verdict-" + review.verdict : "verdict-none"
                  }">\${
                    review.verdict
                      ? (review.verdict === "pass" ? "✓ Pass" : "✗ Fail")
                      : "—"
                  }</td>
                  <td class="comment-cell">\${escapeHtml(review.comment || "")}</td>
                </tr>
              \`).join("")}
            </tbody>
          </table>
        </div>
      </section>
    \`;

    document.getElementById("copy-md").onclick = () => copyMarkdown(rows);
    document.getElementById("copy-json").onclick = () => copyJson();
    document.getElementById("dl-json").onclick = () => downloadJson();
    document.getElementById("back-to-slides").onclick = () => {
      summaryView = false;
      renderProgress();
      renderSlide();
    };
    main.querySelectorAll(".summary-row-clickable").forEach((row) => {
      row.addEventListener("click", () => {
        summaryView = false;
        cursor = Number(row.dataset.i);
        renderProgress();
        renderSlide();
        saveState();
      });
    });
  }

  // ── Actions ───────────────────────────────────────────────────
  function persistComment(value) {
    const issue = ISSUES[cursor];
    if (!issue) return;
    const prior = state.reviews[issue.id] || {};
    state.reviews[issue.id] = {
      ...prior,
      comment: value,
      reviewedAt:
        prior.verdict || prior.comment !== value
          ? new Date().toISOString()
          : prior.reviewedAt,
    };
    saveState();
  }

  function recordVerdict(verdict, autoAdvance) {
    const issue = ISSUES[cursor];
    if (!issue) return;
    const ta = document.getElementById("comment");
    const prior = state.reviews[issue.id] || {};
    state.reviews[issue.id] = {
      verdict,
      comment: ta ? ta.value : (prior.comment || ""),
      reviewedAt: new Date().toISOString(),
    };
    saveState();
    renderProgress();
    if (autoAdvance && cursor < ISSUES.length - 1) {
      goto(cursor + 1);
    } else if (autoAdvance && cursor === ISSUES.length - 1) {
      showSummary();
    } else {
      renderSlide();
    }
  }

  function goto(idx) {
    if (idx < 0 || idx >= ISSUES.length) return;
    summaryView = false;
    cursor = idx;
    saveState();
    renderProgress();
    renderSlide();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showSummary() {
    summaryView = true;
    renderProgress();
    renderSummary();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Export ────────────────────────────────────────────────────
  function buildJson() {
    return JSON.stringify(
      {
        audit: "${AUDIT_LABEL}",
        updatedAt: new Date().toISOString(),
        reviews: state.reviews,
      },
      null,
      2
    );
  }

  function buildMarkdownTable(rows) {
    const lines = [];
    lines.push("| # | Sev | Area | Title | Verdict | Comment |");
    lines.push("|---|---|---|---|---|---|");
    for (const { issue, review } of rows) {
      const verdict = review.verdict
        ? (review.verdict === "pass" ? "✓ Pass" : "✗ Fail")
        : "—";
      const comment = (review.comment || "").replace(/\\|/g, "\\\\|").replace(/\\n/g, " ");
      lines.push(
        \`| \${issue.id} | \${issue.severity} | \${issue.area} | \${escapeMdCell(issue.title)} | \${verdict} | \${comment} |\`
      );
    }
    return lines.join("\\n");
  }

  function copyMarkdown(rows) {
    navigator.clipboard.writeText(buildMarkdownTable(rows)).then(showCopied);
  }
  function copyJson() {
    navigator.clipboard.writeText(buildJson()).then(showCopied);
  }
  function downloadJson() {
    const blob = new Blob([buildJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reviews.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("reviews.json downloaded");
  }
  function showCopied() {
    const el = document.getElementById("copied");
    if (el) {
      el.style.display = "inline";
      setTimeout(() => (el.style.display = "none"), 1400);
    } else {
      toast("Copied");
    }
  }
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1400);
  }

  // ── Helpers ───────────────────────────────────────────────────
  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  function escapeMdCell(str) {
    return String(str ?? "").replace(/\\|/g, "\\\\|").replace(/\\n/g, " ");
  }
  function renderMarkdown(md) {
    if (typeof marked === "undefined") return escapeHtml(md);
    try {
      marked.setOptions({ breaks: true, gfm: true });
      return marked.parse(md);
    } catch {
      return escapeHtml(md);
    }
  }

  // ── Keyboard ──────────────────────────────────────────────────
  document.addEventListener("keydown", (e) => {
    // Esc closes the lightbox first, regardless of focus.
    if (e.key === "Escape") {
      const lb = document.getElementById("lightbox");
      if (lb && lb.classList.contains("open")) {
        e.preventDefault();
        closeLightbox();
        return;
      }
    }
    const inField =
      e.target instanceof HTMLElement &&
      (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT");
    if (e.key === "ArrowLeft" && !inField) {
      e.preventDefault();
      summaryView ? (summaryView = false, renderProgress(), renderSlide()) : goto(cursor - 1);
    } else if (e.key === "ArrowRight" && !inField) {
      e.preventDefault();
      if (summaryView) return;
      if (cursor === ISSUES.length - 1) showSummary();
      else goto(cursor + 1);
    } else if ((e.key === "p" || e.key === "P") && !inField) {
      e.preventDefault();
      recordVerdict("pass", true);
    } else if ((e.key === "f" || e.key === "F") && !inField) {
      e.preventDefault();
      recordVerdict("fail", false);
    } else if ((e.key === "s" || e.key === "S") && !inField) {
      e.preventDefault();
      goto(cursor + 1);
    } else if ((e.key === "g" || e.key === "G") && !inField) {
      e.preventDefault();
      summaryView ? (summaryView = false, renderProgress(), renderSlide()) : showSummary();
    }
  });

  // ── Top-bar actions ───────────────────────────────────────────
  document.getElementById("btn-summary").onclick = () =>
    summaryView ? (summaryView = false, renderProgress(), renderSlide()) : showSummary();
  document.getElementById("btn-export").onclick = downloadJson;

  // Lightbox dismissal — click anywhere on the backdrop, or Esc.
  document.getElementById("lightbox").addEventListener("click", closeLightbox);

  // ── Boot ──────────────────────────────────────────────────────
  renderProgress();
  renderSlide();
</script>
</body>
</html>
`;

await fs.mkdir(OUT_DIR, { recursive: true });
await fs.writeFile(OUT_HTML, HTML);
// Empty `.app` marker — its presence flips the tree-builder's "website"
// classification into "app" (fullscreen). Content doesn't matter.
await fs.writeFile(
  APP_MARKER,
  "# Marker file — its presence makes Cabinet render this folder as a fullscreen app.\n"
);
console.log(
  `Wrote ${path.relative(process.cwd(), OUT_HTML)} — ${issues.length} issues embedded.`
);
console.log(`Wrote ${path.relative(process.cwd(), APP_MARKER)} (fullscreen-app marker).`);
