---
title: KPI Narrative Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [data, analytics, kpi, metrics, narrative, enterprise, cabinet]
order: 1
---
# KPI Narrative Cabinet

Every Monday morning, two agents turn last week's dashboard numbers into a clear, sourced, plain-English narrative: what moved, why it moved, and what the business should do about it. Anomalies are flagged daily before anyone opens Slack. Every narrative is a file you can open, share, and archive.

> **Keep Looker, Tableau, Snowflake, and BigQuery. Replace the manual metric docs, the "does anyone know why DAU dropped?" threads, and the copy-paste ritual before the Monday all-hands.**

## The team

- **[[.agents/analyst]]** — Analyst. Lead orchestrator. Reads the raw metric exports, runs anomaly detection, decides what is significant vs. noise, and sequences the Writer. Owns the final narrative quality gate.
- **[[.agents/writer]]** — Narrative Writer. Takes the Analyst's structured findings and writes plain-English business explanations with context, comparisons, and actionable callouts — no jargon, no raw numbers without meaning.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-kpi-narrative]] | Analyst → Writer | KPI narrative report in [[narratives/]] + dashboard updated |
| **Daily** (Mon–Fri 09:00) | [[.jobs/daily-anomaly-scan]] | Analyst | Anomaly log in [[narratives/anomalies.md]], dashboard flagged |

## How to run the demo

1. Open the [[dashboard]] — KPI tiles with WoW deltas, SVG sparklines, plain-English "what changed & why" notes, and flagged anomalies.
2. Browse [[narratives/]] — the weekly narrative reports the jobs produce, archived and diffable.
3. Check [[narratives/anomalies.md]] — the rolling anomaly log from the daily scan.
4. Review [[data/kpis.csv]] — the demo metric export the agents read from.

## Connectors

**Required:** Looker, Tableau, Power BI, or Metabase (dashboard exports / API); Snowflake or BigQuery (underlying tables).
**Recommended:** Slack (post narrative summaries to `#data` or `#leadership`); Google Sheets (metric export target); dbt (lineage + freshness context).

**Every artifact is a file.** The narrative, the anomaly log, and the archived reports live as plain files in this cabinet — readable, diffable, and forwardable without a BI tool login.
