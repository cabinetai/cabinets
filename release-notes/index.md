---
title: Release Notes Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [engineering, release-notes, changelog, devrel, pmm, cabinet]
order: 1
---
# Release Notes Cabinet

Turns every release cycle into polished, versioned release notes — internal technical summaries for the team and customer-facing copy for the changelog or email — without anyone writing them manually. The Engineering Agent classifies merged PRs and closed issues; the Writer Agent turns them into two audiences' worth of copy in one pass.

> **Keep your GitHub and Jira. Replace the manual changelog, the rushed release email, and the "someone write the release notes" ask the day before GA.**

## The team

- **[[.agents/engineering-agent]]** — Engineering Agent. Owns PR and issue ingestion: pulls merged PRs, closed issues, and deploy tags from GitHub/Jira since the last release cut. Classifies each change as Feature / Improvement / Fix / Internal. Hands the classified set to the Writer Agent.
- **[[.agents/writer-agent]]** — Writer Agent. Turns the classified change set into customer-facing and internal release notes. Writes to `[[changelog]]` and `releases/`. Keeps the external copy free of internal jargon; the internal copy annotated with PR links and owners.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **On-demand** (per release) | [[.jobs/per-release-notes]] | Engineering Agent → Writer Agent | Release notes in [[changelog]] + `releases/<version>.md` |
| **Weekly** (Mon 08:00) | [[.jobs/weekly-changelog-compile]] | Writer Agent | Weekly changelog digest in `releases/weekly-digest.md` |

## How to run the demo

1. Open the [[changelog]] — the versioned release notes page with Features / Improvements / Fixes, internal/external toggle, and per-item PR links.
2. Open `releases/v2.4.1.md` — the markdown artifact for the last demo release.

## Connectors

**Required:** GitHub (merged PRs, release tags), Jira or Linear (completed issues linked to PRs).
**Recommended:** GitLab (alternative to GitHub), Notion or Confluence (publish internal notes there), Slack (post release summary to `#releases`).

Every artifact is a file — versioned Markdown in `releases/`, diff-able, forwardable, and feedable into the next release cycle.
