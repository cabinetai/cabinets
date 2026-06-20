---
title: Access Approval Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [it, security, access-management, approval-workflow, enterprise, cabinet]
order: 1
---
# Access Approval Cabinet

Every access request — new app, elevated role, temporary permission, service account — gets a structured compliance check before a human approves it. The routing agent validates requester role, manager chain, existing permissions, and SoD conflicts; the compliance agent checks the request against policy and generates a decision-ready approval packet. No more approving requests without context.

> **Keep Okta, Microsoft Entra, and your HRIS as the systems of record. Replace the Google Form inbox, the Slack DM approvals with no audit trail, and the manual policy checks that get skipped under deadline pressure.**

## The team

- **[[.agents/access-router]]** — Access Router (lead). Receives every access request, validates requester identity and manager chain, checks existing permissions in Okta/Entra, and assembles the approval packet for the compliance agent.
- **[[.agents/access-compliance]]** — Access Compliance Agent. Runs the policy check: SoD conflicts, least-privilege validation, role suitability, and regulatory flags. Produces the pass/fail verdict with rationale and routes to the right approver.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **On-demand** (per request) | [[.jobs/access-approval-check]] | Access Router | Approval packet in `/approvals/<request-id>/` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-access-review]] | Access Compliance | Access hygiene report: orphaned accounts, over-privileged roles, stale requests |

## How to run the demo

1. Open the [[approval-packet]] — a complete access approval decision: who requested what, current access context, policy check result, SoD conflicts, manager approval status, and the final decision.
2. Browse `/approvals/` — individual approval packet files for each request.
3. Open `/reports/access-review.md` — the weekly access hygiene report.

## Connectors

**Required:** Okta or Microsoft Entra (identity, group membership, existing permissions), HRIS (manager chain, role, department, employment status).
**Recommended:** ServiceNow (ticket sync for formal approval records), Google Workspace (group membership), Slack (approval notifications to managers), BambooHR or Workday (HR data source).

**Cabinet philosophy:** Okta and Entra remain the authoritative identity stores — this cabinet handles the request intake, the policy reasoning, and the approval coordination that happens *before* an admin clicks "Assign" in the IdP console. The access change itself always flows through the IdP.
