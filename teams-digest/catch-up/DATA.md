---
title: How Catch up gets your Teams
---
# How Catch up gets your Teams

The page never talks to Teams. The morning routine reads Teams through Microsoft Graph with
`first-sort.mjs` and writes files here, and the page shows them. The rules for each field are
in the agent's persona (`.agents/teams-reader/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning catch-up, every weekday at 8 | The morning. Schema `teams/catch-up@1`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up team in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | Every routine | `{ at, ok, why }`. `ok: false` means the last run could not read Teams; the page shows `why` with Try again. |
| `data/reading.json` | The first reading only | `{ startedAt, done, lines[], gift }`: the lines the page tells while the agent reads, and one gift (`waiting`, `promise`, `noise` or `calm`). |
| `data/profile.json` | The first reading | What it learned: `name`, `regulars`, `messages`, `mine`, `mentions`, `active {from,to}`, `busiest`. Shown once as "This is you". |
| `data/layout-change.json` | The agent, when asked to change the page | `{ at, for, add[], remove[], note }`: box ids, shown with Apply. |
| `setup.md` | The person, or the agent in a chat | Who matters, what to skip, hours, how replies sound. |

`first-sort.mjs` is the only way a run talks to Teams and writes these files: it saves every
Graph answer, counts every number from them and copies every name, quote, time and link, so
nothing on the page is typed by the agent except its own short words (gists, replies, the
headline), and those may hold no numbers.

`latest.json` in short: `generatedAt`, `since`, `timeZone`, `person { name }`, `headline`,
`totals { messages, chats, channels, mine, mentions, skipped }`,
`pulse { start, stepHours, counts[], you[] }` (the banner's lights), and:

- `waiting[]`: `id`, `who`, `where { kind, name, team }`, `said` (their words), `gist`, `why`
  (`mention`, `direct`, `question`), `at`, `urgent`, `reply`, `more` (their other asks there
  that have no row of their own), `youSaid { id, said, at, due }` (you only answered "I'll…":
  it still waits on you, by your own day), `link`.
- `promises[]`: `id`, `to`, `where`, `said` (your words), `gist`, `at`, `due`, `link`.
- `decided[]`: `id`, `who` (who made or proposed it), `where`, `gist`, `at`, `agreed[]` (who said
  yes to it after), `link`.
- `channels[]`: `id`, `team`, `name`, `count`, `needs` (`you`, `fyi`, `none`), `gist`, `link`.
- `loud[]`: `id`, `name`, `kind`, `count`, `link`: places that moved and never needed you.
- `channelsRefused`: true when the IT admin has not allowed channel messages yet.

`where.kind` is `oneOnOne`, `group`, `meeting` or `channel`. Links are kept only when they
open Teams (`teams.microsoft.com`, `teams.cloud.microsoft`).
