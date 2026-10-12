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

`latest.json` in short: `generatedAt`, `since`, `server` (the server's name), `totals`
`{ messages, channels, quiet }` (`channels` counts a thread or forum post as the channel it
lives in), `quietChannels` (the names behind `totals.quiet`, listed when the person opens
that line), and `channels`, one row per place that moved: `id`, `kind` (`channel`, `thread`
or `forum`), `name` (`#help` for a channel, the title for a thread or forum post), `parent`
(the channel a thread or forum post lives in), `messages`, `urgency` (High, Medium or Low),
`gist`, and `url`. A `url` on `https://discord.com/channels/...` becomes an "Open in Discord"
link; it is `null` when the routine does not know the server's id.

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

If the morning run was missed (the computer was asleep at 9), the page runs it once when it
opens, from the schedule in `../.jobs/morning-discord-digest.yaml`. That needs no change to
the routine.
