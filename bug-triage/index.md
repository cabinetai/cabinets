---
title: Bug Triage Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [engineering, qa, bug-triage, sentry, reliability, cabinet]
order: 1
---
# Bug Triage Cabinet

Daily triage across Sentry, GitHub Issues, Jira, and Support tickets — bugs ranked by severity, customer impact, occurrence frequency, and technical owner, with a priority score for each. No more drowning in the Sentry inbox or running triage meetings that eat 45 minutes every Tuesday.

> **Keep Sentry, Jira, and your issue tracker. Replace the chaotic Sentry inbox, the triage meeting that always runs long, and the P1 bug that sat unassigned for three days.**

## The team

- **[[.agents/engineering-agent]]** — Engineering Agent. Owns data ingestion: pulls new errors from Sentry, issues from GitHub and Jira, and escalated support tickets. Computes the priority score (severity × frequency × customer impact). Orchestrates the Analyst Agent.
- **[[.agents/analyst-agent]]** — Analyst Agent. Assigns technical owners from git blame and component ownership maps, groups duplicates, flags regressions, and writes the triage report.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Daily** (Mon–Fri 09:00) | [[.jobs/daily-triage]] | Engineering Agent → Analyst Agent | Triage board in [[triage-board]] + `triage/daily-<date>.md` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-triage-report]] | Analyst Agent | Weekly triage summary in `triage/weekly-<date>.md` |

## How to run the demo

1. Open the [[triage-board]] — the bug triage board: severity-ranked table with occurrence sparkbars, affected customer counts, age, owner, and priority score. Plus an error-rate trend chart.
2. Open `triage/daily-2026-05-23.md` — today's triage digest, ready to paste into `#engineering`.

## Connectors

**Required:** Sentry (error events, affected users, stack traces), GitHub Issues or Jira (bug tickets).
**Recommended:** Linear (bug tracking), Zendesk or Intercom (support escalations), Slack (`#bugs`, `#oncall` channels), PagerDuty (severity context).

Every artifact is a file — daily triage reports in `triage/`, dated, diffable week-over-week, and feedable back into sprint planning.
