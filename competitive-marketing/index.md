---
title: Competitive Marketing Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [marketing, competitive-intelligence, pmm, battlecards, positioning, enterprise, cabinet]
order: 1
---
# Competitive Marketing Cabinet

The marketing arm of competitor intelligence. This cabinet tracks what competitors say, how they advertise, where they rank, and how their messaging shifts — then turns it into a weekly competitive marketing brief and daily content/ad watch. Distinct from the full competitive landscape: this is the PMM and marketing-team view.

> **Keep your CRM and Gong. Replace the Klue-lite spreadsheet, the stale Notion competitor pages, and the "what are Northwind running on LinkedIn this week?" question that takes a day to answer.**

## Relationship to the flagship intel cabinet

> **This cabinet is the marketing-specific cut.** For the full competitive landscape — pricing moves, product launches, funding, hiring signals, win/loss themes, and battlecards for the sales team — see the flagship **[[../competitive-intelligence]]** cabinet. That one owns the complete picture; this one is the PMM's workbench.

## The team

- **[[.agents/competitive-researcher]]** — Competitive Researcher. Lead orchestrator. Sweeps competitor websites, ad libraries, social, and content daily. Maintains per-competitor marketing profiles. Sequences the Analyst.
- **[[.agents/competitive-analyst]]** — Competitive Marketing Analyst. Synthesizes research into the weekly brief — messaging delta, campaign presence, SERP footprint, share of voice, and the "so what for our campaigns" implication.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-competitive-marketing-brief]] | Researcher → Analyst | Weekly brief in [[competitive-brief]] + `briefs/weekly-<date>.md` |
| **Daily** (Mon–Fri 09:00) | [[.jobs/daily-competitor-content-watch]] | Competitive Researcher | Daily content/ad watch log in `signals/daily-<date>.md` |

## How to run the demo

1. Open [[competitive-brief]] — the competitive marketing brief: per-competitor messaging and positioning, campaign/ad presence, content/SEO footprint, pricing-page changes, and share of voice.
2. Browse `profiles/` — per-competitor marketing profiles (Northwind, Helios).
3. Skim `signals/` — the daily content and ad watch log the Researcher appends every morning.

## Connectors

**Required:** Web (competitor sites, ad libraries, blogs, landing pages), Google Search Console (our keyword vs competitor keyword overlap).
**Recommended:** Meta Ad Library (competitor Facebook/Instagram ads), LinkedIn Campaign Insights, Google Ads Transparency Center, Gong (competitor mentions in sales calls), Salesforce (win/loss notes), Slack (`#competitive` channel).
