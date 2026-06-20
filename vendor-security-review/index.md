---
title: Vendor Security Review Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [security, grc, vendor, procurement, risk, enterprise, cabinet]
order: 1
---
# Vendor Security Review Cabinet

Two agents — a Compliance Lead and a QA Reviewer — assess vendor risk for every new and renewing vendor: SOC2 / ISO 27001 report status, DPA status, data classification, sub-processors, and open findings — producing a structured approval packet and maintaining a live review queue.

> **Keep Vanta and Drata as your GRC systems of record. Replace the vendor security review spreadsheets, ad-hoc Slack security requests, and manual approval email chains around them.**

## Why this cabinet

Every SaaS vendor touching company or customer data is a risk — and most teams have no consistent process for reviewing them. Security reviews pile up in Slack, get done inconsistently, and leave no audit trail. This cabinet makes vendor security review a structured, repeatable operation: every vendor gets the same rigorous assessment, every decision is documented, and every annual re-assessment fires automatically.

Every artifact is a file: the vendor review packet, the approval decision, findings, and the review queue are all written to disk so you can open, share with legal, and audit them.

## The team

- **[[.agents/compliance-agent]]** — Compliance Lead. Orchestrates vendor assessments, assigns risk tiers, evaluates SOC2/ISO reports and DPA status, produces the review packet, and issues the approval decision.
- **[[.agents/qa-reviewer]]** — QA Reviewer. Cross-checks the review packet for completeness, validates that all required docs are present and current, and flags findings that require escalation before approval.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **On-demand** | [[.jobs/vendor-review]] | Compliance Lead | Full vendor review packet in `/vendors/<vendor-name>/review-packet.md` |
| **Weekly** (Mon 08:00) | [[.jobs/review-queue]] | Compliance Lead | Review queue status refreshed in `/queue/status.md`, blockers surfaced in the workspace |
| **Monthly** (1st 09:00) | [[.jobs/annual-reassessment-check]] | Compliance Lead | Vendors due for annual re-assessment flagged in `/queue/reassessment-due.md` |

## How to run the demo

1. Open the [[review-workspace]] — the vendor review queue (pending, in-review, approved, escalated) plus a full worked review packet for Atlas Logistics.
2. Browse `vendors/atlas-logistics/` — a complete vendor review folder with the review packet, SOC2 summary, DPA status, and findings.
3. Check `queue/status.md` — the current review queue with due dates and owners.

## Connectors

**Required:** Vanta or Drata (vendor risk module, compliance controls), procurement system or contract vault (vendor list, contract dates), Google Drive (vendor SOC2 reports, DPAs, security questionnaire responses).
**Recommended:** Legal vault (DPA / MSA tracking), Okta or Entra (vendor SSO / SCIM integrations), Slack (`#vendor-security` channel), email (vendor outreach).

**Vanta and Drata remain your official GRC and vendor risk systems of record.** This cabinet coordinates the review process, structures the evidence, and produces the approval packet — it does not replace Vanta/Drata as the authoritative vendor risk store.
