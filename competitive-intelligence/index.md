---
title: Competitive Intelligence
created: '2026-05-23T00:00:00Z'
modified: '2026-09-16T00:00:00Z'
tags:
  - competitive-intelligence
  - market-intelligence
  - battlecards
  - cabinet
order: 1
---
# Competitive Intelligence

An always-on competitor watch that starts **completely empty**. One agent, Competitor
Scout, asks who to track, then a set of scripts does the daily capture (text and
screenshots) for free, and the agent spends its judgment on one thing: turning a week of
sourced evidence into a **weekly PDF briefing** you can open, forward, or have emailed to
you automatically.

> **Keep your CRM, your BI, your Slack.** Replace the competitor spreadsheet nobody
> updates, the battlecards that go stale, and the "what did they just ship?" fire drill
> before every deal.

## Why this cabinet is built the way it is

Most competitive-intel tools either cost a fortune in API calls (an LLM re-reading full
competitor pages every day) or ship full of fake demo data that has to be torn out before
it's useful. This cabinet does neither:

- **It ships empty.** No placeholder competitors, no fabricated pricing tables. The first
  thing Competitor Scout does is ask who you actually want tracked.
- **Plain automation does the expensive part for free.** Fetching pages, diffing them
  against yesterday, taking screenshots, and rendering the HTML/PDF report cost zero LLM
  tokens. The agent only reads a compact summary of what changed and writes the one thing
  automation can't: what it means for you.
- **No social-media API required.** Every source is a public page — homepage, pricing,
  changelog, blog, careers. Screenshots come from a locally installed Chrome running
  headless, not a paid scraping service.
- **The sidebar stays out of your way.** Everything this cabinet needs to run day to day
  is tucked out of sight. What you see is [[competitors/index]], [[dashboard]], and
  [[briefing]] — the things you'd actually want to open.

## The team

- **[[.agents/competitor-scout]]** — Competitor Scout. Onboards you, runs the scripted
  daily sweep, decides what's material, and ships the weekly briefing. One agent, because
  most of the work isn't agent work at all.

## Recurring rhythm

| Cadence | Job | What happens |
|---|---|---|
| Weekdays 07:00 | Daily sweep | Fetch, diff, screenshot every due competitor. Pure automation; asks for onboarding details instead if nothing's tracked yet. |
| Monday 08:00 | Weekly report | Agent reads the week's evidence, decides what's material, writes the briefing, renders the PDF, emails it if a recipient is set. |
| 1st of month, 09:00 | Monthly landscape | Compiles the month's weekly briefings into a board-grade landscape review. Cheap: it reads already-synthesized material, not raw pages. |

## Get started

1. Open the [[dashboard]] — empty right now. It fills in after the first sweep.
2. Tell Competitor Scout who to track. Message it in chat with your company and a few
   competitor names.
3. Optionally tell it who should get the weekly PDF by email. Without a recipient, the
   report still gets written; you just open or forward it yourself.
4. From there it runs itself. Check back on the [[dashboard]] for the glanceable view, or
   open [[briefing]] for the latest report.

## Connectors

**Optional:** Gmail (`better-with`, `send` only) — emails the weekly PDF to whoever's
configured. Everything else in this cabinet works with zero connectors: public web pages
and a local Chrome install are all the capture step needs.
