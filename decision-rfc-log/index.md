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

## How it works

1. In Slack or Discord, react **🧠** on a message where a decision was made, or **📝** on a
   proposal that is still being discussed (an RFC).
2. Every 15 minutes Cabinet looks for newly marked messages by itself. To see one right
   away, press **Check now** on the page.
3. Cabinet reads the whole thread, writes a short summary, and adds a row.

It works with Slack, with Discord, or with both. Connect either one from the page.

When a 📝 proposal later gets a 🧠, or the thread settles it, the same row turns into a
decision. When a newer decision replaces an older one, the older row is marked Replaced.

## The Decision Matrix

| Column | What it means |
|---|---|
| Topic | What the thread is about, in a few words. Tagged Decision, RFC or Replaced. |
| Decision Made | What was decided, in one line. For an open RFC, what is proposed. |
| Key Stakeholders | The people who took part in deciding. |
| Date | The day it was decided, or proposed. |
| Original Thread Link | Opens the thread in Slack or Discord. |

Open a row to see the summary, why it was decided, and a few quotes from the thread.
Search with **Find a decision**, and show only Slack or only Discord.

## Ask and ideas

Ask about your decisions in the box on the page: what was decided this week, which RFCs
are still open. The answer comes up in the chat. The ideas below it (a weekly recap, open
RFCs to close, decisions without an owner) can be asked once or switched on as a routine.

## It reads, and writes only where you allow

It reads only messages marked with 🧠 or 📝, in the channels you allow. Direct messages
are never read. It writes in Slack or Discord only where you set Write: when you ask in the
chat, or in a routine you approve.

## What's inside

- **Decision Keeper** is the one agent. Reads marked threads and keeps the log.
- **Check for Decisions** is the one routine. Runs every 15 minutes.
- **Decisions** is the page the cabinet opens on. Until your first marked thread it shows
  a made-up team, and says so.
