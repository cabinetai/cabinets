---
title: Discord Digest
created: '2026-08-09T00:00:00Z'
modified: '2026-08-09T00:00:00Z'
tags: [discord, channels, community, digest, showcase]
order: 1
---
# Discord Digest

Every morning, what was worth reading in your Discord server over the last 24 hours.

## What you get

One page, waiting for you at 9. Every channel that moved yesterday gets one line — the
channel, how many messages piled up in it, whether it is worth your time, and one short
line on what happened. The loudest channel does not win: the two-hundred-message off-topic
channel sits at the bottom, and the three messages that actually mattered sit at the top.

**It reads the channels you let the bot into, and only those.** A Discord bot sees a
channel once it has been given access, so you pick what the digest covers by inviting the
bot — not by configuring anything here. Want more in it, add the bot to another channel in
Discord. Want less, take one away. You decide what it reads.

**One server.** You hand this cabinet a single Server ID when you connect it, and that is
the server it watches. If you are in six servers, point it at the one you actually want a
morning digest of.

Direct messages are left out. This is the server, not your DMs.

Nothing is posted, replied to, reacted to or threaded. It only reads.

## How to look at it

Open the **Server Digest** app in this cabinet. It comes pre-filled with a made-up example
so you can see the shape of it straight away — the page says clearly that those channels
are fake. Your first real digest takes its place.

## Before it can read your real server

Connect Discord in Cabinet's integrations screen. This is the most involved connection in
the family — five steps rather than one click. You create a Discord application of your
own, copy its bot token, invite that bot to your server, and paste the token and your
Server ID into Cabinet. The screen walks you through each step.

The token is kept in a locked file on your own machine and is never uploaded anywhere. Set
aside ten minutes for it once; after that it stays connected and you never touch it again.
Until then the page keeps showing the example.

## What's inside

- **Server Reader** — the one agent. Reads the day's channels, writes the digest.
- **Morning Discord Digest** — the one routine. Runs at 09:00 every day.
- **Server Digest** — the one page. Opens on today, with a dropdown for earlier days.
