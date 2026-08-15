---
title: Experiment 001 — Landing Hero Framing
created: '2026-06-22T00:00:00Z'
modified: '2026-06-29T00:00:00Z'
tags:
  - reddit
  - experiment
  - landing-page
  - copy
status: ready-to-wire
owner: growth-marketer
---
# Experiment 001 — Landing Hero: Emotional Weight vs. Action Clarity

## The question

Does leading with emotional resonance ("reply guilt") outperform leading with action clarity ("staying in touch")?

This is the open question flagged in [experiments/index.md](./index.md) and [voice-tests-reply-guilt.md](../comment-opportunities/voice-tests-reply-guilt.md). Running it on the landing page first — no Reddit data needed, Researcher dependency doesn't block this.

## Hypothesis

- **A1** will win on *engagement* (time-on-page, scroll depth) because it names the feeling before the product.
- **A5** will win on *cold-traffic conversion* because it's clear on first read.
- If A1 wins both, "reply guilt" framing should cascade into onboarding and Reddit post copy.
- If A5 wins both, we pivot to action clarity and kill the emotion-first hypothesis for heroes (not for comments — different register).

## Variants

| ID | Hero line | Subhead (pair with) | Framing pole | Ships |
|---|---|---|---|---|
| **A** (control) | "Some texts get harder to send the longer you wait." | "Tiny check-ins, before they turn into apologies." | Reply guilt / emotional (**observational**) | **Now** |
| **B** (challenger) | "The check-in you keep meaning to send — sent." | "One nudge a day so the people you love stop drifting." | Action clarity / utility | Now |
| A1 (→ 001b, **now ready**) | "You don't love her less. The text just got heavier." | (same emotional subhead) | Reply guilt, **named directly** | As Exp 001b — unblocked 2026-06-29 by the [language audit](../analytics/reply-guilt-language-audit.md) |

Control hero is **A2** from [voice-tests-reply-guilt.md](../comment-opportunities/voice-tests-reply-guilt.md), challenger is **A5**. Subheads from [message-variants-v1.md](../comment-opportunities/message-variants-v1.md) (V1d, V1e). All pass voice-and-tone house rules.

### Why A2, not A1, in the control arm (unblock, 2026-06-26)

The original control was **A1** ("…the text just got heavier"), gated on the Researcher confirming real people say "guilt." That dependency has been pending since 2026-06-17 and the one heartbeat that attempted it (2026-06-24) **timed out / failed**. Holding the Q2 conversion test on a failing dependency is the wrong call.

**A2 is the Copywriter's own hedge** for exactly this case — observational reply-guilt that does *not* put the word "guilt" in the user's mouth, so it ships honestly with no verbatim proof. It still tests the real question (emotional weight vs. action clarity); it trades A1's mom-specific punch for the ability to launch now. A1 becomes **Experiment 001b** the moment Researcher delivers — or a fast swap if 001 shows the emotional pole winning and we want to sharpen it.

We chose A2-swap over the "A1 never literally says 'guilt', so ship it" reading on purpose: for a brand whose thesis is *never sound manipulative*, the defensible move is the one we'd be comfortable defending in r/hailcorporate, not the cleverest reading of our own gate. A1 returns through the front door (001b), with the data to back it.

CTA on both variants: **"Text her today"** — no variant here yet, isolate the hero first.

## What to measure

| Metric | Primary? | Why |
|---|---|---|
| Signup rate | Yes | The only number that matters for Q2 conversion goal (3.5% → 5%) |
| Bounce rate | Secondary | Proxy for whether the hero earns the next scroll |
| Time on page | Secondary | Indicates engagement with emotional vs. utility frame |

### Minimum sample size — CONFIRMED by Data Analyst (2026-06-24)

Two-proportion test, 95% confidence (α=0.05, two-sided), 80% power. Baseline
signup rate = 3.5% (the Q2 conversion floor). What we can afford to detect drives
everything — smaller lift = much more traffic:

| Lift we want to detect | Variant B target | Needed per variant | Total (both) |
|---|---|---|---|
| +1.5pp (the full Q2 goal, 3.5% → 5.0%) | 5.0% | ~2,900 | ~5,800 |
| +2.0pp (3.5% → 5.5%) | 5.5% | ~1,700 | ~3,400 |
| +3.5pp (3.5% → 7.0%, a near-double) | 7.0% | ~630 | ~1,260 |

**Recommendation:** commit to the **+1.5pp** row — ~2,900 signups-worth of
traffic *per variant* (~5,800 total) — because that's the exact lift the Q2 goal
needs. Calling on anything smaller risks shipping a hero that "won" on noise.

**Hard rules:**
- Do **not** read results before both arms clear the threshold. At 40
  visitors/variant the 95% CI on a 3.5% rate is roughly ±6pp — wider than the
  effect we're hunting. Copywriter's instinct was right: 40 is ~70× too few.
- No peeking-and-stopping. Pick the threshold up front (above), look once.
- If landing traffic can't realistically reach ~5,800 in the test window, drop
  to the **+2.0pp** row (~3,400 total) *before* launch and accept we can only
  detect a coarser win — don't quietly lower the bar after seeing data.

## What this does NOT test

- CTA copy (same on both)
- Subhead alone (bundled with hero on purpose — test the *pair*, not the line)
- Mobile vs. desktop split (future experiment)
- Reddit-sourced traffic vs. organic (tag UTMs from the start so we can cut this later)

## Dependencies

- [x] Data Analyst confirms minimum sample size — ~2,900/variant (~5,800 total) for the +1.5pp goal-lift; see table above (2026-06-24)
- [x] ~~Researcher confirms guilt language~~ — resolved for our-own-page copy via the [open-web language audit](../analytics/reply-guilt-language-audit.md) (2026-06-29). This unblocks **001b** too; the only thing it does NOT clear is posting inside Reddit threads (B-named / Exp 002), which needs a human, not the Researcher.
- [ ] **Web team wires the split on the landing page** — see "Wiring handoff" below. This is the sole remaining blocker for 001 *and* 001b; it cannot be done by any agent in this cabinet.
- [ ] UTM tagging agreed before traffic starts (params spec in handoff below)

## Status

`ready-to-wire` — **fully unblocked**. A2 control / A5 challenger, both copy-approved, sample size set, zero Researcher dependency. The only thing between here and live data is the web team wiring the split + UTM tags.

## Experiment 001b (UNBLOCKED 2026-06-29 — ready to wire)

Same harness, same metrics, same sample-size rules. Swaps the control hero to **A1** ("You don't love her less. The text just got heavier.") — the guilt-named line. Purpose: test whether naming the feeling directly beats the observational A2.

**Why it's unblocked now:** the original gate was "Researcher confirms real users say 'guilt.'" The [reply-guilt language audit](../analytics/reply-guilt-language-audit.md) (2026-06-29) confirms this from open-web sources — "guilt" appears in the *titles* of mainstream articles people share about exactly this behavior; it is audience-native language, not ours. The verbatim-Reddit-quote path was never going to clear (reddit.com is blocked to our crawler — the real reason the Researcher heartbeat times out), and it isn't needed: A1 runs on **our own** landing page, where naming a documented feeling is honest. Sequence 001b behind 001, or fast-swap A2→A1 if 001 shows the emotional pole winning.

## Wiring handoff (for the human / web team — zero-ambiguity spec)

This test has been `ready-to-wire` since 2026-06-26 with no progress because **no
agent in this cabinet can edit the landing page.** It needs a human. Everything
needed to ship is here — nothing else is owed by this team:

- **Split:** 50/50 random, sticky per visitor (cookie or localStorage), held for the whole test window. One hero pair per arm:
  - **Arm A2 (control):** hero "Some texts get harder to send the longer you wait." / subhead "Tiny check-ins, before they turn into apologies."
  - **Arm A5 (challenger):** hero "The check-in you keep meaning to send — sent." / subhead "One nudge a day so the people you love stop drifting."
  - CTA on both: **"Text her today"** (identical — do not vary).
- **001b** is the same harness with the control hero swapped to **A1** ("You don't love her less. The text just got heavier.") + the emotional subhead. Run it after 001, or fast-swap A2→A1 if 001's emotional arm wins.
- **Primary metric:** signup rate (CTA click → completed signup). Secondary: bounce, time-on-page.
- **Sample size:** do NOT call before **~2,900 signups-worth of traffic per arm (~5,800 total)** for the +1.5pp goal-lift. Look once, at threshold. If traffic can't reach ~5,800 in-window, drop to the +2.0pp row (~3,400 total) *before* launch — see table above.
- **UTM tags (set before any traffic):** `utm_source` = traffic origin (e.g. `reddit`, `organic`), `utm_medium=hero-test`, `utm_campaign=exp001` (or `exp001b`), `utm_content` = arm id (`a2` / `a5` / `a1`). This is what lets the Data Analyst cut Reddit-sourced vs organic later.
- **When live:** ping Data Analyst with the start date so the look-once threshold can be tracked.

## Next experiment

Experiment 002 (a *Reddit thread post*) stays parked — **but its gate has changed.** It is no longer "Researcher returns verbatim guilt-language data" (impossible: reddit.com is blocked to our crawler). The language question is settled by the [audit](../analytics/reply-guilt-language-audit.md); what remains is live thread *fit*, which requires a **human** to read r/Adulting / r/relationships and confirm a real thread is discussing the behavior. Once a human green-lights a specific thread: Theme 1 post with V1a opener + Tier 0 closer from [reply-closers-and-boundaries.md](../comment-opportunities/reply-closers-and-boundaries.md).
