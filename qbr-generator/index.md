---
title: QBR Generator Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags:
  - customer-success
  - qbr
  - quarterly-business-review
  - cs-ops
  - enterprise
  - cabinet
order: 1
---
# QBR Generator Cabinet

A Writer and Analyst team that turns CRM data, product analytics, support tickets, and customer goals into a complete Quarterly Business Review document — exec summary, goals vs. outcomes, usage and adoption metrics, ROI realized, open issues, and next-quarter plan. QBRs run on the quarterly cron or on-demand per account. Every deck outline is a markdown file you can edit, approve, and export without assembling a single slide manually.

> **Keep your CRM, Amplitude, and BI. Replace the Google Slides QBR grind, the Gainsight template exports, and the three-day manual deck assembly before every quarterly review.**

## The team

- **[[.agents/qbr-writer]]** — QBR Writer. Leads the QBR generation: sequences the Analyst, structures the narrative, writes the exec summary and customer-facing language, and produces the final report.
- **[[.agents/qbr-analyst]]** — QBR Analyst. Pulls and interprets all quantitative inputs — usage, adoption, ROI, tickets, goal attainment — and delivers the data sections the Writer assembles into a coherent story.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Quarterly** (Jan/Apr/Jul/Oct 1 09:00) | [[.jobs/quarterly-qbr-batch]] | Writer → Analyst | QBR documents for all active accounts; report webapp updated |
| **On-demand** (enabled: false) | [[.jobs/per-account-qbr]] | Writer → Analyst | Single-account QBR generated on request |
| **Weekly** (Mon 08:00) | [[.jobs/competitor-watch-qbr]] | QBR Writer | Competitor context for upcoming QBRs; switching-risk talking points |

## How to run the demo

1. Open the [[report]] — the QBR report for Meridian Foods, Q2 2026: exec summary, goals vs outcomes, usage charts, ROI table, open issues, and next-quarter plan.
2. Browse `qbrs/` — the markdown QBR documents the quarterly job produces per account.
3. Check `qbrs/meridian-foods-q2-2026.md` for the full document the report renders.

## Connectors

**Required:** CRM (Salesforce / HubSpot), product analytics (Amplitude / Mixpanel), support tickets (Zendesk / Intercom), BI or data warehouse (Looker / Metabase).
**Recommended:** Gong (call transcripts for goals and quotes), Google Drive (past QBR decks for continuity), Slack (QBR scheduling and delivery notifications).

**Cross-cabinet link:** QBR competitor context is cross-referenced with [[../competitive-intelligence]] for market positioning and win/loss data.

## Every artifact is a file

The QBR Writer produces structured markdown documents to `qbrs/<account>-<quarter>.md`. The report webapp renders directly from these files. No PowerPoint, no Gainsight export, no copy-paste assembly.
