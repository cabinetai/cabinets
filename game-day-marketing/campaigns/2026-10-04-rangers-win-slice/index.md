---
title: "DEMO (not to be posted): Win Slice, Rangers 4 Utah Mammoth 2"
promotion: win-slice
game_id: nhl-2026020036
status: draft
demo: true
fired_at: '2026-10-05T13:15:58-04:00'
live: { from: '2026-10-05T06:00:00-04:00', to: '2026-10-05T12:00:00-04:00' }
weather_mode: null
weather_live: { day: '2026-10-05', summary: cloudy, temp_c: 21, precip_pct: 1 }
inventory:
  decision: ok
  cap: 200
  limiting_item: null
  checks:
    - { item: dough_balls, on_hand: 260, reserve: 20, need: 25, item_cap: 200 }
deliverables: [post.svg, story.svg, caption.md]
receipts: { trigger: manual-demo-override, game_file: games/2026-10-04-rangers-mammoth.md, sources: [nhl, espn] }
---
# DEMO (not to be posted): Win Slice, Rangers 4 Utah Mammoth 2

> **DEMO ONLY. Do not post any of this.** This campaign was fired by a human demo override on
> 2026-10-05 at 13:15, after the live window (6 am to noon on 2026-10-05) had already closed.
> It exists to show what the Win Slice campaign would have looked like had the game file arrived
> in time. The offer is not redeemable and no creative from this folder should go to Instagram.

## Why it fired
The Rangers beat the Utah Mammoth 4-2 at home on 2026-10-04, a regular season game. The result is
verified: the NHL official API (game 2026020036, `gameState: OFF`) and ESPN both report 4-2 to the
Rangers, so the game file [[games/2026-10-04-rangers-mammoth]] carries `result: win` and
`verified: true`. That matches the `win-slice` rule (rangers is in `teams`, `home_only` is false,
`regular` is in `season_types`).

It did **not** fire on its own schedule. The game file was only written at 12:53 on 2026-10-05,
53 minutes after the live window closed, so the Promo Check runs at 08:10 and 10:10 found nothing
in `/games/` to evaluate. See [[learnings]]. This run is a human override for demonstration, which
is why the plan is marked DEMO rather than handed on for approval.

## Offer (exactly as in promotions.md)
**$1 cheese slice, 6 am to noon the morning after a win. One per person.**

Full cap of 200, no cap language needed in the copy.

## Plan
This is the schedule the campaign **would** have run on, kept for reference. Nothing here is to be
posted now: every time below is in the past and the window is closed.

| When | Where | What |
|---|---|---|
| 22:45 on 2026-10-04 | Story | Animated "We won" Story, 4-2, offer and the noon deadline |
| 06:00 on 2026-10-05 | Feed post | Score card post with the $1 cheese slice offer |
| 11:00 on 2026-10-05 | Story | "One hour left" reminder |

Weather for the redemption morning was cloudy, 21 C, 1% chance of rain: a dry, mild walk-up
morning, so the creative would lead with grabbing a slice on the way in rather than delivery.

## Stock decision
Decision `ok`, cap 200, no limiting item.

- `dough_balls`: 260 on hand, 20 kept back, so 240 available. One Win Slice is an eighth of a pie
  (0.125 dough balls), so a full 200 redemptions need 25. 240 available against 25 needed, which
  clears the cap comfortably.

Stock was never the constraint here. Dough allowed the full cap on the morning itself.

## What to measure
`promo_redemptions` for `win-slice` in `/store-data/sales-daily.csv` for 2026-10-05, against the
cap of 200, with slices and revenue compared to the average of the other 13 days in the file.
Because this is a demo fired after the window closed, no redemptions will be recorded against it
and the Results section should stay empty.

## Approvals
- [ ] Owner approves offer and copy — **not required, DEMO, not to be posted**
- [ ] Creative checked against brand.md — **not required, DEMO, not to be posted**

## Results
None. The offer never ran: the live window closed at noon on 2026-10-05, before this plan was
written. Left empty on purpose.
