# ESC-2026-0047 — Atlas Logistics · API Import Outage

**ID:** ESC-2026-0047  
**Customer:** Atlas Logistics  
**ARR:** $210,000  
**Renewal:** July 1, 2026 (39 days)  
**Severity:** P1  
**Trigger:** Zendesk ticket #48821 — "Bulk import API returning 504 timeout on all jobs > 5,000 rows"  
**Opened:** 2026-05-18 14:22 UTC  
**Escalation Owner:** James R. (CSM)  
**Status:** Engineering fix in review — deploy expected May 24  

---

## Executive Summary

Atlas Logistics's bulk import API has been returning 504 timeouts for all jobs exceeding 5,000 rows since May 18, blocking their nightly inventory sync (affecting 140 warehouse users and pausing ~$1.2M/day of logistics operations). Engineering has identified a memory allocation regression in the 6.11.2 release and a fix is in code review — deploy expected May 24. Customer executive sponsor has been notified; next update scheduled May 23 at 15:00 UTC.

---

## Customer Impact

- **Users affected:** 140 warehouse operations users (full team)
- **Revenue at risk:** ~$1.2M/day logistics operations paused (customer estimate)
- **SLA breach:** Yes — P1 SLA = 4-hour response, 24-hour resolution; resolution is at 5 days
- **Renewal impact:** Account is At-Risk tier, renewal July 1 (39 days) — this incident is a churn accelerator
