---
title: How Your Discord gets its words
---
# How Your Discord gets its words

The page never talks to Discord. The morning routine reads Discord through Cabinet's own
bot and writes files here, and the page shows them. The full rules for each field are in
the agent's persona (`.agents/server-reader/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning Discord Digest, every day at 9 | This morning's catch-up. Schema `discord-digest/your-discord@2`. |
| `data/days/<YYYY-MM-DD>.json` | The same routine | A copy of each day's catch-up, for the date picker. Kept for 30 days, because Cabinet lists 500 files of a folder, oldest name first. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up server in the same shape, with every box filled. Shown, marked as an example, until `latest.json` exists. The first real catch-up deletes it. A `latest.json` that cannot be read is never replaced by the example: the page says it could not be read. |
| `data/status.json` | The same routine | `{ at, ok, why, code? }`. `ok: false` means the last run could not read Discord; the page shows `why` with a Try again button. `code: "no-channels"` means no channels are chosen, and the page says where to choose them. `code: "no-words"` means Discord gave messages without their text. `ok: true` with a `why` is a partial catch-up: the page shows what was skipped. |
| `data/layout-change.json` | The agent, in a chat | Boxes someone asked to `add` or `remove`, with `at`, `for` and a `note`. Schema `discord-digest/layout-change@1`. The page offers it with Apply and No thanks; each person's layout itself stays in Cabinet, not in a file. |
| `data/reading.json` | The first catch-up only, through `first-read.mjs` | What the agent finds as it reads, line by line, the latest messages, and a short list of things the person can do now. Schema `discord-digest/reading@1`. |
| `data/.work/` | The first catch-up only | The agent's own files for `first-read.mjs`. Deleted when the reading is done. |

Every time in these files comes from `date` in the shell or from what Discord returned.

## The page is a grid of boxes

The page works like Gmail's front desk: a grid of 12 columns, shown as rows, and each box is
moved, resized, added and removed by mouse, finger or keyboard, with Undo. Boxes side by side
always share a top and a bottom. Each person's layout is kept for them in Cabinet
(`cabinet.mine`, key `discord-digest-layout@2`), so it follows them. **Layout** offers "Add
or remove boxes" (by hand) and "Ask the agent" (the agent writes `layout-change.json`).
**Ideas** shows every idea with its picture: ask now, switch it on as a routine, or add it as
a box. An idea also offers itself at the foot of its box on a day it fits.

The boxes, by id (the ids the agent uses in `layout-change.json`):

| Id | Box | From `latest.json` |
|---|---|---|
| `headline` | The band (on the page at first) | `channels`, `totals`, `questions` |
| `questions` | Unanswered questions (on the page at first) | `questions` |
| `recent` | Latest messages (on the page at first) | `recent` |
| `channels` | Catch up by channel (on the page at first) | `channels`, `totals`, `quietChannels` |
| `heated` | Heated threads (on the page at first) | `heated` |
| `people` | New and active people (on the page at first) | `people` |
| `ideas` | Ideas for your server (on the page at first) | nothing |
| `ask` | Ask about your server (on the page at first) | nothing |
| `problems` | Problems reported | `problems` |
| `announcements` | Announcements | `announcements` |
| `week` | This week in your server | `week` |
| `n-questions`, `n-messages`, `n-quiet` | The numbers | `questions`, `totals` |
| `idea-answers`, `idea-recap`, `idea-links`, `idea-feedback`, `idea-welcome` | One idea each | nothing |

`week` stays off the page until a catch-up holds it, and the Add a box panel says so. The
routine fills every list every run, whichever boxes a person has on their page: the agent
cannot see layouts. A box that cannot be drawn from a bad field says so in one sentence.

## latest.json

In short: `generatedAt`, `since`, `server` (the server's name), `serverId`, `totals`
`{ messages, channels, quiet }` (`channels` counts a thread or forum post as the channel it
lives in), `quietChannels` (the names behind `totals.quiet`, listed when the person opens
that line), and `channels`, one row per place that moved: `id`, `kind` (`channel`, `thread`
or `forum`), `name` (`#help` for a channel, the title for a thread or forum post), `parent`
(the channel a thread or forum post lives in), `messages`, `capped` (true when more were
there than were read; the page shows "200+"), `urgency` (High, Medium or Low), `gist`, and
`link`: the Discord link of the newest message there, exactly as Discord's tools gave it. A
`link` on `https://discord.com/channels/...` becomes an "Open in Discord" link.

Everywhere, `where` is the `#channel` or a thread's title, and `parent` is the channel that
thread lives in.

- `questions`: `{ id, kind, who, where, parent?, gist, at, link }`, `kind` `question` or
  `help` (someone stuck; the page marks it "Needs help"). `at` is when it was asked; the
  page counts how long it has waited.
- `recent`: the newest messages, at most 15, `{ who, where, parent?, gist, at, link }`.
- `heated`: `{ id, name, parent?, messages, people, gist, link }`, `people` the number of
  different people in it. Never who was right, and never a quote.
- `people`: `{ active: [{ name, messages, where }], newcomers: [{ name, where, gist, at }] }`.
  `active` counts messages read in the window. `newcomers` come from a join notice or a
  first hello in what was read: the tools have no member list, so the page says "in what
  was read".
- `problems`: `{ id, title, where, parent?, people, status, gist, link }`, `status` `open`,
  `workaround` or `fixed`.
- `announcements`: `{ who, where, gist, at, link }`.
- `week`: `{ from, messages, busiest, highlights: [] }`, the last 7 days from the day files.

`known` is for the routine and the page ignores it: every channel, thread and forum post
seen in a catch-up, with the id of the newest message read (`last`) and a thread's message
count (`count`). It saves reading a thread that has not moved.

The page writes its own headline and the line under it: "Here is what moved in your server"
with "476 messages in 8 channels since yesterday. 4 questions are still unanswered.", or
"Your server was quiet" with "No new messages since yesterday." when nothing moved.

The page's ideas show pictures from `ideas/`.

## The first catch-up, told as it happens

When `latest.json` is not there yet, the run is the person's first, and they are usually
watching the page. It reads back 7 days, 30 when 7 find nothing, so a normal server never
comes back empty. The agent then writes `data/reading.json`, only ever through
`node your-discord/first-read.mjs` (`start`, `recent @<file>`, `push '<line>'`,
`gift @<file>`, `offer @<file>`, `latest @<file>`, `done`):
`{ schema, startedAt, done, lines: [], recent?, gift?, offers? }`, each write atomic (a
`.part` file renamed into place) and one at a time under a lock. Each line is one short
sentence from a real Discord lookup, its finding in `**bold**`. The helper refuses an empty
line, a raw mention or id, a long dash, a 0 as a finding and a broken value.

`recent` comes very early: the newest few messages (1 to 8), shown at once under the reading.
It can be sent again to refresh it.

The `gift`: `question` (`who`, `channel`, `since`, `gist`, `link`: the question that has
waited longest), `busy` (`name`, `parent`, `messages`, `link`: the busiest place), or `calm`
(nothing moved). Then up to 3 `offers`, added as the agent finds them: `reply`, `catchup` and
`summary`. Each is a button that asks the agent in the chat; it reads, sums up or drafts, and
never posts. After the reading they stay under the boxes for three days at most, until each
is used, the person presses Not now, or a later catch-up replaces the first one: by then
"nobody has answered" may no longer be true.

`latest @<file>` writes `latest.json` from the agent's file in `data/.work/` (it sets `schema`
and `generatedAt`, moves a top-level `why` to `status.json`), its copy in `days/`, and
`status.json`, and deletes `EXAMPLE-latest.json`. `done` marks the reading done and deletes
`data/.work/`.

While a run is going the page reads `reading.json` every few seconds and tells its lines one
at a time. A reading older than 20 minutes is ignored. The reading screen shows from the
moment the first run starts. Later catch-ups never write `reading.json`.

If the morning run was missed (the computer was asleep at 9), the page runs it once when it
opens, from the schedule in `../.jobs/morning-discord-digest.yaml`.
