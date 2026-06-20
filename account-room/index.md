---
title: Account Room
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [sales, account-management, crm, enterprise, cabinet]
order: 1
---
# Account Room

One living workspace per account — every stakeholder, interaction, open opportunity, objection, and next step captured in a single place. The Account Agent keeps each account room current from CRM and email; the Research Agent enriches stakeholder context; the Summary Agent publishes a clean account brief and next-action plan ready for the QBR or the exec call.

> **Keep Salesforce. Replace the Notion account plans, the Google Docs account briefs, and the fragmented email threads that only the AE can decode.**

## The team

- **[[.agents/account-agent]]** — Account Agent (lead). Owns the account room lifecycle: ingests CRM data, owns the stakeholder map, tracks open opportunities, and sequences the other agents.
- **[[.agents/research-agent]]** — Research Agent. Enriches stakeholder profiles, surfaces company news, funding events, and industry signals relevant to each account.
- **[[.agents/summary-agent]]** — Summary Agent. Synthesises the account room into a polished account brief and a concrete next-action plan.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Daily** (Mon–Fri 07:00) | [[.jobs/daily-account-sync]] | Account Agent | CRM delta pulled; open opps + activity timeline updated |
| **Weekly** (Mon 09:00) | [[.jobs/weekly-account-brief]] | Summary Agent | Account brief regenerated in `/accounts/<name>/brief.md` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-competitor-watch]] | Research Agent | Competitor signals relevant to this account's deals |
| **On demand** | [[.jobs/stakeholder-research]] | Research Agent | Deep stakeholder enrichment for a named contact |

## How to run the demo

1. Open the [[account-room]] — the Account Room dashboard showing the Meridian Foods account: header with ARR and tier, stakeholder map, open opportunities, recent activity timeline, objections tracker, and next steps.
2. Browse `/accounts/` — each subdirectory is a living account room (MD files the agents write to).
3. Check `/accounts/meridian-foods/brief.md` — the account brief the Summary Agent publishes weekly.

## Connectors

**Required:** Salesforce or HubSpot (account data, opportunities, activity), Gmail or Outlook (email threads), Calendar (meeting history and upcoming calls).
**Recommended:** Gong (call transcripts and deal signals), Slack (account channel), Google Drive (proposal and contract docs), Zendesk (support tickets and health signals).

**Every artifact is a file.** The account brief, the stakeholder map, and the next-action plan all live in `/accounts/<name>/` — inspectable, diffable, and shareable without logging into Salesforce.
