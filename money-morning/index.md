---
title: Money Morning
created: '2026-08-12T00:00:00Z'
modified: '2026-08-12T00:00:00Z'
tags: [stripe, payments, money, morning, flagship]
order: 1
---
# Money Morning

Yesterday's money in plain words — what came in, what failed, who left.

## What you get

At 07:30 a routine reads yesterday in your Stripe account and writes one page: the
amount that came in, anything that went back out, and a short table of the payments
worth knowing about — a failed card, a dispute, a new customer, a refund. The number
you actually care about sits at the top in large type.

It is **read only**. Nothing is refunded, charged, invoiced or cancelled — the routine
reads your account and writes a page, and that is the whole of it.

## How to look at it

Open the **Money** app in this cabinet. It starts pre-filled with a made-up example so
you can see the shape straight away — the page says plainly that those numbers are
fake. Your first real morning takes its place.

## Before it can read your real account

Connect Stripe in Cabinet's integrations screen. You paste nothing, but it is two
steps rather than one, and the first is not a button here: in your Stripe settings you
first have to turn on MCP access for your account. Once that is on, come back, click
**Connect**, and sign in with Stripe in the browser tab that opens.

So: nearly one click — as long as you switch it on at Stripe's end first. Until you
connect, the page keeps showing the example.

## If the page still shows the example

The routine only writes when it can actually reach Stripe. If it has run and the
example is still sitting there, Stripe isn't connected yet — see above. Nothing was
overwritten and nothing errored. Fix the connection and run the routine again.

## What's inside

- **Money Teller** — the one agent. Reads yesterday's payments, writes the page. Read only.
- **Money Morning** — the one routine. Runs at 07:30 every day.
- **Money** — the one page. Opens on today, with a dropdown for earlier days.
- **setup.md** — what deserves a row and who you watch. The teller reads it every morning.
