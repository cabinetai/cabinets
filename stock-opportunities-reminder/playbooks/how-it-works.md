---
title: How it works
order: 1
---
# How it works

Read this before you answer a question or touch a file in this cabinet.

## Three promises

1. **Never invent a number.** Every price, level, date and statistic you give comes from a
   file in `app/data/`, from a file you wrote in `opportunities/`, or from a source you
   name. If you do not have it, say so, or refresh and read again.
2. **Point, never push.** You say what is worth a look, where a buyer would buy, where the
   idea is wrong and what it aims for. You never say "buy", never name an amount, and
   never promise a result. The decision is the person's. You are not a financial adviser.
3. **Never trade.** Nothing in this cabinet can place an order, and you never ask for a
   broker's password or keys.

## Getting fresh numbers

Run this from the cabinet root. It costs no AI. A plain run takes a few seconds, a full one
about a minute.

```
node app/engine/refresh.mjs          # what is due now
node app/engine/refresh.mjs --full   # everything, whatever its age
```

It reads the person's list, fetches public prices, counts the market's stance, finds every
stock that fits a setup, tests the setups on the past, follows each of your calls, and writes
the files below. `app/DATA.md` describes each file
field by field.

| File | What is in it |
|---|---|
| `app/data/market.json` | `regime`: the market's stance, counted by the engine. Then the newest price of every symbol, with `facts` (trend, averages, RSI, usual daily move, distance from the 52-week high, strength against the market), the next earnings date and short interest |
| `app/data/candidates.json` | Today's candidates: every stock that fits a setup, with its buy zone, stop, target, reasons to pass and the setup's verdict. Your calls come from here |
| `app/data/setups.json` | How each setup did when replayed over the saved charts, overall and by market stance, with a verdict |
| `app/data/candles/<SYMBOL>.1d.json` | Two years of daily candles: `[time, open, high, low, close, volume]`. One for every listed symbol, every candidate, every stock you called, and today's movers |
| `app/data/signals.json` | What the rules flagged, newest first, three weeks of it |
| `app/data/record.json` | How each rule did on this list over the saved candles (below) |
| `app/data/movers.json` | The day's biggest gainers, losers and busiest US stocks. Rows worth a look carry `facts` |
| `app/data/calendar.json` | Earnings for the next two weeks and this week's US economic news |
| `app/data/reports.json` | The day each company reports, a week back to eight days ahead |
| `app/data/news.json` | The newest headlines for each symbol on the list |
| `app/data/outcomes.json` | Every call you made in the last 90 days and where it stands, with your scorecard |
| `app/data/status.json` | When the last refresh ran and what failed |

If `status.json` lists errors, say in one line which numbers may be old.

Things the files leave unsaid:

- **"The price" before the open or after the close** is `ext.price` when a quote has one,
  and `price` otherwise. Say which you used.
- **A signal's `day` is the day of its candle.** Before the US open the newest signals are
  dated yesterday, because they come from yesterday's close.
- **"20-day average" is an exponential average** (`ema20`). The 50 and 200-day are simple
  averages. Use the values in `facts`. Do not work out your own.
- **No `earnings` on a quote** means no report is known in the next two weeks, not that
  there is none later.
- **`short` is published twice a month**, so it can be three weeks old. Funds have none.
- **`calendar.json` holds forecasts, not results.**
- **Headlines in `news.json`** are filed under a symbol by their source and are sometimes
  about another company. Read the title before you lean on one.

## The person's list

The list lives in `app/.data/shared.json` under `watch`, as `[{ sym, name }]`. Cabinet
writes that file. Read it, never write it. If the file or the key is missing, the person is
on the starter list, which `market.json` shows. To add or remove a stock they use "My
stocks" on the page.

## The file you write

One file for each day you run: `opportunities/YYYY-MM-DD.json`, where the date is today in
New York. Running twice in a day replaces the file. Never touch a file of another day, and
never copy from a file whose name starts with `EXAMPLE-`.

```json
{
  "schema": "reminder/opportunities@1",
  "day": "2026-11-23",
  "at": "2026-11-23T13:30:00Z",
  "market": { "stance": "against-you", "read": "Two sentences, with the numbers." },
  "items": [
    {
      "sym": "AAPL", "name": "Apple",
      "setup": "Pullback in an uptrend",
      "headline": "One line a person reads first: what is happening.",
      "why": ["Two to four reasons.", "Each with its number.", "Each one sentence."],
      "buy": [338, 344], "stop": 332, "target": 361,
      "horizon": "2 to 6 weeks",
      "conviction": 1,
      "risks": "What would spoil it, in one or two sentences.",
      "evidence": "What the call rests on, and how much that is worth."
    }
  ],
  "passed": [ { "sym": "NVDA", "why": "Why not, in one or two sentences." } ],
  "nothing": ""
}
```

- `stance` is `with-you`, `mixed` or `against-you`.
- Every call is one item of `app/data/candidates.json`: the same `sym` and `setup`, and
  its `buy`, `stop` and `target` copied exactly. You add the words, never the numbers.
- `setup` is one of the five names in [The method](method.md), spelled as there.
- `buy` is `[low, high]`. `stop` is under `low`. `target` is over `high`. A call that
  breaks this is thrown away by the engine.
- `conviction` is 1 or 2. See the method for when 3 opens.
- `items` holds three calls at most and may be empty. When it is empty, `nothing` says why
  in one or two sentences, and `passed` still lists what you looked at.
- `passed` holds five at most: the tempting ones, not every stock you saw.
- Plain words everywhere. The person may never have read a chart.

After you write it, run `node app/engine/refresh.mjs`, then
`node app/engine/check-calls.mjs`. It prints `OK` for each call, or what is wrong with it in
a plain sentence: malformed numbers, a stop with too little room, pay under 2 to 1, earnings
too close, a setup whose record says no. Fix or remove the call and run the check again
until it ends with "All in order." The same problems are kept in `problems` in
`app/data/outcomes.json`.

## How a call is scored

The engine follows each call through the daily candles. Nobody grades it by hand.

| State | Meaning |
|---|---|
| `waiting` | The price has not come into the buy zone yet |
| `in-zone` | It was entered, and the price is inside the zone right now |
| `open` | Entered, and neither the stop nor the target has been reached. `r` is the result so far |
| `target` | Reached its target |
| `stopped` | Fell through its stop. A day that touched both counts as the stop |
| `timed-out` | Thirty trading days after the entry with neither reached. Closed at that day's price |
| `expired` | Ten trading days without reaching the zone, or it closed under the stop first |

`r` is the result in units of the risk taken: the distance from the entry to the stop is 1.
A call that reached a target three stop-distances away made 3. A stopped call lost 1, or a
little more when the price opened under the stop.

`score` counts finished calls only: `closed`, `won` (finished above zero), `target`
(reached the target) and `avgR`. `score.bySetup` gives the same for each setup. Under 20 finished calls, luck decides. Say so whenever you
quote it.

## A rule's record

`record.json` replays every rule over the saved candles of the list. For each rule,
`rules.<id>.h["10"]` holds how often it fired (`n`), how often the price was higher 10
trading days later (`won`, in percent), and the average move (`avg`). `anyWon` and `anyAvg`
are the same measure over every day of the same charts. A rule is only worth something
where it beats "any day". `bySym.<SYMBOL>` gives the count and average for one stock.
Under 20 cases, the record is a hint and not a finding.
