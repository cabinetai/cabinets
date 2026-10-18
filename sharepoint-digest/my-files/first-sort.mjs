#!/usr/bin/env node
// Every reading of a person's SharePoint goes through here: every Graph answer is saved by this
// helper, every number is counted from those answers, and every name, file and time is copied
// from them, never typed. The agent only picks (by ref) and writes its own short words.
// Run it from the cabinet root:
//   node my-files/first-sort.mjs window            shell lines to eval: NOW TODAY SINCE TZ_NAME
//   node my-files/first-sort.mjs start             the first reading: new data/reading.json, data/.work/,
//                                                  reads the last 7 days
//   node my-files/first-sort.mjs start --morning   a morning: data/.work/ only, reads since the last
//                                                  morning (at most 7 days)
//   node my-files/first-sort.mjs start --chat      a question in the chat: like a morning, never while one runs,
//                                                  and it writes nothing the page shows
//   node my-files/first-sort.mjs me                who signed in (always first)
//   node my-files/first-sort.mjs files             every SharePoint file that changed in the window, its
//                                                  site, and the saves on the ones others changed
//   node my-files/first-sort.mjs more              list rows with your name, who can open your files,
//                                                  look-alike files and the news on your sites
//   node my-files/first-sort.mjs find '<words>'    any file by its words, newest first (for a question in the chat)
//   node my-files/first-sort.mjs versions <drive> <item>   every save of one file: version, when, who
//   node my-files/first-sort.mjs changes [ref...]    what others changed in your files (default: all of yours): the
//                                                  newest save against the one before theirs, lines - out, + in
//   node my-files/first-sort.mjs words <drive> <item> [version]
//                                                  the words inside a Word, Excel, PowerPoint or text file,
//                                                  or inside one of its earlier saves
//   node my-files/first-sort.mjs get <name> '<path>' [pages]
//                                                  one more Graph GET (path from me/, sites/ or drives/)
//   node my-files/first-sort.mjs list [ref]        the sites, then their files, with refs
//                                                  (s1 a site, f1 a file, r1 a row, t1 look-alikes, n1 news)
//   node my-files/first-sort.mjs yours             your files someone else changed, newest first
//   node my-files/first-sort.mjs rows              open list rows that name you
//   node my-files/first-sort.mjs open              files that anyone with the link, or a guest, can open
//   node my-files/first-sort.mjs twins             look-alike files in one folder ("v2", "final", "copy")
//   node my-files/first-sort.mjs news              news posts on your sites in the window
//   node my-files/first-sort.mjs push '<line>'     add one line to the reading (single quotes)
//   node my-files/first-sort.mjs gift @<file>      the one thing for the person, shown while you read
//   node my-files/first-sort.mjs profile @<file>   write data/profile.json ("This is you")
//   node my-files/first-sort.mjs latest @<file>    write data/latest.json and data/status.json
//   node my-files/first-sort.mjs done              finish, delete data/.work/
// Placeholders in a line or the headline (the helper counts; the word after | follows the number):
//   {changed:|file|files}   files changed in the window     {sites:|site|sites}     sites that moved
//   {people:|person|people} people who changed them         {yours:|file|files}     your files others changed
//   {rows:|row|rows}        open rows with your name        {open:|file|files}      files open to anyone or guests
//   {twins:|set|sets}       look-alike sets                 {in:s3|file|files}      files changed on one site
// A line may hold no other digit than these and a clock time. A **bold** name must be written
// in a saved answer.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const SCHEMA = "sharepoint/my-files";
// A stand-in Graph on this computer, for tests only.
const GRAPH = /^http:\/\/127\.0\.0\.1:\d+\/v1\.0$/.test(process.env.FIRST_SORT_TEST_GRAPH || "") ? process.env.FIRST_SORT_TEST_GRAPH : "https://graph.microsoft.com/v1.0";
// Links kept on the page open SharePoint itself, nothing else.
const SAFE_LINK = /^https:\/\/[a-z0-9-]+\.sharepoint(-df)?\.(com|us|cn|de)\//i;
const GIFT_KINDS = ["yours", "row", "open", "twins", "calm"];
// A file read for its words: at most this much downloaded, and this much unpacked from it.
const MAX_FILE_BYTES = 20 * 1024 * 1024, MAX_UNZIPPED_BYTES = 50 * 1024 * 1024;
const MAX_HITS = 500, MAX_SITES = 25, MAX_VERSIONS = 40, MAX_LIST_SITES = 8, MAX_LISTS = 12, MAX_SHARING = 30, MAX_FOLDERS = 12, MAX_CHANGES = 8;

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const readingFile = path.join(dataDir, "reading.json");
const refsFile = path.join(workDir, ".refs.json");
const savedList = path.join(workDir, ".saved.json");
const pathsFile = path.join(workDir, ".paths.json");
const modeFile = path.join(workDir, ".mode.json");
const changesFile = path.join(workDir, ".changes.json");
const HOUR = 3600000, DAY = 86400000;

// ── Time, in this machine's zone (the person's own) ──
const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, "0");
const hhmm = (d) => pad(d.getHours()) + ":" + pad(d.getMinutes());
const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
function offsetOf(d) { const o = -d.getTimezoneOffset(); return (o >= 0 ? "+" : "-") + pad(o / 60) + ":" + pad(o % 60); }
function iso(d) { return ymd(d) + "T" + hhmm(d) + ":" + pad(d.getSeconds()) + offsetOf(d); }
const utc = (d) => d.toISOString().replace(/\.\d{3}Z$/, "Z");
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

/** Stops the run with a code the agent reads. Never process.exit here: with a Graph connection
 *  still open, Node on Windows crashes and the code is lost. The command chain catches this. */
class Exit extends Error {}
function fail(msg, code) { console.error("first-sort: " + msg); process.exitCode = code || 1; throw new Exit(msg); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function writeJson(file, value) {
  const tmp = file + ".part";
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}
function cleanName(name) {
  const n = String(name || "").trim().replace(/\.json$/i, "").replace(/^.*data[\\/]\.work[\\/]/, "");
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/i.test(n)) fail(`"${name}" is not a name: use letters, digits and "-", like site-3`);
  return n;
}
function mode() { try { return readJson(modeFile); } catch { return fail("run start first"); } }
function setMode(patch) { writeJson(modeFile, { ...mode(), ...patch }); }
/** Where the window starts: the last morning's time on a morning (at most 7 days back), else 7 days. */
function sinceFor(morning) {
  const week = new Date(Date.now() - 7 * DAY);
  if (!morning) return week;
  try {
    const l = readJson(path.join(dataDir, "latest.json"));
    const at = new Date(l.generatedAt);
    if (l.example !== true && !isNaN(at) && at < new Date()) return at > week ? at : week;
  } catch { /* no last morning */ }
  return new Date(Date.now() - DAY);
}
function since() { return new Date(mode().since); }

// ── Saved answers ──
function savedNames() { try { return readJson(savedList); } catch { return []; } }
function has(name) { return savedNames().includes(name); }
function pagesOf(name) {
  const n = cleanName(name);
  if (!has(n)) fail(`${n} was not saved by this helper: only Graph's own answers count`);
  return fs.readFileSync(path.join(workDir, n + ".json"), "utf8").split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
}
function itemsOf(name) { return pagesOf(name).flatMap((p) => (Array.isArray(p.value) ? p.value : [p])); }
function pathOf(name) { try { return readJson(pathsFile)[name] || ""; } catch { return ""; } }
let savedTextCache = null;
function savedText() {
  if (savedTextCache === null) {
    const words = [];
    const walk = (v) => {
      if (typeof v === "string") { if (!/^https?:|^[a-z0-9-]+\.sharepoint|^b!|^[0-9a-f-]{20,}$/i.test(v)) words.push(v); }
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (!/^@odata|id$|webUrl|link|loginName|email|mail$|userPrincipalName/i.test(k)) walk(x);
    };
    for (const n of savedNames()) { try { for (const l of fs.readFileSync(path.join(workDir, n + ".json"), "utf8").split(/\r?\n/)) if (l.trim()) walk(JSON.parse(l)); } catch { /* unreadable */ } }
    savedTextCache = words.join("\n");
  }
  return savedTextCache;
}
/** Written in a saved answer, as Graph wrote it (JSON escapes included). */
function inSaved(v) {
  const t = savedText();
  const s = String(v).trim();
  return !!s && s.length >= 2 && t.toLowerCase().includes(s.toLowerCase());
}
function remember(n, p, pagesOut) {
  fs.mkdirSync(workDir, { recursive: true });
  fs.writeFileSync(path.join(workDir, n + ".json"), pagesOut.map((x) => JSON.stringify(x)).join("\n") + "\n");
  const names = savedNames();
  if (!names.includes(n)) writeJson(savedList, [...names, n]);
  let paths = {};
  try { paths = readJson(pathsFile); } catch { /* first one */ }
  writeJson(pathsFile, { ...paths, [n]: p });
  savedTextCache = null;
}

// ── Graph ──
async function call(url, init) {
  const token = process.env.MICROSOFT_GRAPH_TOKEN;
  if (!token) fail("MICROSOFT_GRAPH_TOKEN is not set: SharePoint is not connected for this run", 2);
  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(url, {
      ...init,
      headers: { Authorization: "Bearer " + token, Accept: "application/json", Prefer: "HonorNonIndexedQueriesWarningMayFailRandomly", ...(init && init.body ? { "Content-Type": "application/json" } : {}) }
    });
    if ((res.status === 429 || res.status >= 500) && attempt < 2) {
      const wait = Math.min(10, Number(res.headers.get("retry-after")) || 2 * (attempt + 1));
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    break;
  }
  const body = await res.text();
  if (res.status === 401) fail("SharePoint needs a new sign-in (401)", 3);
  if (!res.ok) {
    let code = "";
    try { code = JSON.parse(body).error.code; } catch { /* not JSON */ }
    const e = new Error(`SharePoint answered ${res.status}${code ? " " + code : ""}`);
    e.status = res.status;
    throw e;
  }
  return JSON.parse(body);
}
function cleanPath(raw) {
  // Git Bash on Windows turns "/me/..." into "C:/Program Files/Git/me/...": take the path back.
  let p = String(raw || "").trim().replace(/^[A-Za-z]:[\\/].*?[\\/](?=(me|sites|drives)([\\/?]|$))/, "/");
  if (/^(me|sites|drives)([/?]|$)/.test(p)) p = "/" + p;
  if (!/^\/(me|sites|drives)(\/|\?|$)/.test(p) || /:\/\/|\s/.test(p.replace(/%20/g, ""))) fail("the path starts with me/, sites/ or drives/ and has no spaces (write a space as %20)");
  return p;
}
/** GET a path (up to `pages` pages) and save the answer as `name`. Throws on a refusal. */
async function save(name, rawPath, pagesArg) {
  const p = cleanPath(rawPath);
  const pages = Math.max(1, Math.min(10, Number(pagesArg) || 1));
  // "+" in a query reads as a space: an offset like +03:00 must reach Graph as %2B.
  let url = GRAPH + p.replace(/\+/g, "%2B");
  const out = [];
  for (let i = 0; i < pages && url; i++) {
    const json = await call(url);
    out.push(json);
    url = typeof json["@odata.nextLink"] === "string" && json["@odata.nextLink"].startsWith(GRAPH) ? json["@odata.nextLink"] : "";
  }
  remember(cleanName(name), p, out);
  return out.flatMap((x) => (Array.isArray(x.value) ? x.value : [x]));
}
/** A few at a time: SharePoint slows down a reader that asks too much at once. */
async function inTurns(jobs, size) {
  const out = [];
  for (let i = 0; i < jobs.length; i += size) out.push(...(await Promise.all(jobs.slice(i, i + size).map((j) => j()))));
  return out;
}
/** Search every site for files changed since the window opened, newest first, saved as search-N. */
async function searchChanged(s) {
  // KQL takes the day; the exact time is checked on every hit. A week is always read, so your
  // own recent files are known for sharing even on a quiet morning.
  const day = ymd(new Date(Math.min(s.getTime(), Date.now() - 7 * DAY) - DAY));
  const hits = [];
  for (let from = 0, n = 1; from < MAX_HITS; from += 200, n++) {
    const body = { requests: [{ entityTypes: ["driveItem"], query: { queryString: `IsDocument:true AND LastModifiedTime>=${day}` }, from, size: 200,
      sortProperties: [{ name: "LastModifiedTime", isDescending: true }] }] };
    const json = await call(GRAPH + "/search/query", { method: "POST", body: JSON.stringify(body) });
    remember("search-" + n, "/search/query", [json]);
    const c = ((json.value || [])[0] || {}).hitsContainers || [];
    const box = c[0] || {};
    for (const h of box.hits || []) if (h && h.resource) hits.push(h.resource);
    if (!box.moreResultsAvailable || !(box.hits || []).length) break;
  }
  return hits;
}

// ── The words in a Word, Excel or PowerPoint file: a small zip reader, nothing installed ──
function zipEntries(buf) {
  // The end of the central directory, then each entry it lists. A damaged zip (a broken save
  // by someone else) ends the reading of that zip, never the run: every offset is checked first.
  let end = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) if (buf.readUInt32LE(i) === 0x06054b50) { end = i; break; }
  if (end < 0) fail("that file is not a readable Office file", 4);
  const fits = (at, len) => at >= 0 && at + len <= buf.length;
  const count = buf.readUInt16LE(end + 10);
  let at = buf.readUInt32LE(end + 16);
  let left = MAX_UNZIPPED_BYTES;
  const out = [];
  for (let n = 0; n < count && fits(at, 46) && buf.readUInt32LE(at) === 0x02014b50; n++) {
    const method = buf.readUInt16LE(at + 10), size = buf.readUInt32LE(at + 20);
    const nameLen = buf.readUInt16LE(at + 28), extraLen = buf.readUInt16LE(at + 30), commentLen = buf.readUInt16LE(at + 32);
    const local = buf.readUInt32LE(at + 42);
    if (!fits(at, 46 + nameLen)) break;
    const name = buf.toString("utf8", at + 46, at + 46 + nameLen);
    out.push({ name, read: () => {
      if (!fits(local, 30)) throw new Error("a broken part");
      const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
      if (!fits(start, size)) throw new Error("a broken part");
      // A few MB can unpack to many GB: each part gets only what is left of the file's share.
      if (left <= 0) throw new Error("too much to unpack");
      const raw = buf.subarray(start, start + size);
      const bytes = method === 8 ? zlib.inflateRawSync(raw, { maxOutputLength: left }) : raw.subarray(0, left);
      left -= bytes.length;
      return bytes.toString("utf8");
    } });
    at += 46 + nameLen + extraLen + commentLen;
  }
  // Nothing listed is a broken file, not an empty one: an empty text would read as every line taken out.
  if (!out.length) fail("that file is not a readable Office file", 4);
  return out;
}
function xmlText(xml, para) {
  return xml.replace(new RegExp(`</(${para})>`, "g"), "\n").replace(/<w:tab\/>|<w:br\/>|<a:br\/>|<\/a:t>\s*<a:t>/g, " ").replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}
function officeText(buf, ext) {
  const entries = zipEntries(buf);
  const byNum = (re) => entries.filter((e) => re.test(e.name)).sort((a, b) => Number((/(\d+)\.xml$/.exec(a.name) || [])[1]) - Number((/(\d+)\.xml$/.exec(b.name) || [])[1]));
  if (/^doc/.test(ext)) return entries.filter((e) => e.name === "word/document.xml").map((e) => xmlText(e.read(), "w:p")).join("\n");
  if (/^ppt/.test(ext)) return byNum(/^ppt\/slides\/slide\d+\.xml$/).map((e, i) => `-- slide ${i + 1}\n` + xmlText(e.read(), "a:p")).join("\n");
  // Excel: each sheet's cells, row by row, with the shared words put back in.
  const sst = entries.find((e) => e.name === "xl/sharedStrings.xml");
  const shared = sst ? [...sst.read().matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => xmlText(m[1], "x")) : [];
  return byNum(/^xl\/worksheets\/sheet\d+\.xml$/).map((e, i) => `-- sheet ${i + 1}\n` + [...e.read().matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((r) =>
    [...r[1].matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)].map((c) => {
      const v = /<v>([\s\S]*?)<\/v>/.exec(c[2] || ""), t = /<t[^>]*>([\s\S]*?)<\/t>/.exec(c[2] || "");
      if (/t="s"/.test(c[1]) && v) return shared[Number(v[1])] || "";
      return t ? xmlText(t[1], "x") : v ? v[1] : "";
    }).join(" | ")).join("\n")).join("\n");
}

/** The words of a file, or of one of its saves: { name, text } or { error, code }. */
async function fileWords(driveId, itemId, version) {
  const token = process.env.MICROSOFT_GRAPH_TOKEN;
  if (!token) return { error: "MICROSOFT_GRAPH_TOKEN is not set: SharePoint is not connected for this run", code: 2 };
  const base = `/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}`;
  let meta;
  try { meta = await call(GRAPH + base + "?$select=name,size"); } catch (e) { if (e instanceof Exit) throw e; return { error: e.message + ": that file can't be read" }; }
  const big = { error: "the file is too big to read here (over 20 MB)" };
  if ((meta.size || 0) > MAX_FILE_BYTES) return big;
  const res = await fetch(GRAPH + base + (version ? `/versions/${encodeURIComponent(version)}` : "") + "/content", { headers: { Authorization: "Bearer " + token } });
  if (res.status === 401) fail("SharePoint needs a new sign-in (401)", 3);
  if (!res.ok) return { error: `SharePoint answered ${res.status}: that ${version ? "version" : "file"} can't be read` };
  // An older save can be bigger than the file is now: what comes down is counted too.
  if (Number(res.headers.get("content-length")) > MAX_FILE_BYTES) { await res.body?.cancel().catch(() => {}); return big; }
  const parts = [];
  let got = 0;
  for await (const part of res.body || []) {
    got += part.length;
    if (got > MAX_FILE_BYTES) return big;
    parts.push(part);
  }
  const buf = Buffer.concat(parts);
  const ext = extOf(meta.name);
  let text = "";
  try {
    if (/^(txt|md|csv|json|xml|html?)$/.test(ext)) text = buf.toString("utf8");
    else if (/^(docx|docm|xlsx|xlsm|pptx|pptm)$/.test(ext)) text = officeText(buf, ext);
    else return { error: `a .${ext || "?"} file has no words this helper can read: say so plainly` };
  } catch (e) { if (e instanceof Exit) process.exitCode = 0; return { error: "that save is not a readable Office file" }; }
  return { name: meta.name, text: text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim() };
}
function readChanges() { try { return readJson(changesFile); } catch { return {}; } }
/**
 * One file's change: its newest save against the save before the other person's (your own
 * last save when there is one, else the one just before), as lines taken out and put in.
 */
async function changesOf(f, md) {
  let vs;
  try { vs = (await call(GRAPH + `/drives/${encodeURIComponent(f.driveId)}/items/${encodeURIComponent(f.id)}/versions`)).value || []; }
  catch (e) { if (e instanceof Exit) throw e; return { error: e.message + ": its saves can't be read" }; }
  vs.sort((a, b) => new Date(b.lastModifiedDateTime) - new Date(a.lastModifiedDateTime));
  if (vs.length < 2) return { error: "only one save is kept: nothing to compare" };
  const who = (v) => personOf(v.lastModifiedBy);
  const firstOther = vs.findIndex((v) => !md.isMe(who(v)));
  const before = vs.slice(Math.max(1, firstOther + 1)).find((v) => md.isMe(who(v))) || vs[Math.max(1, firstOther + 1)] || vs[1];
  const [a, b] = [await fileWords(f.driveId, f.id, before.id), await fileWords(f.driveId, f.id)];
  if (a.error || b.error) return { error: a.error || b.error };
  const lines = (t) => t.split("\n").map((x) => x.trim()).filter((x) => x && !/^-- (slide|sheet) \d+$/.test(x));
  const was = lines(a.text), now = lines(b.text);
  const wasSet = new Set(was), nowSet = new Set(now);
  const stamp = (v) => ({ by: (md.isMe(who(v)) ? "you" : who(v).name) || "?", at: iso(new Date(v.lastModifiedDateTime)) });
  return { before: stamp(before), after: stamp(vs[0]), removed: was.filter((x) => !nowSet.has(x)), added: now.filter((x) => !wasSet.has(x)) };
}

// ── The model: sites and files, from the saved answers only ──
function lower(s) { return String(s || "").trim().toLowerCase(); }
function personOf(x) { const u = x && (x.user || x.siteUser || x.application) || null; return u ? { id: u.id || "", name: u.displayName || "", email: lower(u.email || u.userPrincipalName || u.loginName) } : { id: "", name: "", email: "" }; }
function isOneDrive(url) { return /-my\.sharepoint(-df)?\.(com|us|cn|de)\//i.test(String(url || "")); }
function extOf(name) { const m = /\.([a-z0-9]{1,6})$/i.exec(String(name || "")); return m ? m[1].toLowerCase() : ""; }
function stemOf(name) { return String(name || "").replace(/\.[a-z0-9]{1,6}$/i, ""); }
const FAMILY = { docx: "word", doc: "word", docm: "word", rtf: "word", odt: "word", xlsx: "excel", xls: "excel", xlsm: "excel", csv: "excel", ods: "excel",
  pptx: "powerpoint", ppt: "powerpoint", pptm: "powerpoint", odp: "powerpoint", pdf: "pdf", png: "image", jpg: "image", jpeg: "image", gif: "image", svg: "image", mp4: "video", mov: "video" };
function siteKey(id) { return String(id || "").toLowerCase(); }
/** The folders a file sits in, from its address: the part after the site and the library. */
function placeOf(webUrl, siteUrl) {
  try {
    const u = decodeURIComponent(new URL(webUrl).pathname);
    const s = siteUrl ? decodeURIComponent(new URL(siteUrl).pathname).replace(/\/$/, "") : "";
    if (/\/_layouts\//i.test(u) || (s && !u.toLowerCase().startsWith(s.toLowerCase() + "/"))) return { library: "", folder: "" };
    const parts = u.slice(s.length).split("/").filter(Boolean);
    parts.pop();
    const library = parts.shift() || "";
    return { library: /^shared documents$/i.test(library) ? "Documents" : library, folder: parts.join("/") };
  } catch { return { library: "", folder: "" }; }
}

let modelCache = null;
function model() {
  if (modelCache) return modelCache;
  const names = savedNames();
  const meItem = names.includes("me") ? itemsOf("me")[0] : null;
  if (!meItem || !meItem.id) fail("run me first: the helper needs to know who you are");
  const me = { id: meItem.id, name: meItem.displayName || "", first: meItem.givenName || String(meItem.displayName || "").split(" ")[0],
    emails: [lower(meItem.mail), lower(meItem.userPrincipalName)].filter(Boolean) };
  // Search answers often carry only a display name; saves carry the user id.
  const isMe = (p) => !!p && ((p.id && p.id === me.id) || (p.email && me.emails.includes(p.email)) || (!p.id && !p.email && !!p.name && lower(p.name) === lower(me.name)));
  const r = refs();
  const from = since();
  // Sites, with their names.
  const sites = new Map();
  const followed = new Set();
  if (names.includes("followed")) for (const s of itemsOf("followed")) if (s && s.id) followed.add(siteKey(s.id));
  const siteInfo = {};
  for (const n of names.filter((x) => /^site-\d+$/.test(x))) for (const s of itemsOf(n)) if (s && s.id) siteInfo[siteKey(s.id)] = s;
  if (names.includes("followed")) for (const s of itemsOf("followed")) if (s && s.id && !siteInfo[siteKey(s.id)]) siteInfo[siteKey(s.id)] = s;
  const site = (id) => {
    const k = siteKey(id);
    if (!sites.has(k)) {
      const info = siteInfo[k] || {};
      if (!r.site[k]) r.site[k] = "s" + ++r.n.s;
      sites.set(k, { key: k, id, ref: r.site[k], name: info.displayName || info.name || "", link: SAFE_LINK.test(info.webUrl || "") ? info.webUrl : "", url: info.webUrl || "", followed: followed.has(k) });
    }
    return sites.get(k);
  };
  // Files: every search hit, once, newest first. OneDrive stays out; "all" is the last week,
  // "files" what changed in the window.
  for (const k of followed) site(siteInfo[k] ? siteInfo[k].id : k);
  const all = [];
  const seen = new Set();
  const hitNames = names.filter((x) => /^search-\d+$/.test(x)).sort((a, b) => Number(a.slice(7)) - Number(b.slice(7)));
  for (const n of hitNames) {
    for (const page of pagesOf(n)) for (const v of page.value || []) for (const c of v.hitsContainers || []) for (const h of c.hits || []) {
      const it = h && h.resource;
      if (!it || !it.id || !it.name || it.folder) continue;
      const pr = it.parentReference || {};
      const key = (pr.driveId || "") + "|" + it.id;
      if (seen.has(key) || isOneDrive(it.webUrl)) continue;
      const at = new Date(it.lastModifiedDateTime);
      if (isNaN(at) || at < new Date(Date.now() - 8 * DAY)) continue;
      seen.add(key);
      const s = site(pr.siteId || (pr.sharepointIds && pr.sharepointIds.siteId) || "unknown");
      if (!s.name) { try { s.name = decodeURIComponent(new URL(it.webUrl).pathname.split("/").filter(Boolean)[1] || ""); } catch { /* no name */ } }
      const by = personOf(it.lastModifiedBy), made = personOf(it.createdBy);
      all.push({ key, id: it.id, driveId: pr.driveId || "", parentId: pr.id || "", name: it.name, ext: extOf(it.name), site: s, at, by, made,
        mine: isMe(by), madeByMe: isMe(made), created: it.createdDateTime ? new Date(it.createdDateTime) : null, link: SAFE_LINK.test(it.webUrl || "") ? it.webUrl : "", webUrl: it.webUrl || "", size: it.size || 0 });
    }
  }
  all.sort((a, b) => b.at - a.at);
  for (const f of all) { if (!r.file[f.key]) r.file[f.key] = "f" + ++r.n.f; f.ref = r.file[f.key]; }
  for (const f of all) Object.assign(f, placeOf(f.webUrl, f.site.url));
  const files = all.filter((f) => f.at >= from);
  // Search answers may leave out the folder a file is in: the item's own answer has it.
  for (const n of names.filter((x) => /^item-\d+$/.test(x))) for (const it of itemsOf(n)) {
    const f = all.find((x) => x.id === it.id && it.parentReference && (!x.driveId || x.driveId === it.parentReference.driveId));
    if (f && !f.parentId) f.parentId = it.parentReference.id || "";
  }
  // The saves on files that others changed: how many in the window, and whether you saved one before.
  for (const n of names.filter((x) => /^versions-\d+$/.test(x))) {
    const m = /^\/drives\/([^/]+)\/items\/([^/]+)\/versions/.exec(pathOf(n));
    if (!m) continue;
    const f = files.find((x) => x.driveId === decodeURIComponent(m[1]) && x.id === decodeURIComponent(m[2]));
    if (!f) continue;
    const vs = itemsOf(n);
    f.versions = vs.filter((v) => new Date(v.lastModifiedDateTime) >= from && !isMe(personOf(v.lastModifiedBy))).length;
    f.savers = [...new Set(vs.filter((v) => new Date(v.lastModifiedDateTime) >= from && !isMe(personOf(v.lastModifiedBy))).map((v) => personOf(v.lastModifiedBy).name).filter(Boolean))];
    f.youBefore = vs.some((v) => isMe(personOf(v.lastModifiedBy)));
  }
  for (const s of sites.values()) if (!s.name) s.name = "A site";
  writeJson(refsFile, r);
  modelCache = { me, isMe, sites: [...sites.values()], files, all, from, refs: r };
  return modelCache;
}
function refs() {
  try { return readJson(refsFile); } catch { return { n: { s: 0, f: 0, r: 0, t: 0, n: 0 }, site: {}, file: {}, row: {}, twin: {}, news: {} }; }
}
function saveRefs() { writeJson(refsFile, model().refs); }
function siteFor(ref) { return model().sites.find((s) => s.ref === ref) || null; }
function fileFor(ref) { return model().all.find((f) => f.ref === ref) || null; }
function countIn(s) { return model().files.filter((f) => f.site === s).length; }

/** Your files someone else changed in the window: you made them, or saved them before. */
function yours() {
  const md = model();
  return md.files.filter((f) => !f.mine && f.by.name && (f.madeByMe || f.youBefore));
}

/** Open list rows that name you in a person column, from the saved lists. */
const DONE_WORDS = /\b(complete[d]?|done|closed|resolved|approved|rejected|cancel+ed|finished|archived)\b/i;
const SYSTEM_FIELDS = /^(Author|Editor|_|ContentType|AppAuthor|AppEditor|CheckoutUser|Attachments)/;
let rowsCache = null;
function rows() {
  if (rowsCache) return rowsCache;
  const md = model();
  const names = savedNames();
  const out = [];
  const myIds = {};
  for (const n of names.filter((x) => /^people-\d+$/.test(x))) {
    const m = /^\/sites\/([^/]+)\/lists/.exec(pathOf(n));
    const it = itemsOf(n).find((x) => x && x.fields && md.me.emails.includes(lower(x.fields.EMail || x.fields.UserName)));
    if (m && it) myIds[siteKey(decodeURIComponent(m[1]))] = String(it.id || it.fields.id || "");
  }
  const listInfo = {};
  for (const n of names.filter((x) => /^lists-\d+$/.test(x))) {
    const m = /^\/sites\/([^/]+)\/lists/.exec(pathOf(n));
    for (const l of itemsOf(n)) if (l && l.id) listInfo[l.id] = { name: l.displayName || l.name || "A list", siteId: m ? decodeURIComponent(m[1]) : "", link: SAFE_LINK.test(l.webUrl || "") ? l.webUrl : "" };
  }
  for (const n of names.filter((x) => /^items-\d+$/.test(x))) {
    const m = /^\/sites\/([^/]+)\/lists\/([^/]+)\/items/.exec(pathOf(n));
    if (!m) continue;
    const siteId = decodeURIComponent(m[1]), listId = decodeURIComponent(m[2]);
    const info = listInfo[listId] || { name: "A list", link: "" };
    const myId = myIds[siteKey(siteId)] || "";
    for (const it of itemsOf(n)) {
      const f = it && it.fields;
      if (!f) continue;
      let column = "";
      for (const [k, v] of Object.entries(f)) {
        if (SYSTEM_FIELDS.test(k)) continue;
        if (/LookupId$/.test(k) && myId && String(v) === myId) { column = k.replace(/LookupId$/, ""); break; }
        if (Array.isArray(v) && v.some((p) => p && typeof p === "object" && ((myId && String(p.LookupId) === myId) || md.me.emails.includes(lower(p.Email))))) { column = k; break; }
      }
      if (!column) continue;
      const status = ["Status", "TaskStatus", "Progress", "State", "Stage", "ApprovalStatus"].map((k) => typeof f[k] === "string" ? f[k] : "").find(Boolean) || "";
      if (DONE_WORDS.test(status) || f.PercentComplete === 1 || f.Completed === true) continue;
      const dueRaw = ["DueDate", "Due", "Deadline", "TaskDueDate", "EndDate"].map((k) => f[k]).find((v) => typeof v === "string" && !isNaN(new Date(v)));
      const key = listId + "|" + it.id;
      if (!md.refs.row[key]) md.refs.row[key] = "r" + ++md.refs.n.r;
      const s = md.sites.find((x) => x.key === siteKey(siteId));
      out.push({ ref: md.refs.row[key], title: String(f.Title || f.LinkTitle || "A row").slice(0, 140), list: info.name, site: s ? s.name : "", siteRef: s ? s.ref : "",
        column: column.replace(/_x0020_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2"), status: String(status).slice(0, 40),
        due: dueRaw ? new Date(dueRaw) : null, at: new Date(it.lastModifiedDateTime || f.Modified || 0), by: personOf(it.lastModifiedBy).name,
        link: SAFE_LINK.test(it.webUrl || "") ? it.webUrl : info.link });
    }
  }
  saveRefs();
  // Late first, then the nearest due date, then the newest.
  rowsCache = out.sort((a, b) => (a.due ? a.due.getTime() : 9e15) - (b.due ? b.due.getTime() : 9e15) || b.at - a.at);
  return rowsCache;
}

/** Files that anyone with the link, or someone outside the company, can open. */
let openCache = null;
function openFiles() {
  if (openCache) return openCache;
  const md = model();
  const domains = md.me.emails.map((e) => e.split("@")[1]).filter(Boolean);
  const out = [];
  for (const n of savedNames().filter((x) => /^perms-\d+$/.test(x))) {
    const m = /^\/drives\/([^/]+)\/items\/([^/]+)\/permissions/.exec(pathOf(n));
    if (!m) continue;
    const f = md.all.find((x) => x.driveId === decodeURIComponent(m[1]) && x.id === decodeURIComponent(m[2]));
    if (!f) continue;
    let anyone = false;
    const guests = new Set();
    for (const p of itemsOf(n)) {
      if (p.link && p.link.scope === "anonymous") anyone = true;
      const who = [p.grantedToV2, ...(p.grantedToIdentitiesV2 || []), p.grantedTo, ...(p.grantedToIdentities || [])].filter(Boolean);
      for (const g of who) {
        const u = g.user || g.siteUser || {};
        const login = lower(u.loginName), email = lower(u.email);
        const outside = /#ext#|urn:spo:guest/.test(login) || (email && domains.length && !domains.some((d) => email.endsWith("@" + d) || email.endsWith("." + d)));
        if (outside && (u.displayName || email)) guests.add(u.displayName || email);
      }
    }
    if (anyone || guests.size) out.push({ f, anyone, guests: [...guests].slice(0, 6) });
  }
  openCache = out.sort((a, b) => (b.anyone - a.anyone) || b.f.at - a.f.at);
  return openCache;
}

/** Look-alike files in one folder: the same name but for "v2", "final", "copy", a date or "(1)". */
function looseStem(name) {
  return stemOf(name).toLowerCase()
    .replace(/^copy of\s+/, "").replace(/\s*-\s*copy\b/g, " ")
    .replace(/\(\d+\)/g, " ")
    .replace(/\b(v|ver|version|rev)\s*\.?\s*\d+(\.\d+)*\b/g, " ")
    .replace(/\b(final|draft|copy|newest|latest|edited|updated|clean|revised|wip|fixed)\b/g, " ")
    .replace(/[_\-.]+/g, " ").replace(/\s+/g, " ").trim();
}
let twinsCache = null;
function twins() {
  if (twinsCache) return twinsCache;
  const md = model();
  const members = new Map(); // driveId|parentId|stem|family -> Map(id -> item)
  const add = (it, driveId, parentId, s) => {
    if (!it || !it.name || it.folder) return;
    const stem = looseStem(it.name);
    if (stem.length < 3) return;
    const k = driveId + "|" + parentId + "|" + stem + "|" + (FAMILY[extOf(it.name)] || extOf(it.name));
    if (!members.has(k)) members.set(k, { site: s, stem, items: new Map() });
    members.get(k).items.set(it.id, { id: it.id, name: it.name, at: new Date(it.lastModifiedDateTime), by: personOf(it.lastModifiedBy).name, link: SAFE_LINK.test(it.webUrl || "") ? it.webUrl : "", webUrl: it.webUrl || "" });
  };
  for (const f of md.files) if (f.parentId) add({ id: f.id, name: f.name, lastModifiedDateTime: f.at.toISOString(), lastModifiedBy: { user: { displayName: f.by.name } }, webUrl: f.webUrl }, f.driveId, f.parentId, f.site);
  for (const n of savedNames().filter((x) => /^folder-\d+$/.test(x))) {
    const m = /^\/drives\/([^/]+)\/items\/([^/]+)\/children/.exec(pathOf(n));
    if (!m) continue;
    const driveId = decodeURIComponent(m[1]), parentId = decodeURIComponent(m[2]);
    const s = (md.files.find((f) => f.driveId === driveId && f.parentId === parentId) || {}).site || null;
    for (const it of itemsOf(n)) add(it, driveId, parentId, s);
  }
  const out = [];
  for (const [k, g] of members) {
    const items = [...g.items.values()].sort((a, b) => b.at - a.at);
    if (items.length < 2 || new Set(items.map((x) => x.name.toLowerCase())).size < 2) continue;
    if (items[0].at < md.from) continue; // only sets that moved in the window
    if (!md.refs.twin[k]) md.refs.twin[k] = "t" + ++md.refs.n.t;
    const f0 = md.files.find((f) => f.id === items[0].id);
    out.push({ ref: md.refs.twin[k], site: g.site, folder: f0 ? f0.folder : "", library: f0 ? f0.library : "", items: items.slice(0, 6), count: items.length });
  }
  saveRefs();
  twinsCache = out.sort((a, b) => b.items[0].at - a.items[0].at);
  return twinsCache;
}

/** News posts published on the sites in the window. */
function news() {
  const md = model();
  const out = [];
  for (const n of savedNames().filter((x) => /^pages-\d+$/.test(x))) {
    const m = /^\/sites\/([^/]+)\/pages/.exec(pathOf(n));
    const s = m ? md.sites.find((x) => x.key === siteKey(decodeURIComponent(m[1]))) : null;
    for (const p of itemsOf(n)) {
      if (!p || !p.id || lower(p.promotionKind) !== "newspost") continue;
      const at = new Date(p.lastModifiedDateTime || p.createdDateTime);
      if (isNaN(at) || at < md.from) continue;
      const key = p.id;
      if (!md.refs.news[key]) md.refs.news[key] = "n" + ++md.refs.n.n;
      out.push({ ref: md.refs.news[key], title: String(p.title || p.name || "").slice(0, 140), site: s ? s.name : "", by: personOf(p.createdBy).name, at, link: SAFE_LINK.test(p.webUrl || "") ? p.webUrl : "" });
    }
  }
  saveRefs();
  return out.sort((a, b) => b.at - a.at);
}

// ── Counting ──
function withWord(n, one, many) {
  const num = n.toLocaleString("en-US");
  return one ? `${num} ${n === 1 ? one : many || one}` : num;
}
function counted(kind, arg) {
  const md = model();
  if (kind === "changed") return md.files.length;
  if (kind === "sites") return new Set(md.files.map((f) => f.site)).size;
  if (kind === "people") return new Set(md.files.filter((f) => !f.mine && f.by.name).map((f) => f.by.name)).size;
  if (kind === "yours") return yours().length;
  if (kind === "rows") return rows().length;
  if (kind === "open") return openFiles().length;
  if (kind === "twins") return twins().length;
  if (kind === "in") { const s = siteFor(arg); if (!s) fail(`no site ${arg}: give a ref from list, like s3`); return countIn(s); }
  return fail("unknown count " + kind);
}
/** Placeholders filled; then the words may hold no typed number and no name nobody wrote. */
function fill(textIn, where) {
  const made = [];
  const out = String(textIn).replace(/\{(changed|sites|people|yours|rows|open|twins|in):([^}]*)\}/g, (_, kind, spec) => {
    const [arg, one, many] = spec.split("|").map((s) => s.trim());
    const v = withWord(counted(kind, arg), one, many);
    made.push(v);
    return v;
  });
  // Bold names are checked against the saved answers first; a checked name may hold a number.
  const named = [];
  for (const b of out.match(/\*\*[^*]+\*\*/g) || []) {
    const inner = b.slice(2, -2);
    if (made.some((v) => inner.includes(v))) continue;
    if (/^(nobody|no one|quiet|clear|none|all clear)$/i.test(inner.trim())) continue;
    for (const piece of inner.split(/,\s*|\s+and\s+|\s+>\s+/).map((x) => x.trim()).filter(Boolean)) {
      if (!inSaved(piece)) fail(`refused, "${piece}" is not written in any saved answer: copy names as SharePoint wrote them`);
    }
    named.push(b);
  }
  let rest = out;
  for (const v of made) rest = rest.replace(v, "");
  for (const b of named) rest = rest.replace(b, "");
  const bare = rest.replace(/\b(last|past|next|coming)\s+(\d{1,2}|two|three|seven|fourteen|thirty)\s+(days|weeks|months|hours)\b/gi, "");
  if (typedNumber(bare)) fail(`refused, a number typed into ${where}: use a placeholder so the helper counts it`);
  if (/\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|dozen|hundreds?)\b/i.test(bare)) fail(`refused, a count written as a word in ${where}: use a placeholder`);
  if (/\b(\w+) \1\b/i.test(out)) fail("refused, words are doubled: the helper adds the word you give after |");
  // "0 files" is not a finding.
  if (made.length && made.every((v) => /^0\b/.test(v))) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
  return out;
}
/** A number standing alone, not part of a name like Q4, v2 or Microsoft 365, nor a clock time. */
function typedNumber(s) {
  return /\d/.test(String(s).replace(/\b\d{1,2}:\d{2}\b/g, "").replace(/\b(microsoft |office )?365\b/gi, "").replace(/\b[A-Za-z]+\d+[A-Za-z0-9]*\b/g, ""));
}
/** The agent's own words for one item: plain, no number it could have made up. */
function words(v, max, where, source) {
  if (typeof v !== "string" || !v.trim()) return "";
  const s = v.trim().replace(/\s+/g, " ");
  // A number may stand only when the file's own changed lines hold it ("from 8 to 9 days").
  const copied = source ? s.replace(/\d[\d,.]*/g, (n) => (source.includes(n.replace(/[.,]$/, "")) ? "" : n)) : s;
  if (typedNumber(copied)) fail(`refused, a number in ${where}: "${s.slice(0, 60)}". Say it without numbers${source ? ", or only numbers its changed lines hold" : ""}`);
  return s.slice(0, max);
}

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
function argFile(args) {
  const arg = args.join(" ").trim();
  if (!arg.startsWith("@")) fail("give it as @<file>: the JSON you wrote into my-files/data/.work/");
  const file = path.join(workDir, path.basename(arg.slice(1)));
  try { return readJson(file); } catch { return fail(`${arg.slice(1)} is not JSON in my-files/data/.work/`); }
}
function fileOut(f) {
  const o = { id: f.ref, name: stemOf(f.name).slice(0, 120), ext: f.ext, site: String(f.site.name).slice(0, 80), library: String(f.library).slice(0, 60), folder: String(f.folder).slice(0, 140), at: iso(f.at) };
  if (f.link) o.link = f.link;
  return o;
}

// ── The gift ──
function giftOf(g) {
  if (!g || typeof g !== "object" || Array.isArray(g)) fail("the gift must be an object");
  const kind = String(g.kind || "");
  if (!GIFT_KINDS.includes(kind)) fail(`the gift kind is ${GIFT_KINDS.join(", ")}, not "${kind}"`);
  const out = { kind };
  // The order is the person's: their own file changed, then a row with their name, then a file
  // open to anyone, then look-alikes, then calm.
  if (kind !== "yours" && yours().length) fail("refused, someone changed one of your files (see yours): give a yours gift");
  if (kind !== "yours" && kind !== "row" && rows().length) fail("refused, a list row names you (see rows): give a row gift");
  if ((kind === "twins" || kind === "calm") && openFiles().length) fail("refused, a file is open to anyone or a guest (see open): give an open gift");
  if (kind === "calm" && twins().length) fail("refused, there are look-alike files (see twins): give a twins gift");
  const gist = words(g.gist, 140, "the gist");
  if (gist) out.gist = gist;
  if (kind === "yours") {
    const f = fileFor(g.file);
    if (!f) fail(`refused, no saved file ${g.file || "(give file: its ref from yours, like f3)"}`);
    if (!yours().includes(f)) fail("refused, that file is not in yours (it is not yours, or you changed it last): pick from yours");
    Object.assign(out, fileOut(f), { who: f.by.name.slice(0, 80), made: f.madeByMe });
    if (f.versions) out.saves = f.versions;
    delete out.id;
    out.file = f.ref;
  }
  if (kind === "row") {
    const x = rows().find((y) => y.ref === g.row);
    if (!x) fail(`refused, no open row ${g.row || "(give row: its ref from rows, like r2)"}`);
    Object.assign(out, { row: x.ref, title: x.title, list: x.list, site: x.site, column: x.column, at: iso(x.at) });
    if (x.due) out.due = ymd(x.due);
    if (x.status) out.status = x.status;
    if (x.link) out.link = x.link;
  }
  if (kind === "open") {
    const x = openFiles().find((y) => y.f.ref === g.file);
    if (!x) fail(`refused, no open file ${g.file || "(give file: its ref from open, like f7)"}`);
    Object.assign(out, fileOut(x.f), { anyone: x.anyone, guests: x.guests });
    delete out.id;
    out.file = x.f.ref;
  }
  if (kind === "twins") {
    const t = twins().find((y) => y.ref === g.set);
    if (!t) fail(`refused, no look-alike set ${g.set || "(give set: its ref from twins, like t1)"}`);
    out.set = t.ref;
    out.site = t.site ? String(t.site.name).slice(0, 80) : "";
    out.folder = String(t.folder || t.library).slice(0, 140);
    out.count = t.count;
    out.items = t.items.slice(0, 4).map((i) => ({ name: i.name.slice(0, 120), at: iso(i.at), by: i.by.slice(0, 80), ...(i.link ? { link: i.link } : {}) }));
  }
  return out;
}

// ── latest.json: the agent gives refs and its own words; the facts come from the saved answers ──
function latestOf(l) {
  if (!l || typeof l !== "object" || Array.isArray(l)) fail("latest.json must be an object");
  if (typeof l.headline !== "string" || !l.headline.trim()) fail("latest.json needs a headline");
  const md = model();
  const headline = fill(l.headline, "the headline").slice(0, 220);
  const said = (arr) => { const o = {}; for (const x of Array.isArray(arr) ? arr : []) if (x && typeof x.id === "string") o[x.id] = x; return o; };
  // Your files: every one, with the agent's line on why it matters where it gave one.
  const ys = said(l.yours);
  // Who saved a file is not news: what they changed in it is. Every file whose words moved
  // gets its line, from what `changes` showed.
  const read = readChanges();
  if (yours().length && !Object.keys(read).length) fail("run changes first: it shows what others changed in your files, and each one needs its line");
  for (const f of yours().slice(0, 12)) {
    const c = read[f.ref];
    if (c && c.lines > 0 && !(ys[f.ref] && typeof ys[f.ref].gist === "string" && ys[f.ref].gist.trim())) fail(`refused, ${f.ref} (${f.name}) changed: give it a gist that says what changed, from changes`);
  }
  const yoursOut = yours().slice(0, 12).map((f) => {
    const o = { ...fileOut(f), who: f.by.name.slice(0, 80), made: f.madeByMe, gist: words((ys[f.ref] || {}).gist, 160, "a file gist", f.name + "\n" + ((read[f.ref] || {}).text || "")) };
    if (f.versions) o.saves = f.versions;
    if (f.savers && f.savers.length > 1) o.others = f.savers.filter((n) => n !== f.by.name).slice(0, 4);
    return o;
  });
  const rs = said(l.rows);
  const rowsOut = rows().slice(0, 12).map((x) => {
    const o = { id: x.ref, title: x.title, list: x.list.slice(0, 80), site: x.site.slice(0, 80), column: x.column.slice(0, 40), at: iso(x.at), gist: words((rs[x.ref] || {}).gist, 160, "a row gist") };
    if (x.due) o.due = ymd(x.due);
    if (x.status) o.status = x.status;
    if (x.by) o.by = x.by.slice(0, 80);
    if (x.link) o.link = x.link;
    return o;
  });
  const openOut = openFiles().slice(0, 10).map((x) => ({ ...fileOut(x.f), anyone: x.anyone, guests: x.guests, by: x.f.by.name.slice(0, 80) }));
  const ts = said(l.twins);
  const twinsOut = twins().slice(0, 8).map((t) => ({ id: t.ref, site: t.site ? String(t.site.name).slice(0, 80) : "", folder: String(t.folder || t.library).slice(0, 140), count: t.count,
    // Names in the set may hold numbers ("Price list 2027"), and so may what changed in them.
    gist: words((ts[t.ref] || {}).gist, 160, "a look-alike gist", t.items.map((i) => i.name).join("\n") + "\n" + Object.values(read).map((x) => x.text || "").join("\n")),
    items: t.items.slice(0, 4).map((i) => ({ name: i.name.slice(0, 120), at: iso(i.at), by: i.by.slice(0, 80), ...(i.link ? { link: i.link } : {}) })) }));
  const ss = said(l.sites);
  const onShelf = new Set(md.files.map((f) => f.key));
  const yourSites = new Set([...yours().map((f) => f.site), ...openFiles().filter((x) => onShelf.has(x.f.key)).map((x) => x.f.site)]);
  const sitesOut = md.sites.filter((s) => countIn(s) > 0).map((s) => {
    const a = ss[s.ref] || {};
    const fs2 = md.files.filter((f) => f.site === s);
    const people = [...new Set(fs2.filter((f) => !f.mine && f.by.name).map((f) => f.by.name))];
    const folders = {};
    for (const f of fs2) { const k = f.folder || f.library; if (k) folders[k] = (folders[k] || 0) + 1; }
    const top = Object.entries(folders).sort((a2, b2) => b2[1] - a2[1])[0];
    const o = { id: s.ref, name: String(s.name).slice(0, 80), count: fs2.length, people: people.length, names: people.slice(0, 3).map((n) => n.slice(0, 60)),
      needs: yourSites.has(s) ? "you" : a.needs === "fyi" ? "fyi" : "none", gist: words(a.gist, 160, "a site gist"), followed: s.followed };
    if (top) o.top = top[0].slice(0, 100);
    if (s.link) o.link = s.link;
    return o;
  }).sort((a, b) => (a.needs === "you" ? 0 : a.needs === "fyi" ? 1 : 2) - (b.needs === "you" ? 0 : b.needs === "fyi" ? 1 : 2) || b.count - a.count).slice(0, 12);
  const ns = said(l.news);
  const newsOut = news().slice(0, 8).map((x) => ({ id: x.ref, title: x.title, site: x.site.slice(0, 80), by: x.by.slice(0, 80), at: iso(x.at), gist: words((ns[x.ref] || {}).gist, 160, "a news gist"), ...(x.link ? { link: x.link } : {}) }));
  // The shelf: every changed file as a spine, by site, the ones that touch you marked.
  const yourKeys = new Set([...yours(), ...openFiles().map((x) => x.f)].map((f) => f.key));
  const order = md.sites.filter((s) => countIn(s) > 0).sort((a, b) => countIn(b) - countIn(a));
  const shelf = order.slice(0, 8).map((s) => ({ id: s.ref, name: String(s.name).slice(0, 60), count: countIn(s),
    spines: md.files.filter((f) => f.site === s).slice(0, 40).map((f) => ({ k: FAMILY[f.ext] || "other", y: yourKeys.has(f.key) ? 1 : 0, m: f.mine ? 1 : 0 })) }));
  const out = {
    schema: SCHEMA + "@1", example: false, generatedAt: iso(new Date()), since: iso(md.from), timeZone: TZ,
    person: { name: l.person && typeof l.person.name === "string" && inSaved(l.person.name) ? l.person.name.slice(0, 60) : md.me.first.slice(0, 60) },
    headline,
    totals: { changed: md.files.length, sites: counted("sites"), people: counted("people"), mine: md.files.filter((f) => f.mine).length,
      yours: yoursOut.length, rows: rows().length, open: openFiles().length, twins: twins().length, news: newsOut.length },
    shelf, yours: yoursOut, rows: rowsOut, open: openOut, twins: twinsOut, sites: sitesOut, news: newsOut
  };
  const m = mode();
  const missing = ["lists", "sharing", "news"].filter((k) => m.refused && m.refused[k]);
  if (missing.length) out.refused = missing;
  return out;
}

/** A reading never ends without its gift: calm, when none was given. */
function calmIfNoGift() {
  let morning = true;
  try { morning = readJson(modeFile).morning; } catch { /* no run */ }
  if (morning || !fs.existsSync(readingFile)) return;
  const r = readJson(readingFile);
  if (r.gift || r.done) return;
  r.gift = { kind: "calm", at: iso(new Date()) };
  writeJson(readingFile, r);
}

function fileLine(f) {
  // New in the window and made by someone else: read it with words, it may ask them something.
  const fresh = !f.madeByMe && f.created && f.created >= model().from;
  const flags = [f.mine ? "YOU saved it" : "", f.madeByMe ? "you made it" : "", fresh ? `NEW, made by ${f.made.name || f.by.name || "?"}` : "", f.youBefore ? "you saved it before" : "", f.versions > 1 ? `${f.versions} saves in the window` : ""].filter(Boolean).join(", ");
  return `${f.ref} | ${ymd(f.at).slice(5)} ${hhmm(f.at)} | ${f.site.ref} | ${f.by.name || "?"} | ${f.name}${f.folder ? " | in " + f.folder : ""}${flags ? " | " + flags : ""}${fresh && f.driveId ? ` | words ${f.driveId} ${f.id}` : ""}`;
}
function siteLine(s) { return `${s.ref} | ${s.name}${s.followed ? " (you follow it)" : ""} | ${countIn(s)} files changed in the window`; }

const [cmd, ...args] = process.argv.slice(2);
try {
if (cmd === "window") {
  const s = sinceFor(args.includes("--morning"));
  console.log([`NOW='${iso(new Date())}'`, `TODAY='${ymd(new Date())}'`, `SINCE='${utc(s)}'`, `TZ_NAME='${TZ}'`].join("\n"));
} else if (cmd === "start") {
  const chat = args.includes("--chat");
  const morning = chat || args.includes("--morning");
  if (chat && fs.existsSync(modeFile) && Date.now() - fs.statSync(modeFile).mtimeMs < 15 * 60000) {
    let busy = true;
    try { busy = !readJson(modeFile).chat; } catch { /* half written */ }
    if (busy) fail("the morning reading is running right now: answer from data/latest.json, or try again in a few minutes", 5);
  }
  if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });
  const s = sinceFor(morning);
  writeJson(modeFile, { morning, chat, since: utc(s), refused: {} });
  if (!morning) writeJson(readingFile, { schema: SCHEMA + "/reading@1", startedAt: iso(new Date()), done: false, lines: [] });
  console.log(`${morning ? "morning" : "first reading"} started; the window is from ${iso(s)}. Next: me, then files, then more`);
} else if (cmd === "me") {
  mode();
  try { const it = await save("me", "/me?$select=id,displayName,givenName,mail,userPrincipalName"); console.log(`you are ${it[0].displayName || "?"}`); }
  catch (e) { if (e instanceof Exit) throw e; fail(e.message + ": could not read who you are", 4); }
} else if (cmd === "files") {
  const s = since();
  if (!has("me")) fail("run me first");
  try { await save("followed", "/me/followedSites?$select=id,displayName,webUrl,name"); } catch (e) { if (e instanceof Exit) throw e; if (e.status === 401) fail("SharePoint needs a new sign-in (401)", 3); }
  let hits;
  try { hits = await searchChanged(s); }
  catch (e) { if (e instanceof Exit) throw e;
    if (e.status === 403 || e.status === 400 || e.status === 404) fail(`${e.message}: SharePoint can't be searched for this account. Microsoft allows SharePoint only for work and school accounts, with Sites.Read.All`, 4);
    fail(e.message, 4);
  }
  // The names of the sites the files are on.
  const ids = [...new Set(hits.filter((h) => !isOneDrive(h.webUrl)).map((h) => (h.parentReference || {}).siteId).filter(Boolean))].slice(0, MAX_SITES);
  await inTurns(ids.map((id, i) => async () => {
    try { await save("site-" + (i + 1), `/sites/${encodeURIComponent(id)}?$select=id,displayName,webUrl,name`); }
    catch (e) { if (e instanceof Exit) throw e; if (e.status === 401) fail("SharePoint needs a new sign-in (401)", 3); }
  }), 4);
  // The saves on files that others changed, to know whether they were yours and how often they moved.
  const md = model();
  modelCache = null;
  const others = md.files.filter((f) => !f.mine && f.driveId).slice(0, MAX_VERSIONS);
  let vread = 0;
  await inTurns(others.map((f, i) => async () => {
    try { await save("versions-" + (i + 1), `/drives/${encodeURIComponent(f.driveId)}/items/${encodeURIComponent(f.id)}/versions`); vread++; }
    catch (e) { if (e instanceof Exit) throw e; if (e.status === 401) fail("SharePoint needs a new sign-in (401)", 3); }
  }), 4);
  const m2 = model();
  console.log(`${m2.files.length} files changed in the window on ${counted("sites")} sites (${m2.files.filter((f) => f.mine).length} by you); saves read on ${vread} files others changed. Your files others changed: ${yours().length}. Next: more, then list`);
} else if (cmd === "more") {
  const md = model();
  const refused = { ...(mode().refused || {}) };
  // Lists with your name: on the sites you follow and the sites that moved.
  const weekIn = (s) => md.all.filter((f) => f.site === s).length;
  const listSites = [...new Map([...md.sites.filter((s) => s.followed), ...md.sites.filter((s) => weekIn(s) > 0).sort((a, b) => weekIn(b) - weekIn(a))].map((s) => [s.key, s])).values()]
    .filter((s) => s.id && s.id !== "unknown").slice(0, MAX_LIST_SITES);
  let listsRead = 0, listN = 0, itemsRead = 0;
  const lists = [];
  await inTurns(listSites.map((s, i) => async () => {
    try {
      const ls = await save("lists-" + (i + 1), `/sites/${encodeURIComponent(s.id)}/lists?$select=id,displayName,name,webUrl,list,lastModifiedDateTime`);
      listsRead++;
      for (const l of ls) {
        const t = l.list || {};
        if (t.hidden || !/^(genericList|tasks|tasksWithTimelineAndHierarchy|issueTracking|events)$/.test(t.template || "")) continue;
        if (new Date(l.lastModifiedDateTime) < new Date(Date.now() - 60 * DAY)) continue;
        lists.push({ s, l, i });
      }
      if (md.me.emails[0]) await save("people-" + (i + 1), `/sites/${encodeURIComponent(s.id)}/lists/User%20Information%20List/items?$expand=fields($select=EMail,UserName,Title)&$filter=fields/EMail%20eq%20'${encodeURIComponent(md.me.emails[0]).replace(/'/g, "''")}'`).catch((e) => { if (e instanceof Exit) throw e; return null; });
    } catch (e) { if (e instanceof Exit) throw e; if (e.status === 401) fail("SharePoint needs a new sign-in (401)", 3); }
  }), 3);
  await inTurns(lists.sort((a, b) => new Date(b.l.lastModifiedDateTime) - new Date(a.l.lastModifiedDateTime)).slice(0, MAX_LISTS).map((x) => async () => {
    try { await save("items-" + ++listN, `/sites/${encodeURIComponent(x.s.id)}/lists/${encodeURIComponent(x.l.id)}/items?$expand=fields&$top=200`, 2); itemsRead++; }
    catch (e) { if (e instanceof Exit) throw e; if (e.status === 401) fail("SharePoint needs a new sign-in (401)", 3); }
  }), 3);
  if (listSites.length && !listsRead) refused.lists = true;
  // Who can open your files: Microsoft shows all of a file's sharing only to its owner, so only
  // the files you made or saved are asked about.
  const pick = [...new Map([...yours(), ...md.all.filter((f) => f.madeByMe), ...md.all.filter((f) => f.mine)].map((f) => [f.key, f])).values()].filter((f) => f.driveId).slice(0, MAX_SHARING);
  let permsRead = 0;
  await inTurns(pick.map((f, i) => async () => {
    try { await save("perms-" + (i + 1), `/drives/${encodeURIComponent(f.driveId)}/items/${encodeURIComponent(f.id)}/permissions`); permsRead++; }
    catch (e) { if (e instanceof Exit) throw e; if (e.status === 401) fail("SharePoint needs a new sign-in (401)", 3); }
  }), 4);
  if (pick.length && !permsRead) refused.sharing = true;
  // The folders where a changed file has look-alikes ("v2", "final", "copy").
  const marked = md.files.filter((f) => f.driveId && looseStem(f.name) !== stemOf(f.name).toLowerCase().replace(/[_\-.]+/g, " ").replace(/\s+/g, " ").trim()).slice(0, MAX_FOLDERS * 2);
  await inTurns(marked.filter((f) => !f.parentId).map((f, i) => async () => {
    try { await save("item-" + (i + 1), `/drives/${encodeURIComponent(f.driveId)}/items/${encodeURIComponent(f.id)}?$select=id,parentReference`); }
    catch (e) { if (e instanceof Exit) throw e; if (e.status === 401) fail("SharePoint needs a new sign-in (401)", 3); }
  }), 4);
  modelCache = null;
  const md2 = model();
  const folders = [...new Map(md2.files.filter((f) => f.parentId && looseStem(f.name) !== stemOf(f.name).toLowerCase().replace(/[_\-.]+/g, " ").replace(/\s+/g, " ").trim())
    .map((f) => [f.driveId + "|" + f.parentId, f])).values()].slice(0, MAX_FOLDERS);
  await inTurns(folders.map((f, i) => async () => {
    try { await save("folder-" + (i + 1), `/drives/${encodeURIComponent(f.driveId)}/items/${encodeURIComponent(f.parentId)}/children?$select=id,name,webUrl,lastModifiedDateTime,lastModifiedBy,file,folder&$top=200`); }
    catch (e) { if (e instanceof Exit) throw e; if (e.status === 401) fail("SharePoint needs a new sign-in (401)", 3); }
  }), 4);
  modelCache = null; twinsCache = null;
  // News on the sites you follow and the busiest ones.
  let newsRead = 0;
  await inTurns(listSites.slice(0, 6).map((s, i) => async () => {
    try { await save("pages-" + (i + 1), `/sites/${encodeURIComponent(s.id)}/pages/microsoft.graph.sitePage?$select=id,name,title,webUrl,promotionKind,lastModifiedDateTime,createdDateTime,createdBy&$top=50`, 2); newsRead++; }
    catch (e) { if (e instanceof Exit) throw e; if (e.status === 401) fail("SharePoint needs a new sign-in (401)", 3); }
  }), 3);
  if (listSites.length && !newsRead) refused.news = true;
  setMode({ refused });
  modelCache = null; rowsCache = null; openCache = null; twinsCache = null;
  console.log(`lists read on ${listsRead} sites (${itemsRead} lists), open rows with your name: ${rows().length}; sharing read on ${permsRead} files, open to anyone or guests: ${openFiles().length}; look-alike sets: ${twins().length}; news posts: ${news().length}${Object.keys(refused).length ? `; refused: ${Object.keys(refused).join(", ")} (go on without them)` : ""}. Next: list, yours, rows, open, twins, news`);
} else if (cmd === "find") {
  // Any file, by words, newest first: for a question in the chat ("where is the newest price list?").
  const q = args.join(" ").replace(/["\\]/g, " ").trim();
  if (!q) fail("give the words to look for, like: find 'price list'");
  let json;
  try { json = await call(GRAPH + "/search/query", { method: "POST", body: JSON.stringify({ requests: [{ entityTypes: ["driveItem"], query: { queryString: q }, from: 0, size: 25, sortProperties: [{ name: "LastModifiedTime", isDescending: true }] }] }) }); }
  catch (e) { if (e instanceof Exit) throw e; fail(e.message + ": the search did not work", 4); }
  remember("find", "/search/query", [json]);
  const hits = (((json.value || [])[0] || {}).hitsContainers || []).flatMap((c) => c.hits || []).map((h) => h.resource).filter((r) => r && r.name && !r.folder && !isOneDrive(r.webUrl));
  if (!hits.length) console.log("nothing found for those words");
  for (const r of hits) {
    const pr = r.parentReference || {};
    console.log(`${ymd(new Date(r.lastModifiedDateTime))} | ${personOf(r.lastModifiedBy).name || "?"} | ${r.name} | words ${pr.driveId || "?"} ${r.id}${SAFE_LINK.test(r.webUrl || "") ? " | " + r.webUrl : ""}`);
  }
} else if (cmd === "versions") {
  // Every save of one file: which version, when, by whom. "words" reads any of them.
  const [driveId, itemId] = args;
  if (!driveId || !itemId) fail("give the drive id and the item id: versions <drive> <item>");
  let vs;
  try { vs = (await call(GRAPH + `/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}/versions`)).value || []; }
  catch (e) { if (e instanceof Exit) throw e; fail(e.message + ": the saves of that file can't be read", 4); }
  if (!vs.length) console.log("no saves are kept for that file");
  for (const v of vs) console.log(`version ${v.id} | ${iso(new Date(v.lastModifiedDateTime))} | ${personOf(v.lastModifiedBy).name || "?"}`);
  console.log(`read one with: words ${driveId} ${itemId} <version>`);
} else if (cmd === "words") {
  // The words inside a file (or one of its saves), to tell what it says or what changed.
  const [driveId, itemId, version] = args;
  if (!driveId || !itemId) fail("give the drive id and the item id, as find or versions print them: words <drive> <item> [version]");
  const t = await fileWords(driveId, itemId, version);
  if (t.error) fail(t.error, t.code || 4);
  console.log(`${t.name}${version ? " (version " + version + ")" : ""}:\n` + t.text.slice(0, 20000));
} else if (cmd === "changes") {
  // What others changed in your files: the newest save against the one before theirs.
  const md = model();
  const pick = args.length ? args.map((a) => fileFor(a) || fail(`no file ${a}: give a ref from yours, like f3`)) : yours().slice(0, MAX_CHANGES);
  if (!pick.length) console.log("nobody else changed a file of yours in the window");
  const seen = readChanges();
  for (const f of pick) {
    const r = await changesOf(f, md);
    seen[f.ref] = { lines: r.error ? 0 : r.removed.length + r.added.length, read: !r.error, text: r.error ? "" : [...r.removed, ...r.added].join("\n").slice(0, 8000) };
    console.log(`\n== ${f.ref} | ${f.name} | changed by ${f.by.name || "?"}`);
    if (r.error) { console.log(`   (${r.error})`); continue; }
    console.log(`   compared: the save by ${r.before.by} on ${r.before.at} with the save by ${r.after.by} on ${r.after.at}`);
    if (!r.removed.length && !r.added.length) console.log("   no words changed (the layout or a picture may have)");
    for (const x of r.removed.slice(0, 25)) console.log("   - " + x);
    for (const x of r.added.slice(0, 25)) console.log("   + " + x);
  }
  writeJson(changesFile, seen);
} else if (cmd === "get") {
  try { const it = await save(args[0], args[1], args[2]); console.log(`saved ${cleanName(args[0])}: ${it.length} items`); }
  catch (e) { if (e instanceof Exit) throw e; fail(e.message + ": nothing saved, leave this out", 4); }
} else if (cmd === "list") {
  const md = model();
  const only = args[0] ? siteFor(args[0]) : null;
  if (args[0] && !only) fail(`no site ${args[0]}`);
  const ss = (only ? [only] : md.sites.filter((s) => countIn(s) > 0)).sort((a, b) => countIn(b) - countIn(a));
  console.log(`you: ${md.me.name} | window from ${iso(md.from)} | ${md.files.length} files changed`);
  for (const s of ss) console.log(siteLine(s));
  for (const s of ss) {
    const fs2 = md.files.filter((f) => f.site === s);
    console.log(`\n== ${siteLine(s)}`);
    for (const f of fs2.slice(0, only ? 200 : 15)) console.log(fileLine(f));
    if (!only && fs2.length > 15) console.log(`(${fs2.length - 15} more: list ${s.ref})`);
  }
} else if (cmd === "yours") {
  const list2 = yours();
  if (!list2.length) console.log("nobody else changed a file of yours in the window");
  for (const f of list2) console.log(fileLine(f) + (f.savers && f.savers.length ? ` | saved by ${f.savers.join(", ")}` : "") + ` | versions ${f.driveId} ${f.id}`);
} else if (cmd === "rows") {
  const list2 = rows();
  if (!list2.length) console.log("no open list row names you" + (mode().refused && mode().refused.lists ? " (the lists could not be read)" : ""));
  for (const x of list2) console.log(`${x.ref} | ${x.title} | list ${x.list} on ${x.site} | your column: ${x.column}${x.status ? " | status " + x.status : ""}${x.due ? " | due " + ymd(x.due) : ""} | changed ${ymd(x.at)}${x.by ? " by " + x.by : ""}`);
} else if (cmd === "open") {
  const list2 = openFiles();
  if (!list2.length) console.log("no file read here is open to anyone with the link or to a guest" + (mode().refused && mode().refused.sharing ? " (sharing could not be read)" : ""));
  for (const x of list2) console.log(`${fileLine(x.f)} | ${x.anyone ? "ANYONE with the link" : ""}${x.anyone && x.guests.length ? " and " : ""}${x.guests.length ? "guests: " + x.guests.join(", ") : ""}`);
} else if (cmd === "twins") {
  const list2 = twins();
  if (!list2.length) console.log("no look-alike files moved in the window");
  for (const t of list2) {
    console.log(`${t.ref} | ${t.site ? t.site.name : "?"} | ${t.folder || t.library || "(top)"} | ${t.count} look-alikes`);
    for (const i of t.items) console.log(`    ${ymd(i.at)} ${hhmm(i.at)} | ${i.by || "?"} | ${i.name}`);
  }
} else if (cmd === "news") {
  const list2 = news();
  if (!list2.length) console.log("no news posts on these sites in the window");
  for (const x of list2) console.log(`${x.ref} | ${ymd(x.at)} | ${x.site} | ${x.by || "?"} | ${x.title}`);
} else if (cmd === "push") {
  lockReading();
  if (mode().morning) fail("a morning has no reading lines");
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  if (r.done) fail("the reading is done: no more lines");
  const line = fill(String(args.join(" ") || "").trim(), "the line");
  if (!line) fail("empty line");
  if (/\bundefined\b|\bNaN\b|\bnull\b|\[object|\{|\}/.test(line)) fail(`refused, the line is broken: ${line}`);
  if (line.length > 200) fail("refused, the line is longer than 200 characters");
  if (r.lines.includes(line)) fail("that line is already there");
  // The gift comes early: it is what the person is waiting for.
  if (r.lines.length >= 2 && !r.gift) fail("give the gift first (gift @gift.json; {\"kind\":\"calm\"} when nothing else fits), then push this line again");
  r.lines.push(line);
  writeJson(readingFile, r);
  console.log(`line ${r.lines.length}: ${line}`);
} else if (cmd === "gift") {
  if (mode().morning) fail("a morning has no gift");
  const gift = giftOf(argFile(args));
  lockReading();
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  if (r.done) fail("the reading is done: the gift comes while you read");
  if (r.gift) fail("there is a gift already: one is enough");
  r.gift = { ...gift, at: iso(new Date()) };
  writeJson(readingFile, r);
  console.log("gift: " + JSON.stringify(r.gift));
} else if (cmd === "profile") {
  const p = argFile(args);
  if (!p || typeof p !== "object" || Array.isArray(p)) fail("the profile must be an object");
  const md = model();
  const out = { schema: SCHEMA + "/profile@1", at: iso(new Date()), timeZone: TZ };
  if (typeof p.name === "string" && p.name.trim()) { if (!inSaved(p.name)) fail(`refused, the name "${p.name}" is not written in any saved answer`); out.name = p.name.trim().slice(0, 40); }
  else if (md.me.first) out.name = md.me.first.slice(0, 40);
  if (Array.isArray(p.regulars)) {
    const regs = p.regulars.map((s) => String(s).trim()).filter(Boolean);
    for (const n of regs) if (!inSaved(n)) fail(`refused, "${n}" is not written in any saved answer`);
    if (regs.length) out.regulars = regs.slice(0, 5);
  }
  const own = md.files.filter((f) => f.mine);
  out.days = Math.max(1, Math.round((Date.now() - md.from.getTime()) / DAY));
  if (md.files.length) out.changed = md.files.length;
  if (own.length) out.mine = own.length;
  const ss = new Set(own.map((f) => f.site));
  if (ss.size) out.yourSites = [...ss].sort((a, b) => own.filter((f) => f.site === b).length - own.filter((f) => f.site === a).length).slice(0, 3).map((s) => String(s.name).slice(0, 60));
  // The hours they save files in, from their own saves: the middle of them, on this clock.
  if (own.length >= 5) {
    const mins = own.map((f) => f.at.getHours() * 60 + f.at.getMinutes()).sort((a, b) => a - b);
    const q = (f) => mins[Math.min(mins.length - 1, Math.floor(f * (mins.length - 1)))];
    out.active = { from: pad(q(0.1) / 60) + ":" + pad(q(0.1) % 60), to: pad(q(0.9) / 60) + ":" + pad(q(0.9) % 60) };
  }
  const kinds = {};
  for (const f of own) { const k = FAMILY[f.ext]; if (k && k !== "image" && k !== "video") kinds[k] = (kinds[k] || 0) + 1; }
  const topKind = Object.entries(kinds).sort((a, b) => b[1] - a[1])[0];
  if (topKind && topKind[1] >= 2) out.kind = topKind[0];
  const top = md.sites.map((s) => ({ s, n: countIn(s) })).sort((a, b) => b.n - a.n)[0];
  if (top && top.n) out.busiest = { name: String(top.s.name).slice(0, 80), count: top.n };
  writeJson(path.join(dataDir, "profile.json"), out);
  console.log("profile written: " + Object.keys(out).join(", "));
} else if (cmd === "latest") {
  if (mode().chat) fail("a chat does not write the page: answer in the chat");
  calmIfNoGift();
  const l = latestOf(argFile(args));
  writeJson(path.join(dataDir, "latest.json"), l);
  writeJson(path.join(dataDir, "status.json"), { at: iso(new Date()), ok: true });
  console.log(`latest.json written: ${l.yours.length} yours, ${l.rows.length} rows, ${l.open.length} open, ${l.twins.length} look-alike sets, ${l.sites.length} sites, ${l.news.length} news; and status.json`);
} else if (cmd === "done") {
  calmIfNoGift();
  let morning = true;
  try { morning = mode().morning; } catch { /* already gone */ }
  if (!morning && fs.existsSync(readingFile)) {
    const r = readJson(readingFile);
    r.done = true;
    writeJson(readingFile, r);
  }
  try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("my-files/data/.work/ is busy: delete it in your next call"); }
  console.log("done");
} else {
  fail("use window, start, me, files, more, find, versions, changes, words, get, list, yours, rows, open, twins, news, push, gift, profile, latest or done");
}
} catch (e) { if (!(e instanceof Exit)) throw e; }
