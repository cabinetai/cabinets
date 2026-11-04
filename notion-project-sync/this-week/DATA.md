---
title: How This week gets your Notion
---
# How This week gets your Notion

The page never reads Notion itself. The morning routine runs `read-notion.mjs` over the
Notion copy Cabinet keeps, and the page shows the files it writes here.

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | `read-notion.mjs`, every morning run | The week. Schema `notion/this-week@1`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up team in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | `read-notion.mjs`, or the routine when Notion is not connected | `{ at, ok, why }`. `ok: false` means the last run could not read Notion; the page shows `why`. |

`read-notion.mjs <Notion folder> [...]` reads every `<Database>.csv` under the folders. The
columns differ per database, so it finds them by name, case aside: the title is Name, Title,
Task or the first column; status is Status, State or Stage; the owner is Assignee, Owner,
Person or Assigned to; the date is Due, Due date, Deadline or Date; a checkbox named Done or
Complete marks a task done. A database with no status and no done column is listed but not
counted. A task is done when its status is Done, Complete, Completed, Shipped, Closed or
Archived.

`latest.json` in short: `generatedAt`, `today`, `folders[]`,
`totals { tasks, open, overdue, dueWeek, done }`,
`overdue[] { title, database, owner, status, due, late }` (oldest first),
`dueWeek[]` (the same fields without `late`, today through six days ahead, soonest first),
`byStatus[] { status, count, done }`, `byOwner[] { owner, open, overdue }` and
`databases[] { name, rows, hasStatus, hasDue }`.
