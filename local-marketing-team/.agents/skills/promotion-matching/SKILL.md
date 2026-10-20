---
name: promotion-matching
description: Score every promotion in the cabinet's promotion library against an upcoming event and location, explain each score, and write or update a marketing opportunity file. Use when deciding which offer fits a game, concert, festival, holiday or weather moment, or when creating files in opportunities/.
---

# Promotion matching

Match a moment (an event file in `/events/`) to the offers the business already runs (the `promotions` list in `/promotions.md`). The output is an opportunity file in `/opportunities/` whose `matched_promotions` are scored and explained, best first.

## Inputs
- The event file.
- `/promotions.md` frontmatter: `id`, `offer`, `fits`, `dayparts`, `locations`, `segments`, `lead_time_days`, `constraints`, `margin`.
- `/locations.md` (hours matter: a location that closes at 22:00 cannot run late-night offers).
- `/audience.md` segments and `/learnings.md` (past results raise or lower confidence).
- `/opportunities/index.md` for the file schema.

## Scoring (1 to 5 per promotion, per location)
Start at 1 and add:

| Check | Points |
|---|---|
| Event `category` (or an obvious moment type such as watch-party or nightlife) is in the promotion's `fits` | +1 |
| The location is in the promotion's `locations` and is open during the relevant daypart | +1 |
| The crowd's timing lines up with the promotion's `dayparts` | +1 |
| The event's `audience_segments` overlap the promotion's `segments` | +1 |

Then adjust:
- **Hard stops (score 1, say why):** the location cannot run it, the location is closed at the relevant time, or there is not enough lead time (`window_start` would already be past).
- **-1** if the event is unverified and starts within `lead_time_days` + 2 days.
- **+0.5 / -0.5** (round to the nearest whole number at the end) when `/learnings.md` shows the same promotion worked or flopped in a similar moment. Prefer `margin: high` when two promotions tie.

Cap at 5. A score of 3 is "worth a look", 4 is "strong", 5 is "run it".

## Window
- `window_start` = event start minus the promotion's `lead_time_days` (never earlier than today).
- `window_end` = the event's last day.

## Output
Create `/opportunities/YYYY-MM-DD-<event-slug>-<location-id>.md` when the best score is 3 or more and no file exists for that event and location. Otherwise update the existing file's scores and risks, leaving `status` alone if it is `campaign` or `passed`.

```markdown
---
title: <Moment>, <Location name>, <Top promotion name>
event: <event file name without .md>
location: <location-id>
category: <event category>
window_start: '<YYYY-MM-DD>'
window_end: '<YYYY-MM-DD>'
fit_score: <best score>
status: new
campaign: ""
created: '<YYYY-MM-DD>'
matched_promotions:
  - promotion: <id>
    score: <1-5>
    reasoning: <one or two sentences naming the checks that passed or failed>
  - promotion: <id>
    score: <1-5>
    reasoning: <...>
---
# <title>

## Why this moment matters
## Recommended angle
## Risks and constraints
## Not matched
```

## Rules
- List every promotion you scored 2 or more in `matched_promotions`; mention the rest briefly under "Not matched".
- Never invent or modify an offer. If a strong moment has no good match (best score 2 or less but the crowd is large and close), say so under "Recommended angle" and suggest a promotion idea for a human to approve.
- Keep `reasoning` concrete: name the location, daypart and segment, not "good fit".
