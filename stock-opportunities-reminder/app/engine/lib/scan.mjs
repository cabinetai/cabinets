// The setups run over charts, two ways. Today: which stocks fit a setup on their newest
// candle (candidates.json). The past: every day of the saved candles as if it were today,
// each candidate then followed as a call of the Scout is (setups.json), so a person can see
// whether a setup has earned their trust. It costs no AI.

import { avgVolume, nyDay, nyMinute, NY_CLOSE } from "./indicators.mjs";
import { series, factsAt } from "./signals.mjs";
import { STANCES, regime } from "./market.mjs";
import { SETUPS, WARMUP, detect, anyDay } from "./setups.mjs";
import { outcome, tally, FOLLOW_DAYS } from "./calls.mjs";
import { verdictOf, verdictFor } from "./verdict.mjs";

// The method's floor for a stock worth a call: its price, and the shares it trades on a usual day.
const MIN_PRICE = 5, MIN_VOLUME = 500000;
// The order of a verdict in today's candidates.
const BEST_FIRST = ["pays", "unproven", "fails"];

/**
 * The full days of a saved chart, `fetchedAt` being when it was fetched. A newest candle
 * fetched before 16:00 in New York on its own day is part of a day, with part of a day's
 * range and volume, and a setup must not judge it as a whole one. With `upTo` (a New York
 * day) anything newer is left out too, so every chart of one scan ends on the same day.
 */
export function fullDays(candles, fetchedAt, upTo = null) {
  const at = Date.parse(fetchedAt) / 1000;
  let n = candles.length;
  if (n && nyDay(candles[n - 1].t) === nyDay(at) && nyMinute(at) < NY_CLOSE) n--;
  while (upTo && n && nyDay(candles[n - 1].t) > upTo) n--;
  return candles.slice(0, n);
}

/** The charts of `pool` whose newest full day is `asOf`, the fund's. A chart that ends earlier is old, and is no picture of today. */
export const endingOn = (pool, asOf) => pool.filter((x) => x.candles.length && nyDay(x.candles.at(-1).t) === asOf);

/**
 * Today's candidates. `pool` is `[{ sym, name, from, candles }]` in the order of the
 * method's step 2; a symbol met twice counts where it was met first. `skip` holds the
 * symbols still held from a call of an earlier day. `fund` is the S&P 500 fund's candles, `stance` the market's,
 * `reports` the earnings days by symbol (null when no calendar is known), `day` today in
 * New York, `record` what `setupRecord` returns. Each candidate carries its setup's verdict
 * under today's stance. Candidates with no reason to pass come first, then the better
 * verdict, then the better pay.
 */
export function candidatesOf(pool, { fund, stance, reports, day, skip, record }) {
  const items = [], seen = new Set(skip);
  for (const { sym, name, from, candles } of pool) {
    if (seen.has(sym)) continue;
    seen.add(sym);
    const s = series(candles, fund), i = candles.length - 1, f = factsAt(s, i);
    if (!f || f.close < MIN_PRICE || avgVolume(candles, i, 20) < MIN_VOLUME) continue;
    for (const found of detect(s, i, f, { stance, reports: reports && (reports[sym] || []), day })) {
      const { verdict, verdictFrom } = verdictFor(record, found.setup, stance);
      items.push({ sym, name, from, ...found, verdict, verdictFrom, facts: f });
    }
  }
  return items.sort((a, b) => Math.sign(a.spoilers.length) - Math.sign(b.spoilers.length) || BEST_FIRST.indexOf(a.verdict) - BEST_FIRST.indexOf(b.verdict) || b.pay - a.pay);
}

/** A list of outcomes, counted: how many there were, how many came into their zone, and the scorecard of the finished ones. */
const count = (list) => ({ candidates: list.length, entered: list.filter((o) => o.entry != null).length, ...tally(list) });
/** The same count overall and for each stance of the market. */
const sliced = (list) => ({ ...count(list), byStance: Object.fromEntries(STANCES.map((st) => [st, count(list.filter((o) => o.stance === st))])) });
/** A sliced count with its verdict on every slice, each judged beside the same slice of the yardstick `any`. */
const judged = (own, any) => ({
  ...own, verdict: verdictOf(own, any),
  byStance: Object.fromEntries(STANCES.map((st) => [st, { ...own.byStance[st], verdict: verdictOf(own.byStance[st], any.byStance[st]) }])),
});

/**
 * The record of every setup over `bySym` ({ SYMBOL: daily candles, oldest first }).
 * On day i a detector sees candles 0..i and nothing later; the candidate is then followed
 * through the candles after i exactly as a call is. A candidate with a reason to pass is
 * not a call: it is followed apart, under `spoiled`, to show what passing saved or cost.
 * No second call is opened on a stock while one of the same setup is waiting or open.
 * `vix` is the fear gauge's daily candles, or null: then the fund alone names the stance.
 * Earnings dates of the past are not known, so the earnings reason to pass is never
 * applied here and a gap is counted whether or not results caused it.
 */
export function setupRecord(bySym, fund, vix) {
  const market = series(fund), fear = new Map((vix || []).map((c) => [nyDay(c.t), c.c]));
  const stanceOn = new Map(market.days.map((d, j) => [d, j ? regime(market, j, fear.get(d) ?? null).stance : null]));
  const calls = Object.fromEntries([...SETUPS, "any"].map((n) => [n, []])), passed = Object.fromEntries(SETUPS.map((n) => [n, []]));
  const symbols = [];
  let from = null, to = null;

  for (const [sym, candles] of Object.entries(bySym)) {
    if (candles.length <= WARMUP) continue;
    symbols.push(sym);
    const s = series(candles, fund), busy = {};
    if (from == null || s.days[WARMUP] < from) from = s.days[WARMUP];
    if (to == null || s.days[candles.length - 1] > to) to = s.days[candles.length - 1];
    // Opens one call in `book` unless the last one there on this stock is still running, and follows it.
    const open = (book, key, i, found, stance) => {
      if (busy[key] >= i) return;
      const o = outcome({ ...found, id: `${s.days[i]}:${sym}`, day: s.days[i], sym }, candles.slice(i + 1, i + 1 + FOLLOW_DAYS), null);
      busy[key] = o.closedOn ? s.days.indexOf(o.closedOn, i) : Infinity;
      book.push({ ...o, stance, spoilers: found.spoilers });
    };
    for (let i = WARMUP; i < candles.length; i++) {
      const stance = stanceOn.get(s.days[i]), f = factsAt(s, i);
      if (!stance || !f.atr) continue;
      const plain = anyDay(f);
      if (plain) open(calls.any, "any", i, plain, stance);
      for (const found of detect(s, i, f, { stance, reports: null, day: s.days[i] })) {
        if (found.spoilers.length) open(passed[found.setup], `passed:${found.setup}`, i, found, stance);
        else open(calls[found.setup], found.setup, i, found, stance);
      }
    }
  }

  const any = sliced(calls.any), setups = {};
  for (const name of SETUPS) {
    const why = {};
    for (const o of passed[name]) for (const x of o.spoilers) why[x.rule] = (why[x.rule] || 0) + 1;
    setups[name] = { ...judged(sliced(calls[name]), any), spoiled: { ...count(passed[name]), why } };
  }
  return { from, to, symbols, stanceFrom: vix ? "fund and fear gauge" : "fund only", setups, any };
}
