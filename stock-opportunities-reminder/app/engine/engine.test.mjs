// node --test app/engine/engine.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { sma, ema, rsi, atr, priorHigh, avgVolume, nyDay } from "./lib/indicators.mjs";
import { RULES, scanDaily, signalOf, facts, series, factsAt } from "./lib/signals.mjs";
import { usSession, symbolsOf } from "./refresh.mjs";
import { ruleRecord, recordKey } from "./lib/record.mjs";
import { readCalls, readDay, outcome, score, follow, heldBefore } from "./lib/calls.mjs";
import { lock } from "./lib/io.mjs";
import { regime, breadth } from "./lib/market.mjs";
import { SETUPS, detect, spoilers, broken } from "./lib/setups.mjs";
import { candidatesOf, setupRecord, fullDays } from "./lib/scan.mjs";
import { verdictOf, verdictFor } from "./lib/verdict.mjs";
import { UNIVERSE } from "./lib/universe.mjs";
import { toCron, fromCron, readSchedule, writeSchedule } from "./lib/schedule.mjs";
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

test("prior high and average volume leave today out", () => {
  const c = flat(25); c[24].h = 500; c[24].v = 9999;
  assert.equal(priorHigh(c, 24, 20), 101);
  assert.equal(avgVolume(c, 24, 20), 1000);
});

test("a close above the 20-day high on heavy volume is a breakout", () => {
  const c = flat(60); c[59] = { ...c[59], o: 100, h: 106, l: 100, c: 105, v: 3000 };
  const hits = scanDaily(c, RULES);
  const b = hits.find((h) => h.rule === "breakout");
  assert.ok(b, "breakout fires");
  assert.equal(b.side, "long");
  assert.equal(b.level, 101);
  assert.ok(hits.some((h) => h.rule === "volume"));
});

test("the same move on thin volume is not a breakout", () => {
  const c = flat(60); c[59] = { ...c[59], h: 106, c: 105, v: 1000 };
  assert.ok(!scanDaily(c, RULES).some((h) => h.rule === "breakout"));
});

test("a gap down leans short", () => {
  const c = flat(60); c[59] = { ...c[59], o: 94, h: 95, l: 93, c: 94 };
  assert.equal(scanDaily(c, RULES).find((h) => h.rule === "gap").side, "short");
});

test("facts name the trend from the averages", () => {
  const c = Array.from({ length: 260 }, (_, i) => ({ t: i * 86400, o: 100 + i, h: 101 + i, l: 99 + i, c: 100 + i, v: 1000 }));
  assert.equal(facts(c).trend, "up");
});

test("the rule list has no repeated ids", () => {
  assert.equal(new Set(RULES.map((r) => r.id)).size, RULES.length);
});

test("the US session opens at 9:30 and closes at 16:00 on the New York clock", () => {
  // In November New York is five hours behind UTC.
  assert.equal(usSession(new Date("2026-11-19T14:29:00Z")), "pre");
  assert.equal(usSession(new Date("2026-11-19T14:30:00Z")), "open");
  assert.equal(usSession(new Date("2026-11-19T20:59:00Z")), "open");
  assert.equal(usSession(new Date("2026-11-19T21:00:00Z")), "after");
  assert.equal(usSession(new Date("2026-11-21T15:00:00Z")), "closed");
});

test("a stock the Scout named is priced and charted even when it is off the list", () => {
  const { names } = symbolsOf({ watch: [{ sym: "AAPL", name: "Apple" }] }, [{ sym: "SOFI", name: "SoFi" }, { sym: "AAPL", name: "Apple Inc" }]);
  assert.equal(names.get("SOFI"), "SoFi");
  assert.equal(names.get("AAPL"), "Apple", "the person's own name for it wins");
});

// A flat chart with one breakout on day 40, then a steady climb of one point a day.
function breakoutThenClimb() {
  const c = flat(80);
  c[40] = { ...c[40], o: 100, h: 106, l: 100, c: 105, v: 3000 };
  for (let i = 41; i < 80; i++) c[i] = { ...c[i], o: 105 + (i - 41), h: 106 + (i - 41), l: 104 + (i - 41), c: 105 + (i - 40), v: 1000 };
  return c;
}

test("a rule's record follows the price after each day it fired", () => {
  const rec = ruleRecord({ TEST: breakoutThenClimb() }, RULES);
  const b = rec.rules.breakout;
  assert.equal(b.fired, 1);
  assert.equal(b.h[10].n, 1);
  assert.equal(b.h[10].won, 100);
  assert.equal(b.h[10].avg, 9.5, "105 to 115 is 9.5%");
  assert.equal(b.bySym.TEST.n, 1);
  assert.equal(rec.any[10].n, 80 - 30 - 10, "every day with ten days after it, past the warm-up");
});

test("a rule is judged against any day read the same way", () => {
  const b = ruleRecord({ TEST: breakoutThenClimb() }, RULES).rules.breakout.h[10];
  const any = ruleRecord({ TEST: breakoutThenClimb() }, RULES).any[10];
  assert.equal(b.anyWon, any.up, "a long-only rule is set beside the share of days that rose");
});

test("a rule too noisy to flag a chart with still has a record", () => {
  const rec = ruleRecord({ TEST: breakoutThenClimb() }, RULES.map((r) => (r.id === "breakout" ? { ...r, on: false } : r)));
  assert.equal(rec.rules.breakout.fired, 1);
});

test("the record is out of date when a rule's number or the list changes", () => {
  const k = recordKey(RULES, ["NVDA", "AAPL"]);
  assert.equal(recordKey(RULES, ["AAPL", "NVDA"]), k);
  assert.notEqual(recordKey(RULES.map((r) => (r.id === "gap" ? { ...r, percent: 2 } : r)), ["AAPL", "NVDA"]), k);
  assert.notEqual(recordKey(RULES, ["AAPL"]), k);
});

// Daily candles from Monday 2026-11-23, stamped at the New York open, as [open, high, low, close].
const days = (...rows) => rows.map(([o, h, l, c], i) => ({ t: Date.parse("2026-11-23T14:30:00Z") / 1000 + i * 86400, o, h, l, c, v: 1000 }));
const CALL = { id: "2026-11-23:AAPL", day: "2026-11-23", sym: "AAPL", name: "Apple", buy: [338, 344], stop: 332, target: 361 };

test("a call waits until the price comes into its zone, then is entered where it came in", () => {
  assert.equal(outcome(CALL, days([350, 352, 346, 351]), 351).state, "waiting");
  const fell = outcome(CALL, days([350, 352, 346, 351], [349, 350, 342, 347]), 347);
  assert.deepEqual([fell.state, fell.entry, fell.enteredOn], ["open", 344, "2026-11-24"], "it fell into the zone from above, so the entry is the top of it");
  assert.equal(fell.r, 0.25, "3 gained on 12 risked");
  assert.equal(outcome(CALL, days([340, 343, 339, 342]), 342).state, "in-zone", "entered, and the price is inside the zone now");
});

test("a call written once the session has opened is followed from the next session", () => {
  // Monday enters the zone, Tuesday stays above it. The open is 9:30 in New York, 14:30 UTC in November.
  const candles = days([340, 343, 339, 342], [350, 352, 346, 351]);
  const from = (at) => { const o = outcome({ ...CALL, at }, candles, 351); return [o.state, o.enteredOn]; };
  assert.deepEqual(from("2026-11-23T14:29:00Z"), ["open", "2026-11-23"], "written before the open, Monday's candle is its own");
  assert.deepEqual(from("2026-11-23T14:30:00Z"), ["waiting", null], "written at the open or later, Monday's moves came before it");
  assert.deepEqual(from("2026-11-23T22:00:00Z"), ["waiting", null], "after the close too");
  assert.deepEqual(from(null), ["open", "2026-11-23"], "with no time it is followed from its own day");
  assert.equal(outcome({ ...CALL, at: "2026-11-23T22:00:00Z" }, candles.slice(0, 1), 342).state, "waiting", "and it waits when no later session exists yet");
});

test("a call ends at its target, at its stop, or on its thirtieth trading day", () => {
  const won = outcome(CALL, days([340, 343, 339, 342], [345, 362, 344, 360]), 360);
  assert.deepEqual([won.state, won.r, won.closedOn], ["target", 2.63, "2026-11-24"], "340 to 361 on 8 risked");
  const lost = outcome(CALL, days([340, 343, 339, 342], [341, 362, 331, 340]), 340);
  assert.deepEqual([lost.state, lost.r], ["stopped", -1], "a day that touches both counts as the stop");
  const gap = outcome(CALL, days([340, 343, 339, 342], [328, 330, 326, 329]), 329);
  assert.equal(gap.r, -1.5, "it opened under the stop, so it lost more than planned");
  const quiet = (n) => Array.from({ length: n }, () => [342, 345, 340, 344]);
  const slow = outcome(CALL, days([340, 343, 339, 342], ...quiet(29)), 344);
  assert.deepEqual([slow.state, slow.r, slow.closedOn], ["timed-out", 0.5, "2026-12-22"], "closed on the thirtieth candle, the day of the entry being the first");
  assert.equal(outcome(CALL, days([340, 343, 339, 342], ...quiet(28)), 345).state, "open", "one day earlier it is still open");
});

test("on the day of the entry, a move made before the entry is not the exit", () => {
  const above = outcome(CALL, days([362, 363, 343, 345]), 345);
  assert.deepEqual([above.state, above.entry], ["open", 344], "it opened above the zone, so its high over the target came before it fell in");
  assert.equal(outcome(CALL, days([362, 363, 343, 345], [346, 362, 345, 361]), 361).state, "target", "the next day's high counts");
  const under = outcome(CALL, days([330, 340, 329, 339]), 339);
  assert.deepEqual([under.state, under.entry, under.r], ["stopped", 338, -1], "it opened under the stop and rose into the zone: the stop fills at the stop, not at an open that came before the entry");
  const through = outcome(CALL, days([336, 362, 335, 360]), 360);
  assert.deepEqual([through.state, through.r], ["target", 3.83], "it opened under the zone and rose through it, so the target came after the entry");
  assert.equal(outcome(CALL, days([340, 362, 339, 360]), 360).state, "target", "and so it did when it opened inside the zone");
});

test("a call that never reaches its zone expires, and one that falls under its stop first is dropped", () => {
  assert.equal(outcome(CALL, days(...Array.from({ length: 10 }, () => [350, 352, 346, 351])), 351).state, "expired");
  assert.equal(outcome(CALL, days(...Array.from({ length: 9 }, () => [350, 352, 346, 351])), 351).state, "waiting", "nine days is not ten");
  assert.equal(outcome(CALL, days([330, 331, 325, 326]), 326).state, "expired");
});

test("the scorecard counts finished calls only", () => {
  const s = score([{ state: "target", r: 2, day: "2026-11-02" }, { state: "stopped", r: -1, day: "2026-10-20" }, { state: "timed-out", r: 0.5, day: "2026-11-05" }, { state: "open", r: 3, day: "2026-11-20" }, { state: "expired", r: null, day: "2026-11-01" }]);
  assert.deepEqual(s, { closed: 3, won: 2, target: 1, avgR: 0.5, since: "2026-10-20", bySetup: {} });
  assert.deepEqual(score([]), { closed: 0, won: 0, target: 0, avgR: null, since: null, bySetup: {} });
});

test("only well-formed calls are read from the Scout's files, and examples are not calls", async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "calls-"));
  t.after(() => fs.rm(dir, { recursive: true }));
  const item = { sym: "aapl", name: "Apple", setup: "Pullback in an uptrend", conviction: 1, buy: [338, 344], stop: 332, target: 361 };
  const items = [item, { ...item, sym: "NVDA", stop: 340 }, { ...item, sym: "MU", buy: "soon" }, { ...item, sym: "../x" }, null, { ...item, sym: "TSLA", target: 344 }, item,
    { ...item, sym: "MSFT", stop: "332" }, { ...item, sym: "AMD", buy: ["338", 344] }, { ...item, sym: "META", buy: [338, 344, 350] }, { ...item, sym: "GOOGL", target: null }, { ...item, sym: "ABCDEFGHIJKLMNOP" }];
  await fs.writeFile(path.join(dir, "2026-11-23.json"), JSON.stringify({ items }));
  await fs.writeFile(path.join(dir, "EXAMPLE-2026-11-23.json"), JSON.stringify({ items: [item] }));
  await fs.writeFile(path.join(dir, "2026-11-22.json"), "not json");
  await fs.writeFile(path.join(dir, "2026-01-05.json"), JSON.stringify({ items: [item] }));
  const calls = await readCalls(dir, Date.parse("2026-11-24"));
  assert.deepEqual(calls, [{ id: "2026-11-23:AAPL", day: "2026-11-23", at: null, stance: null, sym: "AAPL", name: "Apple", setup: "Pullback in an uptrend", conviction: 1, buy: [338, 344], stop: 332, target: 361 }]);
  const stamped = async (at, stance) => {
    await fs.writeFile(path.join(dir, "2026-11-20.json"), JSON.stringify({ at, market: { stance }, items: [item] }));
    const file = await readDay(dir, "2026-11-20"), [call] = file.calls;
    assert.deepEqual([file.at, file.stance], [call.at, call.stance], "the file's own time and stance are on every call of it");
    return [call.at, call.stance];
  };
  assert.deepEqual(await stamped("2026-11-20T21:30:00Z", "mixed"), ["2026-11-20T21:30:00Z", "mixed"]);
  assert.deepEqual(await stamped("2026-11-21T21:30:00Z", "bullish"), [null, null], "a time on another day and a stance that is not one of the three are not trusted");
  assert.deepEqual(await stamped("this morning"), [null, null]);
  assert.deepEqual(await readCalls(path.join(dir, "missing")), []);
  const { dropped } = await readDay(dir, "2026-11-23");
  assert.deepEqual(dropped.map((x) => x.sym), ["NVDA", "MU", "../X", "?", "TSLA", "AAPL", "MSFT", "AMD", "META", "GOOGL", "ABCDEFGHIJKLMNOP"], "each dropped item is named");
  assert.match(dropped[0].why, /stop \(340\) is not a price under the buy zone/);
  assert.match(dropped[5].why, /listed twice/);
  assert.equal(dropped[6].why, 'The stop ("332") is not a price under the buy zone (338 to 344). A price in quotes is text: write the bare number.', "digits in quotes are not a number");
  assert.equal(dropped[7].why, "`buy` is not two prices, the lower first. A price in quotes is text: write the bare number.");
  assert.equal(dropped[8].why, "`buy` is not two prices, the lower first.", "three numbers are not a zone");
  assert.match(dropped[9].why, /target \(null\) is not a price above the buy zone/);
  assert.match(dropped[10].why, /no symbol the engine can read/);
  assert.equal(await readDay(dir, "2026-11-22"), null, "a file that is not JSON is no day at all");
});

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
test("short interest comes from FINRA's newest report, and from Nasdaq when FINRA has none", async (t) => {
  let finra = [
    { settlementDate: "2026-10-15", symbolCode: "NVDA", currentShortPositionQuantity: 301622687, averageDailyVolumeQuantity: 103633729, daysToCoverQuantity: 2.91 },
    { settlementDate: "2026-10-30", symbolCode: "NVDA", currentShortPositionQuantity: 279579505, averageDailyVolumeQuantity: 99940095, daysToCoverQuantity: 2.8 },
  ];
  const nasdaq = { data: { shortInterestTable: { rows: [{ settlementDate: "10/30/2026", interest: "279,579,505", avgDailyShareVolume: "99,940,095", daysToCover: 2.797471 }] } } };
  cannedFetch(t, (u) => (u.host === "api.finra.org" ? finra : nasdaq));
  const heard = [], note = (source, answered) => heard.push([source, answered]);
  assert.deepEqual(await src.shortInterest("NVDA", note), { asOf: "10/30/2026", shares: 279579505, avgVolume: 99940095, daysToCover: 2.8, source: "FINRA" });
  finra = [];
  assert.deepEqual(await src.shortInterest("NVDA", note), { asOf: "10/30/2026", shares: 279579505, avgVolume: 99940095, daysToCover: 2.797471, source: "Nasdaq" });
  assert.deepEqual(heard, [["FINRA", true], ["FINRA", true], ["Nasdaq", true]], "FINRA answered both times, the second time with no report");
});

test("a FINRA that fails is noted as failed, even when Nasdaq answers in its place", async (t) => {
  cannedFetch(t, (u) => (u.host === "api.finra.org" ? 503 : { data: { shortInterestTable: { rows: [{ settlementDate: "10/30/2026", interest: "1", avgDailyShareVolume: "1", daysToCover: 1 }] } } }));
  const heard = [];
  assert.equal((await src.shortInterest("NVDA", (source, answered) => heard.push([source, answered]))).source, "Nasdaq");
  assert.deepEqual(heard, [["FINRA", false], ["Nasdaq", true]]);
});

test("one rule says what a symbol is, for the server and for the Scout's files", () => {
  assert.deepEqual(["es=f", "BRK.B", "^VIX", "BTC-USD", "ABCDEFGHIJKLMNO"].map(src.cleanSym), ["ES=F", "BRK.B", "^VIX", "BTC-USD", "ABCDEFGHIJKLMNO"]);
  assert.deepEqual(["ABCDEFGHIJKLMNOP", "", "../x", "A B", null, 7].map(src.cleanSym), [null, null, null, null, null, null], "sixteen characters, a path, a space, and what is not text");
});

test("a headline carries the site it leads to", async (t) => {
  cannedFetch(t, () => "<rss><channel><item><link>https://www.example.com/a?x=1</link><pubDate>Mon, 23 Nov 2026 09:55:35 +0000</pubDate><title>One &amp; two</title></item><item><link>javascript:alert(1)</link><title>Bad</title></item></channel></rss>");
  assert.deepEqual(await news("NVDA"), [{ title: "One & two", link: "https://www.example.com/a?x=1", site: "example.com", at: "2026-11-23T09:55:35.000Z" }]);
});

test("a chosen frequency and time become the routine's schedule line, and read back the same", async (t) => {
  assert.equal(toCron({ days: "weekdays", time: "08:30" }), "30 8 * * 1-5");
  assert.equal(toCron({ days: "daily", time: "17:05" }), "5 17 * * *");
  assert.equal(toCron({ days: "1", time: "00:00" }), "0 0 * * 1");
  for (const bad of [{ days: "weekdays", time: "25:00" }, { days: "often", time: "08:30" }, { days: "weekdays" }, { days: "toString", time: "08:30" }, undefined]) assert.equal(toCron(bad), null);
  assert.deepEqual(fromCron("30 8 * * 1-5"), { days: "weekdays", time: "08:30" });
  assert.deepEqual(fromCron("0 9 * * 6"), { days: "6", time: "09:00" });
  assert.equal(fromCron("*/15 9-16 * * 1-5"), null, "a schedule typed elsewhere is left alone");
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "schedule-"));
  t.after(() => fs.rm(dir, { recursive: true }));
  const file = path.join(dir, "find-opportunities.yaml");
  await fs.writeFile(file, "id: find-opportunities\nschedule: 30 8 * * 1-5\nprompt: |-\n  schedule: not this line\n");
  await writeSchedule({ days: "daily", time: "16:45" }, file);
  assert.equal(await fs.readFile(file, "utf8"), "id: find-opportunities\nschedule: 45 16 * * *\nprompt: |-\n  schedule: not this line\n");
  const now = await readSchedule(file);
  assert.deepEqual([now.days, now.time, typeof now.zone], ["daily", "16:45", "string"]);
  await assert.rejects(writeSchedule({ days: "daily", time: "soon" }, file));
});

test("the schedule line is the one that starts a line, read through its comment, and the rest of the file is kept byte for byte", async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "schedule-"));
  t.after(() => fs.rm(dir, { recursive: true }));
  const file = path.join(dir, "find-opportunities.yaml");
  const around = (line) => `id: find-opportunities\n# the old schedule: 0 0 * * 0\n  schedule: 5 5 * * 5\n${line}\nprompt: |-\n  text\n`;
  await fs.writeFile(file, around("schedule: 30 8 * * 1-5   # weekday mornings"));
  let now = await readSchedule(file);
  assert.deepEqual([now.days, now.time, now.custom], ["weekdays", "08:30", undefined], "not the line in the comment above it, nor the indented one, and not custom because of its own comment");
  await writeSchedule({ days: "daily", time: "16:45" }, file);
  assert.equal(await fs.readFile(file, "utf8"), around("schedule: 45 16 * * *   # weekday mornings"));
  await fs.writeFile(file, around(`schedule:  "0 9 * * 6" # Saturdays`));
  now = await readSchedule(file);
  assert.deepEqual([now.days, now.time], ["6", "09:00"], "quotes are read through");
  await writeSchedule({ days: "weekdays", time: "08:30" }, file);
  assert.equal(await fs.readFile(file, "utf8"), around(`schedule:  "30 8 * * 1-5" # Saturdays`), "and kept");
});

// --- The market, the setups and the checks ---

// A chart from rows of [close] (a two-point candle around it) or [open, high, low, close, volume], one a day.
const chart = (rows) => rows.map((r, i) => {
  const [o, h, l, c, v = 1000] = r.length === 1 ? [r[0], r[0] + 1, r[0] - 1, r[0]] : r;
  return { t: Date.parse("2025-01-06T14:30:00Z") / 1000 + i * 86400, o, h, l, c, v };
});
const still = (n, price = 100) => Array.from({ length: n }, () => [price]);
const climb = (n, from, step) => Array.from({ length: n }, (_, i) => [from + i * step]);
/** What the detectors find on the newest candle of `candles`. */
function found(candles, { fund, stance = "with-you", reports = null } = {}) {
  const s = series(candles, fund), i = candles.length - 1;
  return detect(s, i, factsAt(s, i), { stance, reports, day: s.days[i] });
}
const names = (list) => list.map((x) => x.setup);

test("strength against the market is the stock's return less the fund's over the same days", () => {
  const stock = chart(Array.from({ length: 130 }, (_, i) => [i < 109 ? 100 : 110])), fund = chart(Array.from({ length: 130 }, (_, i) => [i < 120 ? 200 : 190]));
  const f = facts(stock, fund);
  assert.deepEqual(f.rs, { m1: 15, m3: 15, m6: 15 }, "up 10% while the fund fell 5%");
  assert.deepEqual(f.ten, { stock: 0, market: -5 });
  assert.equal(facts(stock).rs, null, "no fund, no comparison");
  const short = facts(stock.slice(0, 30), fund.slice(0, 30));
  assert.deepEqual([short.rs.m1, short.rs.m3, short.rs.m6], [0, null, null], "null until there is that much history");
  assert.equal(facts(stock.slice(0, 8), fund.slice(0, 8)).ten, null);
});

test("the market's stance is counted from the fund and the fear gauge", () => {
  const up = series(chart(climb(260, 100, 1))), last = 259;
  assert.equal(regime(up, last, 15).stance, "with-you");
  assert.equal(regime(up, last, 22).stance, "mixed", "an uptrend with the fear gauge at 20 or more");
  assert.equal(regime(up, last, 26).stance, "against-you", "the fear gauge over 25");
  // The stance turns on 20 and 25, the word for the fear gauge on 18 and 25.
  const at = (vix) => { const r = regime(up, last, vix); return [r.stance, r.fear.read]; };
  assert.deepEqual([17.9, 18, 19.9, 20, 25, 25.1].map(at), [["with-you", "calm"], ["with-you", "uneasy"], ["with-you", "uneasy"], ["mixed", "uneasy"], ["mixed", "uneasy"], ["against-you", "frightened"]]);
  assert.equal(regime(up, last, null).stance, "with-you", "with no fear gauge the fund alone decides");
  const under = series(chart([...climb(250, 100, 1), ...still(10, 200)]));
  const r = regime(under, last, 15);
  assert.equal(r.stance, "against-you", "the fund under its 200-day average");
  assert.match(r.because[0], /closed at 200, under its 200-day average of 2\d\d/);
  assert.equal(r.fear.read, "calm");
  // An uptrend, then one day down two and a half usual daily moves (1.39% against 0.56%) on three times the volume.
  const rows = climb(260, 100, 1);
  rows.push([359, 360, 353, 354, 3000]);
  const fell = regime(series(chart(rows)), 260, 15);
  assert.deepEqual([fell.stance, fell.fund.hardFall, fell.fund.change, fell.fund.usualMove], ["against-you", true, -1.39, 0.56]);
  rows[260][4] = 1000;
  assert.equal(regime(series(chart(rows)), 260, 15).stance, "with-you", "the same fall on usual volume is not a hard fall");
  rows[260] = [359, 360, 354, 355, 3000];
  assert.equal(regime(series(chart(rows)), 260, 15).stance, "with-you", "a fall of just under twice the usual daily move is not one either");
});

test("breadth is the share of listed stocks above their averages", () => {
  const list = [{ close: 10, sma50: 9, sma200: 11 }, { close: 10, sma50: 11, sma200: 11 }, { close: 10, sma50: 9, sma200: null }];
  assert.deepEqual(breadth(list), { stocks: 3, above50: 67, above200: 0 });
  assert.equal(regime(series(chart(climb(260, 100, 1))), 259, 15, breadth(list)).because.at(-1), "67% of the 3 listed stocks closed above their 50-day average: broad strength.");
});

// A zigzag climb to a high, then five quieter days back to the 20-day average. `zig` is
// how far every other day of the climb steps back (none makes the RSI higher), `dip` how
// far the third day of the fall dips under its own low.
function pullbackChart(volume = 500, { zig = 1, dip = 0 } = {}) {
  const rise = Array.from({ length: 225 }, (_, i) => [100 + i * 0.5 + (i % 2 ? zig : 0)]), top = rise.at(-1)[0] + 5;
  return chart([...rise, [top - 2, top + 1, top - 3, top, 2000], ...[1.5, 3, 4, 5, 5.5].map((d, k) => [top - d + 0.5, top - d + 1, top - d - 1 - (k === 2 ? dip : 0), top - d, volume])]);
}

test("a pullback in an uptrend rests on an average on lighter volume", () => {
  const [c] = found(pullbackChart());
  assert.equal(c.setup, "Pullback in an uptrend");
  assert.match(c.notes[0], /resting on its 20-day average/);
  assert.deepEqual([c.buy, c.stop, c.target], [[210, 212], 208, 218], "the stop one and a half usual daily moves (2.41) under the zone, aiming for the high it fell from");
  assert.deepEqual(c.spoilers.map((x) => x.rule), ["pay"], "6 to gain on 4 risked is no call");
  assert.deepEqual(names(found(pullbackChart(1500))), [], "not when the fall is on heavier volume than the rise");
  assert.deepEqual(names(found(pullbackChart().slice(0, -4))), [], "not while it is still far above its average");
  assert.deepEqual(names(found(pullbackChart(500, { zig: 0 }))), [], "not with an RSI over 60 (here 63.3): that is a stock still running, not one resting");
  assert.deepEqual(names(found(pullbackChart(500, { dip: 4 }))), ["Pullback in an uptrend"], "a dip of one and a half usual daily moves under the average is still a rest");
  assert.deepEqual(names(found(pullbackChart(500, { dip: 6 }))), [], "a deeper one is more than a rest");
});

test("a breakout from a base needs a tight range and a heavy close above it", () => {
  const [c] = found(chart([...still(230), [100, 106, 100, 105, 3000]]));
  assert.deepEqual([c.setup, c.buy, c.stop, c.target], ["Breakout from a base", [101, 102], 98.5, 113], "from the top of the range, the stop one and a half usual daily moves (2.29) under the zone, aiming three times that above it");
  assert.deepEqual(c.spoilers, []);
  assert.match(c.notes.at(-1), /has to come back to the zone/);
  assert.deepEqual(names(found(chart([...still(230), [100, 106, 100, 105, 1000]]))), [], "not on usual volume");
  const wide = Array.from({ length: 230 }, (_, i) => [i % 2 ? 92 : 108]);
  assert.deepEqual(names(found(chart([...wide, [93, 114, 93, 113, 3000]]))), [], "not from a range wider than 15%");
  const after = (high) => names(found(chart([...still(150, high), ...still(80), [100, 106, 100, 105, 3000]]))).includes("Breakout from a base");
  assert.deepEqual([after(112), after(130)], [true, false], "7% under its 52-week high it is one, 20% under it is not");
});

test("a leader holds up while the market falls, and only when the market is not with you", () => {
  const rise = climb(220, 100, 0.2), top = rise.at(-1)[0];
  const stock = chart([...rise, ...still(11, top)]), fund = chart([...rise, ...Array.from({ length: 11 }, (_, i) => [top - i])]);
  const [c] = found(stock, { fund, stance: "mixed" });
  assert.deepEqual([c.setup, c.buy, c.stop], ["A leader holding up in a weak market", [143, 144], 141], "the stop one and a half usual daily moves (2) under the zone");
  assert.match(c.notes[0], /moved 0% while the S&P 500 fund moved -7%/);
  assert.deepEqual(names(found(stock, { fund, stance: "with-you" })), []);
  assert.deepEqual(names(found(fund, { fund, stance: "mixed" })), [], "a stock that fell with the market is no leader");
  assert.deepEqual(names(found(stock, { fund: stock, stance: "mixed" })), [], "nor is one in a market that did not fall");
  // It fell 12 a month ago and has stood still since, under its 50-day average, while the fund fell 7% in ten days.
  const start = climb(200, 100, 0.2), high = start.at(-1)[0];
  const sunk = chart([...start, ...still(31, high - 12)]), falling = chart([...start, ...still(20, high), ...Array.from({ length: 11 }, (_, i) => [high - i])]);
  assert.deepEqual(names(found(sunk, { fund: falling, stance: "mixed" })), [], "nor one that held up for ten days but is under its 50-day average");
});

test("a gap on results counts while it holds, and only on a report when the calendar is known", () => {
  const gap = chart([...still(230), [106, 110, 105, 109, 3000], [109, 111, 107, 108, 1200]]);
  const [c] = found(gap);
  assert.deepEqual([c.setup, c.stop <= 105], ["A gap up on results that holds", true]);
  assert.match(c.notes[1], /confirm the gap was on results/);
  const gapDay = series(gap).days[230];
  assert.equal(found(gap, { reports: [gapDay] })[0].notes[1], "The calendar has its earnings report on that gap.");
  assert.deepEqual(names(found(gap, { reports: [] })), [], "the calendar is known and has no report there");
  assert.deepEqual(names(found(chart([...still(230), [106, 110, 105, 109, 3000], [109, 109, 103, 104, 1200]]))), [], "not after a close under the low of the gap day");
  assert.deepEqual(names(found(chart([...still(230), [106, 110, 105, 109, 1500]]))), ["Breakout from a base"], "not on less than twice its usual volume");
  const held = (daysSince) => names(found(chart([...still(230), [106, 110, 105, 109, 3000], ...Array.from({ length: daysSince }, () => [109, 111, 107, 108, 1200])])));
  assert.deepEqual([held(4), held(5)], [["A gap up on results that holds"], []], "the gap day is one of the last five: four days later it counts, five days later it does not");
});

test("a turn after a washout needs the strong day, not just a low RSI", () => {
  const fall = climb(230, 300, -0.5), low = fall.at(-1)[0];
  const [c] = found(chart([...fall, [low - 1, low + 3, low - 2, low + 2.5, 2000]]));
  assert.deepEqual([c.setup, c.buy, c.stop, c.target], ["A turn after a washout", [186, 188], 184, 196], "the stop one and a half usual daily moves (2.21) under the zone, aiming twice that above it");
  assert.deepEqual(names(found(chart([...fall, [low - 1, low + 3, low - 2, low + 2.5, 1000]]))), [], "not on usual volume");
  assert.deepEqual(names(found(chart(fall))), [], "oversold alone is no setup");
  // A gentler fall, whose RSI went no lower than 31.7.
  const mild = Array.from({ length: 230 }, (_, i) => [300 - i * 0.2 + (i % 2 ? 0.6 : 0)]), end = mild.at(-1)[0];
  assert.deepEqual(names(found(chart([...mild, [end - 1, end + 3, end - 2, end + 2.5, 2000]]))), [], "the same strong day after an RSI that never went under 30 is no turn");
});

test("a candidate's numbers follow step 4: a zone within one usual daily move, a stop with room, typed prices", () => {
  for (const candles of [pullbackChart(), chart([...still(230), [100, 106, 100, 105, 3000]]), chart([...still(230), [106, 110, 105, 109, 3000], [109, 111, 107, 108, 1200]])]) {
    const [c] = found(candles), usual = facts(candles).atr;
    assert.ok(c.buy[1] - c.buy[0] <= usual && c.buy[1] - c.stop >= usual && c.stop < c.buy[0] && c.target > c.buy[1], c.setup);
    for (const p of [...c.buy, c.stop, c.target]) assert.equal(p, p < 100 ? Math.round(p * 10) / 10 : Math.round(p), "one decimal under 100 dollars, whole dollars above");
  }
});

test("the reasons to pass that arithmetic can decide", () => {
  const f = { close: 100, ema20: 99, sma200: 80, atr: 2 }, day = "2026-11-23";
  const good = { setup: SETUPS[0], buy: [99, 100], stop: 97, target: 107 };
  const rules = (c, about = {}) => spoilers(c, { facts: f, recentHigh: 90, reports: [], day, ...about }).map((x) => x.rule);
  assert.deepEqual(rules(good), []);
  assert.deepEqual(rules({ ...good, target: 105 }), ["pay"], "5 over 3 is under 2 to 1");
  assert.deepEqual(rules({ ...good, stop: 90, target: 121 }), ["far"], "9% under the zone");
  assert.deepEqual(rules(good, { facts: { ...f, close: 104 } }), ["stretched"], "more than two usual daily moves above the 20-day average");
  assert.deepEqual(rules(good, { recentHigh: 102 }), ["ceiling"], "a high 2 above the zone, with the stop 3 under it");
  assert.deepEqual(rules(good, { facts: { ...f, sma200: 104 } }), [], "a ceiling farther than the stop is no reason to pass");
  assert.deepEqual(rules(good, { reports: ["2026-11-30"] }), ["earnings"], "five trading days ahead");
  assert.deepEqual(rules(good, { reports: ["2026-12-01"] }), [], "six is outside");
  assert.deepEqual(rules(good, { reports: [day] }), ["earnings"]);
  assert.deepEqual(rules({ ...good, setup: SETUPS[3] }, { reports: [day] }), [], "a gap on results is built on the report that just traded");
  const text = broken({ ...good, stop: 99.5, buy: [97, 100] }, { atr: 2, reports: null, day }).map((x) => x.rule);
  assert.deepEqual(text, ["room", "zone"], "a stop half a point under the top, and a zone three points wide");
  // A tenth of slack on both, with a usual daily move of 2: room from 1.8, a zone up to 2.2.
  const levels = (low, stop) => broken({ ...good, buy: [low, 100], stop, target: 120 }, { atr: 2, reports: null, day }).map((x) => x.rule);
  assert.deepEqual([levels(99, 98.15), levels(99, 98.25)], [[], ["room"]], "a stop 1.85 under the top has room, one 1.75 under it does not");
  assert.deepEqual([levels(97.85, 95), levels(97.75, 95)], [[], ["zone"]], "a zone 2.15 wide passes, one 2.25 wide does not");
});

// A seeded walk, so the test reads the same chart every run.
function walk(n, seed) {
  let x = seed, price = 100;
  const next = () => ((x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296);
  return chart(Array.from({ length: n }, () => { const o = price, c = price = Math.max(5, price * (1 + (next() - 0.48) * 0.06)); return [o, Math.max(o, c) * (1 + next() * 0.02), Math.min(o, c) * (1 - next() * 0.02), c, 500 + next() * 3000]; }));
}

test("a detector on one day sees nothing after it", () => {
  const candles = walk(420, 7), fund = walk(420, 11), whole = series(candles, fund);
  let hits = 0;
  for (let i = 200; i < 420; i += 3) {
    const cut = series(candles.slice(0, i + 1), fund.slice(0, i + 1)), about = { stance: "mixed", reports: null, day: whole.days[i] };
    const now = detect(whole, i, factsAt(whole, i), about);
    assert.deepEqual(now, detect(cut, i, factsAt(cut, i), about), `day ${i}`);
    hits += now.length;
  }
  assert.ok(hits > 0, "the walk fits a setup on some day, or this proves nothing");
});

test("the replay follows each candidate through the days after it, one call at a time", () => {
  // A breakout on day 230 that comes back to its zone, then climbs through its target.
  const after = [[104, 105, 101, 102], ...climb(45, 103, 1)];
  const candles = chart([...still(230), [100, 106, 100, 105, 3000], ...after]), fund = chart(still(candles.length, 100));
  // A gap on day 230 that holds, far above its 20-day average.
  const gap = chart([...still(230), [106, 110, 105, 109, 3000], [109, 111, 107, 108, 1200], ...climb(45, 109, 1)]);
  const rec = setupRecord({ TEST: candles, GAP: gap }, fund, null);
  const b = rec.setups["Breakout from a base"], g = rec.setups["A gap up on results that holds"];
  assert.deepEqual([b.candidates, b.entered, b.target, b.avgR], [1, 1, 1, 3.14], "entered at 102 with the stop at 98.5, it reached 113");
  assert.deepEqual([g.candidates, g.spoiled.candidates > 0, g.spoiled.why.stretched > 0], [0, true, true], "a reason to pass makes it no call, and it is followed apart");
  assert.deepEqual([b.verdict, b.byStance.mixed.verdict, "verdict" in rec.any], ["unproven", "unproven", false], "one finished call proves nothing, and the yardstick is not judged");
  assert.equal(rec.stanceFrom, "fund only");
  assert.deepEqual([rec.symbols, rec.from < rec.to], [["TEST", "GAP"], true]);
  assert.ok(rec.any.candidates > 1 && rec.any.candidates < candles.length - 200, "the yardstick opens a new call only when the last one is finished");
  assert.equal(rec.any.byStance.mixed.candidates + rec.any.byStance["with-you"].candidates + rec.any.byStance["against-you"].candidates, rec.any.candidates);
  // The same chart cut off on the breakout day: found, with nothing after it to follow.
  const early = setupRecord({ TEST: candles.slice(0, 231) }, fund, null).setups["Breakout from a base"];
  assert.deepEqual([early.candidates, early.entered, early.closed], [1, 0, 0]);
});

/** A record as setups.json holds it, with only what a verdict is read from. `stances` are the slices that say something. */
const recordOf = (overall, stances = {}) => ({
  setups: Object.fromEntries(SETUPS.map((name) => [name, { closed: 78, avgR: 0, verdict: overall[name] || "unproven", byStance: { "with-you": { verdict: "unproven" }, mixed: { verdict: "unproven" }, "against-you": { verdict: "unproven" }, ...stances[name] } }])),
  any: { avgR: 0.01, byStance: { "with-you": { avgR: 0.03 }, mixed: { avgR: -0.1 }, "against-you": { avgR: 0.06 } } },
});

test("a record pays or fails only beside the yardstick, and only with enough finished calls", () => {
  const says = (closed, avgR, any) => verdictOf({ closed, avgR }, { avgR: any });
  assert.deepEqual([says(29, 1, 0), says(30, 1, 0), says(30, -0.01, 0), says(30, 0, 0)], ["unproven", "pays", "fails", "unproven"]);
  assert.deepEqual([says(30, 0.05, 0), says(30, 0.06, 0), says(30, 0.11, 0.06), says(30, -0.2, -0.3)], ["unproven", "pays", "unproven", "pays"], "the edge is more than 0.05 over the yardstick, wherever the yardstick stands");
  assert.equal(says(30, 1, null), "unproven", "no yardstick, no verdict");
  const record = recordOf({ [SETUPS[0]]: "pays" }, { [SETUPS[0]]: { mixed: { closed: 49, avgR: -0.29, verdict: "fails" } } });
  assert.deepEqual(verdictFor(record, SETUPS[0], "mixed"), { verdict: "fails", verdictFrom: "stance", closed: 49, avgR: -0.29, anyAvgR: -0.1 });
  assert.deepEqual(verdictFor(record, SETUPS[0], "with-you"), { verdict: "pays", verdictFrom: "overall", closed: 78, avgR: 0, anyAvgR: 0.01 }, "an unproven stance falls back to the setup overall");
  assert.equal(verdictFor(record, SETUPS[0], null).verdictFrom, "overall");
  assert.equal(verdictFor(record, "Momentum", "mixed"), null);
  for (const name of ["constructor", "toString", "__proto__", "hasOwnProperty"]) assert.equal(verdictFor(record, name, "mixed"), null, `"${name}" is on every object and is no setup`);
});

test("today's candidates leave out cheap, thin and held stocks, count a stock once, and put the clean ones first", () => {
  const breakout = [...still(230), [100, 106, 100, 105, 3000]], fund = chart(still(231));
  const big = (rows) => chart(rows).map((c) => ({ ...c, v: c.v * 1000 }));
  const pool = [
    { sym: "THIN", name: "Thin", from: "list", candles: chart(breakout) },
    { sym: "HELD", name: "Held", from: "list", candles: big(breakout) },
    { sym: "PENNY", name: "Penny", from: "movers", candles: big(breakout).map((c) => ({ ...c, o: c.o / 25, h: c.h / 25, l: c.l / 25, c: c.c / 25 })) },
    { sym: "GOOD", name: "Good", from: "movers", candles: big(breakout) },
    { sym: "GOOD", name: "Good", from: "universe", candles: big(breakout) },
  ];
  const about = { fund, stance: "with-you", reports: null, day: "2025-08-25", skip: [] };
  const items = candidatesOf(pool, { ...about, skip: ["HELD"], record: recordOf({}) });
  assert.deepEqual(items.map((x) => [x.sym, x.from, x.setup, x.verdict, x.verdictFrom]), [["GOOD", "movers", "Breakout from a base", "unproven", "overall"]]);
  assert.equal(items[0].facts.close, 105);
  // A spoiled pullback whose setup pays, a clean breakout whose setup fails, a clean turn whose setup pays with the market as it is.
  const fall = climb(230, 300, -0.5), low = fall.at(-1)[0];
  const three = [{ sym: "REST", name: "Rest", from: "list", candles: big(pullbackChart().map(({ o, h, l, c, v }) => [o, h, l, c, v])) }, pool[3], { sym: "TURN", name: "Turn", from: "universe", candles: big([...fall, [low - 1, low + 3, low - 2, low + 2.5, 2000]]) }];
  const sorted = candidatesOf(three, { ...about, record: recordOf({ [SETUPS[0]]: "pays", [SETUPS[1]]: "fails" }, { [SETUPS[4]]: { "with-you": { verdict: "pays" } } }) });
  assert.deepEqual(sorted.map((x) => [x.sym, x.spoilers.length > 0, x.verdict, x.verdictFrom, x.pay]), [["TURN", false, "pays", "stance", 2], ["GOOD", false, "fails", "overall", 3.14], ["REST", true, "pays", "overall", 1.5]], "no reason to pass first, then the better verdict, before the better pay");
});

test("the wider list names no stock twice", () => {
  assert.equal(UNIVERSE.length, new Set(UNIVERSE).size);
});

test("a stock is kept out of the candidates only while a call of an earlier day holds it", () => {
  const rows = [{ sym: "OLD", day: "2026-11-20", closedOn: null }, { sym: "TODAY", day: "2026-11-23", closedOn: null }, { sym: "DONE", day: "2026-11-19", closedOn: "2026-11-20" }];
  assert.deepEqual(heldBefore(rows, "2026-11-23"), ["OLD"], "today's own call stays a candidate, so the day's file can be checked and written again");
});

test("a chart's newest candle is a full day only when it was fetched after that day's close", () => {
  // Monday 2026-11-23 and Tuesday 2026-11-24. The session closes at 21:00 UTC in November.
  const two = days([340, 343, 339, 342], [350, 352, 346, 351]);
  const last = (...about) => nyDay(fullDays(two, ...about).at(-1).t);
  assert.equal(last("2026-11-24T15:10:00Z"), "2026-11-23", "fetched 40 minutes into Tuesday's session, Tuesday is part of a day");
  assert.equal(last("2026-11-24T20:59:00Z"), "2026-11-23");
  assert.equal(last("2026-11-24T21:00:00Z"), "2026-11-24", "fetched at the close, it is whole");
  assert.equal(last("2026-11-25T13:00:00Z"), "2026-11-24", "and so it is the next morning");
  assert.equal(last("2026-11-25T13:00:00Z", "2026-11-23"), "2026-11-23", "nothing newer than the fund's last full day is judged");
  assert.deepEqual(fullDays(two.slice(0, 1), "2026-11-23T15:00:00Z"), [], "a chart with only today so far has no full day");
});

test("a signal's id carries the day of its candle, so it is the same on whatever day it is read", () => {
  const hit = { rule: "gap", side: "long", text: "Opened 5% above yesterday's close of 100." };
  const friday = signalOf("TSLA", "Tesla", hit, "2026-11-20", 105, "2026-11-20T21:05:00Z"), monday = signalOf("TSLA", "Tesla", hit, "2026-11-20", 105, "2026-11-23T13:00:00Z");
  assert.deepEqual([friday.id, monday.id, friday.day, friday.level, friday.kind], ["TSLA:gap:2026-11-20", "TSLA:gap:2026-11-20", "2026-11-20", null, "chart"]);
});

test("one process holds the refresh lock, and a lock left behind is taken over", async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "lock-"));
  t.after(() => fs.rm(dir, { recursive: true }));
  const file = path.join(dir, "data", "refresh.lock");
  const release = await lock(file);
  assert.equal(JSON.parse(await fs.readFile(file, "utf8")).pid, process.pid);
  assert.equal(await lock(file), null, "a fresh lock of a live process is not taken");
  await release();
  // Left by a process that has ended.
  await fs.writeFile(file, JSON.stringify({ pid: spawnSync(process.execPath, ["-e", ""]).pid, at: new Date().toISOString() }));
  await (await lock(file))();
  // Held by a live process, but for six minutes: a refresh never runs that long.
  await fs.writeFile(file, JSON.stringify({ pid: process.pid, at: new Date().toISOString() }));
  await fs.utimes(file, new Date(Date.now() - 6 * 60000), new Date(Date.now() - 6 * 60000));
  await (await lock(file))();
  await assert.rejects(fs.access(file), "giving the lock back removes the file");
});

test("a plain refresh gives way to one that is running in another process", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "busy-"));
  t.after(() => fs.rm(root, { recursive: true }));
  const release = await lock(path.join(root, "app", "data", "refresh.lock"));
  const r = spawnSync(process.execPath, [fileURLToPath(new URL("./refresh.mjs", import.meta.url))], { env: { ...process.env, CABINET_APP_DIR: path.join(root, "app") }, encoding: "utf8" });
  assert.deepEqual([r.status, r.stdout], [0, "Another refresh is running. Nothing done.\n"]);
  assert.deepEqual(await fs.readdir(path.join(root, "app", "data")), ["refresh.lock"], "it wrote nothing and left the other's lock alone");
  await release();
});

// Thirty flat days around 340 before Monday 2026-11-23, with a usual daily move of 6.
const before = (n = 30) => Array.from({ length: n }, (_, i) => ({ t: Date.parse("2026-11-23T14:30:00Z") / 1000 - (n - i) * 86400, o: 340, h: 343, l: 337, c: 340, v: 1000 }));

test("a call that breaks a hard rule is still followed, and the problems say why", () => {
  const call = (sym, more) => ({ id: `2026-11-23:${sym}`, day: "2026-11-23", sym, name: sym, setup: "Pullback in an uptrend", buy: [338, 344], stop: 332, target: 370, ...more });
  const daily = Object.fromEntries(["GOOD", "NEAR", "WIDE", "POOR", "FAR", "SOON", "ODD", "TWICE"].map((s) => [s, [...before(), ...days([340, 343, 339, 342])]]));
  const calls = [
    { ...call("TWICE"), id: "2026-11-20:TWICE", day: "2026-11-20" },
    call("GOOD"), call("NEAR", { buy: [342, 344], stop: 340 }), call("WIDE", { buy: [334, 344] }), call("POOR", { target: 361 }),
    call("FAR", { stop: 300, target: 440 }), call("SOON"), call("ODD", { setup: "Momentum" }), call("TWICE"),
  ];
  const out = follow(calls, daily, { reports: { SOON: ["2026-11-25"] } });
  assert.equal(out.calls.length, 9, "every one of them is followed");
  const why = Object.fromEntries(out.problems.map((p) => [p.id.split(":")[1], p.why]));
  assert.deepEqual(Object.keys(why).sort(), ["FAR", "NEAR", "ODD", "POOR", "SOON", "TWICE", "WIDE"]);
  assert.match(why.NEAR[0], /The stop is 4 under the top of the buy zone, nearer than one usual daily move \(6\)/);
  assert.match(why.WIDE[0], /The buy zone is 10 wide/);
  assert.match(why.POOR[0], /pays 1.42 to 1, under 2 to 1/);
  assert.match(why.FAR[0], /11.2% under the buy zone/);
  assert.match(why.SOON[0], /trades on 2026-11-25, 2 trading days after 2026-11-23/);
  assert.match(why.ODD[0], /"Momentum", which is not one of the five/);
  assert.match(why.TWICE[0], /The call of 2026-11-20 on TWICE was still open on 2026-11-23/);
  assert.deepEqual(out.score.bySetup["Pullback in an uptrend"], { closed: 1, won: 0, target: 0, avgR: -1 }, "the stop with no room was hit by an ordinary day");
});

test("a call of a setup whose record fails is a problem, judged by the harsher of the Scout's stance and the engine's", () => {
  const call = (sym, stance) => ({ id: `2026-11-23:${sym}`, day: "2026-11-23", at: null, stance, sym, name: sym, setup: SETUPS[0], buy: [338, 344], stop: 332, target: 370 });
  const calls = [call("MIXED", "mixed"), call("WITH", "with-you"), call("NONE", null)], daily = Object.fromEntries(["MIXED", "WITH", "NONE", "AGAINST"].map((s) => [s, before()]));
  const failsWhenMixed = recordOf({ [SETUPS[0]]: "pays" }, { [SETUPS[0]]: { mixed: { closed: 49, avgR: -0.29, verdict: "fails" } } });
  const no = 'The record says no. "Pullback in an uptrend" finished 49 times in a market that was mixed and averaged -0.29 of the risk taken, under the -0.1 of a call made for no reason on any day (setups.json).';
  assert.deepEqual(follow(calls, daily, { record: failsWhenMixed }).problems, [{ id: "2026-11-23:MIXED", why: [no] }], "with no stance from the engine, the file's own decides");
  const why = Object.fromEntries(follow(calls, daily, { record: recordOf({ [SETUPS[0]]: "fails" }) }).problems.map((p) => [p.id.split(":")[1], p.why]));
  assert.deepEqual(Object.keys(why), ["MIXED", "WITH", "NONE"], "a setup that fails overall fails under every stance with no say of its own");
  assert.equal(why.NONE[0], 'The record says no. "Pullback in an uptrend" finished 78 times over the saved candles and averaged 0 of the risk taken, under the 0.01 of a call made for no reason on any day (setups.json).');
  assert.deepEqual(follow(calls, daily).problems, [], "with no record yet, nothing is said");

  // The engine counted "mixed" that day. A file that says "with you" is kinder, and does not get its way.
  const kinder = "The file says the market is with you. The engine counted mixed (market.json). You may make the stance stricter, never kinder.";
  const market = { day: "2026-11-23", stance: "mixed" }, all = [...calls, call("AGAINST", "against-you")];
  const first = follow(all, daily, { record: failsWhenMixed, market });
  assert.deepEqual(Object.fromEntries(first.problems.map((p) => [p.id.split(":")[1], p.why])), { MIXED: [no], WITH: [kinder, no], NONE: [no] }, "a stricter file (against you) is judged by its own stance, where this setup has no record of its own");
  assert.deepEqual(first.calls.map((o) => [o.sym, o.at, o.stance]), all.map((c) => [c.sym, null, "mixed"]), "each row keeps the engine's stance as it was first seen");
  assert.deepEqual(follow(all, daily, { record: failsWhenMixed, market: { day: "2026-11-24", stance: "mixed" } }).problems.map((p) => p.id), ["2026-11-23:MIXED"], "the engine's stance of a later day says nothing about this call");

  // Later the market turns kinder, then harsher. The verdict on a call already made does not move.
  const later = (stance, was) => follow(all, daily, { record: failsWhenMixed, market: { day: "2026-11-23", stance }, was }).problems.map((p) => p.id.split(":")[1]);
  assert.deepEqual(later("with-you", first.calls), ["MIXED", "WITH", "NONE"]);
  const calm = follow(all, daily, { record: failsWhenMixed, market: { day: "2026-11-23", stance: "with-you" } });
  assert.deepEqual(calm.problems.map((p) => p.id), ["2026-11-23:MIXED"]);
  assert.deepEqual(later("mixed", calm.calls), ["MIXED"], "a call the engine first saw in a market that was with you stays judged that way");
  // The Scout writes the file again: the new `at` makes it a new call to judge.
  const again = all.map((c) => ({ ...c, at: "2026-11-23T18:00:00Z" }));
  assert.deepEqual(follow(again, daily, { record: failsWhenMixed, market, was: calm.calls }).problems.map((p) => p.id.split(":")[1]), ["MIXED", "WITH", "NONE"]);
});

test("a setup name that every object answers to does not stop the refresh", () => {
  for (const setup of ["constructor", "toString", "__proto__"]) {
    const call = { id: "2026-11-23:ODD", day: "2026-11-23", at: null, stance: "mixed", sym: "ODD", name: "Odd", setup, buy: [338, 344], stop: 332, target: 370 };
    const out = follow([call], { ODD: [...before(), ...days([340, 343, 339, 342])] }, { record: recordOf({}) });
    assert.deepEqual(out.problems[0].why, [`Its setup is "${setup}", which is not one of the five names in the method.`]);
    assert.equal(JSON.parse(JSON.stringify(out.score.bySetup))[setup].closed, 0, "and the scorecard still names it");
  }
});

test("a call's levels are measured by the usual daily move of the last full day when it was written", () => {
  // Thirty quiet days with a usual daily move of 6, then Monday swings 32 points and lifts it to 7.86.
  const daily = { WIDE: [...before(), ...days([340, 370, 338, 342])] };
  const zone = (at) => follow([{ id: "2026-11-23:WIDE", day: "2026-11-23", at, stance: null, sym: "WIDE", name: "Wide", setup: SETUPS[0], buy: [336, 344], stop: 332, target: 370 }], daily).problems.map((p) => p.why[0]);
  assert.deepEqual(zone("2026-11-23T21:30:00Z"), [], "written after Monday's close, Monday is the last full day, as it was for the candidates");
  assert.deepEqual(zone("2026-11-23T13:00:00Z"), ["The buy zone is 8 wide, wider than one usual daily move (6)."], "written before the open, it is Friday");
  assert.deepEqual(zone("2026-11-23T20:59:00Z"), zone("2026-11-23T13:00:00Z"), "and so it is during the session");
  assert.deepEqual(zone(null), [], "a file that does not say when it was written is told off only when both days say so");
  assert.equal(follow([{ id: "2026-11-23:WIDE", day: "2026-11-23", at: null, stance: null, sym: "WIDE", name: "Wide", setup: SETUPS[0], buy: [334, 344], stop: 330, target: 375 }], daily).problems[0].why[0], "The buy zone is 10 wide, wider than one usual daily move (6).", "a zone too wide for both is");
});

test("a call copied from a candidate after the close never breaks a level rule", () => {
  let copies = 0;
  for (const seed of [7, 11, 13, 17, 19, 23]) {
    const candles = walk(420, seed), s = series(candles, walk(420, 99));
    for (let i = 200; i < 420; i++) for (const c of detect(s, i, factsAt(s, i), { stance: "mixed", reports: null, day: s.days[i] }).filter((x) => !x.spoilers.length)) {
      const call = { id: `${s.days[i]}:WALK`, day: s.days[i], at: new Date((candles[i].t + 7 * 3600) * 1000).toISOString(), stance: null, sym: "WALK", name: "Walk", setup: c.setup, buy: c.buy, stop: c.stop, target: c.target };
      assert.deepEqual(follow([call], { WALK: candles }).problems, [], `${c.setup} on ${s.days[i]}, seed ${seed}`);
      copies++;
    }
  }
  assert.ok(copies > 10, "the walks hold clean candidates, or this proves nothing");
});

test("the scorecard is split by the setup the Scout named", () => {
  const s = score([{ state: "target", r: 2, day: "2026-11-02", setup: "A" }, { state: "stopped", r: -1, day: "2026-10-20", setup: "A" }, { state: "open", r: 1, day: "2026-11-20", setup: "B" }, { state: "timed-out", r: 0.4, day: "2026-11-05", setup: null }]);
  assert.deepEqual(s.bySetup, { A: { closed: 2, won: 1, target: 1, avgR: 0.5 }, B: { closed: 0, won: 0, target: 0, avgR: null } });
  assert.equal(outcome({ ...CALL, setup: "A" }, days([350, 352, 346, 351]), 351).setup, "A");
});

/** A cabinet in a temporary folder, for the two programs that are run as a person runs them. Returns its root and how to write a data file. */
async function scratchCabinet(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cabinet-"));
  t.after(() => fs.rm(root, { recursive: true }));
  await fs.mkdir(path.join(root, "app", "data", "candles"), { recursive: true });
  await fs.mkdir(path.join(root, "opportunities"));
  return { root, env: { ...process.env, CABINET_APP_DIR: path.join(root, "app") }, data: (name, value) => fs.writeFile(path.join(root, "app", "data", name), JSON.stringify(value)) };
}

test("the check before the Scout finishes holds each call against the candidates, the stance and the record", async (t) => {
  const { root, env, data } = await scratchCabinet(t);
  const cli = fileURLToPath(new URL("./check-calls.mjs", import.meta.url));
  const run = (day = "2026-11-23") => { const r = spawnSync(process.execPath, [cli, day], { env, encoding: "utf8" }); return [r.status, r.stdout.trimEnd().split("\n").slice(1)]; };
  const chartOf = (sym) => data(`candles/${sym}.1d.json`, { c: before().map((c) => [c.t, c.o, c.h, c.l, c.c, c.v]) });
  for (const sym of ["AAPL", "NVDA", "AMD", "TSLA"]) await chartOf(sym);
  const [PULLBACK, BREAKOUT] = SETUPS;
  const good = { sym: "AAPL", name: "Apple", setup: PULLBACK, conviction: 2, buy: [338, 344], stop: 332, target: 370 };
  const candidate = ({ sym, setup, buy, stop, target }, spoilers = []) => ({ sym, setup, buy, stop, target, spoilers });
  const write = (items, stance = "with-you", day = "2026-11-23") => fs.writeFile(path.join(root, "opportunities", `${day}.json`), JSON.stringify({ at: `${day}T13:00:00Z`, market: { stance }, items }));
  const candidates = (items, day = "2026-11-23") => data("candidates.json", { day, items });
  const engineSays = (stance) => data("market.json", { at: "2026-11-23T13:05:00Z", regime: { stance } });
  // The pullback pays, the breakout is unproven.
  await data("setups.json", recordOf({ [PULLBACK]: "pays" }));
  await engineSays("with-you");
  const nvda = { ...good, sym: "NVDA", name: "NVIDIA" }, amd = { ...good, sym: "AMD", name: "AMD", setup: BREAKOUT, conviction: 1 }, tsla = { ...amd, sym: "TSLA", name: "Tesla" };
  await candidates([good, nvda, amd, tsla].map((x) => candidate(x)));

  await write([good, nvda, amd]);
  assert.deepEqual(run(), [0, ["AAPL  OK", "NVDA  OK", "AMD  OK", "All in order."]], "three copies of candidates, in a market that allows three");

  await write([{ ...good, sym: "MU" }, { ...good, target: 380 }, { ...nvda, setup: BREAKOUT, conviction: 1 }]);
  assert.deepEqual(run(), [2, [
    "MU  NOT FOLLOWED  No saved candles for it yet. Run node app/engine/refresh.mjs, then check again.",
    "MU  PROBLEM  MU is not in candidates.json. A call is always one of its items: remove this one.",
    "AAPL  PROBLEM  Its numbers are not the candidate's. candidates.json gives buy 338 to 344, stop 332, target 370. Copy them exactly.",
    `NVDA  PROBLEM  candidates.json has NVDA as "${PULLBACK}", not as "${BREAKOUT}".`,
    "Fix what is listed above, then run this again.",
  ]], "an invented stock, changed numbers, and another setup than the candidate's");

  await candidates([candidate(good, [{ rule: "ceiling", text: "Its 200-day average (350) is 6 above the buy zone, nearer than the stop is far (12)." }])]);
  await write([good]);
  assert.deepEqual(run(), [2, ["AAPL  PROBLEM  Its candidate has a reason to pass. Its 200-day average (350) is 6 above the buy zone, nearer than the stop is far (12).", "Fix what is listed above, then run this again."]]);

  await candidates([good, nvda, amd, tsla].map((x) => candidate(x)));
  await write([{ ...good, conviction: 3 }, { ...nvda, conviction: "high" }, { ...amd, conviction: 2 }, tsla]);
  assert.deepEqual(run(), [2, [
    "FILE  PROBLEM  It holds 4 calls. A market that is with you allows 3 at most.",
    "AAPL  PROBLEM  `conviction` is 3. It is 1 or 2: 3 opens when your own scorecard has 20 finished calls of this setup averaging above zero.",
    'NVDA  PROBLEM  `conviction` is "high". It is 1 or 2.',
    `AMD  PROBLEM  The record of "${BREAKOUT}" is unproven (setups.json), so its conviction is 1.`,
    "TSLA  PROBLEM  It is the second call today of a setup whose record is unproven. One such call a day at most.",
    "Fix what is listed above, then run this again.",
  ]]);

  // The engine counted a harsher market than the file names: the count and the verdict follow the engine.
  await engineSays("against-you");
  await data("setups.json", recordOf({ [PULLBACK]: "pays" }, { [PULLBACK]: { "against-you": { closed: 40, avgR: -0.2, verdict: "fails" } } }));
  await write([good, nvda], "mixed");
  const [status, lines] = run();
  assert.equal(status, 2);
  assert.equal(lines[0], "FILE  PROBLEM  It holds 2 calls. A market that is against you allows 1 at most.");
  assert.equal(lines[1], "AAPL  PROBLEM  The file says the market is mixed. The engine counted against you (market.json). You may make the stance stricter, never kinder.");
  assert.match(lines[2], /^AAPL {2}PROBLEM {2}The record says no\. .* finished 40 times in a market that was against you/);
  await write([good], "against-you");
  assert.match(run()[1][0], /^AAPL {2}PROBLEM {2}The record says no\./, "the same verdict when the file names the harsher stance itself");

  await engineSays("with-you");
  await data("setups.json", recordOf({ [PULLBACK]: "pays" }));
  await write([{ ...good, stop: "332" }, { ...nvda, setup: "constructor" }]);
  assert.deepEqual(run(), [2, [
    'NVDA  PROBLEM  Its setup is "constructor", which is not one of the five names in the method.',
    `NVDA  PROBLEM  candidates.json has NVDA as "${PULLBACK}", not as "constructor".`,
    'AAPL  DROPPED  The stop ("332") is not a price under the buy zone (338 to 344). A price in quotes is text: write the bare number. The engine ignores this call until it is fixed.',
    "Fix what is listed above, then run this again.",
  ]], "a price in quotes is dropped, and a setup name every object answers to is only a wrong name");

  await fs.writeFile(path.join(root, "opportunities", "2026-11-23.json"), JSON.stringify({ items: [good] }));
  assert.deepEqual(run(), [2, ["FILE  PROBLEM  `market.stance` is not one of with-you, mixed, against-you.", "AAPL  OK", "Fix what is listed above, then run this again."]]);

  await write([], "against-you", "2026-11-24");
  assert.deepEqual(run("2026-11-24"), [2, ["FILE  PROBLEM  app/data/candidates.json is of 2026-11-23, so the calls cannot be held against it. Run node app/engine/refresh.mjs --full, then check again.", "No calls in this file. Nothing to check.", "Fix what is listed above, then run this again."]], "candidates of an earlier day are stale");
  await candidates([], "2026-11-24");
  assert.deepEqual(run("2026-11-24"), [0, ["No calls in this file. Nothing to check.", "All in order."]], "no calls is in order");
  await write([good]);
  assert.deepEqual(run(), [0, ["AAPL  OK", "All in order."]], "an earlier day is checked without the candidates of a later one");
  assert.deepEqual([run("2026-11-25")[0], run("someday")[0]], [2, 2], "a missing file is not in order");
});

test("the check reads the calls up to its day, so a later day's call is not held against an earlier one", async (t) => {
  const { root, env, data } = await scratchCabinet(t);
  const good = { sym: "AAPL", name: "Apple", setup: SETUPS[0], conviction: 1, buy: [338, 344], stop: 332, target: 370 };
  await data("candles/AAPL.1d.json", { c: [...before(), ...days([350, 352, 346, 351], [350, 352, 346, 351])].map((c) => [c.t, c.o, c.h, c.l, c.c, c.v]) });
  await data("candidates.json", { day: "2026-11-24", items: [] });
  for (const day of ["2026-11-23", "2026-11-24"]) await fs.writeFile(path.join(root, "opportunities", `${day}.json`), JSON.stringify({ at: `${day}T13:00:00Z`, market: { stance: "mixed" }, items: [good] }));
  const run = (day) => spawnSync(process.execPath, [fileURLToPath(new URL("./check-calls.mjs", import.meta.url)), day], { env, encoding: "utf8" }).stdout;
  assert.equal(run("2026-11-23"), "Calls of 2026-11-23\nAAPL  OK\nAll in order.\n");
  assert.match(run("2026-11-24"), /The call of 2026-11-23 on AAPL was still open on 2026-11-24/);
});

test("the server refuses before it reads the address, answers 400 to a malformed one, and keeps a full refresh for the owner", async (t) => {
  const { env } = await scratchCabinet(t);
  const child = spawn(process.execPath, [fileURLToPath(new URL("./server.mjs", import.meta.url))], { env: { ...env, CABINET_APP_TOKEN: "secret" } });
  t.after(() => child.kill());
  const base = await new Promise((ok, fail) => { child.stdout.on("data", (line) => ok(/http:\S+/.exec(String(line))[0])); child.on("error", fail); });
  const as = (role) => ({ "x-cabinet-app-token": "secret", "x-cabinet-user": encodeURIComponent(JSON.stringify({ role })) });
  const ask = async (where, headers) => { const res = await fetch(base + where, { headers }); return [res.status, (await res.json()).error]; };
  assert.deepEqual(await ask("//[", {}), [403, "Not allowed."]);
  assert.deepEqual(await ask("//[", as("owner")), [400, "That address does not look right."]);
  assert.deepEqual(await ask("/health", as("member")), [200, undefined], "the server is still up");
  assert.deepEqual(await ask("/refresh?full=1", as("member")), [403, "Only the owner of this cabinet can ask for a full refresh."]);
});
