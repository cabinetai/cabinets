# Third-party data in the app

`app/DATA.md` lists every source and its licence. The page shows prices and daily candles
only. Two other sources are saved for the Stock Scout to read, and are not shown on the page:

- **Short interest** is from FINRA, which owns it. FINRA's terms for its equity data
  (https://developer.finra.org/specific-terms-equity-data) allow personal, non-commercial use
  and ask that FINRA is clearly named as the owner and source. When the Scout quotes a
  short-interest number it names FINRA as the source.
- **Headlines** are from Yahoo Finance's RSS feed. Each saved headline keeps the link to its
  article and the site that published it.
