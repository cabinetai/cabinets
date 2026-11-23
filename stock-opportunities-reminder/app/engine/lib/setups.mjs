// The five setups of playbooks/method.md as code, the reasons to pass that arithmetic can
// decide (step 4), and how the numbers of a call are built (step 5). A detector reads a
// chart as of one candle and nothing after it, so the same code judges today and replays
// the past. Where the method leaves a choice open, the comment on the line says which was
// made, so the method can be written to match.
//
// Where each setup puts its stop and its target was chosen by replaying a declared grid of
// stops and targets over the first half of 14 months of about 100 large stocks, and keeping
// what scored best there. A gap on results had too few cases to choose by, so it keeps the
// levels its chart gives.

import { avgVolume, priorHigh, priorLow } from "./indicators.mjs";

export const SETUPS = ["Pullback in an uptrend", "Breakout from a base", "A leader holding up in a weak market", "A gap up on results that holds", "A turn after a washout"];
const [PULLBACK, BREAKOUT, LEADER, GAP, TURN] = SETUPS;

// A detector needs the 200-day average, so a chart younger than this fits no setup.
export const WARMUP = 200;
const DAY = 86400000;

// "A price a person would type": two decimals under 20 dollars, one under 100, whole above.
const unit = (p) => (p < 20 ? 0.01 : p < 100 ? 0.1 : 1);
const tidy = (n) => +n.toFixed(2);
const near = (p) => tidy(Math.round(p / unit(p)) * unit(p));
const down = (p) => tidy(Math.floor(p / unit(p) + 1e-9) * unit(p));
const up = (p) => tidy(Math.ceil(p / unit(p) - 1e-9) * unit(p));
const r1 = (n) => Math.round(n * 10) / 10;
const mean = (list, of) => list.reduce((s, x) => s + of(x), 0) / list.length;

/** What a call pays: the target's distance from the top of the buy zone, in stop-distances. */
const payOf = ({ buy, stop, target }) => Math.round(((target - buy[1]) / (buy[1] - stop)) * 100) / 100;

/** A target `times` the stop's distance above the top of the zone, rounded up so rounding cannot cost the pay. Twice is the lowest pay the method allows. */
const timesTheRisk = (times) => (top, stop) => up(top + times * (top - stop));

// The stop of a setup that names no level for it: this many usual daily moves under the top of the zone.
const STOP_MOVES = 1.5;

/**
 * Step 5: levels read off the chart, made into a call. The zone is cut to one usual daily
 * move `a` (from its bottom up). A `stop` read off the chart is moved down until it sits at
 * least `a` under the top of the zone; with none, the stop sits `STOP_MOVES` of them under
 * it. Every price is rounded, the stop down, so rounding never takes room away. `target`
 * is a price, or a function of the final top and stop. Null when the chart leaves no
 * target above the zone.
 */
function levels({ low, high, stop, target }, a) {
  const bottom = near(low);
  let top = Math.max(bottom, near(Math.min(high, low + a)));
  if (top - bottom > a) top = Math.max(bottom, down(bottom + a));
  let floor = down(stop == null ? top - STOP_MOVES * a : Math.min(stop, top - a));
  if (floor >= bottom) floor = tidy(bottom - unit(bottom));
  const aim = typeof target === "function" ? target(top, floor) : near(target);
  return floor > 0 && aim > top ? { buy: [bottom, top], stop: floor, target: aim } : null;
}

const candidate = (setup, raw, a, notes) => { const l = levels(raw, a); return l && { setup, ...l, notes }; };

/** 1. A strong stock rests on an average, on lighter volume than it rose on. */
function pullback({ candles }, i, f) {
  if (f.trend !== "up" || f.rsi < 40 || f.rsi > 60) return null;
  const a = f.atr, c = candles[i];
  // "A high in the last 20 days, then fell back": the highest high of the last 20 candles, at least two days old.
  let top = i - 19;
  for (let j = top; j <= i; j++) if (candles[j].h >= candles[top].h) top = j;
  if (i - top < 2) return null;
  // "Fell back to its average": today's low came within half a usual daily move of it (the
  // buy zone) and the close is not under it. When both averages fit, the one nearer the close.
  const rest = [["20-day", f.ema20], ["50-day", f.sma50]].filter(([, avg]) => c.l <= avg + a / 2 && c.c >= avg).sort((x, y) => y[1] - x[1])[0];
  if (!rest) return null;
  // "The days of the rise": the ten days that end on the day of the high.
  const fall = candles.slice(top + 1, i + 1), rise = candles.slice(top - 9, top + 1);
  const quieter = mean(fall, (x) => x.v) / mean(rise, (x) => x.v);
  const low = Math.min(...fall.map((x) => x.l));
  // A fall that went deeper than one and a half usual daily moves under the average is more than a rest.
  if (!(quieter < 1) || rest[1] - low > 1.5 * a) return null;
  return candidate(PULLBACK, { low: rest[1], high: rest[1] + a / 2, target: candles[top].h }, a, [
    `In an uptrend, resting on its ${rest[0]} average (${rest[1]}).`,
    `Fell from a high of ${tidy(candles[top].h)} made ${i - top} days ago, on ${Math.round(quieter * 100)}% of the volume of the rise.`,
    `RSI ${f.rsi}. The low of the pullback is ${tidy(low)}.`,
  ]);
}

/** 2. A quiet range near the highs, left on a heavy close. Fires on the day of the close above the range. */
function breakout({ candles }, i, f) {
  const a = f.atr, c = candles[i];
  // "At least three weeks moving sideways": the 15 candles before today, by their highs and
  // lows. Sideways is only the width of that range; a longer base is not looked for.
  const top = priorHigh(candles, i, 15), bottom = priorLow(candles, i, 15), width = ((top - bottom) / bottom) * 100;
  if (width > 15 || f.fromHigh < -10 || !(c.c > top) || !(f.rvol >= 1.5)) return null;
  const notes = [
    `Three weeks in a range of ${tidy(bottom)} to ${tidy(top)}, ${r1(width)}% wide, and ${Math.abs(f.fromHigh)}% under its 52-week high.`,
    `Closed above the range at ${f.close} on ${f.rvol} times its usual volume.`,
  ];
  if (c.c > top + a) notes.push(`Already ${tidy(c.c - top)} above the range, more than one usual daily move (${a}): it has to come back to the zone.`);
  return candidate(BREAKOUT, { low: top, high: top + a / 2, target: timesTheRisk(3) }, a, notes);
}

/** 3. A stock that refuses to fall with a falling market. */
function leader({ candles }, i, f, { stance }) {
  if (stance !== "mixed" && stance !== "against-you") return null;
  // "Fell less than half of what the fund fell, or rose" only means something when the fund fell.
  if (!f.ten || !(f.ten.market < 0) || !(f.ten.stock > f.ten.market / 2) || !(f.close > f.sma50)) return null;
  // "The 50-day average or the low of the last week, whichever is nearer" the close: both
  // are under the close, so it is the higher. The zone runs half a usual daily move up from it.
  const weekLow = priorLow(candles, i + 1, 5), level = Math.max(f.sma50, weekLow);
  return candidate(LEADER, { low: level, high: level + f.atr / 2, target: f.high52 }, f.atr, [
    `Over 10 days it moved ${f.ten.stock}% while the S&P 500 fund moved ${f.ten.market}%.`,
    `Above its 50-day average (${f.sma50}). The low of the last week is ${tidy(weekLow)}.`,
    `Its 52-week high is ${tidy(f.high52)}.`,
  ]);
}

/**
 * 4. A gap up on results that has held. `reports` is the days this stock's earnings first
 * traded, when the calendar is known; without it the gap is taken unconfirmed and says so.
 */
function gapOnResults({ candles, days }, i, f, { reports }) {
  for (let g = i; g > i - 5; g--) {
    const day = candles[g], prior = candles[g - 1].c, usual = avgVolume(candles, g, 20);
    if (!(day.o >= prior * 1.04) || !(day.v >= 2 * usual)) continue;
    // A report with no stated hour may be traded the same day or the next.
    if (reports && !reports.includes(days[g]) && !reports.includes(days[g - 1])) continue;
    if (candles.slice(g, i + 1).some((x) => x.c < day.l)) return null;
    // "Twice the distance from the zone to the stop", from the top of the zone, as pay is
    // measured. The 52-week high replaces it only when it is above the zone and nearer.
    const target = (top, stop) => { const twice = timesTheRisk(2)(top, stop), high = near(f.high52); return high > top && high < twice ? high : twice; };
    return candidate(GAP, { low: (day.h + day.l) / 2, high: day.h, stop: day.l, target }, f.atr, [
      `Opened ${r1(((day.o - prior) / prior) * 100)}% above the prior close on ${days[g]}, on ${r1(day.v / usual)} times its usual volume.`,
      reports ? "The calendar has its earnings report on that gap." : "No earnings calendar for that day: confirm the gap was on results.",
      `It has not closed under the low of that day (${tidy(day.l)}) since.`,
    ]);
  }
  return null;
}

/** 5. Oversold, then one strong day up. Fires on that day. */
function turn({ candles, rsi }, i, f) {
  const c = candles[i];
  if (!(c.c > c.o && c.c > candles[i - 1].h && f.rvol >= 1.5)) return null;
  // "RSI was under 30 within the last five days": on one of the five days before the turn day.
  const lowest = Math.min(...rsi.slice(i - 5, i).filter((v) => v != null));
  if (!(lowest < 30)) return null;
  // "The low of the washout": the lowest low of those five days and the turn day.
  const washout = priorLow(candles, i + 1, 6);
  return candidate(TURN, { low: (c.h + c.l) / 2, high: c.h, target: timesTheRisk(2) }, f.atr, [
    `RSI was ${r1(lowest)} within the last five days.`,
    `Today closed at ${f.close}, above its open and above yesterday's high of ${tidy(candles[i - 1].h)}, on ${f.rvol} times its usual volume.`,
    `The price is ${f.close > f.sma200 ? "still above" : "under"} its 200-day average (${f.sma200}). The low of the washout is ${tidy(washout)}.`,
  ]);
}

const DETECTORS = [pullback, breakout, leader, gapOnResults, turn];

/** How many weekdays lie after `from` up to and including `to` (both YYYY-MM-DD). Market holidays are not known here. */
function sessionsBetween(from, to) {
  let n = 0;
  for (let t = Date.parse(from) + DAY; t <= Date.parse(to); t += DAY) if (![0, 6].includes(new Date(t).getUTCDay())) n++;
  return n;
}

// The usual daily move drifts a little from one day to the next, and a call's levels are
// rounded. A call is only told off when it is plainly inside a limit: by a tenth.
const SLACK = 0.1;

/**
 * The hard rules of the method a set of levels can break: `[{ rule, text }]`, empty when
 * it breaks none. `atr` is the usual daily move, `reports` the days this stock's earnings
 * first trade (null when no calendar is known), `day` the day of the call.
 */
export function broken(call, { atr, reports, day }) {
  const [low, high] = call.buy, room = high - call.stop, out = [];
  const say = (rule, text) => out.push({ rule, text });
  if (atr && room < atr * (1 - SLACK)) say("room", `The stop is ${tidy(room)} under the top of the buy zone, nearer than one usual daily move (${atr}). An ordinary day would hit it: ${down(high - atr)} or lower gives it room.`);
  if (atr && high - low > atr * (1 + SLACK)) say("zone", `The buy zone is ${tidy(high - low)} wide, wider than one usual daily move (${atr}).`);
  if (payOf(call) < 2) say("pay", `From the top of the buy zone the target is ${tidy(call.target - high)} away and the stop ${tidy(room)} away. That pays ${payOf(call)} to 1, under 2 to 1.`);
  if ((low - call.stop) / low > 0.08) say("far", `The stop is ${r1(((low - call.stop) / low) * 100)}% under the buy zone, more than 8%.`);
  // A gap on results is built on a report that has just traded, so that day is not ahead of it.
  const soon = (reports || []).find((d) => d >= day && sessionsBetween(day, d) <= 5 && !(d === day && call.setup === GAP));
  if (soon) say("earnings", `Its earnings report trades on ${soon}, ${sessionsBetween(day, soon)} trading days after ${day}. A stop does not protect against a gap.`);
  return out;
}

/**
 * Step 4, as far as arithmetic can decide it: the hard rules, stretched above the 20-day
 * average, and a ceiling between the zone and the target. `facts` are the chart's facts on
 * the day; `recentHigh` is the highest high of the 20 days before it (today's own high is
 * the move itself, not a ceiling). Bad news and the rule's record stay with the Scout.
 */
export function spoilers(found, { facts: f, recentHigh, reports, day }) {
  const top = found.buy[1], room = top - found.stop, out = broken(found, { atr: f.atr, reports, day });
  if (f.close > f.ema20 + 2 * f.atr)
    out.push({ rule: "stretched", text: `The price (${f.close}) is ${r1((f.close - f.ema20) / f.atr)} usual daily moves above its 20-day average (${f.ema20}), more than two.` });
  const ceiling = [["200-day average", f.sma200], ["high of the last 20 days", recentHigh]].find(([, at]) => at > top && at < found.target && at - top < room);
  if (ceiling) out.push({ rule: "ceiling", text: `Its ${ceiling[0]} (${tidy(ceiling[1])}) is ${tidy(ceiling[1] - top)} above the buy zone, nearer than the stop is far (${tidy(room)}).` });
  return out;
}

/**
 * Every setup the chart fits as of candle `i`, each with its pay and its reasons to pass.
 * `f` is `factsAt(s, i)`. `stance` is the market's that day, `reports` and `day` as `broken` takes them.
 */
export function detect(s, i, f, { stance, reports, day }) {
  if (i < WARMUP || !f || !f.atr) return [];
  const about = { facts: f, recentHigh: priorHigh(s.candles, i, 20), reports, day };
  return DETECTORS.map((fits) => fits(s, i, f, { stance, reports })).filter(Boolean)
    .map((found) => ({ ...found, pay: payOf(found), spoilers: spoilers(found, about) }));
}

/**
 * The plainest call the method allows, on any day and for no reason: a zone half a usual
 * daily move deep under the close, the nearest stop allowed and the lowest pay allowed.
 * It is the yardstick a setup has to beat.
 */
export const anyDay = (f) => candidate("Any day", { low: f.close - f.atr / 2, high: f.close, stop: f.close - f.atr, target: timesTheRisk(2) }, f.atr, []);
