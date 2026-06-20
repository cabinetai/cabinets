---
title: Feature Request
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [product, feature-request, prioritization, rice, enterprise, cabinet]
order: 1
---
# Feature Request

Two agents ingest feature requests from every channel — support tickets, CRM opportunity notes, Slack, and Jira epics — score each request with a RICE-style framework (Reach, Impact, Confidence, Effort) augmented by revenue impact and strategic fit, and publish a ranked board that tells PMs exactly where to focus. Every request, score, and weekly prioritization refresh is a file you can inspect and challenge.

> **Keep your Jira and your CRM. Replace the unread Canny board, the Slack thread where requests go to die, and the "we'll add it to the backlog" promise that means nothing.**

## The team

- **[[.agents/product-manager]]** — Product Manager. Owns the weekly prioritization refresh, champions the top-ranked requests into planning, and keeps the board clean.
- **[[.agents/fr-analyst]]** — Feature Request Analyst. Deduplicates incoming requests, scores each with the RICE framework, enriches with CRM ARR data, and surfaces the ranked list.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-prioritization-refresh]] | Product Manager → Analyst | Refreshed scored board in [[board]], digest in `/reports/` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-competitor-watch]] | Product Manager | Competitor feature gap analysis |

## How to run the demo

1. Open [[board]] — the RICE-scored feature request board: sortable table with score, frequency, ARR tied, segment, status, and trend.
2. Browse `/requests/log.md` — the raw deduplicated request log the Analyst maintains.
3. Open `/reports/` — the weekly prioritization digest the Product Manager publishes.

## Connectors

**Required:** Zendesk or Intercom (support ticket tags), HubSpot or Salesforce (opportunity feature fields), Jira (existing epics/backlog).
**Recommended:** Slack (`#feature-requests` channel), Linear (engineering backlog sync), Productboard (bidirectional theme sync).

> Cross-reference [[competitive-intelligence]] for competitor-launched features that may short-circuit a request.

## Every artifact is a file

Every request, its RICE score breakdown, and the weekly prioritization report live in `/requests/`, `/scores/`, and `/reports/` as inspectable markdown and YAML files.
