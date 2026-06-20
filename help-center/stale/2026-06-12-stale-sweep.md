# Stale Sweep — 2026-06-12 (catch-up: v3.39.0 → v3.42.0)

**Scope:** One-off catch-up sweep. No release shipped in the 7-day window (2026-06-05 → 2026-06-12), but the `stale/` directory was empty, meaning releases v3.39.0 through v3.42.0 were never swept. This file covers that backlog. Each release is treated atomically in its own section — no findings are blended across releases, and every item cites the single release note that invalidates it.

**Sources:** `/data/release-notes.md` (latest: v3.42.0, 2026-05-20) vs. `/article-registry.md` (last updated 2026-05-23).

**Severity scale:** Breaking (workflow no longer exists) > Misleading (steps work but wrong/incomplete) > Minor (name/label change). "Needs review" = cannot confirm without reading the article body; article bodies are not stored in this cabinet, so evidence is at the article/topic level.

---

## v3.42.0 — 2026-05-20

### 1. `api-rate-limits` — API rate limits and error codes (Draft)
- **Severity:** Misleading
- **Invalidating release notes:** "Increased default rate limits: Professional 300→400 req/min, Enterprise 600→800 req/min" and "Fixed rate-limit error responses on write endpoints to correctly return 429 (was 500 in v2 write path)"
- **What's wrong:** Any numeric limits in the draft (300/600 req/min) are now 400/800. And if the draft tells customers rate-limited writes can surface as 500 errors, that was a bug, now fixed — rate limiting consistently returns 429.
- **Action:** Update the limit table to 400 (Professional) / 800 (Enterprise) req/min; document 429 as the only rate-limit status code on both read and write paths.

### 2. `billing-invoices` — Reading your invoice (Published 2026-04-10)
- **Severity:** Misleading
- **Invalidating release note:** "Added itemised proration breakdown to invoice PDF (was previously a single 'Proration' line)"
- **What's wrong:** Last updated 2026-04-10, before this change. Any walkthrough of the invoice PDF describing a single "Proration" line no longer matches what customers see.
- **Action:** Update the invoice anatomy section (and any PDF screenshot) to show the itemised proration lines.

### 3. `billing-proration` — Understanding proration and invoice charges (Draft)
- **Severity:** Misleading (pre-publish fix)
- **Invalidating release note:** same as #2 — "Added itemised proration breakdown to invoice PDF"
- **What's wrong:** If the draft explains the old single "Proration" line, it will be wrong on publish. The itemised breakdown actually makes the article easier to write — each charge is now visible per line item.
- **Action:** Write/revise against the new itemised PDF format before publishing.

### 4. "Admin Console" → "Settings" rename — navigation steps in multiple articles
- **Severity:** Minor (label rename); **Needs review** per article
- **Invalidating release note:** "Renamed 'Admin Console' tab to 'Settings' across all navigation"
- **Likely affected** (any article whose steps say "go to Admin Console"):
  - `sso-okta-setup` (Published 2026-03-12)
  - `workspace-roles` (Published 2025-11-20)
  - `billing-payment-method` (Published 2026-04-01)
  - `billing-invoices` (Published 2026-04-10)
- **Action:** Grep each published article for "Admin Console" and replace with "Settings". Cannot quote exact stale lines since article bodies are not stored in this cabinet.

---

## v3.41.0 — 2026-05-06

### 5. `csv-export-rows` — Why does my CSV export stop at 10,000 rows? (Published 2026-01-08)
- **Severity:** **Breaking**
- **Invalidating release note:** "Increased CSV export row limit from 10,000 to 50,000 rows for Professional and Enterprise plans"
- **What's wrong:** The article's core premise — including its title — is the 10,000-row limit. For Professional and Enterprise customers that limit no longer exists; it is 50,000. A customer on those plans is being told their export "stops at 10,000 rows" when it doesn't. (The registry's stale note attributes a limit change to v3.38; the 10,000→50,000 change is documented in v3.41.0 — worth verifying which is correct, but the article is wrong either way.)
- **Action:** Top priority. Retitle and rewrite around per-plan limits (50,000 for Professional/Enterprise; confirm the limit for lower plans — the release note does not state it).

### 6. `ios-login-loop` — iOS app: troubleshooting the login loop (Draft)
- **Severity:** **Breaking** (troubleshoots a bug that is fixed)
- **Invalidating release note:** "Fixed login loop that occurred after forced password reset when using OAuth"
- **What's wrong:** The draft documents workarounds for a bug fixed in v3.41.0. Publishing it as-is would send customers through unnecessary workarounds. Correct guidance is now "update the app"; workarounds only apply to users on older app versions.
- **Action:** Reframe the draft: lead with "fixed in v3.41.0 — update your app", keep legacy workarounds as a fallback section only.

### 7. `workspace-roles` — Workspace roles and permissions (Published 2025-11-20)
- **Severity:** Misleading
- **Invalidating release note:** "Added 'Viewer' role — can view dashboards but not edit or export data"
- **What's wrong:** The article predates this release by ~6 months, so its role list cannot include the Viewer role. Admins reading it won't know Viewer exists. (Compounds the registry's existing stale flag: roles UI redesigned in v3.35, article untouched since Nov 2025.)
- **Action:** Add Viewer to the roles/permissions matrix (view dashboards: yes; edit: no; export: no).

### 8. `password-reset` — How to reset your password (Published 2026-04-22)
- **Severity:** Needs review
- **Potentially relevant release note:** "Fixed login loop that occurred after forced password reset when using OAuth"
- **Why flagged:** If the article warns about or works around the post-reset login loop on iOS/OAuth, that caveat is obsolete as of v3.41.0. Cannot confirm without the article body — review, don't assume.

---

## v3.40.0 — 2026-04-22

### 9. `sso-okta-setup` — Setting up SSO with Okta (Published 2026-03-12)
- **Severity:** Misleading
- **Invalidating release note:** "Added Azure AD as a supported SAML provider (previously Okta-only in the UI)"
- **What's wrong:** The article was published when Okta was the only SAML provider in the UI. Any wording or screenshot implying Okta is the sole SSO option no longer matches the provider-selection UI, which now includes Azure AD. The Okta steps themselves likely still work (hence Misleading, not Breaking).
- **Action:** Update provider-selection steps/screenshots; cross-link a new Azure AD article (logged as a coverage gap in `/gaps/product-gaps.md`). Highest ticket volume in the registry (34 hits/7d) — high-leverage fix.

### 10. Annual billing on Pro plan — possible mentions in billing articles
- **Severity:** Needs review
- **Potentially relevant release note:** "Annual billing toggle now available on the Pro plan (was Enterprise-only)"
- **Why flagged:** If `billing-payment-method` or `billing-invoices` state annual billing is Enterprise-only, that is now wrong. Cannot confirm without article bodies.

---

## v3.39.0 — 2026-04-08

No registry articles invalidated. All three items (batch write endpoint `/api/v2/batch`, Jira Cloud bidirectional sync, iOS biometric auth) are new capabilities with **no existing article coverage** — logged in `/gaps/product-gaps.md`.

Adjacent note: `api-rate-limits` (Draft) should clarify how `/api/v2/batch` counts against rate limits (one request vs. 500 records) — the release note does not specify the accounting, so confirm with product before documenting.

---

## Priority order for Content Writer

| # | Article | Severity | Release |
|---|---|---|---|
| 1 | csv-export-rows | Breaking | v3.41.0 |
| 2 | ios-login-loop (draft) | Breaking | v3.41.0 |
| 3 | api-rate-limits (draft) | Misleading | v3.42.0 |
| 4 | workspace-roles | Misleading | v3.41.0 |
| 5 | sso-okta-setup | Misleading | v3.40.0 |
| 6 | billing-invoices | Misleading | v3.42.0 |
| 7 | billing-proration (draft) | Misleading | v3.42.0 |
| 8 | Admin Console → Settings rename (4 articles) | Minor | v3.42.0 |
| 9 | password-reset | Needs review | v3.41.0 |
| 10 | Annual billing mentions | Needs review | v3.40.0 |
