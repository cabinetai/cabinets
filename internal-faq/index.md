---
title: Internal FAQ
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags:
  - faq
  - hr
  - it
  - policies
  - employees
  - enterprise
  - cabinet
order: 1
---
# Internal FAQ

Lets every employee get instant, sourced answers to HR, IT, finance, and policy questions — without opening a ticket, asking on Slack, or waiting for HR to reply. The FAQ Researcher indexes source documents and generates authoritative Q&A entries; the QA Agent validates accuracy, flags gaps where no good answer exists, and surfaces the top questions employees actually ask. Every answer traces back to a source document.

> **Keep your HR system, IT service desk, and policy docs. Replace the Confluence FAQ pages nobody maintains, the Guru cards nobody reads, and the "#ask-hr" threads that answer the same 20 questions every week.**

## The team

- **[[.agents/faq-researcher]]** — FAQ Researcher (lead). Indexes source documents, generates and updates Q&A entries, orchestrates the QA Agent's validation pass.
- **[[.agents/qa-agent]]** — QA Agent. Validates answers against source docs, flags gaps and contradictions, and produces the weekly gap analysis.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/faq-gap-analysis]] | FAQ Researcher → QA Agent | Gap report: questions with no good answer, stale answers, contradictions |
| **Weekly** (Mon 09:00) | [[.jobs/top-questions-digest]] | QA Agent | Top-10 questions digest by category, trend vs prior week |

## How to run the demo

1. Open the [[hub]] — the internal FAQ hub: Q&A cards by category (HR/IT/Finance/Product), search, most-asked, recently-added, source-doc links, and gaps where no answer exists.
2. Browse `faq/entries.yaml` — the Q&A dataset the hub renders.
3. Read `faq/gap-report.md` — the weekly gap analysis output.

## Connectors

**Required:** HR policy documents (Drive/SharePoint), IT knowledge base, company handbook.
**Recommended:** Notion/Confluence (existing FAQs to import), Slack (question ingestion from #ask-hr etc.), Jira Service Desk (open ticket patterns).
