# Analyst Sub-Score Summary

_Health Analyst · heartbeat 2026-06-18 · feeds the Monday weekly-health-refresh_

> **The data engine for the CSM Lead's composite scores.** Composite weighting (set by
> the refresh job): Usage 35% · Support 25% · Engagement 25% · Adoption 15%.
> I produce the four sub-scores; the CSM Lead reconciles them into the published
> health score and risk tier.

## ⚠️ Portfolio-wide data freshness gap

**All source data is from the 2026-05-23 snapshot — 26 days old as of today.** No live
connector pull was possible this heartbeat (no Mixpanel/Amplitude/Zendesk MCP is
connected; only Discord/GitHub/Google/Notion are available). Every sub-score below
carries `pulled 2026-05-23` provenance and is **directionally valid but not current**.
A live re-pull is required before the Monday refresh. Time-sensitive facts have already
moved — see the anomaly alert (`alerts/anomaly-2026-06-18.md`).

## Sub-scores — 90-day renewal-window accounts

| Account | Usage | Support | Engagement | Adoption | Implied composite | CSM-published | Δ |
|---|---|---|---|---|---|---|---|
| Cobalt Partners | 22 | 30 | 38 | 30 | **30** | 38 | **−8 ⚑** |
| Atlas Logistics | 45 | 38 | 48 | 55 | **46** | 41 | +5 |
| Nexar Retail | 50 | 60 | 45 | 55 | **52** | 49 | +3 |
| Vantage Capital | 70 | 70 | 65 | 65 | **68** | 67 | +1 |

_Implied composite = 0.35·U + 0.25·S + 0.25·E + 0.15·A, rounded. The published score is
the CSM Lead's call — I do not override it._

### ⚑ Divergence flag — Cobalt Partners
My decomposition implies **~30**, eight points below the published **38**. The gap is
driven by Usage (22) and Adoption (30): 34% seat utilization plus a 42% WAU decline are
worse on the sub-score axes than a 38 composite reflects. **Recommend the CSM Lead
recheck source data and reconcile before Monday** — per the "flag, don't override" rule.

## Accounts still pending sub-score data

These four were not decomposed this heartbeat (no documented per-axis signals in the
May-23 snapshot beyond the headline trend). They need a data pull before Monday so the
full portfolio has sub-score provenance:

| Account | Published health | Note |
|---|---|---|
| Meridian Foods | 82 (Healthy) | ↑ usage, 1 ticket — confirm sub-scores hold |
| Primoris Health | 74 (Healthy) | ↑ usage, 2 tickets — largest ARR ($320K), prioritize |
| Linden Group | 79 (Healthy) | ↑ usage, 0 tickets — likely clean |
| Stratum Energy | 55 (Watch) | → usage, 4 tickets — Watch tier, decompose to confirm |

## Provenance index
Per-account sub-score files (source lines inside each):
- `accounts/cobalt-partners/{usage,support,engagement,adoption}.md`
- `accounts/atlas-logistics/{usage,support,engagement,adoption}.md`
- `accounts/nexar-retail/{usage,support,engagement,adoption}.md`
- `accounts/vantage-capital/{usage,support,engagement,adoption}.md`
