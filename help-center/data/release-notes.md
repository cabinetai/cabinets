# Release Notes — Recent

## v3.42.0 — 2026-05-20
- **API:** Fixed rate-limit error responses on write endpoints to correctly return 429 (was 500 in v2 write path)
- **API:** Increased default rate limits: Professional 300→400 req/min, Enterprise 600→800 req/min
- **Billing:** Added itemised proration breakdown to invoice PDF (was previously a single "Proration" line)
- **Settings:** Renamed "Admin Console" tab to "Settings" across all navigation

## v3.41.0 — 2026-05-06
- **Exports:** Increased CSV export row limit from 10,000 to 50,000 rows for Professional and Enterprise plans
- **Mobile (iOS):** Fixed login loop that occurred after forced password reset when using OAuth
- **Workspace:** Added "Viewer" role — can view dashboards but not edit or export data

## v3.40.0 — 2026-04-22
- **SSO:** Added Azure AD as a supported SAML provider (previously Okta-only in the UI)
- **Webhooks:** Added webhook delivery retry logic — up to 3 retries with exponential backoff
- **Billing:** Annual billing toggle now available on the Pro plan (was Enterprise-only)

## v3.39.0 — 2026-04-08
- **API:** Added batch write endpoint `/api/v2/batch` — max 500 records per request
- **Integrations:** Jira Cloud integration now supports bidirectional sync
- **Mobile (iOS):** Added biometric authentication support (Face ID / Touch ID)
