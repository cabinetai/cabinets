# Vendor Security Review Packet

**Vendor:** Atlas Logistics Ltd.
**Request date:** 2026-05-06
**Requestor:** procurement@company.com (Sarah Kim, Procurement)
**Purpose:** Integration platform for logistics data — will process shipment records including customer delivery addresses.
**Review completed:** 2026-05-14
**Decision:** Approved with Conditions

---

## Risk Tier

**Tier 1** — Atlas Logistics will process customer delivery address data (personal data under GDPR) and will have API access to our order management system via a dedicated integration key. Full review required; annual re-assessment cadence.

**Tier rationale:** Customer PII in scope (delivery addresses, contact names); API access to production order endpoint.

---

## Data Classification

| Data type | Classification | Scope |
|---|---|---|
| Customer delivery addresses | Personal Data (GDPR) | All EU orders |
| Customer contact names | Personal Data (GDPR) | All EU orders |
| Order reference numbers | Internal / Confidential | All orders |
| Shipment status updates | Internal | All orders |

No payment card data, no health data, no government ID data in scope.

---

## SOC2 / ISO 27001 Status

**SOC2 Type II report:** Present. Period: Jan 1 2025 – Dec 31 2025 (audit completed Feb 28 2026). Report filed at `vendors/atlas-logistics/soc2-2025.pdf`.

**Scope:** Covers the Atlas Logistics integration platform and data processing services. Confirmed to include the services we are purchasing.

**Opinion:** Unqualified opinion. No qualified items or exceptions noted in the report.

**Bridge letter:** Not required — audit period ended Dec 31 2025, review conducted May 2026 (within 12-month window).

**ISO 27001:** Not certified. SOC2 accepted as equivalent for Tier 1 purposes.

---

## DPA Status

**Status:** In negotiation.

**Notes:** Atlas Logistics provided a draft DPA on 2026-05-08. Legal (emily.chen@company.com) is reviewing. Key open items:
1. Sub-processor list in the DPA does not include Atlas's cloud hosting provider (AWS EU-WEST-1) — requested addition.
2. Data retention clause specifies 24 months; our standard is 12 months — under negotiation.
3. SCCs (EU Standard Contractual Clauses) required for data transfer from EU to UK post-Brexit — Atlas has agreed to include. Awaiting updated draft.

**DPA cannot be countersigned until open items 1–3 are resolved.** Legal review target: 2026-05-28.

---

## Sub-processors

Sub-processors disclosed by Atlas Logistics (from SOC2 Annex B + questionnaire):

| Sub-processor | Purpose | Location | SOC2/ISO |
|---|---|---|---|
| Amazon Web Services (EU-WEST-1) | Cloud infrastructure | Ireland (EU) | SOC2 Type II |
| Datadog | Monitoring and alerting | US (SCCs apply) | SOC2 Type II |
| Sendgrid (Twilio) | Email notifications | US (SCCs apply) | SOC2 Type II |

All sub-processors have current SOC2 reports. SCCs required for US-based sub-processors — confirm Atlas has SCCs in place (open item — see Finding 1).

---

## Findings

**Finding 1 — Sub-processor SCC confirmation (Severity: Medium)**
Atlas Logistics's DPA draft does not explicitly confirm SCCs are in place with US-based sub-processors (Datadog, Sendgrid). Atlas confirmed verbally that SCCs exist; written confirmation required in the DPA or as an annex.
**Required action:** Legal to confirm SCC documentation in updated DPA draft. Owner: emily.chen@company.com. Due: 2026-05-28.

**Finding 2 — Data retention alignment (Severity: Low)**
Atlas's standard retention is 24 months; our requirement is 12 months. Not a blocker but must be resolved in DPA negotiation before go-live.
**Required action:** Legal to negotiate 12-month retention or document accepted exception with CISO sign-off. Owner: emily.chen@company.com. Due: 2026-05-28.

---

## Approval Decision

**Approved with Conditions**

Conditions that must be resolved before go-live (no data may be sent to Atlas Logistics until conditions are met):

1. **DPA countersigned** — all open items resolved and DPA signed by both parties. Owner: emily.chen@company.com. Due: 2026-05-28.
2. **SCC confirmation** — written confirmation of SCCs with US sub-processors included in DPA or annex. Owner: emily.chen@company.com. Due: 2026-05-28.

Conditions that must be resolved within 90 days of go-live:

3. **Data retention alignment** — 12-month retention confirmed in DPA or accepted exception documented. Owner: emily.chen@company.com. Due: 2026-08-14.

**Approved by:** Compliance Lead  **Date:** 2026-05-14
**QA sign-off:** QA Reviewer  **Date:** 2026-05-14

---

## Next Assessment

Annual re-assessment due: **2026-05-14** (12 months from approval — Tier 1 cadence).
