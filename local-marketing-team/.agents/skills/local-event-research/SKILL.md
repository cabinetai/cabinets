---
name: local-event-research
description: Find, verify and record upcoming events near a business's locations (sports first, then concerts, festivals, holidays, community events and weather) as one markdown file per event in the cabinet's events/ calendar. Use when refreshing the events calendar, checking game schedules, or answering "what is happening near our locations".
---

# Local event research

Keep the cabinet's `/events/` folder an accurate, always-current calendar of moments near each location. Other agents treat it as the source of truth, so accuracy beats volume.

## Inputs
- `/locations.md`: the `locations` frontmatter list (`id`, `neighborhood`, `nearby`).
- `/sources.md`: which teams, venues and calendars to check for each location, in priority order, plus the attendance threshold.
- `/events/index.md`: the file schema and housekeeping rules. Follow it exactly.

## Method
1. **Set the window.** Default to the next 21 days. A sports-only check covers the next 10 days.
2. **Work category by category, in this order:** sports, concerts, festivals, holidays and community, weather. For each location, go through its sources in `/sources.md`.
3. **Discover, then confirm.** Use listings and search results only to discover an event. Confirm the date, time and venue on the organizer's own page (team schedule, venue calendar, festival site, city notice, weather service).
4. **De-duplicate.** Before creating a file, look for an existing one with the same venue and start date. Update it instead.
5. **Write or update the file** using the template below. Set `dates_verified: true` only after step 3 succeeded. Kickoff and start times that are not yet announced are `time_status: tba`.
6. **Housekeeping.** Mark ended events `status: past`. Mark cancelled ones `status: cancelled` with a one-line reason. Delete `past` files older than 60 days unless a campaign in `/campaigns/` with `status: live` links to them.
7. **Stamp the refresh.** Set `last_refreshed` in `/events/index.md` to the current ISO datetime with timezone.

## What counts
- Within about 3 miles of a location, or citywide (holidays, big televised games that drive watch parties).
- At or above the attendance threshold in `/sources.md`, unless it is within half a mile of a location.
- Weather only when it can trigger a promotion (check `fits: [weather]` entries in `/promotions.md` for the thresholds).

## Event file template
File name: `/events/YYYY-MM-DD-short-slug.md` (date of the first day).

```markdown
---
title: <Human name>
category: <sports|concert|festival|holiday|community|weather>
start: '<YYYY-MM-DD or ISO datetime>'
end: '<optional>'
time_status: <confirmed|tba|estimated>
venue: <Venue name>
near_locations: [<location-id>, ...]   # closest first
distance_mi: <number>
expected_attendance: <number or short text>
audience_segments: [<segment-id>, ...]
dates_verified: <true|false>
source: <URL or page name>
last_checked: '<YYYY-MM-DD>'
status: <upcoming|live|past|cancelled>
---
# <Human name>

- What it is, in one line.
- Crowd timing: when people arrive and when they leave, and which way they walk or drive.
- Closures, transit or parking notes that change pickup vs delivery.
- Anything that changes what we can offer (late finish, family crowd, weather).
```

## Rules
- Summarize in your own words. Never paste event descriptions.
- If a fact cannot be confirmed, write `TBA` or `unverified`. Never guess an opponent, kickoff time or headliner.
- Do not record ticket prices or personal information about performers or attendees.
- Report at the end: events added, updated, marked past, and any sources that failed.
