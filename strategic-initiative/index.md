---
title: Strategic Initiative Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [strategy, initiatives, pmo, risk, enterprise, cabinet]
order: 1
---
# Strategic Initiative Cabinet

Two agents track every cross-functional strategic initiative — pricing changes, new market launches, reorgs, major product pivots — with milestones, RACI owners, risk register (likelihood × impact), and weekly status. The Workflow Agent collects updates and maintains the data; the Analyst scores risks and surfaces blockers for leadership. Every initiative, milestone, and risk is a file you can audit, diff, and link.

> **Keep your Jira, your Drive, your BI dashboards. Replace the Asana project nobody reviews, the Monday board with 40% stale items, the leadership doc that went out of date the week it was written.**

## The team

- **[[.agents/initiative-workflow]]** — Initiative Workflow Agent (lead). Maintains the initiative registry — collects milestone updates from owners, validates data, and keeps `data/initiatives.yaml` current. Orchestrates the Analyst for risk scoring.
- **[[.agents/initiative-analyst]]** — Initiative Analyst. Scores initiative risks (likelihood × impact), identifies cross-initiative blockers and interdependencies, and writes the weekly risk narrative.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-initiative-status]] | Initiative Workflow → Analyst | Updated `data/initiatives.yaml` · status summary in `data/status-YYYY-WW.md` |
| **Weekly** (Fri 16:00) | [[.jobs/weekly-risk-review]] | Initiative Analyst | Risk register updated · risk narrative in `data/risk-narrative.md` |

## How to run the demo

1. Open [[room]] — the initiative room showing the milestone timeline, RACI/owners card, and risk register with likelihood × impact matrix.
2. Read `data/status-2026-21.md` — this week's initiative status summary.
3. Read `data/risk-narrative.md` — the current risk narrative from the Analyst.
4. Inspect `data/initiatives.yaml` — the machine-readable source the room renders from.

## Connectors

**Required:** Slack (#strategy, #leadership, #project channels), Jira (milestone work items), Google Drive (initiative documents and decks).
**Recommended:** BI / Looker (success metrics), Google Slides (board reporting export), OKR Command cabinet (link initiatives to OKRs).

**Replaces:** Asana strategic initiative views, Monday.com project boards, leadership tracking spreadsheets, and the quarterly strategy doc that's out of date by week 2.
