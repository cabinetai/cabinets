---
title: How the Feedback Board gets its words
---
# How the Feedback Board gets its words

The Feedback Board never talks to Discord. Its routine reads your feedback channels, writes
files here, and the page shows them. Every write goes through `update-board.mjs`, so the
board stays one file with each message and each person once.

| File | Written by | What it holds |
|---|---|---|
| `data.json` | `update-board.mjs`, for Organize Feedback at 9:00, 13:00 and 17:00 and for the chat | Each request once, everyone who asked, a sample of their messages, and where each channel was read to. |
| `data/backup.json` | `update-board.mjs` | The copy before the last write. `begin` restores it if `data.json` ever breaks. |
| `data/EXAMPLE-data.json` | Nobody (it ships with the template) | A made-up community in the same shape. Shown, marked as an example, until the first apply, which deletes it. |
| `data/problem.json` | `update-board.mjs problem` | `{ kind, at }`, why a run could not read: `no-channels` or `unreachable`. Removed by the next apply. It never removes the example. |
| `data/watch.json` | `update-board.mjs watch`, from the chat | `{ add, skip }`: channels the person always wants read, or never. |
| `data/reading.json` | The first check only, through `first-read.mjs` | `{ schema, startedAt, done, lines, gift, offers }`: what the agent found, one line at a time, and the things to do now, while the person watches. Schema `discord-feedback/reading@1`. |
| `data/.work/` | The agent, for the two helpers | Its findings (`run.json`, `add.json`, `gift.json`, `offer.json`, `line.txt`) and `run-start.json`. Deleted when the first check ends, rewritten on later runs. |

## data.json

```
{ version: 2, generated, previousGenerated, status, setup,
  server: { id, name },
  channels: [{ id, name, kind, back, problem }],   the channels read as feedback
  left: ["#general"],                              allowed, not read
  cursors: { <channel id>: <highest message id read> },
  threads: { <thread id>: { messages, cursor, request, seen } },
  last: { run, read, added, requests },            what the last run did
  dropped,                                         requests pruned so far
  requests: [{ id, title, summary, type, state, stateAt, priority, blocking,
               count, people: [{ id, name }], asks, votes, firstSeen, lastSeen,
               merged: [{ id, title }], spec,
               messages: [{ id, author, text, at, channel, link, votes }] }] }
```

- `generated` and `previousGenerated` come from the clock in `update-board.mjs`.
- `status` is `ok`, or what the run could not finish, shown on the page.
- `setup` is `fallback` when no channel looked like feedback and general channels were read.
- `type` is Feature, Bug, UI/UX, Integration or Other. `state` is Open, Shipped or Not doing.
- `count` is different people, and only `count` ranks. `asks` is every message ever sorted
  there, and it stays when old messages are cut.
- `votes` are 👍 and similar reactions on a message when it was read. A reaction added after
  that is not counted, because reading only what is new never sees an old message again.
- `spec` is the path of a page in this cabinet.

## What keeps it small

- A request keeps its 9 newest messages and its first one, and 100 names; `count` and `asks`
  go on counting past that. A message is kept to 300 characters.
- An open request one person made leaves after 90 days with no new ask, unless it has a spec.
  A shipped or declined request leaves after 180 days with no new ask.
- At most 300 requests, the least asked go first, and never over 1.5 MB: Cabinet hands the
  page files up to 2 MB.
- `threads` forgets a thread 60 days after it last moved.
- An old name stays in `merged`, so a later message under it lands on the right row, and a
  new row under the same title joins the row already there.

## The first check

The first check (no `data.json` yet) is told as it happens. The agent runs
`node board/first-read.mjs start`, then `push '<line>'` after each look at Discord
("**Dark mode**: 6 people asked for it"), `gift @gift.json` once, `offer @offer.json` up to
twice, and `done` after its last apply. The helper writes `reading.json` atomically under a
lock, refuses an empty, broken, repeated or 0 line, and refuses a raw Discord id or mention
and an em-dash.

While it reads, the page shows the lines one by one and beside them the gift
`{ kind: "top", title, people, gist, at }`, the request the most people asked for so far
(Sum it up for the team), or `{ kind: "calm", at }` when there is none yet (Draft a post), then
the `offers`: `{ kind: "thanks", people }` (Draft a thank-you) or `{ kind: "bug", title }`
(Write it up). Every press is a draft in the chat. Once the first apply has run, the board
shows and a line above it says the agent is still reading. After the reading, the gift and
the offers not yet used stay under the board for 3 days, or until put away. A reading older
than 20 minutes is ignored.

## The page's states

- Not connected: the connect button, over the example.
- Connected, nothing chosen (`problem.json` says `no-channels`): what to do, in words that
  work even if the button opens Cabinet's general connect sheet, and Check again.
- `setup` is `fallback`: the board, and a notice with the channels it read and the next step.
- Could not be read, wrong shape or no board yet: a sentence, never a blank page.

Every press on the page goes to the Feedback Analyst in the chat, and nothing on the page
writes in Discord. Draft a reply shows the words and posts only after a yes in that chat,
only in a channel set to Write. Write a spec saves a page under `specs/`. Mark as shipped and
Not doing change the row, and a row asked for again after that says Asked again.
