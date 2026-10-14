---
name: promo-triggers
description: Decide whether a promotion should fire for a game, fire it exactly once with a stock check against store data, write the campaign plan into campaigns/, and review finished creative. Use when evaluating game-day or win promotions, or when asked to fire, review or report on a promotion.
---

# Promotion triggers

Turn games into campaigns, safely. A promotion fires **at most once per game**, only when its rule matches, and only to the extent the store can serve it. Every decision is written down, so anyone can see why something fired or did not.

## Inputs
- `/promotions.md`: the rules (`trigger`, `teams`, `home_only`, `season_types`, windows, `weather_modifier`, `inventory_check`, `max_redemptions`, `once_per`).
- `/games/*.md`: game files maintained by the Sports Desk.
- `/store-data/inventory.csv` and `/store-data/sales-daily.csv`: may be a read-only mount. Read them; never write to them.
- `/menu.md`, `/brand.md`, `/business.md` ("what we won't do"), `/learnings.md`.
- `/campaigns/index.md`: folder and brief conventions.

## Firing procedure (follow in order, for each promotion and each candidate game)

1. **Match the rule.** The game's `team` is in `teams`. If `home_only` is true, `home` must be true. `season_type` is in `season_types`. Then:
   - `trigger: game_day`: the game's New York date is today and `status` is `scheduled`.
   - `trigger: win`: `status: final`, `result: win` and `verified: true`.
   If any part fails, skip quietly.
2. **Already fired?** If the game's `promotions_fired` already has an entry with this promotion id, **stop**. Log exactly: `already fired for <game_id>`. Do this before writing anything.
3. **Half-finished earlier run?** If a folder `/campaigns/<date>-<team>-<promotion-id>/` already exists for this game but step 2 found no marker, a previous run stopped between writing the plan and writing the marker. Do **not** create a second campaign. Append the missing marker (step 7) using the existing folder and its `fired_at`, log exactly `repaired marker for <game_id>`, and stop.
4. **Time window.**
   - `game_day`: the current New York time must be inside `fire_window`. Outside it, log `outside fire window` and stop. A human can override by asking explicitly.
   - `win`: the `live_window` (on the day after the game) must not have ended yet. If it has already started, the plan and copy say "until noon today" and the Story should go out right away.
5. **Stock check.** `inventory_check` is a list. For each item in it, read its row from `/store-data/inventory.csv`:
   - `available = on_hand - reserve`
   - `need = max_redemptions × units_per_redemption`
   - item cap = `max_redemptions` if `available ≥ need`, else `floor(available ÷ units_per_redemption)` (0 if `available ≤ 0`)
   The promotion's cap is the **smallest** item cap, and the item that set it is the limiting item.
   - cap = `max_redemptions` → decision `ok`
   - 0 < cap < `max_redemptions` → decision `capped`. The copy must say the cap ("first 80 packs"), and the plan names the limiting item.
   - cap = 0 → decision `held`. Write the plan with `status: held` and a clear line for the human. Do not hand off to the creator.
   - File missing, or an item's row missing → treat that item as unlimited, and note "no inventory data for <item>" in the plan.
   Record every item in the plan's `inventory.checks` list (see template).
6. **Weather for the offer's day.** Every plan carries the weather for the day the offer is redeemed, so the creative can match it.
   - `game_day`: copy the game file's `weather`. If `precip_pct ≥ precip_pct_gte` or `temp_c ≤ temp_c_lte`, set `weather_mode: bad`, otherwise `good`. If the game file has no weather yet, fetch it as below.
   - `win`: fetch the forecast for the morning of the live window from Open-Meteo, using `weather.lat`/`lon` in `/teams.md`: `https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&daily=temperature_2m_max,precipitation_probability_max,weather_code&timezone=America/New_York&start_date=<day>&end_date=<day>`. If the day is in the past, use `https://archive-api.open-meteo.com/v1/archive` with the same parameters.
   - Write it to the plan as `weather_live: { day, summary, temp_c, precip_pct }` (`summary` is a short phrase: clear, partly cloudy, cloudy, rain, snow). If both sources fail, write `weather_live: null` and say so in the plan.
7. **Write the plan, then the marker.**
   1. Create `/campaigns/<YYYY-MM-DD>-<team>-<promotion-id>/index.md` (date of the game) from the template below.
   2. **Then** append to the game file's `promotions_fired`:
      `{promotion: <id>, campaign: <folder name>, fired_at: '<ISO with offset>'}`
   The marker is the commit point. Always write it last.
8. **No hand-off message.** Leave the plan at `status: draft` (or `held`). The Social Creator's Creative Queue job picks up draft plans from `/campaigns/` on its own. Do not dispatch or message other agents for routine work: in Cabinet those are proposals that wait for a human.

Log one line per decision, for example:
`fired win-slice for nhl-2026020123 (inventory ok, cap 200)` or `already fired for nhl-2026020123`.

## Queue scan (what the Promo Check job runs)
1. **Candidates:** games in `/games/` with `status: final`, `result: win`, `verified: true`, plus home games whose New York date is today with `status: scheduled`.
2. For each candidate, run the firing procedure above for every promotion. Most candidates stop at step 1 (rule does not match) or step 2 (already fired), which is expected.
3. **Review finished creative:** for every plan at `status: draft` whose folder has `post.svg`, `story.svg` and `caption.md`, check that the offer text matches the plan exactly, the cap is stated if capped, and nothing breaks `/brand.md`. If it passes, set `status: ready-for-review`. If not, add a dated "Fix needed" line to the plan and leave it at `draft`.
4. If there was nothing to fire and nothing to review, end with "Nothing to do".

## Campaign plan template
```markdown
---
title: Win Slice, Rangers 4 Islanders 2
promotion: win-slice
game_id: nhl-2026020123
status: draft
fired_at: '2026-10-06T22:44:00-04:00'
live: { from: '2026-10-07T06:00:00-04:00', to: '2026-10-07T12:00:00-04:00' }
weather_mode: null
weather_live: { day: '2026-10-07', summary: clear, temp_c: 18, precip_pct: 5 }
inventory:
  decision: ok
  cap: 200
  limiting_item: null
  checks:
    - { item: dough_balls, on_hand: 260, reserve: 20, need: 25, item_cap: 200 }
deliverables: [post.svg, story.svg, caption.md]
receipts: { trigger: final-score-check, game_file: games/2026-10-06-rangers-islanders.md, sources: [nhl, espn] }
---
# Win Slice, Rangers 4 Islanders 2

## Why it fired
One or two sentences: the game, the verified result, the sources, and a link to the game file.

## Offer (exactly as in promotions.md)
The `offer` text, verbatim, plus the cap if capped.

## Plan
| When | Where | What |
|---|---|---|
| 22:45 tonight | Story | Animated "We won" Story, offer and deadline |
| 06:00 tomorrow | Feed post | Score card post with the offer |
| 11:00 tomorrow | Story | "One hour left" reminder |

## Stock decision
The numbers from the inventory check and what they mean.

## What to measure
`promo_redemptions` for this promotion in sales-daily.csv the next day, against the cap.

## Approvals
- [ ] Owner approves offer and copy
- [ ] Creative checked against brand.md

## Results
Filled in after the campaign ends.
```
For `game_day`, `live` runs from the fire time until the game's start, `weather_mode` is `good` or `bad`, and the plan's first row is the pre-order post.

## Results
Measuring finished campaigns is the Results Analyst's job (the `results-analysis` skill). Leave the plan's Results section empty.

## Rules
- Never invent offers, prices or discounts. Use `/promotions.md` and `/menu.md` only.
- Never post anything. Plans end at `ready-for-review` or `held`.
- Write only campaign plans (never their Results section) and the `promotions_fired` marker in game files. Never edit scores, store data, creative files or `/learnings.md`.
- No team, league or arena logos, and no "official" or partnership language in any plan.
