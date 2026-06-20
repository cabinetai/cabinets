---
title: OKR Command Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [okr, strategy, operations, performance, enterprise, cabinet]
order: 1
---
# OKR Command Cabinet

Three agents keep your company and department OKRs current, honest, and visible. The Analyst scores confidence and surfaces blockers every week; the Workflow agent chases owners for updates and reconciles the board; the Narrator turns the numbers into a plain-English weekly narrative leadership can forward without editing. Every OKR state, every update, and every blockers log is a file you can open, diff, and link.

> **Keep your Jira, your Salesforce, your BI dashboards. Replace WorkBoard, Betterworks, and the spreadsheet-of-truth nobody updates before Monday's leadership call.**

## The team

- **[[.agents/okr-analyst]]** — OKR Analyst (lead). Owns confidence scoring, blocker flagging, and the weekly OKR board state. Decides when an OKR is off-track and what the intervention is.
- **[[.agents/okr-workflow]]** — OKR Workflow Agent. Chases owners for weekly updates, validates that key results have numeric data, and keeps `data/okrs.yaml` clean and current.
- **[[.agents/okr-narrator]]** — OKR Narrator. Reads the scored board and writes the weekly narrative memo: what's green, what's at risk, what needs a decision.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-okr-checkin]] | OKR Analyst | Weekly narrative memo in `data/weekly-narrative.md` |
| **Weekly** (Fri 16:00) | [[.jobs/weekly-confidence-sweep]] | OKR Workflow | Confidence + blocker sweep; updated `data/okrs.yaml` |

## How to run the demo

1. Open [[board]] — the OKR board showing objectives, key results with progress bars, confidence RAG status, owners, and trend.
2. Read `data/weekly-narrative.md` — this week's narrative the Narrator produced.
3. Inspect `data/okrs.yaml` — the machine-readable source the board renders from.

## Connectors

**Required:** Jira (initiative tracking), Salesforce or CRM (revenue KR data), Google Sheets (manual KR updates).
**Recommended:** Slack (`#okr-updates` channel), BI / Looker (metric pulls), Google Slides (QBR export).

**Replaces:** WorkBoard, Betterworks, Profit.co, Perdoo, Tability, Weekdone — and the manual OKR tracker someone rebuilds in Sheets every quarter.
