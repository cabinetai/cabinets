// Alpaca's market-data API (https://data.alpaca.markets): US stocks and funds, for a person
// who pasted their own free key. It cannot place an order from here: these are data routes.
//
// Which feed, on the free plan:
// - Candles come from `sip`, every US exchange together, because the alert rules compare
//   volume and one exchange is about 2.5% of it. The free plan serves `sip` only once it is
//   15 minutes old. No `end` is sent: Alpaca then ends at "now" for a paid plan and at 15
//   minutes ago for a free one, by its own clock.
// - The last 15 minutes of intraday candles, and the live price, come from `iex`, the one
//   exchange the free plan serves live. Those few candles carry that exchange's volume only,
//   and the candle the two feeds share keeps the whole market's volume.
// Candles are split-adjusted, as Yahoo's are.

import { get } from "./net.mjs";

const DAY = 86400, OPEN = 9.5 * 3600, CLOSE = 16 * 3600;
const call = (key, path, params) => get(`https://data.alpaca.markets${path}?${new URLSearchParams(params)}`, { headers: { "APCA-API-KEY-ID": key.id, "APCA-API-SECRET-KEY": key.secret } });

const nyClock = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
/** Seconds into the New York day at `t`, the start of a candle (so a whole minute). */
function nySeconds(t) {
  const [h, m] = nyClock.format(new Date(t * 1000)).split(":");
  return h * 3600 + m * 60;
}

/** Candles for many symbols in one request per 10,000 candles, oldest first, by symbol. Times are in seconds. */
async function bars(key, syms, timeframe, start, feed = "sip") {
  const out = Object.fromEntries(syms.map((s) => [s, []]));
  let page = null;
  do {
    const j = await call(key, "/v2/stocks/bars", { symbols: syms.join(","), timeframe, start: new Date(start * 1000).toISOString(), feed, adjustment: "split", limit: 10000, ...(page && { page_token: page }) });
    for (const [s, rows] of Object.entries(j.bars || {})) if (out[s]) out[s].push(...rows.map((b) => ({ t: Date.parse(b.t) / 1000, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v })));
    page = j.next_page_token;
  } while (page);
  return out;
}

/** Intraday candles: the whole market's, then the live exchange's for the minutes the whole market's stop short. */
async function intraday(key, syms, f, start, now) {
  const out = await bars(key, syms, f.alpaca, start);
  // A plan with live whole-market data already holds these candles, and nothing is added.
  // When this second request fails the chart is still right, only 15 minutes behind.
  // From the start of the candle that holds "20 minutes ago", so an hour's candle is asked for whole.
  const live = await bars(key, syms, f.alpaca, Math.floor((now - 20 * 60) / f.seconds) * f.seconds, "iex").catch(() => ({}));
  for (const s of syms) {
    for (const c of live[s] || []) {
      const last = out[s].at(-1);
      // The candle both feeds hold: the live exchange brings it up to now.
      if (last && c.t === last.t) Object.assign(last, { h: Math.max(last.h, c.h), l: Math.min(last.l, c.l), c: c.c });
      else if (!last || c.t > last.t) out[s].push(c);
    }
  }
  return out;
}

/** Candles for one symbol at one chart size, `f` being its entry in FRAMES. Empty when Alpaca has none. */
export async function chart(key, sym, f, { prePost = false } = {}, now = Date.now() / 1000) {
  const start = now - f.days * DAY;
  // Alpaca stamps a day at New York midnight. The desk stamps it at the open, as Yahoo does.
  if (f.seconds >= DAY) return (await bars(key, [sym], f.alpaca, start))[sym].map((c) => ({ ...c, t: c.t + OPEN }));
  const list = (await intraday(key, [sym], f, start, now))[sym];
  // Alpaca always sends the hours before and after the session: keep the candles that touch it.
  return prePost ? list : list.filter((c) => { const s = nySeconds(c.t); return s + f.seconds > OPEN && s < CLOSE; });
}

/**
 * Today so far for many symbols at once, in the shape one Yahoo quote request gives:
 * `{ SYM: { meta, candles } }`, 5-minute candles with the hours around the session. On a day
 * with no trading it is the last day that had some. A symbol Alpaca does not know is left out.
 * `f` is the 5-minute entry of FRAMES.
 */
export async function today(key, syms, f, now = Date.now() / 1000) {
  const [snaps, daily] = await Promise.all([
    call(key, "/v2/stocks/snapshots", { symbols: syms.join(",") }),
    bars(key, syms, "1Day", now - 10 * DAY),
  ]);
  const newestDay = Math.max(0, ...syms.map((s) => (daily[s].at(-1) || { t: 0 }).t));
  if (!newestDay) return {};
  // From 4 in the morning of the last day with a daily candle: before today's first one exists, that is yesterday.
  const five = await intraday(key, syms, f, newestDay + 4 * 3600, now);
  const out = {};
  for (const s of syms) {
    const newest = five[s].at(-1);
    if (!newest) continue;
    const midnight = newest.t - nySeconds(newest.t), regular = [midnight + OPEN, midnight + CLOSE];
    const before = daily[s].filter((d) => d.t < midnight), todayBar = daily[s].find((d) => d.t >= midnight);
    const trade = snaps[s] && snaps[s].latestTrade, tradeAt = trade ? Date.parse(trade.t) / 1000 : 0;
    // The newest price is the newer of the last trade and the newest candle: on the free plan
    // the trade comes from one exchange, and a quiet stock can go an hour without one there.
    const last = tradeAt > newest.t ? { p: trade.p, t: tradeAt } : { p: newest.c, t: newest.t };
    // It is the price only while the session runs. Outside it the price is the session's
    // close, and the newest candle shows what traded before or after.
    const live = last.t >= regular[0] && now < regular[1];
    const [dayBar, prevBar] = todayBar || live ? [todayBar, before.at(-1)] : [before.at(-1), before.at(-2)];
    if (!live && !dayBar) continue;
    out[s] = {
      meta: {
        sym: s, name: s, kind: "EQUITY", currency: "USD", exchange: "", zone: "America/New_York", regular,
        price: live ? last.p : dayBar.c, prev: prevBar ? prevBar.c : null,
        at: live ? Math.floor(last.t) : Math.min(Math.floor(now), dayBar.t + CLOSE),
        dayHigh: dayBar ? dayBar.h : null, dayLow: dayBar ? dayBar.l : null, volume: dayBar ? dayBar.v : null,
      },
      candles: five[s].filter((c) => c.t >= midnight),
    };
  }
  return out;
}

/**
 * The day's biggest gainers, losers and most traded US stocks. Alpaca ranks every listed
 * symbol, warrants and penny stocks too, and sends a symbol and little else, so each row is
 * filled from its daily candles and kept only at 5 dollars and 500,000 shares or more.
 */
export async function movers(key, now = Date.now() / 1000) {
  const [m, a] = await Promise.all([
    call(key, "/v1beta1/screener/stocks/movers", { top: 50 }),
    call(key, "/v1beta1/screener/stocks/most-actives", { by: "volume", top: 50 }),
  ]);
  const lists = { gainers: m.gainers || [], losers: m.losers || [], active: a.most_actives || [] };
  const syms = [...new Set(Object.values(lists).flat().map((x) => x.symbol))];
  const daily = syms.length ? await bars(key, syms, "1Day", now - 35 * DAY) : {};
  const row = (x) => {
    const days = daily[x.symbol] || [], d = days.at(-1), p = days.at(-2);
    if (!d || !p) return null;
    const past = days.slice(-21, -1);
    return {
      sym: x.symbol, name: x.symbol, price: x.price ?? d.c, change: x.percent_change ?? ((d.c - p.c) / p.c) * 100,
      volume: x.volume ?? d.v, avgVolume: Math.round(past.reduce((n, c) => n + c.v, 0) / past.length),
    };
  };
  const pick = (list) => list.map(row).filter((r) => r && r.price >= 5 && r.volume >= 500000).slice(0, 12);
  return { gainers: pick(lists.gainers), losers: pick(lists.losers), active: pick(lists.active) };
}

/** Whether Alpaca takes this key, by the cheapest read there is. Throws when Alpaca cannot be reached at all. */
export async function accepts(key) {
  try { await call(key, "/v2/stocks/snapshots", { symbols: "SPY" }); return true; }
  catch (e) { if (e.answered === 401 || e.answered === 403) return false; throw e; }
}
