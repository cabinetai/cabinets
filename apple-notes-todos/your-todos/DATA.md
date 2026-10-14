---
title: How Your To-Dos gets its words
---
# How Your To-Dos gets its words

The page never reads Apple Notes. The routine reads the notes Cabinet copied in and writes
files here, and the page shows them. The full rules for each field are in the agent's
persona (`.agents/todo-finder/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Gather My To-Dos, Mondays at 9 | The to-dos. Schema `apple-notes-todos/your-todos@1`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | Made-up notes in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | The same routine | `{ at, ok, why }`. `ok: false` means the last run could not finish; the page shows `why`. |
| `data/reading.json` | The first look only, through `first-read.mjs` | `{ schema, startedAt, done, lines, gift }`. The page tells the lines while the agent reads. |

`latest.json` in short: `generatedAt`, `newestNote` (the latest edit in the copy, so the
page can say how fresh the copy is), `totals` `{ notes, withTodos, items }`, and `notes`
(`title`, `folder`, `edited`, and `items` with `text`, `due` and `promise`). The page
builds "Coming up" from every item with a `due` date.

## The first look

The first time the routine runs (there is no `latest.json` yet), the person is usually
watching the page: it starts right after they bring their notes in, or by itself when they
open the page with Apple Notes already brought in and only the example on it. The agent
never writes these files by hand. It runs `node your-todos/first-read.mjs`:

- `start` writes `reading.json` (`done: false`, no lines) and makes `data/.work/`.
- `push '<line>'` adds one line, right after a note is read: "**Flat move**: 4 to-dos, 1
  you promised Dana". `**bold**` marks the finding. It refuses an empty line, a broken one
  ("undefined"), a line that only says 0, and a line already there.
- `gift @gift.json` adds the one thing the person can do now: `plan` (up to three to-dos
  due soonest, with `text`, `due` and `note`), `promise` (`text`, `note`) or `calm`. The
  helper checks each `text` is written in the note it names, and adds the note's title.
  The page shows it as a button that asks the agent in the chat ("Make me a plan for
  today"); it never changes a note.
- `latest @latest.json` writes `latest.json` (and `status.json`) from the agent's file in
  `data/.work/`, setting `schema`, `example: false` and `generatedAt`.
- `done` marks the reading done and deletes `data/.work/`.

The page reads `reading.json` every few seconds while the routine runs, and shows its lines
one by one under "Reading your notes", with the gift beside them. A reading older than 20
minutes is ignored. After the first look the gift stays on top of the page for three days,
until it is used or put away. When `reading.json` is missing, the page is as it always was.
