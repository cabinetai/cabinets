---
title: Opportunities
order: 11
---
# Opportunities

A marketing opportunity is an upcoming event plus the promotion (or promotions) that fit it, scored and explained. The Local Researcher writes these using the `promotion-matching` skill. The Marketing Lead decides which ones become campaigns.

> The examples here are illustrative. Event dates must be verified before a campaign goes live.

## File name
`YYYY-MM-DD-event-slug-location-id.md`, dated by the event.

## Frontmatter
| Field | Meaning |
|---|---|
| `title` | One line: moment + location + offer idea. |
| `event` | File name (without `.md`) of the event in [[events]]. |
| `location` | Location id from [[locations]]. |
| `category` | Copied from the event. |
| `window_start` / `window_end` | When the campaign should be live (from the promotion's `lead_time_days`). |
| `fit_score` | 1 to 5, the score of the best matched promotion. |
| `status` | `new`, `shortlisted`, `campaign`, `passed` or `expired`. |
| `campaign` | Campaign folder name once one exists. |
| `matched_promotions` | List of `promotion` (id), `score` (1 to 5) and `reasoning` (one or two sentences). Best first. |
| `created` | ISO date. |

## Body
1. **Why this moment matters**: crowd, timing, which segment.
2. **Recommended angle**: one sentence a creator can work from.
3. **Risks and constraints**: capacity, trademarks, unverified facts.
4. **Not matched**: promotions that were considered and rejected, and why.

## Status flow
`new` → `shortlisted` (Lead likes it) → `campaign` (brief written) or `passed`. Anything whose window has ended becomes `expired`.
