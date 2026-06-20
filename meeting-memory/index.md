---
title: Meeting Memory
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags:
  - meetings
  - action-items
  - decisions
  - chief-of-staff
  - enterprise
  - cabinet
order: 1
---
# Meeting Memory

Captures every meeting as structured memory: a clean summary, every decision recorded with context, every action item assigned to an owner with a due date. The Meeting Summarizer processes transcripts and notes each morning; the Action Tracker chases open items and publishes the weekly follow-up report. Every meeting is a file — searchable, diffable, and linkable from Slack or your project tool.

> **Keep your calendar, Zoom, Meet, and Teams. Replace the Fellow notes layer, the scattered Otter transcripts, and the forgotten action items nobody owns.**

## The team

- **[[.agents/meeting-summarizer]]** — Meeting Summarizer (lead). Processes transcripts and calendar metadata each morning, writes structured summaries, decisions, and action items to `meetings/`.
- **[[.agents/action-tracker]]** — Action Tracker. Monitors open action items across all meetings, sends the weekly follow-up report, and escalates items overdue by more than 7 days.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Daily** (Mon–Fri 09:00) | [[.jobs/daily-meeting-capture]] | Meeting Summarizer | Structured meeting files in `meetings/` for every previous-day meeting |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-action-followup]] | Action Tracker | Action-item follow-up report: overdue, due-this-week, completed |

## How to run the demo

1. Open the [[log]] — the meeting memory log: meetings list with summary, decisions, action items by owner and status; rollup of all open actions and recent decisions.
2. Browse `meetings/` — the structured meeting files the daily job produces.
3. Read `meetings/action-items.yaml` — the action-item ledger the Action Tracker maintains.

## Connectors

**Required:** Google Calendar or Outlook (meeting metadata), Zoom/Meet/Teams (transcripts or recordings).
**Recommended:** Slack (action-item notifications), Notion or Linear (push action items to project tools), Gong (sales call transcripts).
