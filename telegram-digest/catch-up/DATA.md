---
title: How Catch up gets your Telegram
---
# How Catch up gets your Telegram

The page never talks to Telegram. Cabinet keeps every message the person's bot receives in a
log on this computer (found through `CABINET_TELEGRAM_MESSAGES`). The morning routine reads
that log with `first-sort.mjs` and writes files here, and the page shows them. The rules for each field are in the
agent's persona (`.agents/chat-reader/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning Telegram Digest, every day at 9 | The morning. Schema `telegram/digest@1`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up Telegram in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | Every routine | `{ at, ok, why }`. `ok: false` means the last run could not read Telegram; the page shows `why` with Try again. |
| `data/reading.json` | The first reading only | `{ startedAt, done, lines[], gift }`: the lines the page tells while the agent reads, and one gift (`waiting`, `promise`, `noise` or `calm`). |
| `data/profile.json` | The first reading | What it learned: `at`, `name`, `regulars`, `days`, `messages`, `mine`, `mentions`, `active {from,to}`, `busiest {name,count}`. Shown once as "This is you". |
| `data/layout-change.json` | The agent, when asked to change the page | `{ at, for, add[], remove[], note }`: box ids, shown with Apply. |
| `setup.md` | The person, or the agent in a chat | Who matters, what to skip, how replies sound. |

The bot only sees what Telegram gives a bot: messages sent to it, and the groups and channels
it was added to, from the moment it joined (every group message only with group privacy off
in BotFather). Nothing on the page comes from anywhere else.

`first-sort.mjs` is the only way a run reads the log and writes these files: it counts every
number and copies every name, quote, time and link, so nothing on the page is typed by the
agent except its own short words (gists, replies, the headline), and those hold no numbers.

`latest.json` in short: `schema`, `generatedAt`, `since`, `timeZone`, `person { name }`,
`headline`, `totals { messages, chats, groups, channels, mine, mentions, skipped }`,
`pulse { start, stepHours, counts[], you[] }` (the banner's dots), and:

- `waiting[]`: `id`, `who`, `where { kind, name }`, `said` (their words), `gist`, `why`
  (`mention`, `reply`, `direct`, `question`), `at`, `urgent`, `reply` (a draft in the person's
  voice, `[brackets]` for what they must fill in), `more` (their other messages there after it),
  `youSaid { said, at, due }` (you only answered "I'll…": it still waits on you), `link`.
- `promises[]`: `id`, `to`, `where`, `said` (your words), `gist`, `at`, `due`, `link`.
- `decided[]`: `id`, `who` (who made or proposed it), `where`, `gist`, `at`, `agreed[]` (who said
  yes to it after), `link`.
- `shared[]`: `id`, `kind` (`link`, `file`, `photo`, `video`, `voice`), `title`, `who`, `where`,
  `gist`, `at`, `url` (the shared page, https only), `link`.
- `channels[]`: `id`, `name`, `count` (posts), `needs` (`you`, `fyi`, `none`), `gist`, `link`.
- `loud[]`: `id`, `name`, `kind`, `count`: chats that moved and never needed the person.

`where.kind` is `private`, `group` or `channel`. Links are kept only when they open Telegram
(`https://t.me/...`).
