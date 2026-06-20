# Product Coverage Gaps

Features shipped in release notes with no corresponding article in `/article-registry.md`. Logged by the Product Liaison; the Content Writer decides whether/when to write them.

| Feature | Release | Suggested article title | Notes |
|---|---|---|---|
| Azure AD SAML SSO | v3.40.0 (2026-04-22) | Setting up SSO with Azure AD | Registry has Okta only (`sso-okta-setup`, 34 ticket hits/7d in the SSO cluster — demand signal already exists). Cross-link from the Okta article. |
| Webhook delivery retries | v3.40.0 (2026-04-22) | How webhook delivery and retries work | No webhook article exists at all. Note: up to 3 retries with exponential backoff. |
| Annual billing on Pro plan | v3.40.0 (2026-04-22) | Switching to annual billing | Was Enterprise-only; now also Pro. Could be a section in an existing billing article instead of a standalone page. |
| Batch write endpoint `/api/v2/batch` | v3.39.0 (2026-04-08) | Using the batch write API endpoint | Max 500 records per request. Should state how a batch counts against rate limits — confirm with product first (release note doesn't specify). |
| Jira Cloud bidirectional sync | v3.39.0 (2026-04-08) | Setting up the Jira Cloud integration (two-way sync) | No integrations articles exist in the registry. |
| iOS biometric authentication (Face ID / Touch ID) | v3.39.0 (2026-04-08) | Using Face ID / Touch ID with the iOS app | Could fold into a broader mobile sign-in article. |
| Workspace "Viewer" role | v3.41.0 (2026-05-06) | — (covered by updating `workspace-roles`) | Not a standalone gap; tracked as a Misleading item in the 2026-06-12 stale sweep. |

**Last updated:** 2026-06-12 (catch-up sweep covering v3.39.0–v3.42.0)
