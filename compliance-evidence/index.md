---
title: Compliance Evidence Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [security, grc, compliance, evidence, soc2, iso27001, enterprise, cabinet]
order: 1
---
# Compliance Evidence Cabinet

Two agents — a Compliance Lead and a Workflow Agent — continuously collect and map evidence (policies, access logs, screenshots, vendor docs) to SOC2, ISO 27001, and GDPR controls. The result is a living evidence map where every control shows its evidence status, owner, and last-verified date.

> **Keep Vanta and Drata as your official GRC and evidence systems of record. Replace the manual evidence notes, screenshot folders, spreadsheet gap trackers, and pre-audit scramble around them.**

## Why this cabinet

Audit readiness is a continuous operation, not a four-week sprint before your SOC2 review. Most teams know which controls they own — the gap is mapping fresh evidence to each one and catching stale or missing items before the auditor does. This cabinet runs that sweep every week, writes the gap report to disk, and keeps the evidence map current so your Vanta/Drata dashboard reflects reality rather than wishful thinking.

Every artifact is a file: the evidence map, gap reports, control review notes, and owner assignments are all written to disk so you can open, share, and archive them.

## The team

- **[[.agents/compliance-agent]]** — Compliance Lead. Orchestrates evidence collection, maps artifacts to controls, owns the gap report, and escalates stale or missing evidence to control owners.
- **[[.agents/workflow-agent]]** — Workflow Agent. Pulls evidence from connected sources (Okta logs, GitHub audit trail, cloud config exports, HRIS exports), normalises it, and files it to the correct control folder.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/evidence-gap-sweep]] | Compliance Lead | Gap report in `/evidence-gaps/YYYY-WW.md`, stale controls flagged in the evidence map |
| **Monthly** (1st 09:00) | [[.jobs/monthly-control-review]] | Compliance Lead | Full control review report in `/control-reviews/YYYY-MM.md`, owner assignments updated |

## How to run the demo

1. Open the [[evidence-map]] — the control evidence dashboard: control ID, framework, evidence status (collected / missing / stale), owner, and last-verified date. Framework coverage % by category shown at top.
2. Browse `evidence-gaps/2026-W21.md` — a worked example gap report from the weekly sweep.
3. Check `controls/cc6.1.md` — a single control file with its evidence list and history.

## Connectors

**Required:** Vanta or Drata (controls list, evidence links, policy library), Okta or Microsoft Entra (access logs, user provisioning records), GitHub (audit log, code-change evidence).
**Recommended:** AWS/GCP/Azure (cloud config exports, CloudTrail/Audit Logs), HRIS (BambooHR, Rippling — employee lifecycle evidence), Google Drive (policy PDFs, vendor docs).

**Vanta and Drata remain your official GRC systems of record.** This cabinet coordinates evidence collection and tracks gaps — it does not replace Vanta/Drata as the authoritative compliance evidence store.
