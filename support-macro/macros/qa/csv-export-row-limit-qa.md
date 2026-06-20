# QA Result — csv-export-row-limit

**Result:** Blocked — first-time QA cannot run (draft file missing). Must remain Draft.
**Issues found:** `/macros/drafts/csv-export-row-limit.md` does not exist, so the gating first-time QA could not be performed. Registry has carried this draft as "Awaiting QA" since at least 2026-05-23. Note: `index.md` shows it at 24 uses/7d, which contradicts its Draft/0-usage registry status — drafts must not be in live use before QA.
**Revision request:** Commit the draft to `/macros/drafts/csv-export-row-limit.md` (cluster: csv-export-issues, category: Technical). If the macro is already being used live, escalate — unreviewed macros must not reach customers.
**Re-checked:** 2026-06-19 — still blocked, 2nd consecutive week. Writer task `e4947db8` (filed 2026-06-12) remains pending; no draft file produced. Publishing gate has now held this draft ~4+ weeks. The `index.md` 24-uses/7d vs Draft/0-usage contradiction is also still unresolved — re-flagging as a possible QA-gate bypass.
**QA date:** 2026-06-19 (re-check — still blocked; first blocked 2026-06-12)
