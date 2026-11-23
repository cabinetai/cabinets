# The desk's files

What `desk/engine/refresh.mjs` writes into `desk/data/`, and what the page keeps in its
store. Times are ISO strings in UTC unless a field says otherwise. Symbols are written the
way Yahoo Finance writes them: `NVDA`, `BTC-USD`, `ES=F`, `EURUSD=X`, `^VIX`.

| File | Written by | What |
|---|---|---|
| `data/market.json` | refresh | The newest price and facts for every symbol |
| `data/candles/<SYMBOL>.1d.json` | refresh | Two years of daily candles. In the file name, any character other than a letter, digit, dot or hyphen becomes `_` (`^VIX` is `_VIX`, `ES=F` is `ES_F`) |
| `data/signals.json` | refresh | What the rules found, newest first, three weeks |
| `data/calendar.json` | refresh | Earnings and US economic news |
| `data/movers.json` | refresh | Gainers, losers and the busiest US stocks, and the `source` that listed them |
| `data/news.json` | refresh | Headlines by symbol. Each has `title`, `link`, `at` and `site`, the host the link leads to |
| `data/short.json` | refresh | Short interest by symbol, each with the `source` that reported it |
| `data/record.json` | refresh | Each alert rule's record on the list, over the saved daily candles |
| `data/status.json` | refresh | The last run: when, how long, what failed |
| `data/state.json` | refresh | The engine's own memory (last seen prices, for crossing a line). Not for the page |
| `data/scout.json` | The Chart Scout | Notes on flagged charts |
| `.data/shared.json` | The page, through Cabinet's app store | Everything the person enters |

## data/market.json

The values below show the shape. They are not today's prices.

```json
{
  "schema": "desk/market@1",
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
- With the person's Alpaca key, a stock's `name` is its symbol, `kind` is `EQUITY` for funds
  too and `exchange` is empty: Alpaca's price routes send none of the three.

## data/candles/<SYMBOL>.1d.json

```json
{ "sym": "NVDA", "frame": "1d", "at": "2026-11-19T13:31:50Z", "source": "Yahoo Finance", "name": "NVIDIA Corporation",
  "c": [[1795098600, 152.1, 159.7, 150.4, 150.96, 312000000]] }
```

Each row is `[time in seconds, open, high, low, close, volume]`, oldest first. During the
session the last row is today so far. `source` is `Alpaca`, `Yahoo Finance`, `Coinbase` or
`Nasdaq`. From Alpaca on its free plan the last row is 15 minutes behind.

## data/signals.json

```json
{ "schema": "desk/signals@1", "at": "2026-11-19T13:31:53Z",
  "items": [ { "id": "TSLA:bullFlag:2026-11-19", "sym": "TSLA", "name": "Tesla", "kind": "chart", "rule": "bullFlag", "side": "long",
               "text": "Ran up 17.7% and has rested for 3 days on lighter volume. A close above 404.4 is the trigger.",
               "level": 404.4, "price": 383.72, "day": "2026-11-19", "at": "2026-11-19T13:31:53Z" } ] }
```

- `day` is the New York date of the candle the signal was read from. Before the open that
  is yesterday.
- `kind`: `chart` (a rule fired), `level` (the price crossed a line the person drew), `plan`
  (it reached a plan's entry), `trade` (it touched the stop or target of an open trade),
  `earnings` (a report is due within a week).
- `rule`: a rule id from `engine/lib/signals.mjs`, or `level`, `entry`, `stop`, `target`,
  `earnings`.
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

Every day in the saved daily candles of the list when a rule would have fired, judged with the
person's own rule settings, whether or not the rule is switched on. Rebuilt when a setting or
the list changes, and at least every 12 hours. Intraday rules (`openingRange`, `vwap`) have no
record: their past needs 5-minute candles the desk does not keep.

```json
{
  "schema": "desk/record@1", "at": "2026-11-22T15:30:00Z", "key": "...",
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

## data/scout.json

```json
{ "at": "2026-11-19T13:40:00Z", "notes": [ { "id": "TSLA:bullFlag:2026-11-19", "sym": "TSLA", "day": "2026-11-19", "note": "..." } ] }
```

The page shows a note under the signal with the same `id`.

## account/ (outside this folder, at the cabinet's root)

Written by the assistants from Robinhood's tools when the person has connected Robinhood.
The page reads them and never writes them. `playbooks/robinhood.md` has the rules. Each
file is replaced whole on every run. A file named `EXAMPLE-...` is example data the page
shows, marked Example, until the real file exists.

### account/robinhood.json

```json
{ "schema": "desk/account@1", "broker": "Robinhood", "at": "2026-11-20T22:30:00Z",
  "value": 47954.54, "cash": 3180.42, "buyingPower": 3180.42,
  "dayChange": -3904.88, "dayChangePct": -7.53,
  "accounts": [ { "name": "Individual", "agentic": false, "value": 45954.54, "buyingPower": 1180.42 } ],
  "positions": [ { "sym": "AAPL", "name": "Apple Inc.", "kind": "stock", "qty": 25, "cost": 268.4,
                   "price": 342.56, "value": 8564, "pnl": 1854, "pnlPct": 27.63, "dayPct": -1.9, "account": "Individual" } ],
  "orders": [ { "sym": "AMD", "side": "sell", "type": "limit", "qty": 18, "price": 495, "placedAt": "2026-11-03T15:02:00Z", "account": "Individual" } ],
  "problems": [] }
```

- `value` is everything: positions and cash, all accounts. `cost` is the average cost of
  one unit. `pnl` is `(price - cost) * qty`, in money, before fees.
- `kind`: `stock` (shares and funds), `option` or `crypto`. An option's `sym` is the
  contract as Robinhood writes it, and its `qty` counts contracts.
- `accounts[].agentic` is true for the one account an assistant may trade in.
- `orders` are open orders only. `stop` is there for a stop order.
- `problems`: one plain line for each thing a tool did not answer.
- The engine reads `positions` and fetches a chart for every stock in it.

### account/attention.json

```json
{ "schema": "desk/attention@1", "at": "2026-11-21T13:45:00Z",
  "items": [ { "sym": "DELL", "kind": "earnings", "text": "Reports earnings on Tuesday, November 24, after the close. You hold 20 shares." } ],
  "problems": [] }
```

`kind` is one of `earnings`, `news`, `rating`, `move`, `size`, `no-stop`, `order`. At most
eight items, the most pressing first. `text` is one sentence with its number.

### account/scan.json

```json
{ "schema": "desk/scan@1", "at": "2026-11-21T13:40:00Z",
  "scans": [ { "name": "Up on unusual volume", "count": 14 } ],
  "finds": [ { "sym": "GAP", "name": "Gap, Inc.", "price": 20.94, "change": 11.44, "scan": "Up on unusual volume", "why": "Up 11.4% on 3.8 times its usual volume." } ],
  "problems": [] }
```

`scans` lists what was run and how many stocks each returned. `finds` holds at most six,
none of them on the person's list. `change` is the day's move in percent.

### account/alerts.json

```json
{ "schema": "desk/alerts@1", "at": "2026-11-21T14:00:00Z",
  "alerts": [ { "id": "<Robinhood's alert id>", "sym": "NVDA", "price": 148.9, "dir": "below", "for": "stop", "trade": "2026-11-18-nvda-1" } ] }
```

Only the alerts this desk made. `dir` is `above` or `below`. `for` is `stop`, `target`,
`entry` or `line`. `trade` is the trade's id, left out for a drawn line.

### account/YYYY-MM-money.md

The month in money, one page. The page shows the newest one on the Review screen.

## .data/shared.json

Kept by Cabinet. The page writes it and the engine and the assistants read it.

| Key | Value |
|---|---|
| `profile` | `{ style, account, riskPct, dayLossR, currency }` |
| `watch` | `[{ sym, name }]`, in the person's order |
| `rules` | `{ "<rule id>": { on, ...numbers } }`: only what differs from the shipped rules |
| `lv:<SYMBOL>` | `[{ p, note }]`: the lines drawn on that chart |
| `t:<id>` | One plan or trade. `playbooks/how-the-desk-works.md` has the shape |
| `noExamples` | `true` once the example trades are dismissed |

The person's own `mine` store also keeps `rhHide`: `true` once they close the Connect Robinhood box.

## Where the numbers come from

`engine/lib/sources.mjs` holds the order. "No licence" means a public endpoint that needs no
key and whose owner has not published terms that allow this use: it works, it can change or
stop without notice, and it is for one person's own use. All of those answer only while
`UNLICENSED_FALLBACK` in `sources.mjs` is true. `data/status.json` says which sources
answered on the last run and what failed.

| Data | Source now | Key | Licence |
|---|---|---|---|
| US stock and fund prices, today's candles, charts | Alpaca, when the person has pasted a key | The person's free Alpaca key | Needs the person's free key |
| The same, with no key or when Alpaca does not answer | Yahoo Finance, then Nasdaq (daily candles only) | None | No licence for this use |
| Crypto prices and charts | Yahoo Finance, then Coinbase | None | No licence for this use |
| Futures, currencies and indexes (the strip across the top) | Yahoo Finance | None | No licence for this use |
| Gainers, losers, most traded | Alpaca, when the person has pasted a key | The person's free Alpaca key | Needs the person's free key |
| The same, with no key | Yahoo Finance | None | No licence for this use |
| Short interest | FINRA, then Nasdaq when FINRA has no report | None | Clean for personal use: FINRA's terms allow it and ask that FINRA is named as the source. Nasdaq: no licence for this use |
| Symbol search | Yahoo Finance | None | No licence for this use |
| Earnings calendar | Nasdaq | None | No licence for this use |
| Economic calendar | Forex Factory's weekly file | None | No licence for this use |
| Headlines | Yahoo Finance's RSS feed | None | No licence for this use: a feed made for feed readers, with no terms the desk could rely on |

### The Alpaca key

The person makes a free account at alpaca.markets and pastes a key ID and a secret key into
the page, which sends them to the engine (`POST /keys`). The engine tests the key with one
read and keeps it in `keys.json` in the app's private folder (`CABINET_APP_PRIVATE_DIR`),
outside the cabinet's content and readable by the daemon's user only. It is never written
under `desk/`, never logged and never sent back to the page. Run by hand, the engine reads
`ALPACA_KEY_ID` and `ALPACA_SECRET_KEY` from the environment instead.

What Alpaca's free plan gives, and how the desk uses it:

- Candles are the whole market's (`sip`), because the alert rules compare volume. The free
  plan serves those once they are 15 minutes old, so a daily candle is up to 15 minutes behind.
- The price, and the last 15 minutes of an intraday chart, are live from one exchange
  (`iex`, about 2.5% of all trading). Those last few candles show that exchange's volume only.
- Candles are split-adjusted.
- The movers lists keep stocks at 5 dollars and 500,000 shares or more, and show the symbol
  where Yahoo showed the company's name.

The engine's routes, each under `/api/app-server/run/<app path>/~`:

| Route | Answer |
|---|---|
| `GET /keys` | `{ "ok": true, "alpaca": true }`: whether a key is kept. Never the key |
| `POST /keys` with `{ "alpaca": { "id": "...", "secret": "..." } }` | The same answer once Alpaca accepted the key, or 400 with `{ "error": "..." }` in plain words |
| `POST /keys` with `{ "alpaca": null }` | Removes the key |
| `GET /candles?sym=&frame=` | Candles for any symbol. `frame` is `5m`, `15m`, `1h`, `1d` or `1w` |
| `GET /search?q=` | Symbols by name |
| `GET /refresh` (`?full=1` for everything) | Runs the refresh now and answers its status |
