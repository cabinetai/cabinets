import { readFile } from "node:fs/promises";
import path from "node:path";

const ROSTER_PATH = path.join(process.cwd(), "competitors", ".roster.json");

/** The tracked competitor set. `[]` (the shipped default) means onboarding
 *  hasn't happened yet — callers should treat that as "nothing to do", not
 *  an error. */
export async function readRoster() {
  try {
    const raw = await readFile(ROSTER_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Tier 1 is swept every run; Tier 2 only when the sweep runs on a Monday
 *  (host-local), matching the weekly cadence the roster promises. */
export function dueToday(roster, { now = new Date() } = {}) {
  const isMonday = now.getDay() === 1;
  return roster.filter((c) => c.tier === 1 || (c.tier === 2 && isMonday));
}

/** Every {kind, url} pair a competitor entry declares under `pages`. */
export function pagesOf(competitor) {
  return Object.entries(competitor.pages ?? {})
    .filter(([, url]) => typeof url === "string" && url.trim())
    .map(([kind, url]) => ({ kind, url }));
}
