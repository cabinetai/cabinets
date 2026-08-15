# Escalation — Nexar Retail (re-escalation)

- **Date raised:** 2026-07-08 (daily escalation check)
- **Account:** Nexar Retail
- **ARR:** $130,000
- **Renewal date:** 2026-07-22 — **14 days out**
- **Risk tier:** High (health 49) — carried from 2026-05-23 sweep, not reassessed
- **Prior escalation:** 2026-07-06 (first) — unactioned

## Trigger fired
**Overdue open action item inside the 30-day window:**
- QBR scheduled, target Jun 10 (James R., due 2026-05-30) — **39 days overdue**, still Open; whether the QBR was held is `DATA_GAP`
- source: `renewals/action-items.md` · 2026-07-06

Aggravating contract flag (unchanged): assumed 30-day notice deadline ~2026-06-22 passed **16 days ago**, exact clause never confirmed (`DATA_GAP` since 2026-05-23). No `nexar-retail-renewal.md` action plan exists with 14 days to renewal.

## Triggers not evaluable — DATA_GAP
- New P1 since last sweep: `DATA_GAP` — no support data has ever been pulled for Nexar
- WAU drop >15% WoW: `DATA_GAP` — last known WAU declining 3 consecutive weeks as of 2026-05-23
- Live connectors still unreachable at 2026-07-08 check

## Requested owner action
Unchanged from `escalations/2026-07-06-nexar-retail.md`, now 48h stale:
- **James R. / Renewal CSM (this week):** Confirm notice/auto-renew terms and produce the action plan — 14 days left, no QBR on record in 100+ days, declining-usage signal.
- **Renewal Workflow (next pull):** Prioritize Nexar's support and usage pull — only in-window account with zero support data on file.
