#!/usr/bin/env node
// The daily sweep. Fully deterministic — no LLM call inside this script — so
// running it costs nothing but network and disk. It fetches each tracked
// page, diffs it against the last time it was checked, captures a screenshot,
// and writes a compact digest for the weekly job to read. The agent's job is
// to run this, then reason over .evidence/<date>-digest.json, not to re-fetch
// pages itself.
//
// Usage: node .scripts/sweep.mjs   (run with the cabinet root as cwd)

import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { htmlToText, textHash } from "./lib/html.mjs";
import { summarizeDiff } from "./lib/diff.mjs";
import { screenshot, findChrome } from "./lib/chrome.mjs";
import { readRoster, dueToday, pagesOf } from "./lib/roster.mjs";

const FETCH_TIMEOUT_MS = 15000;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

function todayISO(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": UA, accept: "text/html,*/*" },
      redirect: "follow",
    });
    if (!res.ok) return { ok: false, reason: `http-${res.status}` };
    const html = await res.text();
    return { ok: true, text: htmlToText(html) };
  } catch (error) {
    const reason = error.name === "AbortError" ? "timeout" : String(error.message ?? error).slice(0, 120);
    return { ok: false, reason };
  } finally {
    clearTimeout(timer);
  }
}

function statePathFor(slug, kind) {
  return path.join(process.cwd(), ".cabinet-state", "scout", slug, `${kind}.json`);
}

async function readState(slug, kind) {
  try {
    return JSON.parse(await readFile(statePathFor(slug, kind), "utf-8"));
  } catch {
    return null;
  }
}

async function writeState(slug, kind, state) {
  const p = statePathFor(slug, kind);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(state, null, 2));
}

async function appendSignalLines(date, lines) {
  if (!lines.length) return;
  const logPath = path.join(process.cwd(), ".signals", "log.md");
  const exists = existsSync(logPath);
  const current = exists ? await readFile(logPath, "utf-8") : "";
  const body = `${lines.map((l) => `- ${l}`).join("\n")}\n`;
  // A second sweep on the same day (a manual re-run) appends under the
  // existing heading rather than opening a duplicate one.
  const needsHeading = !current.includes(`## ${date}\n`);
  const prefix = exists ? "" : "# Signal Log\n";
  const heading = needsHeading ? `\n## ${date}\n` : "";
  await appendFile(logPath, `${prefix}${heading}${body}`);
}

async function sweepCompetitor(competitor, date, chromeAvailable) {
  const pages = pagesOf(competitor);
  const results = [];
  const signalLines = [];
  for (const { kind, url } of pages) {
    const fetched = await fetchText(url);
    if (!fetched.ok) {
      results.push({ kind, url, reachable: false, reason: fetched.reason });
      signalLines.push(`${date} | ${competitor.name} | ${kind} | unreachable (${fetched.reason}) | ${url} | —`);
      continue;
    }
    const hash = await textHash(fetched.text);
    const previous = await readState(competitor.slug, kind);
    const changed = !previous || previous.hash !== hash;
    let diffSummary = null;
    if (changed && previous) {
      diffSummary = summarizeDiff(previous.text ?? "", fetched.text);
    }

    let screenshotPath = null;
    let screenshotSkippedReason = chromeAvailable ? null : "chrome-not-found";
    if (chromeAvailable) {
      const dir = path.join(process.cwd(), ".evidence", competitor.slug, date);
      await mkdir(dir, { recursive: true });
      const outPath = path.join(dir, `${kind}.png`);
      const shot = await screenshot(url, outPath);
      if (shot.ok) {
        screenshotPath = path.relative(process.cwd(), outPath);
      } else {
        screenshotSkippedReason = shot.reason;
      }
    }

    await writeState(competitor.slug, kind, {
      hash,
      text: fetched.text.slice(0, 20000), // enough to diff against next time, not a full mirror
      checkedAt: new Date().toISOString(),
      screenshot: screenshotPath,
    });

    results.push({
      kind,
      url,
      reachable: true,
      changed,
      baseline: !previous,
      diffSummary,
      screenshot: screenshotPath,
      screenshotSkippedReason,
      // A hint for the weekly synthesis pass, not a verdict: pricing/changelog
      // changes are worth a second look more often than a blog rewrite.
      likelyNotable: changed && !!previous && (kind === "pricing" || kind === "changelog"),
    });

    if (!previous) {
      signalLines.push(`${date} | ${competitor.name} | ${kind} | baseline captured | ${url} | ${screenshotPath ?? "—"}`);
    } else if (changed) {
      const d = diffSummary;
      signalLines.push(
        `${date} | ${competitor.name} | ${kind} | changed (+${d.addedCount}/-${d.removedCount} lines) | ${url} | ${screenshotPath ?? "—"}`,
      );
    } else {
      signalLines.push(`${date} | ${competitor.name} | ${kind} | no change | ${url} | —`);
    }
  }
  return { slug: competitor.slug, name: competitor.name, tier: competitor.tier, pages: results, signalLines };
}

async function main() {
  const date = todayISO();
  const roster = await readRoster();
  if (roster.length === 0) {
    console.log("No competitors tracked yet (competitors/.roster.json is empty). Nothing to sweep.");
    return;
  }
  const due = dueToday(roster);
  if (due.length === 0) {
    console.log("Nothing due today (Tier 2 only sweeps on Mondays).");
    return;
  }

  const chromePath = findChrome();
  const chromeAvailable = !!chromePath;
  if (!chromeAvailable) {
    console.log("Chrome/Chromium not found — sweeping text only, no screenshots this run.");
  }

  const competitors = [];
  const allSignalLines = [];
  for (const competitor of due) {
    const result = await sweepCompetitor(competitor, date, chromeAvailable);
    competitors.push(result);
    allSignalLines.push(...result.signalLines);
  }

  await appendSignalLines(date, allSignalLines);

  const digest = {
    date,
    chromeAvailable,
    generatedAt: new Date().toISOString(),
    competitors: competitors.map(({ signalLines: _signalLines, ...rest }) => rest),
  };
  const digestDir = path.join(process.cwd(), ".evidence");
  await mkdir(digestDir, { recursive: true });
  await writeFile(path.join(digestDir, `${date}-digest.json`), JSON.stringify(digest, null, 2));

  const changedCount = competitors.reduce(
    (n, c) => n + c.pages.filter((p) => p.reachable && p.changed && !p.baseline).length,
    0,
  );
  const unreachableCount = competitors.reduce((n, c) => n + c.pages.filter((p) => !p.reachable).length, 0);
  console.log(
    `Swept ${competitors.length} competitor(s), ${changedCount} page(s) changed, ${unreachableCount} unreachable. Digest: .evidence/${date}-digest.json`,
  );
}

main().catch((error) => {
  console.error(`sweep.mjs failed: ${error.stack ?? error}`);
  process.exitCode = 1;
});
