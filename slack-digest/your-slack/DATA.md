---
title: How Your Slack gets its words
---
# How Your Slack gets its words

The page never talks to Slack. The morning routine reads Slack and writes files here, and
the page shows them. The full rules for each field are in the agent's persona
(`.agents/channel-reader/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning Slack Digest, every day at 9 | This morning's catch-up. Schema `slack-digest/your-slack@2` (`@1` files still show, without the newer lists). |
| `data/days/<YYYY-MM-DD>.json` | The same routine | A copy of each day's catch-up, for the date picker. Kept for 30 days. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up team in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | The same routine | `{ at, ok, why }`. `ok: false` means the last run could not read Slack; the page shows `why` with a Try again button. |
| `data/reading.json` | The first catch-up only, through `first-read.mjs` | `{ schema, startedAt, done, lines, recent, gift, offers }`: what the agent found, one line at a time, the latest messages and the things to do now, while the person watches. Schema `slack-digest/reading@1`. |
| `data/.work/` | The first catch-up, through `first-read.mjs` | The agent's own files for the helper (`recent.json`, `gift.json`, `offer.json`, `latest.json`). Deleted when the reading is done. |
| `data/layout-change.json` | The agent, in a chat | Boxes someone asked to `add` or `remove`, with `at`, `for` and a `note`. Schema `slack-digest/layout-change@1`. The page offers it with Apply and No thanks; each person's layout itself stays in Cabinet (`cabinet.mine`), not in a file. |

`latest.json` in short: `generatedAt`, `since`, `workspace`, `headline`, an optional `lead`
`{ id, why }` naming one channel, `totals` `{ messages, channels, quiet, mentions, dms,
dmsWaiting }`, `quietChannels` (the names behind `totals.quiet`), and one list for each box:

| List | Box | Each item |
|---|---|---|
| `channels` | Catch up by channel | `id`, `name`, `messages`, `urgency` High, Medium or Low, `gist`, `wants`, `url` |
| `waiting` | Waiting on you | `id`, `who`, `where` (`#channel` or `DM`), `kind` mention, question or dm, `gist`, `short`, `since`, `urgent`, `url` |
| `recent` | Latest messages | `id`, `who`, `where`, `gist`, `at`, `url` (channels only) |
| `decisions` | Decisions made | `id`, `what`, `where`, `who` (up to three names), `at`, `url` |
| `files` | Files shared | `id`, `name`, `kind` pdf, image, doc, sheet, slides or other, `who`, `where`, `at`, `url` |
| `promises` | You promised (a box to add) | `id`, `what`, `to`, `where`, `at`, `url` |
| `standup` | The standup idea box | `{ done[], next[], blocked[] }`, short lines from the person's own messages |

`me` (the person's Slack name and id) and `known` (the conversations seen before, read
directly next time so nothing search misses is lost) are for the routine; the page ignores
them. A `url` on Slack's own address becomes an "Open in Slack" link.

The page is a 12-column grid of boxes, like the Gmail front desk: Headline, Waiting on you,
Latest messages, Catch up by channel, Decisions made, Files shared, Ask about your Slack and
Ideas for your Slack to start with, and more to add (You promised, three numbers, and each
idea as its own box with its picture from `ideas/`). Each person moves, resizes, adds and
removes them (mouse, finger or keyboard, with Undo), or asks the agent through Layout, which
answers with `layout-change.json`. An idea offers itself at the foot of its box when the
day's Slack says it would help. The weekly-summary idea takes nothing from the file: it
asks the agent when pressed.

The page writes its own headline and the line under it from `channels`, `waiting` and
`totals`: "Here is what moved in your Slack" with "4 messages in 2 channels since
yesterday.", or "Your Slack was quiet" when no channel moved.

The first catch-up (no `latest.json` yet) is told as it happens. The agent runs
`node your-slack/first-read.mjs start`, then `push '<line>'` after each look at Slack ("**#support**:
4 new questions, 1 still waiting since yesterday"), `recent @recent.json` very early, `gift
@gift.json` once, `offer @offer.json` up to four times, `latest @latest.json` and `done`. The
helper writes `reading.json` atomically under a lock, refuses an empty, broken or repeated
line, and checks every name, channel, `ts` and link (no raw ids, no em-dash, no direct
message). The page shows the lines one by one under "Reading your Slack", the latest messages
(`recent`: `{ who, channel, ts, at, gist, link }`, up to 5) at once under them as "Just now in
your Slack", and beside them "While I read, you can...": the gift `{ kind: "waiting", who,
channel, channelId, ts, since, gist, link, at }` (the question that waited longest in a
channel set to Write; "Write my reply" asks the agent for a draft in the chat, never posted)
or `{ kind: "calm" }` ("Find what I promised"), then the `offers`: `{ kind: "catchup",
channel, count }`, `{ kind: "promised" }` or `{ kind: "standup", channel }`, each a button
that asks the agent for a draft to copy, never posted. After the reading the gift and the offers not yet used stay
on top of the page for 3 days, or until put away. A reading older than 20 minutes is ignored, and without
`reading.json` the page shows its plain "Catching up" card, as every later catch-up does.
