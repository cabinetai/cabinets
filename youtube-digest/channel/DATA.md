---
title: How the page gets your channel
---
# How the page gets your channel

The page never talks to YouTube. The morning read asks YouTube through Cabinet's own
tools and writes files here, and the page shows them.

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning channel read, every day at 8 | The last read. Schema `youtube-digest/channel@1`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up cooking channel in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | Every read | `{ at, ok, why }`. `ok: false` means the last read could not reach YouTube; the page shows `why` with a Try again button. |

`latest.json` in short:

- `generatedAt` (ISO time), `headline` (one sentence).
- `channel`: `name`, `handle`, `url`, `subscribers`, `videos`, `views`.
- `week`: `views`, `viewsBefore`, `watchHours`, `watchHoursBefore`, `subscribers`,
  `subscribersBefore` (new minus lost), `through` (the last day counted, YYYY-MM-DD) and
  `days`, the last 28 days oldest first, each `{ date, views }`.
- `waiting`: comments with no answer from the channel, most useful first. Each has `id`,
  `videoId`, `videoTitle`, `author`, `text`, `at`, `likes`, `kind` (`question`, `praise`,
  `problem` or `business`) and `reply`, the suggested answer.
- `videos`: the newest videos, each `id`, `title`, `url`, `publishedAt`, `seconds`,
  `views`, `likes`, `comments` and `vsUsual` (its views divided by the channel's usual
  video at the same age; 1 is usual).
- `asking`: what viewers keep asking, each `{ question, count }`.
- `ideas`: up to three, each `{ title, why }`.

The readable page for each morning goes to `reports/<YYYY-MM-DD>.md` beside this folder.
