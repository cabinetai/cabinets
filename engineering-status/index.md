---
title: Engineering Status Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [engineering, status-update, weekly-update, github, jira, cabinet]
order: 1
---
# Engineering Status Cabinet

One cabinet, two agents, one Monday-morning engineering update. The Engineering Agent pulls the last week of GitHub activity, Jira completions, and blocked tickets; the Summary Agent shapes it into a structured status report covering what shipped, what slipped, what's blocked, and what needs leadership attention — ready before the standup.

> **Keep your GitHub, GitLab, and Jira. Replace the weekly engineering update doc nobody wants to write and the Slack thread that answers the same five questions every Monday.**

## The team

- **[[.agents/engineering-agent]]** — Engineering Agent. Owns data extraction: PRs merged, issues closed, deploys, and blockers from GitHub, Jira, and Linear. Calls on the Summary Agent when the raw set is ready.
- **[[.agents/summary-agent]]** — Summary Agent. Shapes the raw engineering signals into a publishable status update and renders the [[dashboard]].

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-engineering-update]] | Engineering Agent → Summary Agent | Engineering status in [[dashboard]] + `status/latest.md` |

## How to run the demo

1. Open the [[dashboard]] — the engineering status dashboard: shipped this week, slipped, blocked, PR throughput chart, deploy frequency, and attention-needed items for leadership.
2. Open `status/latest.md` — the Markdown version, ready to paste into Slack or email.

## Connectors

**Required:** GitHub or GitLab (PRs, commits, deploy tags), Jira or Linear (issue completions, blockers).
**Recommended:** Slack (post the update automatically to `#engineering-updates`), DataDog / Grafana (uptime/error-rate KPIs), PagerDuty (incident count).

Every artifact is a file — the weekly status is written to `status/` with a date prefix so you can diff week-over-week and spot trends.
