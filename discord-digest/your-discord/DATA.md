---
title: How Your Discord gets its words
---
# How Your Discord gets its words

The page never talks to Discord. The morning routine reads Discord through Cabinet's own
Discord app and writes files here, and the page shows them. The full rules for each field
are in the agent's persona (`.agents/server-reader/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning Discord Digest, every day at 9 | This morning's catch-up. Schema `discord-digest/your-discord@1`. |
| `data/days/<YYYY-MM-DD>.json` | The same routine | A copy of each day's catch-up, for the date picker. Kept for 30 days. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up server in the same shape, with every box filled. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | The same routine | `{ at, ok, why }`. `ok: false` means the last run could not read Discord; the page shows `why` with a Try again button. |
| `data/layout-change.json` | The agent, in a chat | Boxes someone asked to `add` or `remove`, with `at`, `for` and a `note`. Schema `discord-digest/layout-change@1`. The page offers it with Apply and No thanks; each person's layout itself stays in Cabinet, not in a file. |
| `data/reading.json` | The first catch-up only, through `first-read.mjs` | What the agent finds as it reads, line by line, the latest messages, and a short list of things the person can do now. Schema `discord-digest/reading@1`. |
| `data/.work/` | The first catch-up only | The agent's own files for `first-read.mjs` (the latest messages, the gift, the offers, the catch-up). Deleted when the reading is done. |

## The page is a grid of boxes

The page works like Gmail's front desk: a grid of 12 columns, and each box is moved,
resized, added and removed by mouse, finger or keyboard, with Undo. Each person's layout is
kept for them in Cabinet (`cabinet.mine`, key `your-discord-layout@1`), so it follows them.
**Layout** offers "Add or remove boxes" (by hand) and "Ask the agent" (the agent writes
`layout-change.json`). **Ideas** shows every idea with its picture: ask now, switch it on as
a routine, or add it as a box. An idea also offers itself at the foot of its box on a day it
fits ("4 questions are still waiting for an answer").

The boxes, by id (the ids the agent uses in `layout-change.json`):

| Id | Box | From `latest.json` |
|---|---|---|
| `waiting` | Questions waiting (on the page at first) | `questions` |
| `catchup` | Catch up by channel (on the page at first) | `channels`, `totals`, `quietChannels` |
| `latest` | Latest messages (on the page at first) | `recent` |
| `threads` | Busy threads and forum posts (on the page at first) | the `thread` and `forum` rows of `channels` |
| `people` | Who's new and most active (on the page at first) | `people` |
| `ask` | Ask, or try an idea (on the page at first) | nothing |
| `spotlight` | One channel up close | `spotlight` |
| `bugs` | Bug reports | `bugs` |
| `announcements` | Announcements | `announcements` |
| `week` | This week in your server | `week` |
| `n-messages`, `n-waiting`, `n-quiet` | The numbers: messages, questions waiting, quiet channels | `totals`, `questions` |
| `ideas` | All ideas | nothing |
| `idea-recap`, `idea-help`, `idea-links`, `idea-feedback`, `idea-welcome`, `idea-one-channel` | One idea each | nothing |

A box whose list is missing from `latest.json` (a catch-up written before the box existed)
stays off the page and says it shows up after the next catch-up. The routine fills every
list every run, whichever boxes a person has on their page: the agent cannot see layouts.

## latest.json

In short: `generatedAt`, `since`, `server` (the server's name), `serverId`, `totals`
`{ messages, channels, quiet }` (`channels` counts a thread or forum post as the channel it
lives in), `quietChannels` (the names behind `totals.quiet`, listed when the person opens
that line), and `channels`, one row per place that moved: `id`, `kind` (`channel`, `thread`
or `forum`), `name` (`#help` for a channel, the title for a thread or forum post), `parent`
(the channel a thread or forum post lives in), `messages`, `urgency` (High, Medium or Low),
`gist`, and `link`: the Discord link of the newest message there, exactly as Discord's
tools gave it. A `link` on `https://discord.com/channels/...` becomes an "Open in Discord"
link. An older catch-up's `url` is read the same way.

The lists for the other boxes:

- `questions`: questions from people nobody has answered, `{ id, who, channel, parent?,
  gist, at, link }`. `at` is when it was asked; the page counts how long it has waited.
- `recent`: the newest messages, newest first, at most 15, `{ who, where, parent?, gist,
  at, link }`. `where` is the `#channel`, or the thread's title with `parent` its channel.
- `people`: `{ active: [{ name, messages, where }], newcomers: [{ name, where, gist, at }] }`.
  `active` counts messages read in the window; `newcomers` are people who joined or said
  hello for the first time in the window.
- `bugs`: problems people reported, `{ id, title, where, parent?, people, status, gist,
  link }`, `people` the number of different people who hit it, `status` `open`,
  `workaround` or `fixed`.
- `announcements`: `{ who, where, gist, at, link }`, from announcement channels and posts
  that announce something.
- `week`: `{ from, messages, busiest, highlights: [] }`, the last 7 days from the day files.
- `spotlight`: the place most worth reading today, `{ name, parent?, kind, messages,
  story: [], open: [], link }`.

`known` is for the routine and the page ignores it: every channel, thread and forum post
seen in a catch-up, with the id of the newest message read there (`last`). It is how a
thread that started before the window is found again, since Discord's message ids carry
their own time and need no other cursor.

The page writes its own headline and the line under it: "Here is what moved in your server"
with "486 messages in 8 channels since yesterday. 4 questions are still waiting for an
answer.", or "Your server was quiet" when nothing moved. A catch-up that still holds `lead`,
`wants`, or the older `threads`, `forumPosts` and `mentions` totals still renders; the page
ignores them.

The page's ideas show pictures from `ideas/`, copies of existing template covers shrunk to
about 15KB each, until unique ones are made.

## The first catch-up, told as it happens

When `latest.json` is not there yet, the run is the person's first, and they are usually
watching the page. The agent then writes `data/reading.json`, only ever through
`node your-discord/first-read.mjs` (`start`, `recent @<file>`, `push '<line>'`,
`gift @<file>`, `offer @<file>`, `latest @<file>`, `done`):
`{ schema, startedAt, done, lines: [], recent?, gift?, offers? }`, each write atomic (a
`.part` file renamed into place) and one at a time under a lock. Each line is one short
sentence from a real Discord lookup, its finding in `**bold**`: "**#general**: 23 messages, a
thread about the release is still open". The helper refuses an empty line, a raw mention or
id, a long dash, a 0 as a finding and a broken value, in lines and in every field below.

`recent` comes very early: the newest few messages (1 to 8, `{ who, where, parent?, gist,
at, link? }`), shown at once under the reading, so the person has something real to read
from the first minute. It can be sent again to refresh it.

The right side says "While I read, you can...". First the `gift`: `question` (`who`,
`channel`, `since`, `gist`, `link`: the question that has waited longest for an answer),
`busy` (`name`, `parent`, `messages`, `link`: where everyone was), or `calm` (nothing moved).
Then up to 3 `offers`, added as the agent finds them: `reply` (another question waiting:
`who`, `channel`, `since`, `gist`, `link`), `catchup` (`name`, `parent`, `gist`: a place
worth catching up on), `summary` (`name`, `parent`, `gist`: a busy thread to sum up) and
`announce` (`channel` with `"level": "write"`, and `gist`: something worth announcing, only
in a channel set to Write). Each is a button that asks the agent in the chat; it drafts and
never posts. "Looking for one thing I can take off your plate right now" holds the place
until the first one arrives. After the reading the list stays on top of the page for three
days, until every one is used or the person presses Not now.

`latest @<file>` writes `latest.json` from the agent's file in `data/.work/` (it sets
`schema` and `generatedAt`, moves a top-level `why` to `status.json`), its copy in `days/`,
and `status.json`. `done` marks the reading done and deletes `data/.work/`.

While a run is going the page reads `reading.json` every few seconds and tells its lines one
at a time. A reading older than 20 minutes is ignored. Without `reading.json` (or the helper)
the page shows "Catching up on your server..." as before, and later catch-ups never write it.

If the morning run was missed (the computer was asleep at 9), the page runs it once when it
opens, from the schedule in `../.jobs/morning-discord-digest.yaml`. That needs no change to
the routine.
