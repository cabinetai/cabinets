---
title: Leadership Meeting Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags:
  - leadership-meeting
  - meeting-ops
  - action-items
  - chief-of-staff
  - enterprise
  - cabinet
order: 1
---
# Leadership Meeting Cabinet

Two agents — Meeting Summarizer and Action Tracker — run the full lifecycle of the weekly leadership meeting: prepare the brief on Monday morning, summarize decisions and actions immediately after, and chase open items every Friday. Every meeting brief, decision, and action item is a file you can share, version, and reference. The leadership team always knows who decided what and who owns what.

> **Keep Calendar, Zoom, and Slack. Replace the meeting notes doc nobody reads, the pins that scroll away, and the follow-up tracker that's always a week stale.**

## The team

- **[[.agents/meeting-summarizer]]** — Prepares the pre-meeting brief (agenda, open items, decision context) and immediately after the meeting summarizes decisions and action items into the standing record. Owns the leadership memory.
- **[[.agents/action-tracker]]** — Owns the action-item tracker. Chases overdue items every Friday, confirms completions, flags blockers, and produces the Friday status report the Chief of Staff uses to prep the next week's agenda.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 07:00) | [[.jobs/weekly-meeting-brief]] | Meeting Summarizer | Pre-meeting brief in `briefs/` with agenda, open items, and decision context |
| **Weekly** (Fri 16:00) | [[.jobs/weekly-action-chase]] | Action Tracker | Action-item chase report in `actions/` with overdue and blocked items flagged |

## How to run the demo

1. Open the [[meeting-hub]] — the leadership meeting dashboard: this week's agenda, decisions from last meeting, action tracker with owner and status, and the meeting memory feed.
2. Browse [[briefs]] — pre-meeting briefs produced each Monday; each is a dated file with the prepared agenda, relevant context, and open decisions needed.
3. Browse [[actions]] — the action tracker, updated weekly with all open, blocked, and overdue items.

## Connectors

**Required:** Google Calendar (leadership meeting invite + attendees), Zoom or Google Meet (transcript if available), Google Drive (docs referenced in agenda), Slack (leadership channel for context and async decisions).
**Recommended:** Linear or Jira (project status updates for agenda items), Notion or Confluence (runbooks and docs linked in meeting briefs), CEO operating cabinet (priorities and decisions log).

## Related cabinets

- **[[../ceo-operating]]** — CEO operating cabinet. The meeting brief draws on priorities, open risks, and the decisions log from this cabinet. Actions that require CEO-level decisions are escalated there.
