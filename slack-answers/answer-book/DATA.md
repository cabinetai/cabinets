---
title: How the Answer Book gets your answers
---
# How the Answer Book gets your answers

The page never talks to Slack. The Answer Keeper reads Slack on a schedule and writes plain
markdown files in this cabinet, and the page shows them. The rules for every field are in
the agent's persona (`.agents/answer-keeper/persona.md`). In Cabinet the page reads these
files through the app bridge, so it works for everyone the cabinet is shared with, and it
repaints when a routine writes.

| File | Written by | What it holds |
|---|---|---|
| `answers/topics/<slug>.md` | Nightly Answer Sweep, every night at 2, and the Answer Keeper when you ask about an answer | One page per question the team settled in Slack. Edited in place, never renamed, never deleted. |
| `answers/<YYYY-MM-DD>T<HH-MM-SS>-sweep.md` | Nightly Answer Sweep | One log per run: what that run changed. Add only. The newest one gives the headline, the Worth pinning mark and the Changed in the last sweep filter. |
| `answers/EXAMPLE-sweep.md`, `answers/topics/EXAMPLE-*.md` | Nobody (they ship with the template) | A made-up team (Northwind) in the same shapes. Shown, marked as an example, until the first sweep that reaches Slack, which deletes them. |
| `answer-book/data/reading.json` | The first sweep only, through `first-read.mjs` | `{ schema, startedAt, done, lines, gift, offers }`: what the agent found, one line at a time, and the things to do now, while the person watches. Schema `slack-answers/reading@1`. |
| `answer-book/data/.work/` | The first sweep, through `first-read.mjs` | The agent's own files for the helper (`gift.json`, `offer.json`). Deleted when the reading is done. |
| `handbook/<slug>.md` | The Answer Keeper, when you press Turn this into a doc page | An answer written up as a doc page, linked from its topic page. The page does not show these; Cabinet's sidebar and search do. |

A topic page in short: frontmatter `title` (the question, on one line), `asked` (a whole
number), `state` (`Settled`, `Shifting` or `Open`), `first` and `confirmed` (`YYYY-MM-DD`),
`channel` (`"#name"`) and `url` (the best thread), then the sections `## Answer`,
`## It used to be` (only when it shifted), `## Also asked as` and `## Sources`. Any other
section, such as `## Notes` or `## Written up in`, is shown as it is.

A sweep log in short: frontmatter `headline`, `lead`, `pin`, `verdict` (the last three only
when one question keeps coming back), `source`, `generated` (`YYYY-MM-DD HH:MM`), `resume`
(only when the run stopped short: where the next run starts) and `status` (`ok`, or what the
run could not finish, shown on the page), then a table `| Topic | Change | URL |` where
`Change` is `New`, `Asked again` or `Updated`. A sweep that found nothing still writes its
log, with an empty table.

The first sweep (no dated log yet) is told as it happens. The agent runs
`node answer-book/first-read.mjs start`, then `push '<line>'` after each look at Slack
("**#eng**: 3 questions answered this week"), `gift @gift.json` once, `offer @offer.json` up
to three times, and `done` after the log is written. The helper writes `reading.json`
atomically under a lock, refuses an empty, broken or repeated line, and checks every
question, channel and link (no raw ids, no em-dash, no direct message). The page shows the
lines one by one under "Reading your Slack", and beside them "While I read, you can...":

- the gift: `{ kind: "repeat", question, asked, channel, link, at }`, the question asked most
  (at least twice), with Turn this into a doc page, or `{ kind: "calm", at }` when nothing
  repeats yet, with Write the welcome page;
- the offers: `{ kind: "open", question, link, at }`, a question nobody answered, with Draft
  an answer, a draft in the chat for the right person to check.

After the reading, what was not used stays under the book for 3 days, or until put away. A
reading older than 20 minutes is ignored.

What the page asks for never changes Slack by itself. Next steps under an answer, Ideas, the
ask box, Ask in chat and Put the top answers in Slack send a question to the Answer Keeper in
the chat beside the page, and anything written to Slack waits for your yes there. Put the top
answers in Slack writes no file: the canvas lives in Slack, and you ask again to refresh it.

The routine's last and next run and the Slack connection come from Cabinet itself. A sweep
the schedule missed runs once when the page opens. Your Layout choices are kept for you
alone, in Cabinet, not in these files.

Hundreds of pages: the page reads topic pages six at a time, newest first, and only the ones
whose time changed. The bridge answers about 20 calls a second, so a first read of 300 takes
about 15 seconds, with the list showing after the first 30. After that the pages are kept in
the owner's browser. Cabinet lists at most 500 entries of one folder, and the page says so
when it reaches that.
