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

`latest.json` in short: `generatedAt`, `newestNote` (the latest edit in the copy),
`totals` `{ notes, topics, sorted }`, `topics` (`title`, `page`, `notes`, `gist`,
`lastEdited`), and `tidy` with `same` (pairs `a` and `b`) and `empty` notes.
