---
title: How the front desk gets its email
---
# How the front desk gets its email

The front desk never talks to Gmail. Its routines read Gmail and write files here, and
the page shows them. The full rules for each field are in the agent's persona
(`.agents/inbox-summarizer/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning inbox sort, every day at 7 | This morning's lanes. Schema `gmail-inbox/front-desk@2`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up HVAC company in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/loose-ends.json` | Friday check, Fridays at 4 pm | Who is still waiting on an answer. Schema `gmail-inbox/waiting@1`. |
| `data/gone-quiet.json` | Monday check-ins, Mondays at 8 am | Regular customers not heard from in 60 days. Schema `gmail-inbox/gone-quiet@1`. |
| `data/EXAMPLE-gone-quiet.json` | Nobody (it ships with the template) | The made-up company's quiet regulars, shown with the example. |
| `data/status.json` | Every routine | `{ at, ok, why }`. `ok: false` means the last run could not read the email; the page shows `why` with a Try again button. |
| `data/layout-change.json` | The agent, in a chat | Boxes someone asked to `add` or `remove`, with `at`, `for` and a `note`. Schema `gmail-inbox/layout-change@1`. The page offers it with Apply and No thanks; each person's layout itself stays in Cabinet, not in a file. |
| `data/reading.json` | The first sort, as it reads | `{ startedAt, done, lines[] }`: one short line for each thing found, `**bold**` for the finding. Schema `gmail-inbox/reading@1`. The page shows the lines as they come instead of a spinner. |
| `data/profile.json` | The first sort | What the agent learned about the owner: `name`, `business { name, what, where }`, `regulars[]`, `regularsMore`, `replyHours`, `workHours { from, to }`, `signOff`, `mail30`, `mattered30`. Schema `gmail-inbox/profile@1`. Shown once as "This is you"; the open sign uses `workHours`, the greeting uses `name`. |
| `setup.md` | The owner, or the agent in a chat | What the business does, whose email matters, what to set aside, how replies sound. |

`latest.json` in short: `generatedAt`, `since`, `arrived`, `headline`, an optional `lead`
`{ id, why }`, `totals` `{ quotes }`, and three lists: `waiting` (`kind` lead, customer,
vendor, partner or other, `from`, `company`, `gist`, `short`, `urgent`, `receivedAt`,
`waitingSince`, `due`, `reply`), `quotes` (`number`, `who`, `what`, `amount`, `status`
waiting, `date` sent) and `fyi` (`from`, `gist`). An older sort's `money` list still shows
its quotes; invoices and bills are Gmail for Finance's. Every card may carry `threadId` or
`messageId`, which the page turns into an "Open in Gmail" link. `leftOut` counts what was
set aside.

`gone-quiet.json`: `generatedAt`, `headline`, and `people` (`name`, `company`, `what`,
`lastAt`, `short`, `threadId`), longest quiet first. The page shows it for 8 days.

The readable pages go to `reports/` beside this folder: one per morning
(`<YYYY-MM-DD>-morning.md`), one per Friday check (`<YYYY-MM-DD>-still-waiting.md`), one
per Monday check (`<YYYY-MM-DD>-gone-quiet.md`), and the lists the owner asks for in the chat.
