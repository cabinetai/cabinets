# Escalation — Cobalt Partners

- **Date raised:** 2026-06-18 (daily escalation check)
- **Account:** Cobalt Partners
- **ARR:** $62,000
- **Renewal date:** 2026-06-15 — **LAPSED 3 days ago**
- **Days to renewal:** −3 (past due)
- **Risk tier:** Critical (health 38) — *carried forward from `renewals/index.md` dated 2026-05-23; not re-verified this run*

## Trigger fired
**Renewal date passed with no recorded outcome.** Cobalt's contract renewal date (2026-06-15) is now 3 days in the past. There is no `renewals/cobalt-partners-data.md` and no `renewals/cobalt-partners-renewal.md`, so the outcome (renewed / churned / holdover) is unknown. Any contract notice window has, by definition, already closed.

This is strictly more urgent than the enumerated "notice period expiring in < 3 days" trigger — the renewal itself has already elapsed.

## Triggers that could NOT be evaluated — DATA_GAP
The four standard daily triggers depend on source files that do not exist in this cabinet:

- New P1 ticket since last sweep — no `renewals/cobalt-partners-data.md`
- WAU drop > 15% WoW — no `renewals/cobalt-partners-data.md`
- Overdue open action item — no `renewals/action-items.md`
- Exact contract notice deadline — no contract data file

source: `renewals/index.md` · week of 2026-05-23 (stale, 26 days old)

## Requested owner action
- **James R. / VP CS (immediate):** Confirm Cobalt's renewal status with CRM/Finance — did it renew, churn, or enter a holdover/grace period on 2026-06-15? A $62K Critical account whose renewal date passed untracked is a live churn-exposure event.
- **Renewal Workflow (today):** Run the overdue data pull for Cobalt (CRM, contracts, support, usage) so the outcome and any post-renewal obligations are on record before the next CSM sweep.

## Update — 2026-06-18 (Renewal Workflow heartbeat)
Data pull **completed** → `renewals/cobalt-partners-data.md` now exists (last-known values from the 2026-05-23 sweep; live CRM/Contracts/Support/Usage fields marked `DATA_GAP` — connectors not reachable this run). Action-item tracker created → `renewals/action-items.md` (Cobalt's 2 items now 24d/22d overdue). The "no data file" gaps cited above are closed; the **live contract-status confirmation (auto-renew vs. lapse) remains open** for Sales/Finance.
