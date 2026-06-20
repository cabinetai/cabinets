---
title: Vendor / Asset Registry
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [vendor-management, asset-management, it-ops, renewals, operations, enterprise, cabinet]
order: 1
---
# Vendor / Asset Registry

The authoritative inventory of every asset and vendor relationship the company holds — hardware, software licences, SaaS tools, and professional services contracts — with owner, status, renewal date, and cost always current. The Workflow agent reconciles against Okta provisioning, Jamf device data, and finance records weekly, and surfaces renewals before they auto-renew at the wrong price.

> **Keep your finance system, your IdP, and your MDM. Replace the Airtable tab nobody trusts and the asset spreadsheet that's always six months out of date.**

## The team

- **[[.agents/asset-workflow]]** — Asset Workflow Agent. Owns the full inventory loop: reconciling asset records against authoritative sources, flagging discrepancies, surfacing renewals, and writing the weekly and monthly audit reports. This is a self-contained cabinet — one well-designed agent runs the whole cycle.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-inventory-reconciliation]] | Asset Workflow | Reconciliation report + discrepancy flags in `reports/` |
| **Monthly** (1st 09:00) | [[.jobs/monthly-asset-audit]] | Asset Workflow | Full asset audit, renewals at risk, cost summary in `reports/` |

## How to run the demo

1. Open the [[inventory]] — the asset inventory dashboard: all assets by type, assigned owner, status, warranty/renewal dates, and cost; summary tiles by category; renewals coming due in 30/60/90 days.
2. Browse `assets/` — the flat-file asset records the agent maintains and reconciles.
3. Open `reports/` to see the weekly reconciliation and monthly audit artifacts.

## Connectors

**Required:** Finance / accounts payable (vendor invoices, spend data), Okta or IdP (user provisioning state — who has what access), HRIS (org chart, termination events for offboarding asset reclaim).
**Recommended:** Jamf or Kandji (MDM — device inventory, serial numbers, compliance state), Netsuite or BILL (PO matching), Ironclad or DocuSign (contract renewal dates).

## Every artifact is a file

Asset records live at `assets/hardware.yaml`, `assets/software.yaml`, and `assets/vendors.yaml`. Reports are markdown at `reports/<date>-*.md`. Every reconciliation result is a diff against the previous state — inspectable, version-controlled, and forwardable without logging in anywhere.
