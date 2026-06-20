---
title: Legal Request Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [legal, intake, routing, triage, enterprise, cabinet]
order: 1
---
# Legal Request Cabinet

Structured intake for every legal request from every team. Each request is classified (NDA, MSA review, advice, regulatory), assigned a priority and SLA, enriched with required information, and routed to the right legal owner — with a full audit trail as a file.

> **Keep your Slack and your email. Replace the legal Slack thread with no follow-up, the Google Form nobody remembers to check, and the Jira queue that hasn't been triaged since Q3.**

> **Note:** Request routing and classification is AI-assisted. All legal requests must be reviewed and acted upon by qualified legal counsel. This cabinet does not provide legal advice and does not substitute for attorney judgment.

## The team

- **[[.agents/request-router]]** — Request Router. Lead orchestrator. Receives incoming legal requests, classifies request type and urgency, gathers required intake information, assigns priority and SLA, routes to the appropriate legal owner, and writes the request packet to `requests/`.
- **[[.agents/request-qa]]** — Request QA. Reviews each request packet for completeness before routing — confirms required fields are populated, SLA is set, and no ambiguity remains in the request scope.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Daily** (Mon–Fri 09:00) | [[.jobs/daily-request-triage]] | Request Router | Open requests triaged, SLA statuses updated, stale requests flagged |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-legal-workload-report]] | Request Router | Legal workload summary: open by type, SLA performance, overdue items |

## How to run the demo

1. Open the [[queue]] — the legal request queue showing all open requests with type, requester, priority, SLA countdown, assigned counsel, and status. Includes an intake form preview.
2. Open `requests/` — the individual request packets written by the Router after each intake run.
3. Review `requests/aurora-partnership-nda.md` — a worked intake packet with all required fields.

## Connectors

**Required:** Slack (incoming legal request channel), Google Docs or email (supporting documents), contracts repository.
**Recommended:** Jira Service Management (ticket sync), Google Calendar (SLA tracking), DocuSign (NDA execution), HRIS (requester context).

**Keep your systems of record.** Contracts, executed NDAs, and emails stay where they live. This cabinet replaces the ad-hoc intake process with a structured, traceable queue.
