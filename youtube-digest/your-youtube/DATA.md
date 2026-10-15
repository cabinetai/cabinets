---
title: How Your YouTube gets its words
---
# How Your YouTube gets its words

The page never talks to YouTube. The morning routine reads the channel through the YouTube
Data API, and through YouTube Analytics when the person allowed it (with the Google sign-in
Cabinet already holds), writes files here, and the page shows them. The full rules for each field are in the agent's persona
(`.agents/channel-reader/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning YouTube Digest, every day at 9 | This morning's catch-up. Schema `youtube-digest/your-youtube@1`. |
| `data/days/<YYYY-MM-DD>.json` | The same routine | A copy of each day's catch-up, for the date picker. Kept for 30 days. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up channel in the same shape, with every box filled. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | The same routine | `{ at, ok, why }`. `ok: false` means the last run could not read YouTube; the page shows `why` with a Try again button. |
| `data/reading.json` | The first catch-up only, through `first-read.mjs` | `{ schema, startedAt, done, lines, recent, gift, offers }`: what the agent found, one line at a time, the newest comments and the things to do now, while the person watches. Schema `youtube-digest/reading@1`. |
| `data/.work/` | The first catch-up, through `first-read.mjs` | The agent's own files for the helper (`recent.json`, `gift.json`, `offer.json`, `latest.json`). Deleted when the reading is done. |
| `data/layout-change.json` | The agent, in a chat | Boxes someone asked to `add` or `remove`, with `at`, `for` and a `note`. Schema `youtube-digest/layout-change@1`. The page offers it with Apply and No thanks; each person's layout itself stays in Cabinet (`cabinet.mine`), not in a file. |

`latest.json` in short: `generatedAt`, `since`, `channel` `{ title, handle, subscribers,
views, videos, url }`, `totals` `{ views, likes, comments, newVideos, waiting }` (`views`
and `likes` are what the recent videos gained since the last catch-up, left out on the
first one), `analytics` (below), and one list for each box:

| List | Box | Each item |
|---|---|---|
| `videos` | How your videos did | `id`, `videoId`, `title`, `published`, `views`, `likes`, `comments` (YouTube's count, the channel's own included), `viewerComments` (the comments from viewers, which the row shows), `gained` `{ views, likes, comments }` (`comments` from viewers), `mark` best, quiet or empty, `gist`, `url` |
| `waiting` | Waiting for an answer | `id`, `who`, `video`, `videoId`, `commentId`, `gist`, `short`, `since`, `likes`, `url` |
| `recent` | Latest comments | `id`, `who`, `video`, `gist`, `at`, `url` |
| `asks` | What viewers keep asking | `id`, `what`, `people` (different authors), `videos` (titles), `answered`, `url` |
| `next` | Ideas for your next videos | `id`, `title`, `why`, `from` (the `asks` id behind it) |

`analytics` holds the channel's numbers from YouTube Analytics, about two days late:
`{ ok: true, until, last7, last28, daily }`. `until` is the last day YouTube has
(`YYYY-MM-DD`); `last7` and `last28` are each `{ from, views, watchHours, avgViewSec,
subsGained, subsLost, sources, countries }`, with `sources` the top 5 `{ type, views }`
(`type` is YouTube's own name, such as `RELATED_VIDEO` or `YT_SEARCH`; the page words it as
YouTube Studio does) and `countries` the top 5 `{ code, views }` (`US`, `GB`); `daily` is
`{ day, views }` for each of the 28 days. Without the Analytics permission it is
`{ ok: false, why: "not-allowed" }`, and `why: "unavailable"` when Analytics failed that
morning. The Channel numbers box then shows the counts from `channel` and one quiet line on
what Analytics would add; the headline leaves out its chart.

`me` (the channel's id and uploads playlist) and `known` (each video's counts at the last
catch-up, with `viewerComments` and `own`, the channel's own comments, so the next one can
tell what changed) are for the routine; the page ignores
them. A `url` on YouTube's own address (`https://www.youtube.com/watch?v=...`, with
`&lc=<comment id>` for a comment) becomes an "Open on YouTube" link.

The page is a 12-column grid of boxes on YouTube's light grey, laid out like the Gmail front
desk: Headline, Waiting for an answer, Latest comments, Channel numbers, How your videos did,
What viewers keep asking, Ideas for your next videos, Ask about your channel and Ideas for
your channel to start with, and more to add (four numbers, Watch time only with Analytics,
and each idea as its own box with its picture from `ideas/`). The connection, Catch up now,
Ideas and Layout sit in the headline; without the headline they move to a slim bar on top. Each person
moves, resizes, adds and removes them (mouse, finger or keyboard, with Undo), or asks the
agent through Layout, which answers with `layout-change.json`. An idea offers itself at the
foot of its box when the day's channel says it would help.

The page writes its own headline from `channel`, `totals`, `videos` and `waiting`: the
channel's name, then "18,420 views and 186 comments since yesterday. 5 questions are waiting
for your answer.", or "A quiet day: nothing new on your videos since the last catch-up.", and
a line of subscribers, videos and the handle. With Analytics, the views of each of the 28
days stand on its right, the last seven in YouTube red.

Nothing on the page writes on YouTube. Every button asks the agent in the chat for a summary,
a plan or a draft to copy. The agent replies to a comment, or changes a video's title or
description, only when the person asks for it in the chat, with YouTube connected to allow
replies, after showing the words.

The first catch-up (no `latest.json` yet) is told as it happens. The agent runs
`node your-youtube/first-read.mjs start`, then `push '<line>'` after each look at YouTube
("**31 new comments** since yesterday, 4 of them questions"), `recent @recent.json` very
early, `gift @gift.json` once, `offer @offer.json` up to three times, `latest @latest.json`
and `done`. The helper writes `reading.json` atomically under a lock, refuses an empty,
broken or repeated line, and checks every name, title, time and link (no raw ids, no
em-dash). The page shows the lines one by one under "Reading your channel", the newest
comments (`recent`: `{ who, video, at, gist, link }`, up to 5) at once under them as "Just
now on your channel", and beside them "While I read, you can...": the gift `{ kind:
"waiting", who, video, videoId, commentId, since, gist, link, at }` (the question the most
people want answered; "Draft my reply" asks the agent for a draft in the chat, never posted)
or `{ kind: "calm" }` ("Give me three ideas"), then the `offers`: `{ kind: "video", title,
views }`, `{ kind: "asked", what, people }` or `{ kind: "next" }`, each a button that asks the
agent for a summary or a draft. After the reading the gift and the offers not yet used stay
on top of the page for 3 days, or until put away. A reading older than 20 minutes is
ignored, and without `reading.json` the page shows its plain "Catching up" card, as every
later catch-up does.

The page's ideas show pictures from `ideas/`, copies of existing template covers shrunk to
about 10KB each, until unique ones are made.

If the morning run was missed (the computer was asleep at 9), the page runs it once when it
opens, from the schedule in `../.jobs/morning-youtube-digest.yaml`.
