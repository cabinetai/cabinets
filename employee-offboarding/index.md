---
title: Employee Offboarding Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [it, hr, offboarding, access-revocation, compliance, enterprise, cabinet]
order: 1
---
# Employee Offboarding Cabinet

End-to-end offboarding orchestration that ensures nothing slips through the cracks when an employee leaves. A workflow agent sequences every step across IT and HR — access revocation, device retrieval, data transfer, notification to stakeholders — while a compliance agent builds the audit trail that proves each step was completed. Every action is timestamped and written to a file.

> **Keep HRIS, Okta, and Jamf as your systems of record. Replace the shared Google Doc checklist that gets stale, the Slack thread that goes quiet, and the "wait, did we revoke their GitHub access?" question two weeks after their last day.**

## The team

- **[[.agents/offboarding-workflow]]** — Offboarding Workflow Agent (lead). Receives an offboarding trigger (employee ID, last day), sequences all steps across the four categories (access, devices, data, comms), assigns owners, and tracks completion against the last-day deadline.
- **[[.agents/offboarding-compliance]]** — Offboarding Compliance Agent. Validates that every mandatory step is completed on time, flags blockers, and writes the final audit-trail log that goes to IT, HR, and legal records.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **On-demand** (per offboarding) | [[.jobs/offboarding-kickoff]] | Offboarding Workflow | Offboarding room in `/offboardings/<employee-id>/` |
| **Daily** (Mon–Fri 09:00) | [[.jobs/daily-offboarding-status]] | Offboarding Workflow | Status digest: pending steps, approaching last days, blockers |

## How to run the demo

1. Open the [[offboarding-room]] — the demo offboarding for `j.chen` (last day May 30): employee header, last-day countdown, checklist by category with owners and statuses, and the growing audit-trail log.
2. Browse `/offboardings/` — one directory per active offboarding, each containing the checklist and audit log.
3. Check `/offboardings/daily-digest.md` — the daily status summary the job produces.

## Connectors

**Required:** HRIS (offboarding trigger, last day, manager, department), Okta or Microsoft Entra (access revocation), Google Workspace or Microsoft 365 (email/drive transfer).
**Recommended:** Jamf or Kandji (device management, remote wipe), GitHub (org removal), Slack (deactivation, channel cleanup), BambooHR or Workday (HR offboarding workflow trigger), ServiceNow (IT ticket creation for device return).

**Cabinet philosophy:** Okta, Jamf, and your HRIS remain the authoritative systems for identity, device state, and employment records. This cabinet coordinates the *sequence* — who does what, in what order, with proof of completion — so nothing is missed and every action is auditable.
