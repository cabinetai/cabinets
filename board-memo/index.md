---
title: Board Memo Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags:
  - board
  - board-memo
  - governance
  - reporting
  - enterprise
  - cabinet
order: 1
---
# Board Memo Cabinet

Three agents — Board Analyst, Board Writer, and Board Reviewer — produce the monthly update and quarterly board pack from live company data. Every metric, narrative, risk flag, and "ask" is a sourced file you can inspect, version, and share directly to DocSend. No more assembling the board pack from a dozen Slack threads the night before.

> **Keep Salesforce, NetSuite, and Looker. Replace the manual board pack, the PowerPoint slide scramble, and the "who has the latest numbers?" fire drill.**

## The team

- **[[.agents/board-analyst]]** — Pulls and validates all board metrics (revenue, burn, runway, hiring, KPIs) from connected systems. Does not write narrative — produces the numbers table the writer draws from.
- **[[.agents/board-writer]]** — Writes the board memo and metrics packet narrative. Structured, concise, board-ready. Never editorializes without a number.
- **[[.agents/board-reviewer]]** — Reviews the draft for accuracy, completeness, and board norms. Catches missing asks, unsourced claims, and stale data before the memo ships.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Monthly** (1st 09:00) | [[.jobs/monthly-board-update]] | Board Writer → All | Monthly board update in `board-report/` |
| **Quarterly** (Jan/Apr/Jul/Oct 1st 09:00) | [[.jobs/quarterly-board-pack]] | All agents | Full board pack in `board-report/` + `archive/` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-metrics-refresh]] | Board Analyst | Live metrics refreshed in `metrics/latest.md` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-competitor-landscape]] | Board Analyst | Competitive landscape section updated in `competitive/latest.md` |

## How to run the demo

1. Open the [[board-report]] — the full board metrics packet: revenue, burn, runway, hiring, KPIs, competitive landscape, and the "asks."
2. Browse [[metrics]] — the live metrics file the Analyst refreshes weekly and the Writer pulls for every memo.
3. Browse [[archive]] — past board memos with date slugs, diffs viewable in Git.

## Connectors

**Required:** Salesforce or HubSpot (pipeline, closed ARR, NRR), NetSuite or QuickBooks (P&L, burn, cash), Stripe (MRR, churn, cohorts), Looker or Metabase (KPI dashboards), Workday or Rippling (headcount, open reqs).
**Recommended:** Jira or Linear (product milestone status), Gong (win/loss themes for board narrative), DocSend (board pack delivery tracking).

## Related cabinets

- **[[../ceo-operating]]** — CEO operating cabinet. The board memo draws decisions, risks, and priorities from this cabinet.
- **[[../competitive-intelligence]]** — Full competitor landscape. The board memo's "competitive landscape" section is a curated cut from this cabinet.
- **[[../investor-update]]** — Monthly investor update. Board memo and investor update share the same metrics table but have different audiences and formats.
