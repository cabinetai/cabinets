---
title: Customer Health Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags:
  - customer-success
  - health-scoring
  - churn-prevention
  - renewal-risk
  - enterprise
  - cabinet
order: 1
---
# Customer Health Cabinet

A live command center for your CS team: two agents — a CSM Lead and a Health Analyst — continuously monitor every account's health score, product usage, support tickets, renewal date, and relationship strength. Every Monday a full health refresh runs; at-risk accounts trigger alerts the same day they cross the risk threshold. Every signal is a file on disk, inspectable and forwardable without logging into Gainsight.

> **Keep your CRM, Zendesk, Mixpanel, and Amplitude. Replace the manual health-score spreadsheets, the stale Gainsight dashboards, and the "which accounts are at risk this quarter?" fire drill.**

## The team

- **[[.agents/csm-lead]]** — CSM Lead. Owns the account health cadence, scores the portfolio, and signs off on risk escalations and next actions.
- **[[.agents/health-analyst]]** — Health Analyst. Pulls usage, ticket, and engagement data, computes sub-scores, and surfaces statistical anomalies across the portfolio.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-health-refresh]] | CSM Lead → Analyst | Health scores refreshed for all accounts; dashboard updated |
| **Daily** (Mon–Fri 07:00) | [[.jobs/at-risk-alerting]] | CSM Lead | At-risk accounts (score ≤ 45 or usage drop > 25%) flagged to `alerts/` |
| **Weekly** (Mon 08:00) | [[.jobs/competitor-watch-cs]] | CSM Lead | Competitor-mention scan across account notes; switching risk narrative |
| **Weekly** (Mon 08:00) | [[.jobs/renewal-risk-brief]] | CSM Lead | 90/60/30-day renewal risk summary written to `accounts/renewal-risk.md` |

## How to run the demo

1. Open the [[dashboard]] — the full portfolio table: account name, health score, usage trend, open tickets, renewal date, and risk badge. Click the health-score columns to see the breakdown card per account.
2. Browse [[accounts/index]] — the living account data the agents read and update.
3. Check `alerts/` — the at-risk account feed the daily job writes.
4. Check `competitor-watch/` — competitor mention and switching-risk output.

## Connectors

**Required:** CRM (Salesforce / HubSpot), Zendesk or Intercom (support tickets), Mixpanel or Amplitude (product usage events), Slack (alert delivery).
**Recommended:** Gong (call sentiment), LinkedIn (relationship tracking), ChurnZero or Gainsight (if migrating — read-only feed).

**Cross-cabinet link:** The competitor-watch job in this cabinet cross-references [[../competitive-intelligence]] for the full competitor landscape and switching-risk context.

## Every artifact is a file

Agents write health summaries, risk narratives, and next-action plans to `accounts/`, `alerts/`, and `competitor-watch/`. Every output is a markdown file you can open, diff, forward to a CSM, or paste into a customer Slack channel — no dashboard login required.
