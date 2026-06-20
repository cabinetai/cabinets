---
title: Sales Call Prep
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [sales, call-prep, discovery, sdr, ae, enterprise, cabinet]
order: 1
---
# Sales Call Prep

Every morning at 7 AM, pull that day's calendar calls and produce a one-page call prep brief for each: account snapshot, recent activity, likely pain points, suggested discovery questions, competitive notes, and attendee profiles. The Research Agent enriches context; the Customer Agent validates it against CRM and Gong history.

> **Keep your CRM and calendar. Replace the 20-minute pre-call tab scramble — LinkedIn, Gong, Salesforce, and three browser tabs — with one brief that's already in your inbox.**

## The team

- **[[.agents/research-agent]]** — Research Agent (lead). Pulls company news, funding, product changes, and LinkedIn signals for each call attendee. Feeds the Customer Agent with enriched context.
- **[[.agents/customer-agent]]** — Customer Agent. Validates research against CRM history and Gong call transcripts. Synthesises everything into the final call prep brief and writes it to `/briefs/<date>/<account>.md`.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Daily** (Mon–Fri 07:00) | [[.jobs/daily-call-prep]] | Research Agent | Call prep briefs for today's calendar in `/briefs/<date>/` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-competitor-watch]] | Research Agent | Competitor signals relevant to this week's call accounts |

## How to run the demo

1. Open the [[call-prep]] — the Call Prep Brief for today's first call: Meridian Foods discovery call. See attendees, company snapshot, recent activity, likely pains, discovery questions, and competitive notes.
2. Browse `/briefs/` — briefs organised by date, one file per account per call day.
3. Skim `/briefs/2026-05-23/atlas-logistics.md` — a second example brief for the same morning.

## Connectors

**Required:** CRM (account data, contact history, opportunity stage), Gmail or Outlook (recent email threads), Gong (recent call transcripts), Calendar (today's scheduled calls), Web (company news, LinkedIn).
**Recommended:** Google Drive (past proposals, case studies relevant to the account), LinkedIn Sales Navigator (attendee profiles), ZoomInfo or Clearbit (company data enrichment).

**Every artifact is a file.** Call prep briefs live in `/briefs/<date>/<account>.md` — the rep can open them on their phone before dialling.
