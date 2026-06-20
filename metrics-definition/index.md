---
title: Metrics Definition Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [data, analytics, metrics, glossary, dbt, enterprise, cabinet]
order: 1
---
# Metrics Definition Cabinet

The single source of truth for every metric the business uses. Each metric card specifies the business definition, the formula, the source table, the dbt model, the owner, freshness SLA, and certified status. Two agents ensure definitions stay current and certified — the Researcher who drafts and maintains, and the QA agent who challenges ambiguity and prevents duplicate definitions. Every metric is a file.

> **Keep dbt, BigQuery, Snowflake, and your BI tools. Replace the Notion metric glossary that's 6 months out of date, the Slack thread where "ARR" means three different things, and the Friday afternoon "wait, how does that number get calculated?" panic.**

## The team

- **[[.agents/research]]** — Metrics Researcher. Lead orchestrator. Drafts new metric definitions, maintains the certified glossary, and sequences the QA reviewer. Owns definition quality and the weekly review cycle.
- **[[.agents/qa]]** — Definition QA. Challenges every proposed definition for ambiguity, edge cases, and conflicts with existing metrics. Nothing gets certified without QA sign-off.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-definition-review]] | Researcher → QA | Reviewed + updated metric cards in [[glossary/]] |
| **On-demand** | [[.jobs/metric-certification]] | Researcher → QA | Certified badge applied to metric card; changelog updated |

## How to run the demo

1. Open the [[glossary]] — searchable metric cards: name, definition, formula, source table, owner, freshness, certified status. Filter by domain (Revenue, Growth, Retention, Engagement).
2. Browse [[glossary/metrics/]] — the YAML metric definition files the glossary renders.
3. Check [[glossary/changelog.md]] — the certification and update history.
4. Review the [[.jobs/metric-certification]] job to see how on-demand certification works.

## Connectors

**Required:** dbt (model lineage + freshness), BigQuery or Snowflake (source tables).
**Recommended:** Looker or Metabase (metric usage context), Notion or Confluence (link back to this glossary), Slack (post certification announcements to `#data`).

**Every metric is a file.** YAML definition cards in `glossary/metrics/` are the source of truth — the webapp renders them, dbt docs link to them, and the QA agent diffs them on every review cycle.
