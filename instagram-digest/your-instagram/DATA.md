---
title: How Your Instagram gets its words
---
# How Your Instagram gets its words

The page never talks to Instagram. The morning routine reads the account through Instagram's
Graph API (through the sign-in Cabinet already holds; the run never sees a token), writes
files here, and the page shows them. The full rules for each field are in the agent's persona
(`.agents/account-reader/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning Instagram Digest, every day at 9 | This morning's catch-up. Schema `instagram-digest/your-instagram@1`. |
| `data/days/<YYYY-MM-DD>.json` | The same routine | A copy of each day's catch-up, for the date picker. Kept for 30 days. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up account in the same shape, with every box filled. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | The same routine | `{ at, ok, why }`. `ok: false` means the last run could not read Instagram; the page shows `why` with a Try again button. |
| `data/reading.json` | The first catch-up only, through `first-read.mjs` | `{ schema, startedAt, done, lines, recent, gift, offers }`: what the agent found, one line at a time, while the person watches. Schema `instagram-digest/reading@1`. |
| `data/.work/` | The first catch-up, through `first-read.mjs` | The agent's own files for the helper. Deleted when the reading is done. |
| `data/layout-change.json` | The agent, in a chat | Boxes someone asked to `add` or `remove`, with `at`, `for` and a `note`. Schema `instagram-digest/layout-change@1`. The page offers it with Apply and No thanks; each person's layout stays in Cabinet (`cabinet.mine`), not in a file. |

`latest.json` in short: `generatedAt`, `since`, `account` `{ username, name, followers,
follows, posts, url }`, `readComments` (false when Instagram is connected to read only, so the
comment boxes say how to allow comments instead of "nobody is waiting"), `totals` `{ likes,
comments, views, newPosts, waiting }` (`likes` and `views` are what the recent posts gained
since the last catch-up, left out on the first one), `insights` (below), and one list for each
box:

| List | Box | Each item |
|---|---|---|
| `posts` | How your posts did | `id`, `mediaId`, `kind` (reel, photo, video, carousel), `title` (the caption's start), `published`, `views`, `reach`, `likes`, `comments` (Instagram's count), `viewerComments` (by others), `saves`, `shares`, `gained` `{ views, likes, comments }`, `mark` best, quiet or empty, `gist`, `url` |
| `waiting` | Waiting for an answer | `id`, `who` (`@username`), `post`, `mediaId`, `commentId`, `gist`, `short`, `since`, `likes`, `url` |
| `recent` | Latest comments | `id`, `who`, `post`, `gist`, `at`, `url` |
| `asks` | What people keep asking | `id`, `what`, `people` (different authors), `posts` (titles), `answered`, `url` |
| `next` | Ideas for your next posts | `id`, `title`, `format`, `why`, `from` (the `asks` id behind it) |

`insights` holds Instagram's numbers, up to two days late: `{ ok: true, until, last7, last28,
daily, online, countries }`. `until` is the last day Instagram has a number for; `last7` and
`last28` are each `{ from, views, reach, engaged, interactions, likes, comments, saves,
shares, linkTaps, newFollowers }`; `daily` is `{ day, reach }` for each day; `online` is
`{ hour, followers }` (the hour in the person's own time) and `countries` the top 5
`{ code, followers }`. A number Instagram has not sent, or no longer offers, is `null`, and
the page says "Not there yet" in its place, never a 0. The routine asks for the numbers in
small groups, so one Instagram turns down never costs the others. Under 100 followers
Instagram sends no follower numbers at all (`newFollowers`, `online`, `countries`), and the
page says why. Without the numbers it is
`{ ok: false, why: "not-allowed" }` or `why: "unavailable"`, and the Account numbers box shows
the public counts from `account` and `posts` with one quiet line on what is missing.

`me` (the account's id and username) and `known` (each post's counts at the last catch-up, so
the next one can tell what changed) are for the routine; the page ignores them. A `url` on
Instagram's own address (`https://www.instagram.com/p/...` or `/reel/...`) becomes an "Open on
Instagram" link. Instagram has no link to one comment, so a comment opens its post.

The page is a 12-column grid of boxes on a light grey, laid out like the Gmail front desk:
Headline, Waiting for an answer, Latest comments, Account numbers, How your posts did, What
people keep asking, Ideas for your next posts, Ask about your Instagram and Ideas for your
Instagram to start with, and more to add (four numbers, People reached only with Instagram's
numbers, and each idea as its own box with its picture from `ideas/`). The headline is a band
in Instagram's purple to pink to orange, with the connection, Catch up now, Ideas and Layout
in it; without the headline they move to a slim bar on top. Each person moves, resizes, adds
and removes boxes (mouse, finger or keyboard, with Undo), or asks the agent through Layout,
which answers with `layout-change.json`. An idea offers itself at the foot of its box when the
day's account says it would help.

The page writes its own headline from `account`, `totals`, `posts` and `waiting`: the
account's name, then "1,846 likes and 64 comments from others since yesterday. 5 questions are
waiting for your answer.", or "A quiet day: nothing new on your posts since the last
catch-up.", and a line of followers, posts and the handle. With Instagram's numbers, the
people reached on each of the 28 days stand on its right, the last seven solid.

Nothing on the page writes on Instagram. Every button asks the agent in the chat for a
summary, a plan or a draft to copy. The agent replies to a comment, or hides one, only when
the person asks for it in the chat, with Instagram connected to Allow comments, after showing
the exact words and getting a yes.

The first catch-up (no `latest.json` yet) is told as it happens. The agent runs
`node your-instagram/first-read.mjs start`, then `push '<line>'` after each look at Instagram
("**23 new comments** since yesterday, 5 of them questions"), `recent @recent.json` very
early, `gift @gift.json` once, `offer @offer.json` up to twice, `latest @latest.json` and
`done`. The helper writes `reading.json` atomically under a lock, refuses an empty, broken or
repeated line, and checks every name, post, time and link (no raw ids, no em-dash). The page
shows the lines one by one under "Reading your account", the newest comments at once under
them as "Just now on your account", and beside them "While I read, you can...": the gift
`{ kind: "waiting", who, post, mediaId, commentId, since, gist, link, at }` ("Draft my reply"
asks the agent for a draft in the chat, never posted) or `{ kind: "calm" }` ("Give me three
ideas"), then the `offers`: `{ kind: "asked", what, people }` or `{ kind: "next" }`. After the
reading, the gift and the offers not yet used wait under the page's boxes for 3 days, or until
put away; an offer of ideas steps aside once the Ideas for your next posts box shows the day's
ideas. A reading older than 20 minutes is ignored, and without `reading.json` the page shows
its plain "Catching up" card, as every later catch-up does.

`first-read.mjs` and the page keep the same limits, each said on both sides: who is at most 80
characters, a post's name at most 120, a gist at most 140 (120 for one of the newest
comments) and an offer's question at most 100; at most 5 newest comments and 2 offers; a day
file is `data/days/<YYYY-MM-DD>.json`, kept for 30 days. The helper takes only a post's link
(`https://www.instagram.com/p/...`, `/reel/...` or `/tv/...`); the page opens those and the
profile's, under 400 characters. Change one, change both.

The page's ideas show pictures from `ideas/`, the same shrunk template covers YouTube Digest
uses, until unique ones are made.

If the morning run was missed (the computer was asleep at 9), the page runs it once when it
opens, from the schedule in `../.jobs/morning-instagram-digest.yaml`.
