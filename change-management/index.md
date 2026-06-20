---
title: Change Management Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [it, devops, change-management, cab, risk-assessment, enterprise, cabinet]
order: 1
---
# Change Management Cabinet

Structured change request documentation, risk scoring, and CAB approval routing for IT and DevOps teams. Every change — database migration, infra update, config push, major deploy — gets a complete packet: what's changing, why, what could go wrong, rollout steps, rollback plan, and who needs to approve. The QA reviewer agent validates completeness before anyone wastes time in a CAB meeting. Every packet is a file.

> **Keep ServiceNow as your ITSM system of record. Replace the inconsistent change forms, the forgotten rollback plans, the CAB prep that happens in a chat thread, and the "who approved this?" question during an incident.**

## The team

- **[[.agents/change-reviewer]]** — Change Reviewer (lead). Receives every change request, validates completeness against the required fields, scores risk using the standard matrix, and determines the change type (standard/normal/emergency). Blocks incomplete packets from reaching CAB.
- **[[.agents/change-workflow]]** — Change Workflow Agent. Routes the validated packet to the right approvers, schedules CAB if required, tracks the approval chain, and updates the change calendar.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **On-demand** (per change) | [[.jobs/change-packet-review]] | Change Reviewer | Change packet in `/changes/<change-id>/packet.md` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-change-calendar]] | Change Workflow | Weekly change calendar in `/reports/change-calendar.md` |

## How to run the demo

1. Open the [[change-packet]] — a complete change packet for `CHG-2026-0312`: change header, risk assessment, affected systems, rollout steps, rollback plan, approval chain, CAB schedule, and current status.
2. Browse `/changes/` — one directory per change, each containing the full packet and approval history.
3. Open `/reports/change-calendar.md` — the weekly view of scheduled changes and CAB meeting agenda.

## Connectors

**Required:** ServiceNow (change record sync and CMDB context), GitHub (deploy PRs, commit context for code changes).
**Recommended:** Jira (linked issues and release notes), Slack (CAB notifications, approval requests), PagerDuty or Opsgenie (freeze windows, on-call context), Terraform Cloud or Spacelift (infra change context).
