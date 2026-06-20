---
title: Incident Postmortem Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [engineering, sre, incident-management, postmortem, reliability, cabinet]
order: 1
---
# Incident Postmortem Cabinet

Three agents turn a resolved incident into a complete, blameless postmortem within hours: the Engineering Agent builds the timeline from PagerDuty, Datadog, and Sentry; the Summary Agent writes the root-cause analysis and customer-impact statement; the QA Agent validates the action items for completeness and owner assignment before the report is published.

> **Keep PagerDuty, Datadog, and Sentry. Replace the blank Confluence page, the week-late postmortem, and the action items that fall into a Jira backlog nobody watches.**

## The team

- **[[.agents/engineering-agent]]** — Engineering Agent. Owns timeline construction: pulls alert events, deployment markers, error spikes, and Slack incident channel messages to build a minute-by-minute timeline. Orchestrates the other agents.
- **[[.agents/summary-agent]]** — Summary Agent. Writes the root-cause narrative, 5-whys analysis, customer-impact quantification, and contributing-factors section from the timeline.
- **[[.agents/qa-agent]]** — QA Agent. Reviews the full draft postmortem: checks every action item has an owner, a due date, and a Jira ticket; flags gaps before the report is published.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **On-demand** (per incident) | [[.jobs/per-incident-postmortem]] | Engineering Agent (all three) | Postmortem in [[report]] + `postmortems/<incident-id>.md` |
| **Weekly** (Mon 09:00) | [[.jobs/weekly-action-item-followup]] | QA Agent | Action-item status in `postmortems/action-items.md` |

## How to run the demo

1. Open the [[report]] — the postmortem report for INC-2024-047: incident header with severity and duration, customer impact, timeline, root cause with 5-whys, contributing factors, and action items with owners.
2. Open `postmortems/action-items.md` — the running action-item register across all recent incidents.

## Connectors

**Required:** PagerDuty or Opsgenie (alert timeline), Datadog or Grafana (metrics + deployment markers), Sentry (error traces).
**Recommended:** Slack (incident channel export), Jira (action-item tickets), Statuspage (customer-impact wording).

Every artifact is a file — the postmortem lives in `postmortems/` dated by incident ID, blameless, diffable, and searchable.
