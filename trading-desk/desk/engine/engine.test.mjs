// node --test desk/engine/engine.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { sma, ema, rsi, atr, vwap, priorHigh, avgVolume } from "./lib/indicators.mjs";
import { RULES, mergeRules, scanDaily, scanIntraday, crossed, facts } from "./lib/signals.mjs";
import { usSession, symbolsOf } from "./refresh.mjs";
import { ruleRecord, recordKey } from "./lib/record.mjs";
import { checkOrder } from "./lib/risk.mjs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { alpacaKey, saveAlpacaKey } from "./lib/keys.mjs";
import * as alpaca from "./lib/alpaca.mjs";
import * as src from "./lib/sources.mjs";
import { news } from "./lib/yahoo.mjs";

const flat = (n, price = 100, v = 1000) => Array.from({ length: n }, (_, i) => ({ t: 1700000000 + i * 86400, o: price, h: price + 1, l: price - 1, c: price, v }));

test("sma and ema wait for enough history", () => {
  assert.deepEqual(sma([1, 2, 3, 4], 2), [null, 1.5, 2.5, 3.5]);
  const e = ema([1, 2, 3, 4, 5], 3);
  assert.equal(e[1], null);
  assert.equal(e[2], 2);
  assert.equal(e[4], 4);
});

test("rsi is 100 when nothing fell and 0 when nothing rose", () => {
  const up = Array.from({ length: 20 }, (_, i) => 100 + i), down = up.slice().reverse();
  assert.equal(rsi(up, 14)[19], 100);
  assert.equal(Math.round(rsi(down, 14)[19]), 0);
});

test("atr of steady two-point candles is two", () => {
  assert.equal(atr(flat(30), 14)[29], 2);
});

test("vwap weighs price by volume", () => {
  const v = vwap([{ h: 10, l: 10, c: 10, v: 1 }, { h: 20, l: 20, c: 20, v: 3 }]);
  assert.equal(v[1], 17.5);
});

test("prior high and average volume leave today out", () => {
  const c = flat(25); c[24].h = 500; c[24].v = 9999;
  assert.equal(priorHigh(c, 24, 20), 101);
  assert.equal(avgVolume(c, 24, 20), 1000);
});

test("a close above the 20-day high on heavy volume is a breakout", () => {
  const c = flat(60); c[59] = { ...c[59], o: 100, h: 106, l: 100, c: 105, v: 3000 };
  const hits = scanDaily(c, mergeRules({}));
  const b = hits.find((h) => h.rule === "breakout");
  assert.ok(b, "breakout fires");
  assert.equal(b.side, "long");
  assert.equal(b.level, 101);
  assert.ok(hits.some((h) => h.rule === "volume"));
});

test("the same move on thin volume is not a breakout", () => {
  const c = flat(60); c[59] = { ...c[59], h: 106, c: 105, v: 1000 };
  assert.ok(!scanDaily(c, mergeRules({})).some((h) => h.rule === "breakout"));
});

test("a rule switched off stays quiet, and a changed number is used", () => {
  const c = flat(60); c[59] = { ...c[59], o: 103, h: 104, l: 102, c: 103 };
  assert.ok(!scanDaily(c, mergeRules({})).some((h) => h.rule === "gap"), "3% is under the shipped 4%");
  assert.ok(scanDaily(c, mergeRules({ gap: { percent: 2 } })).some((h) => h.rule === "gap"));
  assert.ok(!scanDaily(c, mergeRules({ gap: { percent: 2, on: false } })).some((h) => h.rule === "gap"));
});

test("a gap down leans short", () => {
  const c = flat(60); c[59] = { ...c[59], o: 94, h: 95, l: 93, c: 94 };
  assert.equal(scanDaily(c, mergeRules({})).find((h) => h.rule === "gap").side, "short");
});

test("an opening range break is reported once, in the direction that broke first", () => {
  const bars = Array.from({ length: 8 }, (_, i) => ({ t: i * 300, o: 100, h: 101, l: 99, c: 100, v: 100 }));
  bars[5] = { ...bars[5], h: 103, c: 102 };
  const hits = scanIntraday(bars, mergeRules({}), 5);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].side, "long");
  assert.equal(hits[0].level, 101);
});

test("crossing a line needs a price on each side of it", () => {
  assert.equal(crossed(99, 101, 100), "up");
  assert.equal(crossed(101, 99, 100), "down");
  assert.equal(crossed(101, 102, 100), null);
  assert.equal(crossed(null, 102, 100), null);
});

test("facts name the trend from the averages", () => {
  const c = Array.from({ length: 260 }, (_, i) => ({ t: i * 86400, o: 100 + i, h: 101 + i, l: 99 + i, c: 100 + i, v: 1000 }));
  assert.equal(facts(c).trend, "up");
});

test("the rule list has no repeated ids", () => {
  assert.equal(new Set(RULES.map((r) => r.id)).size, RULES.length);
});

test("the US session follows the New York clock", () => {
  assert.equal(usSession(new Date("2026-11-19T14:00:00Z")), "pre");
  assert.equal(usSession(new Date("2026-11-19T15:00:00Z")), "open");
  assert.equal(usSession(new Date("2026-11-19T21:30:00Z")), "after");
  assert.equal(usSession(new Date("2026-11-21T15:00:00Z")), "closed");
});

test("a stock held at the broker is charted even when it is off the list", () => {
  const { names } = symbolsOf({ watch: [{ sym: "AAPL", name: "Apple" }] }, [], [
    { sym: "sofi", name: "SoFi", kind: "stock" },
    { sym: "AAPL", name: "Apple Inc", kind: "stock" },
    { sym: "NVDA 260116C00150000", kind: "option" },
    { sym: "../etc", kind: "stock" },
  ]);
  assert.equal(names.get("SOFI"), "SoFi");
  assert.equal(names.get("AAPL"), "Apple");
  assert.ok(![...names.keys()].some((k) => k.includes(" ") || k.includes("/")));
});

// A flat chart with one breakout on day 40, then a steady climb of one point a day.
function breakoutThenClimb() {
  const c = flat(80);
  c[40] = { ...c[40], o: 100, h: 106, l: 100, c: 105, v: 3000 };
  for (let i = 41; i < 80; i++) c[i] = { ...c[i], o: 105 + (i - 41), h: 106 + (i - 41), l: 104 + (i - 41), c: 105 + (i - 40), v: 1000 };
  return c;
}

test("a rule's record follows the price after each day it fired", () => {
  const rec = ruleRecord({ TEST: breakoutThenClimb() }, mergeRules({}));
  const b = rec.rules.breakout;
  assert.equal(b.fired, 1);
  assert.equal(b.h[10].n, 1);
  assert.equal(b.h[10].won, 100);
  assert.equal(b.h[10].avg, 9.5, "105 to 115 is 9.5%");
  assert.equal(b.bySym.TEST.n, 1);
  assert.equal(rec.any[10].n, 80 - 30 - 10, "every day with ten days after it, past the warm-up");
});

test("a rule is judged against any day read the same way", () => {
  const b = ruleRecord({ TEST: breakoutThenClimb() }, mergeRules({})).rules.breakout.h[10];
  const any = ruleRecord({ TEST: breakoutThenClimb() }, mergeRules({})).any[10];
  assert.equal(b.anyWon, any.up, "a long-only rule is set beside the share of days that rose");
});

test("a rule switched off still has a record, and intraday rules have none", () => {
  const rec = ruleRecord({ TEST: breakoutThenClimb() }, mergeRules({ breakout: { on: false } }));
  assert.equal(rec.rules.breakout.fired, 1);
  assert.ok(!("openingRange" in rec.rules) && !("vwap" in rec.rules));
});

test("the record is out of date when a setting or the list changes, not when a switch flips", () => {
  const k = recordKey(mergeRules({}), ["NVDA", "AAPL"]);
  assert.equal(recordKey(mergeRules({ gap: { on: false } }), ["AAPL", "NVDA"]), k);
  assert.notEqual(recordKey(mergeRules({ gap: { percent: 2 } }), ["AAPL", "NVDA"]), k);
  assert.notEqual(recordKey(mergeRules({}), ["AAPL"]), k);
});

const PROFILE = { profile: { account: 10000, riskPct: 1, dayLossR: 3 } };
const NOON = Date.parse("2026-11-19T17:00:00Z");

test("an order within the limits passes", () => {
  const out = checkOrder({ store: PROFILE, order: { sym: "NVDA", side: "long", qty: 20, entry: 150, stop: 145, target: 165 }, now: NOON });
  assert.equal(out.ok, true);
  assert.equal(out.numbers.risk, 100);
  assert.equal(out.numbers.riskPct, 1);
});

test("an order with no stop, a stop on the wrong side, or too much risk is stopped", () => {
  const base = { sym: "NVDA", side: "long", qty: 20, entry: 150 };
  assert.match(checkOrder({ store: PROFILE, order: { ...base, stop: null }, now: NOON }).stops[0], /no stop/);
  assert.match(checkOrder({ store: PROFILE, order: { ...base, stop: 155 }, now: NOON }).stops[0], /wrong side/);
  assert.match(checkOrder({ store: PROFILE, order: { ...base, qty: 40, stop: 145 }, now: NOON }).stops[0], /2% of the account/);
  assert.equal(checkOrder({ store: PROFILE, order: { ...base, side: "short", stop: 155 }, now: NOON }).ok, true, "a short's stop is above");
});

test("the day's loss limit stops the next order, and two losses in a row warn", () => {
  const loss = (n, at) => ({ id: "l" + n, sym: "AMD", side: "long", status: "closed", entry: 100, stop0: 99, qty: 100, exit: 99, closedAt: at });
  const two = { ...PROFILE, "t:l1": loss(1, "2026-11-19T15:00:00Z"), "t:l2": loss(2, "2026-11-19T16:00:00Z") };
  const order = { sym: "NVDA", side: "long", qty: 20, entry: 150, stop: 145 };
  const warned = checkOrder({ store: two, order, now: NOON });
  assert.equal(warned.ok, true, "-2R is inside a 3R limit");
  assert.equal(warned.numbers.dayR, -2);
  assert.ok(warned.warns.some((w) => /2 losses in a row/.test(w)));
  const stopped = checkOrder({ store: { ...two, profile: { ...PROFILE.profile, dayLossR: 2 } }, order, now: NOON });
  assert.equal(stopped.ok, false, "-2R reaches a 2R limit");
  assert.match(stopped.stops[0], /down 2R today/);
});

test("yesterday's losses do not count against today", () => {
  const store = { ...PROFILE, "t:x": { id: "x", sym: "AMD", side: "long", status: "closed", entry: 100, stop0: 99, qty: 100, exit: 90, closedAt: "2026-11-18T18:00:00Z" } };
  assert.equal(checkOrder({ store, order: { sym: "NVDA", side: "long", qty: 20, entry: 150, stop: 145 }, now: NOON }).numbers.dayR, 0);
});

// ---- Outside sources. No test here reaches the network: `fetch` is replaced by canned
// answers, copied from the shapes Alpaca, FINRA and Yahoo document or send.

/** Replaces `fetch` for one test. `answer(url)` returns a body, or a number for a refusal. Returns the requests made. */
function cannedFetch(t, answer) {
  const calls = [], real = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    const u = new URL(url), body = answer(u, init);
    calls.push({ url: u, headers: init.headers });
    return typeof body === "number" ? { ok: false, status: body } : { ok: true, status: 200, json: async () => body, text: async () => body };
  };
  t.after(() => { globalThis.fetch = real; });
  return calls;
}
/** Runs `fn` with the environment changed, then puts it back. `undefined` removes a variable. */
async function withEnv(vars, fn) {
  const old = Object.fromEntries(Object.keys(vars).map((k) => [k, process.env[k]]));
  const set = (all) => { for (const [k, v] of Object.entries(all)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } };
  set(vars);
  try { return await fn(); } finally { set(old); }
}
const KEY = { id: "PKTESTTESTTEST", secret: "secretsecretsecret" };
const NO_KEY = { CABINET_APP_PRIVATE_DIR: undefined, ALPACA_KEY_ID: undefined, ALPACA_SECRET_KEY: undefined };
const HAS_KEY = { CABINET_APP_PRIVATE_DIR: undefined, ALPACA_KEY_ID: KEY.id, ALPACA_SECRET_KEY: KEY.secret };

// Thursday 2026-11-19, 10:00 in New York (15:00 UTC). New York midnight is 05:00 UTC.
const TEN = Date.parse("2026-11-19T15:00:00Z") / 1000;
const bar = (t, c, v = 1000) => ({ t, o: c - 1, h: c + 1, l: c - 2, c, v, n: 10, vw: c });
const DAILY = [bar("2026-11-17T05:00:00Z", 148, 90e6), bar("2026-11-18T05:00:00Z", 150, 100e6), bar("2026-11-19T05:00:00Z", 151, 20e6)];
const FIVE_WHOLE = [bar("2026-11-19T13:00:00Z", 150.5), bar("2026-11-19T14:30:00Z", 151), bar("2026-11-19T14:35:00Z", 151.2), bar("2026-11-19T14:40:00Z", 151.1)];
const FIVE_LIVE = [bar("2026-11-19T14:40:00Z", 151.1, 30), bar("2026-11-19T14:45:00Z", 151.4, 30), bar("2026-11-19T14:55:00Z", 151.5, 30)];
const SNAPSHOT = { latestTrade: { t: "2026-11-19T14:59:30.5Z", p: 151.55, s: 100, x: "V" }, dailyBar: bar("2026-11-19T05:00:00Z", 151.5, 400000) };
const EARLY_SNAPSHOT = { latestTrade: { t: "2026-11-19T13:04:10Z", p: 150.6, s: 100, x: "V" } };
/** Alpaca's answers for NVDA, as its reference documents them. `open: false` is the same morning before the open. */
const alpacaAnswer = ({ open = true } = {}) => (u) => {
  if (u.pathname === "/v2/stocks/snapshots") return { NVDA: open ? SNAPSHOT : EARLY_SNAPSHOT };
  if (u.pathname === "/v2/stocks/bars") {
    const q = u.searchParams;
    const rows = q.get("timeframe") === "1Day" ? (open ? DAILY : DAILY.slice(0, 2)) : !open ? FIVE_WHOLE.slice(0, 1) : q.get("feed") === "iex" ? FIVE_LIVE : FIVE_WHOLE;
    return { bars: q.get("symbols").includes("NVDA") ? { NVDA: rows } : {}, next_page_token: null };
  }
  if (u.pathname.endsWith("/movers")) return { gainers: [{ symbol: "NVDA", price: 160, change: 10, percent_change: 6.67 }, { symbol: "PENNY", price: 0.4, change: 0.2, percent_change: 100 }], losers: [], market_type: "stocks", last_updated: "2026-11-19T15:00:00Z" };
  if (u.pathname.endsWith("/most-actives")) return { most_actives: [{ symbol: "NVDA", volume: 21e6, trade_count: 5 }], last_updated: "2026-11-19T15:00:00Z" };
  return 404;
};

test("a key is kept in the private folder, readable by its owner only, and can be removed", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "desk-keys-"));
  await withEnv({ ...HAS_KEY, CABINET_APP_PRIVATE_DIR: dir }, async () => {
    assert.equal(await alpacaKey(), null, "the private folder is the one place read when there is one");
    await saveAlpacaKey(KEY);
    assert.deepEqual(await alpacaKey(), KEY);
    assert.equal((await fs.stat(path.join(dir, "keys.json"))).mode & 0o777, 0o600);
    await saveAlpacaKey(null);
    assert.equal(await alpacaKey(), null);
  });
  await fs.rm(dir, { recursive: true });
});

test("run by hand, the key comes from the environment and cannot be saved", async () => {
  await withEnv(HAS_KEY, async () => {
    assert.deepEqual(await alpacaKey(), KEY);
    await assert.rejects(saveAlpacaKey(KEY));
  });
  await withEnv(NO_KEY, async () => assert.equal(await alpacaKey(), null));
});

test("Alpaca's day is read like Yahoo's: live price in the session, whole-market volume, split-adjusted", async (t) => {
  const calls = cannedFetch(t, alpacaAnswer());
  const { NVDA } = await alpaca.today(KEY, ["NVDA", "NOSUCH"], src.FRAMES["5m"], TEN);
  assert.equal(NVDA.meta.price, 151.55, "the newest trade");
  assert.equal(NVDA.meta.prev, 150, "yesterday's close");
  assert.equal(NVDA.meta.volume, 20e6, "from the whole-market daily candle, not the one exchange's");
  assert.deepEqual(NVDA.meta.regular, [Date.parse("2026-11-19T14:30:00Z") / 1000, Date.parse("2026-11-19T21:00:00Z") / 1000]);
  assert.deepEqual(NVDA.candles.map((c) => c.c), [150.5, 151, 151.2, 151.1, 151.4, 151.5], "live candles follow the whole-market ones, with no repeat");
  const barCalls = calls.filter((c) => c.url.pathname === "/v2/stocks/bars");
  assert.ok(barCalls.every((c) => c.url.searchParams.get("adjustment") === "split" && !c.url.searchParams.has("end")));
  assert.deepEqual(barCalls.map((c) => c.url.searchParams.get("feed")), ["sip", "sip", "iex"]);
  assert.ok(calls.every((c) => c.url.host === "data.alpaca.markets" && c.headers["APCA-API-KEY-ID"] === KEY.id && c.headers["APCA-API-SECRET-KEY"] === KEY.secret));
});

test("before the open the price is yesterday's close and the newest candle is the early trade", async (t) => {
  cannedFetch(t, alpacaAnswer({ open: false }));
  const early = Date.parse("2026-11-19T13:10:00Z") / 1000;
  const { NVDA } = await alpaca.today(KEY, ["NVDA"], src.FRAMES["5m"], early);
  assert.equal(NVDA.meta.price, 150);
  assert.equal(NVDA.meta.prev, 148);
  assert.equal(NVDA.meta.at, Date.parse("2026-11-18T21:00:00Z") / 1000, "yesterday's close");
  assert.deepEqual(NVDA.candles.map((c) => c.c), [150.5]);
});

test("with a key a stock's candles come from Alpaca, and a daily candle is stamped at the open", async (t) => {
  const calls = cannedFetch(t, alpacaAnswer());
  const res = await withEnv(HAS_KEY, () => src.candles("NVDA", "1d"));
  assert.equal(res.source, "Alpaca");
  assert.equal(res.candles[2].t, Date.parse("2026-11-19T14:30:00Z") / 1000);
  assert.equal(res.meta.price, 151);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.searchParams.get("timeframe"), "1Day");
});

test("an intraday chart leaves out the hours around the session unless asked", async (t) => {
  cannedFetch(t, alpacaAnswer());
  const closes = async (opts) => (await alpaca.chart(KEY, "NVDA", src.FRAMES["5m"], opts, TEN)).map((c) => c.c);
  assert.deepEqual(await closes({}), [151, 151.2, 151.1, 151.4, 151.5]);
  assert.equal((await closes({ prePost: true }))[0], 150.5);
});

const YAHOO_CHART = { chart: { result: [{ meta: { symbol: "NVDA", regularMarketPrice: 151 }, timestamp: [1795098600], indicators: { quote: [{ open: [150], high: [152], low: [149], close: [151], volume: [5] }] } }] } };

test("when Alpaca refuses, and for what it does not cover, the keyless source answers", async (t) => {
  const calls = cannedFetch(t, (u) => (u.host === "data.alpaca.markets" ? 403 : YAHOO_CHART));
  await withEnv(HAS_KEY, async () => {
    assert.equal((await src.candles("NVDA", "1d")).source, "Yahoo Finance");
    const before = calls.length;
    assert.equal((await src.candles("BTC-USD", "1d")).source, "Yahoo Finance");
    assert.ok(calls.slice(before).every((c) => c.url.host !== "data.alpaca.markets"), "crypto never goes to Alpaca");
    let failed = 0;
    const days = await src.todayAll(["NVDA", "ES=F"], () => failed++);
    assert.deepEqual(days.map((d) => d.source), ["Yahoo Finance", "Yahoo Finance"]);
    assert.equal(failed, 1, "the refresh is told that Alpaca did not answer");
  });
});

test("without a key nothing is asked of Alpaca", async (t) => {
  const calls = cannedFetch(t, (u) => (u.pathname.includes("screener") ? { finance: { result: [{ quotes: [{ symbol: "AMD", regularMarketPrice: 200, regularMarketVolume: 5 }] }] } } : YAHOO_CHART));
  await withEnv(NO_KEY, async () => {
    assert.equal((await src.candles("NVDA", "1d")).source, "Yahoo Finance");
    assert.equal((await src.todayAll(["NVDA"]))[0].source, "Yahoo Finance");
    assert.equal((await src.movers()).source, "Yahoo Finance");
  });
  assert.ok(calls.every((c) => c.url.host !== "data.alpaca.markets"));
});

test("Alpaca's movers are filled from daily candles, without penny stocks", async (t) => {
  cannedFetch(t, alpacaAnswer());
  const m = await withEnv(HAS_KEY, () => src.movers());
  assert.equal(m.source, "Alpaca");
  assert.deepEqual(m.gainers, [{ sym: "NVDA", name: "NVDA", price: 160, change: 6.67, volume: 20e6, avgVolume: 95e6 }]);
  assert.equal(m.active[0].volume, 21e6);
  assert.equal(Math.round(m.active[0].change * 100) / 100, 0.67, "151 against 150");
});

test("a key Alpaca refuses is told apart from Alpaca not answering", async (t) => {
  let status = 401;
  cannedFetch(t, () => status);
  assert.equal(await alpaca.accepts(KEY), false);
  status = 500;
  await assert.rejects(alpaca.accepts(KEY));
});

test("short interest comes from FINRA's newest report, and from Nasdaq when FINRA has none", async (t) => {
  let finra = [
    { settlementDate: "2026-10-15", symbolCode: "NVDA", currentShortPositionQuantity: 301622687, averageDailyVolumeQuantity: 103633729, daysToCoverQuantity: 2.91 },
    { settlementDate: "2026-10-30", symbolCode: "NVDA", currentShortPositionQuantity: 279579505, averageDailyVolumeQuantity: 99940095, daysToCoverQuantity: 2.8 },
  ];
  const nasdaq = { data: { shortInterestTable: { rows: [{ settlementDate: "10/30/2026", interest: "279,579,505", avgDailyShareVolume: "99,940,095", daysToCover: 2.797471 }] } } };
  cannedFetch(t, (u) => (u.host === "api.finra.org" ? finra : nasdaq));
  assert.deepEqual(await src.shortInterest("NVDA"), { asOf: "10/30/2026", shares: 279579505, avgVolume: 99940095, daysToCover: 2.8, source: "FINRA" });
  finra = [];
  assert.deepEqual(await src.shortInterest("NVDA"), { asOf: "10/30/2026", shares: 279579505, avgVolume: 99940095, daysToCover: 2.797471, source: "Nasdaq" });
});

test("a headline carries the site it leads to", async (t) => {
  cannedFetch(t, () => "<rss><channel><item><link>https://www.example.com/a?x=1</link><pubDate>Mon, 23 Nov 2026 09:55:35 +0000</pubDate><title>One &amp; two</title></item><item><link>javascript:alert(1)</link><title>Bad</title></item></channel></rss>");
  assert.deepEqual(await news("NVDA"), [{ title: "One & two", link: "https://www.example.com/a?x=1", site: "example.com", at: "2026-11-23T09:55:35.000Z" }]);
});

test("the server says whether a key is kept, never the key, and refuses what it cannot read", async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "desk-server-"));
  await fs.writeFile(path.join(dir, "keys.json"), JSON.stringify({ alpaca: KEY }));
  const child = spawn(process.execPath, [fileURLToPath(new URL("./server.mjs", import.meta.url))], { env: { ...process.env, CABINET_APP_PRIVATE_DIR: dir, CABINET_APP_TOKEN: "" }, stdio: ["ignore", "pipe", "inherit"] });
  t.after(async () => { child.kill(); await fs.rm(dir, { recursive: true }); });
  const base = await new Promise((ok) => child.stdout.on("data", (d) => { const m = /http:\S+/.exec(String(d)); if (m) ok(m[0]); }));
  const ask = async (init) => { const res = await fetch(`${base}/keys`, init); return { status: res.status, text: await res.text() }; };
  const kept = await ask();
  assert.deepEqual(JSON.parse(kept.text), { ok: true, alpaca: true });
  assert.ok(!kept.text.includes(KEY.secret) && !kept.text.includes(KEY.id));
  assert.equal((await ask({ method: "POST", body: "x".repeat(5000) })).status, 413);
  assert.equal((await ask({ method: "POST", body: "{" })).status, 400);
  assert.equal((await ask({ method: "POST", body: JSON.stringify({ alpaca: { id: "short" } }) })).status, 400);
  assert.deepEqual(JSON.parse((await ask({ method: "POST", body: JSON.stringify({ alpaca: null }) })).text), { ok: true, alpaca: false });
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(dir, "keys.json"), "utf8")), {});
});
