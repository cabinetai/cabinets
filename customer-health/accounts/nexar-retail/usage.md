# Nexar Retail — Usage Sub-Score

_Health Analyst · heartbeat 2026-06-18_

**Usage sub-score: 50 / 100**  ·  trend ↓

## Source data
- Weekly active users: **down 3 consecutive weeks**
  `source: Mixpanel · pulled 2026-05-23` — NOT re-pulled this heartbeat
- Absolute WAU / seat utilization: not captured in last snapshot

## Derivation
Three straight weeks of decline is a sustained negative pattern (not noise), but no
single-week drop magnitude is on file, so this is not yet a confirmed anomaly-level
fall. Score 50 reflects a soft-but-eroding usage base.

## DATA_GAP
- Per-week WAU deltas not on disk — cannot confirm whether any single week crossed
  the 20%/25% anomaly thresholds. A live pull is needed to size the slope and decide
  whether Nexar should escalate from Watch.
