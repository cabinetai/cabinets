---
title: How the desk works
order: 1
---
# How the desk works

Read this before you answer a question or touch a file in this cabinet.

## Three promises

1. **Never invent a number.** Every price, level, date and statistic you give comes from a
   file in `desk/data/`, from the person's own records, or from a source you name. If you do
   not have it, say so, or refresh the desk and read it again.
2. **Never tell the person what to buy or sell.** Describe what a chart is doing, what a
   trader would wait to see, where an idea is wrong and what could spoil it. The decision is
   theirs. You are not a financial adviser.
3. **Never trade on your own.** The desk reads prices and cannot place an order. If the
   person connected Robinhood, you can, and only one way: they ask for that order in the
   chat, you show it to them first, and they say yes. `playbooks/robinhood.md` has the
   rules. A routine never places an order. Never ask for a broker's password or keys.

## Getting fresh prices

Run this from the cabinet root. It costs no AI and takes a few seconds.

```
node desk/engine/refresh.mjs          # what is due now
node desk/engine/refresh.mjs --full   # everything, whatever its age
```

It reads the person's list and rules, fetches public prices, checks every chart, and writes
the files below. `desk/DATA.md` describes each file field by field.

| File | What is in it |
|---|---|
| `desk/data/market.json` | The newest price of every symbol, with trend facts (RSI, averages, usual daily move), the next earnings date and short interest |
| `desk/data/candles/<SYMBOL>.1d.json` | Two years of daily candles: `[time, open, high, low, close, volume]` |
| `desk/data/signals.json` | What the rules found, newest first, three weeks of it |
| `desk/data/calendar.json` | Earnings for the next two weeks and this week's US economic news |
| `desk/data/movers.json` | The day's biggest gainers, losers and busiest US stocks |
| `desk/data/news.json` | The newest headlines for each symbol on the list |
| `desk/data/record.json` | Each alert rule's record on the list over the saved candles (below) |
| `desk/data/status.json` | When the last refresh ran and what failed |

If `status.json` lists errors, tell the person in one line which data may be old.

Things the files leave unsaid:

- **"The price" before the open or after the close** is `ext.price` when a quote has one,
  and `price` otherwise. Say which you used.
- **`calendar.json` holds forecasts, not results.** For news already out, say the result
  is not in the files, or look it up and name the source.
- **A signal's `day` is the day of its candle.** Before the US open, the newest signals are
  dated yesterday, because they come from yesterday's close.
- **"20-day average" is an exponential average** (`ema20`). The 50 and 200-day are simple
  averages. Use the values in `facts`; do not work out your own.
- **No `earnings` on a quote** means no report is known in the next two weeks. It does not
  mean there is none later.
- **`short` is published twice a month**, so it can be three weeks old. Five or more days
  to cover is a crowded short. Funds and coins have no `short`.
- **Times in `calendar.json`** carry their own zone. Give them in New York time and say so.
- **Headlines in `news.json`** are filed by the source under a symbol and are sometimes
  about another company. Read the title before you use one.

## What the person knows about their own trading

`journal/my-trading.md` is the desk's memory of the person. Read it before you answer about
a trade, check a plan or write a review.

- **`## My rules`** is the person's. Never change it. When a plan or a trade breaks one of
  these rules, quote the rule word for word and say how it is broken.
- **`## What my numbers show`** is kept by the Risk Coach in the weekly review, and by no
  one else. At most seven lines. Each line names its number and the weeks it covers, for
  example "Breakouts: +0.6R a trade over 14 trades, Sep 1 to Nov 21". Remove a line that the
  newest trades no longer support. A lesson that is no longer true does more harm than none.
- **`## What I am working on`** is the person's. Read it, and in a weekly review say whether
  the week shows progress on it.

If the file is missing, the person removed it: carry on without it and do not write it again.

## What a rule has done before

`desk/data/record.json` holds each alert rule's record on the person's list: every day in the
saved daily candles when the rule would have fired, and where the price was 5, 10 and 20
trading days later. `h.<days>.won` is how often it went the rule's way, in %, and `avg` the
average move its way. `anyWon` and `anyAvg` are the same measure over every day of the same
charts. A rule shows an edge only when it beats `anyWon` and `anyAvg`. For a rule read
"either way", `size` is the average move in either direction and `anySize` its any-day value.

- Quote it when the person asks whether a signal "works", and when you check a claim.
- Fewer than 20 days in `n` is too few to judge. Say so.
- The list holds stocks the person chose today, which flatters their past. The record is
  arithmetic about the past, not a forecast. Say both when the record is the point of your answer.

## What the person keeps

Everything typed on the desk lives in `desk/.data/shared.json`, which Cabinet writes. Read
it. Do not write it: the page rewrites the whole file, and your edit would be lost. If the
file is missing, the person has entered nothing yet (the same goes for a missing
`journal/trades.json`: nothing was imported): there is no profile, the list is the
starter list, and there are no plans or trades. Say so in one line and carry on.

| Key | What |
|---|---|
| `profile` | `style`, `account`, `riskPct` (most to lose on one trade, in % of the account), `dayLossR` (stop for the day after losing this many R), `currency`, `level` (`new`, `some` or `pro`: how much they have traded. Missing means `some`) |
| `watch` | The list: `[{ sym, name }]`. Missing means the starter list |
| `rules` | Changes to the alert rules, by rule id |
| `lv:<SYMBOL>` | Lines the person drew: `[{ p, note }]` |
| `t:<id>` | One plan or trade (shape below) |

Write for the person's `level`. For `new`: plain words, every term explained the first time,
one idea at a time, and no shorthand. For `pro`: the numbers first, no basics. For `some`,
explain only what is unusual.

To change something the person keeps there (add a symbol, change a rule, edit a trade), tell
them where to press on the desk. The one thing you may write yourself is imported trades.

## A trade record

```json
{
  "id": "2026-11-19-nvda-1", "sym": "NVDA", "side": "long",
  "status": "closed", "setup": "Breakout",
  "entry": 152.4, "stop": 148.9, "stop0": 148.9, "target": 161.0,
  "qty": 70, "mult": 1,
  "exit": 158.2, "fees": 1,
  "plannedAt": "2026-11-18T13:00:00Z", "openedAt": "2026-11-18T14:35:00Z", "closedAt": "2026-11-19T19:10:00Z",
  "thesis": "", "notes": "", "mistakes": [], "followed": true
}
```

- `side`: `long` or `short`. `status`: `plan`, `open`, `closed` or `skipped`.
- `practice`: `true` on a practice trade, one with no money behind it. It counts toward the
  day's limits like any trade, so the habit is real. In a review, report practice and real
  trades apart, and never send a practice trade to a broker.
- `stop0`: the stop when the trade was opened. R is measured from it, so moving a stop later
  does not flatter the result.
- `mult`: what one unit is worth. 1 for shares and coins, 100 for an option contract, the
  point value for a future.
- The desk also keeps `riskPct` (the risk chosen for that trade), `checks` (which lines of
  the checklist were ticked), `planEntry` (the planned entry, when the fill differed) and
  `skippedAt`. Leave out any field you do not know. Never guess `setup`, `followed`, `stop`
  or `target` for an imported trade.
- Times are UTC and end in `Z`.
- `mistakes`: any of the labels the desk offers ("Chased the entry", "Too big", "Moved my
  stop", "No plan", "Revenge trade", "Sold too early", "Held too long", "Ignored the trend",
  "Traded out of boredom").

## Importing trades

Write imported trades to `journal/trades.json` as `{ "schema": "desk/trades@1", "trades": [ ... ] }`.
Create the file if it is not there. Add to the list, never replace it.

- **Ids:** `<open date>-<symbol>-<n>`, where the open date is the New York day, lowercase, with anything that is not a letter or a
  digit turned into a hyphen. `<n>` counts trades of that symbol opened that day, from 1.
- **Already there:** a trade is a duplicate when the same symbol, side, open day and
  quantity is already in `journal/trades.json` or under a `t:` key in the desk's store.
  Skip it. If the desk holds a trade with the same id, the desk's copy wins.
- **Time zone:** if the export does not name its zone, ask. If nobody can say, treat the
  times as New York time for a US broker, convert to UTC, and say that you did.
- **Part of a position sold:** a record holds one quantity and one exit. Write the part
  that was sold as a closed trade and the part still held as an open trade, both with the
  same entry, and share the opening commission between them by quantity. Number them in
  the order they closed, the open part last.
- **A date that cannot be right** (a fill on a weekend, an exit before the entry): keep it
  as the broker wrote it, say so in the trade's `notes`, and point it out to the person.
- **An option** keeps the contract as its symbol and has `mult` 100. The desk has no chart
  or live price for a contract; tell the person. `journal/EXAMPLE-trades.json` is example data: the desk hides it once the person
has a trade of their own. Never copy from it.

## Where your writing goes

| What | Where | Name |
|---|---|---|
| Morning brief | `briefs/` | `YYYY-MM-DD-1-morning.md` |
| Closing recap | `briefs/` | `YYYY-MM-DD-2-close.md` |
| Weekly review | `reviews/` | `YYYY-MM-DD-week.md` |
| Notes on flagged charts | `desk/data/scout.json` | one file, replaced each run |
| The Robinhood account | `account/robinhood.json` | one file, replaced each sync |
| What the market scan found | `account/scan.json` | one file, replaced each run |
| Holdings that need attention | `account/attention.json` | one file, replaced each run |
| Phone alerts the desk made | `account/alerts.json` | one file |
| The month in money | `account/` | `YYYY-MM-money.md` |

The desk shows the newest brief and the newest review. Use `##` headings, short paragraphs,
lists and at most one small table. Files starting with `EXAMPLE-` are examples: leave them.
