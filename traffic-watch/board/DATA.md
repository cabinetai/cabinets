---
title: How the Watch Board gets its words
---
# How the Watch Board gets its words

The Watch Board never talks to Google. Its morning routine reads the Google Analytics Data
API (reports) and Admin API (which websites the person can see) with the Google sign-in
Cabinet already holds, writes files here, and the page shows them. The full rules for each
field, and what goes on the board, are in the agent's persona
(`.agents/traffic-watcher/persona.md`). Google Analytics is read only: nothing here or in
the agent changes a setting.

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Daily Traffic Watch, every day at 8:30 | What on the website needs a look, ranked. Replaced whole each run. Schema `traffic-watch/board@1`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up bakery's board in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | The same routine | `{ at, ok, why, code }`. `ok: false` means the last check could not read Google Analytics; the page shows `why` with a Try again button. `code: "SERVICE_DISABLED"` means the Google Analytics API is turned off in the person's Google Cloud project: the page says to turn it on there, not to connect again. |
| `data/property.json` | The agent, in a chat | `{ propertyId, name }`: the website the board follows, when the person picked one of several. |
| `data/layout-change.json` | The agent, in a chat | Boxes someone asked to `add` or `remove`, with `at`, `for` and a `note`. Schema `traffic-watch/layout-change@1`. The page offers it with Apply and No thanks; each person's layout itself stays in Cabinet (`cabinet.mine`). |

## latest.json

| Field | What it is |
|---|---|
| `generatedAt` | When the check finished, with its offset. |
| `until` | Yesterday, the last day the numbers cover. |
| `site` | `{ name, url, propertyId }` of the website. |
| `others` | The person's other websites, `{ propertyId, name }`. |
| `usual` | `{ visitorsPerDay, keyEventsPerDay }`: the median of the 28 days before yesterday. |
| `yesterday` | `{ visitors, keyEvents }`. |
| `daily` | `{ day, visitors, keyEvents }` for the last 28 days, for the chart. |
| `items` | What needs a look. Each item is one row on the board. |
| `settled` | What left the board lately: `{ id, title, gist, at }`, at most 8. |

Each item has:

| Field | What it is |
|---|---|
| `id` | A short kebab-case name, the same every day while it lasts. |
| `kind` | `Drop`, `Spike`, `Events`, `Broken`, `Source` or `Other`. The page words them (Drop, Jump, Key events, Broken page, New source). |
| `level` | `High`, `Medium` or `Low`. The board ranks by it and shows Urgent, Worth a look or Can wait. |
| `title`, `summary`, `next` | The problem in a few words, one or two sentences with the numbers, and one step to take. |
| `now`, `before`, `unit` | The two numbers behind it and what they count, shown when the row opens. |
| `where` | The page path or the site it is about, or empty. |
| `firstSeen`, `lastSeen` | The first and the latest day the numbers showed it (`YYYY-MM-DD`). |

The page is a 12-column grid of boxes on Google's light grey: Headline ("3 things need a
look", the first one in a sentence, and how many of each level), Needs a look, Visitors per
day (28 days against the usual, the last seven in Analytics orange), Back to normal, Ask
about your traffic and Ideas for watching your traffic, and more to add (three numbers, and
each idea as its own box with its picture from `ideas/`). Each person moves, resizes, adds
and removes them, or asks the agent through Layout, which answers with
`layout-change.json`. An idea offers itself at the foot of its box when the board says it
would help.

Nothing on the page changes anything in Google Analytics. Every button asks the agent in
the chat for an explanation or a summary.

The page's ideas show pictures from `ideas/`, copies of existing template covers shrunk to
about 10KB each, until unique ones are made.

If the morning check was missed (the computer was asleep at 8:30), the page runs it once
when it opens, from the schedule in `../.jobs/daily-traffic-watch.yaml`.
