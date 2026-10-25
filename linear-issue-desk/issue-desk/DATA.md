---
title: How the desk gets its issues
---
# How the desk gets its issues

The desk never talks to Linear. Cabinet keeps a view-only copy of your Linear workspace (a
folder of pages, one per issue, project and cycle). Each morning the Issue Keeper reads that
copy and writes the files here, and the page shows them. The full rules for every field are
in the agent's persona (`.agents/issue-keeper/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning stand-up, weekdays at 08:30, and Update now | This morning's desk. Schema `linear-issue-desk/desk@1`. |
| `data/status.json` | Every run | `{ at, ok, why }`. `ok: false` means the run could not read the copy; the page shows `why` with a Try again button. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up team, Northwind, in the same shape. Shown, marked as an example, until `latest.json` exists. Deleted on the first real run. |
| `data/EXAMPLE-latest.he.json` | Nobody (it ships with the template) | The same made-up team in Hebrew, shown when Cabinet is in Hebrew. Deleted with the English one. |

`latest.json` in short: `generatedAt`, `workspace`, `workspaceUrl`, `you`, `headline`,
`standup` (the path of this morning's stand-up), `counts` `{ mine, due, triage, cycleDone,
cycleTotal }`, `cycles` (`team`, `teamName`, `name`, `url`, `startsAt`, `endsAt`, `done`,
`total`; empty when no current cycles are available), the lists `mine`, `due`, `triage` and `recent`, and
`projects` (`name`, `url`, `health` onTrack, atRisk, offTrack or null, `progress` 0 to 1,
`lead`, `targetDate`, `openIssues`, `update`). Every issue has `identifier`, `title`, `url`,
`team`, `state` (the team's own name), `stateType` (triage, backlog, unstarted, started,
completed, canceled), `priority` (0 No priority, 1 Urgent, 2 High, 3 Medium, 4 Low), and
when known `assignee`, `due`, `updatedAt` or `createdAt`, `stuck` (what it waits on) and,
in `recent`, `change`. `states` maps each identifier to its state, so the next run can tell
what moved. `dueDates` maps each identifier to its due date or null, so date changes do
not get confused with older comments. Repeated runs keep changes already found today.

The readable stand-ups go to `standup/` beside this folder, one per weekday:
`standup/<YYYY-MM-DD>.md`, with Yesterday, Due and Stuck.
