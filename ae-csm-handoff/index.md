---
title: AE → CSM Handoff
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [sales, customer-success, handoff, onboarding, enterprise, cabinet]
order: 1
---
# AE → CSM Handoff

Turn a closed-won deal into a complete, structured handoff packet for Customer Success — stakeholders, promised outcomes, committed timelines, known risks, success criteria, and everything the AE said that the CSM needs to know. The Customer Agent pulls deal context from Gong and CRM; the Summary Agent produces the handoff packet ready for the kickoff call.

> **Keep Salesforce and your CS tool. Replace the rushed Slack DM to the CSM, the missed CRM notes, and the 45-minute handoff call where the AE reads from memory.**

## The team

- **[[.agents/customer-agent]]** — Customer Agent (lead). Pulls deal context from Gong transcripts, CRM opportunity notes, and email threads. Owns the factual accuracy of the handoff packet.
- **[[.agents/summary-agent]]** — Summary Agent. Structures the raw deal context into a clean, CSM-ready handoff packet: stakeholders, outcomes promised, risks flagged, success criteria, and timeline.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **On demand** | [[.jobs/handoff-packet]] | Customer Agent | Handoff packet generated in `/handoffs/<account>/packet.md` (enabled: false) |
| **Weekly** (Mon 09:00) | [[.jobs/weekly-handoff-qa]] | Summary Agent | QA sweep of handoffs from the past 30 days; gaps flagged in `/handoffs/qa-report.md` |

## How to run the demo

1. Open the [[handoff-packet]] — the Handoff Packet viewer for Meridian Foods: deal summary, stakeholder grid, promised outcomes, known risks, success criteria, and go-live timeline.
2. Browse `/handoffs/meridian-foods/` — the full handoff packet files the agents produce.
3. Check `/handoffs/qa-report.md` — the weekly QA report flagging incomplete or inconsistent handoffs.

## Connectors

**Required:** Salesforce (closed-won opportunity, contacts, deal notes), Gong (call transcripts, key moments, commitments made on calls), Gmail or Outlook (email threads), Slack (deal channel).
**Recommended:** Gainsight or ChurnZero or Totango (CS tool receiving the handoff), HubSpot (CRM alternative).

**Every artifact is a file.** The handoff packet lives in `/handoffs/<account>/packet.md` — the CSM can open it before the kickoff call without asking the AE anything.
