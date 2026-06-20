---
title: Renewal Risk Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags:
  - customer-success
  - renewals
  - churn-prevention
  - expansion
  - enterprise
  - cabinet
order: 1
---
# Renewal Risk Cabinet

A structured renewal management operation: a CSM agent and a Workflow agent scan every account in the 90/60/30-day renewal window each week, assess risk level, surface expansion opportunities, and produce a board view with action owners and deadlines. Every renewal has a written action plan. No renewal should surprise anyone.

> **Keep your CRM, contracts database, and support system. Replace the renewal-tracker spreadsheets, the Gainsight notes nobody reads, and the quarterly "wait, that's up for renewal?" fire drill.**

## The team

- **[[.agents/renewal-csm]]** — Renewal CSM. Owns the renewal risk assessment, expansion identification, and the customer-facing action plan for each renewal in the window.
- **[[.agents/renewal-workflow]]** — Renewal Workflow Agent. Orchestrates the data pull across CRM, contracts, support, and usage analytics — and ensures action items are tracked to completion.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-renewal-sweep]] | Renewal CSM → Workflow | Full renewal board refreshed; action plans updated |
| **Daily** (Mon–Fri 07:00) | [[.jobs/renewal-escalation-check]] | Renewal Workflow | 30-day accounts re-checked for blocking issues; escalations flagged |
| **Weekly** (Mon 08:00) | [[.jobs/competitor-watch-renewals]] | Renewal CSM | Competitor mention sweep across renewal accounts; counter-narratives |

## How to run the demo

1. Open the [[board]] — the renewals board: upcoming timeline, $ at risk, risk level, expansion potential, action owner, and days to renewal.
2. Browse `renewals/` — the individual renewal action plans the weekly job produces.
3. Check `renewals/index.md` for the full 90-day pipeline.

## Connectors

**Required:** CRM (Salesforce / HubSpot — contract terms, ARR, renewal dates), contracts database (DocuSign / Ironclad), support (Zendesk / Intercom — open tickets), usage analytics (Amplitude / Mixpanel).
**Recommended:** Gong (renewal call transcripts), Slack (escalation delivery), billing system (Stripe / NetSuite — payment history, usage overages, expansion signals).

**Cross-cabinet link:** Competitor context for renewal conversations is cross-referenced with [[../competitive-intelligence]].

## Every artifact is a file

The Renewal CSM writes action plans to `renewals/<account>-renewal.md`. The board webapp reads these directly. Every renewal has a traceable plan with an owner, a date, and a blocking issue — not a Gainsight note that scrolls away.
