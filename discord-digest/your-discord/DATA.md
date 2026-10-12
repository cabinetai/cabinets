---
title: How Your Discord gets its words
---
# How Your Discord gets its words

The page never talks to Discord. A morning routine reads Discord and writes files here, and
the page shows them.

**Not wired yet.** Today the Morning Discord Digest routine still writes markdown files into
`daily-summaries/` for the older `server-digest` page. Until it writes `data/latest.json`,
this page shows the example below, marked as an example.

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning Discord Digest, every day at 9 | This morning's catch-up. Schema `discord-digest/your-discord@1`. |
| `data/days/<YYYY-MM-DD>.json` | The same routine | A copy of each day's catch-up, for the date picker. Kept for 30 days. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up server in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | The same routine | `{ at, ok, why }`. `ok: false` means the last run could not read Discord; the page shows `why` with a Try again button. |

`latest.json` in short: `generatedAt`, `since`, `server` (the server's name), an optional
`lead` `{ id, why }` naming one row, `totals` `{ messages, channels, threads, forumPosts,
quiet, mentions }`, `quietChannels` (the names behind `totals.quiet`), and `channels`, one
row per place that moved: `id`, `kind` (`channel`, `thread` or `forum`), `name` (`#help`
for a channel, the title for a thread or forum post), `parent` (the channel a thread or
forum post lives in), `messages`, `urgency` (High, Medium or Low), `gist`, `wants`, and
`url`. A `url` on `https://discord.com/channels/...` becomes an "Open in Discord" link.

The page writes its own headline and the line under it: "Here is what moved in your server"
with "486 messages in 5 channels, 3 threads and 2 forum posts since yesterday.", or "Your
server was quiet" when nothing moved.
