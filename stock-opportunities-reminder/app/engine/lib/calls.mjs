// The Scout's calls, and how each one turned out. The Scout writes one file a day into the
// cabinet's opportunities/ folder; this file reads them back and follows each call through
// the daily candles: did the price come into the buy zone, and then which came first, the
// stop or the target. It is arithmetic, so the scorecard cannot flatter anyone.

import fs from "node:fs/promises";
import path from "node:path";
import { readJson } from "./io.mjs";
import { atr, nyDay, nyMinute, NY_OPEN } from "./indicators.mjs";
import { SETUPS, broken } from "./setups.mjs";
import { STANCES } from "./market.mjs";
import { verdictFor } from "./verdict.mjs";

// A call that has not reached its zone after this many trading days is dropped.
const WAIT_DAYS = 10;
// An entered call that reaches neither stop nor target is closed at this many trading days.
const HOLD_DAYS = 30;
/** The most daily candles it can take to settle a call, counted from the first one it is followed through. */
export const FOLLOW_DAYS = WAIT_DAYS + HOLD_DAYS;
// Files older than this are no longer followed.
const KEEP_DAYS = 90;

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * One day's file of the Scout, `opportunities/<day>.json`: `{ calls, dropped }`, or null
 * when the file is missing or is not the shape the engine reads. A call is
 * `{ id, day, at, stance, sym, name, setup, buy: [low, high], stop, target }`. A model
 * writes these files, so anything malformed is left out instead of trusted, and `dropped`
 * says why: `[{ sym, why }]`. A call needs a zone, a stop under it and a target over it.
 * `at` is the file's own time when it falls on the file's day in New York, and `stance`
 * the stance the file names when it is one of the three. Each is null otherwise.
 */
export async function readDay(dir, day) {
  const file = await readJson(path.join(dir, `${day}.json`), null);
  if (!file || !Array.isArray(file.items)) return null;
  const calls = [], dropped = [], written = Date.parse(file.at);
  const at = isFinite(written) && nyDay(written / 1000) === day ? file.at : null;
  const stance = file.market && STANCES.includes(file.market.stance) ? file.market.stance : null;
  for (const x of file.items) {
    const sym = x && typeof x.sym === "string" ? x.sym.toUpperCase() : "";
    const [low, high] = Array.isArray(x && x.buy) ? x.buy.map(Number) : [];
    const stop = Number(x && x.stop), target = Number(x && x.target);
    const why = !/^[A-Z0-9.^=-]{1,12}$/.test(sym) ? "It has no symbol the engine can read."
      : !(low > 0 && low <= high) ? "`buy` is not two prices, the lower first."
      : !(stop > 0 && stop < low) ? `The stop (${x.stop}) is not a price under the buy zone (${low} to ${high}).`
      : !(target > high) ? `The target (${x.target}) is not a price above the buy zone (${low} to ${high}).`
      : calls.some((c) => c.sym === sym) ? "It is listed twice in the same file."
      : null;
    if (why) dropped.push({ sym: sym.slice(0, 20) || "?", why });
    else calls.push({ id: `${day}:${sym}`, day, at, stance, sym, name: typeof x.name === "string" ? x.name : sym, setup: typeof x.setup === "string" ? x.setup : null, buy: [low, high], stop, target });
  }
  return { calls, dropped };
}

/** Every usable call in `dir` from the last 90 days, oldest first. Example files are not calls. */
export async function readCalls(dir, now = Date.now()) {
  const names = (await fs.readdir(dir).catch(() => [])).filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n)).sort();
  const calls = [];
  for (const name of names) {
    const day = name.slice(0, 10);
    if (now - Date.parse(day) > KEEP_DAYS * 86400000) continue;
    calls.push(...((await readDay(dir, day)) || { calls: [] }).calls);
  }
  return calls;
}

/**
 * Where one call stands, from the daily candles (oldest first) since the day it was made.
 * A call written once that day's session had opened (`at`) is followed from the next
 * session: the day's own candle holds moves made before anyone could act on the call.
 * With no `at`, it is followed from its own day. `price` is the newest price. States: `waiting` (not at the zone yet), `in-zone` (entered
 * and the price is inside the zone right now), `open`, `target`, `stopped`, `timed-out`, and `expired` (never
 * reached the zone, or fell under the stop first). `r` is the result in units of the risk
 * taken: 1 is one stop-distance gained.
 */
export function outcome(call, candles, price) {
  const [low, high] = call.buy;
  const late = call.at != null && nyMinute(Date.parse(call.at) / 1000) >= NY_OPEN;
  const days = candles.filter((c) => (late ? nyDay(c.t) > call.day : nyDay(c.t) >= call.day));
  const base = { id: call.id, day: call.day, sym: call.sym, setup: call.setup ?? null, price: price ?? null, entry: null, enteredOn: null, closedOn: null, r: null };
  let entry = null, waited = 0, held = 0;
  for (const c of days) {
    const day = nyDay(c.t);
    if (entry == null) {
      if (c.l <= high && c.h >= low) {
        // Opened above the zone and fell into it, opened under it and rose into it, or opened inside.
        entry = c.o > high ? high : c.o < low ? low : c.o;
        Object.assign(base, { entry: r2(entry), enteredOn: day });
      } else if (c.c < call.stop || ++waited >= WAIT_DAYS) return { ...base, state: "expired", closedOn: day };
      else continue;
    }
    const risk = entry - call.stop, done = (state, at) => ({ ...base, state, closedOn: day, r: r2((at - entry) / risk) });
    // A day that touches both is counted as the stop: the candle does not say which came first.
    if (c.l <= call.stop) return done("stopped", Math.min(c.o, call.stop));
    if (c.h >= call.target) return done("target", call.target);
    if (++held >= HOLD_DAYS) return done("timed-out", c.c);
  }
  if (entry == null) return { ...base, state: "waiting" };
  const now = price ?? days[days.length - 1].c;
  return { ...base, state: now >= low && now <= high ? "in-zone" : "open", r: r2((now - entry) / (entry - call.stop)) };
}

// A stance as a sentence says it.
const SAID = { "with-you": "with you", mixed: "mixed", "against-you": "against you" };

const FINISHED = ["target", "stopped", "timed-out"];
/** Finished calls counted: how many, how many made money, how many reached their target, and the average result in R. */
export function tally(outcomes) {
  const closed = outcomes.filter((o) => FINISHED.includes(o.state));
  return {
    closed: closed.length, won: closed.filter((o) => o.r > 0).length, target: closed.filter((o) => o.state === "target").length,
    avgR: closed.length ? r2(closed.reduce((s, o) => s + o.r, 0) / closed.length) : null,
  };
}

/** The scorecard: every finished call, the day of the oldest, and the same count for each setup the Scout named. */
export function score(outcomes) {
  const days = outcomes.filter((o) => FINISHED.includes(o.state)).map((o) => o.day).sort();
  const named = [...new Set(outcomes.map((o) => o.setup).filter(Boolean))];
  return { ...tally(outcomes), since: days[0] ?? null, bySetup: Object.fromEntries(named.map((n) => [n, tally(outcomes.filter((o) => o.setup === n))])) };
}

/**
 * What a well-formed call does against the method's hard rules, as plain sentences; empty
 * when it breaks none. The usual daily move is the one on the last full day before the
 * call's day, so the verdict does not change as that day's candle grows. `outcomes` are
 * those of every call, to see a stock that was already held. `record` is setups.json, or
 * null: a call of a setup whose record fails under the stance the Scout named is told so.
 */
function problemsOf(call, candles, outcomes, reports, record) {
  const before = (candles || []).filter((c) => nyDay(c.t) < call.day), usual = atr(before, 14)[before.length - 1];
  const why = broken(call, { atr: usual ? r2(usual) : null, reports: reports ? reports[call.sym] || [] : null, day: call.day }).map((x) => x.text);
  if (!SETUPS.includes(call.setup)) why.push(`Its setup is "${call.setup ?? ""}", which is not one of the five names in the method.`);
  const judged = record && verdictFor(record, call.setup, call.stance);
  if (judged && judged.verdict === "fails")
    why.push(`The record says no. "${call.setup}" finished ${judged.closed} times ${judged.verdictFrom === "stance" ? `in a market that was ${SAID[call.stance]}` : "over the saved candles"} and averaged ${judged.avgR} of the risk taken, under the ${judged.anyAvgR} of a call made for no reason on any day (setups.json).`);
  const held = outcomes.find((o) => o.sym === call.sym && o.day < call.day && (!o.closedOn || o.closedOn >= call.day));
  if (held) why.push(`The call of ${held.day} on ${call.sym} was still open on ${call.day}. A stock is not called twice.`);
  return why;
}

/**
 * Everything `outcomes.json` says about `calls`: where each one stands, the scorecard, and
 * `problems`, the calls that break a hard rule of the method (they are still followed and
 * scored). `daily` is `{ SYMBOL: daily candles }`; a call with no candles is not followed.
 * `prices` are the newest prices by symbol, `reports` the earnings days by symbol (null
 * when no calendar is known), `record` is setups.json (null when there is none yet). The
 * refresh and the check before the Scout finishes both use this.
 */
export function follow(calls, daily, { prices = {}, reports = null, record = null } = {}) {
  const outcomes = calls.filter((c) => daily[c.sym]).map((c) => outcome(c, daily[c.sym], prices[c.sym] ?? null));
  const problems = calls.map((c) => ({ id: c.id, why: problemsOf(c, daily[c.sym], outcomes, reports, record) })).filter((p) => p.why.length);
  return { calls: outcomes, score: score(outcomes), problems };
}
