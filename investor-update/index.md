---
title: Investor Update Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags:
  - investor-relations
  - investor-update
  - fundraising
  - founder
  - enterprise
  - cabinet
order: 1
---
# Investor Update Cabinet

Two agents — Investor Analyst and Investor Writer — produce a polished monthly investor update from live company data and founder notes. The update ships on the 1st of each month without a manual assembly ritual. Every highlight, metric, lowlight, and ask is sourced and traceable.

> **Keep your CRM, your finance docs, and your product updates. Replace the monthly "sit down and write the investor email" ritual that eats three hours and still goes out stale.**

## The team

- **[[.agents/investor-analyst]]** — Pulls the month's metrics (ARR, MRR growth, burn, pipeline, hiring) and structures them into the data table the Writer draws from. Flags any metric that will generate investor questions.
- **[[.agents/investor-writer]]** — Writes the investor update from the Analyst's data and the CEO's notes. Owns the narrative: highlights, lowlights, metrics, asks, and the "what's next" section. Calibrated to the voice of the CEO.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Monthly** (1st 09:00) | [[.jobs/monthly-investor-update]] | Investor Writer | Monthly investor update in `update-letter/` |
| **Monthly** (1st 08:00) | [[.jobs/monthly-metrics-pull]] | Investor Analyst | Metrics data file refreshed in `data/monthly.md` |

## How to run the demo

1. Open the [[update-letter]] — the polished investor update letter: highlights, metrics table, lowlights, asks, and what's coming next. Ready to send or export to PDF.
2. Browse [[data]] — the structured metrics the Analyst produces and the Writer draws from.
3. Browse [[archive]] — past investor updates with date slugs; diffs show what changed each month.

## Connectors

**Required:** Finance docs (NetSuite, QuickBooks, or CFO spreadsheet for burn and cash), CRM (Salesforce or HubSpot for ARR, pipeline, new logos), product update source (Jira, Linear, or Notion for milestone status), hiring plan (Workday or ATS).
**Recommended:** Stripe (MRR, churn rate, cohort data), Brex or Mercury (real-time cash balance).

## Related cabinets

- **[[../board-memo]]** — Board memo cabinet. The investor update shares the same metrics table but is shorter, more narrative, and written for investors — not the board.
- **[[../ceo-operating]]** — CEO operating cabinet. The Investor Writer draws on the priorities and decisions log for the "what's next" and "lowlights" sections.
