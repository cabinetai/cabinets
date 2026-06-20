---
title: Help Center Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [support, knowledge-base, help-center, content, enterprise, cabinet]
order: 1
---
# Help Center Cabinet

Two agents scan incoming tickets for unanswered questions, draft new help articles from customer language, and flag existing articles that need updating after product releases — so your knowledge base stays accurate and your deflection rate keeps climbing. Every draft, every gap flag, and every stale-article review is a file your team can approve and publish.

> **Keep Zendesk Guide or Intercom Articles. Replace the coverage gaps nobody tracks, the articles that went stale after the last release, and the "support wrote it once in 2022" docs customers still hit.**

## Why this template

Knowledge bases degrade the day after a release. Support teams know which questions keep coming — but rarely have the bandwidth to turn them into articles. This cabinet makes help content a **standing operation**: gaps are identified weekly from real ticket data, drafts are written in the same language customers use, and stale articles are flagged before they generate a ticket.

## The team

- **[[.agents/product-liaison]]** — Product Liaison. Monitors release notes and product changelogs; flags which existing articles are invalidated or need updating. Does not write articles.
- **[[.agents/content-writer]]** — Content Writer. Lead agent. Drafts new articles from ticket cluster data, updates flagged articles, tracks coverage gaps, and maintains the article status registry. Sequences the full loop.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-gap-analysis]] | Content Writer | New article drafts in `/drafts/`, updated gap registry |
| **Weekly** (Fri 16:00) | [[.jobs/weekly-stale-sweep]] | Product Liaison → Content Writer | Stale article list + update drafts for post-release changes |

## How to run the demo

1. Open the [[content-workspace]] — article list with status (draft/published/stale), coverage gaps from top tickets, and articles needing update after recent releases.
2. Browse `/drafts/` — article drafts the Writer agent produces, ready for human review and publish.
3. Open `/article-registry.md` — the canonical list of all articles with status, last-updated date, and linked ticket cluster.

## Connectors

**Required:** Zendesk or Intercom (ticket source for gap analysis), Zendesk Guide or Intercom Articles (publish destination).
**Recommended:** Product changelog or release notes feed, Notion or Confluence (internal docs to pull product detail from), Slack (`#help-center-updates` for publish notifications).

## Article coverage (demo data)

| Article | Status | Ticket Hits (7d) | Last Updated |
|---|---|---|---|
| Setting up SSO with Okta | Published | 34 | 2026-03-12 |
| API rate limits explained | Draft | 28 | — |
| Exporting data to CSV | Published | 21 | 2026-01-08 — **Stale** |
| Billing — changing payment method | Published | 19 | 2026-04-01 |
| iOS app — troubleshooting login | Draft | 16 | — |
| Workspace roles and permissions | Published | 14 | 2025-11-20 — **Stale** |

**Drafts in `/drafts/` are written from real ticket language, not from the inside out.**
