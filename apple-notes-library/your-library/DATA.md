---
title: How Your Library gets its words
---
# How Your Library gets its words

The page never reads Apple Notes. The routine reads the notes Cabinet copied in, writes a
page per topic into `topics/`, and writes files here that the page shows. The full rules
are in the agent's persona (`.agents/notes-librarian/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Build The Library, Mondays at 10 | The topics and the tidy-up list. Schema `apple-notes-library/your-library@1`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up library in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | The same routine | `{ at, ok, why }`. `ok: false` means the last build could not finish; the page shows `why`. |
| `data/reading.json` | The first build only, through `first-read.mjs` | `{ schema, startedAt, done, lines, gift, offers }`. The page tells the lines while the agent reads. |

`latest.json` in short: `generatedAt`, `newestNote` (the latest edit in the copy),
`totals` `{ notes, topics, sorted }`, `topics` (`title`, `page`, `notes`, `gist`,
`lastEdited`), and `tidy` with `same` (pairs `a` and `b`) and `empty` notes.

## The page is a grid of boxes

The library works like the digests: a grid of 12 columns, and each box is moved, resized,
added and removed by mouse, finger or keyboard, with Undo. Each person's layout is kept for
them in Cabinet (`cabinet.mine`, key `apple-notes-library-layout@1`), so it follows them.
**Layout** turns on editing (Add a box, Undo, Reset to default, Done). **Ideas** shows every
idea with its picture: ask now, switch it on as a routine (shown in the chat to approve
first), or add it as a box. Every idea only reads: the answer comes in the chat, and no note
changes.

The boxes, by id:

| Id | Box | From `latest.json` |
|---|---|---|
| `n-notes`, `n-topics`, `n-sorted` | The numbers: notes looked through, topics, notes sorted into topics (on the page at first) | `totals`, `topics` |
| `topics` | Topics: cards on a large box, rows on a medium one, each one tap from a question (on the page at first) | `topics` |
| `tidy` | Worth tidying in Apple Notes (on the page at first; it shows only when there is something to tidy) | `tidy` |
| `ask` | Ask about your notes (on the page at first) | nothing |
| `ideas` | All ideas (on the page at first) | nothing |
| `idea-again`, `idea-week`, `idea-people`, `idea-lists`, `idea-decisions` | One idea each | nothing |

The ideas: Notes worth reading again, Your week in notes, Who you write about, Every list you
keep, What you decided. Their pictures are small SVGs drawn in `index.html` itself, so they
show on Cloud too. While the first build reads, the reading takes the place of the grid, and
the gift and the offers kept afterwards sit above it.

## The first build

The first time the routine runs (there is no `latest.json` yet), the person is usually
watching the page: it starts right after they bring their notes in, or by itself when they
open the page with Apple Notes already brought in and only the example on it. The agent
never writes these files by hand. It runs `node your-library/first-read.mjs`:

- `start` writes `reading.json` (`done: false`, no lines) and makes `data/.work/`.
- `push '<line>'` adds one line: "**Flat move**: 31 notes, from the boxes to the deposit".
  `**bold**` marks the finding. It refuses an empty line, a broken one ("undefined"), a
  line that only says 0, a long dash, and a line already there. `push @line.txt` reads
  the line from `data/.work/line.txt`, for a line with an apostrophe.
- `gift @gift.json` adds the one thing the person can do now: `old` (notes nobody touched
  in a year, at least 10), `meetings` (two to five meeting notes), `folders` (the three
  biggest) or `calm`. The helper counts the notes and folders in the copy itself and adds
  the meeting notes' titles.
- `offer @offer.json` adds up to two more, in the same shapes, never `calm` and never the
  gift's kind.
- `latest @latest.json` writes `latest.json` (and `status.json`) from the agent's file in
  `data/.work/`, setting `schema`, `example: false` and `generatedAt`.
- `done` marks the reading done and deletes `data/.work/`.

The page shows the reading from the moment the first build starts ("Opening your notes"),
reads `reading.json` every few seconds while the routine runs, and shows its lines one by
one under "Reading your notes", with the gift and the offers beside them under "While I
read, you can...". Each is a button that asks the agent in the chat; none changes a note.
A reading older than 35 minutes is ignored (the routine stops a build at 30). After the
first build the gift and the offers stay on top of the page for three days, until used or
put away with "Not now". A later build is shown the way it always was, and so is a first
build whose `reading.json` never comes: it says "Opening your notes" until the build ends.
