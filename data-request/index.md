---
title: Data Request Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [data, analytics, requests, triage, intake, enterprise, cabinet]
order: 1
---
# Data Request Cabinet

Business questions flow in from Slack, email, and Jira and disappear without an answer. This cabinet structures every data request from intake to delivery: a Routing Agent classifies the question, checks whether it's already answered in the common-questions library, assigns it to an analyst with a priority and SLA, and the Analyst delivers a structured answer packet. Every request is a file — trackable, auditable, and reusable.

> **Keep Slack, Jira, and your BI tools. Replace the invisible queue of data asks, the duplicate requests nobody cross-references, and the "I think someone answered this before" archaeology.**

## The team

- **[[.agents/routing-agent]]** — Routing Agent. Lead orchestrator. Classifies incoming requests, deflects common questions, assigns priority and SLA, routes to the Analyst, and tracks through to delivery. Owns the queue health.
- **[[.agents/analyst]]** — Data Analyst. Executes assigned requests: writes SQL against the warehouse, produces the answer packet (data + narrative + caveats), and files it back. Owns delivery quality.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Daily** (Mon–Fri 09:00) | [[.jobs/daily-request-triage]] | Routing Agent | New requests classified, routed, and updated in [[queue/requests.yaml]] |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-throughput-report]] | Routing Agent | Throughput report in [[queue/throughput/]] with SLA compliance, backlog age, and team load |

## How to run the demo

1. Open the [[queue]] — the data request queue: question, requester, priority, assigned analyst, status, and SLA countdown. Submit new requests via the intake form.
2. Browse [[queue/requests.yaml]] — the YAML file that is the queue's source of truth.
3. Browse [[queue/answers/]] — filed answer packets from completed requests.
4. Check [[queue/common-questions.md]] — the deflection library built from recurring request patterns.

## Connectors

**Required:** Snowflake or BigQuery (warehouse for SQL execution); Slack (request intake and answer delivery).
**Recommended:** Jira (ticket creation + sync for engineering-adjacent requests); Looker or Metabase (self-serve deflection links); Google Sheets (for requesters who prefer a spreadsheet answer).

**Every request is a file.** The intake, the routing decision, the answer, and the caveats all live in `queue/` — searchable, diffable, and usable as future deflection material.
