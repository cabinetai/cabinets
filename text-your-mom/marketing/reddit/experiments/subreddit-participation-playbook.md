---
title: Subreddit Participation Playbook
created: '2026-06-22T00:00:00Z'
modified: '2026-07-03T00:00:00Z'
tags:
  - reddit
  - playbook
  - participation
  - strategy
owner: growth-marketer
---
# Subreddit Participation Playbook

Where we show up, in what order, with what content, and why. Governed by [voice-and-tone.md](../comment-opportunities/voice-and-tone.md) and [reply-closers-and-boundaries.md](../comment-opportunities/reply-closers-and-boundaries.md).

## Sequence rationale

Reddit is a research channel first (company strategy). Participation earns the right to exist in threads. We earn it by being useful before we're present. Sequence below reflects trust-building order, not urgency order.

---

## Phase 1 — Listen and comment (approved; execution is human-run)

> "Unblocked" here means the copy and approach are approved and staged — **not**
> that an agent can post. No agent in this cabinet has live Reddit access
> (reddit.com is blocked to our crawler). A human executes the actual comments
> against the variants below, then logs them; the agents prep, don't post.


**r/relationships** — Tier 0 comments only

- What to watch for: threads where someone describes leaving a message unanswered, drifting from family, or "I keep meaning to text her back" phrasing
- What we bring: V1f opener from [message-variants-v1.md](../comment-opportunities/message-variants-v1.md), Tier 0 closer — no product mention
- Rate: 1–2 comments per week max; never back-to-back threads
- Do not enter: grief threads, estrangement threads, anything that maps to the "stay silent entirely" list in reply-closers-and-boundaries.md
- Why first: highest signal density; the language here is what our copy should sound like

**r/Adulting** — Tier 0 comments, escalate to Tier 1 when thread invites

- What to watch for: habit/routine failure threads, "I'm bad at staying in touch" posts
- What we bring: Theme 3 openers (tiny systems), Tier 0 default; Tier 1 if OP explicitly asks "what helps"
- Rate: 1–2 comments per week
- Why second: overlaps our core user (warm, busy, slightly overwhelmed adult)

---

## Phase 2 — Original posts (human-gated, not Researcher-gated — corrected 2026-07-03)

**r/Adulting** — Theme 3 or 4 original post

Gate corrected 2026-07-03: this used to read "blocked until Researcher confirms the community accepts long-form observation posts." That framing is dead — reddit.com is blocked to our crawler (see [language audit](../analytics/reply-guilt-language-audit.md)), so the Researcher can never read a live subreddit to confirm it, and re-handing that task just re-freezes the funnel. What actually unblocks it is a **human** skimming r/Adulting to confirm observation posts land there vs. only questions/confessions. Theme 3 ("Tiny systems for staying in touch without feeling fake") is the natural entry — it's useful to the subreddit whether or not someone clicks through.

**r/selfimprovement** — Theme 4 thought-leadership post

- Draft: V4b + V4c from message-variants-v1.md ("Reminder apps fail on emotional tasks because the blocker is rarely memory. It is the cost of context-switching back into someone you love when you're tired. The fix is not a louder notification. It is a smaller ask.")
- Tone: confident argument, no product mention in the post itself — Tier 1 only if comments ask
- Why here: community expects "I noticed this pattern" posts; Theme 4 earns credibility before we ever name the product

---

## Phase 3 — Hold for now

**r/Anxiety** — read-only until further notice

- Why: high risk of getting the tone wrong; the community is sensitive to anything that reads as a product pitch during a moment of vulnerability
- Unblock condition: a **human** confirms specific thread types where Tier 0 comments would be welcomed — not the Researcher (reddit.com is blocked to our crawler, so live-thread reads are a human task)

**r/productivity** — low priority

- Why: this audience wants systems, not feelings; our strongest content (Theme 4) works here but the conversion path is longer and the audience is less emotionally aligned with the product
- Revisit after r/selfimprovement post gets directional data

---

## Comment tracking

When a comment goes live, log it in [`analytics/comment-log.csv`](../analytics/comment-log.csv) (created 2026-06-22, header ready, still empty — no live comment has been posted yet) with:
- Date, subreddit, thread URL, variant ID used, tier, upvotes at 24h and 72h, replies received, any product ask triggered

This is what lets Data Analyst answer "does Tier 0 earn more downstream trust than Tier 1?"

---

## What unlocks Phase 2

1. ~~Researcher delivers verbatim guilt-language quotes from r/relationships and r/Adulting~~ — **retired 2026-07-03.** Uncompletable: reddit.com is blocked to our crawler. The guilt-*language* question is already answered by the open-web [language audit](../analytics/reply-guilt-language-audit.md); the residual (does a real thread actually fit the line?) is a **human** read, not a Researcher task.
2. ~~Data Analyst confirms experiment 001 minimum sample size~~ ✅ Done 2026-06-24 — ~2,900/variant (~5,800 total); see [experiment-001-landing-hero.md](./experiment-001-landing-hero.md#minimum-sample-size--confirmed-by-data-analyst-2026-06-24)
3. At least 3 Tier 0 comments have been posted by a human without negative reception (agents can't post; see Phase 1 note)

Phase 2 is not "next week" — it is "after Phase 1 earns it."
