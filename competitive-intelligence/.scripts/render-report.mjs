#!/usr/bin/env node
// Builds the weekly briefing HTML + PDF from an insights file the agent
// writes (the one place this cabinet spends LLM judgment) plus the roster.
// Everything else here — layout, styling, pagination — is deterministic, so
// re-running this script costs nothing. It never invents content: a missing
// section in insights.json just renders as an empty state, it doesn't get
// filled in by the script.
//
// Usage: node .scripts/render-report.mjs <path-to-insights.json>

import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { printPdf } from "./lib/chrome.mjs";
import { readRoster } from "./lib/roster.mjs";

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

function card(title, bodyHtml, { empty } = {}) {
  return `
  <section class="card">
    <h2>${escapeHtml(title)}</h2>
    ${bodyHtml || `<p class="empty">${escapeHtml(empty ?? "Nothing to report.")}</p>`}
  </section>`;
}

function materialMoveHtml(move) {
  const shot = move.screenshot
    ? `<img class="thumb" src="../../${escapeHtml(move.screenshot)}" alt="${escapeHtml(move.competitor)} ${escapeHtml(move.type)} evidence" />`
    : "";
  return `
    <article class="move">
      ${shot}
      <div class="move-body">
        <div class="move-head">
          <span class="tag">${escapeHtml(move.type ?? "")}</span>
          <strong>${escapeHtml(move.competitor)}</strong>
        </div>
        <p class="what">${escapeHtml(move.what)}</p>
        <p class="implication">${escapeHtml(move.implication)}</p>
        ${move.sourceUrl ? `<a class="source" href="${escapeHtml(move.sourceUrl)}">source →</a>` : ""}
      </div>
    </article>`;
}

function pricingRowHtml(row) {
  return `<tr><td>${escapeHtml(row.competitor)}</td><td>${escapeHtml(row.tier)}</td><td>${escapeHtml(row.theirPrice)}</td><td>${escapeHtml(row.ourPrice)}</td><td class="delta">${escapeHtml(row.delta)}</td></tr>`;
}

function buildHtml(insights, roster) {
  const trackedCount = roster.length;
  const materialMoves = insights.materialMoves ?? [];
  const pricingWatch = insights.pricingWatch ?? [];
  const battlecardChanges = insights.battlecardChanges ?? [];
  const watchlist = insights.watchlist ?? [];
  const unreachable = insights.unreachable ?? [];

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(insights.companyName || "Competitive Intelligence")} — Weekly Briefing — ${escapeHtml(insights.date)}</title>
<style>
  :root{
    color-scheme: light dark;
    --bg:#f5f5f7; --panel:#ffffff; --line:rgba(0,0,0,.07);
    --ink:#1d1d1f; --ink-2:#6e6e73; --ink-3:#86868b; --accent:#0071e3; --accent-soft:rgba(0,113,227,.1);
    --radius:18px; --shadow:0 1px 2px rgba(0,0,0,.04), 0 6px 20px rgba(0,0,0,.05);
  }
  @media (prefers-color-scheme: dark){
    :root{
      --bg:#000; --panel:#1c1c1e; --line:rgba(255,255,255,.1);
      --ink:#f5f5f7; --ink-2:#98989d; --ink-3:#8e8e93; --accent:#0a84ff; --accent-soft:rgba(10,132,255,.16);
      --shadow:0 1px 2px rgba(0,0,0,.3), 0 6px 20px rgba(0,0,0,.4);
    }
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);
    font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",Helvetica,Arial,sans-serif;
    font-size:14.5px;line-height:1.5;-webkit-font-smoothing:antialiased}
  h1,h2,h3{margin:0;letter-spacing:-.015em}
  .wrap{max-width:820px;margin:0 auto;padding:40px 28px 70px}
  header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;flex-wrap:wrap;gap:8px}
  header h1{font-size:25px;font-weight:700}
  header .date{color:var(--ink-3);font-size:13px}
  .sub{color:var(--ink-2);font-size:13.5px;margin-bottom:24px}
  .headline{background:var(--panel);border-left:4px solid var(--accent);border-radius:var(--radius);
    padding:16px 20px;margin-bottom:24px;font-size:15px;box-shadow:var(--shadow)}
  .headline b{color:var(--accent);font-weight:600}
  .card{background:var(--panel);border-radius:var(--radius);
    padding:20px 22px;margin-bottom:16px;box-shadow:var(--shadow);break-inside:avoid;page-break-inside:avoid}
  .card h2{font-size:12.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-3);
    font-weight:650;margin-bottom:14px}
  .empty{color:var(--ink-3);margin:0}
  .move{display:flex;gap:14px;padding:13px 0;border-top:1px solid var(--line)}
  .move:first-child{border-top:0;padding-top:0}
  .thumb{width:120px;height:80px;object-fit:cover;object-position:top;border-radius:10px;flex:none}
  .move-head{display:flex;gap:8px;align-items:center;margin-bottom:4px}
  .tag{font-size:10.5px;font-weight:650;letter-spacing:.02em;text-transform:uppercase;color:var(--accent);
    background:var(--accent-soft);border-radius:999px;padding:2px 9px}
  .what{margin:0 0 4px;font-weight:600}
  .implication{margin:0 0 4px;color:var(--ink-2)}
  .source{font-size:12.5px;color:var(--accent);text-decoration:none}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th,td{text-align:left;padding:8px 8px;border-bottom:1px solid var(--line)}
  th{color:var(--ink-3);font-size:11px;text-transform:uppercase;letter-spacing:.04em;font-weight:650}
  td.delta{color:var(--accent);font-weight:600}
  ul.flat{margin:0;padding-left:18px}
  ul.flat li{margin-bottom:6px;color:var(--ink-2)}
  .foot{color:var(--ink-3);font-size:11.5px;text-align:center;margin-top:28px}
  @media print{
    :root{ --bg:#fff; --panel:#fff; --ink:#1d1d1f; --ink-2:#6e6e73; --ink-3:#86868b; --accent:#0071e3; --accent-soft:#eaf3fd; --line:rgba(0,0,0,.08) }
    body{background:#fff}
    .card,.headline{box-shadow:none;border:1px solid var(--line)}
    .wrap{padding:0}
  }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>${escapeHtml(insights.companyName || "Competitive Intelligence")} — Weekly Briefing</h1>
    <span class="date">${escapeHtml(insights.date)}</span>
  </header>
  <p class="sub">${trackedCount} competitor${trackedCount === 1 ? "" : "s"} tracked. Generated by Competitor Scout, built from sourced signals only.</p>
  <div class="headline"><b>This week:</b> ${escapeHtml(insights.headline || "No material moves this week.")}</div>

  ${card(
    "Material moves",
    materialMoves.length ? materialMoves.map(materialMoveHtml).join("") : "",
    { empty: "No competitor move this week rose above noise." },
  )}

  ${card(
    "Pricing watch",
    pricingWatch.length
      ? `<table><thead><tr><th>Competitor</th><th>Tier</th><th>Their price</th><th>Our price</th><th>Delta</th></tr></thead><tbody>${pricingWatch.map(pricingRowHtml).join("")}</tbody></table>`
      : "",
    { empty: "No pricing changes this week." },
  )}

  ${card(
    "Battlecard changes",
    battlecardChanges.length
      ? `<ul class="flat">${battlecardChanges.map((c) => `<li><strong>${escapeHtml(c.competitor)}:</strong> ${escapeHtml(c.change)}</li>`).join("")}</ul>`
      : "",
    { empty: "No battlecard needed an update this week." },
  )}

  ${card(
    "Watchlist",
    watchlist.length ? `<ul class="flat">${watchlist.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul>` : "",
    { empty: "Nothing flagged to watch next week." },
  )}

  ${card(
    "Coverage gaps",
    unreachable.length
      ? `<ul class="flat">${unreachable.map((u) => `<li>${escapeHtml(u.competitor)} — ${escapeHtml(u.url)} (${escapeHtml(u.reason)})</li>`).join("")}</ul>`
      : "",
    { empty: "Every tracked page was reachable this week." },
  )}

  <p class="foot">Every claim above links to a captured, dated signal in this cabinet's sourced record.</p>
</div>
</body>
</html>`;
}

async function main() {
  const insightsPath = process.argv[2];
  if (!insightsPath) {
    console.error("Usage: node .scripts/render-report.mjs <path-to-insights.json>");
    process.exitCode = 1;
    return;
  }
  const insights = JSON.parse(await readFile(insightsPath, "utf-8"));
  const roster = await readRoster();
  const html = buildHtml(insights, roster);

  const dateDir = path.join(process.cwd(), "briefing", insights.date);
  await mkdir(dateDir, { recursive: true });
  const htmlPath = path.join(dateDir, "index.html");
  await writeFile(htmlPath, html);

  // "Latest" convenience copy at briefing/index.html — same content, so
  // opening the briefing app always shows the most recent report.
  await copyFile(htmlPath, path.join(process.cwd(), "briefing", "index.html"));

  const pdfPath = path.join(dateDir, "report.pdf");
  const pdf = await printPdf(path.resolve(htmlPath), pdfPath);
  if (pdf.ok) {
    console.log(`Wrote ${htmlPath} and ${pdfPath}`);
  } else {
    console.log(`Wrote ${htmlPath}. PDF skipped: ${pdf.reason}`);
  }
}

main().catch((error) => {
  console.error(`render-report.mjs failed: ${error.stack ?? error}`);
  process.exitCode = 1;
});
