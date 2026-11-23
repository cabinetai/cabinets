// When the Scout looks. The person picks how often and at what time on the page; this turns
// the choice into the cron line of the routine's own file, which Cabinet watches and re-reads.
// Cabinet runs a routine by the clock of the computer it runs on, so the time is in that zone.

import fs from "node:fs/promises";
import path from "node:path";
import { APP_DIR } from "./io.mjs";

const ROUTINE = path.join(APP_DIR, "..", ".jobs", "find-opportunities.yaml");
// How often, as the page names it, and as cron writes the day of the week (0 is Sunday).
const DAYS = { weekdays: "1-5", daily: "*", 0: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6" };
// The routine's schedule line: `schedule:` at the start of a line, the value (in quotes or
// bare), and a trailing `# comment`, each kept apart so only the value is ever rewritten.
const LINE = /^(schedule:[ \t]*)(["']?)(.*?)\2((?:[ \t]+#.*)?[ \t]*)$/m;

/** `{ days, time }` as a cron line, or null when either is not one the page offers. `time` is "HH:MM". */
export function toCron({ days, time } = {}) {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time || "");
  return m && Object.hasOwn(DAYS, days) ? `${+m[2]} ${+m[1]} * * ${DAYS[days]}` : null;
}

/** The reverse. Null for a schedule the page could not have written, such as one typed in Cabinet's own routine editor. */
export function fromCron(cron) {
  const m = /^(\d{1,2}) (\d{1,2}) \* \* (\*|1-5|[0-6])$/.exec(String(cron).trim());
  if (!m || +m[1] > 59 || +m[2] > 23) return null;
  return { days: Object.keys(DAYS).find((k) => DAYS[k] === m[3]), time: `${m[2].padStart(2, "0")}:${m[1].padStart(2, "0")}` };
}

/** When the routine runs now: `{ days, time, zone }`, or `{ custom, zone }` for a schedule the page does not offer. */
export async function readSchedule(file = ROUTINE) {
  const found = LINE.exec(await fs.readFile(file, "utf8"));
  const cron = found ? found[3].trim() : "";
  return { ...(fromCron(cron) || { custom: cron }), zone: Intl.DateTimeFormat().resolvedOptions().timeZone };
}

/** Sets when the routine runs. Only the schedule line of its file changes. Throws on a choice the page does not offer. */
export async function writeSchedule(choice, file = ROUTINE) {
  const cron = toCron(choice);
  if (!cron) throw new Error("Not a schedule this page offers");
  const text = await fs.readFile(file, "utf8");
  if (!LINE.test(text)) throw new Error("The routine has no schedule line");
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, text.replace(LINE, (_line, head, quote, _value, tail) => head + quote + cron + quote + tail));
  await fs.rename(tmp, file);
}
