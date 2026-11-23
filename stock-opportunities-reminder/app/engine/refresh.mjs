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
import { APP_DIR, DATA_DIR, readData, writeJson, readStore, announce, fileSym, toCandles } from "./lib/io.mjs";
import * as src from "./lib/sources.mjs";
import { eachLimited } from "./lib/net.mjs";
import { nyDay, nyMinute, NY_OPEN } from "./lib/indicators.mjs";
import { RULES, scanDaily, facts, series } from "./lib/signals.mjs";
import { ruleRecord, recordKey } from "./lib/record.mjs";
import { readCalls, follow } from "./lib/calls.mjs";
import { regime, breadth } from "./lib/market.mjs";
import { candidatesOf, setupRecord } from "./lib/scan.mjs";
import { UNIVERSE } from "./lib/universe.mjs";

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
// The market every stock is measured against. It is priced and charted whatever the list holds.
const FUND = { sym: "SPY", name: "S&P 500 fund" };
// The shape of setups.json. A file of an older shape carries no verdicts, so it is rebuilt.
const SETUPS_SCHEMA = "reminder/setups@2";

const MIN = 60 * 1000, HOUR = 60 * MIN, DAY = 24 * HOUR;
const age = (iso) => (iso ? Date.now() - Date.parse(iso) : Infinity);
const r2 = (n) => (n == null || !isFinite(n) ? null : Math.round(n * 100) / 100);

/** The US stock session right now, by the New York clock. Holidays are caught later from the exchange's own hours. */
export function usSession(now = new Date()) {
  if (["Sat", "Sun"].includes(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short" }).format(now))) return "closed";
  const m = nyMinute(now / 1000);
  return m < 240 ? "closed" : m < NY_OPEN ? "pre" : m < 960 ? "open" : m < 1200 ? "after" : "closed";
}
const today = () => nyDay(Date.now() / 1000);
/** `count` weekdays from the time `t`, stepping forward (+1) or back (-1), as dates. */
function weekdays(t, way, count) {
  const days = [];
  for (; days.length < count; t += way * DAY) if (![0, 6].includes(new Date(t).getUTCDay())) days.push(new Date(t));
  return days;
}

// `calls` are the Scout's calls still being followed: their symbols get prices and charts
// too, whether or not they are on the list.
export function symbolsOf(store, calls = []) {
  const watch = Array.isArray(store.watch) && store.watch.length ? store.watch.filter((w) => w && w.sym) : DEFAULT_WATCH;
  const names = new Map();
  for (const w of [FUND, ...STRIP, ...watch]) names.set(String(w.sym).toUpperCase(), w.name || w.sym);
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
  sym, frame: "1d", at: new Date().toISOString(), source: res.source, name: res.meta.name, kind: res.meta.kind,
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
  if (session !== "closed" && spy && spy.regular && nyDay(spy.regular[0]) !== today()) market = "closed";

  // 2. Daily candles, kept on disk so the page draws charts without waiting for anyone.
  const daily = {};
  await fs.mkdir(path.join(DATA_DIR, "candles"), { recursive: true });
  await eachLimited(syms, 3, async (s) => {
    const name = `candles/${fileSym(s)}.1d.json`;
    const have = await readData(name);
    const limit = market !== "closed" || src.alwaysOpen(s) ? 20 * MIN : 6 * HOUR;
    if (have && !full && age(have.at) < limit) { daily[s] = toCandles(have.c); return; }
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
      if (have) daily[s] = toCandles(have.c);
      else errors.push(`No chart for ${s}: ${e.message}`);
    }
  });

  // 3. Judge every chart on the person's list against their rules.
  const day = today();
  const found = [];
  // A signal belongs to the day of the candle it was read from: before the open, that is yesterday.
  const push = (sym, hit, kind, on) => found.push({
    id: `${sym}:${hit.rule}${hit.key ? ":" + hit.key : ""}:${day}`, sym, name: names.get(sym) || sym, kind,
    rule: hit.rule, side: hit.side, text: hit.text, level: hit.level ?? null,
    price: quotes[sym] ? quotes[sym].price : null, day: on, at: new Date().toISOString(),
  });
  for (const s of syms) {
    const list = daily[s];
    if (quotes[s] && list) quotes[s].facts = facts(list, daily[FUND.sym]);
    if (watchSet.has(s) && list) for (const hit of scanDaily(list, RULES)) push(s, hit, "chart", nyDay(list[list.length - 1].t));
  }
  // The market's stance, counted. The stocks of the list are its US stocks: no fund, coin or future.
  const listed = [...watchSet].filter((s) => daily[s] && quotes[s] && quotes[s].facts && src.isUsStock(s) && quotes[s].kind === "EQUITY");
  const fund = daily[FUND.sym];
  const stance = fund ? regime(series(fund), fund.length - 1, quotes["^VIX"] ? quotes["^VIX"].price : null, breadth(listed.map((s) => quotes[s].facts))) : null;

  // 3b. Each rule's track record on the list, replayed over the saved daily candles. It
  // changes only with a new daily candle, a rule's settings or the list, so it is kept.
  const recordOld = await readData("record.json");
  const key = recordKey(RULES, watchSet);
  if (full || !recordOld || recordOld.key !== key || age(recordOld.at) > 12 * HOUR) {
    const bySym = Object.fromEntries([...watchSet].filter((s) => daily[s]).map((s) => [s, daily[s]]));
    await writeJson("record.json", { schema: "reminder/record@1", at: new Date().toISOString(), key, ...ruleRecord(bySym, RULES) });
  }

  // 4. Slower things: the calendar, the movers, the headlines, short interest.
  let calendar = await readData("calendar.json");
  let reports = await readData("reports.json");
  if (full || !calendar || !reports || age(calendar.at) > 6 * HOUR) {
    try {
      // Seven weekdays back as well as eight ahead: a gap on results is looked for up to a week after the report.
      const behind = weekdays(Date.now() - DAY, -1, 7), lists = await eachLimited([...behind, ...weekdays(Date.now(), 1, 8)], 2, src.earningsOn);
      const earnings = [];
      lists.slice(behind.length).forEach((list) => (list || []).forEach((e, i) => { if (watchSet.has(e.sym) || (i < 6 && e.cap >= 2e10)) earnings.push({ ...e, mine: watchSet.has(e.sym) }); }));
      // Every company's report, filed under the first session that trades on it: the next
      // one when it reports after the close. A called stock keeps its older days, so a
      // call is still judged against the report it was made before.
      if (lists.some(Boolean)) {
        const called = new Set(calls.map((c) => c.sym)), bySym = Object.fromEntries(Object.entries((reports && reports.bySym) || {}).filter(([s]) => called.has(s)));
        for (const e of lists.flat()) {
          if (!e) continue;
          const felt = e.when === "after the close" ? weekdays(Date.parse(e.date) + DAY, 1, 1)[0].toISOString().slice(0, 10) : e.date;
          bySym[e.sym] = [...new Set([...(bySym[e.sym] || []), felt])].sort();
        }
        reports = { at: new Date().toISOString(), bySym };
        await writeJson("reports.json", reports);
      }
      let economy = [];
      try { economy = (await src.economicWeek()).filter((e) => e.country === "USD" && e.impact !== "Low" && e.impact !== "Holiday"); note("Forex Factory", true); } catch { note("Forex Factory", false); }
      if (earnings.length || economy.length) { calendar = { at: new Date().toISOString(), earnings, economy }; await writeJson("calendar.json", calendar); note("Nasdaq", true); }
    } catch (e) { errors.push(`No calendar: ${e.message}`); note("Nasdaq", false); }
  }
  if (calendar) {
    const soon = Date.now() + 7 * DAY;
    for (const e of calendar.earnings) {
      if (!quotes[e.sym] || Date.parse(e.date) > soon || e.date < day) continue;
      quotes[e.sym].earnings = { date: e.date, when: e.when };
      if (watchSet.has(e.sym)) found.push({ id: `${e.sym}:earnings:${e.date}`, sym: e.sym, name: names.get(e.sym) || e.sym, kind: "earnings", rule: "earnings", side: "both", level: null, price: quotes[e.sym].price, day, at: new Date().toISOString(), text: `Reports earnings on ${e.date}${e.when ? ", " + e.when : ""}. Prices often jump on the report, in either direction.` });
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
      const about = Object.fromEntries(worth.map((s, i) => [s, charts[i] && facts(charts[i].candles, fund)]));
      // Their candles are saved too, so the Scout can read levels off a mover as it does off a listed chart.
      for (const [i, s] of worth.entries()) if (charts[i]) await writeJson(`candles/${fileSym(s)}.1d.json`, candleFile(s, charts[i]));
      const withFacts = (rows) => rows.map((x) => (about[x.sym] ? { ...x, facts: about[x.sym] } : x));
      if (m.gainers.length || m.active.length) await writeJson("movers.json", { at: new Date().toISOString(), gainers: withFacts(m.gainers), losers: m.losers, active: withFacts(m.active) });
    } catch (e) { errors.push(`No movers: ${e.message}`); }
  }
  const moversNow = (await readData("movers.json")) || { gainers: [], active: [] };
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

  // 5. Each setup's record, replayed over the list and the wider list. Today's candidates
  // carry its verdicts, so a new record means a new scan.
  const candidatesOld = await readData("candidates.json"), setupsOld = await readData("setups.json");
  let record = setupsOld && setupsOld.schema === SETUPS_SCHEMA ? setupsOld : null;
  const replayDue = full || !record || age(record.at) > 12 * HOUR, scanDue = replayDue || !candidatesOld || age(candidatesOld.at) > 6 * HOUR;
  // The charts the setups are looked for in, when a replay or a scan is due.
  let charts = null;
  if (fund && stance && scanDue) {
    // The wider list is charted for this alone, gently: when it is missing, and on a full run twice a day at most.
    const saved = await readData("universe.json");
    let wider = saved || { at: null, bySym: {} };
    if (!saved || (full && age(wider.at) > 12 * HOUR)) {
      const got = await eachLimited(UNIVERSE, 2, (s) => src.candles(s, "1d"));
      const missed = UNIVERSE.filter((s, i) => !got[i]);
      if (missed.length) errors.push(`No chart for ${missed.length} of the ${UNIVERSE.length} stocks of the wider list: ${missed.join(", ")}`);
      wider = { at: new Date().toISOString(), bySym: Object.fromEntries(UNIVERSE.map((s, i) => [s, got[i] ? candleFile(s, got[i]) : wider.bySym[s]]).filter(([, file]) => file)) };
      // Nothing is saved when nothing came, so the next run asks again.
      if (Object.keys(wider.bySym).length) await writeJson("universe.json", wider);
    }
    // A setup is judged on full days. During the session today's candle is part of a day,
    // with part of a day's volume, so it is left out until the close.
    const whole = (list) => (market === "open" && nyDay(list[list.length - 1].t) === day ? list.slice(0, -1) : list);
    const mine = listed.map((s) => ({ sym: s, name: names.get(s), from: "list", candles: whole(daily[s]) }));
    const far = Object.values(wider.bySym).filter((file) => file.kind === "EQUITY" && !watchSet.has(file.sym)).map((file) => ({ sym: file.sym, name: file.name, from: "universe", candles: whole(toCandles(file.c)) }));
    if (replayDue) {
      record = { schema: SETUPS_SCHEMA, at: new Date().toISOString(), ...setupRecord(Object.fromEntries([...mine, ...far].map((x) => [x.sym, x.candles])), fund, daily["^VIX"] || null) };
      await writeJson("setups.json", record);
    }
    charts = { mine, far, wider, whole };
  }

  // 6. The Scout's calls: where each one stands, from the candles since the day it was
  // made, and which of them break a hard rule of the method or lean on a setup that fails.
  const followed = follow(calls, daily, { prices: Object.fromEntries(calls.map((c) => [c.sym, quotes[c.sym] ? quotes[c.sym].price : null])), reports: reports && reports.bySym, record });
  await writeJson("outcomes.json", { schema: "reminder/outcomes@1", at: new Date().toISOString(), ...followed });

  // Today's candidates: the setups, looked for in code.
  let candidates = candidatesOld;
  if (charts) {
    const { mine, far, wider, whole } = charts, moving = [];
    for (const x of [...moversNow.gainers, ...moversNow.active].filter((x) => x.facts)) {
      const file = await readData(`candles/${fileSym(x.sym)}.1d.json`);
      if (file && file.kind === "EQUITY") moving.push({ sym: x.sym, name: x.name, from: "movers", candles: whole(toCandles(file.c)) });
    }
    const skip = followed.calls.filter((o) => ["waiting", "in-zone", "open"].includes(o.state)).map((o) => o.sym);
    // The method's order: the list, then the movers, then the wider list.
    const items = candidatesOf([...mine, ...moving, ...far], { fund, stance: stance.stance, reports: reports && reports.bySym, day, skip, record });
    candidates = { schema: "reminder/candidates@1", at: new Date().toISOString(), day, asOf: nyDay(whole(fund).at(-1).t), stance: stance.stance, items };
    await writeJson("candidates.json", candidates);
    // A candidate's candles are saved, so the Scout can read levels off it as it does off a listed chart.
    for (const x of items) if (x.from === "universe") await writeJson(`candles/${fileSym(x.sym)}.1d.json`, wider.bySym[x.sym]);
  }

  // 7. Write. A signal keeps the moment it was first seen; three weeks of them stay.
  const was = (await readData("signals.json")) || { items: [] };
  // A first run looks back two weeks, so the list starts with what the charts already did.
  if (!was.items.length) {
    for (const s of watchSet) {
      const list = daily[s];
      if (!list) continue;
      for (let back = Math.min(10, list.length - 31); back >= 1; back--) {
        const upTo = list.slice(0, list.length - back), bar = upTo[upTo.length - 1], on = nyDay(bar.t);
        for (const hit of scanDaily(upTo, RULES)) was.items.unshift({ id: `${s}:${hit.rule}:${on}`, sym: s, name: names.get(s) || s, kind: "chart", rule: hit.rule, side: hit.side, text: hit.text, level: hit.level ?? null, price: r2(bar.c), day: on, at: new Date(bar.t * 1000 + 6.5 * HOUR).toISOString() });
      }
    }
    was.items.sort((a, b) => (a.at < b.at ? 1 : -1));
  }
  const seen = new Map(was.items.map((x) => [x.id, x]));
  const fresh = found.filter((x) => !seen.has(x.id));
  const items = [...fresh, ...was.items].filter((x) => age(x.at) < 21 * DAY).slice(0, 400);
  await writeJson("signals.json", { schema: "reminder/signals@1", at: new Date().toISOString(), items });
  await writeJson("market.json", { schema: "reminder/market@1", at: new Date().toISOString(), session: market, strip: STRIP.map((x) => x.sym), regime: stance, quotes });
  // Candles of a mover or a candidate that has since left the lists are of no use to anyone.
  const wanted = new Set([...syms, ...[...moversNow.gainers, ...moversNow.active].filter((x) => x.facts).map((x) => x.sym), ...(candidates ? candidates.items.map((x) => x.sym) : [])].map((s) => `${fileSym(s)}.1d.json`));
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
