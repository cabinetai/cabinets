---
title: How the Deal board gets its words
---
# How the Deal board gets its words

The Deal board never talks to Salesforce. Its morning routine reads Salesforce (four SOQL
queries: open deals, overdue tasks on them, leads nobody touched, deals closed lately)
through the address Cabinet gives it, writes files here, and the page shows them. The full
rules for each field, and what goes on the board, are in the agent's persona
(`.agents/deal-watcher/persona.md`). The morning check only reads: nothing here changes a
deal.

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Daily Deal Watch, every day at 8:30 | The deals and leads that need a person, ranked. Replaced whole each run. Schema `deal-watch/board@1`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up company's board (Northwind Tools) in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | The same routine | `{ at, ok, why, code }`. `ok: false` means the last check could not read Salesforce; the page shows `why` with a Try again button. `code: "API_DISABLED"` means this Salesforce edition has no API access: the page says so, and that connecting again will not fix it. |
| `data/reading.json` | The first check only, through `first-read.mjs` | `{ schema, startedAt, done, lines, gift, offers }`: what the agent found, one line at a time, and the things to do now, while the person watches. Schema `deal-watch/reading@1`. |
| `data/.work/` | The first check, through `first-read.mjs` | The agent's own files for the helper (`gift.json`, `offer.json`, `latest.json`, `line.txt`, `why.txt`). Deleted when the reading is done. |
| `data/layout-change.json` | The agent, in a chat | Boxes someone asked to `add` or `remove`, with `at`, `for` and a `note`. Schema `deal-watch/layout-change@1`. The page offers it with Apply and No thanks; each person's layout itself stays in Cabinet (`cabinet.mine`). |
| `../setup.md` | The person, or the agent in a chat when the person gives a value | The settings the routine reads: the Salesforce address (for the record links), company name, currency, and when a deal is quiet, a lead untouched and a deal big. A normal page at the cabinet root. |

## latest.json

| Field | What it is |
|---|---|
| `generatedAt` | When the check finished, with its offset. |
| `org` | `{ name, address, currency }`. `address` is the Salesforce address from `setup.md`, or `""`. |
| `settings` | `{ staleDays, untouchedDays, bigFrom }`: the day counts and the big deal amount this check used. |
| `open` | `{ count, amount, overdueTasks }`: the open deals, their amounts added up, and the overdue tasks on them. |
| `items` | What needs a person. Each item is one row on the board, at most 8. |
| `settled` | What left the board lately: `{ id, title, gist, at }`, at most 8. |
| `weeks` | Six weeks from this week's Monday: `{ from, count, amount }` of the open deals closing in each. |
| `late` | `{ count, amount }` of the open deals whose close date passed. |
| `known` | `{ id, stage, amount, closeDate }` for every open deal, so tomorrow's check can tell a close date moved. |
| `first` | `true` on the first check only. Nothing can have slipped or been sorted out yet, so the board has no Slipping item and no Back on track rows, and the headline says a close date that slips shows from the next check. `first-read.mjs` refuses a Slipping item and empties `settled` on the first check. |

Each item has:

| Field | What it is |
|---|---|
| `id` | A short kebab-case name, the same every day while it lasts. |
| `kind` | `Slipping`, `Quiet`, `Late`, `Task`, `NoStep`, `Lead` or `Other`. The page words them (Slipping, Gone quiet, Past close date, Overdue task, No next step, New lead). |
| `level` | `High`, `Medium` or `Low`. The board ranks by it and shows Urgent, Worth a look or Can wait. |
| `title`, `what` | The deal's or the lead's name, and `Deal` or `Lead`. |
| `account` or `company`, `amount`, `stage` or `status`, `owner` | As Salesforce has them. A lead's `amount` is `null`. |
| `why`, `next`, `facts` | One or two sentences with the facts, one step to take today, and two or three short facts shown when the row opens. |
| `url`, `recordId` | The record's link in Salesforce (only when `setup.md` has the address) and its Id. |
| `firstSeen`, `lastSeen` | The first and the latest day the board showed it (`YYYY-MM-DD`). |

The page is a 12-column grid of boxes on a light grey: Headline ("3 deals need you today",
the first one in a sentence, and how many of each level), Needs a person, Close dates ahead
(the open amount closing each of the next six weeks, the late amount first in red), Back on
track, Ask about your deals and Ideas for your deals, and more to add (three numbers:
Urgent, Amount at risk, Overdue tasks; and each idea as its own box with its picture from
`ideas/`). Each person moves, resizes, adds and removes them, or asks the agent through
Layout, which answers with `layout-change.json`. An idea offers itself at the foot of its box
when the board says it would help. When `org.address` is empty, a quiet line under the band
offers to add the Salesforce address.

Nothing on the page changes anything in Salesforce. Every button asks the agent in the chat
for a draft, a plan or an answer. A change happens only in that chat, when the person asks
for it, after the agent shows the exact change and they say yes in their next message. The
one idea that asks for changes, Next steps for deals without one, says so on its button
("Set next steps with me"), and its routine only proposes them.

The first check (no `latest.json` yet) is told as it happens. The agent runs
`node board/first-read.mjs start`, then `push '<line>'` after each query that found
something ("Found **12 open deals**, $263,750 in all"), `gift @gift.json` once,
`offer @offer.json` up to twice, `latest @latest.json` to write the board and its status,
and `done`. The helper writes `reading.json` atomically under a lock, refuses an empty,
broken or repeated line, and checks every gift, offer and board (no raw ids, no long dash,
only Salesforce record links). The board shows the lines one by one under "Reading your
deals", and beside them "While I read, you can...": the gift `{ kind: "item", level, title,
account, amount, why, next, link }` (the most urgent thing found; "Draft a nudge" asks the
agent in the chat for a short email to copy) or `{ kind: "calm" }` ("Plan my week"), then
the `offers`: `{ kind: "nudges" }` (a nudge for each slipping deal) or `{ kind: "leads" }`
(a call list for untouched leads), each a button that asks the agent. After the reading the
gift and the offers not yet used stay under the board's boxes for 3 days, or until put away.
A reading older than 20 minutes is ignored. The reading shows the moment the first check
starts, with "Opening Salesforce..." until the first line, and stays until it says done.
Every later check shows "Checking..." on its button.

The page's ideas show pictures from `ideas/`, copies of existing template covers shrunk to
about 10KB each, until unique ones are made.

If the morning check was missed (the computer was asleep at 8:30), the page runs it once
when it opens, from the schedule in `../.jobs/daily-deal-watch.yaml`.
