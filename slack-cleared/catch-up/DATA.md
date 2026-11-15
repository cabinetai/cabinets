---
title: How Catch up gets your Slack
---
# How Catch up gets your Slack

The page never talks to Slack. In the morning routine, `slack-sort.mjs` reads Slack through
Cabinet's own Slack tools (the address Cabinet gives the run in `CABINET_SLACK_URL`), only
where you allowed it, and writes the files here; the page shows them. The rules for each field are in the agent's persona
(`.agents/slack-reader/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning catch-up, every weekday at 8 | The morning. Schema `slack/catch-up@1`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up team in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | Every routine | `{ at, ok, why }`. `ok: false` means the last run could not read Slack; the page shows `why` with Try again. |
| `data/reading.json` | The first reading only | `{ startedAt, done, lines[], gift }`: the lines the page tells while the agent reads, and one gift (`waiting`, `promise`, `noise` or `calm`). |
| `data/profile.json` | The first reading | What it learned: `name`, `regulars`, `messages`, `mine`, `mentions`, `active {from,to}`, `busiest`. Shown once as "This is you". |
| `data/layout-change.json` | The agent, when asked to change the page | `{ at, for, add[], remove[], note }`: box ids, shown with Apply. |
| `setup.md` | You, or the agent in a chat | Who matters, what to skip, hours, how replies sound. |

The run has no Slack token. `slack-sort.mjs` keeps every Slack answer exactly as it came,
counts every number from them and copies every name, quote, time and link, so nothing on the
page is typed by the agent except its own short words (gists, replies, the headline), and
those may hold no numbers.

`latest.json` in short: `generatedAt`, `since`, `timeZone`, `workspace`, `person { name }`,
`headline`, `totals { messages, dms, channels, mine, mentions, skipped }`,
`pulse { start, stepHours, counts[], you[] }` (the banner's lights), and:

- `waiting[]`: `id`, `who`, `where`, `said` (their words), `gist`, `why` (`mention`, `direct`,
  `question`, `thread`), `at`, `urgent`, `reply`, `replyTo { channel, thread }` (where Send in
  Slack answers), `more` (their other asks there that have no row of their own),
  `youSaid { id, said, at, due }` (you only answered "I'll…": it still waits on you), `link`.
- `promises[]`: `id`, `to`, `where`, `said` (your words), `gist`, `at`, `due`, `link`.
- `decided[]`: `id`, `who` (who made or proposed it), `where`, `gist`, `at`, `agreed[]` (who said
  yes to it after), `link`.
- `channels[]`: `id`, `name` (`#launch`), `count`, `needs` (`you`, `fyi`, `none`), `gist`, `link`.
- `loud[]`: `id`, `name`, `kind`, `count`, `link`: places that moved and never needed you.

What Slack itself does not show, all counted by the helper from the saved answers:

- `week`: the last seven days. `since`, `days`, `toYou` (messages to you: DMs, group DMs,
  @mentions, replies in your threads), `mine`, `mentions`, `people[] { name, count }` (the five
  you talk with most), `hours[24]` and `busiestHour` (your own messages by hour, on your
  clock), `answer { minutes, samples, fastest?, slowest? }` (the middle time from a message that
  asked you something to your next message there; only with three or more), `places[] { name,
  count, link }` (the three busiest channels).
- `files[]`: the newest files people shared, from `slack_list_files` (never their bytes):
  `id`, `name`, `type`, `kind` (`pdf`, `image`, `video`, `doc`, `other`), `size`, `who`, `at`,
  `link` (opens the file in Slack). Your own files are left out.
- `links[]`: links other people shared lately, one each, newest first, never Slack's own:
  `url`, `site` ("Google Docs", "Figma", "GitHub", or the domain), `title`, `who`, `where`, `at`,
  `link` (the message).
- `asked[]` (Waiting on others): your own questions nobody answered after, at least two hours
  old: `id`, `who`, `where`, `said` (your words), `at`, `reply` (a nudge by Slack Reader),
  `replyTo`, `link`.

`where` is `{ kind, name, thread }`: `kind` is `dm`, `group` (a group DM) or `channel`; `name`
is the person for a DM, the people for a group DM, `#channel` for a channel; `thread` is true
when the message is a reply in a thread. Links are kept only when they open Slack
(`https://<workspace>.slack.com/`).

Send in Slack never sends from the page: it asks the agent in the chat, Cabinet shows the
message as a card, and it goes only after you approve it.
