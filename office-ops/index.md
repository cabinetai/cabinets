---
title: Office Ops Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [office-management, facilities, supplies, visitors, operations, enterprise, cabinet]
order: 1
---
# Office Ops Cabinet

Keeps the physical office running: visitor scheduling, supply levels and reorders, open facilities tickets, recurring maintenance tasks, and office request triage — all tracked by one agent in a structured loop. Every ticket, reorder, and visitor record is a file; nothing lives only in someone's head or a Slack thread.

> **Keep your calendar and Slack. Replace the Envoy spreadsheet, the room-booking tab that's always wrong, and the facilities request that got lost after the third Slack message.**

## The team

- **[[.agents/ops-workflow]]** — Office Ops Workflow Agent. Owns the full office ops loop: triaging facilities tickets, tracking supply levels and triggering reorders, managing the visitor schedule, running recurring maintenance tasks, and producing the daily triage and weekly supplies report. A single well-designed agent handles the complete cycle for this straightforward tracker.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Daily** (Mon–Fri 09:00) | [[.jobs/daily-office-triage]] | Office Ops Workflow | Daily triage report — open tickets, visitor prep, task reminders |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-supplies-check]] | Office Ops Workflow | Supplies audit + reorder list, low-stock alerts |

## How to run the demo

1. Open the [[tracker]] — the office ops tracker: open facilities tickets by status, supply levels with reorder indicators, today's visitor schedule, and upcoming recurring tasks.
2. Browse `tickets/open-tickets.yaml` — the facilities ticket log the agent manages.
3. Browse `supplies/inventory.yaml` — the supply inventory the agent reconciles weekly.
4. Open `visitors/schedule.yaml` — the visitor intake schedule.

## Connectors

**Required:** Calendar (visitor scheduling, meeting room bookings), Slack (`#office-requests` channel for ticket intake + announcements).
**Recommended:** Envoy or similar (visitor badge printing, NDA signing), Robin or similar (desk/room booking integration), Procurement Intake cabinet (supply reorder requests), forms tool (visitor pre-registration).

## Every artifact is a file

Facilities tickets are YAML at `tickets/open-tickets.yaml`. Supply inventory lives at `supplies/inventory.yaml`. The visitor schedule is at `visitors/schedule.yaml`. Recurring maintenance tasks are defined at `tasks/recurring-tasks.yaml`. Nothing lives only in a chat thread.
