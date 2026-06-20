---
title: Roadmap
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [product, roadmap, planning, strategy, enterprise, cabinet]
order: 1
---
# Roadmap

Two agents synthesize goals, customer feedback, engineering capacity, and business impact data into a structured roadmap proposal — with confidence ratings, linked evidence, and theme groupings — then publish a living roadmap view that stays current between planning cycles. Every roadmap item, its evidence trail, and the weekly refresh are inspectable files.

> **Keep your Jira and your Linear. Replace the quarterly roadmap deck that's stale before it's presented, the spreadsheet nobody agrees on, and the "where are we on that?" stand-up question that derails 20 minutes every Friday.**

## The team

- **[[.agents/product-lead]]** — Roadmap Lead. Owns the roadmap proposal, translates goals and feedback into themed initiatives, decides Now/Next/Later placement, and publishes the weekly refresh.
- **[[.agents/roadmap-analyst]]** — Roadmap Analyst. Maps feedback themes to roadmap items, estimates capacity impact, calculates business case confidence, and surfaces evidence trails per item.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-roadmap-refresh]] | Roadmap Lead → Analyst | Updated roadmap view in [[roadmap]], refresh notes in `/reports/` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-competitor-watch]] | Roadmap Lead | Competitor roadmap gaps in `/competitor-watch/` |

## How to run the demo

1. Open [[roadmap]] — the Now/Next/Later roadmap board: themed initiatives with confidence bars, linked evidence, and capacity indicators.
2. Browse `/initiatives/` — the structured initiative files with full evidence trails.
3. Open `/reports/` — the weekly refresh notes with changes and reasoning.

## Connectors

**Required:** Jira or Linear (engineering backlog + capacity), CRM (ARR data for business case), customer feedback (VoC cabinet).
**Recommended:** Productboard (theme sync), BI tool (usage metrics, retention by feature), Figma (design status).

> Cross-reference [[competitive-intelligence]] for competitor roadmap signals, and [[voice-of-customer]] for the feedback themes that inform each initiative.

## Every artifact is a file

Every initiative, evidence file, and weekly refresh lives in `/initiatives/`, `/evidence/`, and `/reports/` as inspectable markdown. The roadmap view reflects these files — never the reverse.
