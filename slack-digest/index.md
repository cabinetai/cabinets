---
title: Slack Catch-up
created: '2026-08-09T00:00:00Z'
modified: '2026-10-29T00:00:00Z'
tags: [slack, catch-up, mentions, direct-messages, decisions, showcase]
order: 1
---
# Slack Catch-up

Every morning, who is waiting on you in Slack, and what was decided without you.

Every morning at 9 it reads Slack for you, not every channel in full, and opens on one page:

- **Waiting on you**: one line per thing, not per channel. Who asked, where, what they want
  and how long it has waited, most urgent first. It finds questions put to you, mentions of
  you and your groups, threads you are in that moved, and your direct messages. Anything you
  have not answered comes back the next morning, for up to a week.
- **Decided without you**: real agreements made in your channels while you were not in the
  conversation, not proposals.
- **Decision log**: every decision also goes into a page for the month, such as
  `decisions/2026-10.md`. In March, "when did we agree to drop the free plan?" is a page you
  open, not a scroll through Slack. Private channels and direct messages stay out of it.

On a Monday it covers the weekend. On a quiet morning it says "Nothing is waiting on you".

## To start

Open the cabinet and press **Connect Slack** on its page, check the workspace on Slack's
page and press **Allow**. There is no app to make and no key to paste. Cabinet then asks
which channels it may use. Leave **Every public channel** on **Read**, and add a private
channel by name if you want it included. Until the first reading the page shows a made-up
workspace, clearly marked.

Then tell it about your Slack: who matters most, channels to skip, your working hours and
how your replies sound. Say it in the chat, or press **Tell it who matters** on the page. It
is kept in **About your Slack** and read every morning.

## From the page

Each item has a next step that asks the agent in the chat beside the page:

- **Draft a reply**: a reply in your voice, in the chat for you to copy.
- **Remind me later**: one Slack reminder, at a time inside your working hours.
- **Add to a page**: a decision written into the page in this cabinet where it belongs.

The ask box and **Ideas** take any other question about your Slack.

## It only reads, unless you allow it

The morning routine never posts, replies, reacts or marks anything as read. A reply it
drafts for you is posted only when you say yes in the chat, and only in a channel set to
**Write**. It appears as you, because Cabinet signs in to Slack as you.

Direct messages follow the **Direct messages** row on Cabinet's channel screen. On
**Read** they are included. Turned off, the page says so and works from channels alone. Set
the row to **Write** and it also sets a Slack reminder at 14:00 for each item that needs
you today, at most three a day. Reminders are set on your own account and show as yours,
because Cabinet signs in to Slack as you.

## Inside

- **Slack Catch-up** (`channel-digest/`): the page this cabinet opens on.
- **About your Slack** (`channel-digest/setup.md`): what you told it about your Slack.
- **Catch-up Reader**: the agent. Finds what waits on you and keeps the decision log.
- **Morning Slack Catch-up**: the routine, every day at 9.
- **Decisions**: the decision log, one page per month.
