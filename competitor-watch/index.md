---
title: Competitor Watch
created: '2026-08-15T00:00:00.000Z'
modified: '2026-08-15T00:00:00.000Z'
tags:
  - competitive-intelligence
  - research
  - product
order: 1
---
# Competitor Watch

A self-running competitor watch for **your product**. Every morning the [[.agents/competitor-scout]] visits each rival's website, pricing page, changelog, news, and social, writes a **dated snapshot report**, compares it to the previous one, and records exactly **what changed**. The [[dashboard]] turns all of that into a glanceable UI: where each competitor stands today, the archive of past reports, and a live "What changed" feed.

Competitive intel usually rots in a stale slide deck. Here it is a **daily forcing function** owned by an agent, and every observation lands as a real file you can open, diff, and forward.

## The example you're looking at

This template ships pre-filled with a worked example so you can see the shape of everything before connecting your own market: **it is October–November 2004, you ship the iPod, and the scout is watching five MP3-player rivals** — Creative's Zen line, Sony's Network Walkman, Rio, the Dell DJ, and iRiver.

Every example file is historical fiction built on real 2004 events (Creative's "$100M war on the iPod", the Rio Carbon, Sony's ATRAC-only stumble). Example files are prefixed `EXAMPLE-`, and the dashboard says clearly that it is showing the example. Your first real scan replaces all of it.

## How it works

1. **Scan** — the `competitor-scout` runs daily at 08:00 via the `daily-competitor-scan` job. For each folder under `competitors/` it reads the tracked surfaces: positioning, pricing, product, blog, changelog/docs, news, and social.
2. **Report** — it writes `competitors/<slug>/YYYY-MM-DD.md`, a structured snapshot with sources.
3. **Diff** — it compares the new snapshot to the previous one and classifies each change (pricing / product / messaging / news / funding…) as major, minor, or info.
4. **Publish** — it rewrites `dashboard/data.js`, so the [[dashboard]] always shows the current summaries and the "What changed" feed.
5. **Log** — it appends one line to the **Scan log** at the bottom of this page.

## Make it yours

**Step 1.** Decide your product's name and the 3–8 competitors that actually matter to it.

**Step 2.** Open the AI panel on this page, paste the prompt below, fill in the two placeholders, and run it.

```
You are the Competitor Scout for this Competitor Watch cabinet.

My product: <YOUR PRODUCT — one line on what it is and who it's for>
My competitors: <LIST — name + homepage URL for each, 3 to 8 of them>

Set the cabinet up for my market:

1. Delete the 2004 iPod example: remove the five example folders under
   `competitors/` (creative-zen, sony-network-walkman, rio, dell-dj, iriver)
   and the EXAMPLE scan-log lines at the bottom of index.md.
2. For each of my competitors, create `competitors/<slug>/index.md` — the
   durable profile: who they are, where my product differs, what to watch.
   Research the real current facts with WebFetch/WebSearch; never invent.
3. Rewrite the "Who we track" table below with my roster.
4. Rewrite `dashboard/data.js` (keep it a valid `window.__CI_DATA__ = {...};`
   assignment, same schema, and remove the `_note` example banner) with a
   baseline entry per competitor, and set `product` to my product's name.
5. Run the first full scan: today's snapshot for every competitor, and a
   baseline line in the Scan log.
```

**Step 3.** From tomorrow, the 08:00 job keeps it fresh on its own. Open the dashboard each morning and read the "What changed" tab in under a minute.

Until you run the bootstrap, the daily job leaves the example alone and reminds you it is still showing 2004.

## Who we track (the example roster)

| Competitor | What they are | Why they matter to the iPod |
|---|---|---|
| [[competitors/creative-zen]] | Creative's Zen / NOMAD player line | The self-declared challenger — just pledged $100M to "the MP3 war" |
| [[competitors/sony-network-walkman]] | Sony's hard-disk Walkman + Connect store | The brand that owned portable audio for 25 years, betting on ATRAC |
| [[competitors/rio]] | Rio's flash and microdrive players | The Rio Carbon undercuts iPod mini on size and battery |
| [[competitors/dell-dj]] | Dell's Digital Jukebox | Wins on price and Dell's direct channel, not on design |
| [[competitors/iriver]] | iRiver's flash/HDD players | The spec-sheet champion, now allied with MSN Music |

## The team

- **[[.agents/competitor-scout]]** — Competitor Scout. Runs the daily scan, writes the reports, diffs them, and keeps the dashboard fresh. It doesn't set strategy — it reports what's true and flags what moved.

## What's inside

- **Dashboard** — the one page: your product's hero card at the top, overview cards per competitor (with product images from `dashboard/img/`), and the "What changed" feed. Reads `dashboard/data.js`.
- **`competitors/<slug>/`** — one folder per rival: `index.md` (the durable profile) plus dated snapshot reports.
- **Daily Competitor Scan** — the one routine, 08:00 every day.

## Scan log

- **EXAMPLE 2004-10-25** — Baseline established for all five competitors. Notable at baseline: Sony's NW-HD1 still ships without native MP3 playback, the Rio Carbon (5GB, $249) is drawing "thinner than iPod mini" reviews, and Dell has quietly cut the DJ 20 to $249. _— competitor-scout_
- **EXAMPLE 2004-11-16** — Loudest scan of the quarter. **Creative declared a "$100M MP3 war" on the iPod** (Sim Wong Hoo, Nov 16 press event) and put the Zen Micro (5GB, 10 colours, $249) at the centre of it — booked **major** (messaging + product). **MSN Music left beta** (Nov 11), lighting up the PlaysForSure side of the market — booked **major** (news) against iRiver and Dell, which both lean on it. Sony, Rio: no material change (Sony's rumoured MP3-native firmware for the NW-HD1 still unannounced — carried as "watch"). _— competitor-scout_
