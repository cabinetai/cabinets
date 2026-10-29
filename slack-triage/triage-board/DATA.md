---
title: How the Triage Board gets its requests
---
# How the Triage Board gets its requests

The board never talks to Slack. The Triage Desk's routines read Slack and write plain
markdown files in this cabinet, and the board shows them. The exact shape of each file, and
the closed words in it, are in the agent's persona (`.agents/triage-desk/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `triage/<YYYY-MM-DD>T<HH-MM-SS>-triage.md` | Support Triage, weekdays at 9, 13 and 17 | One pass: the whole board. Frontmatter `headline`, `lead`, `verdict`, `source`, `generated`, `status`, then one table: `Item`, `Needs`, `Owner`, `Status` (New, Owned, Waiting, Done), `Opened`, `URL`. The newest is the board; older ones fill the Pass picker. |
| `triage/EXAMPLE-triage.md` | Nobody (it ships with the template) | A made-up Northwind channel in the same shape. Shown, marked as an example, until the first real pass. The first run that reaches Slack deletes it. |
| `nudges/<YYYY-MM-DD>-nudge.md` | Desk Nudge, weekdays at 11 | What the day's nudge did, per channel: `Channel`, `Outcome` (Posted, Off (channel is Read), Already nudged today, Not posted), `Items`, `Message` (the permalink). The newest one is the nudge line under the title. |
| `patterns/<YYYY-MM-DD>-patterns.md` | Weekly Patterns, Fridays at 16 | The week's look back: frontmatter `headline`, `week`, `requests`, then `Kind`, `Count`, `Typical wait`, `Example`, `Suggestion`. The newest one is the Weekly patterns section. |
| `patterns/EXAMPLE-patterns.md` | Nobody (it ships with the template) | The made-up week, shown with the example. |
| `desk-rules.md` | The person, or the agent in the chat on their word | The team's settings in frontmatter. The board reads `nudgeAfterHours` to flag a New request nobody took. |
| `saved-replies/*.md`, `docs/*.md` | The agent, when asked from a weekly pattern | Pages the desk drafts answers from. The board does not show them. |

The board reads these files through Cabinet (`cabinet.files`), so it works for everyone the
cabinet is shared with, and repaints when a routine writes a new one. When Slack is
connected, the routine line, Run now and Try again come from Cabinet's own view of the
three routines, not from a file.

Each person's layout (which parts they hid) is kept in Cabinet for them, not in a file
here. The buttons on the cards only open the chat with a request. Nothing on the board
posts to Slack, reacts or changes anything there.
