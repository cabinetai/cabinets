---
title: First Comment Kit — Post the First Live Reddit Comment in 15 Minutes
created: '2026-07-07T00:00:00Z'
modified: '2026-07-07T00:00:00Z'
tags:
  - reddit
  - copy
  - execution
  - human-handoff
author: copywriter
order: 7
---
# First Comment Kit

**Who this is for:** a human with a Reddit account and 15 minutes. Not a strategy
doc — a runbook. Every line below is assembled from copy that's already approved
([voice-tests-reply-guilt.md §B-obs](./voice-tests-reply-guilt.md) openers +
[Tier 0 closers](./reply-closers-and-boundaries.md)). Nothing here mentions the
product, because the first comments must not (Tier 0 only).

**Why it matters:** no live comment has ever been posted — `analytics/comment-log.csv`
has been header-only since 2026-06-22. Three clean Tier 0 comments is Phase 2
unlock #3 in the [participation playbook](../experiments/subreddit-participation-playbook.md),
and the first logged row is the first real signal Data Analyst has ever had.

---

## Step 1 — Find a thread (~5 min)

Open **r/relationships** or **r/Adulting**, sort by New or Rising. You're looking
for someone *venting*, not asking for tools:

- "I keep meaning to text her back and it's been weeks"
- "I'm terrible at staying in touch"
- "The longer I wait the worse I feel"

**Hard skips — close the tab, do not comment** (full list in
[reply-closers-and-boundaries.md](./reply-closers-and-boundaries.md)):

- Grief / a parent who has died
- Estrangement, abuse, "I went no-contact for a reason"
- Active mental-health crisis

One more rule: comment *inside* the conversation the thread invites. If the post
is a vent addressed to the void, replying to the OP is fine; don't drop a
drive-by on a thread that's really a private exchange between two people.

**Bonus, same sitting:** while you're reading, notice whether any thread would
genuinely welcome the line "Reply guilt is real…" — that one read is the entire
human gate on [B-named](./voice-tests-reply-guilt.md#b-named--names-the-feeling-as-theirs-parked--human-gated-gate-corrected-2026-06-29)
and Experiment 002. If a thread fits, say so in the log's Notes column.

## Step 2 — Pick ONE comment and make it yours (~5 min)

Three ready-to-paste comments, matched to what the OP said. **Change at least one
clause to fit the actual thread** — verbatim-identical text posted twice reads as
spam, to Reddit and to redditors.

**Comment A** — OP says *"it's been weeks and I feel terrible"*
`ID: B-obs-1 + T0`

> The wild part is it's almost never the relationship — it's that the message has
> been sitting in your head so long that "hi" now feels like it needs an essay
> attached. It doesn't. Hope the first one's easier to send than it feels right now.

**Comment B** — OP says *"I'm just bad at texting / bad at staying in touch"*
`ID: B-obs-2 + T0`

> I think what gets called "bad at texting" is usually "the longer I wait, the
> more the reply has to justify itself." You're not bad at this. The message just
> got heavy — and that's a different problem, and a fixable one.

**Comment C** — OP says *"I keep meaning to reach out and never do"*
`ID: B-obs-4 + T0`

> It's rarely that you forgot. It's that "later" felt safer than "now," and later
> kept quietly moving. The short reply is allowed — "hey, been thinking about you"
> on a random Tuesday does more than the perfect essay you keep not sending.

**Do not:** mention the product, add a link, hint that something "helped you"
(that's Tier 1 and the door hasn't been opened). If anyone replies asking "what
do you use?", *stop* and see the Tier 1 rules in
[reply-closers-and-boundaries.md](./reply-closers-and-boundaries.md) before answering.

## Step 3 — Post it (~1 min)

One comment. Not five. Rate limit is 1–2 per week per subreddit
(playbook Phase 1), and the first one is deliberately a single data point.

## Step 4 — Log it (~2 min)

Add a row to [`analytics/comment-log.csv`](../analytics/comment-log.csv). Paste
and fill:

```csv
2026-07-__,r/________,<thread URL>,B-obs-_ + T0,0,,,,,first live comment
```

Come back at **24h** and **72h** to fill in upvotes and replies, and set
**Product Ask Triggered** to `Y` or `N` — `Y` only if someone organically asked
what you use / what helps. That Y/N is the exact column Data Analyst needs to
answer "does not-pitching earn more trust?"

---

*That's the whole job. Three of these without negative reception and Phase 2
(original posts) unlocks.*
