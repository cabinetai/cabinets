// The desk's small server. Cabinet starts it when the page first asks, once the person
// has allowed this app, and passes every request through with a token. It answers what
// a file on disk cannot: a chart for any symbol at any size, a search, a refresh now,
// and keeping the person's own data key.

import http from "node:http";
import { candles, search, FRAMES } from "./lib/sources.mjs";
import { alpacaKey, saveAlpacaKey } from "./lib/keys.mjs";
import { accepts } from "./lib/alpaca.mjs";
import { refresh } from "./refresh.mjs";

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
const cleanSym = (s) => (/^[A-Za-z0-9.^=\-]{1,15}$/.test(s || "") ? s.toUpperCase() : null);
/** An error whose message is written for the person and is safe to show them. */
const refuse = (status, message) => Object.assign(new Error(message), { status });
// The refresh in flight, if any: `{ full, done }`.
let running = null;
function startRefresh(full) {
  const done = refresh({ full }).finally(() => { running = null; });
  running = { full, done };
  return done;
}
/** Cabinet says who is asking in a header it sets itself. By hand there is no Cabinet, and the person at the keyboard is the owner. */
function isOwner(req) {
  if (!TOKEN) return true;
  try { return JSON.parse(decodeURIComponent(req.headers["x-cabinet-user"] || "")).role === "owner"; } catch { return false; }
}

/** The JSON a request carries. Stops reading past 4 KB: a key pair is far smaller. */
async function readBody(req) {
  let text = "";
  for await (const chunk of req) {
    text += chunk;
    if (text.length > 4096) throw refuse(413, "That is too much to send.");
  }
  try { return JSON.parse(text); } catch { throw refuse(400, "That did not arrive in a form the desk can read."); }
}

/** Tests the pasted Alpaca key with one read, then keeps it. `pasted` null removes the key. */
async function setAlpacaKey(pasted) {
  const clean = (v) => (typeof v === "string" && /^[\x21-\x7e]{8,200}$/.test(v.trim()) ? v.trim() : null);
  const key = pasted && { id: clean(pasted.id), secret: clean(pasted.secret) };
  if (key && !(key.id && key.secret)) throw refuse(400, "Paste both the key ID and the secret key, exactly as Alpaca shows them.");
  if (key && !(await accepts(key).catch(() => { throw refuse(502, "Alpaca did not answer, so the key could not be checked. Try again in a moment."); })))
    throw refuse(400, "Alpaca did not accept this key. Check the key ID and the secret key, then try again.");
  await saveAlpacaKey(key).catch(() => { throw refuse(500, "The desk could not save the key on this computer."); });
  // Charts cached from the old source would hide the change.
  cache.clear();
}

const routes = {
  "/health": async () => ({ ok: true }),
  "/candles": async (q) => {
    const sym = cleanSym(q.get("sym")), frame = FRAMES[q.get("frame")] ? q.get("frame") : "1d";
    if (!sym) throw refuse(400, "That symbol does not look right.");
    const intraday = frame !== "1d" && frame !== "1w";
    const res = await keep(`${sym}:${frame}`, intraday ? 30000 : 120000, () => candles(sym, frame, { prePost: frame === "5m" }));
    return { sym, frame, source: res.source, meta: res.meta, c: res.candles.map((c) => [c.t, c.o, c.h, c.l, c.c, c.v]) };
  },
  "/search": async (q) => {
    const text = (q.get("q") || "").trim().slice(0, 40);
    return { results: text ? await keep(`s:${text.toLowerCase()}`, 600000, () => search(text)) : [] };
  },
  // One refresh at a time: a second press joins the first. A full one never settles for a
  // lighter one that is already running: it waits for it, then runs.
  "/refresh": async (q) => {
    const full = q.get("full") === "1";
    while (running && full && !running.full) await running.done.catch(() => {});
    return running ? running.done : startRefresh(full);
  },
  // GET says whether a key is kept, never the key. POST `{ alpaca: { id, secret } }` keeps one, `{ alpaca: null }` removes it.
  "/keys": async (_q, req) => {
    if (req.method === "POST") {
      if (!isOwner(req)) throw refuse(403, "Only the owner of this cabinet can change its keys.");
      const body = await readBody(req);
      const plain = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
      if (!plain(body) || !(body.alpaca === null || plain(body.alpaca))) throw refuse(400, "Nothing to save.");
      await setAlpacaKey(body.alpaca);
    }
    return { ok: true, alpaca: Boolean(await alpacaKey()) };
  },
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://desk");
  const send = (code, body) => { res.writeHead(code, { "content-type": "application/json", "cache-control": "no-store" }); res.end(JSON.stringify(body)); };
  if (TOKEN && req.headers["x-cabinet-app-token"] !== TOKEN) return send(403, { error: "Not allowed." });
  const route = routes[url.pathname.replace(/\/+$/, "") || "/health"];
  if (!route) return send(404, { error: "Not found." });
  try { send(200, await route(url.searchParams, req)); }
  catch (e) { send(e.status || 502, { error: e.status ? e.message : "The price source did not answer. Try again in a moment." }); }
});
server.listen(0, "127.0.0.1", () => {
  const { port } = server.address();
  if (typeof process.send === "function") process.send({ type: "ready", port });
  else console.log(`desk engine on http://127.0.0.1:${port}`);
});
