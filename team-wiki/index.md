---
title: Team Wiki
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags:
  - team-wiki
  - team-ops
  - projects
  - rituals
  - enterprise
  - cabinet
order: 1
---
# Team Wiki

A living team page that is always current: member responsibilities, active projects, rituals and cadences, key doc links, and on-call/ownership mapping — maintained by agents so team leads don't have to. The Wiki Summarizer processes project updates and doc changes weekly; the Wiki Workflow agent tracks project status and rolls it up for the team lead. Every piece of team knowledge is a file you can link to, diff, and send.

> **Keep your project tools, Slack, and Google Drive. Replace the stale Notion team page nobody touches, the Confluence space that's three versions behind, and the "who owns X?" DMs sent every sprint.**

## The team

- **[[.agents/wiki-summarizer]]** — Wiki Summarizer (lead). Owns the weekly freshness check, summarises project updates from connected tools, and keeps the team wiki current.
- **[[.agents/wiki-workflow]]** — Wiki Workflow. Tracks active project statuses, aggregates blockers and milestones, and produces the weekly project roll-up.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/wiki-freshness-check]] | Wiki Summarizer | Freshness report; updated team wiki page; stale section flags |
| **Weekly** (Mon 09:00) | [[.jobs/project-status-rollup]] | Wiki Workflow | Project status roll-up: milestones, blockers, owners, RAG status |

## How to run the demo

1. Open the [[wiki]] — the team wiki: team header and mission, members and responsibilities, active projects, rituals and cadences, key doc links, and on-call/ownership table.
2. Browse `team/members.yaml` — the team roster and responsibility map.
3. Read `team/projects.yaml` — the active project list with status the roll-up job maintains.

## Connectors

**Required:** Google Drive (team docs), Slack (project channels for update ingestion).
**Recommended:** Jira or Linear (project/issue data), GitHub (PR and milestone activity), Notion (existing team page to migrate from).
