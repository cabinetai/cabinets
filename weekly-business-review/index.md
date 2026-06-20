---
title: Weekly Business Review Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [wbr, operations, business-review, revenue, enterprise, cabinet]
order: 1
---
# Weekly Business Review Cabinet

Two agents auto-generate the weekly business review (WBR): a cross-functional memo covering revenue, product, support, engineering, and finance — with week-over-week deltas, narrative context, and a competitive watch section. Every WBR is a file that lives in `data/`, is version-controlled, and can be forwarded or published without editing.

> **Keep your Slack, your Jira, your CRM. Replace the 45-minute Friday "what are we reporting?" scramble, the deck nobody updates, and the meeting that could have been a memo.**

## The team

- **[[.agents/wbr-analyst]]** — WBR Analyst (lead). Pulls metrics from connected systems, computes WoW deltas, validates data, and assembles the structured WBR dataset. Orchestrates the Narrator.
- **[[.agents/wbr-narrator]]** — WBR Narrator. Reads the analyst's dataset and writes the polished WBR memo with narrative context, cross-functional themes, and decisions surfaced for leadership.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-wbr]] | WBR Analyst → Narrator | WBR memo in `data/wbr-YYYY-WW.md` · dashboard updated |
| **Weekly** (Mon 08:30) | [[.jobs/competitor-watch]] | WBR Analyst | Competitor watch section appended to WBR · `data/competitor-watch.md` updated |

## How to run the demo

1. Open [[review]] — the WBR dashboard showing cross-functional KPIs with WoW deltas, a narrative summary, and the competitive pulse.
2. Read `data/wbr-2026-21.md` — this week's WBR memo the Narrator produced.
3. See `data/competitor-watch.md` — the competitive signals pulled for this week.

## Connectors

**Required:** Slack (product + eng weekly notes), Jira (sprint metrics), CRM / Salesforce (revenue + pipeline), BI / Looker (cross-functional KPIs), Finance (P&L snapshot).
**Recommended:** Zendesk or Intercom (support metrics), GitHub (eng metrics), Google Drive (doc distribution).

**Competitive intelligence:** Links to the [[../competitive-intelligence]] cabinet for the full competitor landscape. The WBR competitor-watch job pulls the weekly signal cut from that cabinet.

**Replaces:** 15Five check-ins, Friday team updates, Docs, Slides, and the weekly prep meeting that consumes a Friday afternoon.
