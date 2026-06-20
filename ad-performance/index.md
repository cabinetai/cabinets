---
title: Ad Performance Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [marketing, paid-media, ads, cac, roas, growth, enterprise, cabinet]
order: 1
---
# Ad Performance Cabinet

Spend, CAC, ROAS, creative winners and losers, anomalies, and the next experiment queue — synthesized weekly from raw platform data into a memo the whole team can act on. The Ads Analyst pulls the numbers and spots patterns; the Ads Writer turns them into a crisp performance memo.

> **Keep Meta Ads, Google Ads, LinkedIn Ads, and your BI tool. Replace the Looker report nobody reads in full, the weekly Sheets export, and the Friday "what's our CAC this month?" Slack thread.**

## The team

- **[[.agents/ads-analyst]]** — Ads Analyst. Lead orchestrator. Pulls platform data, computes CAC/ROAS/CPL by channel and creative, spots anomalies, and identifies the next experiments. Sequences the Writer.
- **[[.agents/ads-writer]]** — Ads Writer. Turns the Analyst's findings into the weekly performance memo — crisp, action-oriented, written for growth leaders who read in 3 minutes.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-ad-performance-memo]] | Analyst → Writer | Weekly memo in `memos/weekly-<date>.md` + dashboard update |
| **Daily** (Mon–Fri 09:00) | [[.jobs/daily-spend-anomaly-check]] | Ads Analyst | Spend anomaly log in `alerts/daily-<date>.md` |

## How to run the demo

1. Open [[ads-dashboard]] — the performance dashboard: KPIs (spend, CAC, ROAS), spend-by-channel chart, creative leaderboard, CAC trend line, and next experiment queue.
2. Browse `memos/` — weekly performance memos the Writer produces every Monday.
3. Check `alerts/` — daily anomaly logs that flag over-pacing, CTR drops, or CPA spikes before they become problems.

## Connectors

**Required:** Meta Ads Manager (spend, creative performance), Google Ads (search spend, conversion data), LinkedIn Campaign Manager (B2B spend).
**Recommended:** Looker or Tableau (enriched attribution), HubSpot or Salesforce (CRM-based CAC), Google Analytics (landing page CVR), Slack (`#growth` channel for alerts).
