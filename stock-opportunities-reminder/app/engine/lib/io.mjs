// Where the app keeps its files, and how the engine reads and writes them.
// The engine runs two ways: started by Cabinet from an allowed copy of this folder
// (then CABINET_APP_DIR names the app folder in the cabinet), or by hand or by an
// assistant with `node app/engine/refresh.mjs` (then the app folder is one up from here).

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const APP_DIR = process.env.CABINET_APP_DIR || path.resolve(here, "..", "..");
export const DATA_DIR = path.join(APP_DIR, "data");
/** Where the Scout writes its day files: at the cabinet's root, beside the app folder. */
export const CALLS_DIR = path.join(APP_DIR, "..", "opportunities");
const APP_PATH = process.env.CABINET_APP_PATH || "";

export async function readJson(file, fallback = null) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return fallback; }
}

const written = [];
/** Writes through a temporary file, so the page never reads half a file. */
export async function writeJson(name, value) {
  const file = path.join(DATA_DIR, name);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value));
  await fs.rename(tmp, file);
  written.push(name);
}
export const readData = (name) => readJson(path.join(DATA_DIR, name));

/** The refresh's lock file. Cabinet's five-minute job, the server and the Scout each run the refresh in a process of their own. */
export const LOCK = path.join(DATA_DIR, "refresh.lock");
// A refresh is stopped by Cabinet after four minutes, so a lock older than this was left behind.
const LOCK_STALE = 5 * 60 * 1000;
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };

/**
 * Takes the lock `file` for this process: a function that gives it back, or null while
 * another live process holds a fresh one. A lock whose process is gone, or that is older
 * than five minutes, is taken over.
 */
export async function lock(file) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  for (let tries = 0; tries < 2; tries++) {
    try {
      // "wx" fails when the file exists, so only one process can make it.
      await fs.writeFile(file, JSON.stringify({ pid: process.pid, at: new Date().toISOString() }), { flag: "wx" });
      return () => fs.rm(file, { force: true });
    } catch (e) { if (e.code !== "EEXIST") throw e; }
    // Its age is read off the file, not from inside it: the holder may not have written yet.
    const made = await fs.stat(file).then((st) => st.mtimeMs, () => 0), held = await readJson(file);
    if (Date.now() - made < LOCK_STALE && (!held || alive(held.pid))) return null;
    await fs.rm(file, { force: true });
  }
  return null;
}

/** Tells Cabinet which files changed, so open pages repaint. Prices are not worth a history entry each. */
export function announce() {
  if (!written.length) return;
  const paths = APP_PATH ? written.map((n) => `${APP_PATH}/data/${n}`) : [];
  written.length = 0;
  if (paths.length && typeof process.send === "function") {
    try { process.send({ type: "changed", paths, journalOnly: true }); } catch { /* the host went away */ }
  }
}

/** What the person keeps in the page: their list. */
export async function readStore() {
  const s = await readJson(path.join(APP_DIR, ".data", "shared.json"), {});
  return s && typeof s === "object" ? s : {};
}

/** Candle rows as they are kept on disk, `[time, open, high, low, close, volume]`, as candles. */
export const toCandles = (rows) => rows.map(([t, o, h, l, c, v]) => ({ t, o, h, l, c, v }));

/** A file name for a symbol: `BTC-USD` stays, `^VIX` and `ES=F` lose what a file system dislikes. */
const fileSym = (sym) => String(sym).toUpperCase().replace(/[^A-Z0-9.-]/g, "_");
/** A symbol's daily candle file, by its name inside `candles/` and inside the data folder. */
export const candleName = (sym) => `${fileSym(sym)}.1d.json`;
const candlePath = (sym) => `candles/${candleName(sym)}`;

/** A symbol's saved candle file as app/DATA.md gives it (`{ at, kind, c: rows, ... }`), or null when there is none. */
export async function readCandleFile(sym) {
  const file = await readData(candlePath(sym));
  return file && Array.isArray(file.c) ? file : null;
}
export const writeCandleFile = (sym, file) => writeJson(candlePath(sym), file);

/** A symbol's saved daily candles, oldest first, or null when there is no file for it. */
export async function readCandles(sym) {
  const file = await readCandleFile(sym);
  return file && toCandles(file.c);
}
