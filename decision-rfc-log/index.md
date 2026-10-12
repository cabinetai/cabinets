---
title: Decision & RFC Log
created: '2026-10-12T00:00:00Z'
modified: '2026-10-12T00:00:00Z'
tags: [decisions, rfc, slack, discord, architecture]
order: 1
---
# Decision & RFC Log

Decisions get made in chat threads, then get lost. This cabinet keeps them in one table.

The cabinet opens on it: **Decisions**.

## How to add a decision

- React **🧠** on a message where a decision was made.
- React **📝** on a proposal that is still being discussed (an RFC).

Cabinet reads the whole thread, writes a short summary, and adds a row. It works in
Slack, in Discord, or in both.

## What you get

- **Decision Matrix**: one row per decision or RFC, with the topic, what was decided,
  who took part, the date, and a link back to the thread. Open a row to see the summary,
  why it was decided, and a few quotes from the thread.
- **Find a decision**: search by topic, person or word, and filter by Slack or Discord.
- **Ask about your decisions**: what was decided this week, which RFCs are still open.
  The answer comes up in the chat.
- **Ideas**: a weekly recap, open RFCs to close, decisions without an owner. Ask once,
  or switch one on to run on a schedule.

## It reads, and writes only where you allow

It reads only messages marked with 🧠 or 📝, in the channels you allow. It writes in
Slack or Discord only where you set Write: when you ask in the chat, or in a routine you
approve.

## Until then

The page shows a made-up team, and says so. Your first marked thread replaces it.
