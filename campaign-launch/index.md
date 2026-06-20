---
title: Campaign Launch Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [marketing, campaign, launch, growth, enterprise, cabinet]
order: 1
---
# Campaign Launch Cabinet

One room for every campaign: brief, assets, copy, channels, budget, owners, timeline, and post-launch metrics — all in one place, always current. The Campaign Manager agent runs the weekly status, chases overdue tasks, and publishes the launch-day checklist so nothing ships broken.

> **Keep your ad platforms, your project tracker, your Drive. Replace the Notion campaign doc nobody updates, the Slack thread of "is that asset done?", and the post-mortem that never gets written.**

## The team

- **[[.agents/campaign-manager]]** — Campaign Manager. Lead orchestrator. Owns the campaign room, the launch checklist, and the status cadence. Sequences the Writer and reconciles copy against brief.
- **[[.agents/campaign-writer]]** — Campaign Writer. Drafts and iterates all campaign copy: headlines, CTAs, ad copy, email subject lines, landing page body. Writes to brief; doesn't decide budget or owners.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-campaign-status]] | Campaign Manager | Weekly status update in [[campaign-room]] |
| **Daily** (Mon–Fri 09:00) | [[.jobs/daily-checklist-chase]] | Campaign Manager | Overdue asset/task chase log in `status/daily-chase.md` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-competitor-watch]] | Campaign Manager | Competitor campaign signals in `competitor-watch/` |

## How to run the demo

1. Open [[campaign-room]] — the live campaign room: countdown to launch, asset/channel checklist with owners, budget allocation, timeline, and post-launch metrics.
2. Review `campaigns/q3-brand-refresh.md` — the active campaign brief the agents work from.
3. Skim `status/daily-chase.md` — the overdue task log the daily job writes.

## Connectors

**Required:** Google Drive (assets, briefs), Figma (design files), Slack (notifications), ad platforms (Meta Ads, Google Ads).
**Recommended:** Asana or Linear (task sync), HubSpot (UTM / attribution), Notion (historical briefs).
