---
title: Promotions
order: 5
promotions:
  - id: game-night-slice-pack
    name: Game Night Slice Pack
    offer: "4 slices + garlic knots for $22. Pre-order, ready 45 minutes before puck drop or tip-off."
    trigger: game_day
    teams: [knicks, rangers]
    home_only: true
    season_types: [regular, postseason]
    fire_window: { from: '09:00', to: '12:00' }
    weather_modifier:
      bad_weather_if: { precip_pct_gte: 50, temp_c_lte: 4 }
      bad: "Delivery first. Lead with: Stay dry, we'll bring the game snacks."
      good: "Walk-up first. Lead with: Grab it on your way to the Garden."
    inventory_check:
      - { item: dough_balls, units_per_redemption: 0.5, reserve: 40 }
      - { item: garlic_knots_batches, units_per_redemption: 0.125, reserve: 2 }
    max_redemptions: 120
    once_per: game
  - id: win-slice
    name: Win Slice
    offer: "$1 cheese slice, 6 am to noon the morning after a win. One per person."
    trigger: win
    teams: [knicks, rangers]
    home_only: false
    season_types: [regular, postseason]
    live_window: { from: '06:00', to: '12:00', day: next }
    inventory_check:
      - { item: dough_balls, units_per_redemption: 0.125, reserve: 20 }
    max_redemptions: 200
    once_per: game
---
# Promotions

The offers this shop is allowed to run, written as rules. The Promo Manager fires them; it never invents a new offer or changes a price. If a moment deserves an offer that is not here, it suggests one for a human to approve.

> Example promotions. Replace with your own and keep the fields.

## Fields
| Field | Meaning |
|---|---|
| `id` | Stable key. Game files and campaigns refer to it. |
| `offer` | The exact customer-facing offer. Copy must say exactly this. |
| `trigger` | `game_day` fires on the day of a qualifying game. `win` fires after a verified win. |
| `teams` | Team ids from [[teams]]. |
| `home_only` | `true`: only home games count. |
| `season_types` | Which games count: `preseason`, `regular`, `postseason`. |
| `fire_window` | Time of day a `game_day` promotion may be fired. |
| `live_window` | When a `win` promotion is redeemable (`day: next` means the morning after). |
| `weather_modifier` | How bad weather changes the copy. It never cancels the promotion. |
| `inventory_check` | A list of stock items that limit it. For each: how much one redemption uses and how much to keep back (`reserve`). |
| `max_redemptions` | The planned cap. Lowered automatically if stock is short. |
| `once_per` | `game`: a promotion fires at most once per game, ever. |

## How the inventory check works
For each item in `inventory_check`, available stock is `on_hand` minus `reserve` from [[store-data/index]], and the promotion needs `max_redemptions × units_per_redemption`. The tightest item sets the cap.

- Enough of everything: fire as planned.
- Short on something: fire with a lower cap, and say the cap in the copy ("first 80 packs").
- Out of something: hold the promotion and tell a human.

Example: a Game Night Slice Pack includes 6 garlic knots, and one batch makes 48, so each pack uses 0.125 of a batch. With 12 batches on hand and 2 kept back, knots allow 80 packs even though dough allows 120. The pack fires capped at 80 unless knots are restocked first.

## When each one works
- **Game Night Slice Pack.** Hockey and basketball nights at the Garden bring a pre-game rush between 5:30 and 7:00 pm. Pre-orders keep the line moving.
- **Win Slice.** The morning after a win, fans want to keep celebrating. A $1 slice is cheap for us (one eighth of a pie) and brings people in before lunch.
