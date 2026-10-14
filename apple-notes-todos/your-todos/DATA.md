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

`latest.json` in short: `generatedAt`, `newestNote` (the latest edit in the copy, so the
page can say how fresh the copy is), `totals` `{ notes, withTodos, items }`, and `notes`
(`title`, `folder`, `edited`, and `items` with `text`, `due` and `promise`). The page
builds "Coming up" from every item with a `due` date.
