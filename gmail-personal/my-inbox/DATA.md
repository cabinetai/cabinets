---
title: How My inbox gets its email
---
# How My inbox gets its email

The page never talks to Gmail. Its routines read Gmail and write files here, and the page
shows them. The full rules for each field are in the agent's persona
(`.agents/inbox-helper/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning inbox sort, every day at 7 | This morning's lists. Schema `gmail-personal/my-inbox@1`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up parent in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | Every routine | `{ at, ok, why }`. `ok: false` means the last run could not read the email; the page shows `why` with a Try again button. |
| `setup.md` | The person, or the agent in a chat | Who is in their life, whose email matters, what to set aside, how replies sound. |

`latest.json` in short: `generatedAt`, `since`, `arrived`, `headline`, an optional `lead`
`{ id, why }`, `totals` `{ billsDue, billsDueBy }`, and five lists: `waiting` (`kind`
family, friend, school, work, service or other, `from`, `company`, `gist`, `short`,
`urgent`, `receivedAt`, `waitingSince`, `due`, `reply`), `bills` (`kind` bill, subscription
or failed-payment, `from`, `what`, `amount`, `status` due, overdue, autopay, renews or
failed, `due`), `events` (`kind` appointment, booking, school, travel or other, `title`,
`where`, `at`), `deliveries` (`from`, `what`, `status` shipped, out-for-delivery, delivered
or delayed, `eta`) and `fyi` (`from`, `gist`). Every card may carry `threadId` or
`messageId`, which the page turns into an "Open in Gmail" link. `leftOut` counts what was
set aside.

The readable pages go to `reports/` beside this folder: one per morning
(`<YYYY-MM-DD>-morning.md`), one per Sunday (`<YYYY-MM-DD>-week-ahead.md`), and the lists
the person asks for in the chat.
