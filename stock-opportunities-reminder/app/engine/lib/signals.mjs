// The rules that decide a chart is worth a look. Each rule reads plain candles and
// answers with the numbers behind it, so nothing shown to the person is a guess.
// A rule with `on: false` is too noisy to flag a chart with, but its record is still kept.

import { sma, ema, rsi, atr, macd, bandWidth, priorHigh, priorLow, avgVolume, nyDay, r1, r2 } from "./indicators.mjs";

export const RULES = [
  { id: "breakout", name: "Breakout", side: "long", on: true, days: 20, volume: 1.5 },
  { id: "breakdown", name: "Breakdown", side: "short", on: true, days: 20, volume: 1.5 },
  { id: "high52", name: "New 52-week high", side: "long", on: true },
  { id: "low52", name: "New 52-week low", side: "short", on: true },
  { id: "gap", name: "Gap", side: "both", on: true, percent: 4 },
  { id: "volume", name: "Unusual volume", side: "both", on: true, times: 2 },
  { id: "bigMove", name: "Big move", side: "both", on: true, atrs: 2 },
  { id: "goldenCross", name: "Golden cross", side: "long", on: true },
  { id: "deathCross", name: "Death cross", side: "short", on: true },
  { id: "reclaim", name: "Back above a moving average", side: "long", on: true },
  { id: "lose", name: "Lost a moving average", side: "short", on: true },
  { id: "oversold", name: "Oversold", side: "long", on: true, level: 30 },
  { id: "overbought", name: "Overbought", side: "short", on: true, level: 70 },
  { id: "macdUp", name: "Momentum turned up", side: "long", on: false },
  { id: "macdDown", name: "Momentum turned down", side: "short", on: false },
  { id: "insideDay", name: "Inside day", side: "both", on: false },
  { id: "squeeze", name: "Squeeze", side: "both", on: true },
  { id: "bullFlag", name: "Bull flag", side: "long", on: true },
];

const pct = (a, b) => (b ? ((a - b) / b) * 100 : 0);
/** A rule reads the 20 days before today and the averages behind them: a chart shorter than this is not judged. */
export const SCAN_WARMUP = 30;

/**
 * Everything the facts are read from, worked out once for a chart: its averages, RSI and
 * usual daily move as of every candle, the New York day of each candle, and, when `fund`
 * (the S&P 500 fund's daily candles) is given, the fund's close on each of those days.
 */
export function series(candles, fund) {
  const closes = candles.map((c) => c.c), days = candles.map((c) => nyDay(c.t));
  let market = null;
  if (fund) {
    // The fund's newest close on or before each day, so a coin's weekend still has a market beside it.
    const fundDays = fund.map((c) => nyDay(c.t));
    let j = -1;
    market = days.map((d) => { while (j + 1 < fund.length && fundDays[j + 1] <= d) j++; return j < 0 ? null : fund[j].c; });
  }
  return { candles, closes, days, market, ema20: ema(closes, 20), sma50: sma(closes, 50), sma200: sma(closes, 200), rsi: rsi(closes, 14), atr: atr(candles, 14) };
}

/** The facts as of candle `i` of a `series`. Nothing after `i` is read. */
export function factsAt(s, i) {
  if (i < 1) return null;
  const last = s.candles[i];
  const s20 = s.ema20[i], s50 = s.sma50[i], s200 = s.sma200[i], a = s.atr[i], av = avgVolume(s.candles, i, 20);
  const hi = priorHigh(s.candles, i + 1, 252), lo = priorLow(s.candles, i + 1, 252);
  // The move over the last `n` candles in percent, null when history is short.
  const back = (line, n) => (line && i >= n && line[i - n] ? pct(line[i], line[i - n]) : null);
  const ahead = (n) => { const own = back(s.closes, n), fund = back(s.market, n); return own == null || fund == null ? null : r1(own - fund); };
  const own10 = back(s.closes, 10), fund10 = back(s.market, 10);
  return {
    close: r2(last.c),
    ema20: s20 && r2(s20), sma50: s50 && r2(s50), sma200: s200 && r2(s200),
    rsi: s.rsi[i] == null ? null : r1(s.rsi[i]),
    atr: a && r2(a), atrPercent: a ? r2((a / last.c) * 100) : null,
    rvol: av ? r2(last.v / av) : null,
    high52: hi, low52: lo, fromHigh: r1(pct(last.c, hi)),
    trend: s50 && s200 ? (last.c > s50 && s50 > s200 ? "up" : last.c < s50 && s50 < s200 ? "down" : "mixed") : null,
    // Its return over 1, 3 and 6 months of trading days, less the fund's over the same days.
    rs: s.market && { m1: ahead(21), m3: ahead(63), m6: ahead(126) },
    // The last 10 trading days, the stock beside the fund: what the "leader" setup compares.
    ten: own10 == null || fund10 == null ? null : { stock: r1(own10), market: r1(fund10) },
  };
}

/** Numbers about a symbol, counted from its daily candles: what the Scout reads as `facts`. `fund` is the S&P 500 fund's daily candles. */
export const facts = (candles, fund) => factsAt(series(candles, fund), candles.length - 1);

/**
 * A rule's hit as signals.json lists it. `day` is the New York day of the candle it was
 * read from, and the id carries it, so one hit is listed once on whatever day it is read.
 */
export const signalOf = (sym, name, hit, day, price, at) => ({
  id: `${sym}:${hit.rule}:${day}`, sym, name, kind: "chart", rule: hit.rule, side: hit.side, text: hit.text, level: hit.level ?? null, price, day, at,
});

/**
 * Daily rules, judged on the newest candle. `candles` are daily, oldest first; during
 * the session the last one is today so far.
 */
export function scanDaily(candles, rules) {
  const hits = [];
  const n = candles.length;
  if (n < SCAN_WARMUP) return hits;
  const on = Object.fromEntries(rules.filter((r) => r.on).map((r) => [r.id, r]));
  const closes = candles.map((c) => c.c);
  const i = n - 1, c = candles[i], p = candles[i - 1];
  const av = avgVolume(candles, i, 20);
  const rvol = av ? c.v / av : null;
  const add = (rule, side, text, extra) => hits.push({ rule, side, text, ...extra });

  if (on.breakout) {
    const top = priorHigh(candles, i, on.breakout.days);
    if (top && c.c > top && p.c <= top && rvol != null && rvol >= on.breakout.volume)
      add("breakout", "long", `Closed above its ${on.breakout.days}-day high of ${r2(top)} on ${r1(rvol)} times its usual volume.`, { level: r2(top) });
  }
  if (on.breakdown) {
    const bottom = priorLow(candles, i, on.breakdown.days);
    if (bottom && c.c < bottom && p.c >= bottom && rvol != null && rvol >= on.breakdown.volume)
      add("breakdown", "short", `Closed below its ${on.breakdown.days}-day low of ${r2(bottom)} on ${r1(rvol)} times its usual volume.`, { level: r2(bottom) });
  }
  if (n >= 252) {
    const top = priorHigh(candles, i, 251), bottom = priorLow(candles, i, 251);
    if (on.high52 && c.h > top && p.h <= priorHigh(candles, i - 1, 251)) add("high52", "long", `Rose to ${r2(c.h)}, above its highest price of the past year (${r2(top)}).`, { level: r2(top) });
    if (on.low52 && c.l < bottom && p.l >= priorLow(candles, i - 1, 251)) add("low52", "short", `Fell to ${r2(c.l)}, below its lowest price of the past year (${r2(bottom)}).`, { level: r2(bottom) });
  }
  if (on.gap) {
    const g = pct(c.o, p.c);
    if (Math.abs(g) >= on.gap.percent)
      add("gap", g > 0 ? "long" : "short", `Opened ${r1(Math.abs(g))}% ${g > 0 ? "above" : "below"} yesterday's close of ${r2(p.c)}.`, { level: r2(p.c) });
  }
  if (on.volume && rvol != null && rvol >= on.volume.times)
    add("volume", c.c >= p.c ? "long" : "short", `Trading ${r1(rvol)} times its usual volume, and the price is ${c.c >= p.c ? "up" : "down"} ${r1(Math.abs(pct(c.c, p.c)))}%.`);
  if (on.bigMove) {
    const a = atr(candles, 14)[i - 1];
    const move = c.c - p.c;
    if (a && Math.abs(move) >= on.bigMove.atrs * a)
      add("bigMove", move > 0 ? "long" : "short", `Moved ${r1(Math.abs(pct(c.c, p.c)))}% today, ${r1(Math.abs(move) / a)} times its usual daily move.`);
  }
  const s50 = sma(closes, 50), s200 = sma(closes, 200), e20 = ema(closes, 20);
  if (s50[i] != null && s200[i] != null && s50[i - 1] != null && s200[i - 1] != null) {
    if (on.goldenCross && s50[i] > s200[i] && s50[i - 1] <= s200[i - 1]) add("goldenCross", "long", "The 50-day average crossed above the 200-day average.");
    if (on.deathCross && s50[i] < s200[i] && s50[i - 1] >= s200[i - 1]) add("deathCross", "short", "The 50-day average crossed below the 200-day average.");
  }
  for (const [label, line] of [["200-day", s200], ["50-day", s50], ["20-day", e20]]) {
    if (line[i] == null || line[i - 1] == null) continue;
    if (on.reclaim && c.c > line[i] && p.c <= line[i - 1]) { add("reclaim", "long", `Closed back above its ${label} average at ${r2(line[i])}.`, { level: r2(line[i]) }); break; }
  }
  for (const [label, line] of [["200-day", s200], ["50-day", s50], ["20-day", e20]]) {
    if (line[i] == null || line[i - 1] == null) continue;
    if (on.lose && c.c < line[i] && p.c >= line[i - 1]) { add("lose", "short", `Closed below its ${label} average at ${r2(line[i])}.`, { level: r2(line[i]) }); break; }
  }
  const rs = rsi(closes, 14);
  if (rs[i] != null && rs[i - 1] != null) {
    if (on.oversold && rs[i] < on.oversold.level && rs[i - 1] >= on.oversold.level) add("oversold", "long", `RSI fell to ${r1(rs[i])}, under ${on.oversold.level}. Sellers may be tired, but it can stay low.`);
    if (on.overbought && rs[i] > on.overbought.level && rs[i - 1] <= on.overbought.level) add("overbought", "short", `RSI rose to ${r1(rs[i])}, over ${on.overbought.level}. Buyers may be stretched, but it can stay high.`);
  }
  if (on.macdUp || on.macdDown) {
    const m = macd(closes);
    if (m.signal[i] != null && m.signal[i - 1] != null) {
      if (on.macdUp && m.line[i] > m.signal[i] && m.line[i - 1] <= m.signal[i - 1]) add("macdUp", "long", "MACD crossed above its signal line.");
      if (on.macdDown && m.line[i] < m.signal[i] && m.line[i - 1] >= m.signal[i - 1]) add("macdDown", "short", "MACD crossed below its signal line.");
    }
  }
  if (on.insideDay && c.h < p.h && c.l > p.l)
    add("insideDay", "both", `Stayed inside yesterday's range of ${r2(p.l)} to ${r2(p.h)}. A break of either side is the trigger.`, { level: r2(p.h), level2: r2(p.l) });
  if (on.squeeze && n >= 140) {
    const w = bandWidth(closes, 20, 2);
    let min = Infinity;
    for (let j = i - 119; j < i; j++) if (w[j] != null) min = Math.min(min, w[j]);
    if (w[i] != null && w[i] <= min && !(w[i - 1] != null && w[i - 1] <= min))
      add("squeeze", "both", "Its daily range is the tightest in 120 days. Tight ranges often end in a strong move, in either direction.");
  }
  if (on.bullFlag) {
    const flag = bullFlag(candles);
    if (flag) add("bullFlag", "long", `Ran up ${r1(flag.run)}% and has rested for ${flag.rest} days on lighter volume. A close above ${r2(flag.top)} is the trigger.`, { level: r2(flag.top) });
  }
  return hits;
}

/** A sharp run, then 3 to 10 quiet days that give back less than half of it. */
function bullFlag(candles) {
  const i = candles.length - 1;
  for (let rest = 3; rest <= 10; rest++) {
    const poleEnd = i - rest;
    for (let pole = 3; pole <= 10; pole++) {
      const start = poleEnd - pole;
      if (start < 20) continue;
      const base = candles[start].c, peak = Math.max(...candles.slice(start, poleEnd + 1).map((c) => c.h));
      const run = pct(peak, base);
      if (run < 15) continue;
      const flag = candles.slice(poleEnd + 1, i + 1);
      const low = Math.min(...flag.map((c) => c.l)), top = Math.max(...flag.map((c) => c.h));
      if (top > peak || low < peak - (peak - base) * 0.5) continue;
      const vol = (list) => list.reduce((s, c) => s + c.v, 0) / list.length;
      if (vol(flag) >= vol(candles.slice(start, poleEnd + 1))) continue;
      // Report it once: on the third quiet day.
      if (rest !== 3) return null;
      return { run, rest, top: peak };
    }
  }
  return null;
}
