---
title: How Your Instagram gets its words
---
# How Your Instagram gets its words

The page never talks to Instagram. The morning routine saves Instagram's answers (with curl,
through the address Cabinet gives each run, never a token), `first-read.mjs compute` counts every
number, the agent adds only its words, and `first-read.mjs latest` checks all of it and writes the
files here. The agent's rules are in `.agents/account-reader/persona.md`.

Instagram gives apps the profile's counts, each post's counts and numbers (views, reach, saves,
shares), account numbers for up to 30 days at a time, and with the comments level the comments.
It gives no followers per day, no hours when followers are online, and nothing from other accounts.
So the page draws followers from the routine's own reads (`history`) and says so.

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning Instagram Digest, every day at 9 | This morning's catch-up. Schema `instagram-digest/your-instagram@1`. |
| `data/days/<YYYY-MM-DD>.json` | The same routine | A copy of each day's catch-up, for the date picker. Kept for 30 days. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up account in the same shape, shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | `first-read.mjs` | `{ at, ok, kind, why }`. `ok: false` means the last run could not read Instagram, and `latest.json` stays as it was. `kind` is `signed-out`, `personal`, `not-connected`, `rate-limited`, `unreachable` or `other`; only `signed-out` and `personal` offer Connect Instagram again. A partial run is `ok: true` with a `why`. |
| `data/reading.json` | The first catch-up only | `{ schema, startedAt, done, lines, recent, gift, offers }`, told while the person watches. Schema `instagram-digest/reading@1`. |
| `data/.work/` | Every catch-up | Instagram's answers under fixed names (`me.json`, `media.json`, `media-2.json`, `post-<id>.json`, `comments-<id>.json`, `acc-*.json`), `computed.json` and the agent's `words.json`. Deleted by `done`. |
| `setup.md` | The person, or the agent when told in a chat | What they post, their goal, how they sound, what to avoid. |
| `data/layout-change.json` | The agent, in a chat | Boxes to `add` or `remove`, with `at`, `for` and a `note`. Schema `instagram-digest/layout-change@1`. The page offers it with Apply and No thanks; each layout stays in `cabinet.mine`. |
| `../imports/<YYYY-MM-DD>-<list>.md` | The agent, in a chat | One page per list read from Instagram's copy of the person's data. The page never reads them. |

`latest.json` in short: `generatedAt`, `since` (the read it is compared with), `timeZone`,
`account` `{ name, username, userId, followers, following, posts, url }`, `readComments` (false at
the read level), `commentsMissed` (posts whose comments failed this run, so "nobody is waiting" is
not claimed), `totals` `{ newPosts, comments, waiting, views, likes, saves, shares, followers }`
(the gains are left out of a first catch-up, `followers` can be below 0), and:

| Part | Box | What it holds |
|---|---|---|
| `waiting` | Waiting for your answer | `id`, `who`, `post`, `mediaId`, `commentId` (always the top-level comment, where a reply goes), `gist`, `short`, `since`, `likes`, `url`. A thread that failed to read keeps yesterday's items. |
| `posts` | How your posts did, Headline | The 10 newest, then the best or quiet post with `older: true`: `id`, `mediaId`, `kind`, `title` (`""` without a caption; the page names it by its day), `published`, `views`, `reach`, `likes`, `comments`, `viewerComments`, `saves`, `shares`, `gained`, `mark`, `firstDay` `{ views, usual, pace }`, `gist`, `url`. A number Instagram did not send is `null`. |
| `next` | Ideas for your next posts | `id`, `title`, `why`, `format`, `from` (a post or an ask, shown as "From: ...") |
| `history` | Your account | `{ day, followers, following, posts, viewsGained }` for each morning read, at most 30 |
| `insights` | Your account | `{ ok: true, until, last7, last28, daily, countries }`, each span `{ from, views, reach, engaged, interactions, likes, comments, saves, shares, linkTaps, follows, unfollows }`, `daily` `{ day, reach }`; or `{ ok: false, why }` |
| `spans` | Your account | `last7`, `last28`: `{ from, posts, views, likes, comments, saves, shares, top }` for posts from those days, `top` the four most saved and shared, `partial: true` when the reads stopped short |
| `works` | What works for you | Over up to 40 posts at least 3 days old: `posts`, `measure` (`kept`, or `likes` without Instagram's numbers), `usual`, and `format`, `weekday`, `hour`, each `{ label, posts, median }`, groups of 3 or more only |
| `asks` | What people keep asking | `id`, `what`, `people`, `posts`, `answered`, `url` |
| `recent` | Latest comments | `id`, `who`, `post`, `text`, `at`, `url`: others' newest, at most 10 |

`known` is for the routine: each post read with its counts, `own` (the account's own comments),
`at` and `day1`, at most 400. An older post keeps these numbers, so a run spends calls only on the
newest posts and those with none yet.

How compute counts, so the page's words stay true:

- `gained`: a post in the baseline's `known` always subtracts. Only one missing from it and posted
  since that read counts whole.
- The baseline is the last catch-up. When that was today it is the last day file before today, so
  a second press counts nothing twice. Another account has no baseline; a new username on the same
  account keeps it.
- `best`: the most views gained, or likes without views. On a first catch-up, the most per day
  since posting, never a post under a day old.
- `quiet`: the smallest reach among posts 7 to 60 days old, only when under half their middle.
- A comment is `answered` when the account replied in its thread after it. Hidden comments are left
  out. Captions and comments are cleaned, never refused.

The page is a 12-column grid of white sheets on Instagram's pale background, in the system font
Instagram's web uses. Under the band, Waiting, ideas and posts stand on the left, Your account,
asks and comments on the right, then What works for you, Ask and Keep. On a phone: band, Waiting,
Your account, then the rest. With no posts the account takes the row, and boxes with nothing to
show stay off the page. Each person moves, resizes, adds and removes boxes, or asks through Layout.

The band is Instagram's gradient with its stops darkened so white stays over 5:1 at every point.
Its one strong button is white; everywhere else blue, `#0074CC` (4.81:1 with white), is the action
colour. One strong button shows at a time: Connect or Catch up now, then the day's own: "Draft my
5 replies", "Plan a follow-up to <post>", "Plan my next post" or "Plan my first post".

Before Instagram is connected the band holds Connect Instagram, one line and See the steps, which
opens the side panel. Sign-in comes back by itself. A personal account is refused by Cabinet's own
window; if one reaches a run, `compute` stops with `kind: personal`. The pictures are drawn by the
page's script, so they show on Cloud too, as are the ideas' pictures, written into `index.html`.

The first catch-up (no `latest.json`) is told as it happens: lines from `push`, the newest comments
from `recent`, then the `gift` and `offers`. After it they wait under the boxes for 3 days. A
reading older than 20 minutes is ignored. Later catch-ups show "Catching up..." on the button.

`first-read.mjs` and the page keep the same limits: who 80 characters, a post's name 120, a gist
140, an offer 100; at most 5 newest comments and 2 offers; day files kept 30 days. Change one,
change both.

If the morning run was missed, the page runs it once when it opens, from the schedule in
`../.jobs/morning-instagram-digest.yaml`.
