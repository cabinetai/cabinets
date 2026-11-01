---
title: How the Triage Board gets its requests
---
# How the Triage Board gets its requests

The board never talks to Slack. The Triage Desk's routines read Slack and write plain files
in this cabinet, and the board shows them. The exact shape of each file, and the closed words
in it, are in the agent's persona (`.agents/triage-desk/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `triage/<YYYY-MM-DD>T<HH-MM-SS>-triage.md` | Support Triage, weekdays at 9, 13 and 17 | One pass: the whole board. Frontmatter `headline`, `lead`, `verdict`, `source`, `generated`, `status`, then one table: `Item`, `Needs`, `Owner`, `Status` (New, Owned, Waiting, Done), `Opened`, `URL`. The newest is the board; older ones fill the picker. A `status` other than `ok` says what the run left unfinished and shows above the board. |
| `triage/EXAMPLE-triage.md` | Nobody (it ships with the template) | A made-up Northwind team in the same shape. Shown, marked as an example, until the first real pass. The first run that reaches Slack deletes it. |
| `patterns/<YYYY-MM-DD>-patterns.md` | Weekly Patterns, Fridays at 16, from `triage/` alone | The week's look back: frontmatter `headline`, `week`, `requests`, `source`, `generated`, `status`, then `Kind`, `Count`, `Typical wait`, `Example`, `Suggestion`. The newest one is the Weekly patterns section. A claim's time is the first pass that shows the owner, so a wait is approximate and the page says "about". |
| `patterns/EXAMPLE-patterns.md` | Nobody (it ships with the template) | The made-up week, shown with the example. |
| `desk-rules.md` | The person, or the agent in the chat on their word | The team's settings in frontmatter. The board reads `flagAfterHours` to flag a New request nobody took. |
| `saved-replies/<kind>.md` | The agent, when asked with Write the saved reply | One reply, ready to paste. Later drafts draw on it. The board does not show them. |
| `triage-board/data/reading.json` | The first update only, through `first-read.mjs` | `{ schema, startedAt, done, lines, gift, offers }`: what the agent found, one line at a time, and the things to ask for now, while the person watches. Schema `slack-triage/reading@1`. |
| `triage-board/data/.work/` | The first update, through `first-read.mjs` | The agent's own files for the helper (`gift.json`, `offer.json`). Deleted when the reading is done. |

## The first update

With no dated file in `triage/` yet, the first update is told as it happens. The agent runs
`node triage-board/first-read.mjs start`, then `push '<line>'` after each look at Slack
("**#support**: 5 new requests in 3 days, 2 nobody has picked up"), `gift @gift.json` once,
`offer @offer.json` at most twice, and `done` after the dated file is written. The helper
writes `reading.json` atomically under a lock, refuses an empty, broken or repeated line, and
checks every name, channel, `ts` and link (no raw ids, no em-dash, no direct message).

The page shows the lines one by one under "Reading your Slack", in place of the example, and
beside them "While I read, you can...":

- the gift: `{ kind: "oldest", who, channel, channelId, ts, since, item, link, at }`, the `New`
  request that has waited longest, with "Draft an answer", or `{ kind: "calm", at }` when
  nothing is `New`, with "Write the saved replies";
- the offers: `{ kind: "take", item, link, at }` with "Who could take this?", and
  `{ kind: "checkin", item, link, at }`, a request waiting on someone outside the team, with
  "Draft a check-in".

Each press asks the Triage Desk in the chat. After the reading, the gift and the offers not yet
used stay under the board for 3 days, or until put away with "Not now". A reading older than
20 minutes is ignored, and without `reading.json` the page is as it always was.

## How it reaches the page

The board reads these files through Cabinet (`cabinet.files`), so it works for everyone the
cabinet is shared with, and repaints when a routine writes a new one. The Slack state, the
routine line and Update the board come from Cabinet's own view of the routines, not from a
file. A Cabinet without that bridge gets the same files through `/api/tree` and relative
addresses, read only.

When the page opens and the newest pass is older than the last time the schedule says it
should have run, it runs Support Triage once for that time ("Catching up on the 13:00 update
you missed"). That time is remembered in this browser, so a run that fails again does not loop.

Each person's layout (which parts they hid) and what they did with the gift are kept in Cabinet
for them (`cabinet.mine`), not in a file here. The buttons only open the chat with a request.
Nothing on the board posts to Slack, reacts or changes anything there.
