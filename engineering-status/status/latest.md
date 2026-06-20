# Engineering Update — Week of May 19, 2026

**Executive summary:** API team shipped the rate-limiting overhaul and the WebAuthn auth module — two sprint commitments delivered. Three tickets slipped into Sprint 42 (billing proration, onboarding checklist, mobile email rendering) due to a 4-hour production incident Tuesday that consumed the afternoon. One blocked item needs leadership attention: the Meridian SSO certification is blocked on an auditor response; if no reply by Wednesday, we should escalate through the account team.

---

### Shipped (23 PRs merged)

**Auth & Security (Mira Osei)**
- WebAuthn / passkey authentication — GA'd Tuesday; 0 errors in 48h soak. (ENG-5388, ENG-5389)
- Session fixation patch — deployed Thu with no user impact. (ENG-5418)

**API Platform (Nadia Volkov + Jae-won Park)**
- Per-tenant rate limiting — 8 PRs, including the auth middleware extraction. Covers 100% of public endpoints. (ENG-5391)
- SAML 2.0 IdP metadata auto-import (Okta, Azure AD) — merged, rolling out to beta customers. (ENG-5422)

**Infrastructure (Lucas Ferreira)**
- `events.tenant_id` index — query latency on the events table dropped 62% (p99: 840ms → 320ms). (ENG-5414)
- OpenAPI spec auto-gen pipeline — docs now regenerate on every PR merge. (ENG-5409)

**Dashboard (Dani Reyes)**
- Empty-state UI for new workspaces — shipped with onboarding copy from Design. (ENG-5407)

---

### Slipped (3 tickets → Sprint 42)

| Ticket | Title | Owner | Reason |
|---|---|---|---|
| ENG-5401 | Billing: proration fix | Tomas | Tuesday incident pulled Tomas into debugging; 40% complete |
| ENG-5408 | Onboarding checklist component | Dani | Design review blocked until Fri EOD; unblocked now |
| ENG-5377 | Notification email rendering (mobile) | Tomas | Deprioritized; low severity, no active complaints |

---

### Blocked

**ENG-5421 — SSO SAML UI (Jae-won Park):** Waiting on Arcanum Security auditor sign-off on the session fixation fix. SLA is 3 business days (due Wednesday). If no response by Wed morning, needs escalation through the Meridian account team.

---

### Needs Leadership Attention

- **Meridian SSO audit:** If Arcanum Security doesn't respond by Wednesday (May 27), the Meridian deal closes date is at risk. Recommend EM escalates through account team by Tuesday EOD.

---

### KPIs — Week of May 19

| Metric | Value | vs Last Week |
|---|---|---|
| PRs merged | 23 | +4 |
| Deploy frequency | 8 deploys/week | =8 |
| Median cycle time | 14.2 hrs | −2.1 hrs |
| Rollbacks | 1 (reverted at 02:15 UTC Tue) | — |
| Blocked tickets | 1 | — |
