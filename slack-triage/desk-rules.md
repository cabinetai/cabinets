---
title: Desk Rules
created: '2026-10-29T00:00:00Z'
modified: '2026-10-29T00:00:00Z'
tags: [settings, slack, support]
order: 2
claimed: ":eyes:"
done: ":white_check_mark:"
nudgeAfterHours: 4
channels: []
---
# Desk Rules

How your team works in the support channel, in four settings. The desk reads this page at
the start of every run, so a change here counts from the next run on. Change the values
between the two `---` lines at the top and leave the names as they are.

## claimed

The emoji that means "I've got it". When somebody adds it to a request, they own that
request. The default is `:eyes:`. If your team uses a different one, such as
`:raised_hand:`, write that instead. To accept more than one, separate them with commas:
`":eyes:, :raised_hand:"`.

A person who writes in the thread that they will take it ("on it", "I'll look") owns it
too, with or without the emoji.

## done

The emoji that means "this is finished". The default is `:white_check_mark:`. A request is
also done when the channel says so in words, for example "fixed and deployed" or "refund
sent". When the desk cannot tell, it keeps the request open and says it is unclear. It never
marks something done on a guess.

## nudgeAfterHours

How many hours a new request may sit with nobody on it before it counts as overdue. The
default is `4`. The board flags those requests, and if you allow it, the desk posts one
nudge a day in the channel (see below). Hours are counted on the clock, nights and
weekends included.

## channels

Which channels the desk watches. Leave it as `[]` to watch every channel Cabinet may read.
To watch only some of them, write their names: `[support, help-billing]`. The desk can
never read a channel that Cabinet's channel screen leaves out, whatever this list says.

## Nudges in the channel

Nudges are off until you turn them on, and you turn them on per channel. In Cabinet's
Slack settings, set the channel to **Write**. On **Read**, which is the default, the desk
only reads and the board still works fully.

A nudge is one plain message, at most once a day per channel, that lists the requests
nobody has taken. It never mentions anyone by name, never replies in a thread and never adds
a reaction. It is posted with your Slack account, so it shows your name and photo. To stop
nudges without changing the channel, pause the **Desk Nudge** routine.
