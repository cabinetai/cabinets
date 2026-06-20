---
title: Contract Intelligence Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [legal, contracts, obligations, compliance, enterprise, cabinet]
order: 1
---
# Contract Intelligence Cabinet

Every executed contract is analyzed into a structured summary: parties, contract value, term, auto-renew flag, key obligations with due dates, risk flags, and termination clauses — then surfaced in a searchable dashboard. The Obligations Tracker keeps all time-sensitive commitments visible so nothing slips through a renewal or audit.

> **Keep DocuSign and Ironclad. Replace the contract spreadsheet, the "what did we agree to?" Slack thread, and the manual renewal reminder.**

> **Note:** Summaries and risk flags produced by this cabinet are AI-assisted and for informational purposes only. All contract interpretations require review by qualified legal counsel before reliance. This cabinet does not constitute legal advice.

## The team

- **[[.agents/contract-analyst]]** — Contract Analyst. Lead orchestrator. Reads executed contracts, produces structured summaries, identifies obligations with deadlines, flags risk clauses (indemnity, liability cap, IP, auto-renew), and routes outputs to the obligations tracker.
- **[[.agents/obligations-qa]]** — Obligations QA. Reviews every contract summary for completeness and accuracy before it is published. Catches missing parties, ambiguous terms, and uncaptured obligations.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **On-demand** | [[.jobs/analyze-contract]] | Contract Analyst | Contract summary + obligations written to `contracts/` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-obligations-sweep]] | Contract Analyst | Obligations due ≤30 days flagged; renewal window alerts |

## How to run the demo

1. Open the [[intelligence]] — the contract intelligence dashboard showing the full contract portfolio, a sample contract summary (Atlas Logistics MSA), obligations by due date, and risk flags.
2. Browse `contracts/` — the structured summaries written by the Analyst after each analysis run.
3. Open `contracts/atlas-logistics-msa.md` — a worked example of a contract summary with all fields populated.

## Connectors

**Required:** DocuSign (executed contracts), Ironclad (contract data and metadata), Google Drive or SharePoint (contract PDFs).
**Recommended:** Salesforce or HubSpot (counterparty data), Slack (obligation alert notifications), Google Calendar (renewal/deadline events).

**Keep your systems of record.** DocuSign and Ironclad hold the executed documents. This cabinet reads them and replaces the obligation-tracking spreadsheet, the manual calendar reminders, and the "does anyone have the MSA with Atlas?" request.
