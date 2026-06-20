---
title: Board Finance Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [finance, board, cfо, arr, burn, runway, reporting, enterprise, cabinet]
order: 1
---
# Board Finance Cabinet

Two agents assemble the CFO's board finance section each quarter — ARR, MRR, growth, burn multiple, runway, plan vs. actual, cohort retention, and key risks — as a polished document the CFO can present without edits. A monthly metrics refresh keeps the underlying data current between board meetings.

> **Keep your ERP, Stripe, and BI. Replace the quarterly scramble to wrangle spreadsheets, reconcile numbers across four tabs, and build slides the night before the board.**

## The team

- **[[.agents/analyst]]** — Board Finance Analyst. Pulls ARR, MRR, burn, headcount, and cohort data from ERP, Stripe, and payroll. Reconciles plan vs. actual. Computes burn multiple, runway, and net revenue retention. Writes the structured data file.
- **[[.agents/writer]]** — Board Narrative Writer. Takes the Analyst's data and writes the CFO's board section — executive framing, section-by-section commentary, risks, and key decisions needed. Owns the final boardroom-ready document.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Quarterly** (1st 09:00, Jan/Apr/Jul/Oct) | [[.jobs/quarterly-board-pack]] | Analyst → Writer | Full board pack in [[packet]] |
| **Monthly** (1st 09:00) | [[.jobs/monthly-metrics-refresh]] | Analyst | Metrics data in `data/metrics-current.md` |

## How to run the demo

1. Open [[packet]] — the board finance packet: ARR/MRR with growth trend SVG, burn multiple, runway, plan vs. actual table, net revenue retention, and key risks section.
2. Browse `data/metrics-q2-2026.md` — the structured data file the Analyst writes and the Writer reads. Every board number is sourced here.
3. Check `data/metrics-current.md` — the monthly refresh with rolling 12-month metrics.

## Connectors

**Required:** ERP (NetSuite/QuickBooks — GL actuals, opex by category), Stripe (ARR, MRR, churn, cohort data), payroll system (headcount and comp spend).
**Recommended:** BI tool (Looker/Metabase for cohort analysis), Google Slides (board deck integration), Notion (board meeting prep workspace).
