# QA Result — billing-proration-explain

**Result:** Blocked — first-time QA cannot run (draft file missing). Must remain Draft.
**Issues found:** `/macros/drafts/billing-proration-explain.md` does not exist, so the gating first-time QA could not be performed. Registry has carried this draft as "Awaiting QA" since at least 2026-05-23. This is the third macro on the billing-invoice-confusion cluster — when submitting, state how it divides scope with billing-invoice-explanation and refund-request-standard so the scope check can run.
**Revision request:** Commit the draft to `/macros/drafts/billing-proration-explain.md` (cluster: billing-invoice-confusion, category: Billing) with a one-line scope note distinguishing it from the two existing billing macros.
**Re-checked:** 2026-06-19 — still blocked, 2nd consecutive week. Writer task `e4947db8` (filed 2026-06-12) remains pending; no draft file produced. Publishing gate has now held this draft ~4+ weeks.
**QA date:** 2026-06-19 (re-check — still blocked; first blocked 2026-06-12)
