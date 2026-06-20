---
id: ADR-007
title: Use event sourcing for the audit log
date: 2026-02-14
status: Accepted
author: Riku Tanaka
---

## Context

Enterprise customers and compliance teams require a tamper-evident, complete audit log of all state-changing operations: user actions, permission changes, data exports, and admin overrides. The current approach — writing a summary row to an `audit_log` PostgreSQL table on each mutation — has three problems:

1. **Incompleteness:** Audit entries are written by application code, not the database. Code paths that bypass the ORM (raw SQL, migrations, background jobs) produce no audit entries, creating gaps that auditors flag.
2. **Mutability:** Rows in the `audit_log` table can be updated or deleted by anyone with database write access. This fails the tamper-evidence requirement for SOC 2 Type II and the Meridian contract addendum.
3. **Poor queryability for reconstructions:** Auditors frequently ask "what was the state of workspace X at time T?" The current table stores events but not enough context to replay state.

The decision covers the audit log exclusively — not the primary event bus (see ADR-005, which adopted Kafka for async events).

## Decision

We will adopt **event sourcing** for the audit log, implemented as an append-only event stream written to a dedicated `audit_events` table in PostgreSQL, with the following constraints:

- Rows in `audit_events` are insert-only; no UPDATE or DELETE is permitted via a PostgreSQL row-level policy.
- Each event is a structured JSON payload: `event_type`, `actor_id`, `resource_type`, `resource_id`, `before_state` (nullable), `after_state`, `timestamp`, `trace_id`.
- Events are written inside the same database transaction as the mutation they record. Audit failure = mutation failure.
- A read-model projection job (running on Kafka) replays the event stream to maintain a queryable `audit_projections` table for the UI.
- The event stream is replicated to an immutable S3 bucket (Object Lock, Compliance mode, 7-year retention) on a 15-minute schedule for off-database tamper evidence.

## Consequences

### Positive
- Audit entries are written transactionally with mutations — no missed events from code paths that bypass the ORM.
- The append-only constraint and S3 Object Lock satisfy the tamper-evidence requirement for SOC 2 Type II and the Meridian addendum.
- The event payload structure enables state reconstruction at any point in time.
- Aligns with the existing Kafka event bus (ADR-005) — the projection job is a standard consumer.

### Negative / Risks
- **Write amplification:** Every mutation now writes two records (the mutation + the audit event) in the same transaction. Expected p99 latency impact: +8–12ms on write-heavy paths. Acceptable given audit requirements.
- **Schema evolution:** The JSON payload schema must be versioned. Adding or removing fields in `before_state`/`after_state` requires a migration strategy. We will use the `schema_version` field and a migration runner.
- **S3 replication lag:** The 15-minute replication window means very recent events may not be in S3 during a forensic investigation. Documented as a known limitation; primary evidence is always the `audit_events` table.

### Neutral
- The `audit_log` table remains for the transition period (6 months) while teams migrate their audit-write code to the new event model. It will be deprecated in ADR revision after migration is complete.

## Alternatives Considered

**Write to Kafka directly (append-only topic):** Rejected because Kafka topic retention is time-based, not compliance-duration-based. Configuring a compliance-retention Kafka topic adds operational complexity and still requires an S3 sink. PostgreSQL with a row-level insert policy and a separate S3 sink gives us the same guarantees with less infrastructure.

**Use a dedicated audit database (e.g., Amazon QLDB):** Rejected because QLDB is a managed service with no self-hosted option. The Meridian contract requires the option to run in a dedicated private cloud without third-party managed services. Rejected on data-residency grounds.

**Keep the existing audit_log table with soft-delete protection:** Rejected because soft-delete protection (logical delete flags) does not satisfy the tamper-evidence requirement — an admin with write access can still overwrite field values. Does not address incompleteness from bypass code paths.

## Related ADRs

- ADR-001 — PostgreSQL is the primary operational database; the `audit_events` table lives there.
- ADR-005 — Kafka event bus; the projection job is a standard consumer of the audit event stream.
- ADR-006 — Terraform provisions the S3 Object Lock bucket for audit archival.
