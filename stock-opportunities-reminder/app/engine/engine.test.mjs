// node --test app/engine/engine.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { sma, ema, rsi, atr, priorHigh, avgVolume } from "./lib/indicators.mjs";
import { RULES, scanDaily, facts } from "./lib/signals.mjs";
import { usSession, symbolsOf } from "./refresh.mjs";
import { ruleRecord, recordKey } from "./lib/record.mjs";
import { readCalls, outcome, score } from "./lib/calls.mjs";
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

test("the US session follows the New York clock", () => {
  assert.equal(usSession(new Date("2026-11-19T14:00:00Z")), "pre");
  assert.equal(usSession(new Date("2026-11-19T15:00:00Z")), "open");
  assert.equal(usSession(new Date("2026-11-19T21:30:00Z")), "after");
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

test("a call ends at its target, at its stop, or when time runs out", () => {
  const won = outcome(CALL, days([340, 343, 339, 342], [345, 362, 344, 360]), 360);
  assert.deepEqual([won.state, won.r, won.closedOn], ["target", 2.63, "2026-11-24"], "340 to 361 on 8 risked");
  const lost = outcome(CALL, days([340, 343, 339, 342], [341, 362, 331, 340]), 340);
  assert.deepEqual([lost.state, lost.r], ["stopped", -1], "a day that touches both counts as the stop");
  const gap = outcome(CALL, days([340, 343, 339, 342], [328, 330, 326, 329]), 329);
  assert.equal(gap.r, -1.5, "it opened under the stop, so it lost more than planned");
  const slow = outcome(CALL, days([340, 343, 339, 342], ...Array.from({ length: 30 }, () => [342, 345, 340, 344])), 344);
  assert.deepEqual([slow.state, slow.r], ["timed-out", 0.5]);
});

test("a call that never reaches its zone expires, and one that falls under its stop first is dropped", () => {
  assert.equal(outcome(CALL, days(...Array.from({ length: 10 }, () => [350, 352, 346, 351])), 351).state, "expired");
  assert.equal(outcome(CALL, days([330, 331, 325, 326]), 326).state, "expired");
});

test("the scorecard counts finished calls only", () => {
  const s = score([{ state: "target", r: 2, day: "2026-11-02" }, { state: "stopped", r: -1, day: "2026-10-20" }, { state: "timed-out", r: 0.5, day: "2026-11-05" }, { state: "open", r: 3, day: "2026-11-20" }, { state: "expired", r: null, day: "2026-11-01" }]);
  assert.deepEqual(s, { closed: 3, won: 2, target: 1, avgR: 0.5, since: "2026-10-20" });
  assert.deepEqual(score([]), { closed: 0, won: 0, target: 0, avgR: null, since: null });
});

test("only well-formed calls are read from the Scout's files, and examples are not calls", async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "calls-"));
  t.after(() => fs.rm(dir, { recursive: true }));
  const item = { sym: "aapl", name: "Apple", buy: [338, 344], stop: 332, target: 361 };
  await fs.writeFile(path.join(dir, "2026-11-23.json"), JSON.stringify({ items: [item, { ...item, sym: "NVDA", stop: 340 }, { ...item, sym: "MU", buy: "soon" }, { ...item, sym: "../x" }, null] }));
  await fs.writeFile(path.join(dir, "EXAMPLE-2026-11-23.json"), JSON.stringify({ items: [item] }));
  await fs.writeFile(path.join(dir, "2026-11-22.json"), "not json");
  await fs.writeFile(path.join(dir, "2026-01-05.json"), JSON.stringify({ items: [item] }));
  const calls = await readCalls(dir, Date.parse("2026-11-24"));
  assert.deepEqual(calls, [{ id: "2026-11-23:AAPL", day: "2026-11-23", sym: "AAPL", name: "Apple", buy: [338, 344], stop: 332, target: 361 }]);
  assert.deepEqual(await readCalls(path.join(dir, "missing")), []);
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
  assert.deepEqual(await src.shortInterest("NVDA"), { asOf: "10/30/2026", shares: 279579505, avgVolume: 99940095, daysToCover: 2.8, source: "FINRA" });
  finra = [];
  assert.deepEqual(await src.shortInterest("NVDA"), { asOf: "10/30/2026", shares: 279579505, avgVolume: 99940095, daysToCover: 2.797471, source: "Nasdaq" });
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
