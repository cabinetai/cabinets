# Change Risk Matrix

Score = Probability (1–4) × Impact (1–4)
Risk level: 1–4 = Low · 5–9 = Medium · 10–13 = High · 14–16 = Critical

## Probability scale

| Score | Level | Definition |
|---|---|---|
| 1 | Unlikely | Proven pattern, no incidents in last 6 months |
| 2 | Possible | Implemented successfully before; minor unknowns |
| 3 | Likely | New or modified approach; some unknowns |
| 4 | Highly likely | First time, untested in prod, or known issues |

## Impact scale

| Score | Level | Definition |
|---|---|---|
| 1 | Minimal | Cosmetic or <10 users affected; no revenue impact |
| 2 | Moderate | One team affected (<100 users); short downtime acceptable |
| 3 | Significant | One service down (<1,000 users); potential revenue impact |
| 4 | Critical | Core services down (>1,000 users), data integrity risk, or revenue loss |

## Change type thresholds

| Risk score | Risk level | Change type | CAB required? |
|---|---|---|---|
| 1–4 | Low | Standard | No (if matches standard-change template) |
| 5–9 | Medium | Normal | Yes |
| 10–13 | High | Normal | Yes |
| 14–16 | Critical | Normal or Emergency | Yes (with CISO/CTO) |
