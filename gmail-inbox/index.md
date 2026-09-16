---
title: Gmail Inbox
created: '2026-08-09T00:00:00Z'
modified: '2026-09-15T00:00:00Z'
tags: [gmail, email, inbox, summary, showcase]
order: 1
---
# Gmail Inbox

Every morning, a plain-English summary of the email that arrived overnight.

## What you get

One page, six cards, ready at 07:00:

- **Needs you today**: who wrote, what they want, and how urgent it is.
- **Waiting on your reply**: people still waiting on you, oldest first.
- **Bills and receipts**: who, how much, and when it is due.
- **Dates and meetings mentioned**: what is coming up, soonest first.
- **Newsletters you never open**: how many sit unread, and from whom.
- **Replies ready to send**: short replies written for you, with a Copy button.

You read the page instead of the inbox, and you know in about fifteen seconds whether
anything needs you today. On Fridays at 16:00 a second check looks back over two weeks
for anyone still waiting on you, so you can clear it before the weekend.

The routines only read. Nothing is archived, labelled or deleted, and nothing is sent.
To send one of the replies, ask your teammate in a chat; Cabinet shows you the email
first and it goes out only when you approve it.

## How to look at it

Open the **Inbox Summary** app in this cabinet. It comes pre-filled with a made-up
example so you can see the shape of it straight away, and the page says clearly that
those emails are fake. Your first real summary takes its place.

## Make it yours

Open **setup.md** and replace the example answers: whose mail always matters, what to
skip, what counts as waiting on you, and the tone for replies. Your teammate reads it
before every run, so a change tonight shapes tomorrow's page.

## Before it can read your real mail

Connect Gmail when Cabinet asks, or later from Integrations. You do it once.

Cabinet's own way in is an app password: a code you make in your Google account that
lets one program read your mail and nothing else. The Gmail page in Integrations walks
you through it and tells you where to click in Google. It works whichever assistant this
cabinet runs on.

If you already connected Gmail to Claude, on claude.ai, Cabinet sees that too and the
routine can read your mail that way instead. That connection is managed on claude.ai,
not here, and it only works when this cabinet runs on Claude.

Until Gmail is connected one way or the other, the page keeps showing the example and
the morning routine waits.

## If the page still shows the example

The routine only writes when it can actually reach your mail. If it has run and the
example is still sitting there, Gmail is not connected yet, or it is connected in a way
this cabinet's agent cannot use. The run says which of the two it was.

Nothing was overwritten and nothing errored. Fix the connection and run the routine
again.

## What's inside

- **Inbox Summarizer**: the one agent. Reads the mail, writes the page.
- **Morning Inbox Summary**: a routine that runs at 07:00 every day and writes the six cards.
- **Friday Loose Ends**: a routine that runs at 16:00 on Fridays and lists who is still waiting on you.
- **Inbox Summary**: the page. Opens on today, with a dropdown for earlier days.
- **setup.md**: your answers. Two minutes there makes every summary sharper.
