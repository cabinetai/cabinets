---
title: Slack Support Desk
created: '2026-09-16T00:00:00Z'
modified: '2026-10-29T00:00:00Z'
tags: [slack, support, triage, tracking, showcase]
order: 1
---
# Slack Support Desk

A request queue for your team's Slack channel. Every request with its owner, its state and its age, and a nudge when one sits too long.

## What you get

One board, refreshed three times on a weekday. Every request that came into the channel gets
a card: what it is, what it actually needs from you, who has it, where it stands, and how long
ago it was asked. A request somebody already handled is marked Done and folds away. A request
nobody picked up sits at the top marked New, oldest first, until somebody does. Once it has
waited longer than your team allows, the card says so: "No owner for 6h".

The board is the thing a support channel never has. Scrolling back through a channel tells
you what was said. This tells you what is still owed, and since when.

Every Friday afternoon you also get a short look back at the week: which kinds of request
kept coming back, how long they typically waited for an owner, and one idea for each, such as
a saved reply or a doc that would answer it.

## It follows your team's habits

Most teams already have a way of saying "I've got it" in Slack, usually an emoji. Open
**Desk Rules** in this cabinet and tell the desk which one yours uses, which emoji means
finished, how many hours is too long to wait, and which channels to watch. The defaults are
:eyes: for "I've got it", :white_check_mark: for finished, and 4 hours.

The board only ever repeats what the channel shows. Whoever added the "I've got it" emoji, or
wrote "I'll take this" in the thread, is the owner. If nobody did, the owner is empty and the
request stays New, which is the honest answer and the useful one. Nothing here assigns work
to anybody, and a request is only marked Done when the channel shows it was finished.

## Nudges, only if you turn them on

On weekdays at 11:00 the desk can post one nudge in the channel when requests have had no
owner for longer than your limit:

> 2 requests have had no owner for over 4 hours: (with a link to each)

That is the whole message. At most one a day per channel, never when there is nothing to say,
never in a thread, no reactions, and nobody is mentioned by name.

**Nudges are posted with your Slack account.** They show your name and photo, because
Cabinet connects to Slack as you. That is why they are off until you turn them on, channel by
channel: in Cabinet's Slack settings, set the support channel to **Write**. Leave it on
**Read**, the default, and the desk only reads. The board and the weekly look back work
fully either way. The board shows when the last nudge went out, with a link to it, and a
record of each one stays in this cabinet, so you can always see what was said in your name.

## How to look at it

Open the **Triage Board** app in this cabinet. It comes pre-filled with a made-up example so
you can see the shape of it straight away. The page says clearly that those items are
invented. Your first real pass takes its place.

## Before it can read your real Slack

Connect Slack on Cabinet's integrations screen. Press **Connect Slack**, check the
workspace on Slack's own page and press **Allow**. There is no app to make and no key to
paste.

Cabinet then asks which channels your team may use. Point it at your support or incident
channel and leave the rest out. Choose **Read** if you only want the board, or **Write** if
you also want nudges. A private support channel works too. Add it by name, because
private channels are never included on their own. Until Slack is connected the board keeps
showing the example.

## What's inside

- **Triage Desk** is the one agent. Reads the channel, keeps the board true, and posts the
  nudge when you allow it.
- **Support Triage** runs at 09:00, 13:00 and 17:00 on weekdays and refreshes the board.
- **Desk Nudge** runs at 11:00 on weekdays and posts a nudge where you set Write. Pause it
  to stop nudges without changing anything in Slack.
- **Weekly Patterns** runs at 16:00 on Fridays and writes the week's look back.
- **Desk Rules** is the page with your team's emoji, time limit and channels.
- **Triage Board** is the page. Opens on the newest pass.
