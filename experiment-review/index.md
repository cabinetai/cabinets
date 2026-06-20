---
title: Experiment Review
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [product, experimentation, growth, data, ab-testing, enterprise, cabinet]
order: 1
---
# Experiment Review

Two agents track every A/B test from hypothesis to decision: the Analyst pulls metrics, calculates statistical significance, and produces the readout; the Product agent reviews results, makes the ship/kill/iterate call, and logs learnings to the experiment library. Every experiment, its hypothesis, variants, metric results, and decision is a file — searchable, diffable, and referenceable in future PRDs.

> **Keep your Mixpanel, Amplitude, or Statsig. Replace the experiment results Notion doc nobody finishes, the "what did we learn from that test?" Slack thread that goes 3 months unanswered, and the "we tried that before" comment in planning with no evidence behind it.**

## The team

- **[[.agents/growth-analyst]]** — Growth Analyst. Owns experiment metric collection, statistical analysis, confidence interval calculation, and the structured readout per experiment.
- **[[.agents/product-scientist]]** — Product Scientist. Reviews analysis, makes the ship/kill/iterate decision, documents learnings, and maintains the experiment library as a reference for future decisions.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-experiment-review]] | Growth Analyst → Product Scientist | Updated experiment readouts in [[readout]], decisions logged in `/experiments/` |
| **On-demand** | [[.jobs/per-experiment-readout]] | Growth Analyst | Full readout for a single completed experiment |

## How to run the demo

1. Open [[readout]] — the experiment readout view: hypothesis, variants A/B with metric lift, confidence interval bars, statistical significance, ship/kill/iterate decision, learnings, and the full experiment log table.
2. Browse `/experiments/` — structured experiment files the agents maintain.
3. Open `/learnings/` — the extracted learning log the Product Scientist curates.

## Connectors

**Required:** Mixpanel, Amplitude, or Statsig (experiment results, metric data), Jira or Linear (link experiments to features).
**Recommended:** Slack (post readouts to `#experiments` channel), BI tool (custom metric queries), Segment (event taxonomy alignment).

> Cross-reference [[competitive-intelligence]] for competitor product changes that may confound experiment results.

## Every artifact is a file

Every experiment is a structured markdown file in `/experiments/<slug>.md`. Readouts are written there first; the webapp renders from the file. The experiment library in `/learnings/` is the institutional memory.
