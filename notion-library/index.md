---
title: Notion Library
created: '2026-08-09T00:00:00Z'
modified: '2026-09-25T00:00:00Z'
tags: [notion, pages, documents, library, showcase]
order: 1
---
# Notion Library

Your company's knowledge at a glance: the procedures, client pages, policies, projects and meeting notes your team keeps in Notion. See what changed this week and which procedures and policies may be out of date, and ask anything, like "What is our refund policy?"

Open the **Company knowledge** app to see it. Until Notion is connected, it shows a made-up company, Hartwell Heating & Air, clearly marked as an example.

## Connect Notion

Press **Connect Notion** in the app and sign in to Notion. If you have more than one Notion, pick the one your team uses. Cabinet can then read the pages you can see there. Your first overview is ready a few minutes later, and a fresh one comes every Monday morning. Press Refresh for a new one any time.

## Ideas to try

Build an employee handbook, turn this week's meeting notes into action items, build a client directory, send the team a Monday update, or find pages that contradict each other. Each idea in the app is one press. Some can also run every Monday or every month: the librarian proposes it in the chat, and you approve it there.

## It only reads

The librarian never creates, changes, moves or deletes anything in Notion. To stop, disconnect Notion on Cabinet's Integrations page.

## For the curious

Every Monday the librarian writes `library/data/latest.json` for the app and a short page to read, `library/data/latest.md` (what changed and what may be out of date). The data file holds `generatedAt`, `company` (when Notion shows it), `total`, `areas` (a count per area: Procedures, Clients, Policies, Projects, Meeting notes, Other), `pages` (newest first, at most 40) and `stale` (procedures and policies not edited in 180 days, oldest first). Each page has `title`, `type`, `area`, `about`, `where`, `edited`, `editor` and `url`. The made-up company lives in `library/data/EXAMPLE-latest.json`.
