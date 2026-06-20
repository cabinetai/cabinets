---
title: Sales Battlecard
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [sales, battlecards, competitive, objection-handling, pmm, enterprise, cabinet]
order: 1
---
# Sales Battlecard

Per-competitor battlecards with objection handling, proof points, pricing deltas, traps to set, and landmines to avoid — refreshed weekly from Gong call mentions, CRM win/loss data, and the competitive intelligence feed. The Research Agent surfaces fresh signals; the Writer Agent turns them into crisp, rep-ready battlecard updates.

> **Keep your CRM and Gong. Replace the stale Highspot deck, the Seismic page last touched 8 months ago, and the Guru card the PMM forgets to update after every launch.**

## The team

- **[[.agents/research-agent]]** — Research Agent (lead). Monitors competitor signals, win/loss mentions in Gong, and CRM closed-lost reasons. Feeds the Writer Agent with sourced, deal-tested material.
- **[[.agents/writer-agent]]** — Writer Agent. Turns competitor signals and win/loss data into tight battlecard sections: counter-pitch, objection responses, proof points, traps, and landmines.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Fri 16:00) | [[.jobs/weekly-battlecard-refresh]] | Writer Agent | Battlecards refreshed in `/battlecards/<competitor>.md` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-competitor-watch]] | Research Agent | Competitor signals cross-referenced with CI cabinet |
| **On demand** | [[.jobs/new-battlecard]] | Writer Agent | New competitor battlecard created (enabled: false) |

## How to run the demo

1. Open the [[battlecard-viewer]] — select a competitor (Northwind, Helios, Cobalt) to see the full battlecard: how they pitch, our counter, traps to set, proof points, landmines, and pricing delta.
2. Browse `/battlecards/` — the living battlecard files the Writer Agent refreshes weekly.
3. Check `/battlecards/northwind.md` — the most-contested competitor, fully worked out.

## Connectors

**Required:** CRM (win/loss reasons, competitor field), Gong (call transcripts with competitor mentions), Google Drive or Notion or Confluence (existing battlecard library).
**Recommended:** Salesforce (closed-lost analysis), Highspot or Seismic (distribution), Slack (`#competition` channel).

**Cross-cabinet:** This cabinet is downstream of [[../competitive-intelligence]] — the weekly competitor-watch job pulls the full landscape from the CI cabinet and translates it into rep-facing battlecard updates.

**Every artifact is a file.** Battlecards live in `/battlecards/<competitor>.md` — versioned, diffable, and shareable without a Highspot login.
