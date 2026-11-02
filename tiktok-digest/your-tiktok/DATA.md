---
title: How Your TikTok gets its words
---
# How Your TikTok gets its words

The page never talks to TikTok. The morning routine reads the account through TikTok's
Display API (with curl, through the address Cabinet gives each run, never a token) and saves
the answers as they came. `first-read.mjs compute` counts every number from them, the agent
adds only its gists and ideas, and `first-read.mjs latest` checks all of it and writes the files
here, on every run. The agent's rules are in its persona
(`.agents/account-reader/persona.md`).

TikTok gives apps like Cabinet only counts: the profile's (followers, following, likes,
videos) and each of the account's own videos' totals (views, likes, comments, shares), with its
length and when it was posted. No comment text, no views per day, no watch time, no audience,
no posting. So the page shows no comments box, and everything "since yesterday" or "over 7 and
28 days" is counted from the routine's own earlier reads (`known` and `history`), said as such
on the page.

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning TikTok Digest, every day at 9 | This morning's catch-up. Schema `tiktok-digest/your-tiktok@1`. |
| `data/days/<YYYY-MM-DD>.json` | The same routine | A copy of each day's catch-up, for the date picker. Kept for 30 days. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up account in the same shape, with every box filled. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | `first-read.mjs` | `{ at, ok, kind, why }`. `ok: false` means the last run could not read TikTok, and `latest.json` stays as it was; the page shows `why` with Try again. `kind` is `signed-out`, `not-connected`, `rate-limited`, `unreachable` or `other`, and only `signed-out` offers Connect TikTok again. A partial run is `ok: true` with a `why`. |
| `data/reading.json` | The first catch-up only, through `first-read.mjs` | `{ schema, startedAt, done, lines, recent, gift, offers }`: what the agent found, one line at a time, the newest videos and the things to do now, while the person watches. Schema `tiktok-digest/reading@1`. |
| `data/.work/` | Every catch-up | TikTok's answers (`user.json`, `videos.json`, `videos-2.json`), what compute counted (`computed.json`, with `recent.json`, `gift.json`, `offer-next.json` and `offer-quiet.json` for the first catch-up) and the agent's `words.json`. Deleted by `done`. |
| `setup.md` | The person, or the agent when told in a chat | What they make, their goal, how their captions sound, what to avoid. The agent reads it on every run. |
| `data/layout-change.json` | The agent, in a chat | Boxes someone asked to `add` or `remove`, with `at`, `for` and a `note`. Schema `tiktok-digest/layout-change@1`. The page offers it with Apply and No thanks; each person's layout itself stays in Cabinet (`cabinet.mine`), not in a file. |

`latest.json` in short: `generatedAt`, `since` (the read it is compared with), `timeZone`,
`account` `{ name, handle, followers, following, likes, videos, verified, url }`, `totals`
`{ views, likes, comments, shares, followers, newVideos }` (all but `newVideos` are what changed
since that read, left out on the first one; `followers` can be below 0), and:

| Part | Box | What it holds |
|---|---|---|
| `videos` | How your videos did, Headline | The 10 newest, then the best or quiet video with `older: true` when it is older than those: `id`, `videoId`, `title` (`""` when the video has none; the page names it by its day), `published`, `duration`, `views`, `likes`, `comments`, `shares`, `gained` `{ views, likes, comments, shares }`, `mark` best (moved most), quiet or empty, `firstDay` `{ views, usual, pace }` when it is known, `gist`, `url` |
| `spans` | Your account | `last7` and `last28`, each `{ from, videos, views, likes, comments, shares, top }`: the totals of the videos posted since `from`, `top` the four most viewed `{ videoId, title, published, views, url }`, with `partial: true` when the reads stopped before 28 days |
| `history` | Your account, Followers | `{ day, followers, following, likes, videos, viewsGained }` for each morning read, oldest first, at most 30 (`viewsGained` is left out of a first read). The page compares each account number with the read before, draws followers and likes as lines over 7 or 28 days, works out the growth line, and says "First read" while there is only one |
| `works` | What works for you | Counted over up to 40 videos at least 3 days old: `videos`, `usual` `{ views, shares, comments }` (the medians, the last two per 1,000 views over videos with at least 100 views), and `length`, `weekday`, `hour`, each a list of `{ label, videos, median }` holding only groups of 3 or more. The page says it shows their own posting history, not when their audience is online |
| `next` | Ideas for your next videos | `id`, `title`, `why`, `from` (the video it builds on, shown as "From: <video>") |

`known` is for the routine and the page ignores it: each video read, with its counts at that
read, `at`, and `day1` `{ views, hours }`, its views at its first read after 24 hours (only when
that read comes before 72 hours). It keeps every video read, at most 400.

How compute counts, so the page's words stay true:

- `gained`: a video in the baseline's `known` always subtracts. Only a video missing from it and
  posted since that read counts whole; an older one read for the first time gains nothing.
- The baseline is the last catch-up. When that was today it is the last day file before today,
  so a second press of Catch up now counts nothing twice. A changed handle has no baseline: it
  counts as a first catch-up.
- `best`: the most views gained, from every video read. On a first catch-up, the most views per
  day since posting, and a video under a day old cannot be best.
- `quiet`: the fewest total views among videos 7 to 60 days old, only when that is under half
  their middle value.
- Titles are cleaned, never refused: a long dash turns into a comma, a link or a raw id goes.
  A real title with the word null in it stays.

A `url` on TikTok's own address (`https://www.tiktok.com/...`, or `vm.`/`vt.` short links)
becomes an "Open on TikTok" link, and the account's `url` links the handle in the band.

The page is a 12-column grid of white boxes on TikTok's pale grey, in TikTok Sans. It starts
with Headline; How your videos did beside Ideas for your next videos and Ask about your
account; Your account (followers, following, likes and videos against the read before, each up,
down or unchanged with its percent; a growth line such as "+84 followers a day this week, up
from +52. 3 followers per 1,000 views. You posted 2 videos."; followers and likes as lines over
7 or 28 days; and what the videos posted in those days gathered, with no arrows, since those
are totals so far); and What works for you. With under 6 videos the list is short, so Ask moves
below the rest. Ideas for your account, Keep your TikToks in Cabinet (the guide's steps for
saving videos in Video Library, with Show me how opening them in a side panel), four numbers
(Views, Followers, Likes, Shares) and each idea as its own box are under Add a box. Connecting,
Catch up now, Ideas and Layout sit in the headline; without the headline they move to a slim bar
on top. Each person moves, resizes, adds and removes boxes (mouse, finger or keyboard, with
Undo), or asks the agent through Layout, which answers with `layout-change.json`. The layout is
kept in whole rows; shown, each box is as tall as what is in it (in half rows) and the boxes
under it move up, so no box shows an empty block. Boxes side by side end on one line when their
content is about as tall. An idea offers itself at the foot of its box when the day's account
says it would help.

The page shows one red button at a time. Before the first catch-up it is Connect or Catch up
now. After it, it sits in the band: "Plan a follow-up to <moved most>", "Plan my next video" on
a quiet day, "Plan my first video" with no videos, or Connect TikTok again after a dead
sign-in. Everything else that would be red turns dark while it shows.

Before TikTok is connected the band holds only Connect TikTok, one line, and See the steps,
which opens the side panel: three steps, each with a picture of the real screen redrawn as a
small SVG with a made-up account, sunny.bakery. TikTok sends the person back to Cabinet by
itself; nothing is ever pasted. Someone who cannot connect sees who to ask. When TikTok needs a
new sign-in the band shows the same steps under Sign in again. The pictures are drawn by the
page's own script in `index.html`, so they show on Cloud too.

The page writes its own headline from `account`, `totals` and `videos`: the account's name,
then "191,900 views and 16,452 likes since yesterday. Moved most: Sourdough starter in 5
days, +142,300 views. You gained 1,240 followers.", or "A quiet day: nothing new on your
videos since yesterday.", then the handle, a link to the profile. On the right, the views of the
last 10 videos, oldest first, the one that moved most in the accent, and the ones under 3 days
old tinted and captioned "still climbing". Until the first catch-up the Example line sits right
under the band.

Nothing on the page writes on TikTok, and Cabinet's TikTok cannot: it only reads. Every
button asks the agent in the chat for a plan, a caption or a page in the cabinet.

The first catch-up (no `latest.json` yet) is told as it happens. The agent runs
`node your-tiktok/first-read.mjs start`, `push '<line>'` after each look at TikTok ("**Sourdough
starter in 5 days**: 412,600 views"), `compute @user.json @videos.json` (with
`@videos-2.json` when there is a second page), then `recent @recent.json`, `gift
@gift.json`, `offer @offer-next.json`, `latest @words.json` and `done`. Later catch-ups run
`start --morning`, the same `compute`, `latest` and `done`, with no reading.
The helper writes `reading.json` atomically under a lock, refuses an empty, broken or
repeated line and any large number in it that neither TikTok nor compute gave, and checks every
title, time, count and link. The
page shows the lines one by one under "Reading your account", the newest videos (`recent`:
`{ title, at, views, link }`, up to 5) at once under them as "Your newest videos", and
beside them "While I read, you can...": the gift `{ kind: "best", video, views, posted,
link, at }` (the recent video doing best; "Plan a follow-up" asks the agent for a plan in
the chat), `{ kind: "calm" }` on an account with no videos, or `{ kind: "early" }` on videos
with no views yet or under a day old (both "Give me three ideas"), then
the `offers`: `{ kind: "quiet", video }` or `{ kind: "next" }`. After the reading the gift
and the offers not yet used stay under the page's boxes for 3 days, or until put away. A
reading older than 20 minutes is ignored. Without `reading.json` the reading screen shows
"Opening your account..." until the first line, so with no lines at all it stays on that
until the catch-up is done. Every later catch-up shows "Catching up..." on its button.

`first-read.mjs` and the page keep the same limits, each said on both sides: a link is a
`https://` address on `tiktok.com` (or `www.`, `m.`, `vm.`, `vt.`) under 400 characters; a
title is at most 120 characters; at most 5 newest videos and 2 offers; a day file is
`data/days/<YYYY-MM-DD>.json`, kept for 30 days. Change one, change both.

The page's ideas show pictures of existing template covers, shrunk to about 7KB each and
written into `index.html` itself, until unique ones are made. A page shown to anyone but its
owner on Cloud cannot load a file beside it, so a picture in its own file would stay blank for
them.

If the morning run was missed (the computer was asleep at 9), the page runs it once when it
opens, from the schedule in `../.jobs/morning-tiktok-digest.yaml`.
