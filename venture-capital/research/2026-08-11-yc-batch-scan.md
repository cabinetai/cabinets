---
title: YC Batch Scan — W26/S26
date: '2026-08-11T00:00:00Z'
agent: deal-scout
note: Web-search scan only, not the full monthly sourcing sweep. Nothing here has been added to data/pipeline.md — these are unscored, unverified triage candidates. Company-level details (stage, raise, metrics) are NOT confirmed; verify before diligence.
---

# YC Batch Scan — Winter 2026 (W26) & Summer 2026 (S26)

Ad-hoc pull of recent Y Combinator batch companies, filtered for plausible fit against
[[../data/thesis]]. This is a lighter scan than [[../.jobs/monthly-sourcing-sweep]] — no
Crunchbase/PitchBook connector, no calls, no deck review. Treat every line as "worth a look,"
not "vetted."

> **Re-checked 2026-08-15** — no change. W26/S26 are still the current batches. Fall 2026 (F26)
> applications closed 2026-08-11 with decisions due 2026-08-28; the batch runs Oct–Dec with Demo
> Day on 2026-12-02, and no F26 companies have been announced yet. No candidate below has been
> verified, scored, or added to [[../data/pipeline]]. The `list yc companies` job runs daily
> (13:15), which is far tighter than YC's batch cadence — it will keep returning this same list
> until F26 companies drop (earliest late August) or someone asks for the full sweep.

## Vertical 2 — Developer & AI infrastructure (agent eval / guardrails / observability)

- **Salus** — pre-execution guardrail layer that checks agent actions against rules before they run. (W26)
- **Cascade** — guardrails + testing frameworks for trusting AI systems in production. (W26)
- **Sentrial** — described as "Datadog for agent reliability" — observability/monitoring for agents. (W26)
- **ashr** — automated multi-modal testing for agents. (W26)
- **Arga Labs** — sandboxed testing environments for agents. (W26)
- **Polymath** — trains agents in long-running environments. (W26)
- **OpenRelay** — distributed GPU inference. (S26) — infra-adjacent, closer to Vertical 2 than 1.

*Note: Haloport (already in our pipeline, Screened/IC) is chasing this exact wedge — several of
these are direct competitors or comps. Worth a look for the competitive map the Research Analyst
still owes on Haloport, separate from adding any of them as new deals.*

## Vertical 3 — AI-native security

- **Silmaril** — runtime protection for applications against agent/AI threats. (W26)
- **Salus** — also reads as security-for-AI (see above; overlaps Vertical 2 framing depending on how they position).

## Vertical 1 — Applied AI for a specific workflow

- **COACH** — AI coach for sales reps. (S26) — plausible fit if it owns a real workflow, not just a copilot UI; needs a materials check.
- **Axelrod** — hotel operations automation. (S26) — vertical workflow ownership claim, unverified.
- **Torus** — AI agents for capital projects (construction/infra). (S26) — real workflow if claims hold.

## Noted but out of thesis

- Atlia (AI property management), OpenVector (AI vision), GitCafe (GitHub replacement), Kara (materials science), Rise Reforming (biogas), Earendil Robotics (defense robotics), Osseus, Stoa (fintech for AI hardware), Squid/Voxel Energy/Condor Energy (energy infra) — outside the three verticals or hardware/deep-science (explicit pass criteria).

## Gaps / what this scan is NOT

- No confirmed stage, raise size, or metrics for any company above — I did not call founders or pull a deck.
- No Crunchbase/PitchBook connector wired, so I can't cross-check funding status or verify the "unpromising" filter beyond what's public.
- Nothing here is scored or added to `data/pipeline.md`. Per fund rules, a company only enters Sourced once there's a real thesis-fit confirmation, not a headline.

**Recommendation:** if any of these are worth chasing, say so and I'll run the full
[[../.jobs/monthly-sourcing-sweep]] process on them (materials check, provisional score with
breakdown) before adding to the pipeline. Salus and Cascade are the two I'd prioritize — both
land directly on Vertical 2/3 and are relevant comps for the stuck Haloport competitive map.

Sources: [Forbes — 21 most promising YC startups](https://www.forbes.com/sites/dariashunina/2026/03/16/21-most-promising-startups-from-y-combinators-latest-batch/), [The Agent Report — W26 batch](https://the-agent-report.com/2026/07/ai-agent-startup-explosion-2026-yc-ecosystem/), [CB Insights — YC Winter 2026](https://www.cbinsights.com/research/y-combinator-winter-2026/), [Extruct AI — YC S26 companies](https://www.extruct.ai/data-room/ycombinator-companies-s26/), [Extruct AI — YC W26 companies](https://www.extruct.ai/data-room/ycombinator-companies-w26/)
