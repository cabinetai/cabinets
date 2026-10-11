---
title: How the money desk gets its email
---
# How the money desk gets its email

The money desk never talks to Gmail. Its routines read Gmail and write files here, and
the page shows them. The full rules for each field are in the agent's persona
(`.agents/money-desk/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning money sort, every day at 7 | This morning's lists. Schema `gmail-finance/money-desk@1`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up HVAC company in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | Every routine | `{ at, ok, why }`. `ok: false` means the last run could not read the email; the page shows `why` with a Try again button. |
| `data/layout-change.json` | The agent, in a chat | Boxes someone asked to `add` or `remove`, with `at`, `for` and a `note`. Schema `gmail-finance/layout-change@1`. The page offers it with Apply and No thanks; each person's layout itself stays in Cabinet, not in a file. |
| `setup.md` | The owner, or the agent in a chat | What the business does, whose money email matters, what to set aside, how reminders sound. |

`latest.json` in short: `generatedAt`, `since`, `arrived`, `headline`, an optional `lead`
`{ id, why }`, `totals` `{ owed, overdue, billsDue, billsDueBy, cameIn, receipts }`, and
five lists: `invoices` (`number`, `who`, `what`, `amount`, `status` open or overdue, `due`),
`payments` (`who`, `what`, `amount`, `date`), `bills` (`kind` bill, subscription,
failed-payment or tax, `from`, `what`, `amount`, `status` due, overdue, autopay or failed,
`due`), `receipts` (`from`, `what`, `amount`, `date`) and `fyi` (`kind` bank, tax or other,
`from`, `gist`). Every card may carry `threadId` or `messageId`, which the page turns into
an "Open in Gmail" link. `leftOut` counts what was set aside. A sort written by Gmail Inbox
(its `money` list, receipts among its bills) still shows.

The readable pages go to `reports/` beside this folder: one per morning
(`<YYYY-MM-DD>-money.md`), one per month for the accountant (`<YYYY-MM>-receipts.md`), and
the lists the owner asks for in the chat.
