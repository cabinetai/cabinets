---
title: Competitive Intelligence
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags:
  - competitive-intelligence
  - market-intelligence
  - battlecards
  - win-loss
  - enterprise
  - cabinet
order: 1
---
# Competitive Intelligence

The always-on competitor watch for your company. Three agents track every competitor across pricing, product releases, positioning, funding, hiring, and review sites — then turn the noise into a **daily signal scan**, a **weekly competitor briefing**, and a **monthly landscape review**. Every signal, profile, and report is a file you can open, diff, and forward to the deal team.

> **Keep your CRM, your BI, your Slack. Replace the competitor spreadsheet nobody updates, the battlecards that go stale, and the "what did they just ship?" fire drill before every deal.**

## Why this template

Competitive intel in most companies is tribal: a rep hears something on a call, drops it in Slack, it scrolls away. Nobody can answer "what changed in the market this month?" without a week of archaeology. This cabinet makes the competitor watch a **standing operation** with a published cadence — so sales, product, and leadership always have a current, sourced view.

## The team

- **[[.agents/intel-director]]** — Intel Director. Owns the cadence and the published briefings. Decides which competitors are Tier 1, reconciles the Analyst's read against raw signals, and calls what's *material* vs. noise. Doesn't gather data — runs the loop.
- **[[.agents/competitor-analyst]]** — Competitor Analyst. Maintains one living profile per competitor: pricing, packaging, positioning, strengths, weaknesses, recent moves, and the objection-handling battlecard. Turns signals into "so what."
- **[[.agents/signal-scout]]** — Signal Scout. Sweeps the sources every morning — changelogs, pricing pages, blogs, job boards, G2/Capterra reviews, news, social, funding databases — and logs every new signal with a source link.

## Recurring rhythm (the important part)

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Daily** (Mon–Fri 07:00) | [[.jobs/daily-signal-scan]] | Signal Scout | New signals logged to `/signals`, material moves flagged |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-competitor-briefing]] | Analyst → Director | Weekly competitor briefing in [[briefing]] |
| **Monthly** (1st 09:00) | [[.jobs/monthly-landscape-review]] | Intel Director | Full landscape: market map, share-of-voice, win/loss themes, recommendations |
| **Weekly** (Fri 16:00) | [[.jobs/battlecard-refresh]] | Competitor Analyst | Battlecards refreshed against the week's signals |

## How to run the demo

1. Open the [[dashboard]] — the competitive landscape at a glance: threat levels, recent movements, share-of-voice, head-to-head pricing.
2. Open [[briefing]] — this week's competitor briefing, the artifact the weekly job produces.
3. Browse [[competitors/index]] — the tracked competitor set, each with a living profile and battlecard.
4. Skim [[signals/index]] — the raw signal log the Scout appends to every morning. The briefing is built from this.

## Connectors

**Required:** Web pages (changelogs, pricing, blogs, news), Google Drive (past battlecards / win-loss notes).
**Recommended:** Salesforce or HubSpot (win/loss reasons, competitor field), Gong (competitor mentions on calls), Slack (`#competition` channel feed), G2 / Capterra (reviews), Crunchbase / news (funding & M&A), LinkedIn (hiring signals).

**Keep your systems of record.** This cabinet reads from them and replaces the manual battlecard, the stale competitor sheet, and the weekly "anyone know what X just launched?" thread.

## Tracked competitors (demo data)

| Competitor | Tier | Threat | Profile |
|---|---|---|---|
| Northwind | 1 | Rising | [[competitors/northwind]] |
| Helios | 1 | Steady | [[competitors/helios]] |
| Cobalt | 2 | Watch | (add) |
| Драхма / Drachma | 2 | Watch | (add) |

Only Northwind and Helios are built out as worked examples in this demo cabinet.
