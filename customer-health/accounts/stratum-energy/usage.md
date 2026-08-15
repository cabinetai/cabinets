# Stratum Energy — Usage Sub-Score

_Health Analyst · heartbeat 2026-07-06_

**Usage sub-score: N/A**  ·  documented trend →

## Source data
- Usage trend: **flat / stable** (→ in portfolio snapshot)
  `source: Mixpanel · pulled 2026-05-23` — 44 days stale, NOT re-pulled this heartbeat
- Absolute WAU / seat utilization: never captured for this account

## Derivation
Scored **N/A**: the only usage signal on file is a headline trend arrow from a
44-day-old snapshot. Stratum entered the 90-day renewal window on ~2026-06-22
(renews 2026-09-20 — 76 days out as of today), so this axis now matters for the
Monday refresh and needs a real pull, not a guess. A flat trend on a Watch-tier
account is consistent with anything from 40 to 75; I won't pick a number without
WAU-vs-seats data.

## DATA_GAP
- No WAU series, no contracted seat count, no session-frequency data on file.
- 44-day-old trend arrow is the sole usage evidence. Live Mixpanel/Amplitude pull
  required before this axis can carry a score.
