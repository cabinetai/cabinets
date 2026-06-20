---
title: Hiring Pipeline
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [hr, recruiting, talent-ops, pipeline, enterprise, cabinet]
order: 1
---
# Hiring Pipeline

The talent operations command center for recruiting leads. Two agents track every open role from approval to offer — funnel health, stage bottlenecks, time-to-fill trends, recruiter priorities, and headcount plan vs. actual — and produce a weekly pipeline report that replaces the Sheets tracker nobody keeps current.

> **Keep Greenhouse / Lever / Ashby / Workday. Replace the Notion hiring plan, the Google Sheets funnel tracker, and the "where are we on the SWE roles?" Slack thread that spawns every Monday.**

## The team

- **[[.agents/people-ops]]** — People Ops Lead. Owns the pipeline report, interprets bottlenecks, and calls out risks to the headcount plan. Runs the weekly report and escalates stalled candidates.
- **[[.agents/pipeline-analyst]]** — Pipeline Analyst. Pulls raw ATS data, computes funnel metrics, time-to-fill, and offer/accept rates; surfaces stage bottlenecks and outlier candidates.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-pipeline-report]] | People Ops Lead | Pipeline report in `reports/week-<n>.md` + dashboard refresh |
| **Daily** (Mon–Fri 09:00) | [[.jobs/daily-stalled-check]] | Pipeline Analyst | Stalled candidates alert in `alerts/stalled-<date>.md` |

## How to run the demo

1. Open the [[pipeline-dashboard]] — open roles table, funnel by stage, time-to-fill KPIs, bottleneck flags, offer/accept rate, and headcount plan vs. actual.
2. Browse [[reports/]] — weekly pipeline reports, one per week.
3. Check [[data/roles.md]] — the open role tracker that the jobs read from.

## Connectors

**Required:** ATS (Greenhouse / Lever / Ashby) for candidate stage data, Workday / HRIS for approved headcount.
**Recommended:** Slack (`#recruiting` channel updates), Google Calendar (debrief scheduling), Notion / Confluence (hiring plan docs).

## HR data note

Demo data uses invented role names and funnel numbers. Candidate names are not tracked in the pipeline dashboard — the ATS is the system of record for individual candidates.
