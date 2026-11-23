// Checks one day of the Scout's calls against the method's hard rules, before the Scout
// finishes. It follows the calls with the same code as the refresh, so what it says of a
// call is what outcomes.json will say. It also holds the day's file against
// candidates.json, which only this check can do: the candidates are scanned again later in
// the day, and a call that was right in the morning must not be told off for that.
//
//   node app/engine/check-calls.mjs [YYYY-MM-DD]     default: today in New York
//
// One line for each call: OK, or each problem as a sentence. Exit 0 when every call is OK,
// 2 when anything needs fixing.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { CALLS_DIR, readData, readCandles } from "./lib/io.mjs";
import { nyDay } from "./lib/indicators.mjs";
import { readDay, readCalls, follow } from "./lib/calls.mjs";
import { STANCES, MOST_CALLS, harsher } from "./lib/market.mjs";
import { verdictFor } from "./lib/verdict.mjs";

// Conviction 3 opens for a setup when the Scout's own scorecard holds this many finished calls of it, averaging above zero.
const PROVEN_CALLS = 20;

/**
 * What the method says of one call that candidates.json can decide: it is a candidate of
 * the day, with the candidate's numbers and no reason to pass. `items` are the candidates.
 */
function againstCandidates(call, items) {
  const same = items.filter((x) => x.sym === call.sym), match = same.find((x) => x.setup === call.setup);
  if (!same.length) return [`${call.sym} is not in candidates.json. A call is always one of its items: remove this one.`];
  if (!match) return [`candidates.json has ${call.sym} as "${same.map((x) => x.setup).join('" and as "')}", not as "${call.setup ?? ""}".`];
  const why = match.spoilers.map((x) => `Its candidate has a reason to pass. ${x.text}`);
  const numbers = (x) => JSON.stringify([x.buy, x.stop, x.target]);
  if (numbers(call) !== numbers(match)) why.push(`Its numbers are not the candidate's. candidates.json gives buy ${match.buy[0]} to ${match.buy[1]}, stop ${match.stop}, target ${match.target}. Copy them exactly.`);
  return why;
}

/** The lines to print for `day`, and whether all of it is in order. */
async function checkDay(day) {
  const file = /^\d{4}-\d{2}-\d{2}$/.test(day) ? await readDay(CALLS_DIR, day) : null;
  if (!file) return { ok: false, lines: [`opportunities/${day}.json is missing, or is not the shape playbooks/how-it-works.md gives.`] };
  // Every call up to that day is followed, to see a stock that was already held.
  const calls = (await readCalls(CALLS_DIR, Date.parse(day))).filter((c) => c.day <= day), daily = {};
  for (const sym of new Set(calls.map((c) => c.sym))) { const candles = await readCandles(sym); if (candles) daily[sym] = candles; }
  const [reports, record, now, outcomes, candidates] = await Promise.all(["reports.json", "setups.json", "market.json", "outcomes.json", "candidates.json"].map(readData));
  const market = now && now.regime ? { day: nyDay(Date.parse(now.at) / 1000), stance: now.regime.stance } : null;
  const { problems, score } = follow(calls, daily, { reports: reports && reports.bySym, record, market, was: outcomes ? outcomes.calls : [] });

  // What is wrong with the file as a whole.
  const whole = [];
  const stance = harsher(file.stance, market && market.day === day ? market.stance : null);
  if (!file.stance) whole.push(`\`market.stance\` is not one of ${STANCES.join(", ")}.`);
  if (stance && file.calls.length > MOST_CALLS[stance]) whole.push(`It holds ${file.calls.length} calls. A market that is ${stance.replace("-", " ")} allows ${MOST_CALLS[stance]} at most.`);
  // The candidates of a later day say nothing about this one: an older day is checked without them.
  const compared = candidates && candidates.day === day;
  if (!compared && !(candidates && candidates.day > day)) whole.push(`app/data/candidates.json is ${candidates ? `of ${candidates.day}` : "missing"}, so the calls cannot be held against it. Run node app/engine/refresh.mjs --full, then check again.`);

  const lines = whole.map((text) => `FILE  PROBLEM  ${text}`);
  let ok = !whole.length && !file.dropped.length, unproven = 0;
  for (const call of file.calls) {
    const why = [...(problems.find((p) => p.id === call.id) || { why: [] }).why];
    if (compared) why.push(...againstCandidates(call, candidates.items));
    const judged = record && verdictFor(record, call.setup, stance), mine = Object.hasOwn(score.bySetup, call.setup) ? score.bySetup[call.setup] : null;
    const proven = mine && mine.closed >= PROVEN_CALLS && mine.avgR > 0;
    if (![1, 2, ...(proven ? [3] : [])].includes(call.conviction))
      why.push(`\`conviction\` is ${JSON.stringify(call.conviction) ?? "missing"}. It is 1 or 2${call.conviction === 3 ? `: 3 opens when your own scorecard has ${PROVEN_CALLS} finished calls of this setup averaging above zero` : ""}.`);
    if (judged && judged.verdict === "unproven") {
      if (call.conviction !== 1) why.push(`The record of "${call.setup}" is unproven (setups.json), so its conviction is 1.`);
      if (++unproven > 1) why.push("It is the second call today of a setup whose record is unproven. One such call a day at most.");
    }
    if (!daily[call.sym]) lines.push(`${call.sym}  NOT FOLLOWED  No saved candles for it yet. Run node app/engine/refresh.mjs, then check again.`);
    else if (!why.length) lines.push(`${call.sym}  OK`);
    for (const text of why) lines.push(`${call.sym}  PROBLEM  ${text}`);
    if (why.length || !daily[call.sym]) ok = false;
  }
  for (const x of file.dropped) lines.push(`${x.sym}  DROPPED  ${x.why} The engine ignores this call until it is fixed.`);
  if (!file.calls.length && !file.dropped.length) lines.push("No calls in this file. Nothing to check.");
  return { ok, lines };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const day = process.argv[2] || nyDay(Date.now() / 1000);
  const { ok, lines } = await checkDay(day);
  console.log([`Calls of ${day}`, ...lines, ok ? "All in order." : "Fix what is listed above, then run this again."].join("\n"));
  process.exit(ok ? 0 : 2);
}
