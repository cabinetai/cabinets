---
title: HR Policy Assistant
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [hr, policy, people-ops, knowledge-base, enterprise, cabinet]
order: 1
---
# HR Policy Assistant

Employees ask policy questions constantly — PTO accrual, expense limits, parental leave, remote work rules, equipment budgets. This cabinet maintains a living, searchable policy library and answers questions with source-linked, version-controlled policy content. Every answer is a file; every policy card has a freshness date.

> **Keep your HRIS, Drive, and SharePoint. Replace the Notion HR wiki nobody updates, the Confluence pages that contradict each other, and the "just ask Sarah in HR" reflex that doesn't scale.**

## The team

- **[[.agents/people-ops]]** — People Ops Lead. Owns the policy library, runs the weekly freshness review, and publishes the top-questions digest. Decides when a policy answer is confident vs. needs HR review.
- **[[.agents/policy-researcher]]** — Policy Researcher. Pulls source documents, checks policy versions, and produces draft policy cards for lead review.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/policy-freshness-review]] | People Ops Lead | Freshness report in `reviews/freshness.md`, stale policies flagged |
| **Weekly** (Mon 08:00) | [[.jobs/top-questions-digest]] | People Ops Lead | Digest in `digests/week-<n>.md`, common question clusters surfaced |

## How to run the demo

1. Open the [[policy-hub]] — searchable policy cards by topic, freshness badges, recent questions, and most-asked.
2. Browse [[policies/]] — individual policy files in markdown, each with version, effective date, and owner.
3. Check [[digests/]] — the weekly top-questions digest the job produces.

## Connectors

**Required:** Policy document store (Google Drive or SharePoint), HRIS (Workday / BambooHR) for benefits data.
**Recommended:** Slack (for `/hr-policy` slash-command integration), Confluence or Notion (existing HR wiki to migrate), Google Workspace (SSO for employee identity).

## HR data note

Policies in demo files use invented company names and placeholder contacts. No real employee PII is stored in this cabinet. Policy answers reference source documents — they do not replace legal or HR professional review for edge cases.
