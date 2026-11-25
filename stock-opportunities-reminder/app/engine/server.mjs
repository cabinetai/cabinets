// The app's small server. Cabinet starts it when the page first asks, once the person
// has allowed this app, and passes every request through with a token. It answers what
// a file on disk cannot: daily candles for any symbol, a refresh now, and choosing when
// the Scout looks.

import http from "node:http";
import { candles, cleanSym } from "./lib/sources.mjs";
import { refresh } from "./refresh.mjs";
import { readSchedule, writeSchedule } from "./lib/schedule.mjs";

const TOKEN = process.env.CABINET_APP_TOKEN || "";
const cache = new Map();
const keep = (key, ms, make) => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ms) return hit.value;
  const value = make();
  cache.set(key, { at: Date.now(), value });
  value.catch(() => cache.delete(key));
  if (cache.size > 200) cache.delete(cache.keys().next().value);
  return value;
};
/** An error whose message is written for the person and is safe to show them. */
const refuse = (status, message) => Object.assign(new Error(message), { status });
// The refresh in flight, if any.
let running = null;
/** Cabinet says who is asking in a header it sets itself. By hand there is no Cabinet, and the person at the keyboard is the owner. */
function isOwner(req) {
  if (!TOKEN) return true;
  try { return JSON.parse(decodeURIComponent(req.headers["x-cabinet-user"] || "")).role === "owner"; } catch { return false; }
}
/** The JSON a request carries. Stops reading past 1 KB: a schedule is two short words. */
async function readBody(req) {
  let text = "";
  for await (const chunk of req) {
    text += chunk;
    if (text.length > 1024) throw refuse(413, "That is too much to send.");
  }
  try { return JSON.parse(text); } catch { throw refuse(400, "That did not arrive in a form the app can read."); }
}
const routes = {
  "/health": async () => ({ ok: true }),
  // Daily candles, the one size there is: whatever `frame` a caller names, the answer is `1d`.
  "/candles": async (q) => {
    const sym = cleanSym(q.get("sym"));
    if (!sym) throw refuse(400, "That symbol does not look right.");
    const res = await keep(sym, 120000, () => candles(sym));
    return { sym, frame: "1d", source: res.source, meta: res.meta, c: res.candles.map((c) => [c.t, c.o, c.h, c.l, c.c, c.v]) };
  },
  // One refresh at a time: a second request joins the first.
  "/refresh": async () => {
    running ||= refresh().finally(() => { running = null; });
    return running;
  },
  // GET says when the Scout looks. POST `{ days, time }` changes it: Cabinet re-reads the routine's file by itself.
  "/schedule": async (_q, req) => {
    if (req.method === "POST") {
      if (!isOwner(req)) throw refuse(403, "Only the owner of this cabinet can change when the Scout looks.");
      await writeSchedule(await readBody(req)).catch((e) => { throw e.status ? e : refuse(400, "Pick how often and a time, then try again."); });
    }
    return readSchedule();
  },
};

const server = http.createServer(async (req, res) => {
  const send = (code, body) => { res.writeHead(code, { "content-type": "application/json", "cache-control": "no-store" }); res.end(JSON.stringify(body)); };
  if (TOKEN && req.headers["x-cabinet-app-token"] !== TOKEN) return send(403, { error: "Not allowed." });
  // An address is parsed only for a caller with the token: a malformed one (`//[`) throws.
  if (!URL.canParse(req.url, "http://app")) return send(400, { error: "That address does not look right." });
  const url = new URL(req.url, "http://app");
  const route = routes[url.pathname.replace(/\/+$/, "") || "/health"];
  if (!route) return send(404, { error: "Not found." });
  try { send(200, await route(url.searchParams, req)); }
  catch (e) { send(e.status || 502, { error: e.status ? e.message : "The price source did not answer. Try again in a moment." }); }
});
server.listen(0, "127.0.0.1", () => {
  const { port } = server.address();
  if (typeof process.send === "function") process.send({ type: "ready", port });
  else console.log(`engine on http://127.0.0.1:${port}`);
});
