---
title: Salesforce Native Sync Launch
slug: salesforce-sync-launch
launch_date: '2026-06-10'
status: at-risk
pm: Alex Rivera
jira: PLAT-1041
---

# Launch Checklist — Salesforce Native Sync

Launch date: June 10, 2026 · Days remaining: 18 · Status: at-risk

## Engineering
- [x] Feature code complete · @dev-team · 2026-05-20
- [x] Unit tests passing >95% coverage · @dev-team · 2026-05-22
- [ ] Load test at 2M records · @infra-lead · 2026-06-01 — **IN PROGRESS**
- [ ] Security review (OAuth flow) · @security-team · 2026-06-03
- [ ] Feature flag enabled for beta group · @dev-team · 2026-06-05

## QA
- [x] Smoke test (core sync flows) · @qa-lead · 2026-05-23
- [ ] Full regression suite · @qa-lead · 2026-06-04 — **NOT STARTED**
- [ ] Edge case: conflict resolution testing · @qa-lead · 2026-06-05

## Design
- [x] Field mapping UI finalized in Figma · @design-lead · 2026-05-15
- [x] Sync dashboard designs approved · @design-lead · 2026-05-18
- [ ] Final design QA on staging · @design-lead · 2026-06-06

## Marketing
- [ ] Blog post draft · @pmm · 2026-06-01 — **OVERDUE**
- [ ] Landing page copy · @pmm · 2026-06-01 — **OVERDUE**
- [ ] Social media assets (Twitter/LinkedIn) · @design-lead · 2026-06-05
- [ ] Help center article · @pmm · 2026-06-07

## Customer Success
- [x] CS team briefed on feature scope · @cs-lead · 2026-05-20
- [ ] Customer beta group selected + notified · @cs-lead · 2026-06-01
- [ ] Beta feedback collected + logged · @cs-lead · 2026-06-07
- [ ] CS enablement session · @cs-lead · 2026-06-08

## Support
- [ ] Support FAQ written + reviewed · @support-lead · 2026-06-05
- [ ] Tier-1 support scripts updated · @support-lead · 2026-06-07
- [ ] Support team briefed · @support-lead · 2026-06-08

## Legal / Compliance
- [ ] DPA addendum for Salesforce data flow · @legal · 2026-06-03
- [ ] SOC2 scope review for new sync surface · @security-team · 2026-06-05
