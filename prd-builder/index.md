---
title: PRD Builder
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [product, prd, requirements, documentation, enterprise, cabinet]
order: 1
---
# PRD Builder

Three agents collaborate to produce a complete, engineering-ready PRD from a brief: the Product Manager extracts problem and goal, the Writer drafts the structured document, and the QA agent runs a completeness check before handoff. Every PRD section — problem, users, user stories, requirements, success metrics, risks, open questions — is a file, diffable, and linkable from Jira.

> **Keep your Jira and your Figma. Replace the half-empty Google Doc that lives in 12 copies, the PRD template nobody fills in properly, and the "can you clarify the requirements?" back-and-forth that delays engineering by two sprints.**

## The team

- **[[.agents/product-manager]]** — Product Manager. Defines problem, goal, user segments, and success metrics. Runs the PRD initiation session and owns the final document.
- **[[.agents/product-writer]]** — Product Writer. Drafts the full PRD structure from the PM's brief: problem statement, users, user stories, functional requirements, non-functional requirements, risks, and open questions.
- **[[.agents/prd-qa]]** — PRD QA. Runs a section-by-section completeness check: missing acceptance criteria, vague requirements, undefined success metrics, unresolved risks, and open questions older than 48h.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **On-demand** | [[.jobs/generate-prd]] | Product Manager → Writer → QA | New PRD in [[prd]], source in `/prds/` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-prd-qa]] | PRD QA | Completeness audit of all open PRDs in `/prds/` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-competitor-watch]] | Product Manager | Competitor feature precedents for open PRDs |

## How to run the demo

1. Open [[prd]] — the PRD document view: problem, goal, users, user stories, requirements table, success metrics, risks, and open questions — formatted as a structured report.
2. Browse `/prds/` — the source markdown PRDs the agents generate and maintain.
3. Open `/qa-reports/` — the weekly completeness audit reports.

## Connectors

**Required:** Jira or Linear (link PRDs to epics), customer feedback (VoC + Feature Request cabinets).
**Recommended:** Figma (design links embedded in requirements), Slack (share PRD for async review), Confluence (export for wider team).

> Cross-reference [[competitive-intelligence]] for competitor feature precedents when writing requirements.

## Every artifact is a file

Every PRD is a standalone markdown file in `/prds/<feature-slug>.md`. The webapp renders the latest PRD from that file. QA reports are in `/qa-reports/`. Nothing is locked in a UI.
