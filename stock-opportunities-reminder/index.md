---
title: Stock Opportunities Reminder
created: '2026-11-23T00:00:00Z'
modified: '2026-11-23T00:00:00Z'
tags: [stocks, investing, opportunities, charts, alerts, swing-trading]
order: 1
---
# Stock Opportunities Reminder

A stock scout that works for you. On the days and at the time you choose, it reads the
market and the stocks on your list, and tells you if one is worth buying now: where to buy, the price where the
idea is wrong, and what it aims for. Most days it finds little. Some days it finds nothing,
and says so.

## What you get

- **A reminder when you want it.** Pick how often and at what time on the page: every
  weekday, every day, or one day a week. It starts as weekday mornings at 8:30. The answer
  is short: what the market is doing, and up to three stocks worth a look, or none.
- **It only calls what the numbers support.** The engine finds every stock that fits one
  of five setups, on your list and across about 100 large US stocks, and tests each setup
  on the past. A setup that has lost money is never called. The Scout adds the judgement:
  which candidate, what the news changes, and when to say no.
- **Every call is complete.** A buy zone, a stop (the price where the idea was wrong) and a
  target, each read off the chart and explained in plain words. No call without a stop.
- **What it passed on, and why.** The stocks that looked tempting and are not, with the
  reason. This is where you learn the most.
- **An honest scorecard.** Every call is followed by arithmetic, not by opinion: did the
  price reach the zone, and which came first, the stop or the target. You see how the
  calls did, the losers too.
- **It learns.** Once a week the Scout reads its own results and writes down what it will
  do differently, in a page you can read.

## The two screens

- **Opportunities**: today's calls, what was passed on, earlier calls with how they turned
  out, and the scorecard.
- **My stocks**: your list. Add and remove stocks, and open any chart with its trend, the
  rules that flagged it, headlines and the next earnings date.

## Turning on live prices

The first time you open this cabinet, Cabinet asks whether to allow the app to run its own
code. That code is a small script in `app/engine`: it reads public prices every five
minutes, costs no AI, and cannot buy or sell anything. Until you press Allow, the page shows
the prices saved the last time the Scout ran.

## What it is not

It cannot place an order and it is not connected to any broker. It does not know your money
or your taxes, so it never says how much to buy. Its calls are ideas to look at, not
financial advice, and a good share of them will be wrong: that is what the stop is for.

## Where things are kept

| Where | What |
|---|---|
| `opportunities/` | One file for each day the Scout ran: its calls, and what it passed on |
| `playbooks/method.md` | How the Scout finds an opportunity. Read it to see how it thinks |
| `playbooks/lessons.md` | What the Scout learned from its own calls. It rewrites this weekly |
| `app/data/` | The prices and charts the engine saved, and the scorecard |

Prices come from public sources and can be late by minutes.
