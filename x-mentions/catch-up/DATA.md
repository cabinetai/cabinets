---
title: How Catch up gets your X
---
# How Catch up gets your X

The page never talks to X. The morning routine reads X with `first-sort.mjs`, using the key
of the person's own X app that Cabinet gives the run (`X_ACCESS_TOKEN`, `X_USER_ID`,
`X_USERNAME`), writes files here, and the page shows them. The rules for each field are in
the agent's persona (`.agents/x-reader/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning X Digest, every day at 9 | The morning. Schema `x/digest@1`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up account in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | Every routine | `{ at, ok, why }`. `ok: false` means the last run could not read X; the page shows `why` with Try again. |
| `data/reading.json` | The first reading only | `{ startedAt, done, lines[], gift }`: the lines the page tells while the agent reads, and one gift (`waiting` or `calm`). |
| `data/profile.json` | The first reading | What it learned: `at`, `name`, `username`, `days`, `mentions`, `people`, `answered`, `posts`, `regulars[] {name, username, count}`, `busiest {text, replies, likes, link}`, `active {from, to}` (hours). Shown once as "This is you". |
| `data/layout-change.json` | The agent, in a chat | Boxes someone asked to `add` or `remove`, with `at`, `for` and a `note`. Schema `x/layout-change@1`. The page offers it with Apply and No thanks; each person's layout itself stays in Cabinet, not in a file. |
| `data/.work/` | The routine | Its own scratch files and `x.json`, what X sent this run. Never shown. |
| `setup.md` | The person, or the agent in a chat | Who matters, what to skip, how replies sound. |

Each run makes two X calls: the person's mentions since the last morning (at most fifty, the
first reading the last seven days) and their own posts in that time, to see which mentions
they already answered. X charges the person's app for each post and account it returns.

`latest.json` in short: `schema`, `generatedAt`, `since`, `timeZone`, `person { name,
username }`, `headline`, `totals { mentions, people, waiting, answered, replies, quotes,
skipped, more }`, `pulse { start, stepHours, counts[], you[] }` (the banner's dots),
`cost { posts, users, usd }` (what this reading cost, at X's prices), and:

- `waiting[]`: `id` (the ref), `postId`, `who { name, username, verified, pic }`, `kind`
  (`reply`, `quote`, `mention`), `said` (their words, exactly as X sent them), `at`,
  `metrics { replies, reposts, likes, views }`, `about { text, at, link }` (the person's own
  post it answers or quotes), `gist`, `urgent`, `reply` (a draft in the person's voice, at
  most 280 characters, `[brackets]` for what they must fill in), `link`.

- `quoted[]`: quotes of the person's posts, newest first, at most six: `id`, `postId`, `who`,
  `said`, `at`, `answered`, `metrics`, `about`, `gist` (the agent's line), `link`.
- `posts[]`: the person's own posts in the window, not replies, newest first, at most five:
  `postId`, `text`, `at`, `metrics { replies, reposts, likes, quotes }`, `open` (mentions in
  that thread still unanswered), `link`.
- `regulars[]`: who wrote most, bots and "gm" left out, at most five: `name`, `username`,
  `verified`, `pic`, `count`, `open`, `last`.
- `skip { count, bots, short, other, examples[] {name, username, said, link} }`: the
  unanswered mentions left off Waiting on you, by why they can wait.

Which boxes show, where and how big, is each person's own choice (Layout: add or remove
boxes by hand, or ask the agent), saved with `cabinet.mine` under `x-digest-layout@1` on a
12 column grid.

Links are kept only when they open X (`https://x.com/...`), and pictures only from X's own
image host. **Reply on X** opens `https://x.com/intent/post?in_reply_to=<postId>&text=<reply>`,
so X shows the reply ready and the person presses Post. Nothing is ever posted by Cabinet.
