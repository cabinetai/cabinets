---
title: Universal Request Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [request-management, intake, routing, sla, operations, enterprise, cabinet]
order: 1
---
# Universal Request Cabinet

One intake point for every request across the company — IT help, design briefs, legal reviews, finance approvals, data pulls, marketing support, and more. Two agents classify each request, apply routing rules and SLAs, assign the right owner, and track every request to completion. Nothing falls through the cracks; every team sees their queue; every requester gets a status update.

> **Keep Jira, Notion, and your project tools. Replace the five Google Forms nobody maintains, the Typeform that routes to the wrong channel, and the ad-hoc Slack messages that die with zero accountability.**

## The team

- **[[.agents/routing-agent]]** — Routing Agent. Lead. Classifies every inbound request, applies routing rules from `routing-rules.yaml`, assigns a team and SLA tier, and dispatches to the Workflow Agent. Also produces the weekly throughput report.
- **[[.agents/workflow-agent]]** — Workflow Agent. Executes the request workflow: assigns an owner within the destination team, creates the downstream ticket (Jira/Notion/Drive), tracks status updates, sends SLA breach alerts, and closes the loop with the requester.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Daily** (Mon–Fri 09:00) | [[.jobs/daily-request-routing]] | Routing Agent | New requests classified, routed, SLA clocks started |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-throughput-report]] | Routing Agent | Throughput report — volume, SLA performance, backlog by team |

## How to run the demo

1. Open the [[queue]] — the universal request queue: all requests across teams with type, requester, priority, assignee, SLA, and status; routing rules panel; request volume by team chart.
2. Browse `queue-state/requests.yaml` — the flat-file ground truth the agents read and write.
3. Open `routing-rules.yaml` to see how requests are classified and assigned.

## Connectors

**Required:** Slack (request intake via `/request` command or channel), Email (request ingestion for non-Slack users).
**Recommended:** Jira or Linear (downstream ticket creation), Notion (brief tracking), Google Drive (file attachment handling), PagerDuty or OpsGenie (SLA breach escalation), HR/Okta (requester identity and team lookup).

## Every artifact is a file

Each request is a row in `queue-state/requests.yaml`. Routing rules are explicit YAML at `routing-rules.yaml` — not hidden logic. Every SLA breach and escalation is logged at `queue-state/sla-log.md`. The weekly report lands at `reports/throughput-<date>.md`.
