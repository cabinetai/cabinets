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

`latest.json` in short: `generatedAt`, `since`, `workspace`, `headline`, an optional `lead`
`{ id, why }` naming one channel, `totals` `{ messages, channels, quiet, mentions, dms }`,
`quietChannels` (the names behind `totals.quiet`, listed when the person opens that line),
and `channels` (`name`, `messages`, `urgency` High, Medium or Low, `gist`, `wants`, `url`).
Every channel has an `id`. `me` (the person's Slack name and id) and `known` (the
conversations seen before, read directly next time so nothing search misses is lost) are
for the routine; the page ignores them. A `url` on Slack's own address becomes
an "Open in Slack" link.

The page writes its own headline and the line under it from `channels` and `totals`:
"Here is what moved in your Slack" with "4 messages in 2 channels since yesterday.", or
"Your Slack was quiet" when no channel moved. A catch-up written before this change may
still hold `waiting`, `decisions` and `promises` lists; the page ignores them.
