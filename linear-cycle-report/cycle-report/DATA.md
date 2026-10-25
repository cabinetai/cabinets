---
title: How the report gets its numbers
---
# How the report gets its numbers

The report never talks to Linear. Cabinet keeps a view-only copy of your Linear workspace (a
folder of pages, one per issue, project and cycle). Every Friday the Delivery Analyst reads
that copy and writes the files here, and the page shows them. The full rules for every field
are in the agent's persona (`.agents/delivery-analyst/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Cycle report, Fridays at 16:00, and Update now | This week's report. Schema `linear-cycle-report/report@1`. |
| `data/status.json` | Every run | `{ at, ok, why }`. `ok: false` means the run could not read the copy; the page shows `why` with a Try again button. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up company, Northwind, in the same shape. Shown, marked as an example, until `latest.json` exists. Deleted on the first real run. |
| `data/EXAMPLE-latest.he.json` | Nobody (it ships with the template) | The same made-up company in Hebrew, shown when Cabinet is in Hebrew. Deleted with the English one. |

`latest.json` in short: `generatedAt`, `workspace`, `workspaceUrl`, `headline`, `summary`,
`report` and `retro` (paths of this week's page and the newest retro draft), `counts`
`{ done, total, scopeAdded, atRisk, projectsAtRisk }`, `cycles` and `projects`. Each cycle
has `team`, `teamName`, `name`, `url`, `startsAt`, `endsAt`, `done`, `total`,
`scopeAtStart`, `scopeAdded`, an optional `baselineFrom` and `note`, and `atRisk`: issues
(`identifier`, `title`, `url`, `state`, `stateType`, `priority` 0 to 4, `assignee`, `due`)
each with `why`. Each project has `name`, `url`, `health` (onTrack, atRisk, offTrack or
null), `progress` 0 to 1, `lead`, `targetDate`, `openIssues`, and its latest `update`,
`updateBy` and `updateAt`. `baseline` keeps each cycle's starting scope from one Friday to
the next, because the copy holds a cycle's total today and not its history.

The readable pages go to `reports/` beside this folder: `reports/<YYYY-MM-DD> cycle.md` every
Friday, and `reports/<last day> retro draft.md` once for each cycle that ended.
