---
title: Daily Routing Digest — 2026-08-13
tags: [routing, digest, sla, queue-state]
date: '2026-08-13'
run_at: '2026-08-13T06:12:34Z'
---
# Daily Routing Digest — 2026-08-13

**1 request routed · 5 SLA breaches · 0 SLA warnings · 0 unclassified.**

Every open request in this queue is breached, and the one request that was
waiting to be routed had been waiting 81 days. The queue has not moved since
2026-05-23. Read the numbers below as a stalled-pipeline signal, not as five
separate teams missing five separate deadlines.

## 1. Routed this pass

| Request | Title | Rule | Type / Team | Priority | SLA | Due by |
|---|---|---|---|---|---|---|
| REQ-2026-0507 | Social copy for product launch — 10 posts | RR-007 | Marketing / Marketing | P2-High | 3-day | 2026-08-16T06:12:34Z |

Matched RR-007 (Marketing Support) on the keyword **"copy"**. Clean single-rule
match — no ambiguity, no fallback, nothing unclassified this pass.

Three things on this request need a human eye:

- **Priority kept at P2-High, against the rule baseline.** RR-007 yields
  P3-Standard. The intake record already carried P2-High. I kept it rather than
  silently downgrading a priority someone set upstream. The SLA tier is 3-day
  either way, so the clock is identical — only the label differs. Flagged
  `priority-override`.
- **Due date lands on a Sunday.** `sla_matrix` is raw hours with no business-day
  rule, so `routed_at + 72h` = 2026-08-16, a Sunday. Flagged `sla-weekend-due`.
- **Routed 81.8 days after submission.** Flagged `intake-delay`. The SLA clock
  starts at `routed_at`, so this delay is invisible to breach detection —
  the request was never late by the current rules, it just never started.

## 2. SLA breaches — 5

Full detail and escalation record in `queue-state/sla-log.md`.

| Request | Team | Owner | Priority | Overdue by |
|---|---|---|---|---|
| REQ-2026-0501 | IT | Tariq Hassan | P1-Urgent | 81.6 days |
| REQ-2026-0505 | Data | Mei Chen | P3-Standard | 80.6 days (blocked) |
| REQ-2026-0506 | IT | Tariq Hassan | P3-Standard | 79.9 days |
| REQ-2026-0503 | Legal | Rachel Torres | P2-High | 79.6 days |
| REQ-2026-0502 | Design | Ines Tran | P3-Standard | 78.6 days |

**Breach rate on open requests: 100% (5 of 5).** Lifetime rate across all seven
requests in the queue: 71.4% (5 of 7) — the only clean record is REQ-2026-0504,
resolved 16.6h inside its 48h tier.

REQ-2026-0501 is the one to act on first: a P1-Urgent on a same-day tier, open
81 days. REQ-2026-0505 has been blocked on an engineering schema doc since May
with no recorded follow-up — that needs a disposition (unblock, reassign, or
cancel), not another nudge.

## 3. SLA warnings — 0

Nothing sits in the 4-hour warning window. REQ-2026-0507 is the only request
with a live future clock; it has ~72h remaining.

## 4. Unclassified — 0

No request hit the RR-099 fallback. No `routing-review` flags raised.

## 5. Volume by team (current queue, all statuses)

| Team | Open | Resolved | Total |
|---|---|---|---|
| IT | 2 | 0 | 2 |
| Design | 1 | 0 | 1 |
| Legal | 1 | 0 | 1 |
| Data | 1 (blocked) | 0 | 1 |
| Marketing | 1 (routed) | 0 | 1 |
| Finance | 0 | 1 | 1 |
| **Total** | **6** | **1** | **7** |

IT holds 28.6% of all requests — the largest share, and both of its requests are
breached. Too small a sample to call a pattern; worth watching in the weekly
report once volume recovers.

## 6. Blocked on a human

Three things this pass could not complete honestly. None of them stopped the
routing work above.

1. **`team-rosters.yaml` does not exist.** Both agent personas name it as the
   source for owner assignment, and it is not in the cabinet. REQ-2026-0507 is
   therefore routed but unassigned. Owner names for IT, Design, Legal, Finance
   and Data can be inferred from existing requests — **Marketing has no
   observed owner anywhere in the queue.** I did not invent a roster; inventing
   personnel data would be worse than leaving the gap visible.
2. **`queue-state/tickets.yaml` does not exist.** Existing requests carry ticket
   refs (IT-4821, DES-0198, …) that live nowhere but the request records.
   Ticket creation is the Workflow Agent's remit — delegated, not done here.
3. **The queue snapshot is frozen at 2026-05-23.** Either these requests are
   genuinely abandoned and need working through, or this is stale demo data that
   should be re-baselined. That call is the cabinet owner's, not mine. Until
   it's made, every daily pass will report the same five breaches with a larger
   number attached.

## 7. Known drift

`queue/index.html` renders a hardcoded snapshot of the May queue (REQ-0507 still
shows as `submitted`, SLA badges still read "Today 17:00", "May 26"). It does not
read `queue-state/requests.yaml` despite the footer saying so. Left untouched —
rewriting the showcase view to display 80-day breaches is a product decision, not
a routing one.

## 8. Handoff

Delegated to the Workflow Agent: owner assignment and ticket creation for
REQ-2026-0507, breach escalation to team leads for all five breached requests,
and a disposition check on the stale block. Requester acknowledgement to Leo Kim
is held until an owner exists — an acknowledgement naming no owner is worse than
a slightly later one that does.
