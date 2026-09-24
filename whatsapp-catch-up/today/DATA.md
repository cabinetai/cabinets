---
title: What the Today app reads
---
# What the Today app reads

The Today app shows files that Chat Keeper's routines write into `today/data/`. The app
never talks to WhatsApp; it only reads these files.

| File | Written by | What it is |
|---|---|---|
| `latest.json` | Morning Catch-Up, every day at 7:30 | The catch-up the app shows. Each run replaces it. |
| `week.json` | Sunday Week Ahead, Sundays at 18:00 | The coming week's plans, shown beside the morning's. |
| `<stamp>-catch-up.md`, `<stamp>-week-ahead.md` | the same routines | The same catch-up as a page you can read. The newest 30 are kept. |
| `EXAMPLE-latest.json` | nobody, it ships with the cabinet | Made-up people, shown until WhatsApp is connected. |

`latest.json`:

```
version      1
example      false (true only in the example file)
generatedAt  "2026-09-25T07:30:00", local time
status       "ok", or a short phrase saying what went wrong
headline     one sentence, the thing to know first
chatsRead    number of chats read
waiting      [{ who, kind, chat, topic, wants, quote, since }]  oldest first
promises     [{ to, kind, chat, what, said }]                   oldest first
plans        [{ when, what, where, who, kind, chat, said }]     soonest first
prices       [{ who, kind, chat, for, amount, agreed, said }]   newest first
chats        [{ who, kind, chat, messages, about, last }]       busiest first
```

The app puts every row with the same `chat` on one customer card.

- `kind` is `person`, `group` or `number` (a chat with no saved name).
- `topic` is what a waiting customer wants: `quote`, `appointment`, `question`, `problem`
  or `other`.
- The example file also has `business`, the made-up shop's name. Real files never do.
- `chat` is the chat's folder under `whatsapp/`, with a bare number cut to its last four
  digits (`chat-...4410`).
- Times are local, `YYYY-MM-DDTHH:MM`, or `YYYY-MM-DD` for a plan with no time.
- `amount` is exactly as written in the chat, currency and all. `agreed` is true or false.

`week.json` is `{ version, generatedAt, weekStart, weekEnd, headline, plans }` with the
same plan rows. Chat Keeper's persona holds the full rules.
