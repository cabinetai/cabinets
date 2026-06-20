# Sprint 42 Plan — May 19 – June 1, 2026

## Sprint Goal
Enable enterprise customers to onboard via SSO without contacting support — GA the SSO self-serve flow and close the 3 open security audit findings that block the Meridian deal.

## Capacity
| | Points |
|---|---|
| Raw team capacity | 101 |
| On-call overhead | −15 |
| Available | **86** |
| Committed | **83** |
| Buffer | 3 pts (3.5%) |

## Committed Tickets

| Ticket | Title | Pts | Assignee | Priority |
|---|---|---|---|---|
| ENG-5421 | SSO: SAML 2.0 self-serve configuration UI | 8 | Jae-won | P0 |
| ENG-5422 | SSO: IdP metadata auto-import (Okta, Azure AD) | 5 | Jae-won | P0 |
| ENG-5418 | Security audit: fix session fixation on login flow | 5 | Mira | P0 |
| ENG-5419 | Security audit: enforce CSRF tokens on all POST endpoints | 3 | Mira | P0 |
| ENG-5420 | Security audit: CSP header hardening | 2 | Mira | P1 |
| ENG-5391 | API: rate-limiting per-tenant (complete impl + tests) | 8 | Nadia | P1 |
| ENG-5401 | Billing: proration fix for mid-cycle seat changes | 5 | Tomas | P1 |
| ENG-5414 | DB: add index on events.tenant_id for query perf | 3 | Lucas | P2 |
| ENG-5407 | Dashboard: empty-state UI for new workspaces | 5 | Dani | P2 |
| ENG-5408 | Dashboard: onboarding checklist component | 8 | Dani | P2 |
| ENG-5377 | Notifications: digest email rendering fix (mobile) | 3 | Tomas | P2 |
| ENG-5409 | Docs: API reference auto-gen from OpenAPI spec | 5 | Lucas | P3 |
| ENG-5411 | Tests: increase auth coverage to 85% | 5 | Lucas | P3 |
| ENG-5399 | Refactor: extract PaymentService to separate module | 8 | Nadia | P3 |
| **Total** | | **83** | | |

## Carryover from Sprint 41

| Ticket | Title | Pts | Decision | Reason |
|---|---|---|---|---|
| ENG-5391 | API rate-limiting | 8 | **Carried** | 60% complete; blocked on auth middleware merge (now unblocked) |
| ENG-5377 | Digest email fix | 3 | **Carried** | Deprioritized late sprint 41; low risk |
| ENG-5344 | Legacy CSV importer refactor | 13 | **Descoped** | No active customers using it; moved to backlog |

## Known Blockers

1. **ENG-5391** — Auth middleware PR (ENG-5388) must merge before rate-limiting impl can proceed. PR is in review; Nadia is the reviewer. Target: Day 1.
2. **ENG-5421/5422** — Okta test tenant credentials needed. Jae-won to request from DevOps by EOD Day 1. Blocked until then.
3. **ENG-5418** — Security audit finding requires sign-off from external auditor (Arcanum Security) after fix. Timing risk: auditor response SLA is 3 business days.

## Burndown Projection (linear)

| Day | Remaining Pts |
|---|---|
| Day 1 (Mon) | 83 |
| Day 3 (Wed) | 65 |
| Day 5 (Fri) | 48 |
| Day 7 (Mon) | 30 |
| Day 9 (Wed) | 13 |
| Day 10 (Thu) | 0 (target) |
