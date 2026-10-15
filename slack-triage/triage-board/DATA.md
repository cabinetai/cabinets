---
title: How the Triage Board gets its words
---
# How the Triage Board gets its words

The page never talks to Slack. The support triage routine reads Slack and writes files, and
the page shows them. The full rules for each field are in the agent's persona
(`.agents/triage-desk/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `../triage/<YYYY-MM-DD>T<HH-MM-SS>-triage.md` | Support Triage, weekdays at 9, 13 and 17 | The whole board: frontmatter and one table. The newest file is the one shown. |
| `../triage/EXAMPLE-triage.md` | Nobody (it ships with the template) | A made-up team in the same shape. Shown, marked as an example, until the first update. |
| `data/reading.json` | The first update only, through `first-read.mjs` | `{ schema, startedAt, done, lines, gift, offers }`: what the agent found, one line at a time, and the things to make now, while the person watches. Schema `slack-triage/reading@1`. |
| `data/.work/` | The first update, through `first-read.mjs` | The agent's own files for the helper (`gift.json`, `offer.json`). Deleted when the reading is done. |

The first update (no dated file in `triage/` yet) is told as it happens. The agent runs
`node triage-board/first-read.mjs start`, then `push '<line>'` after each look at Slack
("**#support**: 5 new requests since yesterday, 2 nobody has picked up"), `gift @gift.json`
once, `offer @offer.json` at most once, and `done` after the dated file is written. The helper
writes `reading.json` atomically under a lock, refuses an empty, broken or repeated line, and
checks every name, channel, `ts` and link (no raw ids, no em-dash, no direct message).

The page shows the lines one by one under "Reading your Slack", in place of the example, and
beside them "While I read, you can...":
- the gift: `{ kind: "oldest", who, channel, channelId, ts, since, item, link, at }`, the `New`
  request that has waited longest, with "Draft a reply" (a draft in the chat, never posted), or
  `{ kind: "calm", at }` when nothing is `New`, with "Write the templates" (a page of reply
  templates in this cabinet);
- the offer: `{ kind: "checkin", item, link, at }`, an item waiting on the customer or someone
  outside, with "Draft a check-in" (a draft to copy).

Each press asks the Triage Desk in the chat beside the page. Nothing is posted in Slack. After
the reading the gift and the offer not yet used stay under the board for 3 days, or until put
away ("Not now"); this browser remembers which. A reading older than 20 minutes is ignored, and
without `reading.json` the page is as it always was.
