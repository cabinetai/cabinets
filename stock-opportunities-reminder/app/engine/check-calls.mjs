// Checks one day of the Scout's calls against the method's hard rules, before the Scout
// finishes. It reads the same files and uses the same code as the refresh, so what it
// prints is what outcomes.json will say.
//
//   node app/engine/check-calls.mjs [YYYY-MM-DD]     default: today in New York
//
// One line for each call: OK, or each problem as a sentence. Exit 0 when every call is OK,
// 2 when anything needs fixing.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { APP_DIR, readData, readCandles } from "./lib/io.mjs";
import { nyDay } from "./lib/indicators.mjs";
import { readDay, readCalls, follow } from "./lib/calls.mjs";

/** The lines to print for `day`, and whether all of it is in order. */
async function checkDay(day, dir = path.join(APP_DIR, "..", "opportunities")) {
  const file = /^\d{4}-\d{2}-\d{2}$/.test(day) ? await readDay(dir, day) : null;
  if (!file) return { ok: false, lines: [`opportunities/${day}.json is missing, or is not the shape playbooks/how-it-works.md gives.`] };
  // Every call up to that day is followed, to see a stock that was already held.
  const calls = await readCalls(dir, Date.parse(day)), daily = {};
  for (const sym of new Set(calls.map((c) => c.sym))) { const candles = await readCandles(sym); if (candles) daily[sym] = candles; }
  const reports = await readData("reports.json");
  const { problems } = follow(calls, daily, { reports: reports && reports.bySym, record: await readData("setups.json") });
  const lines = [];
  let ok = !file.dropped.length;
  for (const call of file.calls) {
    const why = (problems.find((p) => p.id === call.id) || { why: [] }).why;
    if (!daily[call.sym]) lines.push(`${call.sym}  NOT FOLLOWED  No saved candles for it yet. Run node app/engine/refresh.mjs, then check again.`);
    else if (!why.length) lines.push(`${call.sym}  OK`);
    for (const text of why) lines.push(`${call.sym}  PROBLEM  ${text}`);
    if (why.length || !daily[call.sym]) ok = false;
  }
  for (const x of file.dropped) lines.push(`${x.sym}  DROPPED  ${x.why} The engine ignores this call until it is fixed.`);
  if (!lines.length) lines.push("No calls in this file. Nothing to check.");
  return { ok, lines };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const day = process.argv[2] || nyDay(Date.now() / 1000);
  const { ok, lines } = await checkDay(day);
  console.log([`Calls of ${day}`, ...lines, ok ? "All in order." : "Fix what is listed above, then run this again."].join("\n"));
  process.exit(ok ? 0 : 2);
}
