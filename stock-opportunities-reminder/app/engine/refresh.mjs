// The refresh: reads the person's list, fetches prices, judges every chart against the
// rules, follows each of the Scout's calls, and writes plain JSON into app/data/ for the
// page and the Scout. It costs no AI: it is arithmetic over public prices.
//
//   node app/engine/refresh.mjs          what is due now
//   node app/engine/refresh.mjs --full   everything, whatever its age
//
// Cabinet runs it every five minutes once the app is allowed. An assistant can run it too.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { APP_DIR, DATA_DIR, readData, readJson, writeJson, readStore, announce, fileSym } from "./lib/io.mjs";
import * as src from "./lib/sources.mjs";
import { eachLimited } from "./lib/net.mjs";
import { RULES, scanDaily, facts } from "./lib/signals.mjs";
import { ruleRecord, recordKey } from "./lib/record.mjs";
import { readCalls, outcome, score } from "./lib/calls.mjs";

// The starter list: the two index funds, ten of the most traded US stocks when this shipped
// (November 2026), and the two largest coins. The person replaces it with their own.
const DEFAULT_WATCH = [
  { sym: "SPY", name: "S&P 500 fund" }, { sym: "QQQ", name: "Nasdaq 100 fund" },
  { sym: "NVDA", name: "NVIDIA" }, { sym: "AMD", name: "AMD" }, { sym: "TSLA", name: "Tesla" },
  { sym: "AAPL", name: "Apple" }, { sym: "MSFT", name: "Microsoft" }, { sym: "AMZN", name: "Amazon" },
  { sym: "GOOGL", name: "Alphabet" }, { sym: "META", name: "Meta" }, { sym: "MU", name: "Micron" },
  { sym: "PLTR", name: "Palantir" },
  { sym: "BTC-USD", name: "Bitcoin" }, { sym: "ETH-USD", name: "Ethereum" },
];
// The strip across the top of the page: the market's own vital signs.
const STRIP = [
  { sym: "ES=F", name: "S&P 500 futures" }, { sym: "NQ=F", name: "Nasdaq futures" },
  { sym: "^VIX", name: "Fear gauge (VIX)" }, { sym: "^TNX", name: "10-year yield" },
  { sym: "DX-Y.NYB", name: "US dollar" }, { sym: "GC=F", name: "Gold" }, { sym: "CL=F", name: "Oil" },
  { sym: "BTC-USD", name: "Bitcoin" },
];

const MIN = 60 * 1000, HOUR = 60 * MIN, DAY = 24 * HOUR;
const age = (iso) => (iso ? Date.now() - Date.parse(iso) : Infinity);
const r2 = (n) => (n == null || !isFinite(n) ? null : Math.round(n * 100) / 100);

/** The US stock session right now, by the New York clock. Holidays are caught later from the exchange's own hours. */
export function usSession(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now).map((x) => [x.type, x.value]));
  if (p.weekday === "Sat" || p.weekday === "Sun") return "closed";
  const m = (+p.hour % 24) * 60 + +p.minute;
  return m < 240 ? "closed" : m < 570 ? "pre" : m < 960 ? "open" : m < 1200 ? "after" : "closed";
}
const nyDay = (t) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(t));

// `calls` are the Scout's calls still being followed: their symbols get prices and charts
// too, whether or not they are on the list.
export function symbolsOf(store, calls = []) {
  const watch = Array.isArray(store.watch) && store.watch.length ? store.watch.filter((w) => w && w.sym) : DEFAULT_WATCH;
  const names = new Map();
  for (const w of [...STRIP, ...watch]) names.set(String(w.sym).toUpperCase(), w.name || w.sym);
  for (const c of calls) if (!names.has(c.sym)) names.set(c.sym, c.name);
  return { watch, names };
}

function spark(candles, points = 48) {
  if (candles.length <= points) return candles.map((c) => r2(c.c));
  const step = candles.length / points, out = [];
  for (let i = 0; i < points; i++) out.push(r2(candles[Math.min(candles.length - 1, Math.round((i + 1) * step) - 1)].c));
  return out;
}

/** A symbol's daily candles as they are kept on disk: `[time, open, high, low, close, volume]` rows. */
const candleFile = (sym, res) => ({
  sym, frame: "1d", at: new Date().toISOString(), source: res.source, name: res.meta.name,
  c: res.candles.map((c) => [c.t, +c.o.toPrecision(7), +c.h.toPrecision(7), +c.l.toPrecision(7), +c.c.toPrecision(7), Math.round(c.v)]),
});

/** The quote the page shows, from one symbol's day as a source sent it. */
function quoteOf({ meta, candles }) {
  const inSession = meta.regular ? candles.filter((c) => c.t >= meta.regular[0] && c.t < meta.regular[1]) : candles;
  const last = candles[candles.length - 1];
  const q = {
    name: meta.name, kind: meta.kind, currency: meta.currency, exchange: meta.exchange,
    price: r2(meta.price), prev: r2(meta.prev), at: meta.at ? new Date(meta.at * 1000).toISOString() : null,
    dayHigh: r2(meta.dayHigh), dayLow: r2(meta.dayLow), volume: meta.volume,
    spark: spark(inSession.length > 3 ? inSession : candles),
  };
  q.change = q.prev ? r2(((q.price - q.prev) / q.prev) * 100) : null;
  // A trade outside the regular session: the price people see before the open and after the close.
  if (meta.regular && last && (last.t >= meta.regular[1] || last.t < meta.regular[0]) && last.t > (meta.at || 0) && q.price)
    q.ext = { price: r2(last.c), change: r2(((last.c - q.price) / q.price) * 100), at: new Date(last.t * 1000).toISOString() };
  return { q, regular: meta.regular };
}

export async function refresh({ full = false, log = () => {} } = {}) {
  const began = Date.now();
  const store = await readStore();
  const calls = await readCalls(path.join(APP_DIR, "..", "opportunities"));
  const { watch, names } = symbolsOf(store, calls);
  const syms = [...names.keys()];
  const watchSet = new Set(watch.map((w) => String(w.sym).toUpperCase()));
  const session = usSession();
  const old = (await readData("market.json")) || { quotes: {} };
  const errors = [];
  const sources = {};
  const note = (name, ok) => { sources[name] = sources[name] === false ? false : ok; };

  // 1. Prices. Stocks rest when the market is closed; crypto, futures and currencies do not.
  const quotes = {};
  const due = syms.filter((s) => full || session !== "closed" || src.alwaysOpen(s) || !old.quotes[s] || age(old.at) > HOUR);
  const got = (await src.todayAll(due)).map((day) => day && quoteOf(day));
  due.forEach((s, i) => {
    if (got[i]) { quotes[s] = got[i].q; note("Yahoo Finance", true); }
    else { errors.push(`No price for ${s}`); note("Yahoo Finance", false); }
  });
  for (const s of syms) if (!quotes[s] && old.quotes[s]) quotes[s] = old.quotes[s];
  let market = session;
  // A holiday: the exchange's own hours for the S&P 500 fund are not today's.
  const spy = got[due.indexOf("SPY")];
  if (session !== "closed" && spy && spy.regular && nyDay(spy.regular[0] * 1000) !== nyDay(Date.now())) market = "closed";

  // 2. Daily candles, kept on disk so the page draws charts without waiting for anyone.
  const daily = {};
  await fs.mkdir(path.join(DATA_DIR, "candles"), { recursive: true });
  await eachLimited(syms, 3, async (s) => {
    const name = `candles/${fileSym(s)}.1d.json`;
    const have = await readData(name);
    const limit = market !== "closed" || src.alwaysOpen(s) ? 20 * MIN : 6 * HOUR;
    if (have && !full && age(have.at) < limit) { daily[s] = have.c.map(([t, o, h, l, c, v]) => ({ t, o, h, l, c, v })); return; }
    try {
      const res = await src.candles(s, "1d");
      await writeJson(name, candleFile(s, res));
      daily[s] = res.candles;
      note(res.source, true);
      if (!quotes[s] && res.candles.length > 1) {
        const a = res.candles[res.candles.length - 1], b = res.candles[res.candles.length - 2];
        quotes[s] = { name: res.meta.name, kind: res.meta.kind, currency: res.meta.currency, price: r2(a.c), prev: r2(b.c), change: r2(((a.c - b.c) / b.c) * 100), at: new Date(a.t * 1000).toISOString(), spark: spark(res.candles.slice(-48)) };
      }
    } catch (e) {
      if (have) daily[s] = have.c.map(([t, o, h, l, c, v]) => ({ t, o, h, l, c, v }));
      else errors.push(`No chart for ${s}: ${e.message}`);
    }
  });

  // 3. Judge every chart on the person's list against their rules.
  const today = nyDay(Date.now());
  const found = [];
  // A signal belongs to the day of the candle it was read from: before the open, that is yesterday.
  const push = (sym, hit, kind = "chart", day = today) => found.push({
    id: `${sym}:${hit.rule}${hit.key ? ":" + hit.key : ""}:${day}`, sym, name: names.get(sym) || sym, kind,
    rule: hit.rule, side: hit.side, text: hit.text, level: hit.level ?? null,
    price: quotes[sym] ? quotes[sym].price : null, day, at: new Date().toISOString(),
  });
  for (const s of syms) {
    const list = daily[s];
    if (quotes[s] && list) quotes[s].facts = facts(list);
    if (watchSet.has(s) && list) for (const hit of scanDaily(list, RULES)) push(s, hit, "chart", nyDay(list[list.length - 1].t * 1000));
  }

  // 3b. Each rule's track record on the list, replayed over the saved daily candles. It
  // changes only with a new daily candle, a rule's settings or the list, so it is kept.
  const recordOld = await readData("record.json");
  const key = recordKey(RULES, watchSet);
  if (full || !recordOld || recordOld.key !== key || age(recordOld.at) > 12 * HOUR) {
    const bySym = Object.fromEntries([...watchSet].filter((s) => daily[s]).map((s) => [s, daily[s]]));
    await writeJson("record.json", { schema: "reminder/record@1", at: new Date().toISOString(), key, ...ruleRecord(bySym, RULES) });
  }

  // 4. The Scout's calls: where each one stands, from the candles since the day it was made.
  const outcomes = calls.filter((c) => daily[c.sym]).map((c) => outcome(c, daily[c.sym], quotes[c.sym] ? quotes[c.sym].price : null));
  await writeJson("outcomes.json", { schema: "reminder/outcomes@1", at: new Date().toISOString(), calls: outcomes, score: score(outcomes) });

  // 5. Slower things: the calendar, the movers, the headlines, short interest.
  let calendar = await readData("calendar.json");
  if (full || !calendar || age(calendar.at) > 6 * HOUR) {
    try {
      const days = [];
      for (let d = 0, t = Date.now(); days.length < 8 && d < 14; d++, t += DAY) { const day = new Date(t); if (![0, 6].includes(day.getUTCDay())) days.push(day); }
      const lists = await eachLimited(days, 2, src.earningsOn);
      const earnings = [];
      lists.forEach((list) => (list || []).forEach((e, i) => { if (watchSet.has(e.sym) || (i < 6 && e.cap >= 2e10)) earnings.push({ ...e, mine: watchSet.has(e.sym) }); }));
      let economy = [];
      try { economy = (await src.economicWeek()).filter((e) => e.country === "USD" && e.impact !== "Low" && e.impact !== "Holiday"); note("Forex Factory", true); } catch { note("Forex Factory", false); }
      if (earnings.length || economy.length) { calendar = { at: new Date().toISOString(), earnings, economy }; await writeJson("calendar.json", calendar); note("Nasdaq", true); }
    } catch (e) { errors.push(`No calendar: ${e.message}`); note("Nasdaq", false); }
  }
  if (calendar) {
    const soon = Date.now() + 7 * DAY;
    for (const e of calendar.earnings) {
      if (!quotes[e.sym] || Date.parse(e.date) > soon || e.date < today) continue;
      quotes[e.sym].earnings = { date: e.date, when: e.when };
      if (watchSet.has(e.sym)) found.push({ id: `${e.sym}:earnings:${e.date}`, sym: e.sym, name: names.get(e.sym) || e.sym, kind: "earnings", rule: "earnings", side: "both", level: null, price: quotes[e.sym].price, day: today, at: new Date().toISOString(), text: `Reports earnings on ${e.date}${e.when ? ", " + e.when : ""}. Prices often jump on the report, in either direction.` });
    }
  }
  // The day's movers are where the Scout looks beyond the list, so the ones worth a look
  // carry the same facts a listed chart has. Nobody watches them live: a few times a day is enough.
  const moversOld = await readData("movers.json");
  if (full || !moversOld || age(moversOld.at) > 6 * HOUR) {
    try {
      const m = await src.movers();
      const worth = [...new Set([...m.gainers, ...m.active].filter((x) => x.price >= 5).map((x) => x.sym))].slice(0, 16);
      const charts = await eachLimited(worth, 3, (s) => src.candles(s, "1d"));
      const about = Object.fromEntries(worth.map((s, i) => [s, charts[i] && facts(charts[i].candles)]));
      // Their candles are saved too, so the Scout can read levels off a mover as it does off a listed chart.
      for (const [i, s] of worth.entries()) if (charts[i]) await writeJson(`candles/${fileSym(s)}.1d.json`, candleFile(s, charts[i]));
      const withFacts = (rows) => rows.map((x) => (about[x.sym] ? { ...x, facts: about[x.sym] } : x));
      if (m.gainers.length || m.active.length) await writeJson("movers.json", { at: new Date().toISOString(), gainers: withFacts(m.gainers), losers: m.losers, active: withFacts(m.active) });
    } catch (e) { errors.push(`No movers: ${e.message}`); }
  }
  const newsOld = await readData("news.json");
  if (full || !newsOld || age(newsOld.at) > 30 * MIN) {
    const list = [...watchSet].filter((s) => !/[=^]/.test(s));
    const all = await eachLimited(list, 3, src.news);
    const bySym = {};
    list.forEach((s, i) => { bySym[s] = all[i] || (newsOld && newsOld.bySym && newsOld.bySym[s]) || []; });
    if (Object.values(bySym).some((x) => x.length)) await writeJson("news.json", { at: new Date().toISOString(), bySym });
  }
  const shortOld = await readData("short.json");
  let short = shortOld;
  if (full || !shortOld || age(shortOld.at) > DAY) {
    const list = [...watchSet].filter(src.isUsStock);
    const all = await eachLimited(list, 2, src.shortInterest);
    const bySym = {};
    list.forEach((s, i) => { if (all[i]) { bySym[s] = all[i]; note(all[i].source, true); } else if (shortOld && shortOld.bySym[s]) bySym[s] = shortOld.bySym[s]; });
    if (Object.keys(bySym).length) { short = { at: new Date().toISOString(), bySym }; await writeJson("short.json", short); }
  }
  if (short) for (const s of Object.keys(short.bySym)) if (quotes[s]) quotes[s].short = short.bySym[s];

  // 6. Write. A signal keeps the moment it was first seen; three weeks of them stay.
  const was = (await readData("signals.json")) || { items: [] };
  // A first run looks back two weeks, so the list starts with what the charts already did.
  if (!was.items.length) {
    for (const s of watchSet) {
      const list = daily[s];
      if (!list) continue;
      for (let back = Math.min(10, list.length - 31); back >= 1; back--) {
        const upTo = list.slice(0, list.length - back), bar = upTo[upTo.length - 1], day = nyDay(bar.t * 1000);
        for (const hit of scanDaily(upTo, RULES)) was.items.unshift({ id: `${s}:${hit.rule}:${day}`, sym: s, name: names.get(s) || s, kind: "chart", rule: hit.rule, side: hit.side, text: hit.text, level: hit.level ?? null, price: r2(bar.c), day, at: new Date(bar.t * 1000 + 6.5 * HOUR).toISOString() });
      }
    }
    was.items.sort((a, b) => (a.at < b.at ? 1 : -1));
  }
  const seen = new Map(was.items.map((x) => [x.id, x]));
  const fresh = found.filter((x) => !seen.has(x.id));
  const items = [...fresh, ...was.items].filter((x) => age(x.at) < 21 * DAY).slice(0, 400);
  await writeJson("signals.json", { schema: "reminder/signals@1", at: new Date().toISOString(), items });
  await writeJson("market.json", { schema: "reminder/market@1", at: new Date().toISOString(), session: market, strip: STRIP.map((x) => x.sym), quotes });
  // Candles of a mover that has since left the lists are of no use to anyone.
  const moversNow = (await readData("movers.json")) || { gainers: [], active: [] };
  const wanted = new Set([...syms, ...[...moversNow.gainers, ...moversNow.active].filter((x) => x.facts).map((x) => x.sym)].map((s) => `${fileSym(s)}.1d.json`));
  for (const name of await fs.readdir(path.join(DATA_DIR, "candles"))) if (!wanted.has(name)) await fs.rm(path.join(DATA_DIR, "candles", name));
  const before2 = (await readData("status.json")) || {};
  const status = { at: new Date().toISOString(), ok: !errors.length, took: Date.now() - began, symbols: syms.length, newSignals: fresh.length, sources: { ...(before2.sources || {}), ...sources }, errors: errors.slice(0, 12) };
  await writeJson("status.json", status);
  announce();
  log(`${syms.length} symbols, ${fresh.length} new signals, ${errors.length} problems, ${status.took} ms`);
  return status;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  refresh({ full: process.argv.includes("--full"), log: (m) => console.log(m) })
    .then((s) => { if (s.errors.length) console.log(s.errors.join("\n")); })
    .catch((e) => { console.error(e); process.exit(1); });
}
