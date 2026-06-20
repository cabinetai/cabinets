---
title: Decision Log Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [decisions, chief-of-staff, governance, leadership, enterprise, cabinet]
order: 1
---
# Decision Log Cabinet

Two agents extract and preserve every material decision your leadership team makes — from Slack threads, meeting notes, email, and documents — into a searchable decision register with owner, rationale, consequences, reversibility, and linked context. Every decision is a file you can search, audit, and forward.

> **Keep your Slack, your meetings, your email. Replace the Notion decision page nobody updates, the Confluence page someone made three years ago, and the "wait, when did we decide that?" moment before every board prep.**

## The team

- **[[.agents/decision-extractor]]** — Decision Extractor (lead). Sweeps meeting notes, Slack channels, and linked documents every week, extracts material decisions, classifies them, and writes them to `data/decisions.yaml`. Orchestrates the reviewer.
- **[[.agents/decision-reviewer]]** — Decision Reviewer. QA pass on every extraction: verifies owner is named, rationale is present, reversibility is stated, no duplicates, formatting is clean. Returns decisions to the extractor if incomplete.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-decision-sweep]] | Decision Extractor | New decisions added to `data/decisions.yaml` · register updated |

## How to run the demo

1. Open [[register]] — the searchable decision register: table of decisions filterable by status, owner, department, reversibility.
2. Inspect `data/decisions.yaml` — the machine-readable source the register renders from.
3. Browse `data/raw/` — meeting notes and Slack excerpts the extractor processes.

## Connectors

**Required:** Slack (channels: #leadership, #product, #engineering, #all-hands), meeting notes (Google Docs or Notion), email threads (Google Workspace or Outlook).
**Recommended:** Notion or Confluence (linked decision context), calendar (meeting attendee list for decision ownership), Jira (decisions that spawn work items).

**Replaces:** Notion decision pages, Confluence decision records, Google Docs decision logs, and the tribal memory that lives only in people's heads.
