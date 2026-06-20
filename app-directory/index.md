---
title: App Directory Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [it, saas-management, asset-management, software-inventory, enterprise, cabinet]
order: 1
---
# App Directory Cabinet

A living, always-current inventory of every SaaS application your organization pays for — who owns it, how many people use it, what it costs annually, when the renewal lands, whether SSO is enforced, and whether the utilization justifies the spend. No more renewal surprises. No more paying for apps nobody logs into. Every artifact is a file.

> **Keep Okta, Entra, and your finance system as the systems of record. Replace the stale spreadsheet nobody trusts, the renewal calendar nobody updates, and the shadow-IT apps nobody tracks.**

## The team

- **[[.agents/app-workflow]]** — App Workflow Agent (lead). Orchestrates the weekly inventory refresh: pulls app data from Okta, Entra, and finance feeds; reconciles changes; flags new shadow-IT apps; updates the directory.
- **[[.agents/app-analyst]]** — App Analyst. Runs the cost and utilization analysis: identifies underused apps (low login rate vs. license count), upcoming renewals requiring a decision, and duplicate-category spend worth consolidating.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-inventory-refresh]] | App Workflow | Updated `data/apps.csv`, change log in `/reports/` |
| **Monthly** (1st 09:00) | [[.jobs/monthly-cost-review]] | App Analyst | Cost & renewal report in `/reports/monthly-cost-review.md` |

## How to run the demo

1. Open the [[directory]] — the full SaaS app directory: every app with owner, user count, annual cost, renewal date, SSO status, and utilization percentage. Includes spend summary and underused-apps callout.
2. Browse `data/apps.csv` — the raw inventory the agents maintain.
3. Open `/reports/monthly-cost-review.md` — the monthly spend and renewal analysis.

## Connectors

**Required:** Okta or Microsoft Entra (app catalog, SSO assignments, login activity), Finance system or procurement tool (contract cost, renewal dates).
**Recommended:** HRIS (headcount for per-seat cost calculations), Google Workspace (Drive + Gmail app usage data), BetterCloud or Torii (SaaS management signals), Stripe or expense tools (shadow-IT detection via card charges).
