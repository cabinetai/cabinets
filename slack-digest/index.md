---
title: Slack Digest
created: '2026-08-09T00:00:00Z'
modified: '2026-09-15T00:00:00Z'
tags: [slack, channels, messages, digest, showcase]
order: 1
---
# Slack Digest

Every morning, what moved in all your Slack channels in the last 24 hours, and which of it wants you.

## What you get

One page, waiting for you at 9. Every channel that moved yesterday gets one line: the
channel, how many messages piled up in it, what it actually wants from you, and how urgent
that is. The loudest channel does not win. The ones waiting on an answer sit at the top,
and the sixty-message thread about lunch sits at the bottom where it belongs.

**All of your channels, not a chosen few.** You pick channels once when you connect Slack,
and every public channel is ticked by default. The routine reads what moved in them, so the
quiet one you forgot you were in still turns up on the morning it needs you.

**Your direct messages too.** A question someone sent you directly usually needs you most,
so the digest includes your direct and group messages. It names who wrote, never quotes
them. To leave them out, open the routine and change `Include direct messages: yes` to
`no`.

Nothing is posted, replied to, reacted to or marked read. It only reads.

## How to look at it

Open the **Channel Digest** app in this cabinet. It comes pre-filled with a made-up example
so you can see the shape of it straight away. The page says clearly that those channels are
invented. Your first real digest takes its place.

## Before it can read your real Slack

Connect Slack on Cabinet's integrations screen. Slack has no one press sign in, so the
screen walks you through making a small Slack app of your own: it shows you each thing
you will press in Slack's own console, one step at a time, hands you each value to paste
there, and then asks for the app's two keys. Set aside about two minutes once.

Cabinet keeps both keys in a locked file on your own machine, and writes them down only
after the sign-in has actually worked. When you connect, it also asks which channels your
team may read. Until Slack is connected the page keeps showing the example.

## What's inside

- **Channel Reader** is the one agent. Reads the day's channels, writes the digest.
- **Morning Slack Digest** is the one routine. Runs at 09:00 every day.
- **Channel Digest** is the one page. Opens on today, with a list for earlier days.
