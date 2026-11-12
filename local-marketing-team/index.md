---
title: Los Tacos Marketing
created: '2026-10-02T00:00:00Z'
modified: '2026-10-02T00:00:00Z'
tags:
  - marketing
  - local-business
  - social-media
  - instagram
  - events
  - restaurant
order: 1
---
# Los Tacos Marketing

An AI marketing team for a local business with one or more locations. The team keeps a live picture of what is happening near each location (games, concerts, festivals, holidays, weather), matches those moments to the promotions you already run, and turns the best matches into ready-to-post Instagram campaigns.

Los Tacos, a fictional three-location taqueria in Austin, TX, is the worked example. To use this cabinet for your own business, replace the business knowledge (see **Make it yours** below). The agents, skills and jobs do not mention Los Tacos anywhere; they read whatever is in these files.

Open the [[marketing-dashboard]] for the one-screen view.

## How it works

1. **Know the business.** [[business]], [[locations]], [[menu]], [[brand]] and [[audience]] describe who you are and who you serve.
2. **Keep a promotion library.** [[promotions]] lists reusable offers, each tagged with the moments it fits, the dayparts it works in and the locations that can run it.
3. **Watch the calendar.** The Local Researcher keeps [[events]] current, one file per event, using the places listed in [[sources]]. Sports come first, then concerts, festivals, holidays and weather.
4. **Spot opportunities.** When an event fits, the researcher writes an [[opportunities]] file with the matched promotions, each scored and explained.
5. **Build the campaign.** The Marketing Lead picks an opportunity and writes a brief in [[campaigns]]. The Social Content Creator adds the feed post, Reel script, Stories and captions in the same folder.
6. **Learn.** After a campaign ends, results and lessons go into [[learnings]], and the next round of matching reads them.

## Worked examples

| Moment | Location | Promotion | Campaign |
|---|---|---|---|
| Longhorns home football game | North Loop | Game Day Taco Bucket | [[campaigns/game-day-taco-bucket]] |
| ACL Music Festival, weekend two | South Lamar | Late Night Al Pastor | [[campaigns/acl-late-night-al-pastor]] |

All event dates in this cabinet are illustrative. Verify them before you publish anything.

## Your team (3 agents)

- **Marketing Lead** (lead): owns the plan. Reviews opportunities, chooses what to run, writes the campaign brief, hands off to the creator, and records learnings.
- **Local Researcher**: keeps the events calendar fresh, with sports schedules checked daily, and writes scored opportunities.
- **Social Content Creator**: writes the Instagram deliverables in the brand voice.

The agents ship turned off. Turn one on from its agent page when you are ready.

## Skills (stored in this cabinet)

- `local-event-research`: how to find, verify and record events near a location.
- `promotion-matching`: how to score an event against the promotion library.
- `local-campaign-strategy`: how to turn an opportunity into a campaign brief.
- `instagram-content`: how to write the feed post, Reel, Stories and captions.

## Jobs (all off by default)

- **Weekly local opportunity scan** (Mondays): refresh the next 21 days of events and write new opportunities.
- **Daily sports check** (weekdays): confirm game times, opponents and broadcasts for the next 10 days.
- **Campaign performance notes** (Fridays): summarize how live and finished campaigns did into [[learnings]].

Nothing runs until you enable a job. Each job's prompt says exactly which files it reads and writes.

## Make it yours

1. Rewrite [[business]], [[locations]], [[menu]], [[brand]] and [[audience]] for your business. Keep the frontmatter fields; the dashboard reads them.
2. Replace the offers in [[promotions]] with your own. Keep `id`, `fits`, `dayparts`, `locations` and `constraints`.
3. Update [[sources]] with the event calendars, venues and teams near your locations.
4. Delete the example files in `events/`, `opportunities/` and `campaigns/` (keep each folder's `index.md`).
5. Rename the cabinet. Agents refer to it as {{cabinet.name}}, so they pick up the new name.
