---
title: How Slack Catch-up gets your Slack
---
# How Slack Catch-up gets your Slack

The page never talks to Slack. The morning routine reads Slack with Cabinet's Slack tools and
writes markdown files into this cabinet, and the page shows them. The full rules for each
field are in the agent's persona (`.agents/channel-reader/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `daily-summaries/<YYYY-MM-DD>T<HH-MM-SS>-slack-summary.md` | Morning Slack Catch-up, every day at 9 | One morning: front matter, then a "Waiting on you" table and a "Decided" table. One file per run, never changed after. The page builds its day picker from the names and opens today's first run, or the newest. |
| `daily-summaries/EXAMPLE-slack-summary.md` | Nobody (it ships with the template) | A made-up Northwind workspace in the same shape. Shown, marked as an example, until the first real run deletes it. |
| `decisions/<YYYY-MM>.md` | Morning Slack Catch-up | The decision log, one page per month, newest day first. Edited in place. The page reads it only when the reader opens it. |
| `decisions/EXAMPLE-decisions.md` | Nobody (it ships with the template) | The example's decision log. Deleted with the example summary. |
| `channel-digest/setup.md` | The person, or the agent in a chat | About your Slack: who matters most, channels to skip, working hours, how replies sound. The page shows it under "About your Slack". |

A summary in short. Front matter: `headline`, `lead` and `verdict` (left out on a quiet
morning), `source`, `generated` and `since` (`YYYY-MM-DD HH:MM`, the person's time zone),
`status` (`ok` or what went wrong), `dms` (`on` or `off`), `log` (the month page), and on a
run that set reminders `reminders` (how many) and `reminded` (their URLs, separated by
spaces).

- **Waiting on you**: `Who`, `Where` (`#channel` or `DM`), `What they want`, `Urgency`
  (`High`, `Medium` or `Low`), `Since`, `URL`. High rows show as "Needs you today", Medium as
  "Worth an answer", Low folded under "Just so you know".
- **Decided**: `Decision`, `Where`, `Who`, `URL`. Only decisions made without the person.

What the page reads through Cabinet rather than from a file: whether Slack is connected, the
routine's last and next run, and each person's own choice of what the page shows (Layout),
which Cabinet keeps for that person.

The buttons on an item ("Draft a reply", "Remind me later", "Add to a page") and the ask box
send a request to the agent in the chat beside the page. Nothing is posted to Slack without
the person's yes in that chat.
