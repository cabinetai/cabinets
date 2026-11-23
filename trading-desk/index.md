---
title: Trading Desk
created: '2026-11-19T00:00:00Z'
modified: '2026-11-19T00:00:00Z'
tags: [trading, robinhood, stocks, crypto, charts, alerts, journal, day-trading, swing-trading, options]
order: 1
---
# Trading Desk

A desk for your trading. It shows you real charts, tells you when a chart on your list does
something worth a look, sizes every trade from the risk you chose, and keeps a journal that
shows what works for you and what costs you money.

It reads public prices and runs without a broker. Connect Robinhood and it works from your
real account. An order is placed only when you ask for it and say yes.

## The five screens

- **Today**: where you start. Whether you are still inside your own limits, the charts your
  rules flagged, the Analyst's brief, your open trades, the calendar and the day's movers.
- **Charts**: any stock, fund, coin, future or currency. Candles from five minutes to a week,
  moving averages, VWAP, volume and RSI. Draw a line at a price that matters and the desk
  tells you when the price crosses it.
- **Trades**: one record from idea to result. Write a plan (entry, stop, target) and the desk
  works out the size, the money at risk and how often you must be right. Mark it taken and it
  watches your stop and target. Close it and it joins your journal.
- **Review**: what your own numbers say. Win rate, average trade in R, profit factor, your
  deepest fall, what each setup earns, longs against shorts, and what each mistake costs.
- **Alerts**: twenty rules you can switch on, off and tune: breakouts, gaps, unusual volume,
  moving average crosses, squeezes, bull flags, opening range breaks and more. Each one says
  in plain words what it means, and shows its record on your list: what the price did after
  each time it fired in the past two years, beside what it did on any day.

## Why it is different

- **Your plan, your alert, your trade and your review are one record.** Other tools give you
  a chart in one place and a journal in another.
- **The numbers are computed, never guessed.** A small script fetches prices and does the
  arithmetic. The assistants explain what the script found. They do not invent a price.
- **Alerts are free and unlimited.** The check runs on your computer every five minutes and
  uses no AI.
- **It guards you from yourself.** You set the most you lose on one trade and in one day. The
  desk sizes each trade to fit, and tells you to stop when you reach the limit.
- **It remembers you.** Write your own rules in `journal/my-trading.md`. They appear as
  boxes to tick before every trade, and every assistant reads them, with what your own
  numbers show, before it answers you. A broker's assistant starts from nothing each time.
- **A rule has to earn your attention.** Each alert shows how it did on your own list before,
  so you can tell a rule that helps from one that only sounds good.
- **Check a post before you act on it.** Paste a post from X and the Analyst checks each
  claim against the desk's numbers, and says which ones it cannot check.
- **It works with any broker.** Import trades from any broker's export. Robinhood connects
  directly.
- **It fits where you are.** Say how much you have traded. New to it: plain words, fewer
  alerts, a short list of first steps, and practice trades with no money behind them.
  Experienced: a denser desk without the explanations.
- **It is yours.** Every plan, trade and note is a file in this cabinet.

## Turning on live prices

The first time you open the desk, Cabinet asks whether this app may run its engine (the
scripts in `desk/engine`). Press **Allow**. From then on prices refresh every five minutes,
and you can chart any symbol at any size. Without it the desk still works from the prices
saved by its last refresh, and any assistant can refresh them for you.

## Your assistants

- **The Analyst** writes a brief each weekday morning and a recap after the close, and
  answers questions about the market.
- **The Chart Scout** looks at what your rules flagged and says, for the few that matter,
  what a trader would wait to see and where the idea is wrong.
- **The Risk Coach** checks a plan before you take it, and each Friday reads your week and
  writes what to keep, what to stop and one thing to try.
- **The Journal Clerk** imports your trades from a broker export, a paste or a screenshot,
  and keeps your Robinhood account and your journal in step.

None of them tells you what to buy, and none of them trades on its own.

## With Robinhood connected

Press **Connect Robinhood** on the Today screen. You sign in on Robinhood's own page:
Cabinet never sees your password. Then:

- **Your account is on the desk.** What you hold, what it is worth, and what each position
  has made or lost, refreshed after every close.
- **The market is scanned for you each morning.** Robinhood's scanner looks at every US
  stock, and the Chart Scout shows you the few that stand out, with the reason.
- **Your holdings are checked each morning.** Earnings this week, news, a rating change, a
  big move, a position that grew too large or has no stop.
- **Your journal fills itself.** Every trade you make at Robinhood lands in the journal.
- **Your phone tells you.** One press puts a Robinhood alert on every stop and target.
- **A plan can become an order.** Open a plan and press Send to Robinhood. The desk first
  checks the order against your own limits in code (no stop, too big, or past your daily
  loss limit, and it is not sent). Then your assistant shows you the order and waits for
  your yes. Robinhood lets an assistant trade only in
  the account you fund for it, which Robinhood calls the Agentic account.
- **Your month in money.** On the first of each month: what you made, where it came from
  and what it cost.

Robinhood is for US accounts.

## Where things are kept

| What | Where |
|---|---|
| Everything you enter on the desk | `desk/.data/shared.json` (Cabinet keeps it) |
| Prices, candles, signals, the calendar | `desk/data/` |
| Trades the Clerk imported | `journal/trades.json` |
| Your own rules, and what your numbers show | `journal/my-trading.md` |
| Your Robinhood account, scans and alerts | `account/` |
| Briefs and recaps | `briefs/` |
| Weekly reviews | `reviews/` |
| The rules the assistants follow | `playbooks/` |

Prices can be late by minutes. Nothing here is financial advice.
