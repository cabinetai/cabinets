// Checks an order against the person's own limits before an assistant shows it. Run from
// the cabinet root:
//
//   node desk/engine/check-order.mjs --sym NVDA --side long --qty 70 --entry 152.4 --stop 148.9 [--target 161] [--mult 1]
//
// Prints what it found, then the same as JSON on the last line. Exits 0 when the order is
// within the limits and 2 when it is not: then it must not be shown or placed.

import path from "node:path";
import { APP_DIR, readData, readJson, readStore } from "./lib/io.mjs";
import { checkOrder } from "./lib/risk.mjs";

const args = process.argv.slice(2);
const arg = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const sym = String(arg("sym") || "").toUpperCase();
if (!sym) {
  console.error("Name the order: --sym, --side, --qty, --entry and --stop.");
  process.exit(1);
}

const store = await readStore();
const journal = await readJson(path.join(APP_DIR, "..", "journal", "trades.json"), null);
const market = (await readData("market.json")) || { quotes: {} };
const out = checkOrder({
  store,
  imported: journal && Array.isArray(journal.trades) ? journal.trades : [],
  quote: market.quotes[sym] || null,
  order: { sym, side: arg("side"), qty: arg("qty"), entry: arg("entry"), stop: arg("stop"), target: arg("target"), mult: arg("mult") },
});

console.log(out.ok ? "Within your limits." : "Outside your limits. Do not show or place this order.");
for (const s of out.stops) console.log(`STOP: ${s}`);
for (const w of out.warns) console.log(`NOTE: ${w}`);
console.log(JSON.stringify(out));
process.exit(out.ok ? 0 : 2);
