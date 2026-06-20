---
title: CEO Operating Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags:
  - ceo
  - operating-cadence
  - leadership
  - decisions
  - enterprise
  - cabinet
order: 1
---
# CEO Operating Cabinet

Three agents — Chief of Staff, Operating Analyst, and Workflow Manager — run your company's operating rhythm. Every priority, decision, risk, and follow-up is a file you can open, diff, and forward to the leadership team. The weekly leadership memo is generated automatically from live data, not assembled from Slack threads.

> **Keep Slack, Calendar, and Drive. Replace the Notion company hub, the Coda OKR doc, and the leadership tracker nobody updates.**

## The team

- **[[.agents/chief-of-staff]]** — Orchestrates the operating cadence. Sets priorities, decides what the CEO sees each week, and reconciles inputs from the Analyst and Workflow Manager into the weekly leadership memo.
- **[[.agents/operating-analyst]]** — Pulls company KPIs, surfaces risks, and maintains the decisions log. Does not write the memo — feeds it.
- **[[.agents/workflow-manager]]** — Owns the action-item tracker. Chases overdue items, confirms completions, and flags blockers to the Chief of Staff before each leadership meeting.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Daily** (Mon–Fri 08:00) | [[.jobs/daily-priority-scan]] | Chief of Staff | Top-3 priorities + open blockers refreshed in `dashboard/` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-leadership-memo]] | Chief of Staff → All | Weekly leadership memo in `memos/` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-competitor-watch]] | Operating Analyst | Competitor cut for leadership in `competitor-watch/` |
| **Weekly** (Fri 16:00) | [[.jobs/weekly-action-chase]] | Workflow Manager | Action-item chase; overdue items flagged in `actions/` |

## How to run the demo

1. Open the [[dashboard]] — the operating-cadence command center: top company priorities, decisions log, risk register, action tracker, and company KPIs.
2. Browse [[memos]] — the weekly leadership memo the Chief of Staff job produces each Monday.
3. Browse [[decisions]] — the standing decisions log; every call with context, owner, and date.
4. Browse [[risks]] — the live risk register with severity, owner, and mitigation status.
5. Browse [[actions]] — every open action item with owner, due date, and status.

## Connectors

**Required:** Slack (leadership channel, decision threads), Google Calendar (leadership cadence), Google Drive (board docs, OKR files).
**Recommended:** BI/analytics tool (Looker, Metabase), Jira/Linear (project status), CRM (pipeline snapshot for the memo), Workday (headcount view).

## Related cabinets

- **[[../competitive-intelligence]]** — Full competitor landscape the Operating Analyst draws the competitor-watch cut from. See the weekly competitor watch job for details.
- **[[../board-memo]]** — Quarterly board memo generated from this cabinet's decisions, KPIs, and risk register.
- **[[../leadership-meeting]]** — Meeting brief and action tracker for the weekly leadership meeting.
