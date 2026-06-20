---
title: Salesforce Native Two-Way Sync
slug: salesforce-native-sync
status: in-review
version: 0.2
created: '2026-05-16T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
author: product-manager
jira: PLAT-1041
---

# PRD: Salesforce Native Two-Way Sync

## Problem

Enterprise and Mid-Market customers manage account and contact records in both our platform and Salesforce CRM. Currently there is no native sync — customers export CSV from our platform every Friday and manually import into Salesforce. This process takes 2–4 hours per week per ops person, introduces data lag of up to 7 days, and creates divergent records that break reporting.

38 feedback signals over 12 weeks. $2.1M ARR requesting. $480K ARR at renewal risk citing this gap. Northwind has shipped a native Salesforce connector (one-way, our direction) 6 months ago — we are behind on table stakes.

## Business Goal

Reduce customer data operations overhead by ≥80% for accounts using both platforms. Target: 0 customers citing "no Salesforce sync" as a renewal risk by end of Q2 2026.

## User Segments

| Segment | Size | Priority | Notes |
|---------|------|----------|-------|
| Enterprise (>500 seats) | 34 accounts | P0 | Primary requesters; ops teams most affected |
| Mid-Market (51–500 seats) | 89 accounts | P1 | Significant but less urgent; manual workaround tolerated |
| SMB (<50 seats) | — | Out of scope | Low CRM complexity; CSV adequate |

## User Stories

**US-01** · As an Enterprise ops manager, I want records updated in our platform to sync to Salesforce within 15 minutes, so that sales reps always see current account status without manual exports.
- AC1: A record change in our platform appears in the linked Salesforce object within 15 minutes under normal load (P95).
- AC2: If sync fails, an error is logged in the sync dashboard and an email is sent to the workspace admin within 5 minutes.

**US-02** · As an Enterprise ops manager, I want Salesforce record changes to sync back to our platform, so that account data is always the source of truth in Salesforce.
- AC1: A field change in Salesforce propagates to our platform within 15 minutes.
- AC2: Conflict resolution: Salesforce is the system of record for fields that exist in both; our platform is the source for fields that exist only in our platform.

**US-03** · As an Enterprise admin, I want to configure which fields sync in each direction, so that I don't overwrite fields my team manages exclusively in one system.
- AC1: Field mapping UI allows per-field selection of sync direction: one-way (→ SF), one-way (← SF), two-way, or excluded.
- AC2: Changes to field mapping take effect within 5 minutes without requiring a full re-sync.

## Functional Requirements

| ID | Requirement | Priority | Source |
|----|-------------|----------|--------|
| FR-01 | System must sync standard Account, Contact, and Opportunity objects bidirectionally | P0 | 38 feedback signals |
| FR-02 | Sync latency must not exceed 15 minutes at P95 under normal production load | P0 | Customer SLA expectation (Gong call, May 2026) |
| FR-03 | Admin must be able to configure per-field sync direction from settings UI | P0 | Enterprise ops manager interviews |
| FR-04 | Sync errors must be surfaced in a dedicated sync dashboard with timestamp, field, and error type | P0 | PM decision |
| FR-05 | Initial sync (first-time setup) must complete within 24 hours for accounts with up to 500K records | P1 | Infrastructure estimate |
| FR-06 | Sync must support Salesforce sandbox environments for testing before production activation | P1 | Customer request (Zendesk #0812) |

## Non-Functional Requirements

| ID | Type | Requirement | Threshold |
|----|------|-------------|-----------|
| NFR-01 | Performance | Sync pipeline must not degrade platform write latency | <5ms overhead per write at P99 |
| NFR-02 | Reliability | Sync service uptime | ≥99.9% monthly |
| NFR-03 | Security | OAuth 2.0 flow for Salesforce auth; no stored passwords | Required |
| NFR-04 | Scalability | Must handle accounts with up to 2M records | Load tested at 2M before GA |
| NFR-05 | Audit | All sync events logged with timestamp, direction, user/system actor | 90-day retention |

## Out of Scope

- Custom Salesforce objects (Phase 2)
- HubSpot, Pipedrive, or other CRMs (separate PRDs)
- Mobile app sync UI (admin-only via web)
- Real-time (<1 min) sync SLA (engineering cost prohibitive in Q2)

## Success Metrics

| Metric | Baseline | Target | Measurement | By |
|--------|----------|--------|-------------|-----|
| Accounts with renewal-risk citing sync gap | 4 accounts ($480K ARR) | 0 accounts | CRM renewal-risk field | Q3 2026 |
| Weekly manual exports per ops user | 4h/week (surveyed) | <30 min/week | Support ticket volume + survey | Q3 2026 |
| Sync feature adoption (% of Enterprise accounts) | 0% | ≥60% within 90 days of GA | Product analytics | Q4 2026 |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Salesforce API rate limits cause sync delays | M | H | Implement backoff + queue; alert if queue depth >100 items |
| Customer field mapping complexity exceeds UI capacity | M | M | Limit to 50 field mappings per direction in v1; review after GA |
| Conflict resolution logic creates data loss | L | H | Write comprehensive conflict log; allow admin to replay last 24h |
| Salesforce changes their connected app requirements | L | H | Monitor Salesforce developer blog; maintain adapter layer |

## Open Questions

| # | Question | Owner | Due | Status |
|---|---------|-------|-----|--------|
| OQ-01 | Should we support Salesforce Person Accounts (B2C model) in v1 or defer? | PM | 2026-05-27 | Open |
| OQ-02 | What is the rollback plan if a customer's data is corrupted by a sync bug? | Engineering Lead | 2026-05-27 | Open |
| OQ-03 | Do we expose the sync log via API for customers who want to audit programmatically? | PM | 2026-06-03 | Open |
