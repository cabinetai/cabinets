---
name: weekly-planning
description: Plan the shop's week against its games and stock (which games qualify for which promotion, the stock each will use, a restock order, and anything a human must decide), keep the team's work moving by delegating in the right order, and summarize last week's results. Use for the Monday plan, "what does this week look like", restock questions, or a weekly review.
---

# Weekly planning

Own the week. The Sports Desk, Promo Manager and Social Creator react to individual games; you look at all of them together, make sure the shop can serve every promotion it is likely to fire, and spot anything stuck. You write one page: `/week-ahead.md`.

## Inputs
- `/games/*.md` and `/games/index.md` (`last_synced`).
- `/promotions.md`: rules, `max_redemptions`, every `inventory_check` item.
- `/store-data/inventory.csv` and `/store-data/sales-daily.csv` (read only).
- `/campaigns/*/index.md`: status of each campaign.
- `/learnings.md`.

## Procedure

1. **Is the calendar fresh?** If `last_synced` is missing or older than 24 hours, or `/games/` has no game this week, propose a task for the Sports Desk: "Run a schedule sync for the next 7 days using game-tracking." (Cabinet asks a human to approve proposals.) Then **stop**, and write in `/week-ahead.md` that the plan waits for the sync. Do not plan from an empty or stale calendar.
2. **Which games qualify?** For each game this week (Monday to Sunday, New York dates), list every promotion whose rule it can match: game-day promotions for qualifying home games, and the win promotion for every qualifying game "if they win". Check `season_type` against `season_types` and `home` against `home_only`.
3. **Stock for the week.** For every stock item named in any `inventory_check`:
   - Expected use = the sum over qualifying games of `max_redemptions × units_per_redemption`. Count game-day promotions in full, and count win promotions at 50% (a win is not guaranteed).
   - Compare with `on_hand − reserve`. Note the first game at which the item would cap or hold a promotion.
   - If an item runs short before the last qualifying game, write a **restock order**: item, quantity to bring it back to `par_level` plus the week's expected use, and the date it must arrive by (the day before the first game it would cap).
4. **Gaps in the rules.** If a promotion uses an ingredient that its `inventory_check` does not list (for example, an offer that includes a side), flag it as a decision for a human. Never edit `/promotions.md` yourself.
5. **What is stuck?** List campaigns at `ready-for-review` for more than 24 hours (they need a human), campaigns at `held`, and finished games from the last 2 days that are still `verified: false`. For an unverified game, propose a re-check for the Sports Desk.
6. **Last week.** From `/store-data/sales-daily.csv`, summarize the previous Monday to Sunday: revenue and slices against the average normal weekday, promotion days and their redemptions against caps. One short table.
7. **Write `/week-ahead.md`** from the template below, replacing the whole page. Set `prepared` to now.
8. **Report** in three lines: games this week, the restock order (or "no restock needed"), and the decisions waiting for a human.

## `/week-ahead.md` template
```markdown
---
title: Week Ahead
order: 11
week_of: 'YYYY-MM-DD'        # Monday
week_through: 'YYYY-MM-DD'   # Sunday
prepared: '<ISO with offset>'
calendar_fresh: true
restock_needed: false
---
# Week Ahead: <Mon date> to <Sun date>

## This week's games
| Game | When | Home | Season | Can fire |
|---|---|---|---|---|

## Stock for the week
| Item | Available | Expected use | Runs short at | Restock |
|---|---|---|---|---|

## Restock order
Item, quantity, needed by. Or "No restock needed".

## Decisions for you
Numbered list. Or "Nothing needs you this week".

## Stuck
Campaigns waiting for approval, held campaigns, unverified games.

## Last week
| Day type | Days | Avg revenue | Avg slices | Redemptions vs cap |
|---|---|---|---|---|
```

## Rules
- Write only `/week-ahead.md`. Delegate everything else.
- Delegation is a proposal a human approves. Routine order comes from the job schedule; propose work only for exceptions, and never two dependent tasks at once.
- Never fire promotions (that is the Promo Manager's job) and never edit store data, games or campaigns.
- Numbers come from the files. If a number is missing, say so instead of estimating silently.
