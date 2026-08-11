---
title: WhatsApp Digest
created: '2026-08-09T00:00:00Z'
modified: '2026-08-09T00:00:00Z'
tags: [whatsapp, messages, digest, summary, showcase]
order: 1
---
# WhatsApp Digest

Every morning, a plain-English digest of the WhatsApp conversations from the last 24 hours.

## What you get

One page. It lists every chat that moved today — one line each, with who it was, how many
messages piled up, what they actually want from you, and how urgent it is. You read the
page instead of scrolling back through fourteen unread groups, and you know in about
fifteen seconds whether anything needs you today.

Nothing is replied to, forwarded, muted or marked read. It only reads.

## How to look at it

Open the **Daily Digest** app in this cabinet. It opens on today's digest, and a **Date**
dropdown at the top goes back to any earlier morning — nothing is thrown away, so the
digests pile up into a record of your weeks.

It comes pre-filled with a made-up example so you can see the shape of it straight away —
the page says clearly that those chats are fake. Your first real digest takes its place.

## Before it can read your real messages

Connect WhatsApp in Cabinet's integrations screen. Until then the page keeps showing the
example.

## An honest warning about WhatsApp specifically

**This template does not work end to end yet, and that is deliberate.**

From the moment you link your account, Cabinet already keeps a record of every WhatsApp
message you get — every chat, both directions. The data your digest needs is there. What
doesn't exist yet is the last short step: a way for the background routine to read that
record back. This cabinet is written as though it could, and waits.

So what actually happens when you install it:

- It installs cleanly. Nothing errors, nothing breaks.
- The morning routine runs, finds it cannot read the record, says so, and leaves the page
  alone rather than wiping it.
- The example digest stays on screen until the missing step lands.

If you want a showcase that reads live data today, pick one of the cabinets built on
Slack, Linear, Notion or GitHub instead. This one is here to show what the WhatsApp
version will look like the day it becomes possible.

## What's inside

- **WhatsApp Digest** — the one agent. Reads the day's chats, writes the digest.
- **Morning WhatsApp Digest** — the one routine. Runs at 07:00 every day.
- **Daily Digest** — the one page. Opens on today, with a dropdown for earlier days.
