---
title: How Your TikTok gets its words
---
# How Your TikTok gets its words

The page never talks to TikTok. The morning routine reads the account through TikTok's
Display API (through the address Cabinet gives each run, never a token), writes files here,
and the page shows them. The full rules for each field are in the agent's persona
(`.agents/account-reader/persona.md`).

TikTok gives apps like Cabinet only counts: the profile's (followers, following, likes,
videos) and each of the account's own videos' totals (views, likes, comments, shares). No
comment text, no views per day, no watch time, no audience. So the page shows no comments
box, and everything "since yesterday" or "over 7 and 28 days" is counted from the routine's
own earlier reads (`known` and `history`), said as such on the page.

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning TikTok Digest, every day at 9 | This morning's catch-up. Schema `tiktok-digest/your-tiktok@1`. |
| `data/days/<YYYY-MM-DD>.json` | The same routine | A copy of each day's catch-up, for the date picker. Kept for 30 days. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up account in the same shape, with every box filled. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | The same routine | `{ at, ok, why }`. `ok: false` means the last run could not read TikTok; the page shows `why` with a Try again button. |
| `data/reading.json` | The first catch-up only, through `first-read.mjs` | `{ schema, startedAt, done, lines, recent, gift, offers }`: what the agent found, one line at a time, the newest videos and the things to do now, while the person watches. Schema `tiktok-digest/reading@1`. |
| `data/.work/` | The first catch-up, through `first-read.mjs` | The agent's own files for the helper (`recent.json`, `gift.json`, `offer.json`, `latest.json`). Deleted when the reading is done. |
| `data/layout-change.json` | The agent, in a chat | Boxes someone asked to `add` or `remove`, with `at`, `for` and a `note`. Schema `tiktok-digest/layout-change@1`. The page offers it with Apply and No thanks; each person's layout itself stays in Cabinet (`cabinet.mine`), not in a file. |

`latest.json` in short: `generatedAt`, `since`, `account` `{ name, handle, followers,
following, likes, videos, verified, url }`, `totals` `{ views, likes, comments, shares,
followers, newVideos }` (all but `newVideos` are what changed since the last catch-up, left
out on the first one; `followers` can be below 0), and:

| Part | Box | What it holds |
|---|---|---|
| `videos` | How your videos did, Headline | The 10 newest: `id`, `videoId`, `title` (`""` when the video has none; the page names it by its day), `published`, `duration`, `views`, `likes`, `comments`, `shares`, `gained` `{ views, likes, comments, shares }`, `mark` best (moved most), quiet or empty, `gist`, `url` |
| `spans` | Account numbers | `last7` and `last28`, each `{ from, videos, views, likes, comments, shares }`: the totals of the videos posted since `from`, with `partial: true` when the reads stopped before 28 days |
| `history` | Account numbers, Followers | `{ day, followers, likes, videos }` for each morning read, oldest first, at most 30. The page counts how followers and likes moved over 7 or 28 days from it, or "since <day>" while the reads are newer than that |
| `next` | Ideas for your next videos | `id`, `title`, `why`, `from` (the video it builds on) |

`known` (each video's counts at the last catch-up) is for the routine; the page ignores it.
A `url` on TikTok's own address (`https://www.tiktok.com/...`, or `vm.`/`vt.` short links)
becomes an "Open on TikTok" link.

The page is a 12-column grid of boxes on a light grey, laid out like the Gmail front desk:
Headline, How your videos did, Ideas for your next videos, Ideas for your account, Account
numbers and Ask about your account to start with, and more to add (four numbers: Views,
Followers, Likes, Shares, and each idea as its own box with its picture from `ideas/`). The
connection, Catch up now, Ideas and Layout sit in the headline; without the headline they
move to a slim bar on top. Each person moves, resizes, adds and removes them (mouse, finger
or keyboard, with Undo), or asks the agent through Layout, which answers with
`layout-change.json`. An idea offers itself at the foot of its box when the day's account
says it would help.

The page writes its own headline from `account`, `totals` and `videos`: the account's name,
then "191,900 views and 16,452 likes since yesterday. Moved most: Sourdough starter in 5
days, +142,300 views. You gained 1,240 followers.", or "A quiet day: nothing new on your
videos since the last catch-up.", and a line of followers, likes, videos and the handle. On
the right, the views of the last 10 videos, oldest first, the one that moved most in
TikTok's cyan. Until the first catch-up the Example line sits right under the band.

Nothing on the page writes on TikTok, and Cabinet's TikTok cannot: it only reads. Every
button asks the agent in the chat for a plan, a caption or a page in the cabinet.

The first catch-up (no `latest.json` yet) is told as it happens. The agent runs
`node your-tiktok/first-read.mjs start`, then `push '<line>'` after each look at TikTok
("**Your last 10 videos**: 612,400 views between them"), `recent @recent.json` very early,
`gift @gift.json` once, `offer @offer.json` up to twice, `latest @latest.json` and `done`.
The helper writes `reading.json` atomically under a lock, refuses an empty, broken or
repeated line, and checks every title, time, count and link (no raw ids, no long dash). The
page shows the lines one by one under "Reading your account", the newest videos (`recent`:
`{ title, at, views, link }`, up to 5) at once under them as "Your newest videos", and
beside them "While I read, you can...": the gift `{ kind: "best", video, views, posted,
link, at }` (the recent video doing best; "Plan a follow-up" asks the agent for a plan in
the chat) or `{ kind: "calm" }` on an account with no videos ("Give me three ideas"), then
the `offers`: `{ kind: "quiet", video }` or `{ kind: "next" }`. After the reading the gift
and the offers not yet used stay under the page's boxes for 3 days, or until put away. A
reading older than 20 minutes is ignored. Without `reading.json` the reading screen shows
"Opening your account..." until the first line, so with no lines at all it stays on that
until the catch-up is done. Every later catch-up shows "Catching up..." on its button.

`first-read.mjs` and the page keep the same limits, each said on both sides: a link is a
`https://` address on `tiktok.com` (or `www.`, `m.`, `vm.`, `vt.`) under 400 characters; a
title is at most 120 characters; at most 5 newest videos and 2 offers; a day file is
`data/days/<YYYY-MM-DD>.json`, kept for 30 days. Change one, change both.

The page's ideas show pictures from `ideas/`, copies of existing template covers shrunk to
about 10KB each, until unique ones are made.

If the morning run was missed (the computer was asleep at 9), the page runs it once when it
opens, from the schedule in `../.jobs/morning-tiktok-digest.yaml`.
