---
title: SLA Log
tags: [sla, breach, escalation, queue-state]
modified: '2026-08-13T06:12:34Z'
---
# SLA Log

Append-only record of every SLA warning and breach detected by the daily routing
pass. Breach duration is measured from `due_by` to the moment of detection.

---

## 2026-08-13 — daily routing pass

**5 breaches, 0 warnings.** Every open request in the queue is breached. All five
were routed in May 2026 and have had no status change since; the newest `due_by`
in the queue is 2026-05-26. This is not five independent misses — it is one
stalled queue.

| Request | Team | Owner | Priority | Due by | Breach at detection | Status |
|---|---|---|---|---|---|---|
| REQ-2026-0501 | IT | Tariq Hassan | P1-Urgent | 2026-05-23T17:00Z | 1957.2h (81.6d) | in-progress |
| REQ-2026-0503 | Legal | Rachel Torres | P2-High | 2026-05-25T17:00Z | 1909.2h (79.6d) | in-progress |
| REQ-2026-0505 | Data | Mei Chen | P3-Standard | 2026-05-24T17:00Z | 1933.2h (80.6d) | blocked |
| REQ-2026-0506 | IT | Tariq Hassan | P3-Standard | 2026-05-25T09:00Z | 1917.2h (79.9d) | in-progress |
| REQ-2026-0502 | Design | Ines Tran | P3-Standard | 2026-05-26T17:00Z | 1885.2h (78.6d) | in-progress |

**Escalations raised:** all five to their team leads via the Workflow Agent.
REQ-2026-0501 is a P1-Urgent on a same-day tier sitting 81 days open — that one
goes to the team lead first.

**Related:** REQ-2026-0505 has been blocked on "event schema doc from
engineering team" for 80+ days with no follow-up recorded. A block that old is
not a block, it is an abandoned request. Flagged `stale-block` — needs a
disposition decision (unblock, reassign, or cancel), not another reminder.

**Intake latency (not a `due_by` breach, but the same failure):** REQ-2026-0507
sat in `submitted` for 1964.0h (81.8 days) before this pass routed it. Nothing
in the current rules puts a clock on time-to-route, so this went undetected. See
the rules gap below.

### Rules gaps surfaced by this pass

1. **No intake SLA.** `routing-rules.yaml` starts the clock at `routed_at`. A
   request that is never routed therefore never breaches. REQ-2026-0507 proves
   the hole. Recommend a time-to-route target measured from `submitted`.
2. **No business-day handling.** `sla_matrix` is raw hours. REQ-2026-0507's
   3-day tier lands `due_by` on Sunday 2026-08-16. Every tier can land on a
   weekend this way.
3. **RR-007 priority mismatch.** Rule baseline is P3-Standard; REQ-2026-0507
   arrived carrying P2-High. RR-003 documents manual P2 escalation as a
   pattern but no rule encodes when it applies.

> Rules were **not** modified in this pass. Per the Routing Agent's remit, any
> change to `routing-rules.yaml` needs a logged reason and an update timestamp —
> these are recommendations awaiting a human decision.
