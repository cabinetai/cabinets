---
title: Candidate Packet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [hr, recruiting, candidate, hiring-committee, enterprise, cabinet]
order: 1
---
# Candidate Packet

One structured packet per candidate per role — resume highlights, interview notes digest, take-home assessment summary, scorecard by competency, and a draft committee recommendation — produced before the debrief so the committee arrives informed, not catching up. Every packet is a file; the debrief decision is recorded alongside it.

> **Keep Greenhouse / Lever / Ashby. Replace the ATS notes nobody reads before the room, the scorecards that aren't filled in until after the debrief, and the "can someone remind me what we thought about them?" Slack thread.**

## The team

- **[[.agents/people-ops]]** — People Ops Lead. Owns the packet pipeline, orchestrates the Summarizer, and ensures every scheduled debrief has a packet 24 hours in advance.
- **[[.agents/candidate-summarizer]]** — Candidate Summarizer. Pulls interview notes, scorecard data, resume highlights, and take-home assessment; synthesizes into the structured packet.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **On-demand** | [[.jobs/per-candidate-packet]] | People Ops Lead | Candidate packet in `packets/<candidate-slug>/packet.md` |
| **Daily** (Mon–Fri 09:00) | [[.jobs/daily-debrief-prep]] | People Ops Lead | Packets ready for all debriefs in next 48h |

## How to run the demo

1. Open the [[candidate-view]] — the candidate packet for a demo candidate applying for a Senior Backend Engineer role: competency scorecard, interview notes digest, take-home summary, and committee recommendation.
2. Browse [[packets/]] — individual packet files per candidate per role.
3. Check [[packets/morgan-lee/packet.md]] — the demo packet.

## Connectors

**Required:** ATS (Greenhouse / Lever / Ashby) for interview notes and scorecards, Google Calendar for debrief scheduling.
**Recommended:** Google Docs / Drive (take-home submissions, interview guides), email (candidate correspondence), Slack (recruiter coordination).

## HR data note

Demo packets use invented candidate names. In production, candidate data is sensitive — access to packets is recruiter + hiring committee only. No real candidate PII is stored in the cabinet; the ATS remains the system of record.
