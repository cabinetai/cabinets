---
title: Performance Review
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [hr, performance, people-ops, manager-tools, enterprise, cabinet]
order: 1
---
# Performance Review

One structured packet per employee per review cycle — goals vs. results, peer feedback themes, shipped highlights, rating rubric, and growth areas — produced before the manager sits down. Three agents pull from goals, manager notes, and feedback to generate a review packet that makes the conversation better, not just the paperwork faster.

> **Keep Workday / HRIS / Lattice. Replace the blank Google Doc, the 15Five template nobody fills in thoughtfully, and the last-minute scramble to remember what someone shipped 6 months ago.**

## The team

- **[[.agents/people-ops]]** — People Ops Lead. Runs the review cycle, orchestrates the writer and QA agent, and publishes the final packet. Makes the materiality call on feedback themes.
- **[[.agents/review-writer]]** — Review Writer. Pulls goals, notes, feedback, and shipped work; drafts the performance narrative and rating rationale.
- **[[.agents/review-qa]]** — Review QA. Checks every packet for rating consistency, feedback balance, and completeness before publication.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Quarterly** (1st of Jan/Apr/Jul/Oct 09:00) | [[.jobs/quarterly-batch]] | People Ops Lead | Full batch of review packets for all active employees |
| **On-demand** | [[.jobs/per-employee-review]] | People Ops Lead | Single employee review packet on request |

## How to run the demo

1. Open the [[review-packet]] — the review artifact for a demo employee: goals vs. results, peer feedback themes, shipped highlights, rating rubric, and growth plan.
2. Browse [[reviews/]] — previous review packets, one file per employee per cycle, versioned.
3. Check [[reviews/q1-2026/priya-sharma.md]] — the demo packet for the Q1 2026 cycle.

## Connectors

**Required:** HRIS (Workday / BambooHR) for employee roster and org chart, manager notes (Notion / Drive), goal tracking (Lattice / Leapsome / Linear).
**Recommended:** Peer feedback tool (Culture Amp / Lattice), Slack (shipped-work context), GitHub/JIRA (engineering work artifacts), Gong (customer-facing work highlights).

## HR data note

Demo packets use invented names and placeholder data. In production, this cabinet reads from your HRIS and goal system. Review packets are manager-facing and confidential; access control is managed by your HRIS.
