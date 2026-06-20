# Renewals Pipeline — 90-Day Window
## Source week: May 23, 2026 · Refreshed 2026-06-18 (Renewal Workflow)

> ⚠ **PIPELINE WAS STALE.** No weekly sweep has run since the 2026-05-23 index (26 days).
> Per-account data files and the action-item tracker have now been bootstrapped from last-known
> sweep values (live CRM/Contracts/Support/Usage fields marked `DATA_GAP` — connectors not
> reachable this run). **Risk / Health / Expansion columns are carried forward from 2026-05-23 and
> not re-assessed** — risk assessment is the Renewal CSM's call. `Days` recomputed against 2026-06-18.

Sorted by days to renewal:

| Account | ARR | Renewal Date | Days (06-18) | Risk* | Health* | Notice Period | Data | Action Plan |
|---|---|---|---|---|---|---|---|---|
| Cobalt Partners | $62,000 | Jun 15, 2026 | **−3 LAPSED** ⚠ | Critical | 38 | **Lapsed (~May 16)** | [data](cobalt-partners-data.md) | ⛔ none on file |
| Atlas Logistics | $210,000 | Jul 1, 2026 | **13** ⚠ | Critical | 41 | likely lapsed (~Jun 1) — confirm | [data](atlas-logistics-data.md) | ⛔ none on file |
| Nexar Retail | $130,000 | Jul 22, 2026 | 34 | High | 49 | ~Jun 22 (4d) — confirm | [data](nexar-retail-data.md) | ⛔ none on file |
| Vantage Capital | $95,000 | Aug 30, 2026 | 73 | Medium | 67 | `DATA_GAP` | [data](vantage-capital-data.md) | ⛔ none on file |
| Stratum Energy | $175,000 | Sep 20, 2026 | 94 | Medium | 55 | `DATA_GAP` | [data](stratum-energy-data.md) | ⛔ none on file |

⚠ = inside the 30-day renewal window as of 2026-06-18.

**Total ARR in 90-day window:** **$672,000** *(corrected — prior index showed $497K, which omitted Stratum Energy's $175K)*
**At-risk ARR (High + Critical):** $402,000 — Cobalt + Atlas + Nexar
**Critical renewals ≤ 30 days:** **2** — Cobalt (lapsed) + Atlas (13d). *Board still shows 1; board refresh is the CSM's.*
**Expansion potential (Medium accounts):** est. $55,000 uplift (carried from 2026-05-23)

\* Notice-period dates assume a standard 30-day term where the exact clause is a `DATA_GAP`; confirm on the live contracts pull.

### Daily escalation check — 2026-06-18
- **Cobalt Partners** — renewal date lapsed 3 days ago, outcome untracked → `escalations/2026-06-18-cobalt-partners.md`
- **Atlas Logistics** — Critical $210K, 13 days out, no action plan → `escalations/2026-06-18-atlas-logistics.md`
- **Nexar Retail** — 34 days out; enters the 30-day window ~2026-06-22, and a 30-day notice deadline (~Jun 22) is 4 days away. Not escalated today; flagged in `nexar-retail-data.md`.
- Data pull + action-item tracker were missing this morning and have now been produced; **per-account action plans and the board refresh remain outstanding for the next CSM sweep.**
