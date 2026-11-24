// Yahoo Finance's unofficial endpoints. They cover stocks, funds, crypto, futures,
// currencies and indexes under one symbol form, need no key, and carry no licence for
// this use: lib/sources.mjs decides when they are asked.

import { get, eachLimited } from "./net.mjs";

function fromYahoo(json) {
  const r = json && json.chart && json.chart.result && json.chart.result[0];
  if (!r || !r.meta) throw new Error("No such symbol");
  const q = (r.indicators && r.indicators.quote && r.indicators.quote[0]) || {};
  const candles = [];
  (r.timestamp || []).forEach((t, i) => {
    const o = q.open && q.open[i], h = q.high && q.high[i], l = q.low && q.low[i], c = q.close && q.close[i];
    if (o == null || h == null || l == null || c == null) return;
    candles.push({ t, o, h, l, c, v: (q.volume && q.volume[i]) || 0 });
  });
  const m = r.meta, period = m.currentTradingPeriod || {};
  return {
    meta: {
      sym: m.symbol, name: m.longName || m.shortName || m.symbol, kind: m.instrumentType || "",
      currency: m.currency || "USD", exchange: m.fullExchangeName || m.exchangeName || "",
      price: m.regularMarketPrice, prev: m.chartPreviousClose ?? m.previousClose ?? null,
      at: m.regularMarketTime || null, zone: m.exchangeTimezoneName || "America/New_York",
      regular: period.regular ? [period.regular.start, period.regular.end] : null,
      dayHigh: m.regularMarketDayHigh ?? null, dayLow: m.regularMarketDayLow ?? null,
      volume: m.regularMarketVolume ?? null, high52: m.fiftyTwoWeekHigh ?? null, low52: m.fiftyTwoWeekLow ?? null,
    },
    candles,
  };
}

/** Today so far in 5-minute candles, with the hours before and after the session: one request per quote. */
export async function today(sym) {
  return fromYahoo(await get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1d&interval=5m&includePrePost=true`));
}

/** Two years of daily candles. */
export async function chart(sym) {
  return fromYahoo(await get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=2y&interval=1d&includePrePost=false&events=div%2Csplit`));
}

/** The day's biggest gainers, losers and most traded US stocks. */
export async function movers() {
  const one = async (id) => {
    const j = await get(`https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=${id}&count=12`);
    const rows = (j && j.finance && j.finance.result && j.finance.result[0] && j.finance.result[0].quotes) || [];
    return rows.slice(0, 12).map((x) => ({
      sym: x.symbol, name: x.shortName || x.longName || x.symbol, price: x.regularMarketPrice,
      change: x.regularMarketChangePercent, volume: x.regularMarketVolume, avgVolume: x.averageDailyVolume3Month || null,
    }));
  };
  const [gainers, losers, active] = await eachLimited(["day_gainers", "day_losers", "most_actives"], 1, one);
  return { gainers: gainers || [], losers: losers || [], active: active || [] };
}

const unescape = (s) => String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").trim();
/**
 * The newest headlines for one symbol, from Yahoo's RSS feed. The feed names no publisher
 * for an item, so `site` is the host the link leads to.
 */
export async function news(sym) {
  const xml = await get(`https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(sym)}&region=US&lang=en-US`, { as: "text" });
  const items = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const pick = (tag) => { const x = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(m[1]); return x ? unescape(x[1]) : ""; };
    const link = pick("link"), at = Date.parse(pick("pubDate"));
    if (!URL.canParse(link) || !/^https?:$/.test(new URL(link).protocol)) continue;
    items.push({ title: pick("title"), link, site: new URL(link).hostname.replace(/^www\./, ""), at: isFinite(at) ? new Date(at).toISOString() : null });
    if (items.length >= 8) break;
  }
  return items;
}
