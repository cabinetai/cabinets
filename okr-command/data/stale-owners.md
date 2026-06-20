# Stale Owners Log

_Maintained by the OKR Workflow Agent. An owner lands here when their KR has no
current-week numeric update by the Friday 15:00 sweep. Two consecutive misses
escalate to the OKR Analyst._

---

## Sweep 2026-06-19 (Week 25 — Week 12 of quarter)

**Connectivity note:** This is the **second consecutive sweep with no live
connections** to Jira, Salesforce, or Sheets, and Slack remains unreachable, so
again no KR could be auto-pulled and the nudges below remain **queued, not
sent**. The Week 24 nudges (2026-06-12) were never delivered either — they carry
over here. Last verified data for every KR is still 2026-05-23, now a ~4-week
gap (weeks 22–23 had no sweep; weeks 24–25 had no connectivity). No values were
inferred; all are carried forward unchanged. The outage itself is escalated as
**ESC-PIPELINE** in data/blockers.md — it is the root cause for all 9 rows below.

| KR | Owner | Last-known value | Last verified | Usual source | Nudge status |
|---|---|---|---|---|---|
| KR-1.1 | Sarah Chen | 2,180,000 USD | 2026-05-23 | salesforce | queued — Slack unreachable (2nd wk) |
| KR-1.2 | James Liu | 5 contracts | 2026-05-23 | salesforce | queued — Slack unreachable (2nd wk) |
| KR-1.3 | Sarah Chen | 51 days | 2026-05-23 | salesforce | queued — Slack unreachable (2nd wk) |
| KR-2.1 | Priya Nair | 47 accounts | 2026-05-23 | jira | queued — Slack unreachable (2nd wk) |
| KR-2.2 | Tom Bergmann | 38 NPS | 2026-05-23 | owner-stated | queued — Slack unreachable (2nd wk) |
| KR-2.3 | Ana Kowalski | 7 bugs | 2026-05-23 | jira | queued — Slack unreachable (2nd wk) |
| KR-3.1 | Rania Al-Hassan | 6 hires | 2026-05-23 | owner-stated | queued — Slack unreachable (2nd wk) |
| KR-3.2 | Dev Patel | 68 percent | 2026-05-23 | sheets | queued — Slack unreachable (2nd wk) |
| KR-3.3 | Marcus Webb | 9 percent | 2026-05-23 | sheets | queued — Slack unreachable (2nd wk) |

**Escalated to OKR Analyst:** the **pipeline outage (ESC-PIPELINE)** as the
top-line item, plus the two red KRs — Sarah Chen (KR-1.3) and Rania Al-Hassan
(KR-3.1) — whose blocker decision deadlines (May 28, May 26) have passed and
whose data is now ~4 weeks stale. As with last week, every miss here is
**agent-side** (no connectivity → no nudge sent), not owner non-response, so no
owner is being marked non-responsive. Re-nudge all 9 owners the moment Slack
connectivity is restored.

---

## Sweep 2026-06-12 (Week 24 — Week 11 of quarter)

**Connectivity note:** No live connections to Jira, Salesforce, or Sheets were
available during this sweep, so no KR could be auto-pulled. Slack was also
unreachable, so the nudges below are **queued, not sent** — they must go out as
soon as Slack connectivity is restored. No sweep ran in Week 22 (May 30) or
Week 23 (Jun 6), so every value on the board is carried forward from 2026-05-23.

| KR | Owner | Last-known value | Last verified | Usual source | Nudge status |
|---|---|---|---|---|---|
| KR-1.1 | Sarah Chen | 2,180,000 USD | 2026-05-23 | salesforce | queued — Slack unreachable |
| KR-1.2 | James Liu | 5 contracts | 2026-05-23 | salesforce | queued — Slack unreachable |
| KR-1.3 | Sarah Chen | 51 days | 2026-05-23 | salesforce | queued — Slack unreachable |
| KR-2.1 | Priya Nair | 47 accounts | 2026-05-23 | jira | queued — Slack unreachable |
| KR-2.2 | Tom Bergmann | 38 NPS | 2026-05-23 | owner-stated | queued — Slack unreachable |
| KR-2.3 | Ana Kowalski | 7 bugs | 2026-05-23 | jira | queued — Slack unreachable |
| KR-3.1 | Rania Al-Hassan | 6 hires | 2026-05-23 | owner-stated | queued — Slack unreachable |
| KR-3.2 | Dev Patel | 68 percent | 2026-05-23 | sheets | queued — Slack unreachable |
| KR-3.3 | Marcus Webb | 9 percent | 2026-05-23 | sheets | queued — Slack unreachable |

**Escalated to OKR Analyst:** Sarah Chen (KR-1.3) and Rania Al-Hassan (KR-3.1) —
both KRs are red (confidence 2), their blocker decision deadlines (May 28 and
May 26) have passed with no recorded resolution, and no data update has been
received for 3 weeks. Note the missed-sweep weeks were an agent-side gap, not
owner non-response — but the data staleness on red KRs warrants Analyst
attention before Monday's narrative.
