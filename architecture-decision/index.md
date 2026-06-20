---
title: Architecture Decision Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [engineering, architecture, adr, design-decisions, documentation, cabinet]
order: 1
---
# Architecture Decision Cabinet

A living ADR library that maintains every architecture decision — context, decision, consequences, status, owner, and diagram links — in one searchable place. The Engineering Agent drafts new ADRs on demand; the Research Agent validates them against existing decisions for contradictions before they're accepted.

> **Keep your GitHub and docs. Replace the Confluence page nobody updates, the ADR that lives only in someone's head, and the architecture discussion that never gets written down.**

## The team

- **[[.agents/engineering-agent]]** — Engineering Agent. Owns ADR drafting: takes a decision prompt and produces a complete ADR with context, decision, consequences, alternatives considered, and status. Orchestrates the Research Agent for consistency checking.
- **[[.agents/research-agent]]** — Research Agent. Reviews new ADR drafts against the existing library: flags contradictions with accepted decisions, surfaces related ADRs, and recommends cross-references.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **On-demand** (per ADR) | [[.jobs/per-adr-draft]] | Engineering Agent → Research Agent | ADR in [[adr-library]] + `adrs/<id>-<slug>.md` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-adr-review]] | Research Agent | ADR status review in `adrs/review-latest.md` |

## How to run the demo

1. Open the [[adr-library]] — the ADR library with status filter (Accepted / Proposed / Superseded), sortable list, and detail view for ADR-007: Adopt event-sourcing for the audit log.
2. Open `adrs/007-event-sourcing-audit-log.md` — the markdown ADR artifact the Engineering Agent produced.

## Connectors

**Required:** GitHub (ADRs committed as Markdown to the repo, decisions linked to PRs).
**Recommended:** Slack (`#architecture` channel for discussion threads linked from each ADR), Notion or Confluence (mirror published ADRs), Mermaid / Excalidraw (diagram links in each ADR).

Every artifact is a file — ADRs live in `adrs/` numbered sequentially, checked into version control, and diffable like any code change.
