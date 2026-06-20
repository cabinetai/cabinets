---
title: Sprint Planning Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [engineering, sprint-planning, agile, scrum, cabinet]
order: 1
---
# Sprint Planning Cabinet

Two agents run the complete sprint-planning loop for your engineering team: before every sprint they pull the backlog from Jira or Linear, calculate capacity, surface blockers and carryover, and produce a draft sprint plan — then every morning they digest the standup signals from GitHub and Slack so blockers never stay hidden past 9 AM.

> **Keep your Jira and Linear. Replace the sprint-planning docs, the copy-paste capacity math, and the Monday "what's blocking you?" ritual.**

## The team

- **[[.agents/engineering-lead]]** — Engineering Lead. Owns the sprint plan: capacity math, goal setting, backlog candidate ranking, and the final draft. Orchestrates the Workflow Agent.
- **[[.agents/workflow-agent]]** — Workflow Agent. Pulls raw data from connected trackers (Jira, Linear, GitHub), normalizes it, and hands a clean signal set to the Engineering Lead.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Biweekly** (Mon 09:00, sprint-start weeks) | [[.jobs/sprint-planning-prep]] | Engineering Lead | Sprint plan in [[board]] |
| **Daily** (Mon–Fri 09:00) | [[.jobs/daily-standup-digest]] | Workflow Agent | Standup digest in `standup/latest.md` |

## How to run the demo

1. Open the [[board]] — the sprint plan board showing the current sprint goal, capacity vs committed points, backlog candidates by priority, carryover tickets, blockers, and burndown projection.
2. Open `standup/latest.md` — today's standup digest: what shipped overnight, what's stuck, PR queue age.

## Connectors

**Required:** Jira or Linear (backlog + sprint data), GitHub (PR status, commit activity).
**Recommended:** Slack (`#engineering`, `#standups` channels), PagerDuty (on-call context for capacity), Notion or Confluence (sprint retrospectives).

Every artifact is a file — the sprint plan, the daily digest, and the capacity worksheet all live on disk where you can diff them, forward them, and feed them back into the next sprint.
