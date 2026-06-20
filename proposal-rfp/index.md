---
title: Proposal / RFP
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [sales, proposal, rfp, deal-desk, compliance, enterprise, cabinet]
order: 1
---
# Proposal / RFP

Draft proposals and RFP responses from the customer's own words — pulling account context from the CRM, pricing from the approved schedule, security answers from the questionnaire library, and case studies from past wins. The Writer Agent drafts; the Compliance Agent checks against legal and security guardrails; the QA Agent reviews completeness before anything goes to the customer.

> **Keep your CRM and legal docs. Replace the Loopio spreadsheet, the 72-hour RFP panic, and the "who has the latest security questionnaire answers?" Slack thread.**

## The team

- **[[.agents/writer-agent]]** — Writer Agent (lead). Drafts proposals and RFP responses using account context, the answer library, and case studies. Sequences Compliance and QA before the draft is marked ready.
- **[[.agents/compliance-agent]]** — Compliance Agent. Checks every draft against legal guardrails (approved pricing, liability language, security claim accuracy) and flags anything that needs Deal Desk or Legal sign-off.
- **[[.agents/qa-agent]]** — QA Agent. Reviews completeness: every question answered, no placeholder text, response length appropriate, tone consistent. Scores the draft and blocks release until 95%+ complete.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **On demand** | [[.jobs/rfp-response]] | Writer Agent | Full RFP response drafted in `/responses/<rfp-name>/draft.md` (enabled: false) |
| **Weekly** (Mon 09:00) | [[.jobs/library-freshness]] | Compliance Agent | Answer library freshness check; stale answers flagged in `/library/stale.md` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-competitor-watch]] | Writer Agent | Competitor positioning in active proposals reviewed |

## How to run the demo

1. Open the [[rfp-workspace]] — the RFP Response Workspace: question list with answer status, completeness percentage, reuse-from-library matches, section owners, and a compliance flag panel.
2. Browse `/responses/atlas-logistics-rfp/` — the worked example response with draft answers.
3. Check `/library/` — the reusable answer library the agents pull from and keep fresh.

## Connectors

**Required:** CRM (account context, deal size, contacts), Legal docs (approved contract language, pricing schedule), Security docs (security questionnaire answer library), Google Drive (past proposals, case studies).
**Recommended:** Salesforce CPQ (pricing configuration), DocuSign (contract routing), Notion or Confluence (answer library).

**Every artifact is a file.** Every draft lives in `/responses/<rfp-name>/` — tracked, reviewed, and archived without a Loopio subscription.
