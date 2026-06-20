---
title: Procurement Intake
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [procurement, vendor-management, compliance, approval, operations, enterprise, cabinet]
order: 1
---
# Procurement Intake

Every vendor or tool request submitted by an employee becomes a **structured approval packet** in minutes — vendor details, total cost, ranked alternatives, security and legal flags, the approval chain, and a recommended decision. Three agents handle routing, analysis, and compliance in a fixed loop so requests never stall in Slack.

> **Keep your ERP and finance system of record. Replace the Google Form nobody fills out correctly, the Airtable tracker nobody updates, and the Slack thread that dies after the first reply.**

## The team

- **[[.agents/routing-lead]]** — Routing Lead. Orchestrates the request lifecycle: triages every new submission, dispatches to the Analyst and Compliance Reviewer, assembles the final packet, and routes it to the correct approver.
- **[[.agents/procurement-analyst]]** — Procurement Analyst. Researches vendor pricing, surfaces credible alternatives, builds the cost model, and checks whether a contract or master agreement already exists.
- **[[.agents/compliance-reviewer]]** — Compliance Reviewer. Screens every vendor for security posture, data handling, legal exposure, and insurance requirements. Issues a pass/flag/block with a written rationale.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **On-demand** | [[.jobs/intake-request]] | Routing Lead | Approval packet per request in `approval-packets/` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-queue-review]] | Routing Lead | Queue status report — stalled, approved, blocked, spend summary |

## How to run the demo

1. Open the [[queue]] — the live intake queue showing all requests with status, cost, flags, and approval chain.
2. Open the [[approval-packet]] — the sample approval packet the team produces for each request: vendor scorecard, alternatives matrix, security/legal flags, recommended approval path.
3. Browse `approval-packets/` to see the file artifacts the agents write after each intake run.

## Connectors

**Required:** Finance system (budget owners, cost centers), Slack (request intake + approver notifications), Legal DMS (existing contracts/NDAs), Security questionnaire tool (SOC 2/ISO 27001 certs).
**Recommended:** Okta or IdP (vendor SSO provisioning), Jira or Linear (follow-up tickets), Coupa or NetSuite (PO creation), contract lifecycle management (DocuSign, Ironclad).

## Every artifact is a file

Each approval packet is a markdown file in `approval-packets/<request-id>.md` — inspectable, version-controllable, forwardable to a budget holder without logging into any system. The queue index at `queue-state/requests.yaml` is the single source of truth for open requests.
