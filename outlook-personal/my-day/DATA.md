---
title: How My day gets its mail and calendar
---
# How My day gets its mail and calendar

The page never talks to Outlook. The morning routine reads Outlook through Microsoft
Graph and writes files here, and the page shows them. The full rules for each field are
in the agent's persona (`.agents/home-keeper/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning, my day, every day at 7 | Today. Schema `outlook/my-day@1`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up day in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | Every routine | `{ at, ok, why }`. `ok: false` means the last run could not read Outlook; the page shows `why` with Try again. |
| `setup.md` | The person, or the agent in a chat | Family, who matters, what to set aside, bills, how replies sound. |
| `data/reading.json` | The first reading only, through `first-sort.mjs` | `{ startedAt, done, lines[], gift }`: the lines the page tells while the agent reads, and one gift (`waiting`, `prep`, `noise` or `calm`) the person can act on. |
| `data/layout-change.json` | The agent, when asked to change the boxes | `{ at, for, add[], remove[], note }`: offered on the page with Apply and No thanks. |
| `data/profile.json` | The first reading, through `first-sort.mjs` | What it learned: `name`, `signOff`, `regulars`, `mail30`, `meetings7`. Shown once as "This is you". |

`first-sort.mjs` is the only way the first reading talks to Outlook and writes these files:
it saves every Graph answer, counts every number from them, copies every name, and refuses
a bill amount the email does not hold, so nothing on the first screen is typed by the agent.

`latest.json` in short: `generatedAt`, `timeZone`, `person { name }`, `headline` (one
sentence), `arrived`, `day { date, startHour, endHour }`, and:

- `events[]`: today's plans. `id`, `title`, `start`, `end` (ISO with offset), `allDay`,
  `where`, `people[]`, `prep` (what to bring or know, from the mail, or ""), `prepMailId`,
  `webLink`.
- `waiting[]`: `id`, `kind` (`family`, `friend`, `school`, `service` or `other`), `from`,
  `subject`, `gist`, `receivedAt`, `waitingSince`, `urgent`, `minutes`, `reply` (in the
  person's voice, `[brackets]` for what they decide), `webLink`.
- `bills[]`: `id`, `from`, `what`, `amount` (as the email writes it), `due` (YYYY-MM-DD),
  `status` (`due`, `failed`, `renews` or `paid`), `webLink`.
- `deliveries[]`: `id`, `from`, `what`, `eta` (YYYY-MM-DD), `status` (`ordered`, `shipped`,
  `out-for-delivery`, `delayed` or `delivered`), `webLink`.
- `coming[]`: the next 7 days. `id`, `title`, `start` (ISO, or YYYY-MM-DD for a whole
  day), `allDay`, `where`, `kind` (`event` or `birthday`).
- `fyi[]`: `from`, `gist`, `webLink`, worth knowing, nothing to do.
- `setAside`: `{ count, what }`.

Links are only kept when they open Outlook on the web (`outlook.office.com`,
`outlook.office365.com`, `outlook.live.com`).
