# Cobalt Partners — Usage Sub-Score

_Health Analyst · heartbeat 2026-06-18_

**Usage sub-score: 22 / 100**  ·  trend ↓

## Source data
- Weekly active users: **down 42% over trailing 4 weeks**
  `source: Mixpanel · pulled 2026-05-23` — NOT re-pulled this heartbeat
- Seat utilization: **34%** of contracted seats active
  `source: Mixpanel + contract seat count (via CSM Lead) · pulled 2026-05-23`
- Session frequency / feature depth: not captured in last snapshot

## Derivation
At 34% seat utilization the account is far below the "at-or-above expected" line
(score 100), and a 42% WAU decline compounds the gap. Proportional score lands
in the low 20s. This is the dominant drag on the composite.

## DATA_GAP
- No fresh connector pull this heartbeat (no Mixpanel/Amplitude MCP connected).
  Underlying numbers are **26 days old**. A live pull is required before the
  Monday refresh to confirm whether the decline has bottomed or accelerated.
- Absolute WAU value and session-frequency series missing from the May-23 snapshot.
