---
title: Product Launch
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [product, launch, go-to-market, checklist, enterprise, cabinet]
order: 1
---
# Product Launch

Two agents drive the entire launch lifecycle: a Workflow agent keeps the checklist current, chases owners, tracks assets, and manages risks; a Writer agent produces release notes, internal comms, and the go/no-go brief. Every checklist item, asset, risk, and communication artifact is a file — the launch room is always the source of truth.

> **Keep your Jira and your Figma. Replace the launch spreadsheet with 8 owners and no one driving it, the "are we ready?" Slack thread at 10pm the night before, and the release notes drafted in 15 minutes by whoever's last awake.**

## The team

- **[[.agents/launch-workflow]]** — Launch Workflow. Owns the launch checklist, workstream status, asset tracker, risk log, and daily chase. Runs the go/no-go readiness check.
- **[[.agents/launch-writer]]** — Launch Writer. Produces release notes, internal announcement, customer email, and support FAQ for each launch.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-launch-status]] | Launch Workflow | Status report in `/reports/`, checklist updated in [[launch-room]] |
| **Daily** (Mon–Fri 09:00) | [[.jobs/daily-checklist-chase]] | Launch Workflow | Owner reminders, risk escalation if launch <7 days out |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-competitor-watch]] | Launch Workflow | Competitor launch timing conflicts |

## How to run the demo

1. Open [[launch-room]] — the launch command center: countdown to launch, checklist by workstream with owners and status, asset tracker, risk list, and go/no-go readiness.
2. Browse `/checklists/` — the structured checklist files by launch.
3. Open `/comms/` — release notes, customer email, and internal announcement the Launch Writer produces.

## Connectors

**Required:** Jira (feature completion status), Figma (design asset links), Slack (owner notifications).
**Recommended:** Google Drive (launch plan docs, comms drafts), Notion or Confluence (release notes publishing), email (customer announcement).

> Cross-reference [[competitive-intelligence]] for competitor launch timing before setting your launch date.

## Every artifact is a file

Every checklist, asset link, risk entry, and communication draft lives in `/checklists/`, `/assets/`, `/risks/`, and `/comms/` as markdown files. The launch room reflects these files — never vice versa.
