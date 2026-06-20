# Candidate Packet — Morgan Lee

| Field | Value |
|---|---|
| Candidate | Morgan Lee |
| Role | Senior Backend Engineer — Platform |
| Stage | Final Round → Debrief |
| Debrief | May 27, 2026 · 14:00 |
| Recruiter | Dana Park (d.park@example.com) |
| Hiring Manager | Jordan Rivera (j.rivera@example.com) |

---

## Resume highlights (for this role)

1. **5 years backend, 3 years distributed systems.** Senior SWE at CloudStream (Series C, 200 engineers) — built the event streaming pipeline that scaled from 50K to 5M events/day.
2. **Go + Kubernetes expert.** All recent production work in Go; contributed to 2 OSS Kubernetes operators.
3. **On-call culture.** Designed the incident response runbook at CloudStream; 18-month on-call rotation.
4. **Relevant gap:** No direct experience with our primary DB stack (CockroachDB) — mentions Postgres and Cassandra. Engineering confirmed this is learnable; flagged for systems design interview.

---

## Interview notes digest

| Interviewer | Role | Read | Strongest signal | Flag |
|---|---|---|---|---|
| Jordan Rivera | Hiring Manager | Strong | "Thinks in failure modes before happy paths — probed the event pipeline for edge cases I hadn't anticipated" | None |
| A. Okafor | Staff Eng | Mixed | "Strong on ops/reliability; architecture depth was surface-level on data modeling" | Pressed on DB schema design — gave a reasonable answer but not deep |
| R. Lindqvist | Senior Eng | Strong | "Take-home was production-quality — clean error handling, test coverage, reasonable tradeoffs" | None |
| K. Santos | Engineering Manager | Strong | "Clear communicator, asked good clarifying questions, self-aware about gaps" | None |

**Disagreement to surface:** A. Okafor (Mixed) vs. Jordan + R. Lindqvist + K. Santos (Strong). The split is specifically on data modeling depth vs. operational reliability. The committee should resolve: is data modeling a day-1 requirement or learnable with context?

---

## Scorecard by competency

| Competency | Ratings | Aggregate |
|---|---|---|
| Systems design | 4, 3, 4, 4 | Strong |
| Coding & implementation | —, 4, 5, — | Strong |
| Debugging & reliability | 5, 4, —, 4 | Strong |
| Data modeling | 4, 2, —, — | Mixed (outlier: A. Okafor = 2) |
| Communication | 4, —, 4, 5 | Strong |
| Culture & values | 4, 4, 4, 5 | Strong |

Scale: 1 (Poor) → 5 (Exceptional). "—" = not covered in that round.

---

## Take-home assessment

**Prompt:** Design and implement a rate limiter service (token bucket algorithm) in Go — must handle distributed state, include tests, and include a brief architectural decision record.

**Summary:** Submitted 3 days early. Clean Go, idiomatic error handling, tested to 85% coverage. Used Redis for distributed state with a clear tradeoff note (Redis vs. Postgres for durability). ADR was concise and well-reasoned. One gap: did not handle clock skew in distributed mode — mentioned it as a known limitation in the ADR.

**Reviewer (R. Lindqvist) read:** "Production-quality for a take-home. The clock skew acknowledgment is exactly what I want — they know what they don't know."

---

## Draft recommendation

**Advance to offer.** [Draft — committee to confirm]

Three of four interviewers rated Strong across the board. The take-home was production-quality with clear technical reasoning. The one mixed signal (data modeling) is specific to A. Okafor's DB schema probe — not a system design gap but a specific stack familiarity gap (CockroachDB vs. Cassandra) that onboarding can address. The operational reliability and debugging signals are the primary requirements for this role.

*Packet produced by Candidate Summarizer · reviewed by People Ops Lead · May 26, 2026*
