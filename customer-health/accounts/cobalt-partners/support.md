# Cobalt Partners — Support Sub-Score

_Health Analyst · heartbeat 2026-06-18_

**Support sub-score: 30 / 100**

## Source data
- Open tickets: **11** (3 × P2 unresolved > 5 days)
  `source: Zendesk · pulled 2026-05-23` — NOT re-pulled this heartbeat
- No open P1 recorded in the last snapshot

## Derivation
Relative to a $62K account (small/mid footprint), 11 open tickets is a crisis-level
load — well above the historical baseline for a book this size. Three P2s unresolved
> 5 days breach internal SLA. No P1, so the score stays above the automatic < 50
floor reserved for an open P1 > 48 h, but ticket volume + aged P2s pin it at 30.

## DATA_GAP
- No fresh Zendesk pull this heartbeat. Ticket count and P2 ages are 26 days old;
  the aged P2s may now be far past 5 days or resolved. Re-pull before Monday.
- 30-day ticket baseline for this account not on disk — relative spike % is an
  estimate against book-size norms, not a measured baseline.
