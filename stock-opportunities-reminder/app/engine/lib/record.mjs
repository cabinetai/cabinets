// A rule's track record: every day in the saved daily candles on which a rule would have
// fired, and where the price was 5, 10 and 20 trading days later. It is the same arithmetic
// the alerts use, run over the past, so a person can see whether a rule has earned their
// attention on their own list before they trust it. It costs no AI.
//
// Every number is set beside "any day": the same measure over every day of the same charts.
// A rule that is up 58% of the time is no edge when any day was up 56% of the time.

import { scanDaily } from "./signals.mjs";

const HORIZONS = [5, 10, 20];
// scanDaily needs this many candles before it judges anything.
const WARMUP = 30;

const r1 = (n) => (n == null || !isFinite(n) ? null : Math.round(n * 10) / 10);
const median = (a) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const move = (candles, i, h) => ((candles[i + h].c - candles[i].c) / candles[i].c) * 100;

/** One horizon's summary. `way` is +1 for a long read, -1 for a short one, 0 for "either way". */
function sum(moves, way) {
  if (!moves.length) return { n: 0 };
  if (!way) {
    const size = moves.map(Math.abs);
    return { n: moves.length, size: r1(size.reduce((s, x) => s + x, 0) / size.length) };
  }
  const got = moves.map((m) => m * way);
  return { n: got.length, won: r1((got.filter((m) => m > 0).length / got.length) * 100), avg: r1(got.reduce((s, x) => s + x, 0) / got.length), median: r1(median(got)) };
}

/**
 * The record of every daily rule over `bySym` ({ SYMBOL: daily candles, oldest first }).
 * Every rule is judged, the ones too noisy to flag a chart with too.
 */
export function ruleRecord(bySym, rules, horizons = HORIZONS) {
  const daily = rules.map((r) => ({ ...r, on: true }));
  const fired = Object.fromEntries(daily.map((r) => [r.id, []]));
  const any = Object.fromEntries(horizons.map((h) => [h, []]));
  let from = null, to = null;

  for (const [sym, candles] of Object.entries(bySym)) {
    if (!Array.isArray(candles) || candles.length <= WARMUP) continue;
    const n = candles.length;
    if (from == null || candles[WARMUP].t < from) from = candles[WARMUP].t;
    if (to == null || candles[n - 1].t > to) to = candles[n - 1].t;
    for (let i = WARMUP; i < n; i++) {
      for (const h of horizons) if (i + h < n) any[h].push(move(candles, i, h));
      for (const hit of scanDaily(candles.slice(0, i + 1), daily)) {
        const later = {};
        for (const h of horizons) if (i + h < n) later[h] = move(candles, i, h);
        fired[hit.rule].push({ sym, i, side: hit.side, later });
      }
    }
  }

  // "Any day", for each way of reading: up, down, and the size of the move.
  const base = {};
  for (const hz of horizons) {
    const list = any[hz], up = sum(list, 1), size = sum(list, 0);
    const down = list.length ? r1((list.filter((m) => m < 0).length / list.length) * 100) : null;
    base[hz] = { n: up.n, up: up.won, down, avg: up.avg, size: size.size };
  }

  const out = {};
  for (const r of daily) {
    const hits = fired[r.id];
    const way = (x) => (x.side === "long" ? 1 : x.side === "short" ? -1 : 0);
    const h = {};
    for (const hz of horizons) {
      const done = hits.filter((x) => x.later[hz] != null);
      // A rule that reads either way ("both") can still name a side on one day (a gap up is long).
      // Each day is judged by the side it named that day; a day with no side is judged by size.
      const sided = done.filter((x) => way(x)), plain = done.filter((x) => !way(x));
      if (sided.length >= plain.length) {
        // "Any day" read the same way: as often long and short as this rule was.
        const longs = sided.filter((x) => way(x) > 0).length / (sided.length || 1), b = base[hz];
        const anyWon = b.n ? r1(longs * b.up + (1 - longs) * b.down) : null, anyAvg = b.n ? r1((2 * longs - 1) * b.avg) : null;
        h[hz] = { ...sum(sided.map((x) => x.later[hz] * way(x)), 1), read: "way", anyWon, anyAvg };
      } else h[hz] = { ...sum(plain.map((x) => x.later[hz]), 0), read: "size", anySize: base[hz].size };
    }
    const bySym10 = {};
    for (const x of hits) {
      if (x.later[10] == null) continue;
      (bySym10[x.sym] = bySym10[x.sym] || []).push(way(x) ? x.later[10] * way(x) : Math.abs(x.later[10]));
    }
    out[r.id] = {
      fired: hits.length,
      h,
      bySym: Object.fromEntries(Object.entries(bySym10).map(([s, m]) => [s, { n: m.length, avg: r1(m.reduce((a, b) => a + b, 0) / m.length) }])),
    };
  }

  return {
    from: from == null ? null : new Date(from * 1000).toISOString().slice(0, 10),
    to: to == null ? null : new Date(to * 1000).toISOString().slice(0, 10),
    symbols: Object.keys(bySym).filter((s) => Array.isArray(bySym[s]) && bySym[s].length > WARMUP),
    horizons,
    rules: out,
    any: base,
  };
}

/** What the record depends on, so a refresh knows when it is out of date. */
export const recordKey = (rules, syms) => JSON.stringify([rules.map(({ on, ...r }) => r), [...syms].sort()]);
