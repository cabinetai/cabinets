# Third-party software in the app

`app/index.html` contains an unchanged copy of **TradingView Lightweight Charts™** 5.3.0
(the file `dist/lightweight-charts.standalone.production.js` of the npm package
`lightweight-charts`), which draws the charts.

- Copyright (c) 2026 TradingView, Inc. https://www.tradingview.com/
- Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0
- Source: https://github.com/tradingview/lightweight-charts

The library's own notice:

> TradingView Lightweight Charts™
> Copyright (с) 2025 TradingView, Inc. https://www.tradingview.com/

The page keeps the library's TradingView mark on the chart of the My stocks screen and links to
TradingView at the foot of each screen, as the library's licence notice asks.

# Third-party data in the app

`app/DATA.md` lists every source and its licence. These are the credits the page shows:

- **Short interest** is from FINRA, which owns it. FINRA's terms for its equity data
  (https://developer.finra.org/specific-terms-equity-data) allow personal, non-commercial use
  and ask that FINRA is clearly named as the owner and source. The page says
  "Short interest: FINRA" beside the numbers.
- **Headlines** are from Yahoo Finance's RSS feed. Each headline links to the article and
  shows the site that published it.
