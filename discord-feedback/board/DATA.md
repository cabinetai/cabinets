---
title: How the Feedback Board gets its words
---
# How the Feedback Board gets its words

The Feedback Board never talks to Discord. Its routine reads #feedback and the messages
marked with a 📌, writes files here, and the page shows them. The exact shape of
`data.json` is in the agent's persona (`.agents/feedback-analyst/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data.json` | Organize Feedback, every 30 minutes | Each request once, with everyone who asked and their messages. Replaced whole each run. |
| `data/EXAMPLE-data.json` | Nobody (it ships with the template) | A made-up community in the same shape. Shown, marked as an example, until `data.json` exists. |
| `data/reading.json` | The first check only, through `first-read.mjs` | `{ schema, startedAt, done, lines, gift, offers }`: what the agent found, one line at a time, and the things to do now, while the person watches. Schema `discord-feedback/reading@1`. |
| `data/.work/` | The first check, through `first-read.mjs` | The agent's own files for the helper (`gift.json`, `offer.json`, `line.txt`). Deleted when the reading is done. |

## The first check

The first check (no `data.json` yet) is told as it happens. The agent runs
`node board/first-read.mjs start`, then `push '<line>'` after each look at Discord
("**Dark mode**: 6 people asked for it"), `gift @gift.json` once, `offer @offer.json` up to
twice, writes `data.json` as usual, and runs `done`. The helper writes `reading.json`
atomically under a lock, refuses an empty, broken, repeated or 0 line, and refuses a raw
Discord id or mention and an em-dash.

While it reads, the page under the band shows the lines one by one under "Found so far" and
beside them "While I read, you can...": the gift `{ kind: "top", title, people, gist, at }`
(the request the most people asked for so far; "Sum it up for the team" asks the agent for a
write-up in the chat) or `{ kind: "calm" }` ("Draft a post" inviting feedback), then the
`offers`: `{ kind: "thanks", people }` ("Draft a thank-you" to the people who gave the most
feedback) or `{ kind: "bug", title }` ("Write it up"), each with its `at`. Every press is a
draft in the chat; nothing is posted in Discord. Once `data.json` is there and the agent is
still finishing, the band says "Still reading #feedback" with the latest line. After the
reading the gift and the offers not yet used stay under the board for 3 days, or until put
away. A reading older than 20 minutes is ignored, and without `reading.json` the board shows
its plain "Reading #feedback" card, as every later check does.
