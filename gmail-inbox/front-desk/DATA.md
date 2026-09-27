---
title: How the front desk gets its email
---
# How the front desk gets its email

The front desk never talks to Gmail. Its routines read Gmail and write files here, and
the page shows them. The full rules for each field are in the agent's persona
(`.agents/inbox-summarizer/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning inbox sort, every day at 7 | This morning's lanes. Schema `gmail-inbox/front-desk@1`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up HVAC company in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/loose-ends.json` | Friday check, Fridays at 4 pm | Who is still waiting on an answer. Schema `gmail-inbox/waiting@1`. |
| `data/status.json` | Both routines | `{ at, ok, why }`. `ok: false` means the last run could not read the email; the page shows `why` with a Try again button. |
| `setup.md` | The owner, or the agent in a chat | What the business does, whose email matters, what to set aside, how replies sound. |

`latest.json` in short: `generatedAt`, `since`, `arrived`, `headline`, an optional `lead`
`{ id, why }`, `totals` `{ owed, overdue, billsDue, billsDueBy }`, and four lists:
`waiting` (`kind` lead, customer, vendor, partner or other, `from`, `company`, `gist`,
`short`, `urgent`, `receivedAt`, `waitingSince`, `reply`), `money` (`kind` quote, invoice
or payment, `number`, `who`, `what`, `amount`, `status` waiting, open, overdue or paid,
`due`, `date`), `bills` (`kind`, `from`, `what`, `amount`, `status` due, overdue, autopay,
failed or paid, `due`) and `fyi` (`from`, `gist`). Every card may carry `threadId` or
`messageId`, which the page turns into an "Open in Gmail" link. `leftOut` counts what was
set aside.

The readable pages go to `reports/` beside this folder: one per morning
(`<YYYY-MM-DD>-morning.md`), one per Friday check (`<YYYY-MM-DD>-still-waiting.md`), and
the lists the owner asks for in the chat.
