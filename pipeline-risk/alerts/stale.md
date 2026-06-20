# Today's Stale Deal Alerts — 2026-06-18

> ⚠️ **DATA-FRESHNESS CRITICAL — read before acting on the numbers below.**
> The newest CRM snapshot available to this job (`/pipeline/scores.md`) is dated **2026-05-23 — 26 days old.**
> No live CRM/Salesforce connection is available to this run, so I cannot certify any deal's *current*
> stage, activity, or close date. Every "Days Stale" and "Days Since Activity" figure below is the
> 2026-05-23 value **projected forward 26 days assuming zero deal movement** — a deliberately conservative
> (worst-case) assumption, not a verified fact. Close dates are carried from the 2026-05-23 alert where known.
>
> **The projection is itself the signal:** under it, *all 9 Stage-2-or-later deals* trip the stage-stale
> and 14-day-activity thresholds. When everything flags, the snapshot — not the pipeline — is what's broken.
> **Action before Monday's forecast call: pull a fresh CRM export and re-run this check.** The four deals
> below are the ones that already mattered on 2026-05-23 and would now be inside or near their close window.

| Deal | ARR | Stage | Days Stale* | Days Since Activity* | Days to Close | Flag |
|---|---|---|---|---|---|---|
| Nexora Biotech | $520k | 2-Discovery | ~57 | ~44 | 12 | stage-stale + budget-freeze mentioned + close-window (Critical) |
| Crestline Health | $420k | 2-Discovery | ~50 | ~50 | 12 | stage-stale + economic-buyer-absent + close-window (High) |
| Atlas Logistics Exp. | $310k | 3-Demo | ~44 | ~44 | 12 | stage-stale + no-champion + competitor-active + close-window (Critical) |
| Pacific Coast Media | $44k | 3-Demo | ~35 | ~35 | 27 | stage-stale + no-next-step-confirmed |

\* Projected from the 2026-05-23 snapshot (+26 days, no movement assumed). Verify against live CRM before the forecast call.

**Why these four and not all nine:** mechanically, every Stage-2+ deal trips threshold 1 (stage-stale 21+d)
and threshold 2 (activity 14+d) under pure projection — but that is an artifact of the stale snapshot, not a
real surge. The four above are the deals that were *already* High/Critical on 2026-05-23 **and** sit inside a
~2-week window to a quarter-end (2026-06-30) close, so they need a manager decision today regardless of refresh.
The other five Stage-2+ deals (Meridian, Vantage, Harrow & Webb, Solaris, Summit) are listed in the projection
note below and should be re-scored from fresh data, not actioned off this stale snapshot.

**Projected stage-stale on all Stage-2+ deals (pending CRM refresh, not separately actioned):**
Meridian Foods Enterprise ($187k, 4-Proposal, ~28d) · Vantage Retail Platform ($95k, 5-Negotiation, ~31d) ·
Harrow & Webb LLP ($62k, 4-Proposal, ~29d) · Solaris Manufacturing ($158k, 3-Demo, ~37d) ·
Summit Foods Co ($73k, 5-Negotiation, ~27d). *(Edgemont Capital is Stage 1 — excluded from the stage-stale threshold.)*

**Recommended next step:** Customer Agent to verify current stage / last-activity / next-step for the top three
(Nexora, Atlas, Crestline) against Gong + recent email so the Monday report runs on facts, not a 26-day-old export.

---

## Full stale log

| Date | Deal | ARR | Stage | Days Stale | Days Since Activity | Days to Close | Flag |
|---|---|---|---|---|---|---|---|
| 2026-06-18 | Nexora Biotech | $520k | 2-Discovery | ~57 (proj.) | ~44 (proj.) | 12 | stage-stale + budget-freeze + close-window — PROJECTED from 2026-05-23 snapshot |
| 2026-06-18 | Crestline Health | $420k | 2-Discovery | ~50 (proj.) | ~50 (proj.) | 12 | stage-stale + economic-buyer-absent + close-window — PROJECTED from 2026-05-23 snapshot |
| 2026-06-18 | Atlas Logistics | $310k | 3-Demo | ~44 (proj.) | ~44 (proj.) | 12 | stage-stale + no-champion + competitor-active + close-window — PROJECTED from 2026-05-23 snapshot |
| 2026-06-18 | Pacific Coast Media | $44k | 3-Demo | ~35 (proj.) | ~35 (proj.) | 27 | stage-stale + no-next-step — PROJECTED from 2026-05-23 snapshot |
| 2026-05-23 | Nexora Biotech | $520k | 2-Discovery | 31 | 18 | 38 | stage-stale |
| 2026-05-23 | Atlas Logistics | $310k | 3-Demo | 18 | 18 | 38 | stage-stale |
| 2026-05-22 | Crestline Health | $420k | 2-Discovery | 23 | 23 | 39 | stage-stale |
| 2026-05-21 | Crestline Health | $420k | 2-Discovery | 22 | 22 | 40 | stage-stale |
