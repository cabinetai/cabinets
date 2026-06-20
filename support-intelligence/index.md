---
title: Support Intelligence Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [support, cx-ops, ticket-clustering, insights, enterprise, cabinet]
order: 1
---
# Support Intelligence Cabinet

Two agents scan every inbound ticket, cluster recurring issues by theme, detect emerging problems before they hit the queue at scale, and ship a weekly Support Insights Report with CSAT trends, deflection rates, and concrete recommendations. Every cluster, every tagged ticket, and every report is a file you can open, share, and act on.

> **Keep Zendesk or Intercom. Replace the manual tagging, the Explore dashboards nobody interprets, and the "why do customers keep asking about X?" Slack thread nobody resolves.**

## Why this template

Most support teams have ticket volume data but not insight data. They know they're busy; they don't know *why*. This cabinet makes the ticket analysis a **standing operation**: clusters are rebuilt daily, trends are surfaced weekly, and the product and engineering teams always have a sourced view of the top pain points — not a survey, a living analysis of real tickets.

## The team

- **[[.agents/ticket-cluster-analyst]]** — Ticket Cluster Analyst. Runs the daily clustering pass, tags tickets by theme, detects volume spikes, and flags emerging issues before they become incidents.
- **[[.agents/insights-synthesizer]]** — Insights Synthesizer. Owns the weekly Support Insights Report: pulls the week's clusters, CSAT, deflection metrics, and draft product pain recommendations. Orchestrates the final publish.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Daily** (Mon–Fri 09:00) | [[.jobs/daily-ticket-cluster-scan]] | Ticket Cluster Analyst | Updated cluster list in `/clusters/`, emerging issues flagged |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-insights-report]] | Insights Synthesizer | Support Insights Report in [[dashboard]] |

## How to run the demo

1. Open the [[dashboard]] — ticket volume trend, top issue clusters with counts and sentiment, emerging issues, CSAT, and deflection rate at a glance.
2. Browse `/clusters/` — each file is a labelled ticket cluster with representative tickets, volume, and trend.
3. Open `/reports/` — the weekly insights report the Synthesizer writes each Monday.

## Connectors

**Required:** Zendesk, Intercom, or Freshdesk (ticket export via API).
**Recommended:** Jira or Linear (link clusters to product backlog), Slack (`#support-insights` channel), CSAT/NPS survey tool (for satisfaction data overlay).

## Demo data

| Cluster | Volume (7d) | Trend | Sentiment |
|---|---|---|---|
| Billing — invoice confusion | 142 | ↑ +34% | Negative |
| Onboarding — SSO setup | 87 | ↑ +18% | Mixed |
| API — rate limit errors | 64 | ↑ +52% | Negative |
| Export — CSV format issues | 41 | → Stable | Neutral |
| Mobile — iOS login loop | 38 | ↑ New | Negative |

**Every cluster is a file in `/clusters/`. Every insight in the dashboard links to its cluster file.**
