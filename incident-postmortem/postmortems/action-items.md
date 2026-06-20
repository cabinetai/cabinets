# Postmortem Action Items Register

Last updated: 2026-05-23

| Incident | Action | Owner | Due | Ticket | Status |
|---|---|---|---|---|---|
| INC-2026-047 | Add Datadog monitor: payment-service p99 latency > 500ms, page on-call | Maya Chen | 2026-06-01 | ENG-5511 | open |
| INC-2026-047 | Add circuit breaker between checkout-service and payment-service | Riku Tanaka | 2026-06-08 | ENG-5512 | in-progress |
| INC-2026-047 | Load test payment-service at 3× peak traffic before next release | Priya Nair | 2026-06-15 | ENG-5513 | open |
| INC-2026-047 | Write runbook: payment-service degraded — manual fallback steps | Maya Chen | 2026-05-30 | ENG-5514 | open |
| INC-2026-039 | Upgrade Redis client to 4.x (fixes known reconnect bug) | Lucas Ferreira | 2026-05-28 | ENG-5488 | done (2026-05-20) |
| INC-2026-039 | Increase Redis connection pool max to 50 | Lucas Ferreira | 2026-05-28 | ENG-5489 | done (2026-05-21) |
| INC-2026-031 | Add synthetic canary monitor for checkout end-to-end flow | Priya Nair | 2026-05-31 | ENG-5451 | open |
