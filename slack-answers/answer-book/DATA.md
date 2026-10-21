---
title: How the Answer Book gets its words
---
# How the Answer Book gets its words

The page never talks to Slack. The nightly sweep reads Slack and writes files, and the page
shows them. The full rules for each field are in the agent's persona
(`.agents/answer-keeper/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `../answers/<YYYY-MM-DD>T<HH-MM-SS>-answers.md` | Nightly Answer Sweep, every day at 02:00 | The whole book: frontmatter and one table. The newest file is the one shown. |
| `../answers/EXAMPLE-answers.md` | Nobody (it ships with the template) | A made-up team in the same shape. Shown, marked as an example, until the first sweep. |
| `data/reading.json` | The first sweep only, through `first-read.mjs` | `{ schema, startedAt, done, lines, gift, offers }`: what the agent found, one line at a time, and the things to make now, while the person watches. Schema `slack-answers/reading@1`. |
| `data/.work/` | The first sweep, through `first-read.mjs` | The agent's own files for the helper (`gift.json`, `offer.json`). Deleted when the reading is done. |

The first sweep (no dated file in `answers/` yet) is told as it happens. The agent runs
`node answer-book/first-read.mjs start`, then `push '<line>'` after each look at Slack
("**#eng**: 3 questions answered since yesterday, 1 asked before"), `gift @gift.json` once,
`offer @offer.json` at most once, and `done` after the dated file is written. The helper writes
`reading.json` atomically under a lock, refuses an empty, broken or repeated line, and checks
every question, channel and link (no raw ids, no em-dash, no direct message).

The page shows the lines one by one under "Reading your Slack", in place of the example, and
beside them "While I read, you can...":
- the gift: `{ kind: "repeat", question, asked, channel, link, at }`, the question asked most
  (at least twice), with "Write the answer page" (the agent writes a page in this cabinet), or
  `{ kind: "calm", at }` when nothing repeats yet, with "Write the welcome page";
- the offer: `{ kind: "open", question, link, at }`, a question asked and never really
  answered, with "Draft it" (a draft in the chat for the right person to check).

Each press asks the Answer Keeper in the chat beside the page. Nothing is posted in Slack.
After the reading the gift and the offer not yet used stay under the book for 3 days, or until
put away ("Not now"); this browser remembers which. A reading older than 20 minutes is ignored,
and without `reading.json` the page is as it always was.
