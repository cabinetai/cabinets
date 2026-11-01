---
title: Desk Rules
created: '2026-10-29T00:00:00Z'
modified: '2026-11-01T00:00:00Z'
tags: [settings, slack, support]
order: 2
claimed: ":eyes:"
done: ":white_check_mark:"
flagAfterHours: 4
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

## flagAfterHours

How many hours a new request may sit with nobody on it before the board flags it. The
default is `4`. Hours are counted on the clock, nights and weekends included. When requests
are past it, the board offers **Draft a nudge**.

## channels

Which channels the desk watches. Leave it as `[]` and it watches the channels Cabinet may
read, up to eight in a run, private channels and names like support or help first. To choose
them yourself, write their names: `[support, help-billing]`. The desk can never read a
channel that Cabinet's channel screen leaves out, whatever this list says.
