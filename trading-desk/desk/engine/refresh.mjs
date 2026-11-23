// The desk's refresh: reads the person's list and rules, fetches prices, judges every
// chart against the rules, and writes plain JSON into desk/data/ for the page and the
// assistants. It costs no AI: it is arithmetic over public prices.
//
//   node desk/engine/refresh.mjs          what is due now
//   node desk/engine/refresh.mjs --full   everything, whatever its age
//
// Cabinet runs it every five minutes once the app is allowed. An assistant can run it too.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { APP_DIR, DATA_DIR, readData, readJson, writeJson, readStore, announce, fileSym } from "./lib/io.mjs";
import * as src from "./lib/sources.mjs";
import { eachLimited } from "./lib/net.mjs";
import { mergeRules, scanDaily, scanIntraday, facts, crossed } from "./lib/signals.mjs";
import { ruleRecord, recordKey } from "./lib/record.mjs";
import { allTrades } from "./lib/risk.mjs";
import { alpacaKey } from "./lib/keys.mjs";

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

// `held` is what the person holds at their broker (account/robinhood.json): those symbols
// get charts and alerts too, whether or not they are on the list.
export function symbolsOf(store, imported = [], held = []) {
  const watch = Array.isArray(store.watch) && store.watch.length ? store.watch.filter((w) => w && w.sym) : DEFAULT_WATCH;
  const trades = allTrades(store, imported).filter((t) => t.sym && (t.status === "plan" || t.status === "open"));
  const names = new Map();
  for (const w of [...STRIP, ...watch]) names.set(String(w.sym).toUpperCase(), w.name || w.sym);
  for (const t of trades) if (!names.has(String(t.sym).toUpperCase())) names.set(String(t.sym).toUpperCase(), t.sym);
  for (const h of held) {
    const sym = h && h.kind !== "option" && typeof h.sym === "string" ? h.sym.toUpperCase() : "";
    if (/^[A-Z0-9.^=-]{1,12}$/.test(sym) && !names.has(sym)) names.set(sym, h.name || sym);
  }
  return { watch, trades, names };
}

function spark(candles, points = 48) {
  if (candles.length <= points) return candles.map((c) => r2(c.c));
  const step = candles.length / points, out = [];
  for (let i = 0; i < points; i++) out.push(r2(candles[Math.min(candles.length - 1, Math.round((i + 1) * step) - 1)].c));
  return out;
}

/** The quote the page shows, from one symbol's day as a source sent it. */
function quoteOf({ meta, candles, source }) {
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
  return { q, session: inSession, regular: meta.regular, source };
}

export async function refresh({ full = false, log = () => {} } = {}) {
  const began = Date.now();
  const store = await readStore();
  const rules = mergeRules(store.rules);
  const journal = await readJson(path.join(APP_DIR, "..", "journal", "trades.json"), null);
  const account = await readJson(path.join(APP_DIR, "..", "account", "robinhood.json"), null);
  const { watch, trades, names } = symbolsOf(store, journal && Array.isArray(journal.trades) ? journal.trades : [], account && Array.isArray(account.positions) ? account.positions : []);
  const syms = [...names.keys()];
  const watchSet = new Set(watch.map((w) => String(w.sym).toUpperCase()));
  const session = usSession();
  const old = (await readData("market.json")) || { quotes: {} };
  const state = (await readData("state.json")) || { last: {} };
  const errors = [];
  const sources = {};
  const note = (name, ok) => { sources[name] = sources[name] === false ? false : ok; };

  // 1. Prices. Stocks rest when the market is closed; crypto, futures and currencies do not.
  const quotes = {};
  const sessions = {};
  const due = syms.filter((s) => full || session !== "closed" || src.alwaysOpen(s) || !old.quotes[s] || age(old.at) > HOUR);
  const got = (await src.todayAll(due, () => { note("Alpaca", false); errors.push("Alpaca did not answer with your key, so stock prices came from the public sources"); })).map((day) => day && quoteOf(day));
  due.forEach((s, i) => {
    if (got[i]) { quotes[s] = got[i].q; sessions[s] = got[i]; note(got[i].source, true); }
    // Yahoo is the last source asked for a price, so it is the one that failed.
    else { errors.push(`No price for ${s}`); note("Yahoo Finance", false); }
  });
  for (const s of syms) if (!quotes[s] && old.quotes[s]) quotes[s] = old.quotes[s];
  let market = session;
  const spy = sessions.SPY;
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
      const round = res.candles.map((c) => [c.t, +c.o.toPrecision(7), +c.h.toPrecision(7), +c.l.toPrecision(7), +c.c.toPrecision(7), Math.round(c.v)]);
      await writeJson(name, { sym: s, frame: "1d", at: new Date().toISOString(), source: res.source, name: res.meta.name, c: round });
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
    if (!watchSet.has(s) && !trades.some((t) => String(t.sym).toUpperCase() === s)) continue;
    if (list) for (const hit of scanDaily(list, rules)) push(s, hit, "chart", nyDay(list[list.length - 1].t * 1000));
    const today5 = sessions[s];
    if (today5 && market === "open" && !src.alwaysOpen(s)) for (const hit of scanIntraday(today5.session, rules, 5)) push(s, hit);
  }

  // 3b. Each rule's track record on the list, replayed over the saved daily candles. It
  // changes only with a new daily candle, a rule's settings or the list, so it is kept.
  const recordOld = await readData("record.json");
  const key = recordKey(rules, watchSet);
  if (full || !recordOld || recordOld.key !== key || age(recordOld.at) > 12 * HOUR) {
    const bySym = Object.fromEntries([...watchSet].filter((s) => daily[s]).map((s) => [s, daily[s]]));
    await writeJson("record.json", { schema: "desk/record@1", at: new Date().toISOString(), key, ...ruleRecord(bySym, rules) });
  }

  // 4. The person's own lines: levels they drew, plans waiting for a price, stops and targets of open trades.
  const before = state.last || {};
  for (const s of syms) {
    const now = quotes[s] && (quotes[s].ext ? quotes[s].ext.price : quotes[s].price);
    const was = before[s];
    const levels = Array.isArray(store[`lv:${s}`]) ? store[`lv:${s}`] : [];
    for (const lv of levels) {
      const way = lv && crossed(was, now, +lv.p);
      if (way) push(s, { rule: "level", key: String(lv.p), side: way === "up" ? "long" : "short", level: +lv.p, text: `Crossed ${way === "up" ? "above" : "below"} your line at ${lv.p}${lv.note ? ` (${lv.note})` : ""}.` }, "level");
    }
    for (const t of trades.filter((x) => String(x.sym).toUpperCase() === s)) {
      const label = t.side === "short" ? "short" : "long";
      if (t.status === "plan" && crossed(was, now, +t.entry)) push(s, { rule: "entry", key: t.id, side: label, level: +t.entry, text: `Reached the entry of your ${label} plan at ${t.entry}. Check the plan before you act.` }, "plan");
      if (t.status === "open" && t.stop != null && crossed(was, now, +t.stop)) push(s, { rule: "stop", key: t.id, side: label, level: +t.stop, text: `Touched the stop of your open ${label} at ${t.stop}.` }, "trade");
      if (t.status === "open" && t.target != null && crossed(was, now, +t.target)) push(s, { rule: "target", key: t.id, side: label, level: +t.target, text: `Reached the target of your open ${label} at ${t.target}.` }, "trade");
    }
    if (now != null) before[s] = now;
  }

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
  const moversOld = await readData("movers.json");
  if (full || !moversOld || (market !== "closed" && age(moversOld.at) > 15 * MIN) || age(moversOld.at) > 12 * HOUR) {
    try { const m = await src.movers(); if (m.gainers.length || m.active.length) { await writeJson("movers.json", { at: new Date().toISOString(), ...m }); note(m.source, true); } } catch (e) { errors.push(`No movers: ${e.message}`); }
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
        for (const hit of scanDaily(upTo, rules)) was.items.unshift({ id: `${s}:${hit.rule}:${day}`, sym: s, name: names.get(s) || s, kind: "chart", rule: hit.rule, side: hit.side, text: hit.text, level: hit.level ?? null, price: r2(bar.c), day, at: new Date(bar.t * 1000 + 6.5 * HOUR).toISOString() });
      }
    }
    was.items.sort((a, b) => (a.at < b.at ? 1 : -1));
  }
  const seen = new Map(was.items.map((x) => [x.id, x]));
  const fresh = found.filter((x) => !seen.has(x.id));
  const items = [...fresh, ...was.items].filter((x) => age(x.at) < 21 * DAY).slice(0, 400);
  await writeJson("signals.json", { schema: "desk/signals@1", at: new Date().toISOString(), items });
  await writeJson("market.json", { schema: "desk/market@1", at: new Date().toISOString(), session: market, strip: STRIP.map((x) => x.sym), quotes });
  await writeJson("state.json", { last: before });
  const before2 = (await readData("status.json")) || {};
  // What earlier runs said of each source stands until this run says otherwise. Alpaca is
  // forgotten once its key is gone, so the page stops naming it.
  const { Alpaca: alpacaBefore, ...others } = before2.sources || {};
  const carried = (await alpacaKey()) && alpacaBefore !== undefined ? { ...others, Alpaca: alpacaBefore } : others;
  const status = { at: new Date().toISOString(), ok: !errors.length, took: Date.now() - began, symbols: syms.length, newSignals: fresh.length, sources: { ...carried, ...sources }, errors: errors.slice(0, 12) };
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
