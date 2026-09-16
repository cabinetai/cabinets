// Zero-dependency Chrome/Chromium driver: shells out to a locally installed
// browser's own headless flags for a screenshot or a print-to-PDF. No
// Playwright/Puppeteer install required. Every export resolves to
// { ok: false, reason } instead of throwing when Chrome isn't found or a
// capture fails — a blocked capture is a finding, not a crash (see
// ../../.agents/competitor-scout/persona.md).

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const CANDIDATES = {
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  ],
  linux: [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
  ],
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ],
};

let cachedPath; // undefined = not looked up yet, null = looked up, not found

/** Finds a local Chrome/Chromium binary. Checks CABINET_CHROME_PATH first,
 *  then the usual per-OS install locations. Result is cached per process. */
export function findChrome() {
  if (cachedPath !== undefined) return cachedPath;
  const override = process.env.CABINET_CHROME_PATH;
  if (override && existsSync(override)) {
    cachedPath = override;
    return cachedPath;
  }
  const candidates = CANDIDATES[process.platform] ?? [];
  cachedPath = candidates.find((p) => existsSync(p)) ?? null;
  return cachedPath;
}

const DEFAULT_ARGS = [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-sandbox", // headless render sandbox is redundant with the OS sandbox here; no persistent profile is touched
];

/**
 * Captures the top of a page at a tall viewport. This is a deliberate
 * tradeoff of the zero-dependency approach: Chrome's CLI --screenshot flag
 * captures the viewport, not a true scrolling full-page shot (that needs the
 * DevTools protocol, i.e. Playwright/Puppeteer). A 1440x2600 viewport covers
 * the hero + first fold of most pricing/marketing pages, which is what a
 * competitor snapshot actually needs.
 */
export async function screenshot(url, outPath, { width = 1440, height = 2600, timeoutMs = 30000 } = {}) {
  const chrome = findChrome();
  if (!chrome) return { ok: false, reason: "chrome-not-found" };
  try {
    await execFileAsync(
      chrome,
      [...DEFAULT_ARGS, `--window-size=${width},${height}`, `--screenshot=${outPath}`, url],
      { timeout: timeoutMs },
    );
    return existsSync(outPath) ? { ok: true, path: outPath } : { ok: false, reason: "no-output" };
  } catch (error) {
    return { ok: false, reason: `chrome-error: ${String(error.message ?? error).slice(0, 200)}` };
  }
}

/** Prints an already-rendered local HTML file to PDF via Chrome's own print
 *  pipeline (proper pagination, unlike --screenshot). */
export async function printPdf(htmlPath, outPath, { timeoutMs = 30000 } = {}) {
  const chrome = findChrome();
  if (!chrome) return { ok: false, reason: "chrome-not-found" };
  try {
    await execFileAsync(
      chrome,
      [
        ...DEFAULT_ARGS,
        "--no-pdf-header-footer",
        "--print-to-pdf-no-header",
        `--print-to-pdf=${outPath}`,
        `file://${htmlPath}`,
      ],
      { timeout: timeoutMs },
    );
    return existsSync(outPath) ? { ok: true, path: outPath } : { ok: false, reason: "no-output" };
  } catch (error) {
    return { ok: false, reason: `chrome-error: ${String(error.message ?? error).slice(0, 200)}` };
  }
}
