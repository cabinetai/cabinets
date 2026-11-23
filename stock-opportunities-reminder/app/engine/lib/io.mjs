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
export const readData = (name, fallback = null) => readJson(path.join(DATA_DIR, name), fallback);

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

/** A file name for a symbol: `BTC-USD` stays, `^VIX` and `ES=F` lose what a file system dislikes. */
export const fileSym = (sym) => String(sym).toUpperCase().replace(/[^A-Z0-9.-]/g, "_");
