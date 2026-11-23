// The Scout's calls, and how each one turned out. The Scout writes one file a day into the
// cabinet's opportunities/ folder; this file reads them back and follows each call through
// the daily candles: did the price come into the buy zone, and then which came first, the
// stop or the target. It is arithmetic, so the scorecard cannot flatter anyone.

import fs from "node:fs/promises";
import path from "node:path";
import { readJson } from "./io.mjs";

// A call that has not reached its zone after this many trading days is dropped.
const WAIT_DAYS = 10;
// An entered call that reaches neither stop nor target is closed at this many trading days.
const HOLD_DAYS = 30;
// Files older than this are no longer followed.
const KEEP_DAYS = 90;

const r2 = (n) => Math.round(n * 100) / 100;
const nyDay = (t) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(t * 1000));

/**
 * Every usable call in `dir`, oldest first: `{ id, day, sym, name, buy: [low, high], stop, target }`.
 * A model writes these files, so anything malformed is left out instead of trusted: a call
 * needs a zone, a stop under it and a target over it. Example files are not calls.
 */
export async function readCalls(dir, now = Date.now()) {
  const names = (await fs.readdir(dir).catch(() => [])).filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n)).sort();
  const calls = [];
  for (const name of names) {
    const day = name.slice(0, 10);
    if (now - Date.parse(day) > KEEP_DAYS * 86400000) continue;
    const file = await readJson(path.join(dir, name), null);
    for (const x of (file && Array.isArray(file.items) ? file.items : [])) {
      const sym = x && typeof x.sym === "string" ? x.sym.toUpperCase() : "";
      const [low, high] = Array.isArray(x && x.buy) ? x.buy.map(Number) : [];
      const stop = Number(x && x.stop), target = Number(x && x.target);
      if (!/^[A-Z0-9.^=-]{1,12}$/.test(sym) || !(stop > 0 && stop < low && low <= high && high < target)) continue;
      calls.push({ id: `${day}:${sym}`, day, sym, name: typeof x.name === "string" ? x.name : sym, buy: [low, high], stop, target });
    }
  }
  return calls;
}

/**
 * Where one call stands, from the daily candles (oldest first) since the day it was made.
 * `price` is the newest price. States: `waiting` (not at the zone yet), `in-zone` (entered
 * and the price is inside the zone right now), `open`, `target`, `stopped`, `timed-out`, and `expired` (never
 * reached the zone, or fell under the stop first). `r` is the result in units of the risk
 * taken: 1 is one stop-distance gained.
 */
export function outcome(call, candles, price) {
  const [low, high] = call.buy;
  const days = candles.filter((c) => nyDay(c.t) >= call.day);
  const base = { id: call.id, day: call.day, sym: call.sym, price: price ?? null, entry: null, enteredOn: null, closedOn: null, r: null };
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

/** The scorecard over calls that are finished: how many, how many made money, how many reached their target, and the average result in R. */
export function score(outcomes) {
  const closed = outcomes.filter((o) => ["target", "stopped", "timed-out"].includes(o.state));
  return {
    closed: closed.length, won: closed.filter((o) => o.r > 0).length, target: closed.filter((o) => o.state === "target").length,
    avgR: closed.length ? r2(closed.reduce((s, o) => s + o.r, 0) / closed.length) : null,
    since: closed.length ? closed.map((o) => o.day).sort()[0] : null,
  };
}
