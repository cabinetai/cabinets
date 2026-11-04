/**
 * Batch screenshot tool for Cabinet example pages.
 * Uses playwright (auto-installs chromium) to open each cabinet app page
 * and save a 1440×900 JPEG to public/screenshots/<slug>.jpg
 *
 * Usage:
 *   node scripts/take-screenshots.mjs              # all remaining (no cover)
 *   node scripts/take-screenshots.mjs --force      # overwrite existing
 *   node scripts/take-screenshots.mjs access-approval agency  # specific slugs
 */

import puppeteer from '../.github/scripts/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CABINETS = path.join(__dirname, '..');
const OUT  = path.join(__dirname, '..', 'public', 'screenshots');
const W = 1440, H = 900;

const SHOTS = [
  ['agency',                 'dashboard'],
  ['ai-hero',                'dashboard'],
  ['biology-experiments',    'miller-urey'],
  ['career-ops',             'pipeline'],
  ['competitive-intelligence','dashboard'],
  ['content-creator',        'content-calendar'],
  ['cooking',                'recipe-tonight'],
  ['ecommerce',              'dashboard'],
  ['fitness',                'strength-console'],
  ['job-hunt-hq',            'pipeline'],
  ['keto-hq',                'macro-day'],
  ['mom-command',            'mission-control'],
  ['music-factory',          'factory'],
  ['newborn',                'survival-tracker'],
  ['personal-os',            'daily-console'],
  ['physics-101',            'course'],
  ['physics-experiments',    'pendulum-wave'],
  ['reading-room',           'book-wall'],
  ['real-estate',            'dashboard'],
  ['saas-startup',           'dashboard'],
  ['text-your-mom',          'app-development/sprint-board'],
  ['usa-travel-planner',     'parks-map'],
];

// Auto-discover cabinets not in the hardcoded list via their <slug>/<app>/.app markers.
// ponytail: first .app dir alphabetically; add an explicit SHOTS entry to override.
const known = new Set(SHOTS.map(([s]) => s));
for (const slug of fs.readdirSync(CABINETS).sort()) {
  if (known.has(slug) || !fs.existsSync(path.join(CABINETS, slug, '.cabinet'))) continue;
  const apps = fs.readdirSync(path.join(CABINETS, slug), { withFileTypes: true })
    .filter(d => d.isDirectory() && fs.existsSync(path.join(CABINETS, slug, d.name, '.app')))
    .map(d => d.name).sort();
  if (apps.length > 0) SHOTS.push([slug, apps[0]]);
}

const args = process.argv.slice(2);
const force = args.includes('--force');
const slugFilter = args.filter(a => !a.startsWith('--'));

fs.mkdirSync(OUT, { recursive: true });

let targets = SHOTS;
if (slugFilter.length > 0) {
  targets = SHOTS.filter(([slug]) => slugFilter.includes(slug));
}
if (!force) {
  targets = targets.filter(([slug]) => {
    const exists = fs.existsSync(path.join(OUT, `${slug}.jpg`)) ||
                   fs.existsSync(path.join(OUT, `${slug}.jpeg`));
    if (exists) console.log(`⏭️  ${slug} (exists)`);
    return !exists;
  });
}

if (targets.length === 0) {
  console.log('Nothing to do.');
  process.exit(0);
}

console.log(`\n📸 ${targets.length} screenshots to take at ${W}×${H}\n`);

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: W, height: H });
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);

let done = 0, failed = 0;
for (const [slug, subpath] of targets) {
  // ponytail: apps fetch their data dirs over HTTP, so file:// renders empty.
  // Serve through the Cabinet dev server (SHOT_BASE_URL) when it's running.
  const base = process.env.SHOT_BASE_URL;
  const url = base
    ? `${base}/${slug}/${subpath}/index.html`
    : `file://${path.join(CABINETS, slug, subpath, 'index.html')}`;
  const dest = path.join(OUT, `${slug}.jpg`);
  try {
    await page.goto(url, { waitUntil: base ? 'domcontentloaded' : 'networkidle2', timeout: 20000 });
    if (base) {
      // Apps load their data via the Cabinet server's /api/tree (~7s) — wait out the spinner.
      try { await page.waitForFunction(() => !/Loading|Reading the|Fetching|Walking the/.test(document.body.innerText), { timeout: 40000 }); } catch {}
    }
    await new Promise(r => setTimeout(r, 800)); // let animations settle
    await page.screenshot({ path: dest, type: 'jpeg', quality: 90 });
    const kb = Math.round(fs.statSync(dest).size / 1024);
    console.log(`  ✅ ${slug} (${kb}KB)`);
    done++;
  } catch (e) {
    console.error(`  ❌ ${slug}: ${e.message.split('\n')[0]}`);
    failed++;
  }
}

await browser.close();
console.log(`\n✅ Done. ${done} saved, ${failed} failed.\n`);
