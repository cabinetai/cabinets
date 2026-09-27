---
title: What the Phone line app reads
---
# What the Phone line app reads

The app is Cabinet's own. Cabinet writes it into this folder and keeps it up to date. It
shows the line live, and adds what Front Desk's morning read worked out.

| File | Written by | What it is |
|---|---|---|
| `data/line/YYYY-MM-DD.json` | Cabinet, within a minute of a text or call | One day of texts and calls on the line. The last 30 days are kept. |
| `data/latest.json` | Morning Line Read, every day at 7 | Names, what people want, calls to return, appointments, quotes. |
| `data/drafts/<digits>.txt` | the morning read, or Front Desk when you ask | A reply draft per number, shown in the reply box. |
| `../../past-days/YYYY-MM-DD.md` | the morning read | The same morning as a page to read. The newest 60 are kept. |

`latest.json`:

```
version       1
example       false
generatedAt   "2026-09-25T07:02", local time
status        "ok", or a short phrase saying what went wrong
headline      one sentence, the thing to know first
people        [{ number, name, kind }]            kind: customer, new, supplier, team, personal, spam, other
threads       [{ with, about, topic, needsReply, urgent }]
calls         [{ id, with, summary, topic, callBack }]
appointments  [{ when, who, what, status, from }]  status: confirmed, asked, moving; from: text, call
quotes        [{ who, for, amount, status, said }] status: asked, sent, accepted
asks          [{ topic, count }]                   topic: appointment, quote, question, problem, payment, other
```

Numbers are written `+15155550146`. Times are local, `YYYY-MM-DDTHH:MM`. Amounts are
exactly as written in the text. Front Desk's persona holds the full rules.
