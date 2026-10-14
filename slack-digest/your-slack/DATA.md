---
title: How Your Slack gets its words
---
# How Your Slack gets its words

The page never talks to Slack. The morning routine reads Slack and writes files here, and
the page shows them. The full rules for each field are in the agent's persona
(`.agents/channel-reader/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning Slack Digest, every day at 9 | This morning's catch-up. Schema `slack-digest/your-slack@1`. |
| `data/days/<YYYY-MM-DD>.json` | The same routine | A copy of each day's catch-up, for the date picker. Kept for 30 days. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up team in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | The same routine | `{ at, ok, why }`. `ok: false` means the last run could not read Slack; the page shows `why` with a Try again button. |
| `data/reading.json` | The first catch-up only, through `first-read.mjs` | `{ schema, startedAt, done, lines, gift }`: what the agent found, one line at a time, while the person watches. Schema `slack-digest/reading@1`. |
| `data/.work/` | The first catch-up, through `first-read.mjs` | The agent's own files for the helper (`gift.json`, `latest.json`). Deleted when the reading is done. |

`latest.json` in short: `generatedAt`, `since`, `workspace`, `headline`, an optional `lead`
`{ id, why }` naming one channel, `totals` `{ messages, channels, quiet, mentions, dms }`,
`quietChannels` (the names behind `totals.quiet`, listed when the person opens that line),
and `channels` (`name`, `messages`, `urgency` High, Medium or Low, `gist`, `wants`, `url`).
Every channel has an `id`. `me` (the person's Slack name and id) and `known` (the
conversations seen before, read directly next time so nothing search misses is lost) are
for the routine; the page ignores them. A `url` on Slack's own address becomes
an "Open in Slack" link.

The first catch-up (no `latest.json` yet) is told as it happens. The agent runs
`node your-slack/first-read.mjs start`, then `push '<line>'` after each look at Slack ("**#support**:
4 new questions, 1 still waiting since yesterday"), `gift @gift.json` once, `latest
@latest.json` and `done`. The helper writes `reading.json` atomically under a lock and
refuses an empty, broken or repeated line. The page shows the lines one by one under
"Reading your Slack", and the gift beside them: `{ kind: "waiting", who, channel, channelId,
ts, since, gist, link, at }` (the question that waited longest in a channel set to Write; its
"Write my reply" asks the agent for a draft in the chat, never posted) or `{ kind: "calm" }`
("Find what I promised"). After the reading the gift stays on top of the page for 3 days, or
until it is used or put away. A reading older than 20 minutes is ignored, and without
`reading.json` the page shows its plain "Catching up" card, as every later catch-up does.

The page writes its own headline and the line under it from `channels` and `totals`:
"Here is what moved in your Slack" with "4 messages in 2 channels since yesterday.", or
"Your Slack was quiet" when no channel moved. A catch-up written before this change may
still hold `waiting`, `decisions` and `promises` lists; the page ignores them.
