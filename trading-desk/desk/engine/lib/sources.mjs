// Where the desk's numbers come from, and in what order each source is asked.
// desk/DATA.md has the table a person reads; this file is the same thing in code.
// None of these can place an order: the desk only reads.

import { get, eachLimited } from "./net.mjs";
import { alpacaKey } from "./keys.mjs";
import * as alpaca from "./alpaca.mjs";
import * as yahoo from "./yahoo.mjs";

/**
 * The unofficial sources: public endpoints with no key and no licence for this use. Every
 * one of them is wrapped in `unlicensed` below and answers only while this is true.
 * Set to false, the desk keeps Alpaca (with the person's key) and FINRA, and loses:
 * - every price and chart for a person with no Alpaca key;
 * - with a key too: crypto, futures, currencies and indexes (the strip across the top),
 *   and any stock Alpaca does not answer for;
 * - symbol search, the earnings and economic calendars, and headlines;
 * - the movers lists for a person with no Alpaca key.
 */
const UNLICENSED_FALLBACK = true;
const unlicensed = (fn) => (...args) => (UNLICENSED_FALLBACK ? fn(...args) : Promise.reject(new Error("This source is switched off")));

const isCrypto = (sym) => /-USD[TC]?$/i.test(sym);
/** Trades around the clock or nearly: crypto, currencies, futures. */
export const alwaysOpen = (sym) => isCrypto(sym) || /=X$|=F$/i.test(sym);
/** Written like a US stock or fund: what Alpaca, Nasdaq and FINRA cover. */
export const isUsStock = (sym) => /^[A-Z.]{1,6}$/.test(sym);

// Each chart size: one candle's length, how far back, and how Yahoo and Alpaca name the two.
export const FRAMES = {
  "5m": { seconds: 300, range: "5d", interval: "5m", days: 7, alpaca: "5Min" },
  "15m": { seconds: 900, range: "1mo", interval: "15m", days: 31, alpaca: "15Min" },
  "1h": { seconds: 3600, range: "6mo", interval: "60m", days: 183, alpaca: "1Hour" },
  "1d": { seconds: 86400, range: "2y", interval: "1d", days: 730, alpaca: "1Day" },
  "1w": { seconds: 604800, range: "10y", interval: "1wk", days: 3650, alpaca: "1Week" },
};

const yahooToday = unlicensed(yahoo.today);
const yahooChart = unlicensed(yahoo.chart);
const yahooMovers = unlicensed(yahoo.movers);
export const search = unlicensed(yahoo.search);
export const news = unlicensed(yahoo.news);

/** For a source that sends candles and nothing else: the newest candle stands in for the quote. */
function fromCandles(sym, candles, about) {
  if (!candles.length) throw new Error("No history for this symbol");
  const last = candles[candles.length - 1], prev = candles[candles.length - 2];
  return { meta: { sym, name: sym, currency: "USD", price: last.c, prev: prev ? prev.c : null, at: last.t, regular: null, ...about }, candles };
}

/** Coinbase, for crypto when Yahoo will not answer. Newest first, 300 candles at most. */
const coinbaseCandles = unlicensed(async (sym, frame) => {
  if (frame === "1w") throw new Error("No weekly candles from this source");
  const rows = await get(`https://api.exchange.coinbase.com/products/${encodeURIComponent(sym.toUpperCase())}/candles?granularity=${FRAMES[frame].seconds}`);
  const candles = rows.map((r) => ({ t: r[0], l: r[1], h: r[2], o: r[3], c: r[4], v: r[5] })).reverse();
  return fromCandles(sym, candles, { kind: "CRYPTOCURRENCY", exchange: "Coinbase", zone: "UTC" });
});

const isoDay = (d) => d.toISOString().slice(0, 10);
const plainNumber = (s) => parseFloat(String(s).replace(/[$,]/g, ""));

/** Nasdaq's own history, for US stocks and funds when Yahoo will not answer. Daily only. */
const nasdaqDaily = unlicensed(async (sym) => {
  const to = new Date(), from = new Date(Date.now() - 730 * 86400000);
  for (const kind of ["stocks", "etf"]) {
    const j = await get(`https://api.nasdaq.com/api/quote/${encodeURIComponent(sym)}/historical?assetclass=${kind}&fromdate=${isoDay(from)}&todate=${isoDay(to)}&limit=9999`);
    const rows = j && j.data && j.data.tradesTable && j.data.tradesTable.rows;
    if (!rows || !rows.length) continue;
    const candles = rows.map((r) => {
      const [m, d, y] = r.date.split("/");
      return { t: Date.UTC(+y, +m - 1, +d, 14, 30) / 1000, o: plainNumber(r.open), h: plainNumber(r.high), l: plainNumber(r.low), c: plainNumber(r.close), v: plainNumber(r.volume) || 0 };
    }).filter((c) => isFinite(c.c)).reverse();
    return fromCandles(sym, candles, { kind: kind === "etf" ? "ETF" : "EQUITY", exchange: "Nasdaq", zone: "America/New_York" });
  }
  throw new Error("No history for this symbol");
});

/**
 * Candles for any symbol, from the first source that answers. `source` says which one did.
 * A US stock goes to Alpaca first when the person has a key; everything else, and everyone
 * else, starts at Yahoo.
 */
export async function candles(sym, frame = "1d", opts) {
  const f = FRAMES[frame];
  const key = isUsStock(sym) && (await alpacaKey());
  if (key) {
    try { return { ...fromCandles(sym, await alpaca.chart(key, sym, f, opts), { kind: "EQUITY", exchange: "", zone: "America/New_York" }), source: "Alpaca" }; }
    catch { /* Alpaca did not answer or does not know the symbol: the keyless sources below still may */ }
  }
  try { return { ...(await yahooChart(sym, f, opts)), source: "Yahoo Finance" }; }
  catch (first) {
    try {
      if (isCrypto(sym)) return { ...(await coinbaseCandles(sym, frame)), source: "Coinbase" };
      if (frame === "1d" && isUsStock(sym)) return { ...(await nasdaqDaily(sym)), source: "Nasdaq" };
    } catch { /* report the first failure, it names the usual source */ }
    throw first;
  }
}

/**
 * Today so far for every symbol in `syms`, as `{ meta, candles, source }` in the same order,
 * null where nobody answered. With a key, Alpaca answers all the stocks in a handful of
 * requests; the rest go to Yahoo one at a time. `alpacaFailed` is called when the person
 * has a key and Alpaca did not answer with it.
 */
export async function todayAll(syms, alpacaFailed) {
  const key = await alpacaKey();
  const stocks = key ? syms.filter(isUsStock) : [];
  const fromAlpaca = stocks.length ? await alpaca.today(key, stocks, FRAMES["5m"]).catch(() => { alpacaFailed(); return {}; }) : {};
  return eachLimited(syms, 4, async (s) => (fromAlpaca[s] ? { ...fromAlpaca[s], source: "Alpaca" } : { ...(await yahooToday(s)), source: "Yahoo Finance" }));
}

/** The day's biggest gainers, losers and most traded US stocks, and the `source` that listed them. */
export async function movers() {
  const key = await alpacaKey();
  if (key) {
    try {
      const m = await alpaca.movers(key);
      if (m.gainers.length || m.active.length) return { ...m, source: "Alpaca" };
    } catch { /* Yahoo's lists below need no key */ }
  }
  return { ...(await yahooMovers()), source: "Yahoo Finance" };
}

/** Who reports earnings on one day, biggest companies first. */
export const earningsOn = unlicensed(async (date) => {
  const j = await get(`https://api.nasdaq.com/api/calendar/earnings?date=${isoDay(date)}`);
  const rows = (j && j.data && j.data.rows) || [];
  return rows.map((r) => ({
    sym: r.symbol, name: r.name, date: isoDay(date),
    when: r.time === "time-pre-market" ? "before the open" : r.time === "time-after-hours" ? "after the close" : "",
    cap: plainNumber(r.marketCap || "") || 0,
    estimate: r.epsForecast || "", lastYear: r.lastYearEPS || "",
  })).sort((a, b) => b.cap - a.cap);
});

/** This week's scheduled economic news, with how much it usually moves markets. */
export const economicWeek = unlicensed(async () => {
  const rows = await get("https://nfs.faireconomy.media/ff_calendar_thisweek.json");
  return rows.map((r) => ({ title: r.title, country: r.country, at: r.date, impact: r.impact, forecast: r.forecast || "", previous: r.previous || "" }));
});

/**
 * FINRA's short-interest reports: the regulator every broker reports to, so the numbers
 * Nasdaq shows are these. Its terms allow personal use and ask that FINRA is named as the
 * source, which `source` carries to the page. Null when FINRA has no recent report.
 */
async function finraShort(sym) {
  const rows = await get("https://api.finra.org/data/group/otcMarket/name/consolidatedShortInterest", {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      limit: 10, compareFilters: [{ compareType: "EQUAL", fieldName: "symbolCode", fieldValue: sym }],
      dateRangeFilters: [{ fieldName: "settlementDate", startDate: isoDay(new Date(Date.now() - 60 * 86400000)), endDate: isoDay(new Date()) }],
    }),
  });
  const row = rows.sort((a, b) => (a.settlementDate < b.settlementDate ? 1 : -1))[0];
  if (!row) return null;
  const [y, m, d] = row.settlementDate.split("-");
  return { asOf: `${m}/${d}/${y}`, shares: row.currentShortPositionQuantity, avgVolume: row.averageDailyVolumeQuantity, daysToCover: row.daysToCoverQuantity, source: "FINRA" };
}

const nasdaqShort = unlicensed(async (sym) => {
  const j = await get(`https://api.nasdaq.com/api/quote/${encodeURIComponent(sym)}/short-interest?assetClass=stocks`);
  const row = j && j.data && j.data.shortInterestTable && j.data.shortInterestTable.rows && j.data.shortInterestTable.rows[0];
  return row ? { asOf: row.settlementDate, shares: plainNumber(row.interest), avgVolume: plainNumber(row.avgDailyShareVolume), daysToCover: plainNumber(row.daysToCover), source: "Nasdaq" } : null;
});

/** How much of a US stock is sold short. Published twice a month, so always a little old. `asOf` is month/day/year. */
export async function shortInterest(sym) {
  const fromFinra = await finraShort(sym).catch(() => null);
  return fromFinra || nasdaqShort(sym);
}
