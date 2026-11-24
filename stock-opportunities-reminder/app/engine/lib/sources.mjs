// Where the numbers come from, and in what order each source is asked.
// app/DATA.md has the table a person reads; this file is the same thing in code.
// None of these can place an order: the engine only reads.

import { get, eachLimited } from "./net.mjs";
import * as yahoo from "./yahoo.mjs";
import { DAY_MS } from "./indicators.mjs";

/**
 * The unofficial sources: public endpoints with no key and no licence for this use. Every
 * one of them is wrapped in `unlicensed` below and answers only while this is true.
 * Set to false, only FINRA's short interest is left: every price, chart, calendar
 * and headline goes, so it is a switch to pull when a licensed source has replaced them.
 */
const UNLICENSED_FALLBACK = true;
const unlicensed = (fn) => (...args) => (UNLICENSED_FALLBACK ? fn(...args) : Promise.reject(new Error("This source is switched off")));

const isCrypto = (sym) => /-USD[TC]?$/i.test(sym);
/** Trades around the clock or nearly: crypto, currencies, futures. */
export const alwaysOpen = (sym) => isCrypto(sym) || /=X$|=F$/i.test(sym);
/**
 * A symbol as the sources write it, in upper case, or null for anything else. The one rule
 * for what is a symbol: the server's requests and the Scout's files both pass through it.
 */
export const cleanSym = (s) => (typeof s === "string" && /^[A-Z0-9.^=-]{1,15}$/i.test(s) ? s.toUpperCase() : null);
/** Written like a US stock or fund: what Nasdaq and FINRA cover. */
export const isUsStock = (sym) => /^[A-Z.]{1,6}$/.test(sym);

const yahooToday = unlicensed(yahoo.today);
const yahooChart = unlicensed(yahoo.chart);
const yahooMovers = unlicensed(yahoo.movers);
export const news = unlicensed(yahoo.news);

/** For a source that sends candles and nothing else: the newest candle stands in for the quote. */
function fromCandles(sym, candles, about) {
  if (!candles.length) throw new Error("No history for this symbol");
  const last = candles[candles.length - 1], prev = candles[candles.length - 2];
  return { meta: { sym, name: sym, currency: "USD", price: last.c, prev: prev ? prev.c : null, at: last.t, regular: null, ...about }, candles };
}

/** Coinbase, for crypto when Yahoo will not answer. It sends the newest first, 300 daily candles at most. */
const coinbaseCandles = unlicensed(async (sym) => {
  const rows = await get(`https://api.exchange.coinbase.com/products/${encodeURIComponent(sym.toUpperCase())}/candles?granularity=86400`);
  const candles = rows.map((r) => ({ t: r[0], l: r[1], h: r[2], o: r[3], c: r[4], v: r[5] })).reverse();
  return fromCandles(sym, candles, { kind: "CRYPTOCURRENCY", exchange: "Coinbase", zone: "UTC" });
});

/** A date as YYYY-MM-DD, in UTC. */
export const isoDay = (d) => d.toISOString().slice(0, 10);
const plainNumber = (s) => parseFloat(String(s).replace(/[$,]/g, ""));

/** Nasdaq's own history, for US stocks and funds when Yahoo will not answer. */
const nasdaqDaily = unlicensed(async (sym) => {
  const to = new Date(), from = new Date(Date.now() - 730 * DAY_MS);
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

/** Daily candles for any symbol, from the first source that answers. `source` says which one did. */
export async function candles(sym) {
  try { return { ...(await yahooChart(sym)), source: "Yahoo Finance" }; }
  catch (first) {
    try {
      if (isCrypto(sym)) return { ...(await coinbaseCandles(sym)), source: "Coinbase" };
      if (isUsStock(sym)) return { ...(await nasdaqDaily(sym)), source: "Nasdaq" };
    } catch { /* report the first failure, it names the usual source */ }
    throw first;
  }
}

/** Today so far for every symbol in `syms`, as `{ meta, candles }` in the same order, null where the source did not answer. */
export const todayAll = (syms) => eachLimited(syms, 4, yahooToday);

/** The day's biggest gainers, losers and most traded US stocks. */
export const movers = yahooMovers;

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
 * source, which `source` carries to the Scout. Null when FINRA has no recent report.
 */
async function finraShort(sym) {
  const rows = await get("https://api.finra.org/data/group/otcMarket/name/consolidatedShortInterest", {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      limit: 10, compareFilters: [{ compareType: "EQUAL", fieldName: "symbolCode", fieldValue: sym }],
      dateRangeFilters: [{ fieldName: "settlementDate", startDate: isoDay(new Date(Date.now() - 60 * DAY_MS)), endDate: isoDay(new Date()) }],
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

/**
 * How much of a US stock is sold short. Published twice a month, so always a little old.
 * `asOf` is month/day/year. `note(source, answered)` hears of each source that was asked,
 * so a FINRA that is down is not hidden by Nasdaq answering in its place.
 */
export async function shortInterest(sym, note) {
  const heard = (source, asked) => asked.then((row) => { note(source, true); return row; }, (e) => { note(source, false); throw e; });
  const fromFinra = await heard("FINRA", finraShort(sym)).catch(() => null);
  return fromFinra || heard("Nasdaq", nasdaqShort(sym));
}
