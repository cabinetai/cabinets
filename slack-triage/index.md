---
title: Slack Support Desk
created: '2026-09-16T00:00:00Z'
modified: '2026-10-29T00:00:00Z'
tags: [slack, support, triage, tracking, showcase]
order: 1
---
# Slack Support Desk

A request queue for your team's Slack channel. Every request with its owner, its state and its age, and a nudge when one sits too long.

Three times on a weekday it reads your support channel and opens on one board:

- **New, Owned, Waiting, Done**: one card per request, with what it needs, who has it and
  how long ago it was asked. A request nobody picked up stays in New, oldest first.
- **No owner for 6h**: a flag on any new request that has waited longer than your team
  allows.
- **Weekly patterns**: every Friday, the kinds of request that kept coming back, how long
  they waited for an owner, and one fix for each, such as a saved reply or a doc.

The board only repeats what the channel shows. The owner is whoever added your team's "I've
got it" emoji or wrote "I'll take this". Nobody is ever assigned, and a request is Done
only when the channel shows it was finished.

## To start

Open **Triage Board** and connect Slack on Cabinet's integrations screen: press **Connect
Slack**, check the workspace on Slack's page and press **Allow**. There is no app to make
and no key to paste. Cabinet then asks which channels it may use. Pick your support or
incident channel and leave the rest out. A private channel works too: add it by name.
Until the first pass the board shows a made-up channel, clearly marked.

## Make it yours

Open **Desk Rules** to set your team's "I've got it" emoji (:eyes: by default), its
"finished" emoji (:white_check_mark:), how many hours a request may wait (4), and which
channels to watch.

## Ask from the board

Each open request has two quiet buttons. **Draft an answer** writes a reply in the chat
beside the board, from the thread and what this cabinet already knows. **Who could take
this?** names one or two people who handled requests like it, and assigns nobody. On the
weekly patterns, **Write the saved reply** or **Write the doc** turns a request that keeps
coming back into a page in this cabinet, which later drafts draw on. **Ideas** holds ready
questions, and the box at the bottom takes your own. **Run now** reads Slack again, and
**Layout** hides the parts of the page you do not need.

## It only reads, unless you allow it

On **Read**, the default, the desk only reads. Set the support channel to **Write** on
Cabinet's channel screen and, on weekdays at 11:00, it posts one message listing the
requests with no owner past your limit. At most one a day per channel, never in a thread,
no reactions, and nobody is mentioned. The message is posted with your Slack account,
because Cabinet signs in as you. The board shows when the last nudge went out, and each one
is kept on record in this cabinet. Pause **Desk Nudge** to stop nudges.

A drafted answer stays in the chat. The desk posts it only when you say yes there, as a reply
in that request's thread, in a channel set to **Write**, and with your name on it.

## Inside

- **Triage Board**: the app this cabinet opens on.
- **Triage Desk**: the agent. Reads the channel, keeps the board true, posts the nudge.
- **Support Triage**: the routine, at 9, 13 and 17 on weekdays.
- **Desk Nudge**: the nudge, at 11 on weekdays, only where you set Write.
- **Weekly Patterns**: the look back, Fridays at 16.
- **Desk Rules**: your team's emoji, time limit and channels.
- **Saved replies** and **docs**: the pages the desk writes when you ask from a weekly pattern.
