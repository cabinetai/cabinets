---
title: Bug Escalation Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [support, engineering-liaison, bug-escalation, jira, enterprise, cabinet]
order: 1
---
# Bug Escalation Cabinet

Two agents convert customer support tickets into engineering-ready bug reports: validated reproduction steps, affected customer list, ARR at risk, environment details, and linked tickets — so engineers get a complete packet, not a forwarded Slack message. Every escalation packet is a file that engineers can read, triage, and act on without a support handoff call.

> **Keep Zendesk, Jira, and Linear. Replace the manual Slack escalations, the half-formed bug tickets, and the support-to-engineering translation tax that costs two teams time every week.**

## Why this template

The support-to-engineering handoff is where customer context evaporates. By the time a bug reaches an engineer, the reproduction steps are gone, the customer list is a guess, and the severity is tribal knowledge. This cabinet makes the escalation a **structured packet** — validated, complete, and ready to triage the moment it lands in the engineering queue.

## The team

- **[[.agents/customer-impact-analyst]]** — Customer Impact Analyst. Aggregates all tickets referencing the same issue, quantifies affected customers and ARR at risk, extracts environment details, and assesses reproduction fidelity. Doesn't touch the Jira.
- **[[.agents/engineering-liaison]]** — Engineering Liaison. Lead agent. Takes the Customer Impact Analyst's packet, writes the engineering-ready bug report, determines severity, assigns an owner, and creates or updates the Jira/Linear ticket. Sequences the loop.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Daily** (Mon–Fri 09:00) | [[.jobs/daily-escalation-triage]] | Engineering Liaison | Triage pass: new candidates ranked, stale escalations nudged |
| **On-demand** | [[.jobs/escalate-ticket]] | Engineering Liaison | Full bug escalation packet in [[escalation-packet]] + Jira ticket |

## How to run the demo

1. Open the [[escalation-packet]] — a live demo escalation packet: bug header, severity, reproduction steps, affected customers and $ impact, environment, linked tickets, engineering owner, and status.
2. Browse `/escalations/` — all active escalation packets, each as a self-contained markdown file.
3. Skim `/triage/` — the daily triage log ranking escalation candidates by severity and ARR at risk.

## Connectors

**Required:** Zendesk or Intercom (ticket source), Jira or Linear (engineering destination).
**Recommended:** GitHub (link to related issues/PRs), Salesforce or HubSpot (customer ARR lookup), Slack (`#bug-escalations` channel for engineering pings).

## Active escalations (demo data)

| ID | Bug | Severity | Customers | ARR at Risk | Status |
|---|---|---|---|---|---|
| ESC-041 | API rate-limit errors returning 500 instead of 429 | P1 | 23 | $184K | Engineering → In Progress |
| ESC-039 | SSO SAML assertion mismatch on Okta + Azure AD | P1 | 11 | $412K | Engineering → Assigned |
| ESC-037 | CSV export truncates rows > 10K | P2 | 34 | $97K | Pending repro |
| ESC-035 | iOS app login loop after forced password reset | P2 | 18 | $43K | Engineering → Done |

**Each packet in `/escalations/` is the complete engineering brief — support doesn't need to answer follow-up questions.**
