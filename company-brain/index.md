---
title: Company Brain
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags:
  - knowledge-management
  - internal-docs
  - search
  - enterprise
  - cabinet
order: 1
---
# Company Brain

The AI-native knowledge base that makes every document findable and every question answerable. The Knowledge Manager sweeps all connected sources weekly, flags stale content, and surfaces gaps — while the Summary Agent condenses long-form documents into structured summaries for the searchable hub. Every artifact is a file: summaries, freshness scores, and Q&A answers all live on disk so you can open, diff, and share them.

> **Keep your Drive, SharePoint, Notion, and Confluence. Replace the scattered folders nobody can search, the duplicated docs nobody knows are duplicates, and the "who has the latest?" threads that happen every week.**

## The team

- **[[.agents/knowledge-manager]]** — Knowledge Manager (lead). Owns the weekly freshness sweep, decides what's stale, and orchestrates the Summary Agent.
- **[[.agents/summary-agent]]** — Summary Agent. Reads source documents and produces structured summaries, key-point extracts, and the Q&A digest written to the hub.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/knowledge-freshness-sweep]] | Knowledge Manager | Freshness report, stale-doc flags, updated hub index |
| **Weekly** (Mon 09:00) | [[.jobs/unanswered-questions-digest]] | Summary Agent | Digest of unresolved employee questions + coverage gaps |

## How to run the demo

1. Open the [[hub]] — the company knowledge hub: searchable doc cards by space/topic, recently updated, most-viewed, stale-doc flags, and an ask-a-question mockup.
2. Browse `knowledge/docs.yaml` — the demo knowledge index the hub renders from.
3. Read `knowledge/freshness-report.md` — the output the weekly sweep produces.

## Connectors

**Required:** Google Drive, Slack (for question ingestion), Notion or Confluence (existing wikis).
**Recommended:** SharePoint, GitHub (technical docs, READMEs), Guru (existing cards).
