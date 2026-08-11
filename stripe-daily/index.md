---
title: Stripe Daily
created: '2026-08-09T00:00:00Z'
modified: '2026-08-09T00:00:00Z'
tags: [stripe, payments, invoices, revenue, showcase]
order: 1
---
# Stripe Daily

Every morning, yesterday's money: what came in, what failed, and what needs you.

## It only ever reads

Start here, because it is your money. Stripe lets Cabinet issue refunds and create payment
links — this routine does neither, and never will. It reads yesterday's payments and
writes one page. It refunds nothing, charges nobody, sends no invoice and cancels no
subscription. Nothing you see here moved a cent.

## What you get

One page, waiting for you at 7. Every payment from yesterday gets one line — what it was
for, how much, where it stands, and who it was. The rows that need a human sit at the top:
a card that got declined, a customer who filed a dispute. The ones that simply worked sit
below, so you can see the day went fine without doing anything about it.

The headline is the line to read before your first coffee: what came in, and how much of
it is waiting on you.

## About the amounts

Amounts appear exactly as Stripe records them, in the currency they were charged in. If
you took money in more than one currency yesterday, the headline gives you a separate
total for each — nothing is converted, and two currencies are never added together.

## How to look at it

Open the **Daily Money** app in this cabinet. It comes pre-filled with a made-up example
so you can see the shape of it straight away — the page says clearly that those payments
are fake. Your first real morning takes its place.

## Before it can read your real Stripe

Connect Stripe in Cabinet's integrations screen. You paste nothing, but it is two steps
rather than one, and the first is not a button here: in your Stripe settings you first have
to turn on MCP access for your account. Once that is on, come back, click Connect, and sign
in with Stripe in the browser tab that opens.

So: nearly one click — as long as you switch it on at Stripe's end first. Until you
connect, the page keeps showing the example.

## What's inside

- **Payments Reader** — the one agent. Reads yesterday's payments, writes the page.
- **Morning Stripe Daily** — the one routine. Runs at 07:00 every day.
- **Daily Money** — the one page. Opens on today, with a dropdown for earlier days.
