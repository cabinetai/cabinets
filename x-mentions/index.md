---
title: X Mentions
created: '2026-08-09T00:00:00Z'
modified: '2026-08-09T00:00:00Z'
tags: [x, mentions, replies, digest, showcase]
order: 1
---
# X Mentions

Every morning, your mentions and which of them actually want an answer.

## What you get

One page, waiting for you at 9. Everything pointed at you on X in the last day gets one
line — who said it, what they actually want, whether it was a mention, a reply or a quote,
and whether it wants an answer. The ones that want you sit at the top, the spam at the end.

**Your mentions, not your timeline.** It never reads your feed, your own posts' numbers or
what is trending. It reads the things aimed at you, which is the part with a person on the
other end of it.

If somebody was abusive at you, the page says so in plain words and does not repeat what
they said. You should be able to read this over breakfast.

It only reads. Nothing is posted, replied to, bookmarked or listed — though X would let it.

## How to look at it

Open the **Morning Mentions** app in this cabinet. It comes pre-filled with a made-up
example so you can see the shape of it straight away — the page says clearly that those
mentions are fake. Your first real morning takes its place.

## Before it can read your real mentions

Connect X in Cabinet's integrations screen. There is no one-click path here: X wants you to
make a small app of your own first, so this one is four steps — create the app, give it the
callback address Cabinet shows you, paste back the OAuth 2.0 Client ID and Client Secret
from the app's keys page, then sign in with X the first time it runs.

**The Client Secret is shown to you once.** Copy it while it is on screen; if you close that
page without it, you have to go back and issue a new one. Cabinet keeps both values in a
locked file on your own machine and they go nowhere else.

Set aside ten minutes for it once; after that it stays connected and you never touch it
again. Until then the page keeps showing the example.

## What's inside

- **Mentions Reader** — the one agent. Reads yesterday's mentions, writes the page.
- **Morning X Mentions** — the one routine. Runs at 09:00 every day.
- **Morning Mentions** — the one page. Opens on today, with a dropdown for earlier days.
