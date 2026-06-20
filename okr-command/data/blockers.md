# Blockers Register — Q2 2026

_Updated automatically by the OKR Workflow Agent every Friday._

---

## Active Blockers

### BLK-001 · KR-1.3 · Sales Cycle Length
- **KR:** Reduce average sales cycle to <45 days (current: 51 days)
- **Confidence:** 2 — Red
- **Type:** dependency
- **Description:** Legal review SLA averaging 12 days per deal. GC team is understaffed; standard contracts are queued behind complex enterprise deals.
- **Recommended action:** Introduce pre-approved redline templates for deals <$50K to bypass GC queue. Decision needed from General Counsel by May 28.
- **Owner:** Sarah Chen (Revenue)
- **Weeks red:** 2 as of last verified data (2026-05-23); still no fresh data weeks 22–25 (~4-week gap)
- **Status:** open — ⚠️ GC decision deadline (May 28) passed with no recorded resolution; escalated to OKR Analyst 2026-06-12, escalation re-affirmed 2026-06-19. Cannot confirm or close: 2nd consecutive sweep with no Salesforce or Slack connectivity, so neither a system pull nor an owner reply was possible.

---

### BLK-002 · KR-3.1 · Headcount
- **KR:** Hire 14 net-new headcount across Eng and CS (current: 6/14)
- **Confidence:** 2 — Red
- **Type:** clarity
- **Description:** 4 Senior SWE job descriptions are awaiting legal sign-off for 11 days. Recruiter cannot post without approved JDs. 2 CS roles are unblocked.
- **Recommended action:** Expedite legal review for the SWE JDs (low legal risk — standard roles). Decision needed from Chief of Staff by May 26.
- **Owner:** Rania Al-Hassan (People)
- **Weeks red:** 1 as of last verified data (2026-05-23); still no fresh data weeks 22–25 (~4-week gap)
- **Status:** open — ⚠️ Chief of Staff decision deadline (May 26) passed with no recorded resolution; escalated to OKR Analyst 2026-06-12, escalation re-affirmed 2026-06-19. Cannot confirm or close: 2nd consecutive sweep with no owner-stated update possible (Slack unreachable).

---

### BLK-003 · KR-3.3 · Tool Spend Reduction
- **KR:** Reduce tool-stack spend by 15% (current: 9%)
- **Confidence:** 3 — Amber
- **Type:** resource
- **Description:** Contract negotiations with 3 vendors (Figma, Zendesk, Datadog) stalled pending CFO sign-off on revised terms. Savings of ~$180K/yr are available but not captured.
- **Recommended action:** CFO to approve negotiated terms this week. If delay continues, flag as Q2 miss and carry to Q3.
- **Owner:** Marcus Webb (Operations)
- **Weeks amber:** 3 as of last verified data (2026-05-23); still no fresh data weeks 22–25 (~4-week gap)
- **Status:** in-progress — no update since 2026-05-23; CFO sign-off still unconfirmed as of 2026-06-19 sweep (Sheets and Slack both unreachable for a 2nd consecutive week)

---

## Escalation Log

### ⛔ ESC-PIPELINE · OKR data pipeline outage (escalated 2026-06-19)
- **What:** The Workflow Agent has now run **two consecutive Friday sweeps (2026-06-12 and 2026-06-19) with zero connectivity** to Jira, Salesforce, Sheets, and Slack. Weeks 22–23 had no sweep at all. Net effect: the board carries **2026-05-23 data into Monday — a ~4-week gap** — and not one of the 9 owner nudges queued on 2026-06-12 could be sent.
- **Type:** external (tooling/integrations) — agent-side, NOT owner non-response.
- **Why it matters:** This is the single largest risk to Monday's narrative. Every RAG and confidence call the OKR Analyst makes this week rests on month-old numbers; the two red KRs below can be neither confirmed nor cleared until data flows again.
- **Recommended action:** Cabinet operator to restore the Jira / Salesforce / Sheets / Slack connections before the next sweep, then re-run the sweep out-of-band if Monday's read needs fresh numbers. OKR Analyst to caveat Monday's narrative explicitly as "data as of 2026-05-23, unverified for ~4 weeks."
- **Status:** open — root-cause blocker for all 9 KRs.

### Owner escalations

| KR | Owner | Consecutive misses | Last data | Note |
|---|---|---|---|---|
| KR-1.3 | Sarah Chen | 2 sweeps run w/o data (w24, w25); ~4-week gap* | 2026-05-23 | Red, conf 2; GC deadline (May 28) passed |
| KR-3.1 | Rania Al-Hassan | 2 sweeps run w/o data (w24, w25); ~4-week gap* | 2026-05-23 | Red, conf 2; CoS deadline (May 26) passed |

\* Caveat: weeks 22–23 had no sweep, and the week 24–25 sweeps had no
Slack/Jira/Salesforce/Sheets connectivity, so these owners were **never
nudged** — the gap is agent-side (see ESC-PIPELINE above), not owner
non-response. They are escalated because their KRs are red (confidence 2) with
passed decision deadlines and now ~4-week-stale data going into Monday's
narrative. The other 7 owners share the identical data gap but their KRs are
amber/green; all 9 are logged in data/stale-owners.md. **No owner should be
marked non-responsive while the pipeline is down** — restore connectivity and
re-nudge before attributing any miss to an owner.

---

## Resolved This Quarter

| BLK | KR | Resolution | Date |
|---|---|---|---|
| BLK-000 | KR-2.3 | P1 bug backlog cleared — Ana's team resolved 6 in sprint 9 | 2026-05-16 |
