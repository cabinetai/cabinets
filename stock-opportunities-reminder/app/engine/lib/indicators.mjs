// Indicator maths over candles. A candle is { t, o, h, l, c, v }: t in seconds (UTC).
// Every function returns an array as long as its input, with null where there is not
// enough history yet, so index i always means "as of candle i".

const newYork = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" });
/** The New York date (YYYY-MM-DD) of a time in seconds: the day a US candle belongs to. */
export const nyDay = (t) => newYork.format(new Date(t * 1000));

const newYorkClock = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
/** Minutes after midnight on the New York clock, of a time in seconds. */
export function nyMinute(t) {
  const p = Object.fromEntries(newYorkClock.formatToParts(new Date(t * 1000)).map((x) => [x.type, +x.value]));
  return p.hour * 60 + p.minute;
}
/** When the US stock session opens and closes, in minutes after midnight in New York: 9:30 and 16:00. */
export const NY_OPEN = 570, NY_CLOSE = 960;

/** One day, in milliseconds. */
export const DAY_MS = 86400000;
/** "Heavy volume", wherever the method says it: this many times the usual. */
export const HEAVY_VOLUME = 1.5;

/** To two decimals, and to one. Null for what is not a number. */
export const r2 = (n) => (n == null || !isFinite(n) ? null : Math.round(n * 100) / 100);
export const r1 = (n) => (n == null || !isFinite(n) ? null : Math.round(n * 10) / 10);

export function sma(values, n) {
  const out = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= n) sum -= values[i - n];
    if (i >= n - 1) out[i] = sum / n;
  }
  return out;
}

export function ema(values, n) {
  const out = new Array(values.length).fill(null);
  if (values.length < n) return out;
  const k = 2 / (n + 1);
  let prev = 0;
  for (let i = 0; i < n; i++) prev += values[i];
  prev /= n;
  out[n - 1] = prev;
  for (let i = n; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/** RSI with Wilder's smoothing, the form every charting package shows. */
export function rsi(closes, n = 14) {
  const out = new Array(closes.length).fill(null);
  if (closes.length <= n) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= n; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  gain /= n; loss /= n;
  out[n] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  for (let i = n + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gain = (gain * (n - 1) + Math.max(d, 0)) / n;
    loss = (loss * (n - 1) + Math.max(-d, 0)) / n;
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

/** Average true range (Wilder): the typical size of one candle, gaps included. */
export function atr(candles, n = 14) {
  const out = new Array(candles.length).fill(null);
  if (candles.length <= n) return out;
  const tr = candles.map((c, i) => i === 0 ? c.h - c.l
    : Math.max(c.h - c.l, Math.abs(c.h - candles[i - 1].c), Math.abs(c.l - candles[i - 1].c)));
  let prev = 0;
  for (let i = 1; i <= n; i++) prev += tr[i];
  prev /= n;
  out[n] = prev;
  for (let i = n + 1; i < candles.length; i++) {
    prev = (prev * (n - 1) + tr[i]) / n;
    out[i] = prev;
  }
  return out;
}

export function macd(closes, fast = 12, slow = 26, signal = 9) {
  const f = ema(closes, fast), s = ema(closes, slow);
  const line = closes.map((_, i) => f[i] == null || s[i] == null ? null : f[i] - s[i]);
  const start = line.findIndex((v) => v != null);
  const sig = new Array(closes.length).fill(null);
  if (start >= 0) {
    const part = ema(line.slice(start), signal);
    for (let i = 0; i < part.length; i++) sig[start + i] = part[i];
  }
  return { line, signal: sig };
}

/** Bollinger band width as a share of the middle band: small means the price is coiled. */
export function bandWidth(closes, n = 20, k = 2) {
  const mid = sma(closes, n);
  return closes.map((_, i) => {
    if (mid[i] == null) return null;
    let sq = 0;
    for (let j = i - n + 1; j <= i; j++) sq += (closes[j] - mid[i]) ** 2;
    const sd = Math.sqrt(sq / n);
    return mid[i] === 0 ? null : (2 * k * sd) / mid[i];
  });
}

/** Highest high and lowest low of the n candles BEFORE index i (i itself left out). */
export function priorHigh(candles, i, n) {
  let m = -Infinity;
  for (let j = Math.max(0, i - n); j < i; j++) m = Math.max(m, candles[j].h);
  return m === -Infinity ? null : m;
}
export function priorLow(candles, i, n) {
  let m = Infinity;
  for (let j = Math.max(0, i - n); j < i; j++) m = Math.min(m, candles[j].l);
  return m === Infinity ? null : m;
}

/** Average volume of the n candles before index i. */
export function avgVolume(candles, i, n = 20) {
  let sum = 0, count = 0;
  for (let j = Math.max(0, i - n); j < i; j++) { sum += candles[j].v; count++; }
  return count ? sum / count : null;
}
