---
title: How My day gets its mail and calendar
---
# How My day gets its mail and calendar

The page never talks to Outlook. The morning routine reads Outlook through Microsoft
Graph and writes files here, and the page shows them. The full rules for each field are
in the agent's persona (`.agents/day-keeper/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning day, every weekday at 7 | Today. Schema `outlook/my-day@1`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up day in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | Every routine | `{ at, ok, why }`. `ok: false` means the last run could not read Outlook; the page shows `why` with Try again. |
| `setup.md` | The person, or the agent in a chat | Who matters, what to set aside, working hours, how replies sound. |

`latest.json` in short: `generatedAt`, `timeZone`, `person { name }`, `headline` (one
sentence), `arrived`, `day { date, startHour, endHour }`, and:

- `events[]`: `id`, `title`, `start`, `end` (ISO with offset), `allDay`, `where`,
  `online`, `joinUrl`, `people[]` (names), `myAnswer` (accepted, tentative,
  notResponded, organizer), `prep` (one sentence from the mail, or ""), `prepMailId`,
  `webLink`.
- `free[]`: `start`, `end`, `replies[]` (ids from `waiting` that fit in it, shortest
  first). Left out, the page works out the gaps itself.
- `waiting[]`: `id`, `from`, `company`, `subject`, `gist`, `receivedAt`,
  `waitingSince`, `urgent`, `minutes` (how long the reply takes), `eventId` (a meeting
  it belongs to), `reply` (a reply idea in the person's voice), `webLink`.
- `invites[]`: `id`, `title`, `start`, `from`, `webLink`, invitations not yet answered.
- `fyi[]`: `from`, `gist`, `webLink`, worth knowing, nothing to do.
- `setAside`: `{ count, what }`.

Links are only kept when they open Outlook or Teams on the web
(`outlook.office.com`, `outlook.live.com`, `teams.microsoft.com`).
