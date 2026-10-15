---
title: How Your website gets its words
---
# How Your website gets its words

The page never talks to Google. The morning routine reads the Google Analytics Data API
(reports) and Admin API (which websites the person can see) with the Google sign-in Cabinet
already holds, writes files here, and the page shows them. The full rules for each field
are in the agent's persona (`.agents/site-reader/persona.md`). Google Analytics is read
only: nothing here or in the agent changes a setting.

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning Website Digest, every day at 8 | This morning's catch-up. Schema `website-digest/your-website@1`. |
| `data/days/<YYYY-MM-DD>.json` | The same routine | A copy of each day's catch-up, for the date picker. Kept for 30 days. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up bakery in the same shape, with every box filled. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | The same routine | `{ at, ok, why, code }`. `ok: false` means the last run could not read Google Analytics; the page shows `why` with a Try again button. `code: "SERVICE_DISABLED"` means the Google Analytics API is turned off in the person's Google Cloud project: the page says to turn it on there, not to connect again. |
| `data/property.json` | The agent, in a chat | `{ propertyId, name }`: the website the page follows, when the person picked one of several. Without it the page follows the only website, or the busiest one. |
| `data/layout-change.json` | The agent, in a chat | Boxes someone asked to `add` or `remove`, with `at`, `for` and a `note`. Schema `website-digest/layout-change@1`. The page offers it with Apply and No thanks; each person's layout itself stays in Cabinet (`cabinet.mine`), not in a file. |

`latest.json` in short: `generatedAt`, `until` (yesterday, the last day the numbers cover),
`site` `{ name, url, propertyId, currency }`, `others` (the person's other websites,
`{ propertyId, name }`), and:

| Field | Box | What it holds |
|---|---|---|
| `totals` | Headline, Site numbers, the number boxes | `last7`, `prev7`, `last28`, `prev28`, each `{ from, visitors, newVisitors, sessions, views, engagementRate, avgSessionSec, keyEvents, revenue }`; `last7` and `last28` also `countries` `{ code, visitors }` and `devices` `{ type, visitors }` |
| `daily` | The headline's chart | `{ day, visitors, keyEvents }` for each of the last 28 days |
| `sources` | Where visitors came from | `{ name, sessions, before, keyEvents }`, `name` as Google groups them (`Organic Search`, `Direct`...); the page words them |
| `pages` | Top pages | `{ path, title, views, before, visitors }`, the top 10 |
| `events` | Key events | `{ name, count, before, key }`; the box shows the ones with `key: true` |
| `changes` | What changed since last week | `{ id, dir, title, gist }`, `dir` up, down or new, at most 5 |

`before` is always the 7 days before the last 7. `engagementRate` is Google's fraction
(`0.64` is 64%), `avgSessionSec` seconds, `revenue` in the site's currency and left out when
there is none.

The page is a 12-column grid of boxes on Google's light grey, laid out like the Gmail front
desk: Headline, What changed since last week, Key events, Site numbers, Top pages, Where
visitors came from, Ask about your website and Ideas for your website, and more to add
(three numbers, and each idea as its own box with its picture from `ideas/`). The
connection, Catch up now, Ideas and Layout sit in the headline; without the headline they
move to a slim bar on top. Each person moves, resizes, adds and removes them (mouse, finger
or keyboard, with Undo), or asks the agent through Layout, which answers with
`layout-change.json`. An idea offers itself at the foot of its box when the week's numbers
say it would help.

The page writes its own headline from `totals` and `changes`: the website's name, then
"2,340 visitors in the last 7 days, 12% more than the week before. 46 key events, up from
35.", the biggest change, and a line with the site's address and the days. The visitors of
each of the 28 days stand on its right, the last seven in Analytics orange.

Nothing on the page changes anything in Google Analytics. Every button asks the agent in
the chat for a summary or an explanation.

The page's ideas show pictures from `ideas/`, copies of existing template covers shrunk to
about 10KB each, until unique ones are made.

If the morning run was missed (the computer was asleep at 8), the page runs it once when it
opens, from the schedule in `../.jobs/morning-website-digest.yaml`.
