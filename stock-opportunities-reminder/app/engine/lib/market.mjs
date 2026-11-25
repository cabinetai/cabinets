// The market's stance, counted as step 1 of playbooks/method.md describes it: the S&P 500
// fund's trend, the fear gauge, and whether today was a hard fall on heavy volume. The Scout
// starts from this and may only make it stricter.

import { factsAt } from "./signals.mjs";
import { HEAVY_VOLUME, r2 } from "./indicators.mjs";

/** The three stances, from the kindest market to the harshest. */
export const STANCES = ["with-you", "mixed", "against-you"];
/** The harsher of two stances. One that is not known (null) leaves the other. */
export const harsher = (a, b) => STANCES[Math.max(STANCES.indexOf(a), STANCES.indexOf(b))] ?? null;
/** How many calls a day each stance allows. */
export const MOST_CALLS = { "with-you": 3, mixed: 2, "against-you": 1 };

// The method's own numbers. The stance turns on 20 and 25; the word for the fear gauge
// (`fear.read`) on 18 and 25, so "uneasy" starts a little before the stance changes.
const CALM_UNDER = 18, FRIGHTENED_OVER = 25, WITH_YOU_UNDER = 20;
const BROAD_STRENGTH = 60, BROAD_WEAKNESS = 40;
// A hard fall is more than this many usual daily moves down in one day, on heavy volume.
const HARD_FALL_MOVES = 2;

/**
 * How many of `list` (the facts of the person's US stocks) close above their 50-day and
 * their 200-day average, in percent. A stock too young to have the average is not counted.
 */
export function breadth(list) {
  const share = (avg) => {
    const have = list.filter((f) => f[avg] != null);
    return have.length ? Math.round((have.filter((f) => f.close > f[avg]).length / have.length) * 100) : null;
  };
  return { stocks: list.length, above50: share("sma50"), above200: share("sma200") };
}

/**
 * The stance as of candle `i` of the fund's `series`. `vix` is the fear gauge's level, or
 * null when it is not known: then the fund alone decides. `spread` is `breadth()` of the
 * list. Step 1 asks about it but names no stance by it, so it is reported and does not decide.
 */
export function regime(fund, i, vix = null, spread = null) {
  const f = factsAt(fund, i);
  if (!f) return null;
  const prev = fund.candles[i - 1].c, change = ((fund.candles[i].c - prev) / prev) * 100;
  // The usual daily move as it stood before today, so a hard fall is not measured against itself.
  const usual = fund.atr[i - 1] ? (fund.atr[i - 1] / prev) * 100 : null;
  const hardFall = usual != null && change < -HARD_FALL_MOVES * usual && f.rvol >= HEAVY_VOLUME;
  const under200 = f.sma200 != null && f.close < f.sma200;
  const stance = under200 || vix > FRIGHTENED_OVER || hardFall ? "against-you"
    : f.trend === "up" && (vix == null || vix < WITH_YOU_UNDER) ? "with-you" : "mixed";

  const because = [
    f.sma200 == null ? "The S&P 500 fund has too little history for a 200-day average."
      : under200 ? `The S&P 500 fund closed at ${f.close}, under its 200-day average of ${f.sma200}.`
      : f.trend === "up" ? `The S&P 500 fund is in an uptrend: it closed at ${f.close}, above its 50-day average of ${f.sma50}, which is above its 200-day of ${f.sma200}.`
      : `The S&P 500 fund closed at ${f.close}, above its 200-day average of ${f.sma200} but not in an uptrend (50-day average ${f.sma50}).`,
  ];
  const fear = vix == null ? null : { level: vix, read: vix < CALM_UNDER ? "calm" : vix <= FRIGHTENED_OVER ? "uneasy" : "frightened" };
  if (fear) because.push(`The fear gauge is at ${vix}: ${fear.read}.`);
  if (hardFall) because.push(`The fund fell ${Math.abs(change).toFixed(1)}% today, more than twice its usual daily move of ${usual.toFixed(1)}%, on ${f.rvol} times its usual volume.`);
  if (spread && spread.above50 != null)
    because.push(`${spread.above50}% of the ${spread.stocks} listed stocks closed above their 50-day average: ${spread.above50 > BROAD_STRENGTH ? "broad strength" : spread.above50 < BROAD_WEAKNESS ? "broad weakness" : "neither broad strength nor broad weakness"}.`);

  return {
    stance, because,
    fund: { close: f.close, sma50: f.sma50, sma200: f.sma200, trend: f.trend, change: r2(change), usualMove: r2(usual), rvol: f.rvol, hardFall },
    fear, breadth: spread,
  };
}
