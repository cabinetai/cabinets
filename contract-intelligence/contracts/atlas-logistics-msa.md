---
contract_id: CI-2024-031
slug: atlas-logistics-msa
type: MSA
counterparty: Atlas Logistics GmbH
counterparty_role: Vendor
effective_date: 2024-02-01
expiry_date: 2027-01-31
renewal_date: 2027-01-31
auto_renew: true
notice_period_days: 90
action_by_date: 2026-11-02
tcv: 480000
acv: 160000
currency: EUR
governing_law: Germany (Munich courts)
owner: Sarah Chen, Legal
qa_reviewed: true
qa_date: 2026-05-15
---

# Atlas Logistics GmbH — Master Services Agreement

## Executive Summary

Atlas Logistics GmbH provides warehousing, last-mile delivery, and freight management services to Acme Corp under a 3-year MSA valued at €480,000 total (€160k/year). The agreement auto-renews annually unless either party gives 90 days written notice. The next action-by date for non-renewal is **November 2, 2026**. The liability cap is set at 1× the prior 12 months of fees (strong), but the indemnification scope is asymmetric — Atlas bears no indemnity for IP claims made by third parties against Acme.

## Risk Flags

| Category | Finding | Severity |
|---|---|---|
| Indemnification | Atlas is indemnified against third-party IP claims arising from Acme content. Acme has no reciprocal protection. | MEDIUM |
| Liability Cap | Cap at 12-month fees (~€160k). Acceptable for this contract value. | LOW |
| IP Assignment | No IP assignment. Work product owned by Acme with standard carve-out for Atlas pre-existing tools. | LOW |
| Data Processing | DPA requires a 30-day breach notification from Atlas. Acme must audit Atlas sub-processors annually. | MEDIUM |
| Auto-Renew | 90-day notice window. Action-by date: 2026-11-02. Owner assigned. | MEDIUM |
| Termination | Either party may terminate for convenience with 90 days written notice. Clean exit. | LOW |

## Key Obligations

| Obligation | Due / Cadence | Responsible Party | Status |
|---|---|---|---|
| Monthly service report | Last business day of each month | Atlas Logistics | Open |
| Annual sub-processor audit | Feb 1 each year | Acme Corp (Legal/IT) | Open — due 2027-02-01 |
| DPA breach notification (30 days) | Within 30 days of discovery | Atlas Logistics | N/A |
| Renewal decision | 2026-11-02 | Sarah Chen, Legal | Open |
| Price review | 2027-01-15 | Acme Corp (Finance) | Open |

## Termination Clause

> "Either Party may terminate this Agreement without cause upon ninety (90) calendar days' prior written notice to the other Party. Notice must be delivered by registered mail or email to the designated contract contact with read receipt confirmation. Termination shall not affect any Statement of Work in effect at the time of notice, which shall continue under the terms of this Agreement until its scheduled completion."

## Parties

- **Acme Corp** (Customer) — registered in Delaware, operations in EU
- **Atlas Logistics GmbH** (Vendor) — registered in Munich, Germany
