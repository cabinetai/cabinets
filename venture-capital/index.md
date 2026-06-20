---
title: VC Cabinet
created: '2026-06-08T00:00:00Z'
modified: '2026-06-08T00:00:00Z'
tags:
  - venture-capital
  - vc
  - deal-flow
  - portfolio
  - fundraising
  - investor
  - cabinet
order: 1
---
# VC Cabinet

A working operating system for an early-stage venture firm. Five agents run the four jobs that actually move a fund: **find the next deal, protect the deals you've already done, know more than the room, and build a brand that makes founders come to you.**

This template ships with a fictional fund — **Northbound Capital**, a seed-to-Series-A firm investing in applied AI and developer infrastructure — so every dashboard, brief, and pipeline card has realistic data to look at. Swap in your own thesis and portfolio in [[data/thesis]] and the data files, and the agents take it from there.

> **Keep your bank, your cap-table tool, your legal docs. Replace the deal-flow spreadsheet that goes stale, the portfolio check-ins you mean to do, the market research that never gets written, and the thought-leadership you keep promising yourself you'll post.**

## Why this gives VCs the "wow"

Venture is a game of three edges. This cabinet is built around all three:

1. **Proprietary deal flow** — the best deals never hit your inbox cold. The Deal Scout scores every inbound against your thesis and the Platform Lead publishes a daily point of view on your vertical, so founders find *you*. See [[deal-pipeline]] and [[content]].
2. **Being a value-add investor** — the Portfolio Partner watches every company's runway, milestones, and asks, and flags trouble *before* the board meeting. See [[portfolio-dashboard]].
3. **Knowing more than the room** — the Research Analyst turns a company name or a market question into a one-page brief or market map on demand. See [[research]].

## The team

- **[[.agents/managing-partner]]** — The GP. Owns the thesis, runs the investment-committee call, makes the final call on every deal, and writes the quarterly LP update. Coordinates the other four agents (dispatch enabled).
- **[[.agents/deal-scout]]** — Sourcing and deal flow. Scores every inbound and outbound company against the fund thesis (1–100), maintains the pipeline through its stages, and writes the weekly deal review.
- **[[.agents/portfolio-partner]]** — Portfolio monitoring and support. Tracks KPIs, runway, milestones, and open asks for every portfolio company. Flags any company under 6 months of runway or off-milestone before it becomes a crisis.
- **[[.agents/research-analyst]]** — On-demand research. Produces company diligence briefs, competitive market maps, and vertical deep-dives the rest of the team draws on.
- **[[.agents/platform-lead]]** — Brand, content, and platform value-add. Drafts the daily X thread on the fund's vertical, runs PR and marketing for the fund and its portfolio, and supports talent and events.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Daily** (08:00) | [[.jobs/daily-x-thread]] | Platform Lead | A ready-to-post X thread on the vertical in `content/` |
| **Weekly** (Mon 08:30) | [[.jobs/weekly-portfolio-health]] | Portfolio Partner | Health sweep + runway flags; refreshes [[data/portfolio]] |
| **Weekly** (Mon 09:00) | [[.jobs/weekly-deal-review]] | Deal Scout | Pipeline review memo; refreshes [[data/pipeline]] |
| **Monthly** (1st 09:00) | [[.jobs/monthly-sourcing-sweep]] | Deal Scout | New thesis-fit companies added to the pipeline |
| **Quarterly** (1st 10:00) | [[.jobs/quarterly-lp-update]] | Managing Partner | LP update letter in `lp-updates/` |

## How to run the demo

1. Open the **[[portfolio-dashboard]]** — the hero view. Portfolio company cards with KPIs, a runway gauge, status flags, and the next board date. Two companies are flagged: one short on runway, one off-milestone.
2. Open the **[[deal-pipeline]]** — the live deal-flow board. Inbound and sourced companies move left-to-right through Sourced → Screened → Diligence → IC → Term Sheet, each scored against the thesis.
3. Browse **[[research]]** — an example company diligence brief the Research Analyst produced.
4. Browse **[[content]]** — today's drafted X thread on the vertical, ready to post.
5. Read **[[data/thesis]]** — the fund thesis every agent scores and writes against. Edit this first to make the cabinet your own.

## Connectors

**Required:** Deal-flow source (Affinity, Attio, or an inbound form), portfolio KPI source (founder updates, a shared metrics doc, or a tool like Visible/Quaestor), and an X / LinkedIn account for the Platform Lead to draft against.
**Recommended:** Email (warm-intro tracking and founder threads), a calendar (board dates and IC scheduling), Crunchbase or PitchBook (sourcing and market sizing), and a fund-admin source (Carta, AngelList, or your LP portal) for LP-update numbers.

> **Heads up.** The agents never invent numbers. If a connector isn't wired, the Portfolio Partner and Deal Scout log what's missing and escalate the config gap rather than fabricating metrics.

## Related cabinets

- **[[../investor-update]]** — The founder side of the table. This cabinet *reads* updates like the ones that cabinet *writes*.
- **[[../board-finance]]** — Board packet and finance metrics; useful pattern for the portfolio KPI tables here.
- **[[../competitive-intelligence]]** — Deeper market and competitor tracking the Research Analyst can lean on.
