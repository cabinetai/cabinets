---
title: Notion Project Status
created: '2026-08-09T00:00:00Z'
modified: '2026-09-25T00:00:00Z'
tags: [notion, projects, status, tracking, showcase]
order: 1
---
# Notion Project Status

Every open project your team keeps in Notion, at a glance: late, at risk or on track, with who owns
it, when it is due and what changed since last week.

## What you get

**Projects at a glance** opens first. It shows:
- the big numbers;
- every project with its owner and due date;
- what each stuck project is waiting on;
- the projects with no owner or no date.

Tap a project to see why, and what to do next.

Ask anything in the box, or tap an idea: a weekly status email for the team, everything overdue
and who owns it, a client-ready update. The Project Tracker answers in the chat beside the page.
It proposes a routine only when you ask for one, and it runs only after you say yes.

It only reads Notion. It never changes a page, adds a comment or writes a status back.

## Connecting Notion

Press **Connect Notion** on the page and sign in to Notion. Cabinet can then see the pages you can
see in the Notion you pick when you sign in. Until then, the page shows a made-up company and says
so.

To stop, disconnect Notion from Cabinet's Integrations page.

## For the curious

The routine, Morning Project Status, runs every weekday at 8:00. **Check now** on the page runs it
straight away. It writes three files in `project-status/data/`:
- `latest.json`, which the page draws;
- `latest.md`, the same board as a page;
- `history.json`, earlier checks, used to tell what changed.

`EXAMPLE-latest.json` is the made-up example.

```json
{
  "generatedAt": "2026-09-25T08:02:00-04:00",
  "previousAt": "2026-09-18T08:01:00-04:00",
  "business": "Hartwell Heating & Air",
  "projects": [
    {
      "name": "Rooftop unit replacement",
      "client": "Oakwood Middle School",
      "status": "late",
      "lastWeek": "at-risk",
      "owner": "Tyler Brooks",
      "due": "2026-09-21",
      "why": "The new unit is on site, but the crane to lift it onto the roof is not booked.",
      "next": "Call the crane company and lock in a lift date.",
      "blocker": "The crane company to confirm a lift date.",
      "edited": "2026-09-23",
      "where": "Jobs",
      "url": "https://www.notion.so/..."
    }
  ],
  "changes": [
    { "kind": "worse", "text": "Rooftop unit replacement for Oakwood Middle School went from at risk to late.", "url": "https://www.notion.so/..." }
  ]
}
```

`status` and `lastWeek` are `late`, `at-risk` or `on-track`. `client`, `owner`, `due`,
`blocker`, `lastWeek` and `previousAt` may be `null`. A change's `kind` is `worse`, `better`,
`new` or `done`.
