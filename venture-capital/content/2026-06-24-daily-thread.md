---
title: Daily X Thread — 2026-06-24
agent: platform-lead
status: draft (partner review before posting)
topic: The agent broke your security model because it's neither a human nor a service
---
# Daily X Thread — 2026-06-24

**Topic:** Why the security stack for AI agents doesn't exist yet — every tool we own (identity, authorization, DLP) was built on a clean human-vs-service split, and an agent is a third thing that walks through the gap between them.
**Why timely:** Deliberate rotation to Vertical 3 (AI-native security) — the last three posted threads ran infra, infra, applied-AI, and we haven't put our security point of view on record yet. It's also the cluster we're seeing form in real time across deal flow: agent identity & access, data-leak prevention, runtime guardrails. A clean map of a category that's still being born is exactly what a security-minded founder or CISO screenshots. Leaks nothing — speaks to the layers, never the companies.

---

**1/** Your agent isn't a security problem because it might get hacked. It's a security problem because every tool you own assumes the actor is either a human or a service. An agent is neither — and it walks straight through the gap between them.

**2/** Look at what an agent actually is. It holds a credential like a service account: long-lived, broad, no one watching it click. But it improvises like a person — reads, decides, chains actions you never scripted. Human intent at machine speed and breadth. Nothing in your stack was built for that.

**3/** Start with identity. An agent can't do MFA; it isn't a person. So teams hand it a service account: static, over-permissioned, never expires, shared across every run. You've given your most improvisational actor your least accountable identity. That's backwards — and there's no primitive yet that fixes it.

**4/** Then authorization. Your authz answers one question: "can this user do X?" But an agent chains 40 tool calls to satisfy a single instruction. Every individual call passes the check. The *sequence* is the exfiltration. Per-call permissions can't see a trajectory — and the trajectory is the attack.

**5/** Then the data layer — the part most teams haven't clocked. Nobody needs to breach your agent. They just talk to it. Untrusted text in the context window is now executable instruction. Prompt injection isn't a content-filter problem. It's privilege escalation through the front door.

**6/** Notice every layer fails for the *same* reason. Identity, authz, DLP were all built on a clean human/service split. The agent is a third thing. You can't patch across that gap, because the abstractions underneath assume it doesn't exist.

**7/** What a defender actually needs — and what we think gets built into a category:
- Identity that's scoped, expiring, and bound to the intent of a single task
- Authorization that evaluates the *trajectory*, not the isolated call
- A runtime that treats every token of context as untrusted until proven otherwise

**8/** This is a whole security category being born — not a feature on someone's existing roadmap. The teams we're watching aren't bolting "AI" onto an old tool. They picked one layer where the human/service model breaks and built the primitive that should have existed.

If that's what you're building, our DMs are open.

---

**First-line A/B alternate:**
> A) "Your agent isn't a security problem because it might get hacked. It's a security problem because every tool you own assumes the actor is either a human or a service — and an agent is neither."
> B) "An AI agent holds credentials like a service account and improvises like a person. Your entire security stack was built on the assumption that those are two different things. They just stopped being."

**Partner sanity-check before posting:**
- **This is the deliberate first Vertical 3 thread.** It puts the fund's AI-native-security point of view on record and rotates us off the applied-AI/infra register. Confirm you're happy to plant a flag here publicly — it will read as "this fund has a security thesis," which is the intent.
- **Framing is drawn from a deal-flow *pattern*, not a company.** The three layers (identity & access, trajectory/authorization, data-leak/prompt-injection) map to a real cluster forming in our pipeline. No company, round, valuation, or metric appears. One flag worth your eyes: post 3 (agent identity & access) is the closest to a live, hot inbound in this space — confirm it reads as the category, not as a tell on any one deal.
- **The strongest claims are opinions stated as our POV, which is the right register for a thread — but flag them as forecasts the fund is putting its name behind:** "there's no identity primitive yet that fixes it" and "prompt injection is privilege escalation, not a content-filter problem." Both are our read, not settled fact.
- The "40 tool calls" and the mechanics in posts 3–5 are illustrative, not lifted from any company's architecture. ✅
- No portfolio or pipeline company is named or identifiable. ✅
