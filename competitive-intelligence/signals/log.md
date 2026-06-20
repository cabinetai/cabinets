---
title: Signal Log
modified: '2026-06-18T00:00:00Z'
tags: [competitive-intelligence, signals]
---
# Signal Log

Append-only stream of competitor deltas, logged each morning by the Signal Scout. Every row carries a source. The weekly briefing is built from the last 7 days of this log; the monthly landscape from the last 4 weeks.

`date | competitor | type | description | source | materiality`

## 2026-06-18 — week 25 · Daily sweep (Tier 1)

**⚑ DIRECTOR FLAG (operational — not a competitor move):** The daily scan last logged verified deltas on **2026-05-19**; today is 2026-06-18 — a ~30-day / 3-week coverage gap (weeks 22–24 empty). Root cause is not competitor quiet: no live source endpoints are wired up, so the sweep has nothing to diff. Tier 1 has effectively been unwatched for a month. Recommend confirming the source feeds (changelog / pricing / careers / G2 / news) are configured before the next weekly briefing leans on this log.

**Coverage:** Tier 1 swept — Northwind, Helios. Tier 2 (Cobalt, Drachma) not due — Tier 2 sweeps Mondays only; today is Thursday.

**New verified signals:** 0. Every tracked endpoint resolves to a demo placeholder (`#` in the profiles), so no delta can be sourced. Per the Scout rule — no link → not logged as fact — no fabricated rows are appended.

- `2026-06-18 | Northwind, Helios | sweep | Tier 1 morning sweep run; 0 verified new deltas vs 2026-05-19. No diffable live sources configured — changelog/pricing/blog/careers/G2 all resolve to demo placeholders. | n/a | unverified`

### Digest — 2026-06-18
- **New signals:** 0 verified (1 sweep-status row, unverified).
- **Material:** 0 new. Standing material items unchanged since 2026-05-19 — Northwind Pro −20% + SSO-on-Pro; Northwind SOC2/Security tab; Northwind NYC enterprise hiring.
- **Top 3 to watch** (open threads carried forward):
  1. **Northwind → upmarket.** NYC enterprise AE hires (04-30) + SOC2/Security tab (05-12) + SSO down-tier (05-19) all point one way. Escalate on: an Enterprise tier launch or an **EU data-residency** announcement — the latter closes our #1 win condition.
  2. **Helios "AI Assistant" GA.** Beta/waitlist since 05-08, still no GA as of 06-12. A GA date dents our velocity narrative — watch the blog / changelog.
  3. **Northwind support SLA.** Repeated G2/Capterra complaints (05-14, 05-16). Fixed → a trap we set disappears; worse → our wedge deepens. Watch review velocity.

## 2026-05-19 — week 21
- `2026-05-19 | Northwind | pricing | Pro cut $99→$79; SSO moved to Pro tier | pricing-page diff | **MATERIAL**`
- `2026-05-19 | Northwind | product | "Bulk import v2" shipped | changelog | minor`
- `2026-05-16 | Helios | review | 3 new G2 reviews citing slow support + price uplift | G2 | minor`
- `2026-05-14 | Northwind | review | Capterra review: "support took 4 days" | Capterra | minor`
- `2026-05-12 | Northwind | positioning | Added "Security" tab + SOC2 badge to pricing page | pricing page | **MATERIAL**`

## 2026-05-12 — week 20
- `2026-05-08 | Helios | product | "AI Assistant" beta announced, waitlist only, no GA | blog | minor`
- `2026-05-06 | Cobalt | funding | Raised $22M Series B | press | minor`
- `2026-04-30 | Northwind | hiring | 4 enterprise AE roles posted in NYC — moving upmarket | careers | **MATERIAL**`

## Materiality key
- **MATERIAL** — enters the weekly briefing with an implication for us.
- minor — stays in the log; rolls up into the monthly only if a pattern forms.
- noise — logged for completeness, never surfaced.
