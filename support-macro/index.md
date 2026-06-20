---
title: Support Macro Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [support, macros, canned-responses, support-ops, enterprise, cabinet]
order: 1
---
# Support Macro Cabinet

Two agents generate reusable support macros from live ticket clusters, QA each macro for tone, accuracy, and link freshness, and publish a maintained macro library — so every support rep pulls a reviewed, on-brand reply instead of writing from scratch or copying a three-year-old snippet. Every macro, every QA pass, and every usage report is a file your support ops team can inspect and approve.

> **Keep Zendesk macros or Intercom snippets. Replace the outdated canned responses, the Google Doc nobody updates, and the tone drift nobody catches until a customer complains.**

## Why this template

Macro libraries drift. Responses that were accurate at launch reference deprecated features, old pricing, or dead links within months. Meanwhile, high-volume new ticket patterns — API errors, billing confusion, mobile bugs — don't get macros at all, so reps improvise. This cabinet makes macro maintenance a **scheduled operation**: new macros are drafted from real clusters, existing ones are QA'd for freshness weekly, and usage data tells you which macros to invest in.

## The team

- **[[.agents/macro-writer]]** — Macro Writer. Lead agent. Drafts new macros from ticket cluster data using customer-tested language, updates the macro registry, and sequences the weekly coverage review. Owns the macro library.
- **[[.agents/macro-qa]]** — Macro QA Reviewer. Audits existing macros for accuracy, tone, broken links, and outdated product references. Does not write macros — flags and returns them to the Writer for revision.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-macro-coverage-review]] | Macro Writer | New macro drafts for uncovered clusters; usage report |
| **Weekly** (Fri 16:00) | [[.jobs/weekly-macro-freshness-qa]] | Macro QA Reviewer | QA report + macros flagged for revision or retirement |

## How to run the demo

1. Open the [[macro-library]] — categorised canned responses with usage frequency, last-updated date, linked ticket cluster, and tone/QA status. Includes search and filter.
2. Browse `/macros/` — each macro as an individual markdown file with metadata, body text, and QA history.
3. Open `/macro-registry.md` — the canonical registry: all macros, status, cluster linkage, and last QA date.

## Connectors

**Required:** Zendesk or Intercom (ticket source for cluster data; macro publish destination).
**Recommended:** Knowledge base / Help Center (link macros to full articles), Slack (`#support-macros` for weekly QA summaries).

## Macro library snapshot (demo data)

| Macro | Category | Usage (7d) | QA Status | Last Updated |
|---|---|---|---|---|
| Billing — invoice explanation | Billing | 89 | Passed | 2026-05-01 |
| SSO setup — Okta walkthrough | Onboarding | 47 | Passed | 2026-04-15 |
| API rate limit — hit 429 error | Technical | 38 | Needs update | 2026-02-10 |
| Password reset — manual trigger | Account | 31 | Passed | 2026-05-10 |
| CSV export — row limit workaround | Technical | 24 | Draft | — |
| Refund request — standard | Billing | 22 | Passed | 2026-03-20 |
| iOS login loop — known issue | Mobile | 18 | Draft | — |

**Every macro in `/macros/` carries a QA stamp, a cluster link, and a reason it was written.**
