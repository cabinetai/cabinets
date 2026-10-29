---
title: Slack Catch-up
created: '2026-08-09T00:00:00Z'
modified: '2026-10-29T00:00:00Z'
tags: [slack, catch-up, mentions, direct-messages, decisions, showcase]
order: 1
---
# Slack Catch-up

Every morning, who is waiting on you in Slack, and what was decided without you.

## What you get

One page, waiting for you at 9. It does not summarise channels. Slack does that already.
It answers two questions about you.

**Who is waiting on you.** One line per thing, not per channel: who asked, where, what
they want from you, how urgent it is and how long it has waited. It finds the questions
put to you by name, the mentions of you and of your groups (such as @design), the threads
you started or joined that moved, and your direct messages. Anything you already answered
drops off. Anything you did not stays on the next morning, for up to a week.

**What was decided without you.** Agreements made in your channels while you were not in
the conversation. A real decision, not a proposal: someone with the call said yes, or the
people it touches agreed.

On a Monday it covers the whole weekend. On a quiet morning it says so: "Nothing is waiting
on you" is the best page it can write.

## A decision log that keeps itself

Every decision it finds also goes into a page for the month, under **Decisions** in this
cabinet: `decisions/2026-10.md`, then `decisions/2026-11.md`, newest day at the top. It
keeps the decisions you took part in too, so in March, "when did we agree to drop the free
plan, and who said yes?" is a page you open, not a scroll through Slack. Decisions from
private channels and direct messages never go in it, because teammates may read it.

## Direct messages and reminders

Most of what waits on you is in your direct messages, so they are read when Cabinet's Slack
settings allow it. That is the **Direct messages** row on Cabinet's channel screen, and it
is set to **Read** unless you changed it. Turn it off and the page says "Direct messages
are off" and works from channels alone.

Set that row to **Write** and Slack Catch-up also sets a Slack reminder for each item that
needs you today, at 14:00: "Reply to Dana about the release date", with the link. Never
more than three a day and never twice for the same thing. A reminder is set on your own
account and appears in Slack as yours, because Cabinet signs in as you. Leave the row on
Read and no reminder is ever set.

It never posts, replies, reacts or marks anything read.

## How to look at it

Open the **Channel Digest** app in this cabinet. It comes pre-filled with a made-up
example, with a sample decision log, so you can see the shape of it straight away. The page
says clearly that the people and messages are invented. Your first real catch-up takes
their place and removes both examples.

## Before it can read your real Slack

Connect Slack on Cabinet's integrations screen. Press **Connect Slack**, check the
workspace on Slack's own page and press **Allow**. There is no app to make and no key to
paste.

Cabinet then asks which channels it may use. Leave **Every public channel** on **Read** so
it can see mentions and decisions in all of them, including ones that open later. Add a
private channel by name if you want it included. Until Slack is connected the page keeps
showing the example.

## What's inside

- **Catch-up Reader** is the one agent. Finds what waits on you, writes the morning page
  and the decision log.
- **Morning Slack Catch-up** is the one routine. Runs at 09:00 every day.
- **Channel Digest** is the one page. Opens on today, with a list for earlier days.
- **Decisions** holds the decision log, one page per month.
