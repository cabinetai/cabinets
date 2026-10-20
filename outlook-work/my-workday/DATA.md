---
title: How My workday gets its mail and calendar
---
# How My workday gets its mail and calendar

The page never talks to Outlook. The morning routine reads Outlook through Microsoft
Graph and writes files here, and the page shows them. The full rules for each field are
in the agent's persona (`.agents/chief-of-staff/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning workday, every weekday at 7 | Today. Schema `outlook/workday@1`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up day in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | Every routine | `{ at, ok, why }`. `ok: false` means the last run could not read Outlook; the page shows `why` with Try again. |
| `setup.md` | The person, or the agent in a chat | Who matters, what to set aside, working hours, how replies sound. |
| `data/reading.json` | The first reading only, through `first-sort.mjs` | `{ startedAt, done, lines[], gift }`: the lines the page tells while the agent reads, and one gift (`waiting`, `prep`, `noise` or `calm`) the person can act on. |
| `data/layout-change.json` | The agent, when asked to change the boxes | `{ at, for, add[], remove[], note }`: offered on the page with Apply and No thanks. |
| `data/profile.json` | The first reading, through `first-sort.mjs` | What it learned: `name`, `signOff`, `regulars`, `workHours`, `mail30`, `meetings7`. Shown once as "This is you". |

`first-sort.mjs` is the only way the first reading talks to Outlook and writes these files:
it saves every Graph answer, counts every number from them and copies every name, so
nothing on the first screen is typed by the agent.

`latest.json` in short: `generatedAt`, `timeZone`, `person { name }`, `headline` (one
sentence), `arrived`, `day { date, startHour, endHour }`, and:

- `events[]`: `id`, `title`, `start`, `end` (ISO with offset), `allDay`, `where`,
  `online`, `joinUrl`, `people[]` (names), `myAnswer` (accepted, tentative,
  notResponded, organizer), `prep` (one sentence from the mail, or ""), `prepMailId`,
  `webLink`.
- `free[]`: `start`, `end`, `replies[]` (ids from `waiting` that fit in it, shortest
  first), only the free time still ahead when the board was written. Left out, the page works out the gaps itself.
- `waiting[]`: `id`, `from`, `company`, `subject`, `gist`, `receivedAt`,
  `waitingSince`, `due` (YYYY-MM-DD, the day they asked for), `urgent` (due today or
  earlier, or before a meeting still ahead today), `minutes` (how long the reply takes),
  `eventId` (a meeting still ahead today it belongs to), `reply` (a reply idea in the person's voice), `webLink`, `kind`
  (`manager`, `leadership`, `team`, `external` or `other`: who they are to the person).
- `promises[]`: `id`, `to`, `what`, `due` (YYYY-MM-DD, when a day was named), `sentAt`,
  `webLink`: what the person wrote they would do, from their sent mail.
- `invites[]`: `id`, `title`, `start`, `from`, `webLink`, invitations not yet answered.
- `fyi[]`: `from`, `gist`, `webLink`, worth knowing, nothing to do.
- `setAside`: `{ count, what }`.

Links are only kept when they open Outlook or Teams on the web
(`outlook.office.com`, `outlook.live.com`, `teams.microsoft.com`).
