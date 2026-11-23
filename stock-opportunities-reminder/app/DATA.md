# The app's files

What `app/engine/refresh.mjs` writes into `app/data/`, what the Stock Scout writes, and what
the page keeps in its store. Times are ISO strings in UTC unless a field says otherwise.
Symbols are written the way Yahoo Finance writes them: `NVDA`, `BTC-USD`, `ES=F`, `^VIX`.

| File | Written by | What |
|---|---|---|
| `data/market.json` | refresh | The newest price and facts for every symbol |
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
`/search?q=`, `/refresh` (add `full=1` for everything) and `/health`.

## data/market.json

The values below show the shape. They are not today's prices.

```json
{
  "schema": "reminder/market@1",
  "at": "2026-11-19T13:31:53Z",
  "session": "pre",
  "strip": ["ES=F", "NQ=F", "^VIX", "^TNX", "DX-Y.NYB", "GC=F", "CL=F", "BTC-USD"],
  "quotes": {
    "NVDA": {
      "name": "NVIDIA Corporation", "kind": "EQUITY", "currency": "USD", "exchange": "NasdaqGS",
      "price": 150.96, "prev": 155.45, "change": -2.89, "at": "2026-11-18T21:00:00Z",
      "dayHigh": 159.7, "dayLow": 150.4, "volume": 312000000,
      "ext": { "price": 152.99, "change": 1.34, "at": "2026-11-19T13:31:41Z" },
      "spark": [151.2, 151.4],
      "facts": { "close": 150.96, "ema20": 171.3, "sma50": 189.2, "sma200": 176.4, "rsi": 21.1, "atr": 9.8, "atrPercent": 6.5, "rvol": 1.4, "high52": 219.0, "low52": 101.2, "fromHigh": -31.1, "trend": "down" },
      "earnings": { "date": "2026-11-25", "when": "after the close" },
      "short": { "asOf": "10/30/2026", "shares": 279579505, "avgVolume": 99940095, "daysToCover": 2.8, "source": "FINRA" }
    }
  }
}
```

- `session`: the US stock session, `pre`, `open`, `after` or `closed`.
- `price`: the last price of the regular session. `change`: percent against `prev`.
- `ext`: a trade outside the regular session, and its percent change against `price`. Only
  present before the open and after the close.
- `spark`: up to 48 closes of the current session, oldest first, for the small line.
- `facts`: from the daily candles. `ema20`, `sma50`, `sma200` are the 20, 50 and 200-day
  averages. `atr` is the usual daily move in price. `rvol` is today's volume against the
  20-day average. `trend` is `up` (price above the 50-day, and that above the 200-day),
  `down` (the mirror) or `mixed`.
- `earnings` and `short` appear when known. `short.asOf` is month/day/year. `short.source` is
  `FINRA` or `Nasdaq`: FINRA's terms ask that it is named beside its numbers.

## data/candles/<SYMBOL>.1d.json

```json
{ "sym": "NVDA", "frame": "1d", "at": "2026-11-19T13:31:50Z", "source": "Yahoo Finance", "name": "NVIDIA Corporation",
  "c": [[1795098600, 152.1, 159.7, 150.4, 150.96, 312000000]] }
```

Each row is `[time in seconds, open, high, low, close, volume]`, oldest first. During the
session the last row is today so far. `source` is `Yahoo Finance`, `Coinbase` or `Nasdaq`.
There is one file for every listed symbol, every stock the Scout called, and the day's movers
that carry `facts`. A mover's file is removed once it leaves the lists.

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
  "calls": [ { "id": "2026-11-23:AAPL", "day": "2026-11-23", "sym": "AAPL", "state": "open",
               "entry": 341.2, "enteredOn": "2026-11-24", "closedOn": null, "r": 0.6, "price": 346.1 } ],
  "score": { "closed": 12, "won": 7, "target": 5, "avgR": 0.4, "since": "2026-10-20" } }
```

One row for every well-formed call in the Scout's files of the last 90 days, worked out
from the daily candles since the call's `day` (`engine/lib/calls.mjs`).

- `state`: `waiting`, `in-zone`, `open`, `target`, `stopped`, `timed-out` or `expired`.
  `playbooks/how-it-works.md` says what each means and how it is decided.
- `entry` is where the price came into the buy zone, `enteredOn` and `closedOn` are New York
  dates. They are null until they apply.
- `r` is the result in units of the risk taken (entry to stop is 1). Null before an entry.
- `score` counts finished calls only (`target`, `stopped`, `timed-out`): how many, how many
  finished above zero (`won`), how many reached their target, the average `r`, and the day
  of the oldest one.

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
