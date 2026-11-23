// How the engine asks an outside source for anything: one request with a time limit,
// and a way to run many without sending a burst.

const UA = "Mozilla/5.0";
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));

/** One request. A refusal throws with `answered` set to the HTTP status; the message never holds a header. */
export async function get(url, { headers = {}, timeout = 12000, as = "json", method = "GET", body } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(url, { method, body, headers: { "User-Agent": UA, Accept: "*/*", ...headers }, signal: ctl.signal });
    if (!res.ok) throw Object.assign(new Error(`${new URL(url).host} answered ${res.status}`), { answered: res.status });
    return as === "text" ? await res.text() : await res.json();
  } finally { clearTimeout(timer); }
}

/** Runs `fn` over `items`, a few at a time, so no source sees a burst. Failures come back as null. */
export async function eachLimited(items, limit, fn) {
  const out = new Array(items.length).fill(null);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      try { out[i] = await fn(items[i], i); } catch { out[i] = null; }
      await sleep(120);
    }
  }));
  return out;
}
