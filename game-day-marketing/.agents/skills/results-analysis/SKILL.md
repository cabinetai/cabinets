---
name: results-analysis
description: Measure how each finished promotion did using the shop's sales data (redemptions against the cap, the day against a normal day), write the results into each campaign plan and the campaign log in learnings.md, and keep the standing lessons current. Use for the weekly results run or when asked how a promotion or the week went.
---

# Results analysis

Turn sales data into lessons the team can act on. The Promo Manager fires promotions; you measure them. Numbers come only from the files, and you show your working.

## Inputs
- `/store-data/sales-daily.csv` (read only): `date, slices_sold, pies_sold, revenue_usd, promo, promo_redemptions, game_id`.
- `/campaigns/*/index.md`: plans with `promotion`, `game_id`, `live`, `inventory.cap`, `status`.
- `/games/*.md` for context (opponent, score, home or away).
- `/learnings.md`: the campaign log and standing lessons.

## Baseline
- A **normal day** is a day in the file with an empty `promo`, on the same kind of day (Monday to Thursday, Friday, or weekend). If fewer than three such days exist, use all promo-free weekdays and say so.
- Baseline = the mean `revenue_usd` and mean `slices_sold` of those days.

## For each campaign to measure
Measure every plan whose `live.to` has passed and whose Results section is empty, plus anything you are asked about.
1. Find its sales row: `promo` equals the plan's `promotion` and `game_id` equals the plan's `game_id`; if no row has that `game_id`, use the row for the date of `live.from`.
2. Compute:
   - `redemptions / cap` as a percentage
   - revenue lift = `revenue_usd / baseline revenue - 1`, slices lift the same way
3. Write the plan's **Results** section: a three-row table (redemptions vs cap, revenue vs normal, slices vs normal) and one sentence of interpretation. Set `status: done`.
4. If there is no row yet, write "No sales data yet for <date>" and leave the status as it is.
5. Plans marked **DEMO** are measured only if a matching row exists; otherwise note "Demo campaign, not run" and leave them.

## learnings.md
- Add one row per measured campaign to the **Campaign log** table: campaign, date, redemptions (of cap), day vs normal, one-line lesson.
- Update **Standing lessons** only when at least two campaigns point the same way (for example, two Win Slice mornings both sold out before noon: "raise the cap"). Keep at most five lessons; replace weaker ones.
- Set `last_updated`.

## Report
Three lines: campaigns measured, the best and worst result, and any lesson that changed.

## Rules
- Write only campaign plans' Results sections and `status`, and `/learnings.md`. Never edit sales or inventory data, game files or creative.
- Every percentage must be reproducible from the CSV. If data is missing or odd (zero sales, a duplicated date), say so instead of guessing.
