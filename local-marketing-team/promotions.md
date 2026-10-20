---
title: Promotions
order: 7
promotions:
  - id: game-day-taco-bucket
    name: Game Day Taco Bucket
    offer: "24 tacos, chips and 3 salsas for $64. Order ahead, ready at kickoff minus two hours."
    fits: [sports, watch-party, tailgate]
    dayparts: [lunch, afternoon]
    locations: [north-loop, south-lamar]
    segments: [game-day-groups, students]
    lead_time_days: 3
    constraints: "Pre-order by 20:00 the night before. Pickup only. Max 40 buckets per location per day."
    margin: high
  - id: late-night-al-pastor
    name: Late Night Al Pastor
    offer: "Late Night Four Pack (4 al pastor tacos and chips) for $16 after 21:00. Show a same-day event wristband or ticket for free horchata."
    fits: [concert, festival, nightlife]
    dayparts: [late-night]
    locations: [south-lamar, north-loop]
    segments: [late-night-crowd]
    lead_time_days: 2
    constraints: "21:00 to close only. Walk-up window and counter, not delivery. Horchata add-on limited to one per wristband."
    margin: medium
  - id: catering-tray-bundle
    name: Taco Bar Catering Tray
    offer: "Taco bar for 10 or more at $14 per person, free delivery within 5 miles for orders of 20 or more."
    fits: [holiday, community, watch-party, office]
    dayparts: [lunch, dinner]
    locations: [east-cesar-chavez]
    segments: [neighborhood-regulars, game-day-groups]
    lead_time_days: 5
    constraints: "48 hours notice. East Cesar Chavez kitchen only."
    margin: high
  - id: rainy-day-consomme
    name: Rainy Day Consommé
    offer: "Free cup of consommé with any two brisket barbacoa tacos on rainy or cold days (under 50°F)."
    fits: [weather]
    dayparts: [lunch, dinner]
    locations: [south-lamar, east-cesar-chavez, north-loop]
    segments: [neighborhood-regulars, students]
    lead_time_days: 0
    constraints: "Only on days with rain in the forecast or a high under 50°F. Announce the same morning."
    margin: medium
  - id: breakfast-taco-tuesday
    name: Breakfast Taco Two-Step
    offer: "Two breakfast tacos and a coffee for $7 before 11:00."
    fits: [community, everyday]
    dayparts: [breakfast]
    locations: [east-cesar-chavez]
    segments: [neighborhood-regulars]
    lead_time_days: 1
    constraints: "Before 11:00. Not combined with other offers."
    margin: medium
---
# Promotions

> Example promotion library. Replace with your own offers, but keep the fields.

These are the offers the team is allowed to run. Agents match events to these offers. They never invent a new discount; if nothing fits, they say so and suggest a new promotion for a human to approve.

## Fields
| Field | Meaning |
|---|---|
| `id` | Stable key. Opportunities and campaigns refer to it. |
| `offer` | The exact customer-facing offer and price. Copy must not go beyond this. |
| `fits` | Moment types this works for: `sports`, `watch-party`, `tailgate`, `concert`, `festival`, `nightlife`, `holiday`, `community`, `weather`, `office`, `everyday`. |
| `dayparts` | `breakfast`, `lunch`, `afternoon`, `dinner`, `late-night`. |
| `locations` | Location ids from [[locations]] that can run it. |
| `segments` | Audience ids from [[audience]] it is built for. |
| `lead_time_days` | How far ahead the campaign has to start to work. |
| `constraints` | Operational limits. Every post must respect these. |
| `margin` | `high`, `medium` or `low`. Prefer higher margin when two offers fit equally. |

## Adding a promotion
Add an entry to the frontmatter list and a short note below explaining when it has worked. A promotion with no `fits` will never be matched.

## Notes
- **Game Day Taco Bucket** is our strongest group order. Football Saturdays at North Loop sell out when announced by Thursday.
- **Late Night Al Pastor** works when there is a crowd walking past after 21:00. Weak on weeknights without an event.
