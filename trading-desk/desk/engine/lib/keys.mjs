// The person's own keys for outside data sources. Cabinet gives every app a private folder
// outside the cabinet's content (CABINET_APP_PRIVATE_DIR, open to the daemon's user only):
// the keys live there in keys.json, so they are never shared, synced or shown with the
// cabinet's pages. Run by hand there is no such folder, and the key comes from the
// environment instead. Nothing here logs a key or writes one anywhere else.

import fs from "node:fs/promises";
import path from "node:path";
import { readJson } from "./io.mjs";

const keysFile = () => (process.env.CABINET_APP_PRIVATE_DIR ? path.join(process.env.CABINET_APP_PRIVATE_DIR, "keys.json") : null);

/** The person's Alpaca key as `{ id, secret }`, or null when they have not given one. */
export async function alpacaKey() {
  const file = keysFile();
  const key = file ? (await readJson(file, {})).alpaca : { id: process.env.ALPACA_KEY_ID, secret: process.env.ALPACA_SECRET_KEY };
  return key && key.id && key.secret ? { id: key.id, secret: key.secret } : null;
}

/** Saves the Alpaca key, or removes it when `key` is null. The file is readable by its owner only. */
export async function saveAlpacaKey(key) {
  const file = keysFile();
  if (!file) throw new Error("No private folder to keep a key in");
  const all = await readJson(file, {});
  if (key) all.alpaca = { id: key.id, secret: key.secret }; else delete all.alpaca;
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(all), { mode: 0o600 });
  await fs.rename(tmp, file);
}
