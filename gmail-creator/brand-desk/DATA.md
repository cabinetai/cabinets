---
title: How the brand desk gets its email
---
# How the brand desk gets its email

The brand desk never talks to Gmail. Its morning routine reads Gmail and writes files here,
and the page shows them. The full rules for each field are in the agent's persona
(`.agents/brand-manager/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning brand sort, every day at 7 | This morning's deals, payments, fakes and fans. Schema `gmail-creator/brand-desk@1`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up travel creator's inbox in the same shape, with made-up brands. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | Every routine | `{ at, ok, why }`. `ok: false` means the last run could not read the email; the page shows `why` with a Try again button. |
| `setup.md` | The creator, or the agent in a chat | What they make, their rates, how they get paid, what they never do, how replies sound. |

The page adds the money itself: the big number is the sum of every deal's `amount`, and
"Owed to you" is the sum of every payment's `amount`. A deal with no fee written in the
email has `amount: null` and is counted apart ("1 more did not say a price").

Every card may carry `threadId`, which the page turns into an "Open in Gmail" link. Replies
(`reply`, `replyHinglish`) open in a panel that types them out; `[brackets]` are the
creator's choices, shown in gold. "Put in Gmail drafts" asks the agent in the chat, and
nothing is ever sent.
