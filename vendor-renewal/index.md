---
title: Vendor Renewal Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [finance, procurement, saas, vendor, renewal, contracts, enterprise, cabinet]
order: 1
---
# Vendor Renewal Cabinet

One Workflow agent sweeps every vendor record each week — comparing today's date against renewal dates and notice windows — and fires alerts before cancellation deadlines pass. One Analyst reviews the monthly spend concentration, surfaces candidates for renegotiation, and maintains the living vendor registry.

> **Keep your contracts in Drive and your spend in NetSuite. Replace the Airtable nobody trusts, the Slack DMs before a renewal auto-renews, and the post-mortem on a vendor you forgot to cancel.**

## The team

- **[[.agents/workflow]]** — Renewal Workflow Agent. Owns the vendor registry at `data/vendors.csv`; sweeps renewal dates weekly; generates notice-window alerts; updates vendor status. The operational heartbeat of this cabinet.
- **[[.agents/analyst]]** — Spend Analyst. Runs the monthly spend review: concentration analysis, renewal candidates, cost-reduction opportunities. Produces the spend narrative the dashboard surfaces.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-renewal-sweep]] | Workflow Agent | Notice-window alerts in `.cabinet-state/` |
| **Monthly** (1st 09:00) | [[.jobs/monthly-spend-review]] | Analyst | Spend review in [[dashboard]] |

## How to run the demo

1. Open [[dashboard]] — the full vendor table: name, owner, annual spend, renewal date, notice-window countdown, auto-renew flag, and RAG status. Plus total-spend summary and upcoming-renewals timeline.
2. Browse `data/vendors.csv` — the source-of-truth registry the Workflow agent reads and writes.
3. Check `.cabinet-state/renewal-alerts.md` — this week's notice-window warnings.

## Connectors

**Required:** Contracts (Google Drive or DocuSign for renewal dates and notice terms), finance system (NetSuite/QuickBooks for spend actuals).
**Recommended:** Okta (usage / active users per vendor), Slack (alert delivery to `#finance` or `#procurement`), email (renewal confirmation receipts).
