---
title: Events
order: 10
last_refreshed: '2026-10-02T08:00:00-05:00'
refreshed_by: local-researcher
window_days: 21
---
# Events

The rolling calendar of what is happening near each location. One file per event. The Local Researcher adds, updates and archives these files, and updates `last_refreshed` above after every pass. Everyone else treats this folder as the source of truth for "what is coming up".

> The example events are illustrative. Dates, times and attendance must be verified before use.

## File name
`YYYY-MM-DD-short-slug.md`, dated by the event's first day. Example: `2026-10-17-longhorns-home-football.md`.

## Frontmatter
| Field | Required | Meaning |
|---|---|---|
| `title` | yes | Human name of the event. |
| `category` | yes | `sports`, `concert`, `festival`, `holiday`, `community` or `weather`. |
| `start` | yes | ISO date or datetime. Use the date only if the time is not announced. |
| `end` | no | ISO date or datetime for multi-day events. |
| `time_status` | yes | `confirmed`, `tba` or `estimated`. |
| `venue` | yes | Where it happens. |
| `near_locations` | yes | Location ids from [[locations]], closest first. |
| `distance_mi` | no | Distance from the closest location. |
| `expected_attendance` | no | Rough crowd size. |
| `audience_segments` | no | Segment ids from [[audience]]. |
| `dates_verified` | yes | `true` only after checking the organizer's own page. |
| `source` | yes | URL or name of the page the facts came from. |
| `last_checked` | yes | ISO date of the last check. |
| `status` | yes | `upcoming`, `live`, `past` or `cancelled`. |

## Body
Two to five bullets: what it is, crowd timing (when people arrive and leave), road closures or transit notes, and anything that changes what we can offer.

## Housekeeping
- Mark events `past` the day after they end. Delete `past` files older than 60 days.
- Never delete an event that an opportunity or campaign still links to while that campaign is live.
