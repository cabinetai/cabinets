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
  ['access-approval',        'approval-packet'],
  ['account-room',           'account-room'],
  ['ad-performance',         'ads-dashboard'],
  ['ae-csm-handoff',         'handoff-packet'],
  ['agency',                 'dashboard'],
  ['ai-hero',                'dashboard'],
  ['app-directory',          'directory'],
  ['architecture-decision',  'adr-library'],
  ['biology-experiments',    'miller-urey'],
  ['board-finance',          'packet'],
  ['board-memo',             'board-report'],
  ['brand-hub',              'brand-hub'],
  ['budget-variance',        'dashboard'],
  ['bug-escalation',         'escalation-packet'],
  ['bug-triage',             'triage-board'],
  ['campaign-launch',        'campaign-room'],
  ['candidate-packet',       'candidate-view'],
  ['career-ops',             'pipeline'],
  ['ceo-operating',          'dashboard'],
  ['change-management',      'change-packet'],
  ['clause-library',         'library'],
  ['company-brain',          'hub'],
  ['competitive-intelligence','dashboard'],
  ['competitive-marketing',  'competitive-brief'],
  ['compliance-evidence',    'evidence-map'],
  ['content-calendar',       'calendar'],
  ['content-creator',        'content-calendar'],
  ['contract-intelligence',  'intelligence'],
  ['contract-renewal',       'timeline'],
  ['cooking',                'recipe-tonight'],
  ['customer-escalation',    'packet'],
  ['customer-health',        'dashboard'],
  ['data-request',           'queue'],
  ['decision-log',           'register'],
  ['ecommerce',              'dashboard'],
  ['employee-offboarding',   'offboarding-room'],
  ['engineering-status',     'dashboard'],
  ['experiment-review',      'readout'],
  ['feature-request',        'board'],
  ['finance-memo',           'memo'],
  ['fitness',                'strength-console'],
  ['help-center',            'content-workspace'],
  ['hiring-pipeline',        'pipeline-dashboard'],
  ['hr-policy-assistant',    'policy-hub'],
  ['incident-postmortem',    'report'],
  ['internal-faq',           'hub'],
  ['investor-update',        'update-letter'],
  ['it-request',             'queue'],
  ['job-hunt-hq',            'pipeline'],
  ['keto-hq',                'macro-day'],
  ['kpi-narrative',          'dashboard'],
  ['leadership-meeting',     'meeting-hub'],
  ['legal-request',          'queue'],
  ['manager-one-on-one',     'one-on-one-room'],
  ['meeting-memory',         'log'],
  ['metrics-definition',     'glossary'],
  ['mom-command',            'mission-control'],
  ['music-factory',          'factory'],
  ['new-hire-onboarding',    'onboarding-room'],
  ['newborn',                'survival-tracker'],
  ['office-ops',             'tracker'],
  ['okr-command',            'board'],
  ['performance-review',     'review-packet'],
  ['personal-os',            'daily-console'],
  ['physics-101',            'course'],
  ['physics-experiments',    'pendulum-wave'],
  ['pipeline-risk',          'pipeline-board'],
  ['prd-builder',            'prd'],
  ['procurement-intake',     'approval-packet'],
  ['product-launch',         'launch-room'],
  ['proposal-rfp',           'rfp-workspace'],
  ['qbr-generator',          'report'],
  ['reading-room',           'book-wall'],
  ['real-estate',            'dashboard'],
  ['release-notes',          'changelog'],
  ['renewal-risk',           'board'],
  ['risk-register',          'risk-dashboard'],
  ['roadmap',                'roadmap'],
  ['saas-startup',           'dashboard'],
  ['sales-battlecard',       'battlecard-viewer'],
  ['sales-call-prep',        'call-prep'],
  ['security-questionnaire', 'questionnaire-workspace'],
  ['seo-content',            'seo-workspace'],
  ['spend-policy',           'hub'],
  ['sprint-planning',        'board'],
  ['strategic-initiative',   'room'],
  ['support-intelligence',   'dashboard'],
  ['support-macro',          'macro-library'],
  ['team-wiki',              'wiki'],
  ['universal-request',      'queue'],
  ['usa-travel-planner',     'parks-map'],
  ['vendor-asset',           'inventory'],
  ['vendor-renewal',         'dashboard'],
  ['vendor-security-review', 'review-workspace'],
  ['venture-capital',        'portfolio-dashboard'],
  ['voice-of-customer',      'dashboard'],
  ['weekly-business-review', 'review'],
];

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

let done = 0, failed = 0;
for (const [slug, subpath] of targets) {
  const filePath = path.join(CABINETS, slug, subpath, 'index.html');
  const url = `file://${filePath}`;
  const dest = path.join(OUT, `${slug}.jpg`);
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 600)); // let animations settle
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
