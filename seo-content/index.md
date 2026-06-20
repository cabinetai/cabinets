---
title: SEO Content Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [marketing, seo, content, keywords, rankings, enterprise, cabinet]
order: 1
---
# SEO Content Cabinet

Keyword research, content briefs, competitor SERP analysis, ranking history, and content refresh tasks — all as files your team can open, diff, and act on. The SEO Researcher surfaces opportunities and gaps; the SEO Writer turns them into briefs and refreshes that actually rank.

> **Keep Search Console, Ahrefs, and your CMS. Replace the keyword spreadsheet nobody can find, the brief-in-Docs that's 18 months stale, and the quarterly "which pages need love?" panic.**

## The team

- **[[.agents/seo-researcher]]** — SEO Researcher. Lead orchestrator. Owns keyword tracking, competitor SERP analysis, and the weekly ranking check. Identifies opportunities and prioritizes refresh tasks. Sequences the Writer.
- **[[.agents/seo-writer]]** — SEO Writer. Writes content briefs, optimizes existing pages for refresh, and drafts new SEO content from research output.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-ranking-check]] | SEO Researcher | Ranking report in `rankings/weekly-<date>.md` + workspace update |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-refresh-review]] | SEO Researcher → Writer | Refresh task queue in `refresh/queue.md` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-competitor-serp]] | SEO Researcher | Competitor SERP/content gaps in `competitor-watch/` |

## How to run the demo

1. Open [[seo-workspace]] — the SEO command center: keyword table with volume/difficulty/rank/target/status, content brief preview, and pages needing refresh.
2. Browse `keywords/tracked.md` — the full tracked keyword set with current rankings and targets.
3. Open `briefs/` — content briefs the Writer has produced, each a standalone file with structure and outline.
4. Check `refresh/queue.md` — prioritized list of pages to update, with rank drop and opportunity score.

## Competitor watch

This cabinet includes a weekly competitor SERP and content gap watch. For the full competitive landscape (positioning, pricing, product), see the flagship **[[../competitive-intelligence]]** cabinet. For the marketing-lens competitor analysis, see **[[../competitive-marketing]]**.

## Connectors

**Required:** Google Search Console (ranking data), CMS (WordPress, Webflow — publish refreshed pages).
**Recommended:** Ahrefs or Semrush (keyword difficulty, competitor domains), Clearscope or Surfer (content scoring), Google Analytics (traffic per page), Google Drive (brief sharing).
