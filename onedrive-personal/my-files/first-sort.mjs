#!/usr/bin/env node
// The first read's lines and profile, and every routine's files, written only through here so
// every number is counted from the saved OneDrive answers, never typed. Run it from anywhere:
//   node <app>/first-sort.mjs window                shell lines to eval: NOW TODAY YESTERDAY WEEK_END
//                                                   END7 FROM7 FROM30 FROM90 TO30 TO90 OFFSET TZ.
//                                                   Never type a date.
//   node <app>/first-sort.mjs start                 new data/reading.json and data/.work/
//   node <app>/first-sort.mjs count <file>...       the exact count in each saved answer
//   node <app>/first-sort.mjs push '<line>'         add one line (single quotes: "$" stays "$")
//   node <app>/first-sort.mjs gift @<file>          the one thing for the owner, shown while you read:
//                                                   {"kind":<one of CONFIG.gift.kinds>,"who","subject",
//                                                   "since","when","threadId","amount","was","gist",
//                                                   "count","unread"}; who, subject, since, when, threadId
//                                                   and amounts copied from a saved answer; on a calendar
//                                                   "eventId" (and "eventId2" for a clash): the helper
//                                                   takes title, time, guests and place from events.json
//   node <app>/first-sort.mjs profile @<file>       write data/profile.json from the JSON your script
//                                                   wrote into data/.work/ (counts are added here)
//   node <app>/first-sort.mjs latest @<file>        write data/latest.json from your script's file (times, today,
//                                                   arrived and timeZone set here)
//   node <app>/first-sort.mjs done                  mark the reading done, delete data/.work/
//   node <app>/first-sort.mjs save <name> @<file>   write data/sharing.json, data/dates.json or
//                                                   data/papers.json from your script's file, every file
//                                                   and quote checked
//   node <app>/first-sort.mjs clean                 delete data/.work/ at the end of a routine
// Every fileId in a file you hand over must be in a saved answer, and the helper sets the
// storage, the files changed in 7 days, each file's name, kind, size, folder and link itself.
//   node <app>/first-sort.mjs get <search>...      read OneDrive and save the answers in data/.work/:
//                                                   morning, first, sharing, papers, or one search by name
//   node <app>/first-sort.mjs read <fileId>         save one file's words as data/.work/doc-<fileId>.txt (.pdf, a picture)
//   node <app>/first-sort.mjs list <file>...        every file in a saved answer, one line each
// In a line, and in a string of the profile file:
//   {count:<file>|one|many}  the exact count and its word ("1 event", "4 events"); a +triage list
//                      asked for --max 20 is {count:<file>@20|..} (40 when left out), and a full
//                      list says "at least".
//   {sum:<file>}       the sum of a JSON list of amounts your script saved, such as
//                      ["₪289.00","₪200.00"]; each amount must be written in a saved answer.
//   {free:<file>}      Calendar: the first free stretch of 3 hours or more from now.
//   {evenings:<file>}  Calendar: free evenings (18:00 to 22:00) in the next 7 days.
//   {dates:<file>|one|many}  Calendar: birthdays and anniversaries in the next 30 days.
// A money amount typed straight into a line must be written, as it is, in a saved answer.
// A <file> is relative to data/.work/: a saved +triage or messages list answer, a --page-all
// answer (one JSON page per line), a calendar events answer, or empty (= 0).
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const CONFIG = /*CONFIG*/ {"schema":"onedrive-personal","drive":true,"counts":{"files":"files-all.ndjson"},"changed":"recent7.ndjson","storage":"about.json","latest":{"schema":"onedrive-personal/my-files@1","lanes":["recent","shared","big"]},"saves":["sharing","papers"],"gets":{"morning":["about","recent7","mine","shared","big"],"first":["about","recent7","mine","shared","big","files-all","media-all","folders","anyone","find-papers"],"sharing":["about","anyone"],"papers":["about","find-papers"]},"gift":{"kinds":{"open":["file"],"shared":["who","file","since"],"space":[],"calm":[]}}} /*END*/;

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const readingFile = path.join(dataDir, "reading.json");
const MONEY = /(?:[$€£₪¥]\s?\d[\d,]*(?:\.\d+)?)|(?:\d[\d,]*(?:\.\d+)?\s?(?:USD|EUR|GBP|ILS|NIS|₪|€))/g;
const DAY = 86400000;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ── Time, in this machine's zone (the person's own) ──
const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, "0");
const hhmm = (d) => pad(d.getHours()) + ":" + pad(d.getMinutes());
const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
function offsetOf(d) { const o = -d.getTimezoneOffset(); return (o >= 0 ? "+" : "-") + pad(o / 60) + ":" + pad(o % 60); }
function iso(d) { return ymd(d) + "T" + hhmm(d) + ":" + pad(d.getSeconds()) + offsetOf(d); }
/** Midnight, `days` from today, in local time (safe across a clock change). */
function dayStart(days) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + days); return d; }
function at(day, hour) { const d = new Date(day); d.setHours(hour, 0, 0, 0); return d.getTime(); }

function fail(msg) { console.error("first-sort: " + msg); process.exit(1); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function writeJson(file, value) {
  const tmp = file + ".part";
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}
function workFile(name) {
  const file = path.resolve(workDir, name);
  if (!file.startsWith(workDir + path.sep)) fail(`${name} is not inside data/.work/`);
  if (!fs.existsSync(file)) fail(`${name} is not in data/.work/ (save the answer there first)`);
  return file;
}
/** Every saved Gmail or Calendar answer as one text, to check that an amount was really written
 *  in the mail. The agent's own files (the profile, lists of amounts, scripts) are not proof. */
function savedText() {
  if (!fs.existsSync(workDir)) return "";
  return fs.readdirSync(workDir).filter((f) => !/^profile|^latest|\.(m?js|py|sh)$/i.test(f)).map((f) => {
    try {
      const t = fs.readFileSync(path.join(workDir, f), "utf8");
      // A document read into text is what the document says.
      if (/\.txt$/i.test(f)) return t;
      // Only what the helper saved from OneDrive: its answers carry these keys.
      return /"(messages|snippet|payload|items|body|files|comments|drives|storageQuota)"\s*:/.test(t) ? t : "";
    } catch { return ""; }
  }).join("\n");
}
/** How often an amount is written, whole: "₪20" is not inside "₪200.00". */
function timesWritten(text, amount) {
  const esc = amount.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (text.match(new RegExp(esc + "(?!\\d|[.,]\\d)", "g")) || []).length;
}

// ── Saved answers ──
function pagesOf(name) {
  const raw = fs.readFileSync(workFile(name), "utf8").trim();
  if (!raw) return [];
  try { return [JSON.parse(raw)]; } catch {
    return raw.split(/\r?\n/).filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return fail(`${name} is not JSON: check the command that saved it`); } });
  }
}
const declined = (e) => Array.isArray(e.attendees) && e.attendees.some((a) => a && a.self && a.responseStatus === "declined");
const allDay = (e) => !!(e.start && e.start.date && !e.start.dateTime);
/** Calendar events that count: not cancelled, not declined. */
function eventsOf(name) {
  return pagesOf(name).flatMap((p) => p.items || p.events || []).filter((e) => e && e.status !== "cancelled" && !declined(e));
}
function timeZoneOf(name) { for (const p of pagesOf(name)) if (p && typeof p.timeZone === "string") return p.timeZone; return ""; }

/** The exact count in one saved answer: { n, more } where more means there is more than counted. */
function countFile(spec) {
  const atSign = spec.lastIndexOf("@");
  const name = atSign > 0 ? spec.slice(0, atSign) : spec;
  const max = atSign > 0 ? Number(spec.slice(atSign + 1)) || 40 : 40;
  let n = 0, more = false, capped = false;
  for (const p of pagesOf(name)) {
    let list = Array.isArray(p) ? p : p.messages || p.items || p.threads || p.events || p.files || p.comments || p.drives || [];
    if (!Array.isArray(list)) fail(`${name} has no list in it`);
    // Calendar events: cancelled ones, the ones they declined and all-day ones do not count.
    list = list.filter((e) => !(e && typeof e === "object" && (e.status === "cancelled" || allDay(e) || declined(e))));
    n += list.length;
    more = !!(p && p.nextPageToken);
    // gws gmail +triage stops at --max and says nothing more: a full list is a cap.
    if (p && !Array.isArray(p) && "query" in p && list.length >= max) capped = true;
  }
  return { n, more: more || capped };
}
function withWord(n, more, one, many) {
  const num = (more ? "at least " : "") + n.toLocaleString("en-US");
  return one ? `${num} ${n === 1 && !more ? one : many || one}` : num;
}
function countWords(spec) { const [file, one, many] = spec.split("|").map((s) => s.trim()); const c = countFile(file); return withWord(c.n, c.more, one, many); }

/** The sum of a saved list of amounts, each one written in a saved answer, all one currency. */
function sumWords(name) {
  let list;
  try { list = readJson(workFile(name)); } catch { fail(`${name} is not a JSON list of amounts`); }
  if (!Array.isArray(list) || !list.length) fail(`${name} must be a JSON list of amounts, like ["₪289.00","₪200.00"]`);
  const text = savedText();
  let total = 0, unit = null, decimals = 0;
  const used = {};
  for (const a of list) {
    const s = String(a).trim();
    used[s] = (used[s] || 0) + 1;
    if (timesWritten(text, s) < used[s]) fail(`${s} is not written ${used[s] > 1 ? used[s] + " times " : ""}in the saved answers: copy amounts from the mail, each one once`);
    const m = /^([^\d\s]*)\s?(\d[\d,]*(?:\.(\d+))?)\s?([^\d\s]*)$/.exec(s);
    if (!m) fail(`${s} is not an amount`);
    // ₪, ILS and NIS are one currency (and $/USD, €/EUR, £/GBP): "289.00 ILS" + "₪200.00" adds up.
    const sign = { ILS: "₪", NIS: "₪", USD: "$", EUR: "€", GBP: "£" };
    const cur = m[1] || sign[(m[4] || "").toUpperCase()] || m[4] || "";
    const u = cur + "|";
    if (unit !== null && u !== unit) fail("the amounts are in different currencies: leave the sum out");
    unit = u;
    decimals = Math.max(decimals, (m[3] || "").length);
    total += Number(m[2].replace(/,/g, ""));
  }
  const [pre, post] = unit.split("|");
  return pre + total.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + (post ? " " + post : "");
}

// ── Calendar findings the helper works out itself ──
function busyOf(name) {
  return eventsOf(name).filter((e) => !allDay(e)).map((e) => [new Date(e.start.dateTime).getTime(), new Date((e.end && e.end.dateTime) || e.start.dateTime).getTime()]);
}
/** Where a free stretch may sit on a day: weekdays 8 to 17 for work, evenings and weekends for Personal. */
function windowsFor(day) {
  const wd = day.getDay();
  if (CONFIG.free === "personal") return wd === 0 || wd === 6 ? [[9, 22]] : [[18, 22]];
  return wd === 0 || wd === 6 ? [] : [[8, 17]];
}
/** The first gap of 3 hours or more from now (rounded up to the quarter hour), in 14 days. */
function freeWords(name) {
  const span = freeSpan(name);
  return span ? WEEKDAYS[new Date(span[0]).getDay()] + " " + hhmm(new Date(span[0])) + " to " + hhmm(new Date(span[1])) : "";
}
/** The first free stretch as [start, end] in ms, or null. */
function freeSpan(name) {
  const busy = busyOf(name);
  const q = 15 * 60000;
  const from = Math.ceil(Date.now() / q) * q;
  for (let i = 0; i < 14; i++) {
    const day = dayStart(i);
    for (const [a, b] of windowsFor(day)) {
      let start = Math.max(from, at(day, a));
      const end = at(day, b);
      if (start >= end) continue;
      const inside = busy.filter(([s, e]) => e > start && s < end).sort((x, y) => x[0] - y[0]);
      for (const [s, e] of [...inside, [end, end]]) {
        if (s - start >= 3 * 3600000) return [start, s];
        start = Math.max(start, e);
      }
    }
  }
  return null;
}
/** Evenings (18:00 to 22:00) with nothing booked, today and the six days after. */
function eveningsCount(name) {
  const busy = busyOf(name);
  let n = 0;
  for (let i = 0; i < 7; i++) { const d = dayStart(i), s = at(d, 18), e = at(d, 22); if (!busy.some(([a, b]) => b > s && a < e)) n++; }
  return n;
}
/** Timed events from today to the end of today + 6, the page's "next 7 days". */
function weekCount(name) {
  const s = dayStart(0).getTime(), e = dayStart(7).getTime();
  return eventsOf(name).filter((x) => !allDay(x) && (() => { const t = new Date(x.start.dateTime).getTime(); return t >= s && t < e; })()).length;
}
/** Birthdays and anniversaries in the next 30 days. */
function datesCount(name) {
  const end = dayStart(30).getTime();
  return eventsOf(name).filter((e) => {
    const t = new Date((e.start && (e.start.dateTime || e.start.date)) || 0).getTime();
    return t >= dayStart(0).getTime() && t < end && (e.eventType === "birthday" || (allDay(e) && /birthday|anniversary|יום הולדת/i.test(e.summary || "")));
  }).length;
}

// ── OneDrive through Microsoft Graph: the helper reads, and saves every answer in data/.work/ ──
// The agent never types a Graph call. `get` reads OneDrive and saves each answer as a list of
// files ({"files":[...]}, the shape every check below reads), so a card can only name a file
// OneDrive answered with. `read` saves one file's words for the agent to read.
const GRAPH = /^http:\/\/127\.0\.0\.1:\d+\/v1\.0$/.test(process.env.FIRST_SORT_TEST_GRAPH || "") ? process.env.FIRST_SORT_TEST_GRAPH : "https://graph.microsoft.com/v1.0";
const MAX_DELTA_PAGES = 40, MAX_PERMISSIONS = 60, MAX_COMMENT_FILES = 12, MAX_READ = 25 * 1024 * 1024;
const FOLDER = "folder";
/** Stops a Graph read with a code the agent reads (2 not connected, 3 sign in again, 4 no
 *  permission). Never process.exit while a connection is open: Node on Windows loses the code. */
class Stop extends Error { constructor(msg, code) { super(msg); this.code = code || 1; } }
async function graph(url, raw) {
  const token = process.env.MICROSOFT_GRAPH_TOKEN;
  if (!token) throw new Stop("MICROSOFT_GRAPH_TOKEN is not set: OneDrive is not connected for this run", 2);
  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    // "+" in a query reads as a space: an offset like +03:00 must reach Graph as %2B.
    res = await fetch(url.startsWith("http") ? url : GRAPH + url.replace(/\+/g, "%2B"), { headers: { Authorization: "Bearer " + token, Accept: raw ? "*/*" : "application/json" } });
    if ((res.status === 429 || res.status >= 500) && attempt < 2) {
      const wait = Math.min(10, Number(res.headers.get("retry-after")) || 2 * (attempt + 1));
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    break;
  }
  if (res.status === 401) throw new Stop("OneDrive needs a new sign-in (401)", 3);
  if (!res.ok) {
    let code = "";
    try { code = (await res.json()).error.code; } catch { /* not JSON */ }
    const e = new Error(`OneDrive answered ${res.status}${code ? " " + code : ""}`);
    e.status = res.status;
    throw e;
  }
  return raw ? Buffer.from(await res.arrayBuffer()) : res.json();
}
/** A few at a time: OneDrive slows down a reader that asks too much at once. */
async function inTurns(jobs, size) {
  const out = [];
  for (let i = 0; i < jobs.length; i += size) out.push(...(await Promise.all(jobs.slice(i, i + size).map((j) => j()))));
  return out;
}
function extOf(name) { const m = /\.([a-z0-9]{1,6})$/i.exec(String(name || "")); return m ? m[1].toLowerCase() : ""; }
const EXT_MIME = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docm: "application/vnd.ms-word.document.macroEnabled.12", doc: "application/msword",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xlsm: "application/vnd.ms-excel.sheet.macroEnabled.12", xls: "application/vnd.ms-excel", csv: "text/csv",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation", ppt: "application/vnd.ms-powerpoint",
  pdf: "application/pdf", txt: "text/plain", md: "text/markdown", one: "application/msonenote",
};
function mimeOf(x) {
  if (x.folder) return FOLDER;
  if (x.package) return "application/msonenote";
  const m = x.file && typeof x.file.mimeType === "string" ? x.file.mimeType : "";
  return EXT_MIME[extOf(x.name)] || (x.image || x.photo ? "image/jpeg" : x.video ? "video/mp4" : m || "application/octet-stream");
}
const lower = (s) => String(s || "").trim().toLowerCase();
/** Who they are, and how much space their OneDrive has, once per run. */
let ME = null;
async function whoAmI() {
  if (ME) return ME;
  let user = {};
  try { user = await graph("/me?$select=id,displayName,mail,userPrincipalName"); } catch (e) { if (e instanceof Stop) throw e; }
  let drive;
  try { drive = await graph("/me/drive?$select=id,driveType,owner,quota,webUrl"); } catch (e) {
    if (e instanceof Stop) throw e;
    if (e.status === 403) throw new Stop("OneDrive isn't connected for this cabinet (403): press Connect OneDrive", 4);
    if (e.status === 404) throw new Stop("this account has no OneDrive yet (404)", 4);
    throw e;
  }
  const owner = (drive.owner && drive.owner.user) || {};
  const email = lower(user.mail || (/@/.test(user.userPrincipalName || "") ? user.userPrincipalName : "") || owner.email);
  ME = {
    ids: new Set([user.id, owner.id].filter(Boolean).map(lower)),
    name: user.displayName || owner.displayName || "",
    email,
    driveId: drive.id || "",
    business: drive.driveType === "business",
    quota: drive.quota || {},
  };
  return ME;
}
function personOf(by) {
  const u = by && (by.user || by.application) || null;
  if (!u) return null;
  const email = lower(u.email || u.userPrincipalName || u.loginName);
  const me = !!(ME && ((u.id && ME.ids.has(lower(u.id))) || (email && email === ME.email) || (!u.id && !email && u.displayName && u.displayName === ME.name)));
  return { displayName: u.displayName || email || "", emailAddress: email || undefined, me };
}
/** One driveItem in the shape the checks read: id, name, mimeType, times, who, folder, link. */
function fileOf(x, folders) {
  const r = x.remoteItem || {};
  const parent = x.parentReference || r.parentReference || {};
  const f = {
    id: x.id,
    name: x.name || r.name || "",
    mimeType: mimeOf({ ...r, ...x, file: x.file || r.file, folder: x.folder || r.folder }),
    modifiedTime: x.lastModifiedDateTime || r.lastModifiedDateTime || undefined,
    createdTime: x.createdDateTime || r.createdDateTime || undefined,
    lastModifyingUser: personOf(x.lastModifiedBy || r.lastModifiedBy) || undefined,
    parents: parent.id ? [parent.id] : [],
    folderName: folders && parent.id && folders.has(parent.id) ? folders.get(parent.id).name : undefined,
    webUrl: typeof (x.webUrl || r.webUrl) === "string" ? x.webUrl || r.webUrl : undefined,
    driveId: parent.driveId || undefined,
  };
  const size = Number(x.size != null ? x.size : r.size);
  if (f.mimeType !== FOLDER && size > 0) { f.size = size; f.quotaBytesUsed = size; }
  for (const k of Object.keys(f)) if (f[k] === undefined) delete f[k];
  return f;
}
/** Every item in their OneDrive, by walking it once (delta). `more` when it was too big to finish. */
let WALK = null;
async function walk() {
  if (WALK) return WALK;
  const items = [];
  let url = "/me/drive/root/delta?$select=id,name,size,file,folder,package,image,photo,video,lastModifiedDateTime,createdDateTime,lastModifiedBy,parentReference,webUrl,shared,deleted,root";
  let more = false;
  for (let i = 0; url; i++) {
    if (i >= MAX_DELTA_PAGES) { more = true; break; }
    const j = await graph(url);
    items.push(...(j.value || []));
    url = typeof j["@odata.nextLink"] === "string" && j["@odata.nextLink"].startsWith(GRAPH) ? j["@odata.nextLink"] : "";
  }
  const live = items.filter((x) => x && x.id && x.name && !x.deleted && !x.root);
  const folders = new Map(live.filter((x) => x.folder).map((x) => [x.id, { name: x.name, parent: (x.parentReference || {}).id || "" }]));
  const rootId = (items.find((x) => x && x.root) || {}).id || "";
  const all = live.map((x) => ({ raw: x, f: fileOf(x, folders) }));
  WALK = { all, files: all.filter((x) => x.f.mimeType !== FOLDER), folders, rootId, more };
  return WALK;
}
const byNewest = (a, b) => String(b.modifiedByMeTime || b.sharedWithMeTime || b.modifiedTime || "").localeCompare(String(a.modifiedByMeTime || a.sharedWithMeTime || a.modifiedTime || ""));
/** Is this folder inside that one, at any depth? */
function inside(folders, startId, outerId) {
  for (let id = startId, n = 0; id && n < 40; id = (folders.get(id) || {}).parent, n++) if (id === outerId) return true;
  return false;
}
function saveWork(name, value, ndjson) {
  fs.mkdirSync(workDir, { recursive: true });
  fs.writeFileSync(path.join(workDir, name), ndjson ? JSON.stringify(value) + "\n" : JSON.stringify(value, null, 1));
  const n = Array.isArray(value.files) ? value.files.length : Array.isArray(value.comments) ? value.comments.length : null;
  console.log(`${name}: ${n === null ? "saved" : n + (value.nextPageToken ? "+ (there is more)" : "") + " " + (Array.isArray(value.comments) ? "comments" : "files")}`);
}
const PAPER_WORDS = /passport|licen[cs]e|\bID\b|birth|marriage|insurance|policy|lease|mortgage|deed|title|registration|tax|W-?2|1099|vaccin|medical|school|enrol+ment|warranty|receipt|\bwill\b|statement|agreement|contract|membership|subscription|renewal/i;
const CONTRACT_WORDS = /contract|agreement|lease|policy|insurance|licen[cs]e|renewal|\bSOW\b|\bMSA\b|\bNDA\b|terms/i;
const VERSION_WORDS = /\b(v\d+|final|draft|copy of|copy|signed|old|new|latest|rev\d*)\b|\(\d+\)|\b20\d\d\b/i;
function baseOf(name) {
  return String(name || "").replace(/\.[a-z0-9]{1,6}$/i, "").toLowerCase()
    .replace(/\bcopy of\b|\(\d+\)|\b(v\d+|final|draft|copy|signed|old|new|latest|rev\d*)\b|\b20\d\d\b/g, " ")
    .replace(/[-_.,()]+/g, " ").replace(/\s+/g, " ").trim();
}
/** Searches by the words inside documents too, where OneDrive can (merged by id, files only). */
async function wordSearch(words) {
  const out = new Map();
  for (const w of words) {
    try {
      const j = await graph(`/me/drive/root/search(q='${encodeURIComponent(w)}')?$top=25`);
      for (const x of j.value || []) if (x && x.id && !x.folder) out.set(x.id, x);
    } catch (e) { if (e instanceof Stop) throw e; /* a search OneDrive can't do is left out */ }
  }
  return [...out.values()];
}
/** Who can open their own files: the permissions of the files OneDrive marks as shared. */
async function permissionsOf(w, me) {
  let cand = w.all.filter((x) => x.raw.shared);
  // A work OneDrive often leaves the shared mark out: then the newest files are asked.
  if (!cand.length && me.business) cand = w.files.slice().sort((a, b) => byNewest(a.f, b.f)).slice(0, 40);
  cand = cand.sort((a, b) => byNewest(a.f, b.f)).slice(0, MAX_PERMISSIONS);
  const domain = me.email.split("@")[1] || "";
  return inTurns(cand.map((x) => async () => {
    let perms = [];
    try { perms = (await graph(`/me/drive/items/${encodeURIComponent(x.f.id)}/permissions`)).value || []; } catch (e) { if (e instanceof Stop) throw e; }
    const out = [];
    for (const p of perms) {
      if (p.roles && p.roles.includes("owner")) continue;
      const scope = p.link && p.link.scope;
      if (scope === "anonymous") out.push({ type: "anyone", role: (p.roles || [])[0] || "read" });
      else if (scope === "organization") out.push({ type: "domain", role: (p.roles || [])[0] || "read", domain });
      const people = [].concat(p.grantedToV2 || [], p.grantedToIdentitiesV2 || [], p.grantedTo || [], p.grantedToIdentities || []);
      for (const g of people) {
        const u = g && (g.user || g.siteUser || g.group || g.siteGroup);
        const email = lower(u && (u.email || u.loginName));
        if (u && email && /@/.test(email)) out.push({ type: g.group || g.siteGroup ? "group" : "user", role: (p.roles || [])[0] || "read", emailAddress: email, domain: email.split("@")[1] });
      }
      if (p.invitation && p.invitation.email) out.push({ type: "user", role: (p.roles || [])[0] || "read", emailAddress: lower(p.invitation.email), domain: lower(p.invitation.email).split("@")[1] });
    }
    return { ...x.f, permissions: out };
  }), 5);
}

// ── The comments inside Word, Excel and PowerPoint files (OneDrive keeps them in the file) ──
function zipEntries(buf) {
  let end = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) if (buf.readUInt32LE(i) === 0x06054b50) { end = i; break; }
  if (end < 0) throw new Error("that file is not a readable Office file");
  const count = buf.readUInt16LE(end + 10);
  let at = buf.readUInt32LE(end + 16);
  const out = [];
  for (let n = 0; n < count && buf.readUInt32LE(at) === 0x02014b50; n++) {
    const method = buf.readUInt16LE(at + 10), size = buf.readUInt32LE(at + 20);
    const nameLen = buf.readUInt16LE(at + 28), extraLen = buf.readUInt16LE(at + 30), commentLen = buf.readUInt16LE(at + 32);
    const local = buf.readUInt32LE(at + 42);
    const name = buf.toString("utf8", at + 46, at + 46 + nameLen);
    out.push({ name, read: () => {
      const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
      const raw = buf.subarray(start, start + size);
      return (method === 8 ? zlib.inflateRawSync(raw) : raw).toString("utf8");
    } });
    at += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}
function xmlText(xml, para) {
  return xml.replace(new RegExp(`</(${para})>`, "g"), "\n").replace(/<w:tab\/>|<w:br\/>|<a:br\/>|<\/a:t>\s*<a:t>/g, " ").replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, "&");
}
const attr = (tag, name) => { const m = new RegExp(`\\b${name}="([^"]*)"`).exec(tag); return m ? xmlText(m[1], "x") : ""; };
const oneLine = (s, max) => String(s || "").replace(/\s+/g, " ").trim().slice(0, max);
function officeText(buf, ext) {
  const entries = zipEntries(buf);
  const byNum = (re) => entries.filter((e) => re.test(e.name)).sort((a, b) => Number((/(\d+)\.xml$/.exec(a.name) || [])[1]) - Number((/(\d+)\.xml$/.exec(b.name) || [])[1]));
  if (/^doc/.test(ext)) return entries.filter((e) => e.name === "word/document.xml").map((e) => xmlText(e.read(), "w:p")).join("\n");
  if (/^ppt/.test(ext)) return byNum(/^ppt\/slides\/slide\d+\.xml$/).map((e, i) => `-- slide ${i + 1}\n` + xmlText(e.read(), "a:p")).join("\n");
  const sst = entries.find((e) => e.name === "xl/sharedStrings.xml");
  const shared = sst ? [...sst.read().matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => xmlText(m[1], "x")) : [];
  return byNum(/^xl\/worksheets\/sheet\d+\.xml$/).map((e, i) => `-- sheet ${i + 1}\n` + [...e.read().matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((r) =>
    [...r[1].matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)].map((c) => {
      const v = /<v>([\s\S]*?)<\/v>/.exec(c[2] || ""), t = /<t[^>]*>([\s\S]*?)<\/t>/.exec(c[2] || "");
      if (/t="s"/.test(c[1]) && v) return shared[Number(v[1])] || "";
      return t ? xmlText(t[1], "x") : v ? v[1] : "";
    }).join(" | ")).join("\n")).join("\n");
}
/** The comments in one Office file, as threads: { id, content, author, createdTime, resolved,
 *  quotedFileContent, replies }. Word keeps replies and "resolved" in commentsExtended.xml,
 *  Excel in its threaded comments, PowerPoint in its modern comments. */
function officeComments(buf, ext) {
  const entries = zipEntries(buf);
  const get = (name) => { const e = entries.find((x) => x.name === name); return e ? e.read() : ""; };
  const who = (name) => ({ displayName: name || "", me: !!(ME && name && (name === ME.name || lower(name) === ME.email)) });
  const threads = [];
  if (/^doc/.test(ext)) {
    const xml = get("word/comments.xml");
    if (!xml) return [];
    const ext15 = get("word/commentsExtended.xml");
    const exByPara = new Map([...ext15.matchAll(/<w15:commentEx\b([^>]*)\/?>/g)].map((m) => [attr(m[1], "w15:paraId"), { parent: attr(m[1], "w15:paraIdParent"), done: attr(m[1], "w15:done") === "1" }]));
    const doc = get("word/document.xml");
    const all = [...xml.matchAll(/<w:comment\b([^>]*)>([\s\S]*?)<\/w:comment>/g)].map((m) => {
      const paras = [...m[2].matchAll(/w14:paraId="([^"]+)"/g)].map((p) => p[1]);
      const last = paras[paras.length - 1] || "";
      const id = attr(m[1], "w:id");
      const range = new RegExp(`<w:commentRangeStart w:id="${id}"\\s*/>([\\s\\S]*?)<w:commentRangeEnd w:id="${id}"\\s*/>`).exec(doc);
      return { id, para: last, ex: exByPara.get(last) || {}, author: attr(m[1], "w:author"), date: attr(m[1], "w:date"), text: oneLine(xmlText(m[2], "w:p"), 600), quote: range ? oneLine(xmlText(range[1], "w:p"), 200) : "" };
    });
    const byPara = new Map(all.map((c) => [c.para, c]));
    for (const c of all) {
      const parent = c.ex.parent && byPara.get(c.ex.parent);
      if (parent) continue;
      const replies = all.filter((r) => r.ex.parent && r.ex.parent === c.para).map((r) => ({ author: who(r.author), content: r.text, createdTime: r.date }));
      threads.push({ id: "w" + c.id, content: c.text, author: who(c.author), createdTime: c.date, resolved: !!c.ex.done, quotedFileContent: c.quote ? { value: c.quote } : undefined, replies });
    }
  } else if (/^xls/.test(ext)) {
    const people = new Map();
    for (const e of entries.filter((x) => /^xl\/persons\/person\d*\.xml$/.test(x.name))) for (const m of e.read().matchAll(/<person\b([^>]*)\/?>/g)) people.set(attr(m[1], "id"), attr(m[1], "displayName"));
    const all = [];
    for (const e of entries.filter((x) => /^xl\/threadedComments\/threadedComment\d*\.xml$/.test(x.name))) {
      for (const m of e.read().matchAll(/<threadedComment\b([^>]*)>([\s\S]*?)<\/threadedComment>/g)) {
        all.push({ id: attr(m[1], "id"), parent: attr(m[1], "parentId"), done: attr(m[1], "done") === "1", ref: attr(m[1], "ref"), author: people.get(attr(m[1], "personId")) || "", date: attr(m[1], "dT"), text: oneLine(xmlText((/<text>([\s\S]*?)<\/text>/.exec(m[2]) || [])[1] || "", "x"), 600) });
      }
    }
    for (const c of all.filter((x) => !x.parent)) {
      const replies = all.filter((r) => r.parent === c.id).map((r) => ({ author: who(r.author), content: r.text, createdTime: r.date }));
      threads.push({ id: "x" + c.id, content: c.text, author: who(c.author), createdTime: c.date, resolved: c.done, quotedFileContent: c.ref ? { value: "cell " + c.ref } : undefined, replies });
    }
  } else if (/^ppt/.test(ext)) {
    const authors = new Map([...get("ppt/authors.xml").matchAll(/<p188:author\b([^>]*)\/?>/g)].map((m) => [attr(m[1], "id"), attr(m[1], "name")]));
    for (const e of entries.filter((x) => /^ppt\/comments\/modernComment[^/]*\.xml$/.test(x.name))) {
      for (const m of e.read().matchAll(/<p188:cm\b([^>]*)>([\s\S]*?)<\/p188:cm>/g)) {
        const body = m[2];
        const replies = [...body.matchAll(/<p188:reply\b([^>]*)>([\s\S]*?)<\/p188:reply>/g)].map((r) => ({ author: who(authors.get(attr(r[1], "authorId"))), content: oneLine(xmlText(r[2], "a:p"), 600), createdTime: attr(r[1], "created") }));
        const own = body.replace(/<p188:replyLst>[\s\S]*?<\/p188:replyLst>/g, "");
        threads.push({ id: "p" + attr(m[1], "id"), content: oneLine(xmlText((/<p188:txBody>([\s\S]*?)<\/p188:txBody>/.exec(own) || [])[1] || "", "a:p"), 600), author: who(authors.get(attr(m[1], "authorId"))), createdTime: attr(m[1], "created"), resolved: attr(m[1], "status") === "resolved", replies });
      }
    }
  }
  return threads.filter((t) => t.content);
}

/** The searches by name: each one saved as {"files":[...]}, newest first. */
async function getOne(name, opts) {
  const me = await whoAmI();
  const from = (days) => dayStart(-days).getTime();
  const t = (f) => new Date(f.modifiedTime || 0).getTime();
  if (name === "about") {
    saveWork("about.json", { user: { displayName: me.name, emailAddress: me.email || undefined }, storageQuota: { limit: me.quota.total, usage: me.quota.used }, driveType: me.business ? "business" : "personal" });
    return;
  }
  if (name === "shared") {
    let list = [];
    try { list = (await graph("/me/drive/sharedWithMe?$top=60")).value || []; } catch (e) { if (e instanceof Stop) throw e; console.log("shared.json: OneDrive could not list what was shared (" + e.message + "), saved empty"); }
    const files = list.map((x) => {
      const r = x.remoteItem || {};
      const sh = r.shared || x.shared || {};
      const by = personOf(sh.sharedBy ? { user: sh.sharedBy.user || sh.sharedBy } : sh.owner);
      const f = fileOf({ ...x, id: r.id || x.id });
      return { ...f, sharedWithMeTime: sh.sharedDateTime || x.lastModifiedDateTime || undefined, sharingUser: by && !by.me ? by : undefined, owners: sh.owner && personOf(sh.owner) ? [personOf(sh.owner)] : undefined };
    }).filter((f) => f.id).sort(byNewest).slice(0, 30);
    saveWork("shared.json", { files: JSON.parse(JSON.stringify(files)) });
    return;
  }
  const w = await walk();
  const more = w.more ? { nextPageToken: "more" } : {};
  if (name === "files-all") saveWork("files-all.ndjson", { files: w.files.map((x) => ({ id: x.f.id })), ...more }, true);
  else if (name === "media-all") saveWork("media-all.ndjson", { files: w.files.filter((x) => /^(image|video)\//.test(x.f.mimeType)).map((x) => ({ id: x.f.id })), ...more }, true);
  else if (name === "folders") {
    if (CONFIG.business) {
      // The top folders, then the client folders: inside "Clients" (any depth), or the one setup.md names.
      const top = w.all.filter((x) => x.f.mimeType === FOLDER && x.f.parents[0] === w.rootId);
      const named = opts.clients ? lower(opts.clients) : "";
      const roots = w.all.filter((x) => x.f.mimeType === FOLDER && (named ? lower(x.f.name) === named : /^(clients|customers|clients and projects)$/i.test(x.f.name)));
      const clients = w.all.filter((x) => x.f.mimeType === FOLDER && roots.some((r) => x.f.parents[0] === r.f.id));
      const pick = [...new Map([...clients, ...top.filter((x) => !roots.includes(x))].map((x) => [x.f.id, x])).values()].slice(0, 12);
      const newest = pick.map((dir) => {
        const last = w.files.filter((x) => inside(w.folders, x.f.parents[0], dir.f.id)).sort((a, b) => byNewest(a.f, b.f))[0];
        return { ...dir.f, client: clients.includes(dir) || undefined, lastAt: last ? last.f.modifiedTime : undefined, lastFile: last ? last.f.id : undefined, lastBy: last && last.f.lastModifyingUser ? last.f.lastModifyingUser.displayName : undefined };
      });
      const lastFiles = newest.map((d) => d.lastFile && w.files.find((x) => x.f.id === d.lastFile)).filter(Boolean).map((x) => x.f);
      saveWork("folders.json", { files: newest, clientsRoot: roots.map((r) => r.f.name) });
      saveWork("inside.json", { files: lastFiles });
    } else saveWork("folders.json", { files: w.all.filter((x) => x.f.mimeType === FOLDER).map((x) => ({ id: x.f.id, name: x.f.name })), ...more });
  } else if (name === "recent7") {
    const list = w.files.filter((x) => t(x.f) >= from(7)).map((x) => x.f).sort(byNewest);
    saveWork("recent7.ndjson", { files: list.slice(0, 300), ...(list.length > 300 || w.more ? { nextPageToken: "more" } : {}) }, true);
  } else if (name === "mine") {
    // Where they left off: what OneDrive saw them open or change lately, then what they saved last.
    const out = new Map();
    try {
      for (const x of (await graph("/me/drive/recent?$top=25")).value || []) {
        const r = x.remoteItem || {};
        if ((x.folder || r.folder) || !(r.id || x.id)) continue;
        const f = fileOf({ ...x, id: r.id || x.id }, w.folders);
        if (f.lastModifyingUser && f.lastModifyingUser.me) f.modifiedByMeTime = f.modifiedTime;
        out.set(f.id, f);
      }
    } catch (e) { if (e instanceof Stop) throw e; /* the recent list is gone on some accounts: the walk is enough */ }
    for (const x of w.files) if (x.f.lastModifyingUser && x.f.lastModifyingUser.me && !out.has(x.f.id)) out.set(x.f.id, { ...x.f, modifiedByMeTime: x.f.modifiedTime });
    saveWork("mine.json", { files: [...out.values()].sort(byNewest).slice(0, 15) });
  } else if (name === "big") saveWork("big.json", { files: w.files.map((x) => x.f).filter((f) => f.size).sort((a, b) => b.size - a.size).slice(0, 10) });
  else if (name === "find-papers" || name === "contracts") {
    const words = name === "contracts" ? CONTRACT_WORDS : PAPER_WORDS;
    const found = new Map(w.files.filter((x) => words.test(x.f.name)).map((x) => [x.f.id, x.f]));
    for (const x of await wordSearch(name === "contracts" ? ["renewal date", "expires on", "notice period", "terminate"] : ["expiration date", "expires", "renewal date"])) {
      const known = w.files.find((y) => y.f.id === x.id);
      if (known && !found.has(x.id)) found.set(x.id, known.f);
    }
    const list = [...found.values()].sort(byNewest).slice(0, name === "contracts" ? 40 : 60);
    saveWork(name + ".json", { files: list });
  } else if (name === "versions") {
    const groups = new Map();
    for (const x of w.files) {
      const b = baseOf(x.f.name);
      if (b.length < 3) continue;
      if (!groups.has(b)) groups.set(b, []);
      groups.get(b).push(x.f);
    }
    const out = [...groups.entries()].filter(([, fs_]) => fs_.length > 1 && fs_.some((f) => VERSION_WORDS.test(f.name)) && fs_.some((f) => t(f) >= from(90)))
      .map(([base, fs_]) => ({ base, ids: fs_.sort(byNewest).slice(0, 6).map((f) => f.id) })).slice(0, 12);
    const ids = new Set(out.flatMap((g) => g.ids));
    saveWork("versions.json", { files: w.files.map((x) => x.f).filter((f) => ids.has(f.id)), groups: out });
  } else if (name === "anyone" || name === "owned") {
    const perms = opts.perms || (opts.perms = await permissionsOf(w, me));
    if (name === "anyone") saveWork("anyone.json", { files: perms.filter((f) => f.permissions.some((p) => p.type === "anyone")).map(({ permissions, ...f }) => f) });
    else saveWork("owned.ndjson", { files: perms.filter((f) => f.permissions.length) }, true);
  } else if (name === "comments") {
    // The Word, Excel and PowerPoint files changed in 14 days: their open comments, one answer each.
    const office = /\.(docx|docm|xlsx|xlsm|pptx|pptm)$/i;
    const pick = w.files.filter((x) => office.test(x.f.name) && t(x.f) >= from(14) && (x.f.size || 0) < MAX_READ).map((x) => x.f).sort(byNewest).slice(0, MAX_COMMENT_FILES);
    const map = {};
    let n = 0;
    await inTurns(pick.map((f) => async () => {
      let buf;
      try { buf = await graph(`/me/drive/items/${encodeURIComponent(f.id)}/content`, true); } catch (e) { if (e instanceof Stop) throw e; return; }
      let comments = [];
      try { comments = officeComments(buf, extOf(f.name)); } catch { return; }
      if (!comments.length) return;
      n++;
      map[n] = f.id;
      saveWork(`comments-${n}.json`, { fileId: f.id, file: f.name, files: [f], comments: JSON.parse(JSON.stringify(comments)) });
    }), 4);
    saveWork("comment-files.json", { ...map });
  } else throw new Stop(`no search called ${name}`);
}
const GETS = CONFIG.gets || {};
async function getAll(names, opts) {
  const list = names.flatMap((n) => GETS[n] || [n]);
  for (const name of [...new Set(list)]) await getOne(name, opts);
}
/** One file's words into data/.work/: doc-<id>.txt for Word, Excel, PowerPoint and text;
 *  the file itself for a PDF or a picture, for the agent to read. */
async function readFile(id) {
  await whoAmI();
  const f = driveFiles().get(id);
  if (!f) throw new Stop(`no file with id ${id} in the saved answers: run its search first`);
  if ((f.size || 0) > MAX_READ) throw new Stop(`${f.name} is too big to read here (over 25 MB)`);
  const base = f.driveId && f.driveId !== ME.driveId ? `/drives/${encodeURIComponent(f.driveId)}/items/${encodeURIComponent(id)}` : `/me/drive/items/${encodeURIComponent(id)}`;
  const ext = extOf(f.name);
  const out = (e) => path.join(workDir, `doc-${id}.${e}`);
  if (/^(docx|docm|xlsx|xlsm|pptx|pptm)$/.test(ext)) {
    const text = officeText(await graph(base + "/content", true), ext).replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    fs.writeFileSync(out("txt"), text);
    console.log(`${f.name}: ${text.length} characters in data/.work/doc-${id}.txt`);
  } else if (/^(txt|md|csv)$/.test(ext)) {
    fs.writeFileSync(out("txt"), (await graph(base + "/content", true)).toString("utf8"));
    console.log(`${f.name}: data/.work/doc-${id}.txt`);
  } else if (ext === "pdf" || /^(jpe?g|png|gif|webp|heic)$/.test(ext)) {
    const kind = ext === "pdf" ? "pdf" : ext === "jpeg" ? "jpg" : ext;
    fs.writeFileSync(out(kind), await graph(base + "/content", true));
    console.log(`${f.name}: data/.work/doc-${id}.${kind} (read it)`);
  } else if (/^(doc|xls|ppt|rtf|odt|ods|odp)$/.test(ext)) {
    // An old Office file: OneDrive turns it into a PDF to read.
    try { fs.writeFileSync(out("pdf"), await graph(base + "/content?format=pdf", true)); console.log(`${f.name}: data/.work/doc-${id}.pdf (read it)`); }
    catch (e) { if (e instanceof Stop) throw e; throw new Stop(`${f.name} can't be read here: say so plainly`); }
  } else throw new Stop(`a .${ext || "?"} file has no words this helper can read: say so plainly`);
}

// ── OneDrive: what the saved answers prove ──
// A file the page shows must be one OneDrive answered with: its name, kind and time are taken
// from that answer, never from the agent's own file, so a card can't name a file that isn't there.
function kindOf(mime) {
  const m = String(mime || "");
  return m === FOLDER ? "folder" : m === "application/pdf" ? "pdf" : /^image\//.test(m) ? "image" : /^video\//.test(m) ? "video" : /word|opendocument\.text|msword/.test(m) ? "doc" : /sheet|excel|csv/.test(m) ? "sheet" : /presentation|powerpoint/.test(m) ? "slides" : /onenote/.test(m) ? "note" : "other";
}
/** One saved answer's pages, or none when it is not JSON (an exported document, a PDF). */
function pagesSafe(name) {
  let raw = "";
  try { raw = fs.readFileSync(path.join(workDir, name), "utf8").trim(); } catch { return []; }
  if (!raw) return [];
  try { return [JSON.parse(raw)]; } catch {
    return raw.split(/\r?\n/).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  }
}
/** Every file and folder in the saved answers, by id, with the answers it is in. */
function driveFiles() {
  const out = new Map();
  if (!fs.existsSync(workDir)) return out;
  for (const f of fs.readdirSync(workDir)) {
    if (!/\.(json|ndjson)$/i.test(f) || /^(profile|latest|sharing|dates|gift|papers-out|comment-files)\b/i.test(f)) continue;
    for (const p of pagesSafe(f)) {
      const list = (p && p.files) || [];
      for (const x of list) {
        if (!x || typeof x.id !== "string") continue;
        const was = out.get(x.id) || { in: [] };
        out.set(x.id, { ...was, ...x, in: was.in.concat(f) });
      }
    }
  }
  return out;
}
// A personal OneDrive id is like D4648F06C91D9D3D!54927, a work one like 01BYE5RZ6QN3ZWBTUFOFD3GSPGOHDJD36K.
const FILE_ID = /^[A-Za-z0-9!_.-]{6,120}$/;
/** A link that opens the file in OneDrive: only OneDrive's and SharePoint's own addresses. */
const SAFE_LINK = /^https:\/\/(onedrive\.live\.com|1drv\.ms|[a-z0-9-]+\.sharepoint(-df)?\.(com|us|cn|de))\//i;
const NO_SIZE = Symbol("no size");
/**
 * Every object with a fileId, at any depth: the file must be in a saved answer, and its name
 * (`name`, or `file` on a comment or a date), its kind and its time come from that answer.
 */
function checkFiles(o, where, files) {
  if (Array.isArray(o)) {
    o.forEach((x, i) => checkFiles(x, where + "[" + i + "]", files));
    // A file OneDrive gave no size for (a folder, a notebook) is left out, not refused.
    for (let i = o.length - 1; i >= 0; i--) if (o[i] && o[i][NO_SIZE]) o.splice(i, 1);
    return;
  }
  if (!o || typeof o !== "object") return;
  if ("fileId" in o) {
    const id = String(o.fileId || "");
    if (!FILE_ID.test(id)) fail(`refused, ${where}.fileId "${id}" is not a OneDrive file id`);
    const f = files.get(id);
    if (!f) fail(`refused, ${where}: no file with id ${id} in the saved answers. Copy ids from what OneDrive answered`);
    if ("file" in o) o.file = f.name; else o.name = f.name;
    o.kind = kindOf(f.mimeType);
    if ("modifiedAt" in o && f.modifiedTime) o.modifiedAt = f.modifiedTime;
    // The link and the folder are OneDrive's own words too.
    if (typeof f.webUrl === "string" && SAFE_LINK.test(f.webUrl)) o.url = f.webUrl; else delete o.url;
    if ("folder" in o) { if (f.folderName) o.folder = f.folderName; else delete o.folder; }
    // Who shared it and when, as OneDrive says it.
    if ("sharedAt" in o && f.sharedWithMeTime) o.sharedAt = f.sharedWithMeTime;
    if ("from" in o && "sharedAt" in o && f.sharingUser && f.sharingUser.displayName) { o.from = f.sharingUser.displayName; if (f.sharingUser.emailAddress) o.fromEmail = f.sharingUser.emailAddress; }
    // How big it is and when they last opened it are OneDrive's own words, never the agent's.
    if ("size" in o) { const n = Number(f.quotaBytesUsed || f.size); if (n > 0) o.size = n; else { o[NO_SIZE] = true; return; } }
    if ("viewedAt" in o) { if (f.viewedByMeTime) o.viewedAt = f.viewedByMeTime; else delete o.viewedAt; }
  }
  for (const [k, v] of Object.entries(o)) if (v && typeof v === "object") checkFiles(v, where + "." + k, files);
}
/** Storage from OneDrive's own answer (about.json): bytes used and, when there is one, the limit. */
function storageOf() {
  const name = CONFIG.storage;
  if (!name || !fs.existsSync(path.join(workDir, name))) return null;
  const about = pagesSafe(name)[0] || {};
  const q = about.storageQuota || {};
  const used = Number(q.usage);
  if (!isFinite(used)) return null;
  const limit = Number(q.limit);
  return isFinite(limit) && limit > 0 ? { used, limit } : { used };
}
function accountOf() {
  const about = CONFIG.storage && fs.existsSync(path.join(workDir, CONFIG.storage)) ? pagesSafe(CONFIG.storage)[0] || {} : {};
  return about.user && typeof about.user.emailAddress === "string" ? about.user.emailAddress : "";
}
/** Words as a document writes them, with its spaces and line breaks made plain. */
function plainWords(s) { return String(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim(); }
const DATE_WHAT = ["ends", "renews", "notice", "due", "expires"];
/** data/dates.json: each date is a real day ahead, in a file OneDrive answered with, and in a
 *  Word, Excel or PowerPoint file that was read its quote is written in the words. A PDF is read by eye. */
function checkDates(d, files) {
  if (!Array.isArray(d.dates)) fail("dates.json needs a dates list (empty when none were found)");
  const text = plainWords(savedText());
  d.dates.forEach((x, i) => {
    const where = "dates[" + i + "]";
    if (!DATE_WHAT.includes(x.what)) fail(`${where}.what is ${DATE_WHAT.join(", ")}, not "${x.what}"`);
    const day = /^\d{4}-\d{2}-\d{2}$/.test(String(x.date)) ? new Date(x.date + "T12:00:00") : null;
    if (!day || isNaN(day.getTime())) fail(`${where}.date is a day as YYYY-MM-DD`);
    if (day.getTime() < dayStart(-1).getTime() || day.getTime() > dayStart(400).getTime()) fail(`${where}.date must be from today to about a year ahead`);
    if (typeof x.quote !== "string" || !x.quote.trim()) fail(`${where}.quote is the words in the document that give the date`);
    // "rent goes to 2,350" when the paper says "$2,350": the amount keeps its currency.
    for (const m of String(x.gist || "").matchAll(/(^|[^$€£₪¥\d.,])(\d{1,3}(?:,\d{3})+(?:\.\d\d)?)(?![\d])/g)) {
      if (/[$€£₪¥]\s?$/.test(String(x.gist).slice(0, m.index + m[1].length))) continue;
      const cur = new RegExp("[$€£₪¥]\\s?" + m[2].replace(/[.,]/g, (c) => "\\" + c) + "(?!\\d)").exec(text);
      if (cur) fail(`refused, ${where}.gist writes ${m[2]} where the document says ${cur[0]}: copy the amount with its currency (use single quotes in the shell)`);
    }
    const f = files.get(String(x.fileId));
    const read = f ? path.join(workDir, `doc-${f.id}.txt`) : "";
    if (read && fs.existsSync(read) && !plainWords(fs.readFileSync(read, "utf8")).includes(plainWords(x.quote))) {
      fail(`refused, ${where}.quote is not written in the document: copy the words as they are`);
    }
  });
  d.dates.sort((a, b) => String(a.date).localeCompare(String(b.date)));
}
const PAPER_TYPES = ["id", "insurance", "home", "car", "tax", "health", "school", "warranty", "money", "family", "other"];
/** data/papers.json: each paper a file OneDrive answered with and one of the kinds the page knows,
 *  and its dates checked like dates.json. */
function checkPapers(d, files) {
  if (!Array.isArray(d.papers)) fail("papers.json needs a papers list (empty when none were found)");
  if (!Array.isArray(d.dates)) d.dates = [];
  d.papers.forEach((x, i) => {
    const where = "papers[" + i + "]";
    if (!PAPER_TYPES.includes(x.type)) fail(`${where}.type is ${PAPER_TYPES.join(", ")}, not "${x.type}"`);
    if (!("fileId" in x)) fail(`${where} needs the fileId OneDrive gave it`);
    if (!("modifiedAt" in x)) x.modifiedAt = "";
  });
  if (d.papers.length > 16) d.papers = d.papers.slice(0, 16);
  checkDates(d, files);
}
/** The searches every morning needs, and the lanes they fill: a lane left empty while its
 *  answer holds files is a read that skipped a step. */
const MORNING = ["mine.json", "shared.json", "big.json"];
function checkLanes(l) {
  for (const name of MORNING) if (!fs.existsSync(path.join(workDir, name))) fail(`refused, ${name} is missing: run that search (your persona has it) before latest`);
  const from14 = dayStart(-14).getTime();
  const mine = pagesSafe("mine.json").flatMap((p) => (p && p.files) || []).filter((x) => x && (x.modifiedByMeTime || x.modifiedTime) && new Date(x.modifiedByMeTime || x.modifiedTime).getTime() >= from14);
  if (mine.length && !(Array.isArray(l.recent) && l.recent.length)) fail(`refused, recent is empty while mine.json has ${mine.length} files they changed in the last 14 days`);
  const big = pagesSafe("big.json").flatMap((p) => (p && p.files) || []).filter((x) => x && Number(x.quotaBytesUsed || x.size) >= 1024 * 1024);
  if (big.length && !(Array.isArray(l.big) && l.big.length)) fail(`refused, big is empty while big.json has ${big.length} files of 1 MB or more`);
}
/** A gist that is the file name again (give or take its extension) is left out. */
function dropEchoGists(o) {
  const bare = (v) => String(v || "").toLowerCase().replace(/\.[a-z0-9]{2,5}$/, "").replace(/[^a-z0-9]+/g, " ").trim();
  if (Array.isArray(o)) { o.forEach(dropEchoGists); return; }
  if (!o || typeof o !== "object") return;
  if (typeof o.gist === "string" && (o.name || o.file) && bare(o.gist) === bare(o.name || o.file)) delete o.gist;
  for (const v of Object.values(o)) if (v && typeof v === "object") dropEchoGists(v);
}
/** Papers whose dates people miss, most important first. */
const MUST_READ = [/passport/i, /\bID\b|licen[cs]e\b/i, /insurance|policy/i, /tax|1099|W-2/i, /membership|subscription|agreement|contract|renewal/i, /lease|mortgage|deed/i, /registration/i, /warranty/i];
/** What a dates search is saved as, and what it looks for, by the file it fills. */
const DATE_SEARCHES = { papers: ["find-papers.json", "papers"], dates: ["contracts.json", "contracts"] };
/**
 * No dates without reading: the search must be saved, and when it found files, some of them
 * read into data/.work/ as doc-<n>.txt or doc-<n>.pdf. A first read that skips this tells the
 * person nothing needs them while a deadline sits in their OneDrive.
 */
function checkRead(which, d) {
  const [search, what] = DATE_SEARCHES[which] || [];
  if (!search) return;
  if (!fs.existsSync(path.join(workDir, search))) fail(`refused, ${search} is missing: run that search first (your persona has it), then read the ${what} it finds`);
  const found = pagesSafe(search).flatMap((p) => (p && p.files) || []).filter((x) => x && x.mimeType !== FOLDER).length;
  if (!found) return;
  const docs = fs.readdirSync(workDir).filter((x) => /^doc-[A-Za-z0-9!_.-]+\.(txt|pdf|jpe?g|png|gif|webp|heic)$/i.test(x));
  const need = Math.min(found, 4);
  if (docs.length < need) fail(`refused, ${search} found ${found} files and ${docs.length} ${docs.length === 1 ? "was" : "were"} read: read at least ${need} (up to six) with "node my-files/first-sort.mjs read <fileId>", the ones that matter most, and copy their dates`);
  // The papers that hold the dates people miss, by kind, then newest: these are read by id.
  if (which === "papers") {
    const all = pagesSafe(search).flatMap((p) => (p && p.files) || []).filter((x) => x && x.id && x.mimeType !== FOLDER);
    // One of each kind first (the newest), then the next of each, up to twelve: a crowded kind
    // never pushes a whole other kind out.
    // Each paper counts under the first kind it fits ("Driver license renewal" is a license).
    const kindOf_ = (x) => MUST_READ.findIndex((r) => r.test(x.name || ""));
    const kinds = MUST_READ.map((r, i) => all.filter((x) => kindOf_(x) === i).sort((a, b) => String(b.modifiedTime || "").localeCompare(String(a.modifiedTime || ""))));
    const must = [], seen = new Set();
    for (let round = 0; must.length < 12 && kinds.some((k) => k.length > round); round++) {
      for (const k of kinds) { const x = k[round]; if (x && !seen.has(x.id) && must.length < 12) { seen.add(x.id); must.push(x); } }
    }
    const readIds = new Set(docs.map((x) => x.replace(/^doc-|\.(txt|pdf|jpe?g|png|gif|webp|heic)$/gi, "")));
    const missing = must.filter((x) => !readIds.has(x.id));
    if (missing.length) fail(`refused, read these papers too, each with "node my-files/first-sort.mjs read <fileId>": ${missing.map((x) => x.name + " (" + x.id + ")").join(", ")}`);
  }
  // A signed contract or a scanned paper is usually a PDF: reading only what exports as text misses it.
  const pdfs = pagesSafe(search).flatMap((p) => (p && p.files) || []).filter((x) => x && x.mimeType === "application/pdf").length;
  if (pdfs && !docs.some((x) => /\.pdf$/i.test(x))) fail(`refused, ${search} found ${pdfs} PDF${pdfs === 1 ? "" : "s"} and you read none: a signed contract or a scanned paper is usually a PDF, so read the ones that matter with read <fileId> and look at them too`);
  if (which === "papers" && Array.isArray(d.papers) && !d.papers.length && !(typeof d.none === "string" && d.none.trim())) {
    fail(`refused, ${search} found ${found} files and papers is empty: list the ones that are papers, or say in "none" why none of them is`);
  }
}
/** data/sharing.json: "anyone" only for a file a visibility search answered with; "outside"
 *  only with domains written in a saved answer. */
function checkSharing(d, files) {
  if (!Array.isArray(d.open)) fail("sharing.json needs an open list (empty when nothing is open)");
  const text = savedText();
  d.open.forEach((x, i) => {
    const where = "open[" + i + "]";
    if (x.how !== "anyone" && x.how !== "outside") fail(`${where}.how is anyone or outside`);
    const f = files.get(String(x.fileId));
    if (x.how === "anyone" && f && !f.in.some((name) => /^anyone/i.test(name))) fail(`refused, ${where} is not in the anyone-with-the-link answer (save it as anyone*.json)`);
    if (x.how === "outside") {
      if (!Array.isArray(x.with) || !x.with.length) fail(`${where}.with lists the outside domains`);
      for (const dom of x.with) if (!text.includes("@" + dom) && !text.includes('"' + dom + '"')) fail(`refused, ${where}: ${dom} is not in any saved answer`);
    }
  });
  d.open.sort((a, b) => (b.sensitive === true) - (a.sensitive === true));
}

/** Fill the placeholders; then every amount left must be in the mail, and no claim word typed. */
function fill(text, where) {
  const made = [];
  const out = String(text).replace(/\{(count|sum|free|evenings|dates|week):([^}]+)\}/g, (_, kind, spec) => {
    const [file, one, many] = spec.split("|").map((s) => s.trim());
    // Like {count:}, a word is added only when it is asked for: {evenings:events.json|free evening|free evenings}.
    const v = kind === "count" ? countWords(spec.trim())
      : kind === "sum" ? sumWords(file)
      : kind === "free" ? freeWords(file)
      : kind === "evenings" ? withWord(eveningsCount(file), false, one, many)
      : kind === "week" ? withWord(weekCount(file), false, one, many)
      : withWord(datesCount(file), false, one, many);
    made.push(v);
    return v;
  });
  let rest = out;
  for (const v of made) rest = rest.replace(v, "");
  if (/(^|\D)1\*{0,2} [a-z]+s\b/i.test(out) && !/1\*{0,2} (hours?|days?)\b/.test(out)) fail(`refused, "1 ...s": use {count:<file>|one|many}`);
  // "**Two payments**": a count written as a word is a count nobody made.
  if (/\*\*[^*]*\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b[^*]*\*\*/i.test(rest)) fail("refused, a count written as a word: use {count:<file>|one|many}");
  if (/\b(\w+ \w+) \1\b/i.test(out)) fail("refused, words are doubled: the helper adds the word you give after |, don't type it again");
  // "0 birthdays" is not a finding: a line whose numbers are all 0 says nothing.
  // The finding is the bold part: "**0 birthdays** in the next 30 days" is a 0.
  const bold = (out.match(/\*\*[^*]+\*\*/g) || []).join(" ");
  const nums = ((bold || out).replace(/\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}/g, "").match(/\d[\d,.]*/g) || []);
  if (where === "the line" && nums.length && nums.every((x) => Number(x.replace(/,/g, "")) === 0)) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
  // On a calendar, "all", "only", "none" and the like are facts the helper cannot check.
  if (CONFIG.noClaimWords && /\b(all|every|everyone|none|nothing|only|nearly|always|never|nobody)\b/i.test(rest)) fail(`refused, a word like "all" or "only" in ${where} states a fact nobody counted: leave it out`);
  const saved = (rest.match(MONEY) || []).length ? savedText() : "";
  for (const amount of rest.match(MONEY) || []) {
    if (!timesWritten(saved, amount.trim())) fail(`refused, ${amount.trim()} in ${where} is not written in any saved answer: use {sum:<file>} for a total`);
  }
  return out;
}

/** Strings get their placeholders; money must be in the mail; zero money, a typed 0 and
 *  empty fields are left out, at any depth: "₪0 came in" is not a finding. */
function tidy(o, where) {
  for (const [key, v] of Object.entries(o)) {
    if (v && typeof v === "object" && !Array.isArray(v)) { tidy(v, where + "." + key); if (!Object.keys(v).length) delete o[key]; continue; }
    if (typeof v === "string") {
      const s = fill(v, where + "." + key);
      if (/^\D{0,4}0+([.,]0+)?\D{0,4}$/.test(s.trim()) || !s.trim()) { delete o[key]; continue; }
      o[key] = s;
    }
    if (v === null || v === 0 || (Array.isArray(v) && !v.length)) delete o[key];
  }
}

/** One write to reading.json at a time: two at once would each write their own copy and lose one. */
function lockReading() {
  const lock = path.join(dataDir, ".reading.lock");
  const until = Date.now() + 8000;
  for (;;) {
    try { fs.mkdirSync(lock); break; } catch {
      try { if (Date.now() - fs.statSync(lock).mtimeMs > 15000) { fs.rmSync(lock, { recursive: true, force: true }); continue; } } catch { continue; }
      if (Date.now() > until) fail("another push is still running: push one line at a time");
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
  process.on("exit", () => { try { fs.rmSync(lock, { recursive: true, force: true }); } catch { /* gone */ } });
}

// ── The gift: one thing the owner can act on now, shown while the reading goes on ──
// Each template names its kinds and what each one needs (CONFIG.gift).
const GIFT_KINDS = (CONFIG.gift && CONFIG.gift.kinds) || {};
/** A date as Gmail wrote it ("Tue, 23 Sep 2026 16:40:00 -0400", or internalDate in ms). A
 *  date with no year ("October 15") is the next one from today. */
function gmailDate(v) {
  const s = String(v).trim();
  let d = /^\d{12,14}$/.test(s) ? new Date(Number(s)) : new Date(s);
  if (isNaN(d.getTime())) return null;
  if (!/\b\d{4}\b/.test(s) && !/^\d{12,14}$/.test(s)) {
    d.setFullYear(new Date().getFullYear());
    if (d.getTime() < dayStart(-1).getTime()) d.setFullYear(d.getFullYear() + 1);
  }
  return d;
}
function giftOf(g) {
  if (!g || typeof g !== "object" || Array.isArray(g)) fail("the gift must be an object");
  const kind = String(g.kind || "");
  if (!GIFT_KINDS[kind]) fail(`the gift kind is ${Object.keys(GIFT_KINDS).join(", ")}, not "${kind}"`);
  for (const key of GIFT_KINDS[kind]) if (typeof g[key] !== "string" || !g[key].trim()) fail(`a ${kind} gift needs ${key}`);
  const out = { kind };
  const saved = savedText();
  // Who, what, when and where are copied from a saved answer, never typed.
  for (const key of ["who", "subject", "since", "when", "threadId", "file", "fileId"]) {
    if (g[key] === undefined || g[key] === null || g[key] === "") continue;
    const v = String(g[key]).trim();
    if (v.length > 160) fail(`${key} is longer than 160 characters`);
    if (!saved.includes(v) && !saved.includes(JSON.stringify(v).slice(1, -1))) fail(`refused, the gift's ${key} "${v}" is not written in any saved answer: copy it as OneDrive wrote it`);
    out[key] = v;
  }
  // The file is one OneDrive answered with, under that name; an open file is in the
  // anyone-with-the-link answer.
  if (out.fileId) {
    const f = driveFiles().get(out.fileId);
    if (!f) fail(`refused, no file with id ${out.fileId} in the saved answers`);
    if (out.file && out.file !== f.name) fail(`refused, the file with id ${out.fileId} is called "${f.name}"`);
    out.file = f.name;
    out.fileKind = kindOf(f.mimeType);
    if (kind === "open" && !f.in.some((name) => /^anyone/i.test(name))) fail("refused, that file is not in the anyone-with-the-link answer");
  } else if (CONFIG.drive && kind !== "calm" && kind !== "space") fail(`a ${kind} gift needs the fileId of its file`);
  // A OneDrive nearly full: the helper reads the storage itself, and it must be 80% or more.
  if (kind === "space") {
    const st = storageOf();
    if (!st || !st.limit) fail("refused, about.json has no storage limit: give another kind");
    if (st.used / st.limit < 0.8) fail("refused, the OneDrive is less than 80% full: give another kind");
    out.used = st.used;
    out.limit = st.limit;
  }
  if (out.since) {
    const d = gmailDate(out.since);
    if (!d) fail(`since "${out.since}" is not a date: copy the Date header or internalDate`);
    if (d.getTime() > Date.now() + 5 * 60000 || d.getTime() < Date.now() - 60 * DAY) fail("since must be a day in the last 60 days");
    out.since = iso(d);
  }
  // When it is coming: a day from today to 60 days on, copied as the mail writes it.
  if (out.when) {
    const d = gmailDate(out.when);
    if (!d) fail(`when "${out.when}" is not a date: copy the day as the mail writes it, like "October 15, 2026"`);
    if (d.getTime() < dayStart(0).getTime() || d.getTime() > Date.now() + 60 * DAY) fail("when must be a day from today to 60 days from now");
    out.when = ymd(d);
  }
  // Money as the mail writes it, each amount in a saved answer.
  for (const key of ["amount", "was"]) {
    if (g[key] === undefined || g[key] === "") continue;
    const v = String(g[key]).trim();
    const m = v.match(MONEY);
    if (!m || m.length !== 1 || m[0].trim() !== v) fail(`${key} is one amount with its currency, like "₪289.00"`);
    if (!timesWritten(saved, v)) fail(`refused, ${v} is not written in any saved answer: copy the amount as the mail writes it`);
    out[key] = v;
  }
  if (out.threadId && !/^[0-9a-f]{8,24}$/i.test(out.threadId)) fail("threadId is Gmail's thread id, like 18c2f4a9b0e1d2c3");
  // The gist is one line in your words: what they want. No numbers: those are the helper's.
  if (g.gist !== undefined && g.gist !== "") {
    const gist = fill(String(g.gist).trim(), "the gist");
    if (gist.length > 140) fail("the gist is longer than 140 characters");
    if (/\d/.test(gist)) fail("refused, a number in the gist: say what they want, without numbers");
    out.gist = gist;
  }
  // Counts only through {count:<file>}: the helper counts.
  for (const key of ["count", "unread"]) {
    if (g[key] === undefined || g[key] === "") continue;
    const typed = String(g[key]).trim();
    if (!/^\{count:[^}]+\}$/.test(typed)) fail(`${key} must be {count:<file>|one|many}, so the helper counts it`);
    out[key] = fill(typed, "the gift's " + key);
  }
  // Calendar: name the event by its id; its title, time, place and guests come from the
  // calendar's own answer, never typed.
  for (const [key, n] of [["eventId", ""], ["eventId2", "2"]]) {
    if (g[key] === undefined || g[key] === "") continue;
    const e = eventsOf("events.json").find((x) => x && x.id === String(g[key]));
    if (!e) fail(`refused, no event with id ${g[key]} in events.json (cancelled and declined ones do not count)`);
    const start = new Date((e.start && (e.start.dateTime || e.start.date + "T00:00:00")) || 0);
    const end = new Date((e.end && (e.end.dateTime || e.end.date + "T00:00:00")) || start);
    if (end.getTime() <= Date.now() || start.getTime() > Date.now() + 31 * DAY) fail(`refused, ${e.summary || "that event"} is not coming up in the next 30 days`);
    out["title" + n] = String(e.summary || "Busy").slice(0, 120);
    out["start" + n] = allDay(e) ? e.start.date : iso(start);
    if (!allDay(e)) out["end" + n] = iso(end);
    if (!n) {
      const guests = (e.attendees || []).filter((a) => a && !a.self && !a.resource);
      const names = guests.map((a) => a.displayName).filter(Boolean).slice(0, 3);
      if (names.length) out.people = names;
      if (guests.length - names.length > 0) out.morePeople = guests.length - names.length;
      if (e.location) out.place = String(e.location).split(",")[0].trim().slice(0, 80);
      if (typeof e.htmlLink === "string" && e.htmlLink.startsWith("https://www.google.com/calendar/")) out.link = e.htmlLink;
    }
  }
  if (kindNeeds(kind, "eventId2")) {
    // A clash: two timed events that really overlap.
    if (!out.end || !out.end2 || !(new Date(out.start) < new Date(out.end2) && new Date(out.start2) < new Date(out.end))) fail("refused, those two events do not overlap");
    if (g.eventId === g.eventId2) fail("refused, a clash needs two different events");
  }
  if (kindNeeds(kind, "people") && !out.people && !out.morePeople) fail("refused, that event has no other guests");
  if (kindNeeds(kind, "birthday")) {
    const e = eventsOf("events.json").find((x) => x && x.id === String(g.eventId));
    if (!(e.eventType === "birthday" || /birthday|anniversary|יום הולדת/i.test(e.summary || ""))) fail("refused, that event is not a birthday or an anniversary");
  }
  // The next free stretch, worked out by the helper from the calendar (3 hours or more).
  if (kindNeeds(kind, "free")) {
    const free = freeWords("events.json");
    if (!free) fail("refused, there is no free stretch of 3 hours in the next 14 days: give calm");
    out.free = free;
    const span = freeSpan("events.json");
    out.freeStart = iso(new Date(span[0]));
    out.freeEnd = iso(new Date(span[1]));
  }
  return out;
}
/** What a kind needs beyond its fields: "people" (guests), "birthday", "free", "eventId2". */
function kindNeeds(kind, what) { return ((CONFIG.gift && CONFIG.gift.needs && CONFIG.gift.needs[kind]) || []).includes(what) || (what === "eventId2" && (GIFT_KINDS[kind] || []).includes("eventId2")); }

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "window") {
  const n = new Date();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  console.log([
    `NOW='${iso(n)}'`, `FROM0='${iso(dayStart(0))}'`, `TODAY='${ymd(dayStart(0))}'`, `YESTERDAY='${ymd(dayStart(-1))}'`, `WEEK_END='${ymd(dayStart(6))}'`,
    `END7='${iso(dayStart(7))}'`, `FROM7='${iso(dayStart(-7))}'`, `FROM30='${iso(dayStart(-30))}'`, `FROM90='${iso(dayStart(-90))}'`,
    `TO30='${iso(dayStart(30))}'`, `TO90='${ymd(dayStart(90))}'`, `OFFSET='${offsetOf(n)}'`, `TZ_NAME='${tz}'`,
  ].join("\n"));
} else if (cmd === "start") {
  // Answers left from an earlier run are not this run's; ones saved in the last 15 minutes are.
  if (fs.existsSync(workDir)) for (const f of fs.readdirSync(workDir)) {
    const p = path.join(workDir, f);
    try { if (Date.now() - fs.statSync(p).mtimeMs > 15 * 60000) fs.rmSync(p, { recursive: true, force: true }); } catch { /* busy: left */ }
  }
  fs.mkdirSync(workDir, { recursive: true });
  writeJson(readingFile, { schema: `${CONFIG.schema}/reading@1`, startedAt: iso(new Date()), done: false, lines: [] });
  console.log("reading started; save answers in " + path.relative(process.cwd(), workDir));
} else if (cmd === "get" || cmd === "read") {
  // OneDrive is read here, never by hand. A refusal ends with a code: 2 not connected, 3 sign
  // in again, 4 not allowed. process.exit is never called while a connection is open.
  const opts = {};
  const names = [];
  for (let i = 0; i < args.length; i++) { if (args[i] === "--clients") opts.clients = args[++i]; else names.push(args[i]); }
  if (!names.length) fail(cmd === "get" ? "get " + Object.keys(GETS).join(" | ") + ", or one search by name" : "read <fileId>");
  fs.mkdirSync(workDir, { recursive: true });
  (cmd === "get" ? getAll(names, opts) : (async () => { for (const id of names) await readFile(id); })()).catch((e) => {
    console.error("first-sort: " + (e && e.message ? e.message : String(e)));
    process.exitCode = e instanceof Stop ? e.code : 1;
  });
} else if (cmd === "list") {
  // Every file in a saved answer, one line each, so a long answer is never cut short to read it.
  for (const name of args) {
    const all = pagesSafe(name).flatMap((p) => [].concat((p && p.files) || [], (p && p.drives) || []));
    console.log(`${name}: ${all.length} ${all.length === 1 ? "file" : "files"}`);
    for (const x of all) console.log([x.id, kindOf(x.mimeType || ""), x.name, x.modifiedTime ? String(x.modifiedTime).slice(0, 10) : "", (x.parents || [])[0] || ""].join(" | "));
  }
} else if (cmd === "count") {
  for (const spec of args) { const c = countFile(spec); console.log(`${spec}: ${c.n}${c.more ? " (there is more than this)" : ""}`); }
} else if (cmd === "push") {
  lockReading();
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  if (r.done) fail("the reading is done: no more lines");
  const typed = String(args.join(" ") || "").trim();
  // "$2,679" in double quotes reaches here as ",679": refuse what the shell ate.
  if (/(^|[\s(*])[,.]\d/.test(typed)) fail("refused, a number lost its start (a $ in double quotes?): use single quotes");
  // "$489.00" in double quotes reaches here as "89.00": an amount with no currency.
  if (/(^|[^\d$€£₪¥,.])\d[\d,]*\.\d\d(?!\d)(?!\s?(USD|EUR|GBP|ILS|NIS|₪|€))/.test(typed.replace(/\{[^}]*\}/g, ""))) fail("refused, an amount with no currency (a $ in double quotes?): use single quotes and copy the currency");
  const line = fill(typed, "the line");
  if (!line) fail("empty line");
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object|\{|\}/.test(line)) fail(`refused, the line is broken: ${line}`);
  if (line.length > 200) fail("refused, the line is longer than 200 characters");
  if (r.lines.includes(line)) fail("that line is already there");
  r.lines.push(line);
  writeJson(readingFile, r);
  console.log(`line ${r.lines.length}: ${line}`);
} else if (cmd === "gift") {
  const arg = args.join(" ").trim();
  if (!arg.startsWith("@")) fail("give the gift as @<file>: the JSON your script wrote into data/.work/");
  let g;
  try { g = readJson(workFile(arg.slice(1).replace(/^.*data[\\/]\.work[\\/]/, ""))); } catch { fail(`${arg.slice(1)} is not JSON in data/.work/`); }
  const gift = giftOf(g);
  lockReading();
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  if (r.done) fail("the reading is done: the gift comes while you read");
  if (r.gift) fail("there is a gift already: one is enough");
  r.gift = { ...gift, at: iso(new Date()) };
  writeJson(readingFile, r);
  console.log("gift: " + JSON.stringify(r.gift));
} else if (cmd === "profile") {
  let p;
  const arg = args.join(" ").trim();
  if (!arg.startsWith("@")) fail("give the profile as @<file>: the JSON your script wrote into data/.work/");
  // "@money-desk/data/.work/profile.json" means "@profile.json".
  try { p = readJson(workFile(arg.slice(1).replace(/^.*data[\\/]\.work[\\/]/, ""))); } catch { fail(`${arg.slice(1)} is not JSON in data/.work/`); }
  if (!p || typeof p !== "object" || Array.isArray(p)) fail("the profile must be an object");
  // What the helper works out itself is never taken from the file.
  // mattered30 needs every email of the 30 days sorted by the helper, which it cannot do: left out.
  const own = ["schema", "at", "mattered30", ...Object.keys(CONFIG.counts), ...(CONFIG.free ? ["timeZone", "nextFree", "freeEvenings", "dates30"] : [])];
  for (const key of own) delete p[key];
  tidy(p, "profile");
  for (const [key, name] of Object.entries(CONFIG.counts)) {
    if (!fs.existsSync(path.join(workDir, name))) fail(`${name} is missing: save that answer under that name first`);
    const c = countFile(name);
    // A 0 here can mean Gmail did not sort at all (its tabs are off): not a finding.
    if (!c.more && !(c.n === 0 && (CONFIG.zeroUnknown || []).includes(key))) p[key] = c.n;
  }
  if (CONFIG.free) {
    const ev = fs.existsSync(path.join(workDir, "events.json")) ? "events.json" : fail("events.json is missing: save the coming days' answer under that name first");
    const tz = timeZoneOf(ev);
    if (tz) p.timeZone = tz;
    const free = freeWords(ev);
    if (free) p.nextFree = free;
    if (CONFIG.free === "personal") { p.freeEvenings = eveningsCount(ev); const d = datesCount(ev); if (d) p.dates30 = d; }
  }
  if (CONFIG.drive) {
    delete p.storage;
    const storage = storageOf();
    if (storage) p.storage = storage;
  }
  writeJson(path.join(dataDir, "profile.json"), { ...p, schema: `${CONFIG.schema}/profile@1`, at: iso(new Date()) });
  console.log("profile written: " + Object.keys(p).join(", "));
} else if (cmd === "latest") {
  // latest.json from the JSON your script wrote into data/.work/: the helper sets what it can
  // know for sure (the times, today, the count of what arrived, the time zone).
  const arg = args.join(" ").trim();
  if (!arg.startsWith("@")) fail("give it as @<file>: the latest.json your script wrote into data/.work/");
  let l;
  try { l = readJson(workFile(arg.slice(1).replace(/^.*data[\\/]\.work[\\/]/, ""))); } catch { fail(`${arg.slice(1)} is not JSON in data/.work/`); }
  if (!l || typeof l !== "object" || Array.isArray(l)) fail("latest.json must be an object");
  const n = new Date();
  l.generatedAt = iso(n);
  if (CONFIG.free) {
    l.checkedAt = iso(n);
    l.today = ymd(dayStart(0));
    l.readThrough = ymd(dayStart(-1));
    const hasEvents = fs.existsSync(path.join(workDir, "events.json"));
    const tz = hasEvents ? timeZoneOf("events.json") : "";
    if (tz) l.timeZone = tz;
    // Each event as the calendar has it: cancelled and declined ones out, the guests counted,
    // the place filled in, and the names only the ones the calendar gives.
    if (hasEvents && Array.isArray(l.events)) {
      const byId = new Map(eventsOf("events.json").map((e) => [e.id, e]));
      const raw = new Map(pagesOf("events.json").flatMap((p) => p.items || p.events || []).map((e) => [e && e.id, e]));
      l.events = l.events.filter((ev) => !ev || !ev.id || !raw.has(ev.id) || byId.has(ev.id)).map((ev) => {
        const e = ev && ev.id ? byId.get(ev.id) : null;
        if (!e) return ev;
        const guests = (e.attendees || []).filter((a) => a && !a.self && !a.resource);
        const names = new Set(guests.map((a) => a.displayName).filter(Boolean));
        const people = Array.isArray(ev.people) ? ev.people.filter((p) => names.has(p)).slice(0, 3) : [];
        const out = { ...ev, people, morePeople: Math.max(0, guests.length - people.length) };
        if (!out.place && e.location) out.place = String(e.location).split(",")[0].trim() || null;
        return out;
      });
    }
    // The headline and the note say only what was counted.
    for (const key of ["headline", "note"]) if (typeof l[key] === "string") l[key] = fill(l[key], key);
    l.status = "ok";
  } else {
    // The page shows a file only in its own shape: schema, not an example, every lane a list.
    if (typeof l.headline !== "string" || !l.headline.trim()) fail("latest.json needs a headline (\"Nobody is waiting on you\" is one)");
    // Every string, in every card: placeholders filled, and each amount written in the mail.
    const walk = (o, where) => {
      for (const [k, v] of Object.entries(o)) {
        if (typeof v === "string") o[k] = fill(v, where + "." + k);
        else if (v && typeof v === "object") walk(v, where + "." + k);
      }
    };
    walk(l, "latest");
    if (CONFIG.latest) {
      l.schema = CONFIG.latest.schema;
      for (const lane of CONFIG.latest.lanes) if (!Array.isArray(l[lane])) l[lane] = [];
    }
    l.example = false;
    // What arrived is the helper's count of the 30-day inbox, and the window says so.
    delete l.arrived;
    if (CONFIG.counts.mail30 && fs.existsSync(path.join(workDir, CONFIG.counts.mail30))) {
      const c = countFile(CONFIG.counts.mail30);
      if (!c.more) { l.arrived = c.n; l.since = ymd(dayStart(-30)); }
    }
    if (CONFIG.drive) {
      // Every card names a file OneDrive answered with; storage, the account and what changed
      // this week come from OneDrive's own answers.
      checkLanes(l);
      checkFiles(l, "latest", driveFiles());
      dropEchoGists(l);
      // "What fills your OneDrive" is for files that take room: a file under 1 MB is not one.
      if (Array.isArray(l.big)) l.big = l.big.filter((b) => b && Number(b.size) >= 1024 * 1024);
      delete l.storage; delete l.changed7; delete l.changed7More; delete l.account;
      const storage = storageOf();
      if (storage) l.storage = storage;
      const account = accountOf();
      if (account) l.account = account;
      if (CONFIG.changed && fs.existsSync(path.join(workDir, CONFIG.changed))) {
        const c = countFile(CONFIG.changed);
        l.changed7 = c.n;
        if (c.more) l.changed7More = true;
      }
      l.since = ymd(dayStart(-7));
    }
  }
  writeJson(path.join(dataDir, "latest.json"), l);
  if (!CONFIG.free) writeJson(path.join(dataDir, "status.json"), { at: iso(n), ok: true });
  console.log("latest.json written" + (CONFIG.free ? "" : ", and status.json"));
} else if (cmd === "done") {
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  // done deletes the saved answers: after a refusal that throws away the read. "done failed" when it really failed.
  const latestFile = path.join(dataDir, "latest.json");
  const wrote = fs.existsSync(latestFile) && fs.statSync(latestFile).mtimeMs >= new Date(r.startedAt).getTime();
  if (!wrote && args[0] !== "failed") fail("refused, latest.json was not written in this read: fix what the helper refused and run latest first (or \"done failed\" when the read really failed)");
  r.done = true;
  writeJson(readingFile, r);
  try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("data/.work/ is busy: delete it in your next call"); }
  console.log("reading done");
} else if (cmd === "save" && CONFIG.drive) {
  // data/sharing.json or data/dates.json, from the JSON your script wrote into data/.work/.
  const which = String(args[0] || "");
  const saves = CONFIG.saves || ["sharing", "dates"];
  if (!saves.includes(which)) fail(saves.map((w) => `save ${w} @<file>`).join(" or "));
  const arg = args.slice(1).join(" ").trim();
  if (!arg.startsWith("@")) fail(`give it as @<file>: the ${which}.json your script wrote into data/.work/`);
  let d;
  try { d = readJson(workFile(arg.slice(1).replace(/^.*data[\\/]\.work[\\/]/, ""))); } catch { fail(`${arg.slice(1)} is not JSON in data/.work/`); }
  if (!d || typeof d !== "object" || Array.isArray(d)) fail(`${which}.json must be an object`);
  if (typeof d.headline !== "string" || !d.headline.trim()) fail(`${which}.json needs a headline`);
  const files = driveFiles();
  checkRead(which, d);
  if (which === "dates") checkDates(d, files);
  else if (which === "papers") checkPapers(d, files);
  else checkSharing(d, files);
  checkFiles(d, which, files);
  d.headline = fill(d.headline, "headline");
  d.schema = `${CONFIG.schema}/${which}@1`;
  d.example = false;
  d.generatedAt = iso(new Date());
  writeJson(path.join(dataDir, which + ".json"), d);
  console.log(which + ".json written");
} else if (cmd === "clean") {
  try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("data/.work/ is busy: delete it in your next call"); }
  console.log("data/.work/ deleted");
} else {
  fail("use window, start, count, push, gift, profile, latest, save, clean or done");
}
