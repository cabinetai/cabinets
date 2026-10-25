---
title: How My chats gets its chats
---
# How My chats gets its chats

The page never reads the chats. Cabinet saves the chats you picked under `whatsapp/` in this
cabinet; its routines read them through `first-sort.mjs` and write files here, and the page
shows them. The full rules for each field are in the agent's persona
(`.agents/chat-helper/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning chat sort, every day at 7 | This morning's lists. Schema `whatsapp-playbook/my-chats@1`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up parent in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | Every routine | `{ at, ok, why }`. `ok: false` means the last run could not read the chats; the page shows `why` with a Try again button. |
| `data/layout-change.json` | The agent, in a chat | Boxes someone asked to `add` or `remove`, with `at`, `for` and a `note`. Schema `whatsapp-playbook/layout-change@1`. The page offers it with Apply and No thanks; each person's layout itself stays in Cabinet, not in a file. |
| `data/reading.json` | The first sort, as it reads | `{ startedAt, done, lines[], gift }`: one short line for each thing found, `**bold**` for the finding, and the one thing to act on now. Schema `whatsapp-playbook/reading@1`. |
| `data/profile.json` | The first sort | What the agent learned: `name`, `tone`, `people[]`, `peopleMore`, `chats`, `groups`, `messages30`, `mine30`, `busiest { name, count }`, `replyMinutes`. Every number is counted from the chats by the helper. Schema `whatsapp-playbook/profile@1`. Shown once as "This is you". |
| `setup.md` | The person, or the agent in a chat | Who is in their life, whose chats matter, what to set aside, how replies sound. |

`latest.json` in short: `generatedAt`, `since`, `chatsRead`, `arrived` (new lines from
others), `headline`, an optional `lead` `{ id, why }`, and six lists. Every card has `chat`
(the chat's key; a folder named by a number shows only its last four digits), `who` and
`chatKind` (person, group or number), all set by the helper. `waiting` (`kind` family,
friend, school, work, service or other, `gist`, `short`, `quote`, `urgent`, `since`,
`unread`, `due`, `reply`), `plans` (`kind` meetup, family, school, appointment, trip or
other, `title`, `where`, `at`, `short`), `groups` (`gist`, `short`, `ask`, `messages`,
`mentions`), `promises` (`what`, `said`, `due`), `money` (`what`, `amount`, `dir` owe or
owed, `said`) and `keep` (`kind` address, link, code, number, file or other, `what`).
`leftOut` counts the chats set aside.

The readable pages go to `reports/` beside this folder: one per morning
(`<YYYY-MM-DD>-morning.md`), one per Sunday (`<YYYY-MM-DD>-week-ahead.md`), and the lists
the person asks for in the chat.
