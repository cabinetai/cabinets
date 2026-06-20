---
title: Contract Renewal Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [legal, renewals, procurement, finance, enterprise, cabinet]
order: 1
---
# Contract Renewal Cabinet

A 90-day rolling view of every contract approaching renewal — with notice-window countdown, auto-renew risk flag, price-change history, owner, and required action. Legal, finance, and procurement always know what is expiring, what will auto-renew, and what needs a decision before the window closes.

> **Keep your contract repository and finance system. Replace the renewal spreadsheet, the calendar reminder that fires too late, and the vendor negotiation that starts with "when does this contract end?"**

> **Note:** Renewal dates, notice periods, and auto-renew terms are extracted and summarized by AI. All renewal decisions require review and approval by qualified legal counsel and appropriate business stakeholders. This cabinet does not constitute legal advice.

## The team

- **[[.agents/renewal-workflow]]** — Renewal Workflow Manager. Lead orchestrator. Monitors all contracts for upcoming renewal dates, calculates notice-window countdowns, flags auto-renew risks, identifies price-change clauses, and assigns owner action items. Writes the renewal timeline to `renewals/`.
- **[[.agents/renewal-compliance]]** — Renewal Compliance Reviewer. Reviews contracts flagged for renewal for notice-period compliance, pricing change obligations, and termination option validity before the action window closes.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-renewal-sweep]] | Renewal Workflow Manager | Renewals due ≤90 days updated; notice-window alerts; auto-renew risks flagged |
| **Monthly** (1st 09:00) | [[.jobs/monthly-renewal-forecast]] | Renewal Workflow Manager | Monthly renewal forecast: ARR at risk, total renewal value, action plan |

## How to run the demo

1. Open the [[timeline]] — the renewal timeline showing all contracts by renewal date with notice-window countdown, auto-renew risk, price-change flag, owner, and action status.
2. Browse `renewals/` — the individual renewal records produced by the weekly sweep.
3. Review `renewals/atlas-logistics-msa-renewal.md` — a worked renewal record with full action plan.

## Connectors

**Required:** Contract repository (DocuSign, Ironclad, Drive, or SharePoint), finance system (contract values and payment terms), vendor database.
**Recommended:** Slack (renewal alerts), Google Calendar (deadline events), Procurement system (PO and vendor records), ERP (spend data).

**Keep your systems of record.** Contracts stay in DocuSign and Ironclad; spend data stays in your ERP. This cabinet replaces the renewal spreadsheet and the last-minute scramble.
