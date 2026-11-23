# The app's files

What `app/engine/refresh.mjs` writes into `app/data/`, what the Stock Scout writes, and what
the page keeps in its store. Times are ISO strings in UTC unless a field says otherwise.
Symbols are written the way Yahoo Finance writes them: `NVDA`, `BTC-USD`, `ES=F`, `^VIX`.

| File | Written by | What |
|---|---|---|
| `data/market.json` | refresh | The newest price and facts for every symbol |
| `data/candidates.json` | refresh | The stocks that fit one of the method's five setups today, with their numbers, the reasons to pass and their setup's verdict |
| `data/setups.json` | refresh | Each setup's record and its verdict: the same detectors replayed over the saved candles, every candidate followed as a call is |
| `data/reports.json` | refresh | When each US company's earnings report trades, from seven weekdays back to eight ahead |
| `data/universe.json` | refresh | Two years of daily candles for the wider list, about 100 large US stocks (`engine/lib/universe.mjs`). Only the engine reads it. Not kept in git: the first refresh fetches it |
| `data/candles/<SYMBOL>.1d.json` | refresh | Two years of daily candles. In the file name, any character other than a letter, digit, dot or hyphen becomes `_` (`^VIX` is `_VIX`, `ES=F` is `ES_F`) |
| `data/signals.json` | refresh | What the rules flagged, newest first, three weeks |
| `data/record.json` | refresh | Each rule's record on the list, over the saved daily candles |
| `data/outcomes.json` | refresh | Where each of the Scout's calls stands, and the scorecard |
| `data/movers.json` | refresh | Gainers, losers and the busiest US stocks. Rows worth a look carry `facts` |
| `data/calendar.json` | refresh | Earnings and US economic news |
| `data/news.json` | refresh | Headlines by symbol. Each has `title`, `link`, `at` and `site`, the host the link leads to |
| `data/short.json` | refresh | Short interest by symbol, each with the `source` that reported it |
| `data/status.json` | refresh | The last run: when, how long, which sources answered, what failed |
| `../opportunities/YYYY-MM-DD.json` | The Stock Scout | One day's calls. At the cabinet's root, outside this folder |
| `.data/shared.json` | The page, through Cabinet's app store | The person's list |

The engine's small server (`engine/server.mjs`, started by Cabinet once the app is allowed)
answers what a file cannot: `/candles?sym=&frame=` (`5m`, `15m`, `1h`, `1d`, `1w`),
`/search?q=`, `/refresh` (add `full=1` for everything) and `/health`. `/schedule` says when
the Scout looks (`{ days, time, zone }`, `days` being `weekdays`, `daily` or a day of the week
from `0` for Sunday), and a POST of `{ days, time }` from the cabinet's owner changes it by
rewriting the schedule line of `.jobs/find-opportunities.yaml`, which Cabinet re-reads.

`node app/engine/check-calls.mjs [YYYY-MM-DD]` (default: today in New York) checks one day
of the Scout's calls with the same code the refresh uses. It prints one line for each call:

```
Calls of 2026-11-23
AAPL  OK
NVDA  PROBLEM  From the top of the buy zone the target is 5 away and the stop 11 away. That pays 0.45 to 1, under 2 to 1.
MU  DROPPED  The stop (340) is not a price under the buy zone (338 to 344). The engine ignores this call until it is fixed.
SOFI  NOT FOLLOWED  No saved candles for it yet. Run node app/engine/refresh.mjs, then check again.
Fix what is listed above, then run this again.
```

`PROBLEM` is a hard rule of the method broken (one line for each), `DROPPED` a malformed
item, `NOT FOLLOWED` a symbol the refresh has not charted yet. The last line is `All in
order.` and the exit code 0 when every call is `OK` or the file has no calls. Otherwise the
exit code is 2, also when the day's file is missing or unreadable.

## data/market.json

The values below show the shape. They are not today's prices.

```json
{
  "schema": "reminder/market@1",
  "at": "2026-11-19T13:31:53Z",
  "session": "pre",
  "strip": ["ES=F", "NQ=F", "^VIX", "^TNX", "DX-Y.NYB", "GC=F", "CL=F", "BTC-USD"],
  "regime": {
    "stance": "against-you",
    "because": ["The S&P 500 fund closed at 689.81, under its 200-day average of 732.5.", "The fear gauge is at 28.5: frightened.", "20% of the 10 listed stocks closed above their 50-day average: broad weakness."],
    "fund": { "close": 689.81, "sma50": 759.3, "sma200": 732.5, "trend": "mixed", "change": -3.6, "usualMove": 1.2, "rvol": 2.9, "hardFall": true },
    "fear": { "level": 28.5, "read": "frightened" },
    "breadth": { "stocks": 10, "above50": 20, "above200": 60 }
  },
  "quotes": {
    "NVDA": {
      "name": "NVIDIA Corporation", "kind": "EQUITY", "currency": "USD", "exchange": "NasdaqGS",
      "price": 150.96, "prev": 155.45, "change": -2.89, "at": "2026-11-18T21:00:00Z",
      "dayHigh": 159.7, "dayLow": 150.4, "volume": 312000000,
      "ext": { "price": 152.99, "change": 1.34, "at": "2026-11-19T13:31:41Z" },
      "spark": [151.2, 151.4],
      "facts": { "close": 150.96, "ema20": 171.3, "sma50": 189.2, "sma200": 176.4, "rsi": 21.1, "atr": 9.8, "atrPercent": 6.5, "rvol": 1.4, "high52": 219.0, "low52": 101.2, "fromHigh": -31.1, "trend": "down",
                 "rs": { "m1": -12.4, "m3": -20.1, "m6": 3.2 }, "ten": { "stock": -9.6, "market": -4.8 } },
      "earnings": { "date": "2026-11-25", "when": "after the close" },
      "short": { "asOf": "10/30/2026", "shares": 279579505, "avgVolume": 99940095, "daysToCover": 2.8, "source": "FINRA" }
    }
  }
}
```

- `session`: the US stock session, `pre`, `open`, `after` or `closed`.
- `regime`: the market's stance, counted as step 1 of `playbooks/method.md` describes
  (`engine/lib/market.mjs`). Null when the S&P 500 fund has no chart.
  - `stance`: `against-you` when the fund (`SPY`) closed under its 200-day average, or the
    fear gauge is over 25, or `fund.hardFall`. `with-you` when the fund's `trend` is `up` and
    the fear gauge is under 20. `mixed` otherwise.
  - `because`: the reasons in plain sentences, with the numbers.
  - `fund`: the fund's facts. `change` is today's move in percent, `usualMove` its usual
    daily move in percent as it stood yesterday. `hardFall`: it fell more than twice
    `usualMove` today on at least 1.5 times its usual volume (`rvol`).
  - `fear`: the fear gauge's level and its reading: `calm` under 18, `uneasy` up to 25,
    `frightened` over 25. Null when it has no price.
  - `breadth`: of the list's US stocks (no fund, coin or future), the percent closing above
    their 50-day and their 200-day average. It is reported and does not change `stance`.
- `price`: the last price of the regular session. `change`: percent against `prev`.
- `ext`: a trade outside the regular session, and its percent change against `price`. Only
  present before the open and after the close.
- `spark`: up to 48 closes of the current session, oldest first, for the small line.
- `facts`: from the daily candles. `ema20`, `sma50`, `sma200` are the 20, 50 and 200-day
  averages. `atr` is the usual daily move in price. `rvol` is today's volume against the
  20-day average. `trend` is `up` (price above the 50-day, and that above the 200-day),
  `down` (the mirror) or `mixed`.
- `facts.rs`: strength against the market. The symbol's return over 21, 63 and 126 trading
  days (`m1`, `m3`, `m6`) less the S&P 500 fund's return over the same days, in percent.
  Above zero, it beat the market. A value is null while the history is shorter than that.
- `facts.ten`: the last 10 trading days, the symbol's move beside the fund's, in percent.
  Null with under 10 days of history.
- `earnings` and `short` appear when known. `short.asOf` is month/day/year. `short.source` is
  `FINRA` or `Nasdaq`: FINRA's terms ask that it is named beside its numbers.

## data/candles/<SYMBOL>.1d.json

```json
{ "sym": "NVDA", "frame": "1d", "at": "2026-11-19T13:31:50Z", "source": "Yahoo Finance", "name": "NVIDIA Corporation", "kind": "EQUITY",
  "c": [[1795098600, 152.1, 159.7, 150.4, 150.96, 312000000]] }
```

Each row is `[time in seconds, open, high, low, close, volume]`, oldest first. During the
session the last row is today so far. `source` is `Yahoo Finance`, `Coinbase` or `Nasdaq`.
`kind` is the source's word for what it is (`EQUITY`, `ETF`, `CRYPTOCURRENCY`, `FUTURE`, `INDEX`).
There is one file for every listed symbol, the S&P 500 fund, every stock the Scout called,
the day's movers that carry `facts`, and every stock in `candidates.json`. A mover's or a
candidate's file is removed once it leaves the lists.

## data/signals.json

```json
{ "schema": "reminder/signals@1", "at": "2026-11-19T13:31:53Z",
  "items": [ { "id": "TSLA:bullFlag:2026-11-19", "sym": "TSLA", "name": "Tesla", "kind": "chart", "rule": "bullFlag", "side": "long",
               "text": "Ran up 17.7% and has rested for 3 days on lighter volume. A close above 404.4 is the trigger.",
               "level": 404.4, "price": 383.72, "day": "2026-11-19", "at": "2026-11-19T13:31:53Z" } ] }
```

- `day` is the New York date of the candle the signal was read from. Before the open that
  is yesterday.
- `kind`: `chart` (a rule fired) or `earnings` (a report is due within a week).
- `rule`: a rule id from `engine/lib/signals.mjs`, or `earnings`.
- `side`: `long`, `short` or `both`. `at` is when it was first seen.
- An id never repeats, so a signal is listed once however many times the refresh runs.

## data/candidates.json

The five setups of `playbooks/method.md`, looked for in code (`engine/lib/setups.mjs`) on
the person's US stocks, the movers that carry `facts` and the wider list. Rebuilt on a full
refresh, when older than six hours, and whenever `setups.json` is rebuilt.

```json
{ "schema": "reminder/candidates@1", "at": "2026-11-23T15:20:00Z", "day": "2026-11-23", "asOf": "2026-11-20", "stance": "against-you",
  "items": [ { "sym": "LOW", "name": "Lowe's Companies, Inc.", "from": "universe",
               "setup": "A leader holding up in a weak market",
               "buy": [211, 214], "stop": 204, "target": 293, "pay": 7.9,
               "notes": ["Over 10 days it moved -1.7% while the S&P 500 fund moved -6.2%.", "Above its 50-day average (202.08). The low of the last week is 211.", "Its 52-week high is 293.06."],
               "spoilers": [ { "rule": "ceiling", "text": "Its 200-day average (222.3) is 8.3 above the buy zone, nearer than the stop is far (10)." } ],
               "verdict": "fails", "verdictFrom": "stance",
               "facts": { "close": 220.84, "atr": 6.61 } } ] }
```

- `asOf`: the New York day of the candles the setups were judged on. It is the last full
  day: during the session today's candle is left out, so `facts` here can differ from the
  live `facts` in `market.json`. `stance` is the market's stance the scan used.
- `from`: `list`, `movers` or `universe`, the first of the three places the stock was found.
- `setup`: one of the method's five names. A stock that fits two setups is listed twice.
- `buy`, `stop`, `target`: built by the method's step 5. `pay` is the target's distance from
  the top of the zone divided by the stop's distance from it. The stop is one and a half
  usual daily moves under the top of the zone, except for a gap on results, whose stop is
  the low of the gap day, at least one usual daily move under the top of the zone. The
  target is the high it fell from (pullback), three times the stop's distance above the
  zone (breakout), the 52-week high (leader), twice the stop's distance or the 52-week high
  if nearer (gap), twice the stop's distance (turn).
- `notes`: what the detector saw, with the numbers.
- `spoilers`: the reasons to pass that arithmetic can decide. Empty means none was found,
  not that there is none: bad news and the rule's record are not checked here. `rule` is
  `room` (stop nearer than one usual daily move), `zone` (zone wider than one), `pay` (under
  2 to 1), `far` (stop more than 8% under the zone), `earnings` (a report within five
  trading days), `stretched` (more than two usual daily moves above the 20-day average) or
  `ceiling` (the 200-day average or the high of the last 20 days between zone and target,
  nearer than the stop is far).
- `verdict`: what the record in `setups.json` says of this setup, `pays`, `fails` or
  `unproven`. `verdictFrom` says which record it is: `stance`, the setup's record under
  today's `stance`, or `overall`, the setup's whole record, used when the stance's own is
  `unproven`.
- `facts`: the same object a quote has, as of `asOf`.
- Items with no spoilers come first. Among those, `pays` comes before `unproven` before
  `fails`, then the higher `pay`.
- Left out: funds, coins, futures, currencies, a price under 5 dollars, fewer than 500,000
  shares on a usual day, a chart younger than 200 days, and any stock with an open call.

## data/setups.json

Does the method work? Every day of the saved candles of the list's US stocks and the wider
list, judged as if it were today (a detector on one day sees no later candle), and every
candidate followed through the days after it exactly as a call is (`engine/lib/scan.mjs`).
Rebuilt on a full refresh, at least every 12 hours, and when the saved file is of an older
`schema`.

```json
{ "schema": "reminder/setups@2", "at": "2026-11-23T15:20:00Z", "from": "2025-09-16", "to": "2026-11-20",
  "symbols": ["NVDA", "AAPL"], "stanceFrom": "fund and fear gauge",
  "setups": {
    "A leader holding up in a weak market": {
      "candidates": 206, "entered": 148, "closed": 134, "won": 42, "target": 13, "avgR": 0.04, "verdict": "unproven",
      "byStance": { "with-you": { "candidates": 0, "entered": 0, "closed": 0, "won": 0, "target": 0, "avgR": null, "verdict": "unproven" },
                    "mixed": { "candidates": 156, "entered": 111, "closed": 102, "won": 34, "target": 11, "avgR": 0.1, "verdict": "pays" },
                    "against-you": { "candidates": 50, "entered": 37, "closed": 32, "won": 8, "target": 2, "avgR": -0.14, "verdict": "fails" } },
      "spoiled": { "candidates": 631, "entered": 437, "closed": 410, "won": 172, "target": 138, "avgR": 0.18, "why": { "pay": 371, "ceiling": 300 } }
    }
  },
  "any": { "candidates": 4035, "entered": 3668, "closed": 3634, "won": 1164, "target": 1143, "avgR": 0.01,
           "byStance": { "with-you": {}, "mixed": { "closed": 757, "avgR": -0.1 }, "against-you": { "closed": 346, "avgR": 0.06 } } } }
```

- `candidates`: days the setup fit with no reason to pass. `entered`: those whose price came
  into the buy zone. `closed`, `won`, `target`, `avgR`: the scorecard of the finished ones,
  as `score` in `outcomes.json` counts it.
- A new candidate is not counted on a stock while the last one of the same setup is still
  waiting or open.
- `byStance`: the same count, split by the market's stance on the day of the candidate.
  `stanceFrom` says how the stance of a past day was named: `fund and fear gauge`, or
  `fund only` when the fear gauge has no saved history.
- `spoiled`: the days the setup fit but a reason to pass applied. They are not calls. They
  are followed apart, to show what passing saved or cost. `why` counts each reason.
- `any`: the yardstick. A call with no reason behind it, made on any day: a buy zone half a
  usual daily move deep under the close, the stop one usual daily move under the top of
  the zone, the target twice that above it, one at a time for each stock. A setup has
  earned nothing until its `avgR` beats this one's. It has the same counts overall and
  under `byStance`, and no `verdict`.
- `verdict`, on a setup and on each stance under `byStance`: the record in one word, read
  beside `any` for the same slice (`engine/lib/verdict.mjs` holds the two numbers).
  `pays`: 30 or more closed, and an `avgR` more than 0.05 above the yardstick's. `fails`:
  30 or more closed, and an `avgR` under the yardstick's. `unproven`: anything else. To
  judge a call, read the verdict of its setup under the market's stance, and the setup's
  overall verdict when that one is `unproven`.
- The verdict is counted again on every rebuild, over about 14 months of about 100 large
  stocks. It can change as days are added, and it says nothing about small or thinly
  traded stocks.
- What the replay cannot know: past earnings dates. The `earnings` reason to pass is never
  applied, and "A gap up on results that holds" counts every gap of that size and volume,
  whether or not results caused it.
- Under 30 closed, the count is a hint and not a finding, and the verdict is `unproven`.

## data/reports.json

```json
{ "at": "2026-11-23T15:20:00Z", "bySym": { "DELL": ["2026-11-25"], "WMT": ["2026-11-19"] } }
```

For every US company in Nasdaq's earnings calendar from seven weekdays back to eight ahead:
the first session that trades on its report. That is the day of the report, or the next
weekday when the company reports after the close. A stock the Scout has called keeps its
older days. The setups and the checks of the Scout's calls read it; `calendar.json` stays
the short list a person reads.

## data/universe.json

```json
{ "at": "2026-11-23T15:19:00Z", "bySym": { "KO": { "sym": "KO", "frame": "1d", "at": "...", "source": "Yahoo Finance", "name": "The Coca-Cola Company", "kind": "EQUITY", "c": [] } } }
```

One candle file, in the shape above, for each stock of the wider list. Fetched when it is
missing, and on a full refresh when older than 12 hours: never on the other five-minute
runs. About 2.4 MB, and left out of git (`data/.gitignore`), so the first refresh of a new
cabinet builds it, which takes about 20 seconds. The page and the Scout do not read it: a
stock from it that becomes a candidate gets its own file in `candles/`.

## data/calendar.json

```json
{ "at": "...",
  "earnings": [ { "sym": "WMT", "name": "Walmart Inc.", "date": "2026-11-19", "when": "before the open", "cap": 1011711340000, "estimate": "$0.64", "lastYear": "$0.62", "mine": false } ],
  "economy": [ { "title": "Unemployment Claims", "country": "USD", "at": "2026-11-19T08:30:00-05:00", "impact": "High", "forecast": "198K", "previous": "200K" } ] }
```

`earnings` holds every symbol on the person's list (`mine: true`) plus the six largest
companies reporting each day that are worth 20 billion dollars or more. `economy` is this week's US news of medium or high impact.

## data/record.json

Every day in the saved daily candles of the list when a rule would have fired, the rules too
noisy to flag a chart with included. Rebuilt when the list changes, and at least every 12 hours.

```json
{
  "schema": "reminder/record@1", "at": "2026-11-22T15:30:00Z", "key": "...",
  "from": "2024-12-22", "to": "2026-11-22", "symbols": ["SPY", "NVDA"], "horizons": [5, 10, 20],
  "rules": {
    "breakout": {
      "fired": 146,
      "h": { "10": { "n": 145, "won": 51.7, "avg": 1.4, "median": 0.2, "read": "way", "anyWon": 53.6, "anyAvg": 1.1 } },
      "bySym": { "NVDA": { "n": 9, "avg": 2.1 } }
    },
    "squeeze": { "fired": 71, "h": { "10": { "n": 71, "size": 6.6, "read": "size", "anySize": 6.4 } }, "bySym": {} }
  },
  "any": { "10": { "n": 6914, "up": 53.6, "down": 46.4, "avg": 1.1, "size": 6.4 } }
}
```

- `fired`: the days the rule fired. `h.<days>.n`: those with that many trading days after them.
- `read: "way"`: judged by the side the rule named that day. `won` is the % of days the price
  went that way, `avg` and `median` the move that way in %. `anyWon` and `anyAvg` are the same
  over every day of the same charts, as often long and short as the rule was.
- `read: "size"`: a rule with no side. `size` is the average move either way in %, `anySize`
  the same over every day.
- `bySym`: per symbol, 10 trading days later only.

## data/outcomes.json

```json
{ "schema": "reminder/outcomes@1", "at": "2026-11-25T14:40:00Z",
  "calls": [ { "id": "2026-11-23:AAPL", "day": "2026-11-23", "sym": "AAPL", "setup": "Pullback in an uptrend", "state": "open",
               "entry": 341.2, "enteredOn": "2026-11-24", "closedOn": null, "r": 0.6, "price": 346.1 } ],
  "score": { "closed": 12, "won": 7, "target": 5, "avgR": 0.4, "since": "2026-10-20",
             "bySetup": { "Pullback in an uptrend": { "closed": 8, "won": 5, "target": 4, "avgR": 0.6 } } },
  "problems": [ { "id": "2026-11-23:AAPL", "why": ["The stop is 4 under the top of the buy zone, nearer than one usual daily move (8.11). An ordinary day would hit it: 335 or lower gives it room."] } ] }
```

One row for every well-formed call in the Scout's files of the last 90 days, worked out
from the daily candles since the call's `day` (`engine/lib/calls.mjs`). A call is followed
from the first session that opens after the file's `at`: the call's own day when `at` is
before 9:30 in New York, the next trading day when it is later, because that day's candle
already holds moves made before the call. A file with no `at`, or one that is not a time
on the file's own day in New York, is followed from its own day.

- `state`: `waiting`, `in-zone`, `open`, `target`, `stopped`, `timed-out` or `expired`.
  `playbooks/how-it-works.md` says what each means and how it is decided.
- `entry` is where the price came into the buy zone, `enteredOn` and `closedOn` are New York
  dates. They are null until they apply.
- `r` is the result in units of the risk taken (entry to stop is 1). Null before an entry.
- `score` counts finished calls only (`target`, `stopped`, `timed-out`): how many, how many
  finished above zero (`won`), how many reached their target, the average `r`, and the day
  of the oldest one. `bySetup` is the same count for each `setup` name the Scout wrote
  (null for a setup with nothing finished yet).
- `setup`: the name the Scout gave the call, or null.
- `problems`: the well-formed calls that break a hard rule of the method, each with the
  reasons as plain sentences. Such a call is still followed and scored. The rules: the stop
  is nearer than one usual daily move to the top of the zone, the zone is wider than one
  usual daily move, the pay from the top of the zone is under 2 to 1, the stop is more than
  8% under the zone, an earnings report trades within five trading days of the call's day
  (`reports.json`), the setup is not one of the five names, an earlier call on the same
  stock was still open, or the setup's `verdict` in `setups.json` is `fails`. That verdict
  is the setup's under the stance the Scout's file names in `market.stance`, and its
  overall verdict when that one is `unproven` or the file names no stance. Its sentence
  carries the numbers: "The record says no. "A leader holding up in a weak market"
  finished 32 times in a market that was against you and averaged -0.14 of the risk taken,
  under the 0.06 of a call made for no reason on any day (setups.json)." The usual daily move is the one on the last full day before the
  call's day, and the first two rules allow a tenth of slack, because it drifts from day to
  day. `node app/engine/check-calls.mjs` prints the same verdicts for one day.

## ../opportunities/YYYY-MM-DD.json

Written by the Stock Scout, one file for each day it ran, named for the date in New York.
`playbooks/how-it-works.md` holds the shape and its rules. A file whose name starts with
`EXAMPLE-` ships with the cabinet: the page shows it, labelled, until a real one exists, and
the engine never scores it. A call without a two-number `buy`, a `stop` under it and a
`target` over it is ignored by the engine and by the page.

## data/movers.json

```json
{ "at": "2026-11-23T14:14:00Z",
  "gainers": [ { "sym": "GAP", "name": "Gap, Inc. (The)", "price": 20.94, "change": 11.4, "volume": 31000000, "avgVolume": 9000000, "facts": { "trend": "up", "rsi": 61.2 } } ],
  "losers": [], "active": [] }
```

Twelve rows at most in each list. Up to 16 of the gainers and busiest stocks priced at 5
dollars or more carry `facts`, the same object a quote in `market.json` has, and have a
candle file. Fetched on a full refresh and when older than six hours.

## .data/shared.json

| Key | What |
|---|---|
| `watch` | The person's list: `[{ sym, name }]`. Missing means the starter list |

## Where the numbers come from

`engine/lib/sources.mjs` holds the order. "No licence" means a public endpoint that needs no
key and whose owner has not published terms that allow this use: it works, it can change or
stop without notice, and it is for one person's own use. All of those answer only while
`UNLICENSED_FALLBACK` in `sources.mjs` is true. `data/status.json` says which sources
answered on the last run and what failed.

| Data | Source | Key | Licence |
|---|---|---|---|
| Stock and fund prices, today's candles, charts | Yahoo Finance, then Nasdaq (daily candles only) | None | No licence for this use |
| Crypto prices and charts | Yahoo Finance, then Coinbase | None | No licence for this use |
| Futures and indexes (the strip across the top) | Yahoo Finance | None | No licence for this use |
| Gainers, losers, most traded | Yahoo Finance | None | No licence for this use |
| Short interest | FINRA, then Nasdaq when FINRA has no report | None | Clean for personal use: FINRA's terms allow it and ask that FINRA is named as the source. Nasdaq: no licence for this use |
| Symbol search | Yahoo Finance | None | No licence for this use |
| Earnings calendar | Nasdaq | None | No licence for this use |
| Economic calendar | Forex Factory's weekly file | None | No licence for this use |
| Headlines | Yahoo Finance's RSS feed | None | No licence for this use: a feed made for feed readers, with no terms to rely on |
