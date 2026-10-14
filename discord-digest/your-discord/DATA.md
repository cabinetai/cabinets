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
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up server in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | The same routine | `{ at, ok, why }`. `ok: false` means the last run could not read Discord; the page shows `why` with a Try again button. |
| `data/reading.json` | The first catch-up only, through `first-read.mjs` | What the agent finds as it reads, line by line, and one thing the person can do now. Schema `discord-digest/reading@1`. |
| `data/.work/` | The first catch-up only | The agent's own files for `first-read.mjs` (the gift, the catch-up). Deleted when the reading is done. |

`latest.json` in short: `generatedAt`, `since`, `server` (the server's name), `serverId`, `totals`
`{ messages, channels, quiet }` (`channels` counts a thread or forum post as the channel it
lives in), `quietChannels` (the names behind `totals.quiet`, listed when the person opens
that line), and `channels`, one row per place that moved: `id`, `kind` (`channel`, `thread`
or `forum`), `name` (`#help` for a channel, the title for a thread or forum post), `parent`
(the channel a thread or forum post lives in), `messages`, `urgency` (High, Medium or Low),
`gist`, and `link`: the Discord link of the newest message there, exactly as Discord's
tools gave it. A `link` on `https://discord.com/channels/...` becomes an "Open in Discord"
link. An older catch-up's `url` is read the same way.

`known` is for the routine and the page ignores it: every channel, thread and forum post
seen in a catch-up, with the id of the newest message read there (`last`). It is how a
thread that started before the window is found again, since Discord's message ids carry
their own time and need no other cursor.

The page writes its own headline and the line under it: "Here is what moved in your server"
with "486 messages in 8 channels since yesterday.", or "Your server was quiet" when nothing
moved. A catch-up that still holds `lead`, `wants`, or the older `threads`, `forumPosts` and
`mentions` totals still renders; the page ignores them.

The page's ideas show pictures from `ideas/`, copies of existing template covers shrunk to
about 15KB each, until unique ones are made.

## The first catch-up, told as it happens

When `latest.json` is not there yet, the run is the person's first, and they are usually
watching the page. The agent then writes `data/reading.json`, only ever through
`node your-discord/first-read.mjs` (`start`, `push '<line>'`, `gift @<file>`,
`latest @<file>`, `done`): `{ schema, startedAt, done, lines: [], gift? }`, each write atomic
(a `.part` file renamed into place) and one at a time under a lock. Each line is one short
sentence from a real Discord lookup, its finding in `**bold**`: "**#general**: 23 messages, a
thread about the release is still open". The helper refuses an empty line, a raw mention or
id, a 0 as a finding and a broken value.

`gift` is one thing the person can do now: `question` (`who`, `channel`, `since`, `gist`,
`link`: the question that has waited longest for an answer), `busy` (`name`, `parent`,
`messages`, `link`: where everyone was), or `calm` (nothing moved). The page shows it as a
button that asks the agent in the chat ("Write my reply" drafts a reply and never posts it),
and keeps it on top for three days after the reading, until it is used or put away.

`latest @<file>` writes `latest.json` from the agent's file in `data/.work/` (it sets
`schema` and `generatedAt`, moves a top-level `why` to `status.json`), its copy in `days/`,
and `status.json`. `done` marks the reading done and deletes `data/.work/`.

While a run is going the page reads `reading.json` every few seconds and tells its lines one
at a time. A reading older than 20 minutes is ignored. Without `reading.json` (or the helper)
the page shows "Catching up on your server..." as before, and later catch-ups never write it.

If the morning run was missed (the computer was asleep at 9), the page runs it once when it
opens, from the schedule in `../.jobs/morning-discord-digest.yaml`. That needs no change to
the routine.
