#!/usr/bin/env node
// The first reading of a person's Outlook, written only through here: every Graph answer is
// saved by this helper, every number in a line is counted from those answers, and every
// name, subject and time is copied from them, never typed. Run it from the cabinet root:
//   node my-day/first-sort.mjs window              shell lines to eval: NOW TODAY FROM0 END0
//                                                  END1 (end of tomorrow) END7 FROM14 FROM30 TZ_NAME (UTC times end in Z)
//   node my-day/first-sort.mjs start               new data/reading.json and data/.work/
//   node my-day/first-sort.mjs get <name> '<path>' [pages]
//                                                  GET https://graph.microsoft.com/v1.0<path> with
//                                                  $MICROSOFT_GRAPH_TOKEN, saved as data/.work/<name>.json.
//                                                  The path starts with /me. pages: follow up to
//                                                  that many pages (default 1, at most 10).
//   node my-day/first-sort.mjs list <name>         one short line per item, with its ref (m1, e1)
//   node my-day/first-sort.mjs senders <name>      who sent most in a saved inbox answer
//   node my-day/first-sort.mjs count <name>        the exact count in a saved answer
//   node my-day/first-sort.mjs push '<line>'       add one line (single quotes)
//   node my-day/first-sort.mjs gift @<file>        the one thing for the person, shown while you read
//   node my-day/first-sort.mjs profile @<file>     write data/profile.json ("This is you")
//   node my-day/first-sort.mjs latest @<file>      write data/latest.json and data/status.json
//   node my-day/first-sort.mjs done                mark the reading done, delete data/.work/
// Placeholders in a line or a string of the profile:
//   {count:<name>|one|many}     the items in a saved answer ("at least 50" when there is more)
//   {meetings:<name>|one|many}  timed meetings in a saved calendarView answer (cancelled,
//                               declined, all-day and "free" ones left out)
//   {free:<name>}               free time left today between the meetings of a saved answer,
//                               inside the working hours ("2 h 40 min")
//   {hours:}                    the working hours from Outlook's saved mailbox settings ("08:00 to 17:00")
// A line may hold no other digit than these and a clock time. A **bold** name must be written
// in a saved answer.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA = "outlook/my-day";
// A stand-in Graph on this computer, for tests only.
const GRAPH = /^http:\/\/127\.0\.0\.1:\d+\/v1\.0$/.test(process.env.FIRST_SORT_TEST_GRAPH || "") ? process.env.FIRST_SORT_TEST_GRAPH : "https://graph.microsoft.com/v1.0";
const SAFE_LINK = /^https:\/\/(outlook\.office\.com|outlook\.office365\.com|outlook\.live\.com|teams\.microsoft\.com|teams\.live\.com)\//;
const GIFT_KINDS = ["waiting", "prep", "noise", "calm"];
const WAITING_KINDS = ["family", "friend", "school", "service", "other"];

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const readingFile = path.join(dataDir, "reading.json");
const refsFile = path.join(workDir, ".refs.json");
const savedList = path.join(workDir, ".saved.json");
const pathsFile = path.join(workDir, ".paths.json");
const DAY = 86400000;

// ── Time, in this machine's zone (the person's own) ──
const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, "0");
const hhmm = (d) => pad(d.getHours()) + ":" + pad(d.getMinutes());
const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
function offsetOf(d) { const o = -d.getTimezoneOffset(); return (o >= 0 ? "+" : "-") + pad(o / 60) + ":" + pad(o % 60); }
function iso(d) { return ymd(d) + "T" + hhmm(d) + ":" + pad(d.getSeconds()) + offsetOf(d); }
function dayStart(days) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + days); return d; }
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

function fail(msg, code) { console.error("first-sort: " + msg); process.exit(code || 1); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function writeJson(file, value) {
  const tmp = file + ".part";
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}
function cleanName(name) {
  const n = String(name || "").trim().replace(/\.json$/i, "").replace(/^.*data[\\/]\.work[\\/]/, "");
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/i.test(n)) fail(`"${name}" is not a name: use letters, digits and "-", like inbox30`);
  return n;
}
function workFile(name) {
  const file = path.join(workDir, cleanName(name) + ".json");
  if (!fs.existsSync(file)) fail(`${cleanName(name)} is not saved: save it with get first`);
  return file;
}
/** Answers this helper saved from Graph. Only these are proof of anything. */
function savedNames() { try { return readJson(savedList); } catch { return []; } }
function pagesOf(name) {
  if (!savedNames().includes(cleanName(name))) fail(`${cleanName(name)} was not saved by get: only Graph's own answers count`);
  return fs.readFileSync(workFile(name), "utf8").split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
}
function itemsOf(name) { return pagesOf(name).flatMap((p) => (Array.isArray(p.value) ? p.value : [p])); }
function allItems() { return savedNames().flatMap((n) => { try { return itemsOf(n); } catch { return []; } }); }
let savedTextCache = null;
function savedText() {
  if (savedTextCache === null) savedTextCache = savedNames().map((n) => { try { return fs.readFileSync(workFile(n), "utf8"); } catch { return ""; } }).join("\n");
  return savedTextCache;
}
/** Written in a saved answer, as Graph wrote it (JSON escapes included). */
function inSaved(v) {
  const t = savedText();
  const s = String(v).trim();
  return !!s && (t.includes(s) || t.includes(JSON.stringify(s).slice(1, -1)) || t.toLowerCase().includes(s.toLowerCase()));
}

// ── Refs: m1, e1 stand for Graph's long ids ──
function refs() { try { return readJson(refsFile); } catch { return { n: { m: 0, e: 0 }, byId: {}, byRef: {} }; } }
function kindOf(item) { return item && (item.start && item.end ? "e" : item.receivedDateTime || item.sentDateTime ? "m" : ""); }
function addRefs(items) {
  const r = refs();
  for (const it of items) {
    const k = kindOf(it);
    if (!k || typeof it.id !== "string" || r.byId[it.id]) continue;
    const ref = k + ++r.n[k];
    r.byId[it.id] = ref;
    r.byRef[ref] = it.id;
  }
  writeJson(refsFile, r);
}
/** The saved item a ref or an id names, or null. */
function itemFor(refOrId) {
  if (typeof refOrId !== "string" || !refOrId) return null;
  const id = refs().byRef[refOrId] || refOrId;
  return allItems().find((x) => x && x.id === id) || null;
}

// ── Reading items ──
const fromName = (m) => (m.from && m.from.emailAddress && (m.from.emailAddress.name || m.from.emailAddress.address)) || "";
const fromAddr = (m) => (m.from && m.from.emailAddress && m.from.emailAddress.address) || "";
const toNames = (m) => (m.toRecipients || []).map((r) => r && r.emailAddress && (r.emailAddress.name || r.emailAddress.address)).filter(Boolean);
/** Graph writes event times as { dateTime, timeZone }: in the Prefer zone this helper asked for, or UTC. */
function eventTime(t) {
  if (!t || typeof t.dateTime !== "string") return null;
  const s = t.dateTime.replace(/\.\d+$/, "");
  const zone = String(t.timeZone || "").toUpperCase();
  // Every get asks for this machine's zone, so any zone but UTC is that one, whatever its name.
  const d = /^(UTC|Z|GMT|ETC\/UTC)$/.test(zone) || !zone ? new Date(s + "Z") : new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
const isEvent = (e) => e && e.start && e.end;
function counts(e) {
  if (!isEvent(e) || e.isCancelled || e.isAllDay || e.showAs === "free") return false;
  return !(e.responseStatus && e.responseStatus.response === "declined");
}
/** The person's own addresses: the sender of their saved sent mail. */
function selfAddresses() {
  let paths = {};
  try { paths = readJson(pathsFile); } catch { /* none yet */ }
  return new Set(savedNames().filter((n) => /sentitems/i.test(paths[n] || ""))
    .flatMap((n) => itemsOf(n)).map((m) => fromAddr(m).toLowerCase()).filter(Boolean));
}
function guests(e) {
  const self = selfAddresses();
  return (e.attendees || []).filter((a) => a && a.emailAddress && a.type !== "resource" && !self.has(String(a.emailAddress.address || "").toLowerCase()))
    .map((a) => a.emailAddress.name || a.emailAddress.address).filter(Boolean);
}

// ── Counting ──
function countOf(name) {
  const pages = pagesOf(name);
  let n = 0;
  for (const p of pages) n += Array.isArray(p.value) ? p.value.length : 0;
  const more = !!(pages.length && pages[pages.length - 1]["@odata.nextLink"]);
  return { n, more };
}
function withWord(n, more, one, many) {
  const num = (more ? "at least " : "") + n.toLocaleString("en-US");
  return one ? `${num} ${n === 1 && !more ? one : many || one}` : num;
}
function length(mins) {
  if (mins < 60) return mins + " min";
  const h = Math.floor(mins / 60), m = mins % 60;
  return h + " h" + (m ? " " + m + " min" : "");
}
/** Working hours: Outlook's, when its mailbox settings were saved, else 8 to 18. */
function workHours() {
  for (const n of savedNames()) {
    try {
      for (const p of pagesOf(n)) {
        const w = p && p.workingHours;
        if (w && typeof w.startTime === "string" && typeof w.endTime === "string") {
          const h = (s) => { const m = /^(\d{1,2}):(\d{2})/.exec(s); return m ? +m[1] + +m[2] / 60 : null; };
          const a = h(w.startTime), b = h(w.endTime);
          if (a !== null && b !== null && b > a) return { from: a, to: b, fromText: w.startTime.slice(0, 5), toText: w.endTime.slice(0, 5), outlook: true };
        }
      }
    } catch { /* not settings */ }
  }
  return { from: 8, to: 18, fromText: "08:00", toText: "18:00", outlook: false };
}
/** Free minutes left today inside the working hours, from now. */
function freeToday(name) {
  const w = workHours();
  const at = (h) => { const d = dayStart(0); d.setMinutes(Math.round(h * 60)); return d.getTime(); };
  let start = Math.max(Date.now(), at(w.from));
  const end = at(w.to);
  if (start >= end) return 0;
  const busy = itemsOf(name).filter(counts).map((e) => [eventTime(e.start), eventTime(e.end)]).filter(([a, b]) => a && b)
    .map(([a, b]) => [a.getTime(), b.getTime()]).filter(([a, b]) => b > start && a < end).sort((x, y) => x[0] - y[0]);
  let free = 0;
  for (const [a, b] of [...busy, [end, end]]) { if (a > start) free += a - start; start = Math.max(start, b); }
  return Math.round(free / 60000);
}

/** Placeholders filled; then the line may hold no typed number and no name nobody wrote. */
function fill(text, where) {
  const made = [];
  const out = String(text).replace(/\{(count|meetings|free|hours):([^}]*)\}/g, (_, kind, spec) => {
    const [file, one, many] = spec.split("|").map((s) => s.trim());
    let v;
    if (kind === "count") { const c = countOf(file); v = withWord(c.n, c.more, one, many); }
    else if (kind === "meetings") { const n = itemsOf(file).filter(counts).length; v = withWord(n, false, one, many); }
    else if (kind === "hours") { const w = workHours(); if (!w.outlook) fail("refused, Outlook did not give your working hours: leave that out"); v = w.fromText + " to " + w.toText; }
    else { const m = freeToday(file); v = m ? length(m) : "no time"; }
    made.push(v);
    return v;
  });
  let rest = out;
  for (const v of made) rest = rest.replace(v, "");
  // A clock time and the window a search covered ("in the last 14 days") are not findings.
  const bare = rest.replace(/\b\d{1,2}:\d{2}\b/g, "")
    .replace(/\b(last|past|next|coming)\s+(\d{1,2}|two|three|seven|fourteen|thirty)\s+(days|weeks|months)\b/gi, "");
  if (/\d/.test(bare)) fail(`refused, a number typed into ${where}: use {count:}, {meetings:} or {free:} so the helper counts it`);
  if (/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|dozen)\b/i.test(bare.replace(/\bno one\b/gi, ""))) fail(`refused, a count written as a word in ${where}: use a placeholder`);
  if (/\b(\w+ \w+) \1\b/i.test(out)) fail("refused, words are doubled: the helper adds the word you give after |");
  const bold = out.match(/\*\*[^*]+\*\*/g) || [];
  const nums = (bold.join(" ") || out).replace(/\d{1,2}:\d{2}/g, "").match(/\d[\d,.]*/g) || [];
  if (nums.length && nums.every((x) => Number(x.replace(/,/g, "")) === 0)) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
  // A name in bold ("Your regulars: **Ravi Patel, Noa Klein**") is copied from the mail.
  for (const b of bold) {
    const inner = b.slice(2, -2);
    if (/\d/.test(inner) || made.some((v) => inner.includes(v))) continue;
    // A few fixed findings are words, not names.
    if (/^(no sent mail|no meetings|nobody|no one|clear|free)$/i.test(inner.trim())) continue;
    for (const piece of inner.split(/,\s*|\s+and\s+/).map((s) => s.trim()).filter(Boolean)) {
      if (!inSaved(piece)) fail(`refused, "${piece}" is not written in any saved answer: copy names and subjects as Outlook wrote them`);
    }
  }
  return out;
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
  if (!arg.startsWith("@")) fail("give it as @<file>: the JSON your script wrote into my-day/data/.work/");
  const file = path.join(workDir, path.basename(arg.slice(1)));
  try { return readJson(file); } catch { return fail(`${arg.slice(1)} is not JSON in my-day/data/.work/`); }
}

// ── Graph ──
async function graphGet(name, rawPath, pagesArg) {
  const token = process.env.MICROSOFT_GRAPH_TOKEN;
  if (!token) fail("MICROSOFT_GRAPH_TOKEN is not set: Outlook is not connected for this run", 2);
  // Git Bash on Windows turns "/me/..." into "C:/Program Files/Git/me/...": take the /me part back.
  let p = String(rawPath || "").trim().replace(/^[A-Za-z]:[\\/].*?[\\/](?=me([\\/?]|$))/, "/");
  if (/^me([/?]|$)/.test(p)) p = "/" + p;
  if (!/^\/me(\/|\?|$)/.test(p) || /:\/\/|\s/.test(p.replace(/%20/g, ""))) fail("the path starts with /me and has no spaces (write a space as %20)");
  const pages = Math.max(1, Math.min(10, Number(pagesArg) || 1));
  // "+" in a query reads as a space: an offset like +03:00 must reach Graph as %2B.
  let url = GRAPH + p.replace(/\+/g, "%2B");
  const out = [];
  for (let i = 0; i < pages && url; i++) {
    let res, body;
    for (let attempt = 0; attempt < 2; attempt++) {
      res = await fetch(url, { headers: { Authorization: "Bearer " + token, Accept: "application/json", Prefer: `outlook.timezone="${TZ}", outlook.body-content-type="text"` } });
      if ((res.status === 429 || res.status >= 500) && attempt === 0) {
        const wait = Math.min(10, Number(res.headers.get("retry-after")) || 3);
        await new Promise((r) => setTimeout(r, wait * 1000));
        continue;
      }
      break;
    }
    body = await res.text();
    if (res.status === 401) fail("Outlook needs a new sign-in (401)", 3);
    if (!res.ok) {
      let code = "";
      try { code = JSON.parse(body).error.code; } catch { /* not JSON */ }
      fail(`Outlook answered ${res.status}${code ? " " + code : ""}: nothing saved, leave this out`, 4);
    }
    const json = JSON.parse(body);
    out.push(json);
    url = typeof json["@odata.nextLink"] === "string" && json["@odata.nextLink"].startsWith(GRAPH) ? json["@odata.nextLink"] : "";
  }
  const n = cleanName(name);
  fs.mkdirSync(workDir, { recursive: true });
  fs.writeFileSync(path.join(workDir, n + ".json"), out.map((x) => JSON.stringify(x)).join("\n") + "\n");
  const names = savedNames();
  if (!names.includes(n)) writeJson(savedList, [...names, n]);
  let paths = {};
  try { paths = readJson(pathsFile); } catch { /* first one */ }
  writeJson(pathsFile, { ...paths, [n]: p });
  savedTextCache = null;
  addRefs(out.flatMap((x) => (Array.isArray(x.value) ? x.value : [])));
  const c = countOf(n);
  console.log(`saved ${n}: ${c.n} item${c.n === 1 ? "" : "s"}${c.more ? " (there is more than this)" : ""}`);
}
function listLine(it) {
  const r = refs().byId[it.id] || "";
  const clip = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);
  if (isEvent(it)) {
    const s = eventTime(it.start), e = eventTime(it.end);
    const when = it.isAllDay ? "all day " + (s ? ymd(s) : "") : s ? `${ymd(s)} ${hhmm(s)}-${e ? hhmm(e) : "?"}` : "?";
    const flags = [it.isCancelled ? "cancelled" : "", it.showAs === "free" ? "shown free" : "", it.responseStatus && it.responseStatus.response ? "you: " + it.responseStatus.response : ""].filter(Boolean).join(", ");
    return `${r} | ${when} | ${clip(it.subject, 70)} | by ${it.organizer && it.organizer.emailAddress ? it.organizer.emailAddress.name : "?"} | with ${guests(it).slice(0, 6).join(", ") || "nobody"}${flags ? " | " + flags : ""}`;
  }
  if (it.receivedDateTime || it.sentDateTime) {
    const when = it.sentDateTime && !it.receivedDateTime ? it.sentDateTime : it.receivedDateTime;
    const d = new Date(when);
    return `${r} | ${isNaN(d) ? when : ymd(d) + " " + hhmm(d)} | from ${fromName(it)} <${fromAddr(it)}>${it.toRecipients ? " | to " + toNames(it).slice(0, 4).join(", ") : ""} | ${clip(it.subject, 80)} | conv ${String(it.conversationId || "").slice(-10)}${it.isRead === false ? " | unread" : ""}${it.inferenceClassification === "other" ? " | Other tab" : ""} | ${clip(it.bodyPreview, 140)}`;
  }
  return clip(JSON.stringify(it), 200);
}

// ── The gift ──
function giftOf(g) {
  if (!g || typeof g !== "object" || Array.isArray(g)) fail("the gift must be an object");
  const kind = String(g.kind || "");
  if (!GIFT_KINDS.includes(kind)) fail(`the gift kind is ${GIFT_KINDS.join(", ")}, not "${kind}"`);
  const out = { kind };
  if (g.gist !== undefined && g.gist !== "") {
    const gist = String(g.gist).trim();
    if (gist.length > 140) fail("the gist is longer than 140 characters");
    if (/\d/.test(gist.replace(/\b\d{1,2}:\d{2}\b/g, ""))) fail("refused, a number in the gist: say what they want, without numbers");
    out.gist = gist;
  }
  if (kind === "waiting" || (kind === "prep" && g.messageId)) {
    const m = itemFor(g.messageId);
    if (!m || !m.receivedDateTime) fail(`refused, no saved email ${g.messageId || "(give messageId: its ref, like m3)"}`);
    const at = new Date(m.receivedDateTime);
    if (at.getTime() < Date.now() - 60 * DAY) fail("refused, that email is older than 60 days");
    const key = kind === "waiting" ? "" : "mail";
    out[key ? "mailWho" : "who"] = fromName(m).slice(0, 80);
    out[key ? "mailSubject" : "subject"] = String(m.subject || "").slice(0, 140);
    out[key ? "mailSince" : "since"] = iso(at);
    if (SAFE_LINK.test(m.webLink || "")) out[key ? "mailLink" : "link"] = m.webLink;
    if (kind === "waiting") out.messageId = m.id;
  }
  if (kind === "prep") {
    const e = itemFor(g.eventId);
    if (!e || !isEvent(e)) fail(`refused, no saved meeting ${g.eventId || "(give eventId: its ref, like e2)"}`);
    if (!counts(e)) fail("refused, that meeting is cancelled, declined, all day or shown as free");
    const s = eventTime(e.start), en = eventTime(e.end);
    if (!s || !en || en.getTime() <= Date.now() || s.getTime() > dayStart(2).getTime()) fail("refused, a prep gift is for a meeting still to come today or tomorrow");
    const people = guests(e).filter((n) => n && !/^(you|me)$/i.test(n));
    // A plan alone (the dentist, a pickup) counts when a saved email is about it: messageId, checked above.
    if (!people.length && !g.messageId) fail("refused, that plan has no other guests and no messageId of a saved email about it: give noise or calm");
    out.title = String(e.subject || "Meeting").slice(0, 120);
    out.start = iso(s);
    out.end = iso(en);
    out.people = people.slice(0, 3);
    if (people.length > 3) out.morePeople = people.length - 3;
    if (e.location && e.location.displayName) out.place = String(e.location.displayName).slice(0, 80);
    if (SAFE_LINK.test(e.webLink || "")) out.link = e.webLink;
    const join = e.onlineMeeting && e.onlineMeeting.joinUrl;
    if (SAFE_LINK.test(join || "")) out.join = join;
  }
  if (kind === "noise") {
    // The sender by address, counted here in the saved inbox answer (`in`, default inbox30).
    const addr = String(g.from || "").trim().toLowerCase();
    const src = cleanName(g.in || "inbox30");
    if (!addr) fail('a noise gift needs from: the sender\'s address, as "senders" printed it');
    const theirs = itemsOf(src).filter((m) => fromAddr(m).toLowerCase() === addr);
    if (theirs.length < 5) fail(`refused, ${addr} sent ${theirs.length} in ${src}: noise is 5 or more. Give calm`);
    out.who = fromName(theirs[0]).slice(0, 80);
    out.from = addr;
    out.count = theirs.length + " " + (theirs.length === 1 ? "email" : "emails");
    const unread = theirs.filter((m) => m.isRead === false).length;
    if (unread) out.unread = String(unread);
    out.days = src === "inbox30" ? 30 : src === "inbox14" ? 14 : undefined;
  }
  return out;
}

// ── latest.json: the agent gives refs and its own words; the facts come from the saved answers ──
function latestOf(l) {
  if (!l || typeof l !== "object" || Array.isArray(l)) fail("latest.json must be an object");
  if (typeof l.headline !== "string" || !l.headline.trim()) fail("latest.json needs a headline");
  l.headline = fill(l.headline, "the headline");
  // The board is read now, not at 7: a time of today that is already over is not news.
  for (const x of l.headline.matchAll(/\b(\d{1,2}):(\d{2})\b/g)) {
    const [t, h, m] = x;
    // "tomorrow's 10:00 pickup", "Thursday 16:00": a time of another day.
    if (/\b(tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next)\b/i.test(l.headline.slice(Math.max(0, x.index - 30), x.index))) continue;
    const d = dayStart(0); d.setHours(+h, +m);
    if (d.getTime() < Date.now() - 5 * 60000) fail(`refused, the headline names ${t}, and it is ${hhmm(new Date())} now: write about what is left of the day`);
  }
  const ref = (v) => (typeof v === "string" ? refs().byId[v] || v : v);
  const events = (Array.isArray(l.events) ? l.events : []).map((ev) => {
    const e = itemFor(ev && ev.id);
    if (!e || !isEvent(e) || !counts(e)) return null;
    const s = eventTime(e.start), en = eventTime(e.end);
    const out = {
      id: ref(e.id), title: String(e.subject || "Busy").slice(0, 120), start: s ? iso(s) : null, end: en ? iso(en) : null, allDay: !!e.isAllDay,
      where: e.location && e.location.displayName ? String(e.location.displayName).slice(0, 80) : "",
      online: !!e.isOnlineMeeting, people: guests(e).slice(0, 6),
      myAnswer: e.isOrganizer ? "organizer" : (e.responseStatus && e.responseStatus.response) || "",
      prep: typeof ev.prep === "string" ? ev.prep.slice(0, 220) : ""
    };
    if (typeof ev.prepMailId === "string") out.prepMailId = ref(itemFor(ev.prepMailId) ? itemFor(ev.prepMailId).id : ev.prepMailId);
    const join = e.onlineMeeting && e.onlineMeeting.joinUrl;
    if (SAFE_LINK.test(join || "")) out.joinUrl = join;
    if (SAFE_LINK.test(e.webLink || "")) out.webLink = e.webLink;
    return out;
  }).filter(Boolean);
  const waiting = (Array.isArray(l.waiting) ? l.waiting : []).map((w) => {
    const m = itemFor(w && w.id);
    if (!m || !m.receivedDateTime) return null;
    const out = {
      id: ref(m.id), from: fromName(m).slice(0, 80), company: typeof w.company === "string" ? w.company.slice(0, 60) : "",
      subject: String(m.subject || "").slice(0, 140), gist: typeof w.gist === "string" ? w.gist.slice(0, 200) : "",
      receivedAt: iso(new Date(m.receivedDateTime)), waitingSince: iso(new Date(m.receivedDateTime)), urgent: w.urgent === true,
      minutes: typeof w.minutes === "number" && w.minutes > 0 && w.minutes <= 60 ? Math.round(w.minutes) : 5,
      reply: typeof w.reply === "string" ? w.reply.slice(0, 600) : "",
      kind: WAITING_KINDS.includes(w.kind) ? w.kind : "other"
    };
    // Tied to a plan only while that plan is still ahead today: "before 13:00" means nothing at 15:00.
    let ahead = false;
    const ev = typeof w.eventId === "string" ? itemFor(w.eventId) : null;
    if (ev && isEvent(ev)) {
      const s = eventTime(ev.start), en = eventTime(ev.end);
      if (s && en && en.getTime() > Date.now() && s.getTime() < dayStart(1).getTime()) { out.eventId = ref(ev.id); ahead = true; }
    }
    // "Answer today" follows the day they asked for, when there is one: a Friday ask is not today's.
    if (typeof w.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(w.due)) {
      out.due = w.due;
      out.urgent = w.due <= ymd(dayStart(0)) || ahead;
    } else if (out.urgent && ev && !ahead) out.urgent = false;
    if (SAFE_LINK.test(m.webLink || "")) out.webLink = m.webLink;
    return out;
  }).filter(Boolean);
  const ids = new Set(waiting.map((w) => w.id));
  for (const e of events) if (e.prepMailId && !ids.has(e.prepMailId)) delete e.prepMailId;
  const fyi = (Array.isArray(l.fyi) ? l.fyi : []).map((f) => {
    const m = itemFor(f && f.id);
    if (!m) return null;
    const out = { from: fromName(m).slice(0, 80), gist: typeof f.gist === "string" ? f.gist.slice(0, 160) : String(m.subject || "").slice(0, 160) };
    if (SAFE_LINK.test(m.webLink || "")) out.webLink = m.webLink;
    return out;
  }).filter(Boolean).slice(0, 5);
  const day = (v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
  // Bills: an email that asks for money. Who sent it comes from Outlook; the amount must be
  // written in a saved answer exactly as the agent gives it; what, the due day and the
  // status are the agent's words.
  const bills = (Array.isArray(l.bills) ? l.bills : []).map((b) => {
    const m = itemFor(b && b.id);
    if (!m || !m.receivedDateTime || typeof b.what !== "string" || !b.what.trim()) return null;
    const amount = typeof b.amount === "string" ? b.amount.trim() : "";
    if (amount && (!/\d/.test(amount) || !inSaved(amount))) fail(`refused, the amount ${amount} of ${b.id} is not written in that email: copy it as the email writes it, or leave it out`);
    const out = { id: ref(m.id), from: fromName(m).slice(0, 80), what: b.what.trim().slice(0, 100), amount: amount.slice(0, 24),
      status: ["due", "failed", "renews", "paid"].includes(b.status) ? b.status : "due" };
    if (day(b.due)) out.due = day(b.due);
    if (SAFE_LINK.test(m.webLink || "")) out.webLink = m.webLink;
    return out;
  }).filter(Boolean).slice(0, 8);
  // Parcels: a shop's or a carrier's email. The shop comes from Outlook; what, the day it
  // should arrive and the status are the agent's words.
  const deliveries = (Array.isArray(l.deliveries) ? l.deliveries : []).map((p) => {
    const m = itemFor(p && p.id);
    if (!m || !m.receivedDateTime || typeof p.what !== "string" || !p.what.trim()) return null;
    const out = { id: ref(m.id), from: fromName(m).slice(0, 60), what: p.what.trim().slice(0, 100),
      status: ["ordered", "shipped", "out-for-delivery", "delayed", "delivered"].includes(p.status) ? p.status : "shipped" };
    if (day(p.eta)) out.eta = day(p.eta);
    if (SAFE_LINK.test(m.webLink || "")) out.webLink = m.webLink;
    return out;
  }).filter(Boolean).slice(0, 8);
  // Coming up: a calendar event of the next 7 days, copied from Outlook, or a date an email
  // names (a school trip, a booking), with the agent's title and the day.
  const coming = (Array.isArray(l.coming) ? l.coming : []).map((c) => {
    const it = itemFor(c && c.id);
    if (!it) return null;
    const kind = c.kind === "birthday" ? "birthday" : "event";
    if (isEvent(it)) {
      if (it.isCancelled) return null;
      const st = eventTime(it.start);
      const out = { id: ref(it.id), title: String(it.subject || "").slice(0, 100), start: st ? (it.isAllDay ? ymd(st) : iso(st)) : null, allDay: !!it.isAllDay, kind,
        where: it.location && it.location.displayName ? String(it.location.displayName).slice(0, 60) : "" };
      if (SAFE_LINK.test(it.webLink || "")) out.webLink = it.webLink;
      return out.start ? out : null;
    }
    if (typeof c.title !== "string" || !c.title.trim() || !day(c.date)) return null;
    return { id: ref(it.id), title: c.title.trim().slice(0, 100), start: day(c.date), allDay: true, kind, where: "" };
  }).filter(Boolean).slice(0, 12);
  const w = workHours();
  const set = l.setAside && typeof l.setAside === "object" ? l.setAside : {};
  const out = {
    schema: SCHEMA + "@1", example: false, generatedAt: iso(new Date()), timeZone: TZ,
    person: { name: l.person && typeof l.person.name === "string" ? l.person.name.slice(0, 60) : "" },
    headline: l.headline.slice(0, 200),
    day: { date: ymd(dayStart(0)), startHour: Math.min(7, Math.floor(w.from)), endHour: 22 },
    events, waiting, bills, deliveries, coming, fyi
  };
  // Set aside: the emails the agent put there, each one a saved email, counted here.
  const aside = new Set((Array.isArray(set.ids) ? set.ids : []).map((x) => itemFor(x)).filter((m) => m && m.receivedDateTime).map((m) => m.id));
  if (aside.size) out.setAside = { count: aside.size, what: typeof set.what === "string" ? set.what.slice(0, 80) : "" };
  if (savedNames().includes("inbox")) { const c = countOf("inbox"); if (!c.more) out.arrived = c.n; }
  return out;
}

/** A reading never ends without its gift: calm, when none was given. */
function calmIfNoGift() {
  if (!fs.existsSync(readingFile)) return;
  const r = readJson(readingFile);
  if (r.gift || r.done) return;
  r.gift = { kind: "calm", at: iso(new Date()) };
  writeJson(readingFile, r);
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "window") {
  const z = (d) => d.toISOString().replace(/\.\d{3}Z$/, "Z");
  console.log([
    `NOW='${iso(new Date())}'`, `TODAY='${ymd(dayStart(0))}'`, `FROM0='${z(dayStart(0))}'`, `END0='${z(dayStart(1))}'`, `END1='${z(dayStart(2))}'`,
    `END7='${z(dayStart(7))}'`, `FROM3='${z(dayStart(-3))}'`, `FROM14='${z(dayStart(-14))}'`, `FROM30='${z(dayStart(-30))}'`, `TZ_NAME='${TZ}'`,
  ].join("\n"));
} else if (cmd === "start") {
  if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });
  writeJson(readingFile, { schema: SCHEMA + "/reading@1", startedAt: iso(new Date()), done: false, lines: [] });
  console.log("reading started; get saves Outlook's answers in my-day/data/.work/");
} else if (cmd === "get") {
  await graphGet(args[0], args[1], args[2]);
} else if (cmd === "list") {
  for (const it of itemsOf(args[0])) console.log(listLine(it));
  const c = countOf(args[0]);
  if (c.more) console.log("(there is more than this)");
} else if (cmd === "senders") {
  const by = new Map();
  for (const m of itemsOf(args[0])) {
    const a = fromAddr(m).toLowerCase();
    if (!a) continue;
    const s = by.get(a) || { name: fromName(m), n: 0, unread: 0, other: 0 };
    s.n++; if (m.isRead === false) s.unread++; if (m.inferenceClassification === "other") s.other++;
    by.set(a, s);
  }
  for (const [a, s] of [...by].sort((x, y) => y[1].n - x[1].n).slice(0, 12)) console.log(`${s.n} | ${s.name} <${a}> | ${s.unread} unread${s.other ? " | " + s.other + " in Other" : ""}`);
} else if (cmd === "count") {
  for (const n of args) { const c = countOf(n); console.log(`${cleanName(n)}: ${c.n}${c.more ? " (there is more than this)" : ""}`); }
} else if (cmd === "push") {
  lockReading();
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
  const out = { schema: SCHEMA + "/profile@1", at: iso(new Date()), timeZone: TZ };
  // Names are copied from the mail: the name they sign with, the people they write to most.
  if (typeof p.name === "string" && p.name.trim()) { if (!inSaved(p.name)) fail(`refused, the name "${p.name}" is not written in any saved answer`); out.name = p.name.trim().slice(0, 40); }
  if (typeof p.signOff === "string" && p.signOff.trim()) {
    const lines = p.signOff.split(/\n|,\s*/).map((s) => s.trim()).filter(Boolean);
    if (!lines.every(inSaved)) fail("refused, that sign-off is not written in any saved sent email");
    out.signOff = p.signOff.trim().slice(0, 60);
  }
  if (Array.isArray(p.regulars)) {
    const regs = p.regulars.map((s) => String(s).trim()).filter(Boolean);
    for (const n of regs) if (!inSaved(n)) fail(`refused, "${n}" is not written in any saved answer`);
    if (regs.length) out.regulars = regs.slice(0, 5);
    if (regs.length > 5) out.regularsMore = regs.length - 5;
  }
  const w = workHours();
  if (w.outlook) out.workHours = { from: w.fromText, to: w.toText };
  if (savedNames().includes("inbox30")) { const c = countOf("inbox30"); if (!c.more && c.n) out.mail30 = c.n; }
  if (savedNames().includes("week")) { const n = itemsOf("week").filter(counts).length; if (n) out.meetings7 = n; }
  writeJson(path.join(dataDir, "profile.json"), out);
  console.log("profile written: " + Object.keys(out).join(", "));
} else if (cmd === "latest") {
  calmIfNoGift();
  const l = latestOf(argFile(args));
  writeJson(path.join(dataDir, "latest.json"), l);
  writeJson(path.join(dataDir, "status.json"), { at: iso(new Date()), ok: true });
  console.log(`latest.json written: ${l.events.length} plans, ${l.waiting.length} waiting, ${l.bills.length} bills, ${l.deliveries.length} parcels, ${l.coming.length} coming; and status.json`);
} else if (cmd === "done") {
  calmIfNoGift();
  const r = fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first");
  r.done = true;
  writeJson(readingFile, r);
  try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("my-day/data/.work/ is busy: delete it in your next call"); }
  console.log("reading done");
} else {
  fail("use window, start, get, list, count, push, gift, profile, latest or done");
}
