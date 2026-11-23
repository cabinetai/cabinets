// The check an order must pass before an assistant may show it to the person: the person's
// own limits, worked out in code so that no model judges them. It reads the same profile and
// trades as the page's guard (desk/index.html, `guard()` and `calc()`); keep the two in step.

const r2 = (n) => Math.round(n * 100) / 100;
// The person's own calendar day, as the page's guard counts it: this runs on their computer.
const localDay = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

/** Every trade the person has: the desk's own copy wins over an imported one with the same id. */
export function allTrades(store, imported = []) {
  const own = Object.keys(store).filter((k) => k.startsWith("t:")).map((k) => store[k]).filter((t) => t && t.id);
  const ids = new Set(own.map((t) => t.id));
  return [...own, ...imported.filter((t) => t && t.id && !ids.has(t.id))].filter((t) => !t.deleted);
}

/** A closed trade's result in money and in R, measured from the stop it was opened with. */
function result(t) {
  const mult = +t.mult || 1, stop = t.stop0 != null ? +t.stop0 : t.stop != null ? +t.stop : null;
  const way = t.side === "short" ? -1 : 1;
  const pnl = t.entry != null && t.exit != null && t.qty ? (+t.exit - +t.entry) * way * +t.qty * mult - (+t.fees || 0) : null;
  const risk = t.entry != null && stop != null && t.qty ? Math.abs(+t.entry - stop) * +t.qty * mult : null;
  return { pnl, r: pnl != null && risk ? pnl / risk : null };
}

/**
 * `order`: { sym, side, qty, entry, stop, target?, mult? }. `quote` is the symbol's entry in
 * desk/data/market.json, when there is one. Answers { ok, stops, warns, numbers }: an order
 * with anything in `stops` must not be shown or placed.
 */
export function checkOrder({ store = {}, imported = [], quote = null, order, now = Date.now() }) {
  const p = { riskPct: 1, dayLossR: 3, ...(store.profile || {}) };
  const stops = [], warns = [];
  const side = order.side === "short" ? "short" : "long", way = side === "short" ? -1 : 1;
  const qty = +order.qty, entry = +order.entry, mult = +order.mult || 1;
  const stop = order.stop == null || order.stop === "" ? null : +order.stop;
  const target = order.target == null || order.target === "" ? null : +order.target;
  const money = (n) => `${p.currency || "$"}${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

  if (!(qty > 0) || !(entry > 0)) stops.push("The order needs a quantity and an entry price above zero.");
  if (stop == null || !isFinite(stop)) stops.push("The plan has no stop, so there is no way to know what it can lose.");
  else if ((entry - stop) * way <= 0) stops.push(`The stop at ${stop} is on the wrong side of the entry at ${entry} for a ${side}.`);

  const risk = stop != null && isFinite(stop) && entry > 0 && qty > 0 ? Math.abs(entry - stop) * qty * mult : null;
  const oneR = p.account && p.riskPct ? (+p.account * +p.riskPct) / 100 : null;
  const riskPct = risk != null && p.account ? (risk / +p.account) * 100 : null;
  if (!p.account) warns.push("No account size is set on the desk, so the risk cannot be checked as a share of the account.");
  // A tenth over the limit allows for rounding the size to whole shares.
  else if (riskPct != null && riskPct > +p.riskPct * 1.1)
    stops.push(`At the stop it loses ${money(risk)}, ${r2(riskPct)}% of the account. Your limit is ${p.riskPct}% a trade (${money(oneR)}).`);

  const today = localDay(now);
  const closedToday = allTrades(store, imported).filter((t) => t.status === "closed" && t.closedAt && localDay(t.closedAt) === today).sort((a, b) => (a.closedAt < b.closedAt ? 1 : -1));
  let dayR = 0, streak = 0, counting = true;
  for (const t of closedToday) {
    const res = result(t);
    dayR += res.r != null ? res.r : oneR && res.pnl != null ? res.pnl / oneR : 0;
    if (counting && res.pnl < 0) streak++; else counting = false;
  }
  if (dayR <= -p.dayLossR) stops.push(`You are down ${r2(-dayR)}R today. Your own limit is ${p.dayLossR}R a day.`);
  else if (streak >= 2) warns.push(`${streak} losses in a row today. The next trade is the one people regret.`);
  else if (dayR <= -p.dayLossR * 0.66) warns.push(`You are down ${r2(-dayR)}R today, close to your limit of ${p.dayLossR}R.`);

  const atr = quote && quote.facts && quote.facts.atr;
  if (atr && stop != null && Math.abs(entry - stop) < atr / 2) warns.push(`The stop is ${r2(Math.abs(entry - stop))} from the entry, inside half of a normal day's move (${r2(atr)}). An ordinary day can hit it.`);
  if (target != null && stop != null && entry !== stop) {
    const reward = Math.abs(target - entry) / Math.abs(entry - stop);
    if (reward < 2) warns.push(`The target pays ${r2(reward)} to 1. Below 2 to 1 it must win more than ${Math.round(100 / (1 + reward))}% of the time to break even.`);
  }
  if (quote && quote.earnings) warns.push(`${order.sym} reports earnings on ${quote.earnings.date}${quote.earnings.when ? ", " + quote.earnings.when : ""}.`);

  return { ok: !stops.length, stops, warns, numbers: { risk: risk == null ? null : r2(risk), riskPct: riskPct == null ? null : r2(riskPct), limitPct: +p.riskPct, oneR: oneR == null ? null : r2(oneR), dayR: r2(dayR), dayLimitR: +p.dayLossR } };
}
