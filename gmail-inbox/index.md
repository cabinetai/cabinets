---
title: Gmail Inbox
created: '2026-08-09T00:00:00Z'
modified: '2026-08-09T00:00:00Z'
tags: [gmail, email, inbox, summary, showcase]
order: 1
---
# Gmail Inbox

Every morning, a plain-English summary of the email that arrived overnight.

## What you get

One page. It lists the mail that came in since yesterday, one line each, with who sent
it, what it actually wants from you, and how urgent it is. You read the page instead of
the inbox, and you know in about fifteen seconds whether anything needs you today.

Nothing is replied to, archived, labelled or deleted. It only reads.

## How to look at it

Open the **Inbox Summary** app in this cabinet. It comes pre-filled with a made-up
example so you can see the shape of it straight away — the page says clearly that those
emails are fake. Your first real summary takes its place.

## Before it can read your real mail

Connect Gmail in Cabinet's integrations screen. One click, one Google approval page,
no password to invent and nothing to install. Until then the page keeps showing the
example.

That click connects Gmail to your **Claude account**, not to Cabinet — which is exactly
what makes the morning summary possible, because the routine runs as Claude on your
machine and reads your mail through the same connection. It also means Gmail is now on
for Claude everywhere, not just here. The Disconnect link on the integrations page takes
you to claude.ai, where the off switch lives.

If this cabinet's agent is set to something other than Claude — Codex, Cursor, Gemini —
Google's one-click sign-in won't work for it. Use the App Password option at the bottom
of the same Gmail page instead; it gives the agent a different way in and the routine
works the same.

## If the page still shows the example

The routine only writes when it can actually reach your mail. If it has run and the
example is still sitting there, Gmail isn't connected yet, or it's connected in a way
this cabinet's agent can't use — see above.

Nothing was overwritten and nothing errored. Fix the connection and run the routine
again.

## What's inside

- **Inbox Summarizer** — the one agent. Reads the mail, writes the summary.
- **Morning Inbox Summary** — the one routine. Runs at 07:00 every day.
- **Inbox Summary** — the one page. Opens on today, with a dropdown for earlier days.
