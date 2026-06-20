---
title: Content Calendar Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [marketing, content, social-media, calendar, enterprise, cabinet]
order: 1
---
# Content Calendar Cabinet

A single pipeline for every piece of content: blog posts, social posts, newsletters, videos. Plan it, draft it, schedule it, track performance — all as files your team can open, edit, and forward. The Content Writer drafts on brief; the Content Workflow agent manages the pipeline, chases approvals, and surfaces what's performing.

> **Keep your CMS, your social scheduler, your Drive. Replace the Airtable planning board nobody updates, the Buffer queue that loses context, and the "what's going out this week?" Slack thread.**

## The team

- **[[.agents/content-workflow]]** — Content Workflow Manager. Lead orchestrator. Owns the calendar pipeline, approvals cadence, and weekly performance digest. Sequences the Writer and publishes status.
- **[[.agents/content-writer]]** — Content Writer. Drafts all content from briefs — blog, social, newsletter, video scripts. Writes to brief, iterates fast.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-content-plan]] | Content Workflow | Updated pipeline in [[calendar]], next-week draft queue |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-performance-digest]] | Content Workflow | Performance digest in `performance/weekly-<date>.md` |

## How to run the demo

1. Open [[calendar]] — the content pipeline: posts by status (Idea → Draft → Scheduled → Published), by channel, with owners and performance of recent posts.
2. Browse `posts/` — each post is a markdown file with frontmatter: channel, status, publish date, owner, brief, and copy.
3. Skim `performance/` — weekly digests of what performed and what to repeat or kill.

## Connectors

**Required:** Google Docs / Drive (copy drafts), CMS (WordPress, Webflow, etc.), social scheduler (Buffer, Hootsuite, or native).
**Recommended:** Google Analytics / Search Console (traffic per post), Notion (editorial roadmap), Slack (`#content` approvals channel), Airtable (content brief templates).
