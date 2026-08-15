#!/usr/bin/env node
// Compose integration covers: shared wood panel + the real integration logo
// (engraved-card look from the Cabinet home page). Logos come from
// cabinet-website/public/{logos,providers}, simple-icons, or git-extracted marks.
// Usage: node scripts/compose-logo-covers.mjs [slug ...]   (default: all)

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import * as si from 'simple-icons';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const WOOD = path.join(__dirname, 'wood-panel-cream.jpg');
const WEB = '/Users/mybiblepath/Development/cabinet-website/public';
const APP = '/Users/mybiblepath/Development/cabinet/public'; // the Cabinet app — source of truth for connectors-page logos

const file = (p) => ({ type: 'file', p: path.join(WEB, p) });
const app = (p) => ({ type: 'file', p: path.join(APP, p) });
const icon = (k) => ({ type: 'si', k });
const git = (rev, p) => ({ type: 'git', rev, p });

const LOGOS = {
  'asana-tasks': app('logos/asana.webp'),
  'backblaze-b2-contents': icon('siBackblaze'),
  'chrome-site-check': icon('siGooglechrome'),
  'claude-code-style': file('providers/claude.svg'),
  'cloudflare-r2-contents': icon('siCloudflare'),
  'codex-style': file('providers/openai.svg'),
  'confluence-digest': app('logos/confluence.svg'),
  'digitalocean-spaces-contents': icon('siDigitalocean'),
  'discord-digest': app('integrations/discord-logo.png'),
  'figma-week': app('logos/figma.svg'),
  'gemini-cli-style': file('providers/gemini.svg'),
  'github-dev-brief': app('logos/github.svg'),
  'gitlab-dev-brief': app('logos/gitlab.webp'),
  'gmail-inbox': app('logos/gmail.svg'),
  'google-ads-brief': app('logos/google-ads.svg'),
  'google-calendar-week': app('logos/google-calendar.svg'),
  'google-cloud-storage-contents': icon('siGooglecloud'),
  'higgsfield-studio': git('2d50d4a', 'higgsfield-studio/gallery/index.html'),
  'jira-tasks': app('logos/jira.webp'),
  'linear-cycle': app('logos/linear.webp'),
  'mailchimp-delivery': icon('siMailchimp'),
  'meta-ads-brief': app('logos/facebook.svg'),
  'microsoft-365-brief': app('logos/microsoft-365.svg'),
  'monday-tasks': app('logos/monday.svg'),
  'notion-library': app('logos/notion.svg'),
  'notion-project-status': app('logos/notion.svg'),
  'obsidian-kb': icon('siObsidian'),
  'openai-image-studio': file('providers/openai.svg'),
  'safari-site-check': icon('siSafari'),
  'sharepoint-week': app('logos/sharepoint.svg'),
  'slack-digest': app('logos/slack.svg'),
  'stackadapt-brief': app('logos/stackadapt.svg'),
  'snowflake-brief': app('logos/snowflake.webp'),
  'stripe-daily': app('logos/stripe.svg'),
  'teams-digest': app('logos/microsoft-teams.svg'),
  'telegram-digest': app('logos/telegram.svg'),
  'tiktok-queue': app('logos/tiktok.svg'),
  'wasabi-contents': icon('siWasabi'),
  'whatsapp-digest': icon('siWhatsapp'),
  'x-mentions': app('logos/x.svg'),
};
// ponytail: aws-s3, brightdata, playwright, tavily have no
// legitimate logo source — they keep their wooden-object covers.

function svgFor(spec) {
  if (spec.type === 'file') return fs.readFileSync(spec.p);
  if (spec.type === 'si') {
    const ic = si[spec.k];
    if (!ic) throw new Error(`simple-icons missing ${spec.k}`);
    return Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#${ic.hex}" d="${ic.path}"/></svg>`
    );
  }
  if (spec.type === 'git') {
    const html = execSync(`git -C ${ROOT} show ${spec.rev}:${spec.p}`, { encoding: 'utf8', maxBuffer: 8e6 });
    const m = html.match(/<svg\s[^>]*viewBox[\s\S]*?<\/svg>/);
    if (!m) throw new Error(`no <svg> in ${spec.p}`);
    return Buffer.from(m[0].replace(/ class="[^"]*"/, '').replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'));
  }
}

const W = 1200, HGT = 630;
// The app-card look: the exact logo, centered, sitting directly on the wood
// with a soft inlay shadow. No plaque, no frame.
const LOGO_MAX_W = 420, LOGO_MAX_H = 300;

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(LOGOS);
const woodBase = await sharp(WOOD).resize(W, HGT).toBuffer();

let ok = 0, fail = 0;
for (const slug of slugs) {
  try {
    const logo = await sharp(svgFor(LOGOS[slug]), { density: 300 })
      .resize({ width: LOGO_MAX_W, height: LOGO_MAX_H, fit: 'inside' })
      .png().toBuffer();
    const meta = await sharp(logo).metadata();
    const alpha = await sharp(logo).ensureAlpha().extractChannel(3).blur(5).linear(0.4, 0).toBuffer();
    const shadow = await sharp({ create: { width: meta.width, height: meta.height, channels: 3, background: '#2A1F14' } })
      .joinChannel(alpha).png().toBuffer();
    const lx = Math.round((W - meta.width) / 2);
    const ly = Math.round((HGT - meta.height) / 2);
    await sharp(woodBase)
      .composite([
        { input: shadow, left: lx + 4, top: ly + 8 },
        { input: logo, left: lx, top: ly },
      ])
      .jpeg({ quality: 88, progressive: true })
      .toFile(path.join(ROOT, slug, 'cover.jpg'));
    const kb = Math.round(fs.statSync(path.join(ROOT, slug, 'cover.jpg')).size / 1024);
    console.log(`\u2705 ${slug} (${kb}KB)`);
    ok++;
  } catch (e) {
    console.error(`\u274c ${slug}: ${e.message.split('\n')[0]}`);
    fail++;
  }
}
console.log(`Done. ${ok} composed, ${fail} failed.`);
