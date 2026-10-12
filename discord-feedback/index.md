---
title: Discord Feedback
created: '2026-10-07T00:00:00Z'
modified: '2026-10-07T00:00:00Z'
tags: [discord, feedback, community, roadmap]
order: 1
---
# Discord Feedback

Your community tells you what to build, in Discord, every day. This cabinet reads your
`#feedback` channel and keeps one board of what people ask for: each request once, how
many people asked, what kind it is, and how much it matters.

## What you get

A **Feedback Board**. Similar messages land on the same row, so "dark mode please",
"need a dark theme" and "+1 dark mode" are one request asked by three people, not three
lines. Chatter, greetings and thank-yous are left out. Every row keeps the people who asked
and a link back to each message, so you can always check the source.

## How it reads

- **It reads `#feedback`**, every 30 minutes, and only what is new since the last run.
- **It reads, and writes only where you allow.** The board itself only reads. In the chat,
  your team posts or replies only when you ask, and only in channels you set to Write in
  Discord's settings in Cabinet. Everywhere else, replies are drafted for you to send.
- **One server.** It reads the server you gave Cabinet when you connected Discord.

## Before it can read your server

Connect Discord in Cabinet: Settings, For developers, Discord. Paste your bot's token and
your server's ID. Invite the bot to your server with permission to view the channel and
read its history, and turn on Message Content Intent for the bot in the Discord Developer
Portal, or it sees messages without their text.

## What's inside

- **Feedback Analyst**: the one agent. Reads new messages and keeps the board.
- **Organize Feedback**: the one routine. Runs every 30 minutes.
- **Feedback Board**: the one page. Open it to see the board.
