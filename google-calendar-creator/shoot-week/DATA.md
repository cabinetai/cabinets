---
title: What the Shoot week page reads
---
# What the Shoot week page reads

The morning routine (`.jobs/morning-shoot-brief.yaml`) writes `data/latest.json` here and
the page draws it. Until the first real read the page shows `data/EXAMPLE-latest.json`, a
made-up travel creator's week in Israel with made-up brands, labelled as an example. The
full rules are in the agent's persona (`.agents/shoot-planner/persona.md`).

| Field | What it holds |
|---|---|
| `generatedAt`, `checkedAt` | When the calendar was read, and when the routine last tried |
| `status` | `ok`, or one plain sentence on what went wrong |
| `timeZone`, `today` | The calendar's time zone, and the first of the seven days |
| `canChange` | Whether the connection may add events |
| `headline` | One line about the week |
| `events[]` | Today to 30 days ahead: `id`, `date`, `start`, `end`, `allDay`, `title`, `place`, `kind` (post, due, shoot, call, travel, edit, other), `brand`, `lat`, `lon` (shoots at a known place only), `link` |
| `deals[]` | With Gmail: `id`, `brand`, `ask`, `amount`, `currency`, `dates[]` (`what` shoot, draft or live, `date` or null, `onCalendar`), `threadId` |

The page works out the rest itself: the week strip, the posts and deadlines of the seven
days, sunrise, sunset and golden hour for every shoot with `lat` and `lon`, and the clashes
(two timed events at once, a post or deadline on a travel day, two brands live the same day).

`data/reading.json` and `data/profile.json` are written once, by the first read, only
through `first-sort.mjs`. `reading.json` holds the lines and the gift shown while it reads
(schema `google-calendar-creator/reading@1`). `profile.json` (schema
`google-calendar-creator/profile@1`): `events90`, `perWeek`, `shootsWeek`, `postsWeek`,
`busiestDay`, `brands[]`, `brandsMore`, `nextFree`, `timeZone`, shown once as what the
calendar says about them.
