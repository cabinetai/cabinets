# The app's files

What `app/engine/refresh.mjs` writes into `app/data/`, and what the Stock Scout writes.
Times are ISO strings in UTC unless a field says otherwise.
Symbols are written the way Yahoo Finance writes them: `NVDA`, `BRK.B`, `^VIX`.

| File | Written by | What |
|---|---|---|
| `data/market.json` | refresh | The newest price and facts for every symbol |
| `data/candidates.json` | refresh | The stocks that fit one of the method's five setups today, with their numbers, the reasons to pass and their setup's verdict |
| `data/setups.json` | refresh | Each setup's record and its verdict: the same detectors replayed over the saved candles, every candidate followed as a call is |
| `data/reports.json` | refresh | When each US company's earnings report trades, from seven weekdays back to eight ahead |
| `data/universe.json` | refresh | Two years of daily candles for the wider list, about 100 large US stocks (`engine/lib/universe.mjs`). Only the engine reads it. Not kept in git: the first refresh fetches it |
| `data/candles/<SYMBOL>.1d.json` | refresh | Two years of daily candles. In the file name, any character other than a letter, digit, dot or hyphen becomes `_` (`^VIX` is `_VIX`) |
| `data/signals.json` | refresh | What the rules flagged, newest first, three weeks |
| `data/record.json` | refresh | Each rule's record on the list, over the saved daily candles |
| `data/outcomes.json` | refresh | Where each of the Scout's calls stands, and the scorecard |
| `data/movers.json` | refresh | Gainers, losers and the busiest US stocks. Rows worth a look carry `facts` |
| `data/calendar.json` | refresh | Earnings and US economic news |
| `data/news.json` | refresh | Headlines by symbol. Each has `title`, `link`, `at` and `site`, the host the link leads to |
| `data/short.json` | refresh | Short interest by symbol, each with the `source` that reported it |
| `data/status.json` | refresh | The last run: when, how long, what failed, and what each source last did |
| `data/refresh.lock` | refresh | Present while a refresh runs, so two never run at once. Not kept in git |
| `../opportunities/YYYY-MM-DD.json` | The Stock Scout | One day's calls. At the cabinet's root, outside this folder |

"The list" in this file is the fixed starter list in `engine/refresh.mjs`: the two index
funds and ten heavily traded US stocks. The engine also scans a wider
list of about 100 large US stocks (`engine/lib/universe.mjs`). The page has no control to
change either.

The engine's small server (`engine/server.mjs`, started by Cabinet once the app is allowed)
answers what a file cannot: `/candles?sym=` (daily candles for one symbol, each row as in a
candle file below), `/refresh` (what is due now) and `/health`. A full refresh is run from
the command line: `node app/engine/refresh.mjs --full`. `/refresh` answers with
`status.json`, and with `busy: true` beside it
when a refresh in another process was already running and this one gave way. `/schedule` says when
the Scout looks (`{ days, time, zone }`, `days` being `weekdays`, `daily` or a day of the week
from `0` for Sunday), and a POST of `{ days, time }` from the cabinet's owner changes it by
rewriting the schedule line of `.jobs/find-opportunities.yaml`, which Cabinet re-reads.

`node app/engine/check-calls.mjs [YYYY-MM-DD]` (default: today in New York) checks one day
of the Scout's calls. It follows them with the same code the refresh uses, and holds the
day's file against `data/candidates.json`. It prints one line for each call:

```
Calls of 2026-11-23
FILE  PROBLEM  It holds 3 calls. A market that is mixed allows 2 at most.
AAPL  OK
NVDA  PROBLEM  Its numbers are not the candidate's. candidates.json gives buy 338 to 344, stop 332, target 370. Copy them exactly.
TSLA  PROBLEM  TSLA is not in candidates.json. A call is always one of its items: remove this one.
MU  DROPPED  The stop ("332") is not a price under the buy zone (338 to 344). A price in quotes is text: write the bare number. The engine ignores this call until it is fixed.
SOFI  NOT FOLLOWED  No saved candles for it yet. Run node app/engine/refresh.mjs, then check again.
Fix what is listed above, then run this again.
```

`PROBLEM` is a hard rule of the method broken (one line for each), `DROPPED` a malformed
item, `NOT FOLLOWED` a symbol the refresh has not charted yet. A line that starts with
`FILE` is about the file as a whole. The last line is `All in order.` and the exit code 0
when every call is `OK` or the file has no calls. Otherwise the exit code is 2, also when
the day's file is missing or unreadable.

What it checks, beyond the `problems` of `data/outcomes.json` (below):

- Each call is an item of `candidates.json` with the same `sym` and `setup`, its `buy`,
  `stop` and `target` copied exactly, and no `spoilers`. Only this check compares the two,
  and only when `candidates.json` is of the same day: the candidates are scanned again
  later in the day, so a call that was right when it was written is never told off for it
  in `outcomes.json`. Candidates of an earlier day, or none, are a `FILE` problem, and so is a call in a
  file whose day's candidates carry a `problem` (prices could not be fetched). With
  candidates of a later day, an older file is checked without them.
- The file names a stance, and holds no more calls than the stance allows: three when it is
  `with-you`, two when `mixed`, one when `against-you`. The stance is the harsher of the
  file's and the engine's `regime.stance` in `market.json`, when that is of the same day.
- `conviction` is 1 or 2. It is 1 for a setup whose verdict under that stance is
  `unproven`, and a day holds at most one such call. 3 is accepted once `score.bySetup`
  in `outcomes.json` has 20 finished calls of the setup with an `avgR` above zero.

## data/market.json

The values below show the shape. They are not today's prices.

```json
{
  "schema": "reminder/market@1",
  "at": "2026-11-19T13:31:53Z",
  "session": "pre",
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
  - `fear`: the fear gauge's level and a word for the level alone: `calm` under 18,
    `uneasy` from 18 to 25, `frightened` over 25. The stance turns on 20 and 25, so
    `uneasy` at 19 can still be `with-you`. Null when it has no price.
  - `breadth`: of the list's US stocks (no fund), the percent closing above
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
session the last row is today so far. `source` is `Yahoo Finance` or `Nasdaq`.
`kind` is the source's word for what it is (`EQUITY`, `ETF`, `INDEX`).
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
- An id is the symbol, the rule and `day`. It never repeats, so a signal is listed once
  however many times, and on however many days, the refresh reads that candle.

## data/candidates.json

The five setups of `playbooks/method.md`, looked for in code (`engine/lib/setups.mjs`) on
the list's US stocks, the movers that carry `facts` and the wider list. Rebuilt on a full
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

- `asOf`: the New York day of the candles the setups were judged on: the last full day of
  the S&P 500 fund. A chart's newest candle is a full day only when the chart was fetched
  at or after 16:00 in New York on that candle's day, so today's candle is left out during
  the session, and a chart saved mid-session is never read as a whole day later. No chart
  is read past `asOf`. So `facts` here can differ from the live `facts` in `market.json`.
  `stance` is the market's stance the scan used.
- `problem`: present only when prices could not be fetched: the S&P 500 fund has no chart,
  or its chart is past its age limit (20 minutes while the market is open, six hours when
  it is closed) and the fetch failed. Then `items` is empty and `asOf` is null, unless
  candidates of the same day were already saved, which stay. `check-calls.mjs` reports a
  day's file that holds a call beside a `problem`. The file is built again on the next refresh.
- A stock whose own chart ends before `asOf` could not be fetched again and is left out.
- `from`: `list`, `movers` or `universe`, the first of the three places the stock was found.
- `setup`: one of the method's five names. A stock that fits two setups is listed twice.
- `buy`, `stop`, `target`: built as the method's step 4 describes for each setup. `pay` is
  the target's distance from the top of the zone divided by the stop's distance from it. The stop is one and a half
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
- Left out: funds, a price under 5 dollars, fewer than 500,000
  shares on a usual day, a chart younger than 200 days, and any stock still waiting or open
  from a call of an earlier day. A stock called today stays in, so today's file can be
  checked against this one and written again.

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
older days. When Nasdaq does not answer for a day, what was saved for that day is kept,
`status.json` lists the days, and `sources.Nasdaq` is false. The setups and the checks of
the Scout's calls read it; `calendar.json` stays the short list a person reads, and keeps
its saved rows for such a day the same way.

## data/universe.json

```json
{ "at": "2026-11-23T15:19:00Z", "bySym": { "KO": { "sym": "KO", "frame": "1d", "at": "...", "source": "Yahoo Finance", "name": "The Coca-Cola Company", "kind": "EQUITY", "c": [] } } }
```

One candle file, in the shape above, for each stock of the wider list. Fetched when it is
missing, and when its newest full day is behind the S&P 500 fund's, on a run that scans
for candidates (a full one, or the first after six hours): once a trading day as a rule.
About 2.4 MB, and left out of git (`data/.gitignore`), so the first refresh of a new
cabinet builds it, which takes about 20 seconds. The page and the Scout do not read it: a
stock from it that becomes a candidate gets its own file in `candles/`.

## data/calendar.json

```json
{ "at": "...",
  "earnings": [ { "sym": "WMT", "name": "Walmart Inc.", "date": "2026-11-19", "when": "before the open", "cap": 1011711340000, "estimate": "$0.64", "lastYear": "$0.62", "mine": false } ],
  "economy": [ { "title": "Unemployment Claims", "country": "USD", "at": "2026-11-19T08:30:00-05:00", "impact": "High", "forecast": "198K", "previous": "200K" } ] }
```

`earnings` holds every symbol on the list (`mine: true`) plus the six largest
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
               "entry": 341.2, "enteredOn": "2026-11-24", "closedOn": null, "r": 0.6, "price": 346.1,
               "at": "2026-11-23T13:30:00Z", "stance": "mixed" } ],
  "score": { "closed": 12, "won": 7, "target": 5, "avgR": 0.4, "since": "2026-10-20",
             "bySetup": { "Pullback in an uptrend": { "closed": 8, "won": 5, "target": 4, "avgR": 0.6 } } },
  "problems": [ { "id": "2026-11-23:AAPL", "why": ["The stop is 4 under the top of the buy zone, nearer than one usual daily move (8.11). An ordinary day would hit it: 335 or lower gives it room."] } ] }
```

One row for every well-formed call in the Scout's files of the last 90 days, worked out
from the daily candles since the call's `day` (`engine/lib/calls.mjs`). A call is followed
from the first session that opens after the file's `at`: the call's own day when `at` is
before 9:30 in New York, the next trading day when it is later, because that day's candle
already holds moves made before the call. A file with no `at`, or one that is not a time
on the file's own day in New York, is followed from its own day. On the day of the entry
a high over the target does not count when the price opened above the zone (it came before
the entry), and a stop is filled at the stop. A call that reaches neither is closed on its
thirtieth trading day, the day of the entry being the first.

- `state`: `waiting`, `in-zone`, `open`, `target`, `stopped`, `timed-out` or `expired`.
  `playbooks/how-it-works.md` says what each means and how it is decided.
- `entry` is where the price came into the buy zone, `enteredOn` and `closedOn` are New York
  dates. They are null until they apply.
- `r` is the result in units of the risk taken (entry to stop is 1). Null before an entry.
- `score` counts finished calls only (`target`, `stopped`, `timed-out`): how many, how many
  finished above zero (`won`), how many reached their target, the average `r`, and the day
  of the oldest one. `bySetup` is the same count for each `setup` name the Scout wrote. A
  setup with nothing finished yet is there too, with `closed: 0` and `avgR: null`.
- `setup`: the name the Scout gave the call, or null.
- `at`: the `at` of the Scout's file, or null when the file gave none the engine can use.
- `stance`: the engine's `regime.stance` when it first followed the call as written at
  `at`. It is kept from then on, so a market that turns later does not rewrite the verdict
  on a call already made. Null for a call first seen on a later day than its own.
- `problems`: the well-formed calls that break a hard rule of the method, each with the
  reasons as plain sentences. Such a call is still followed and scored. The rules: the stop
  is nearer than one usual daily move to the top of the zone, the zone is wider than one
  usual daily move, the pay from the top of the zone is under 2 to 1, the stop is more than
  8% under the zone, an earnings report trades within five trading days of the call's day
  (`reports.json`), the setup is not one of the five names, an earlier call on the same
  stock was still open, the file names a kinder stance than the engine counted, or the
  setup's `verdict` in `setups.json` is `fails`. That verdict is the setup's under the
  harsher of two stances (`with-you`, then `mixed`, then `against-you`): the one the
  Scout's file names in `market.stance` and the row's `stance`. It is the setup's overall
  verdict when that one is `unproven` or neither stance is known. Its sentence
  carries the numbers: "The record says no. "A leader holding up in a weak market"
  finished 32 times in a market that was against you and averaged -0.14 of the risk taken,
  under the 0.06 of a call made for no reason on any day (setups.json)." The usual daily
  move is the one of the last full day when the file was written, the day the candidates
  were built on: the call's own day when `at` is 16:00 in New York or later, the day
  before it otherwise. So a call copied from a candidate is measured as the candidate
  was. A file with no usable `at` is measured by both days, and one of these rules counts
  only when both break it. The first two rules allow a tenth of slack, because the usual daily move drifts
  from day to day. `node app/engine/check-calls.mjs` prints the same verdicts for one
  day, and adds what only the day's candidates can decide.

## ../opportunities/YYYY-MM-DD.json

Written by the Stock Scout, one file for each day it ran, named for the date in New York.
`playbooks/how-it-works.md` holds the shape and its rules. A file whose name starts with
`EXAMPLE-` ships with the cabinet: the page shows it, labelled, until a real one exists, and
the engine never scores it.

A well-formed call, for the engine and for the page alike: `sym` is 1 to 15 letters,
digits, dots, hyphens, `^` or `=`; `buy` is exactly two numbers above zero, the lower
first; `stop` is a number above zero and under `buy[0]`; `target` is a number above
`buy[1]`. A number is a JSON number: `"332"` in quotes is text and fails the rule. Of two
items with the same symbol in one file, the first counts. Any other item is ignored by the
engine and by the page.

## data/movers.json

```json
{ "at": "2026-11-23T14:14:00Z",
  "gainers": [ { "sym": "GAP", "name": "Gap, Inc. (The)", "price": 20.94, "change": 11.4, "volume": 31000000, "avgVolume": 9000000, "facts": { "trend": "up", "rsi": 61.2 } } ],
  "losers": [], "active": [] }
```

Twelve rows at most in each list. Up to 16 of the gainers and busiest stocks priced at 5
dollars or more carry `facts`, the same object a quote in `market.json` has, and have a
candle file. Fetched on a full refresh and when older than six hours.

## Where the numbers come from

`engine/lib/sources.mjs` holds the order. "No licence" means a public endpoint that needs no
key and whose owner has not published terms that allow this use: it works, it can change or
stop without notice, and it is for one person's own use. All of those answer only while
`UNLICENSED_FALLBACK` in `sources.mjs` is true. `data/status.json` lists what failed on the
last run in `errors`. Its `sources` holds, for each source, what it did the last time it
was asked: `true` when it answered, `false` when it failed (one failure in a run outweighs
its answers in that run). A source that was not asked on the last run keeps its older
value, so `sources` covers more than the last run.

| Data | Source | Key | Licence |
|---|---|---|---|
| Stock and fund prices, today's candles, charts | Yahoo Finance, then Nasdaq (daily candles only) | None | No licence for this use |
| The fear gauge (`^VIX`) | Yahoo Finance | None | No licence for this use |
| Gainers, losers, most traded | Yahoo Finance | None | No licence for this use |
| Short interest | FINRA, then Nasdaq when FINRA has no report | None | Clean for personal use: FINRA's terms allow it and ask that FINRA is named as the source. Nasdaq: no licence for this use |
| Earnings calendar | Nasdaq | None | No licence for this use |
| Economic calendar | Forex Factory's weekly file | None | No licence for this use |
| Headlines | Yahoo Finance's RSS feed | None | No licence for this use: a feed made for feed readers, with no terms to rely on |
