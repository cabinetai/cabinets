// The Scout's calls, and how each one turned out. The Scout writes one file a day into the
// cabinet's opportunities/ folder; this file reads them back and follows each call through
// the daily candles: did the price come into the buy zone, and then which came first, the
// stop or the target. It is arithmetic, so the scorecard cannot flatter anyone.

import fs from "node:fs/promises";
import path from "node:path";
import { readJson } from "./io.mjs";
import { atr, nyDay, nyMinute, NY_OPEN, NY_CLOSE, DAY_MS, r2 } from "./indicators.mjs";
import { SETUPS, broken } from "./setups.mjs";
import { STANCES, harsher } from "./market.mjs";
import { verdictFor } from "./verdict.mjs";
import { cleanSym } from "./sources.mjs";

// A call that has not reached its zone after this many trading days is dropped.
const WAIT_DAYS = 10;
// An entered call that reaches neither stop nor target is closed on its 30th trading day, the day of the entry being the first.
const HOLD_DAYS = 30;
/** The most daily candles it can take to settle a call, counted from the first one it is followed through. */
export const FOLLOW_DAYS = WAIT_DAYS + HOLD_DAYS;
// Files older than this are no longer followed.
const KEEP_DAYS = 90;

// A price is a real number above zero. A model writes these files: "332" in quotes is text.
const isPrice = (v) => typeof v === "number" && isFinite(v) && v > 0;
const shown = (v) => (v === undefined ? "missing" : JSON.stringify(v));
const inQuotes = (v) => (typeof v === "string" ? " A price in quotes is text: write the bare number." : "");

/**
 * Why an item of the Scout's file is not a call, as a sentence, or null when it is well
 * formed. The one rule, which the page follows too: `buy` is two numbers above zero with
 * the lower first, `stop` a number above zero and under the zone, `target` a number above
 * the zone. A number is a JSON number, never a string of digits.
 */
function malformed(x, sym) {
  if (!sym) return "It has no symbol the engine can read.";
  const zone = Array.isArray(x.buy) ? x.buy : [];
  if (!(zone.length === 2 && zone.every(isPrice) && zone[0] <= zone[1])) return "`buy` is not two prices, the lower first." + inQuotes(zone.find((v) => typeof v === "string"));
  if (!(isPrice(x.stop) && x.stop < zone[0])) return `The stop (${shown(x.stop)}) is not a price under the buy zone (${zone[0]} to ${zone[1]}).${inQuotes(x.stop)}`;
  if (!(isPrice(x.target) && x.target > zone[1])) return `The target (${shown(x.target)}) is not a price above the buy zone (${zone[0]} to ${zone[1]}).${inQuotes(x.target)}`;
  return null;
}

/**
 * One day's file of the Scout, `opportunities/<day>.json`: `{ at, stance, calls, dropped }`,
 * or null when the file is missing or is not the shape the engine reads. A call is
 * `{ id, day, at, stance, sym, name, setup, conviction, buy: [low, high], stop, target }`.
 * A model writes these files, so anything malformed is left out instead of trusted, and
 * `dropped` says why: `[{ sym, why }]`. `at` is the file's own time when it falls on the
 * file's day in New York, and `stance` the stance the file names when it is one of the
 * three. Each is null otherwise. `conviction` is kept as written, for the check to judge.
 */
export async function readDay(dir, day) {
  const file = await readJson(path.join(dir, `${day}.json`));
  if (!file || !Array.isArray(file.items)) return null;
  const calls = [], dropped = [], written = Date.parse(file.at);
  const at = isFinite(written) && nyDay(written / 1000) === day ? file.at : null;
  const stance = file.market && STANCES.includes(file.market.stance) ? file.market.stance : null;
  for (const x of file.items) {
    const sym = cleanSym(x && x.sym);
    const why = malformed(x, sym) || (calls.some((c) => c.sym === sym) ? "It is listed twice in the same file." : null);
    if (why) dropped.push({ sym: sym || (x && typeof x.sym === "string" && x.sym.slice(0, 20).toUpperCase()) || "?", why });
    else calls.push({ id: `${day}:${sym}`, day, at, stance, sym, name: typeof x.name === "string" ? x.name : sym, setup: typeof x.setup === "string" ? x.setup : null, conviction: x.conviction, buy: x.buy, stop: x.stop, target: x.target });
  }
  return { at, stance, calls, dropped };
}

/** Every usable call in `dir` from the last 90 days, oldest first. Example files are not calls. */
export async function readCalls(dir, now = Date.now()) {
  const names = (await fs.readdir(dir).catch(() => [])).filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n)).sort();
  const calls = [];
  for (const name of names) {
    const day = name.slice(0, 10);
    if (now - Date.parse(day) > KEEP_DAYS * DAY_MS) continue;
    calls.push(...((await readDay(dir, day)) || { calls: [] }).calls);
  }
  return calls;
}

/** Minutes after midnight in New York when the call's file was written, or null when the file gave no usable `at`. */
const writtenAt = (call) => (call.at == null ? null : nyMinute(Date.parse(call.at) / 1000));

/**
 * Where one call stands, from the daily candles (oldest first) since the day it was made.
 * A call written once that day's session had opened (`at`) is followed from the next
 * session: the day's own candle holds moves made before anyone could act on the call.
 * With no `at`, it is followed from its own day. `price` is the newest price. States:
 * `waiting` (not at the zone yet), `in-zone` (entered and the price is inside the zone
 * right now), `open`, `target`, `stopped`, `timed-out`, and `expired` (never reached the
 * zone, or fell under the stop first). `r` is the result in units of the risk taken: 1 is
 * one stop-distance gained.
 */
export function outcome(call, candles, price) {
  const [low, high] = call.buy;
  const late = writtenAt(call) >= NY_OPEN;
  const days = candles.filter((c) => (late ? nyDay(c.t) > call.day : nyDay(c.t) >= call.day));
  const base = { id: call.id, day: call.day, sym: call.sym, setup: call.setup ?? null, price: price ?? null, entry: null, enteredOn: null, closedOn: null, r: null };
  let entry = null, waited = 0, held = 0;
  for (const c of days) {
    const day = nyDay(c.t), entering = entry == null;
    if (entering) {
      if (c.l <= high && c.h >= low) {
        // Opened above the zone and fell into it, opened under it and rose into it, or opened inside.
        entry = c.o > high ? high : c.o < low ? low : c.o;
        Object.assign(base, { entry: r2(entry), enteredOn: day });
      } else if (c.c < call.stop || ++waited >= WAIT_DAYS) return { ...base, state: "expired", closedOn: day };
      else continue;
    }
    const risk = entry - call.stop, done = (state, at) => ({ ...base, state, closedOn: day, r: r2((at - entry) / risk) });
    // A day that touches both is counted as the stop: the candle does not say which came
    // first. Later days fill at the open when it gapped under the stop. The day of the
    // entry fills at the stop: its open came before the entry.
    if (c.l <= call.stop) return done("stopped", entering ? call.stop : Math.min(c.o, call.stop));
    // On the day of the entry, a price that opened above the zone made its high before it fell in.
    if (c.h >= call.target && !(entering && c.o > high)) return done("target", call.target);
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

/** The symbols still held (waiting or open) from a call of a day before `day`. One called on `day` itself is not among them. */
export const heldBefore = (outcomes, day) => outcomes.filter((o) => o.day < day && !o.closedOn).map((o) => o.sym);

/**
 * What a well-formed call does against the method's hard rules, as plain sentences; empty
 * when it breaks none. The usual daily move is the one of the last full day when the file
 * was written, the day the candidates were built on: the call's own day when the file was
 * written after that day's close, the day before it otherwise. So a call copied from a
 * candidate is measured as the candidate was. A file that does not say when it was written
 * is measured by both days, and a level rule counts only when both break it.
 * `outcomes` are those of every call, to see a stock that was already held.
 * `record` is setups.json, or null. `engine` is the stance the engine counted when it
 * first saw the call, or null: the call is judged by the harsher of that and the stance
 * its file names, and a file that names a kinder one is told so.
 */
function problemsOf(call, candles, outcomes, { reports, record, engine }) {
  const usualOn = (ownDay) => {
    const known = (candles || []).filter((c) => (ownDay ? nyDay(c.t) <= call.day : nyDay(c.t) < call.day));
    return r2(atr(known, 14)[known.length - 1]) || null;
  };
  const written = writtenAt(call), usual = written == null ? [usualOn(false), usualOn(true)] : [usualOn(written >= NY_CLOSE)];
  const [first, ...rest] = usual.map((move) => broken(call, { atr: move, reports: reports ? reports[call.sym] || [] : null, day: call.day }));
  const why = first.filter((x) => rest.every((list) => list.some((y) => y.rule === x.rule))).map((x) => x.text);
  if (!SETUPS.includes(call.setup)) why.push(`Its setup is "${call.setup ?? ""}", which is not one of the five names in the method.`);
  const stance = harsher(call.stance, engine);
  if (call.stance && stance !== call.stance) why.push(`The file says the market is ${SAID[call.stance]}. The engine counted ${SAID[engine]} (market.json). You may make the stance stricter, never kinder.`);
  const judged = record && verdictFor(record, call.setup, stance);
  if (judged && judged.verdict === "fails")
    why.push(`The record says no. "${call.setup}" finished ${judged.closed} times ${judged.verdictFrom === "stance" ? `in a market that was ${SAID[stance]}` : "over the saved candles"} and averaged ${judged.avgR} of the risk taken, under the ${judged.anyAvgR} of a call made for no reason on any day (setups.json).`);
  const held = outcomes.find((o) => o.sym === call.sym && o.day < call.day && (!o.closedOn || o.closedOn >= call.day));
  if (held) why.push(`The call of ${held.day} on ${call.sym} was still open on ${call.day}. A stock is not called twice.`);
  return why;
}

/**
 * Everything `outcomes.json` says about `calls`: where each one stands, the scorecard, and
 * `problems`, the calls that break a hard rule of the method (they are still followed and
 * scored). `daily` is `{ SYMBOL: daily candles }`; a call with no candles is not followed.
 * `prices` are the newest prices by symbol, `reports` the earnings days by symbol (null
 * when no calendar is known), `record` is setups.json (null when there is none yet).
 * `market` is `{ day, stance }`, the stance the engine counts now and the New York day it
 * is of. `was` are the rows of the outcomes.json before this one: a row keeps the engine's
 * stance from when the call was first seen (`stance`, beside the file's `at`), so a market
 * that turns later in the day or the week does not rewrite the verdict on a call already
 * made. A call first seen on a later day has none. The refresh and the check before the
 * Scout finishes both use this.
 */
export function follow(calls, daily, { prices = {}, reports = null, record = null, market = null, was = [] } = {}) {
  const seen = new Map(was.map((o) => [o.id, o]));
  const engineOf = (c) => {
    const old = seen.get(c.id);
    return old && old.at === c.at ? old.stance : market && market.day === c.day ? market.stance : null;
  };
  const outcomes = calls.filter((c) => daily[c.sym]).map((c) => ({ ...outcome(c, daily[c.sym], prices[c.sym] ?? null), at: c.at, stance: engineOf(c) }));
  const problems = calls.map((c) => ({ id: c.id, why: problemsOf(c, daily[c.sym], outcomes, { reports, record, engine: engineOf(c) }) })).filter((p) => p.why.length);
  return { calls: outcomes, score: score(outcomes), problems };
}
