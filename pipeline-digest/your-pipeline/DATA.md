---
title: How Your pipeline gets its words
---
# How Your pipeline gets its words

The page never talks to Salesforce. The morning routine reads Salesforce through the REST API
(SOQL queries on Opportunity, Task and Lead) with the sign-in Cabinet holds, writes files here,
and the page shows them. The full rules for each field are in the agent's persona
(`.agents/pipeline-reader/persona.md`). Nothing on the page changes Salesforce.

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning Pipeline Digest, every day at 9 | This morning's catch-up. Schema `pipeline-digest/your-pipeline@1`. |
| `data/days/<YYYY-MM-DD>.json` | The same routine | A copy of each day's catch-up, for the date picker. Kept for 30 days. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up company, Northwind Tools, in the same shape, with every box filled. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | The same routine | `{ at, ok, why, code }`. `ok: false` means the last run could not read Salesforce; the page shows `why` with a Try again button. `code: "API_DISABLED"` means the company's Salesforce edition has no API access: the page says so, not to connect again. |
| `data/reading.json` | The first catch-up only, through `first-read.mjs` | `{ schema, startedAt, done, lines, top, gift, offers }`: what the agent found, one line at a time, the biggest open deals and the things to do now, while the person watches. Schema `pipeline-digest/reading@1`. |
| `data/.work/` | The first catch-up, through `first-read.mjs` | The agent's own files for the helper (`top.json`, `gift.json`, `offer.json`, `latest.json`). Deleted when the reading is done. |
| `data/layout-change.json` | The agent, in a chat | Boxes someone asked to `add` or `remove`, with `at`, `for` and a `note`. Schema `pipeline-digest/layout-change@1`. The page offers it with Apply and No thanks; each person's layout itself stays in Cabinet (`cabinet.mine`), not in a file. |
| `../setup.md` | The person, or the agent in a chat when asked | The Salesforce address (for record links), the company name, the currency and the days after which a deal has gone quiet. Read by the routine every morning. |

`latest.json` in short: `generatedAt`, `since`, `org` `{ name, address, currency }`,
`settings` `{ staleDays }`, `totals`, `daily`, one list for each box, and `known` (yesterday's
stage, amount and close date of each open deal, so the next catch-up can tell what moved; the
page never shows it):

| Field | Box | What it holds |
|---|---|---|
| `totals.open` | Headline, Open pipeline, Pipeline numbers | `{ count, amount, stages }`, `stages` each `{ name, count, amount }` |
| `totals.last7`, `prev7`, `last28`, `prev28` | Pipeline numbers, Win rate | `{ from, newDeals, newAmount, won, wonAmount, lost, lostAmount, winRate, newLeads }`; `last7` and `last28` also `leadSources` `{ name, n }`. `winRate` is a fraction, `null` when nothing closed |
| `daily` | The headline's chart | `{ day, deals, amount }` of new deals for each of the last 28 days |
| `moved` | Moved since yesterday | `{ id, recordId, name, account, owner, change, from, to, amount, before, url }`, `change` stage, amount, date, won, lost or new |
| `closing` | Closing this week | `{ id, recordId, name, account, owner, stage, amount, closeDate, nextStep, late, url }` |
| `stale` | Gone quiet | `{ id, recordId, name, account, owner, stage, amount, lastActivity, days, nextStep, url }` |
| `tasks` | Tasks due today | `{ id, recordId, subject, due, overdue, what, who, priority, owner, url }`, `overdue` in days |
| `leads` | New leads | `{ id, recordId, name, company, source, status, created, owner, url }` |
| `changes` | What changed since last week | `{ id, dir, title, gist }`, `dir` up, down or new, at most 5 |

Every `url` is a record's own page, `<Salesforce address>/lightning/r/<Type>/<Id>/view`, built
only from the address in Setup and an Id Salesforce returned. The page opens only links of that
shape, and none on the example.

The page is a 12-column grid of boxes on Salesforce's light grey, laid out like the Gmail front
desk: Headline (a band in Salesforce blue), Moved since yesterday, Closing this week, Tasks due
today, Gone quiet, Pipeline numbers, New leads, What changed since last week, Ask about your
pipeline and Ideas for your pipeline, and more to add (four numbers, and each idea as its own
box with its picture from `ideas/`). The band is the first thing on the page in every state:
the connect card, a failed catch-up and the example note all sit in it or right under it. Each
person moves, resizes, adds and removes the boxes (mouse, finger or keyboard, with Undo), or
asks the agent through Layout, which answers with `layout-change.json`. An idea offers itself
at the foot of its box when the morning's pipeline says it would help.

Nothing on the page changes anything in Salesforce. Every button asks the agent in the chat for
a draft, a plan or a summary.

The first catch-up (no `latest.json` yet) is told as it happens. The agent runs
`node your-pipeline/first-read.mjs start`, then `push '<line>'` after each query that found
something ("Found **12 open deals**, $263,750 in all"), `top @top.json` once with the biggest
open deals, `gift @gift.json` once, `offer @offer.json` up to twice, `latest @latest.json` and
`done`. The helper writes `reading.json` atomically under a lock, refuses an empty, broken or
repeated line, and checks every gift and offer (no raw ids, no long dash, links only to a
record page). The page shows the lines one by one under "Reading your pipeline", the biggest
deals under them, and beside them "While I read, you can...": the gift `{ kind: "quiet", name,
account, amount, days }` (the biggest deal gone quiet; "Draft a follow-up"), `{ kind: "closing",
name, account, amount, closeDate }` (the biggest deal closing this week; "Make a close plan") or
`{ kind: "calm" }` ("Plan my week"), then the `offers`: `{ kind: "calls" }` (today's call list)
or `{ kind: "leads", people }` (first emails to new leads), each a button that asks the agent.
After the reading the gift and the offers not yet used stay under the page's boxes for 3 days,
or until put away. A reading older than 20 minutes is ignored. The reading shows the moment the first
catch-up starts, with "Opening your Salesforce..." until the first line, and stays until it
says done. Every later catch-up shows "Catching up..." on its button.

The page's ideas show pictures from `ideas/`, copies of existing template covers shrunk to
about 10KB each, until unique ones are made.

If the morning run was missed (the computer was asleep at 9), the page runs it once when it
opens, from the schedule in `../.jobs/morning-pipeline-digest.yaml`.
