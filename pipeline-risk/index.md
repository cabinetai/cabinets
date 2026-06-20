---
title: Pipeline Risk
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [sales, pipeline, risk, forecast, revops, enterprise, cabinet]
order: 1
---
# Pipeline Risk

Scan every open opportunity for the signals that predict a slip: no champion identified, next step older than 14 days, stage unchanged for 3+ weeks, competitor mentioned without a counter-response. The Risk Analyst scores each deal; the Customer Agent validates context from Gong calls; together they produce a weekly pipeline risk report that lands before the Monday forecast call.

> **Keep Salesforce and your forecast model. Replace the manual deal-review doc, the Clari-lite spreadsheet, and the "how does this feel?" gut-check that surprises you at month-end.**

## The team

- **[[.agents/risk-analyst]]** — Risk Analyst (lead). Owns the pipeline risk model: scores every open deal, classifies risk type, and produces the weekly report. Sequences the Customer Agent for deal-specific context.
- **[[.agents/customer-agent]]** — Customer Agent. Validates risk signals against Gong transcripts, recent email, and CRM activity. Surfaces deal-specific context the risk score can't see.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 07:00) | [[.jobs/weekly-pipeline-risk]] | Risk Analyst | Pipeline risk report in `/reports/pipeline-risk-<date>.md` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-competitor-watch]] | Risk Analyst | Competitor mentions in active deals flagged and cross-referenced |
| **Daily** (Mon–Fri 07:00) | [[.jobs/daily-stale-check]] | Risk Analyst | Deals going stale overnight flagged in `/alerts/stale.md` |

## How to run the demo

1. Open the [[pipeline-board]] — the Pipeline Risk Board: deals table with risk score, stage, age, champion status, and next-step health; forecast vs. target summary; competitor mention alerts.
2. Check `/reports/` — weekly pipeline risk reports the Risk Analyst writes.
3. See `/alerts/stale.md` — real-time stale deal flags updated daily.

## Connectors

**Required:** Salesforce or HubSpot (opportunities, stages, activity dates), Gong (call transcripts, competitor mentions), Slack (deal Slack channels), HubSpot (deal data).
**Recommended:** Clari or Aviso (forecast baseline), Outreach or Salesloft (sequence activity).

**Cross-cabinet:** This cabinet is downstream of [[../competitive-intelligence]] — the weekly competitor-watch job cross-references the full competitor landscape when flagging competitor mentions in deals.

**Every artifact is a file.** The risk report, the stale-deal alerts, and the competitor-watch cut all live in this cabinet — no Salesforce report to configure, no Clari login required.
