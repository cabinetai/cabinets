---
title: Voice of Customer
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [product, voice-of-customer, feedback, insights, enterprise, cabinet]
order: 1
---
# Voice of Customer

Three agents sweep every feedback channel — Zendesk tickets, Gong call transcripts, App Store reviews, Intercom conversations, and Slack DMs — cluster the noise into ranked themes, and attach revenue impact to each. Every cluster, verbatim, and weekly digest is a file you can open, diff, and paste straight into a planning doc.

> **Keep your Zendesk, your Gong, your CRM. Replace the feedback spreadsheet nobody trusts, the quarterly survey that's always three months late, and the "customers keep asking for X" Slack thread with no numbers behind it.**

## The team

- **[[.agents/product-lead]]** — VoC Lead. Owns the weekly theme digest and revenue-impact scoring. Orchestrates the Insights and Analyst agents.
- **[[.agents/customer-insights]]** — Customer Insights. Reads raw feedback daily, tags each item by source/type/segment, and maintains the verbatim log.
- **[[.agents/voc-analyst]]** — VoC Analyst. Clusters tagged feedback into themes, calculates mention frequency, and estimates revenue impact from CRM data.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Daily** (Mon–Fri 09:00) | [[.jobs/daily-feedback-intake]] | Customer Insights | New feedback tagged and appended to `/feedback/log.md` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-theme-clustering]] | VoC Lead → Analyst | Ranked theme report in [[dashboard]], digest in `/digests/` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-competitor-watch]] | VoC Lead | Competitor sentiment cut from reviews + calls |

## How to run the demo

1. Open [[dashboard]] — the VoC command center: theme clusters with mention counts, source breakdown, revenue impact bars, sentiment trend, and top verbatims.
2. Browse `/feedback/log.md` — the raw tagged feedback the daily intake job builds.
3. Open `/digests/` — the weekly digest the VoC Lead publishes each Monday.

## Connectors

**Required:** Zendesk (support tickets), Intercom (chat), Gong (call transcripts), App Store / Google Play reviews.
**Recommended:** HubSpot or Salesforce (account/MRR enrichment for revenue-impact scoring), Slack (`#customer-feedback` channel), Productboard (sync themes as insights).

> Cross-reference [[competitive-intelligence]] for competitor mentions surfaced in customer feedback.

## Every artifact is a file

Agents write every theme cluster, verbatim, and digest to `/feedback/`, `/themes/`, and `/digests/` as plain markdown files. Nothing lives only in a UI — open, diff, forward, or reference any artifact directly.
