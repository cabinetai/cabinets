#!/usr/bin/env node
// Every reading of a person's Teams goes through here: every Graph answer is saved by this
// helper, every number is counted from those answers, and every name, quote and time is
// copied from them, never typed. The agent only picks (by ref) and writes its own words.
// Run it from the cabinet root:
//   node catch-up/first-sort.mjs window            shell lines to eval: NOW TODAY SINCE TZ_NAME
//   node catch-up/first-sort.mjs start             the first reading: new data/reading.json, data/.work/,
//                                                  reads the last 7 days
//   node catch-up/first-sort.mjs start --morning   a morning: data/.work/ only, reads since the last
//                                                  morning (at most 7 days)
//   node catch-up/first-sort.mjs me                who signed in (always first)
//   node catch-up/first-sort.mjs chats             the chats that moved in the window, and their messages
//   node catch-up/first-sort.mjs channels          the channels of your teams that moved, and their messages
//   node catch-up/first-sort.mjs get <name> '<path>' [pages]
//                                                  one more Graph GET (path from me/, chats/ or teams/)
//   node catch-up/first-sort.mjs list [ref]        the conversations, then their messages, with refs
//                                                  (c1 a chat, h1 a channel, m1 a message)
//   node catch-up/first-sort.mjs needs             messages that may need an answer from you, oldest first
//   node catch-up/first-sort.mjs mine              your own messages that sound like a promise
//   node catch-up/first-sort.mjs loud              the conversations by how much they moved
//   node catch-up/first-sort.mjs push '<line>'     add one line to the reading (single quotes)
//   node catch-up/first-sort.mjs gift @<file>      the one thing for the person, shown while you read
//   node catch-up/first-sort.mjs profile @<file>   write data/profile.json ("This is you")
//   node catch-up/first-sort.mjs latest @<file>    write data/latest.json and data/status.json
//   node catch-up/first-sort.mjs done              finish, delete data/.work/
// Placeholders in a line or the headline (the helper counts; the word after | follows the number):
//   {messages:|message|messages}   messages in the window          {chats:|chat|chats}  chats that moved
//   {channels:|channel|channels}   channels that moved             {mentions:|time|times}  @mentions of you
//   {waiting:|person|people}       people who may wait for you     {in:c3|message|messages} in one place
// A line may hold no other digit than these and a clock time. A **bold** name must be written
// in a saved answer.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA = "teams/catch-up";
// A stand-in Graph on this computer, for tests only.
const GRAPH = /^http:\/\/127\.0\.0\.1:\d+\/v1\.0$/.test(process.env.FIRST_SORT_TEST_GRAPH || "") ? process.env.FIRST_SORT_TEST_GRAPH : "https://graph.microsoft.com/v1.0";
const SAFE_LINK = /^https:\/\/(teams\.microsoft\.com|teams\.cloud\.microsoft)\//;
const GIFT_KINDS = ["waiting", "promise", "noise", "calm"];
const MAX_CHATS = 30, MAX_TEAMS = 12, MAX_CHANNELS = 30;

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const readingFile = path.join(dataDir, "reading.json");
const refsFile = path.join(workDir, ".refs.json");
const savedList = path.join(workDir, ".saved.json");
const pathsFile = path.join(workDir, ".paths.json");
const modeFile = path.join(workDir, ".mode.json");
const HOUR = 3600000, DAY = 86400000;

// ── Time, in this machine's zone (the person's own) ──
const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, "0");
const hhmm = (d) => pad(d.getHours()) + ":" + pad(d.getMinutes());
const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
function offsetOf(d) { const o = -d.getTimezoneOffset(); return (o >= 0 ? "+" : "-") + pad(o / 60) + ":" + pad(o % 60); }
function iso(d) { return ymd(d) + "T" + hhmm(d) + ":" + pad(d.getSeconds()) + offsetOf(d); }
const utc = (d) => d.toISOString().replace(/\.\d{3}Z$/, "Z");
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
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/i.test(n)) fail(`"${name}" is not a name: use letters, digits and "-", like chat-3`);
  return n;
}
function mode() { try { return readJson(modeFile); } catch { return fail("run start first"); } }
/** Where the window starts: the last morning's time on a morning (at most 7 days back), else 7 days. */
function sinceFor(morning) {
  const week = new Date(Date.now() - 7 * DAY);
  if (!morning) return week;
  try {
    const l = readJson(path.join(dataDir, "latest.json"));
    const at = new Date(l.generatedAt);
    if (l.example !== true && !isNaN(at) && at > week && at < new Date()) return at;
  } catch { /* no last morning */ }
  return new Date(Date.now() - DAY);
}
function since() { return new Date(mode().since); }

// ── Saved answers ──
function savedNames() { try { return readJson(savedList); } catch { return []; } }
function pagesOf(name) {
  const n = cleanName(name);
  if (!savedNames().includes(n)) fail(`${n} was not saved by this helper: only Graph's own answers count`);
  return fs.readFileSync(path.join(workDir, n + ".json"), "utf8").split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
}
function itemsOf(name) { return pagesOf(name).flatMap((p) => (Array.isArray(p.value) ? p.value : [p])); }
function pathOf(name) { try { return readJson(pathsFile)[name] || ""; } catch { return ""; } }
let savedTextCache = null;
function savedText() {
  if (savedTextCache === null) savedTextCache = savedNames().map((n) => { try { return fs.readFileSync(path.join(workDir, n + ".json"), "utf8"); } catch { return ""; } }).join("\n");
  return savedTextCache;
}
/** Written in a saved answer, as Graph wrote it (JSON escapes included). */
function inSaved(v) {
  const t = savedText();
  const s = String(v).trim();
  return !!s && (t.includes(s) || t.includes(JSON.stringify(s).slice(1, -1)) || t.toLowerCase().includes(s.toLowerCase()));
}

// ── Graph ──
async function fetchJson(url) {
  const token = process.env.MICROSOFT_GRAPH_TOKEN;
  if (!token) fail("MICROSOFT_GRAPH_TOKEN is not set: Teams is not connected for this run", 2);
  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(url, { headers: { Authorization: "Bearer " + token, Accept: "application/json", Prefer: "include-unknown-enum-members" } });
    if ((res.status === 429 || res.status >= 500) && attempt < 2) {
      const wait = Math.min(10, Number(res.headers.get("retry-after")) || 2 * (attempt + 1));
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    break;
  }
  const body = await res.text();
  if (res.status === 401) fail("Teams needs a new sign-in (401)", 3);
  if (!res.ok) {
    let code = "";
    try { code = JSON.parse(body).error.code; } catch { /* not JSON */ }
    const e = new Error(`Teams answered ${res.status}${code ? " " + code : ""}`);
    e.status = res.status;
    throw e;
  }
  return JSON.parse(body);
}
/** What the Graph token says about who it was given to, or null when it is not readable. */
function tokenClaims() {
  try {
    const part = String(process.env.MICROSOFT_GRAPH_TOKEN || "").split(".")[1];
    return part ? JSON.parse(Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")) : null;
  } catch { return null; }
}
function cleanPath(raw) {
  // Git Bash on Windows turns "/me/..." into "C:/Program Files/Git/me/...": take the path back.
  let p = String(raw || "").trim().replace(/^[A-Za-z]:[\\/].*?[\\/](?=(me|chats|teams)([\\/?]|$))/, "/");
  if (/^(me|chats|teams)([/?]|$)/.test(p)) p = "/" + p;
  if (!/^\/(me|chats|teams)(\/|\?|$)/.test(p) || /:\/\/|\s/.test(p.replace(/%20/g, ""))) fail("the path starts with me/, chats/ or teams/ and has no spaces (write a space as %20)");
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
    const json = await fetchJson(url);
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
  return out.flatMap((x) => (Array.isArray(x.value) ? x.value : [x]));
}
/** A few at a time: Teams allows about one read per second per chat or channel. */
async function inTurns(jobs, size) {
  const out = [];
  for (let i = 0; i < jobs.length; i += size) out.push(...(await Promise.all(jobs.slice(i, i + size).map((j) => j()))));
  return out;
}

// ── The model: conversations and messages, from the saved answers only ──
function strip(html) {
  return String(html || "")
    .replace(/<at[^>]*>(.*?)<\/at>/gi, "@$1")
    .replace(/<(br|\/p|\/div|\/li)\s*\/?>/gi, " ")
    .replace(/<attachment[^>]*><\/attachment>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ").trim();
}
let modelCache = null;
function model() {
  if (modelCache) return modelCache;
  const names = savedNames();
  const meItem = names.includes("me") ? itemsOf("me")[0] : null;
  if (!meItem || !meItem.id) fail("run me first: the helper needs to know who you are");
  const me = { id: meItem.id, name: meItem.displayName || "", first: meItem.givenName || String(meItem.displayName || "").split(" ")[0] };
  const r = refs();
  const convs = new Map(); // id -> conv
  const msgs = [];
  const conv = (key, make) => { if (!convs.has(key)) { const c = make(); c.ref = r.conv[key]; convs.set(key, c); } return convs.get(key); };
  // Chats
  const chatList = names.includes("chats") ? itemsOf("chats") : [];
  const teamNames = {};
  for (const n of names.filter((x) => /^teams$/.test(x))) for (const t of itemsOf(n)) teamNames[t.id] = t.displayName || "";
  const channelInfo = {};
  for (const n of names.filter((x) => /^channels-\d+$/.test(x))) {
    const teamId = (/\/teams\/([^/]+)\/channels/.exec(pathOf(n)) || [])[1];
    for (const ch of itemsOf(n)) channelInfo[ch.id] = { teamId: decodeURIComponent(teamId || ""), name: ch.displayName || "", link: ch.webUrl || "" };
  }
  for (const n of names) {
    const chatId = (/^\/chats\/([^/?]+)\/messages/.exec(pathOf(n)) || [])[1];
    const isChannel = /^\/teams\/[^/]+\/channels\/[^/]+\/messages/.test(pathOf(n));
    if (!chatId && !isChannel) continue;
    const add = (m, c, root) => {
      if (!m || !m.id || m.deletedDateTime) return;
      const system = m.messageType && m.messageType !== "message";
      const from = m.from && (m.from.user || m.from.application) || null;
      const files = (m.attachments || []).filter((a) => a && a.name).map((a) => a.name);
      const text = strip(m.body && m.body.content) || (files.length ? "Shared " + files.join(", ") : "");
      const mentions = Array.isArray(m.mentions) ? m.mentions : [];
      msgs.push({
        id: m.id, conv: c, at: new Date(m.createdDateTime), system: !!system || !from,
        fromId: from ? from.id : "", fromName: from ? from.displayName || "" : "",
        mine: !!from && from.id === me.id, text, files,
        mentionsMe: mentions.some((x) => x && x.mentioned && x.mentioned.user && x.mentioned.user.id === me.id),
        mentionsAll: mentions.some((x) => x && x.mentioned && x.mentioned.conversation),
        root: root || m.id, link: SAFE_LINK.test(m.webUrl || "") ? m.webUrl : ""
      });
    };
    if (chatId) {
      const id = decodeURIComponent(chatId);
      const info = chatList.find((x) => x.id === id) || {};
      const c = conv(id, () => ({ key: id, kind: info.chatType || "group", topic: info.topic || "", team: "", link: SAFE_LINK.test(info.webUrl || "") ? info.webUrl : "" }));
      for (const m of itemsOf(n)) add(m, c, null);
    } else {
      const [, teamId, channelId] = /^\/teams\/([^/]+)\/channels\/([^/]+)\/messages/.exec(pathOf(n));
      const chId = decodeURIComponent(channelId);
      const info = channelInfo[chId] || {};
      const c = conv(chId, () => ({ key: chId, kind: "channel", topic: info.name || "", team: teamNames[decodeURIComponent(teamId)] || "", link: SAFE_LINK.test(info.link) ? info.link : "" }));
      for (const m of itemsOf(n)) {
        add(m, c, null);
        for (const rep of m.replies || []) add(rep, c, m.id);
      }
    }
  }
  // Names: a chat without a topic is the other people in it, as Teams wrote them.
  for (const c of convs.values()) {
    const others = [...new Set(msgs.filter((m) => m.conv === c && !m.mine && !m.system && m.fromName).map((m) => m.fromName))];
    if (c.kind === "channel") c.name = c.team ? c.team + " > " + (c.topic || "General") : c.topic || "A channel";
    else if (c.topic) c.name = c.topic;
    else if (c.kind === "oneOnOne") {
      const info = chatList.find((x) => x.id === c.key);
      const pv = info && info.lastMessagePreview && info.lastMessagePreview.from && info.lastMessagePreview.from.user;
      c.name = others[0] || (pv && pv.id !== me.id ? pv.displayName : "") || "A chat";
    } else c.name = others.slice(0, 3).join(", ") || "A group chat";
  }
  // Refs, kept the same for the whole run.
  for (const c of convs.values()) if (!c.ref) { c.ref = (c.kind === "channel" ? "h" : "c") + ++r.n[c.kind === "channel" ? "h" : "c"]; r.conv[c.key] = c.ref; }
  msgs.sort((a, b) => a.at - b.at);
  for (const m of msgs) { if (!r.msg[m.id]) r.msg[m.id] = "m" + ++r.n.m; m.ref = r.msg[m.id]; }
  writeJson(refsFile, r);
  const from = since();
  const inWindow = (m) => !m.system && m.at >= from;
  modelCache = { me, convs: [...convs.values()], msgs, inWindow, from };
  return modelCache;
}
function refs() {
  try { return readJson(refsFile); } catch { return { n: { c: 0, h: 0, m: 0 }, conv: {}, msg: {} }; }
}
function convFor(ref) { return model().convs.find((c) => c.ref === ref) || null; }
function msgFor(ref) { const md = model(); return md.msgs.find((m) => m.ref === ref || m.id === ref) || null; }
/** You wrote in the same place (the same thread in a channel) after this message. */
function answered(m) {
  return model().msgs.some((x) => x.mine && x.conv === m.conv && x.at > m.at && (m.conv.kind !== "channel" || x.root === m.root));
}
/** Messages that may need an answer from you, one per place and person: the oldest unanswered. */
function needs() {
  const md = model();
  const seen = new Map();
  for (const m of md.msgs) {
    if (!md.inWindow(m) || m.mine || answered(m)) continue;
    const direct = m.conv.kind === "oneOnOne";
    const asked = /\?\s*$|\?\s/.test(m.text);
    const meByName = md.me.first && new RegExp("\\b" + md.me.first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(m.text);
    // A question to a whole group is not yours until it names you.
    const why = m.mentionsMe ? "@you" : direct ? "direct" : meByName && asked ? "asked you by name" : "";
    if (!why) continue;
    const key = m.conv.key + "|" + (m.conv.kind === "channel" ? m.root : "") + "|" + m.fromId;
    if (seen.has(key)) { seen.get(key).more++; continue; }
    seen.set(key, { m, why, more: 0 });
  }
  return [...seen.values()].sort((a, b) => a.m.at - b.m.at);
}
const PROMISE = /\b(i'?ll|i will|i'?m going to|i am going to|let me|will (send|share|check|look|get|do|update|follow)|i can (send|share|check|do|get)|by (monday|tuesday|wednesday|thursday|friday|tomorrow|tonight|end of (the )?(day|week)|eod|eow)|later today|tomorrow|next week)\b/i;
function mine() {
  const md = model();
  return md.msgs.filter((m) => md.inWindow(m) && m.mine && PROMISE.test(m.text));
}
function countIn(c) { const md = model(); return md.msgs.filter((m) => m.conv === c && md.inWindow(m)).length; }

// ── Counting ──
function withWord(n, one, many) {
  const num = n.toLocaleString("en-US");
  return one ? `${num} ${n === 1 ? one : many || one}` : num;
}
function counted(kind, arg) {
  const md = model();
  const w = md.msgs.filter(md.inWindow);
  if (kind === "messages") return w.length;
  if (kind === "chats") return new Set(w.filter((m) => m.conv.kind !== "channel").map((m) => m.conv)).size;
  if (kind === "channels") return new Set(w.filter((m) => m.conv.kind === "channel").map((m) => m.conv)).size;
  if (kind === "mentions") return w.filter((m) => m.mentionsMe).length;
  if (kind === "waiting") return new Set(needs().map((x) => x.m.fromId)).size;
  if (kind === "in") { const c = convFor(arg); if (!c) fail(`no place ${arg}: give a ref from list, like c3`); return countIn(c); }
  return fail("unknown count " + kind);
}
/** Placeholders filled; then the words may hold no typed number and no name nobody wrote. */
function fill(textIn, where) {
  const made = [];
  const out = String(textIn).replace(/\{(messages|chats|channels|mentions|waiting|in):([^}]*)\}/g, (_, kind, spec) => {
    const [arg, one, many] = spec.split("|").map((s) => s.trim());
    const v = withWord(counted(kind, arg), one, many);
    made.push(v);
    return v;
  });
  let rest = out;
  for (const v of made) rest = rest.replace(v, "");
  const bare = rest.replace(/\b(last|past|next|coming)\s+(\d{1,2}|two|three|seven|fourteen|thirty)\s+(days|weeks|months|hours)\b/gi, "");
  if (typedNumber(bare)) fail(`refused, a number typed into ${where}: use a placeholder so the helper counts it`);
  if (/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|dozen|hundreds?)\b/i.test(bare.replace(/\bno one\b|\bone of\b/gi, ""))) fail(`refused, a count written as a word in ${where}: use a placeholder`);
  if (/\b(\w+ \w+) \1\b/i.test(out)) fail("refused, words are doubled: the helper adds the word you give after |");
  const bold = out.match(/\*\*[^*]+\*\*/g) || [];
  // "0 messages" is not a finding.
  if (made.length && made.every((v) => /^0\b/.test(v))) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
  for (const b of bold) {
    const inner = b.slice(2, -2);
    if (/\d/.test(inner) || made.some((v) => inner.includes(v))) continue;
    if (/^(nobody|no one|quiet|clear|all caught up|none)$/i.test(inner.trim())) continue;
    for (const piece of inner.split(/,\s*|\s+and\s+|\s+>\s+/).map((s) => s.trim()).filter(Boolean)) {
      if (!inSaved(piece)) fail(`refused, "${piece}" is not written in any saved answer: copy names as Teams wrote them`);
    }
  }
  return out;
}
/** A number standing alone, not part of a name like Q4, v2 or Microsoft 365, nor a clock time. */
function typedNumber(s) {
  return /\d/.test(String(s).replace(/\b\d{1,2}:\d{2}\b/g, "").replace(/\b(microsoft )?365\b/gi, "").replace(/\b[A-Za-z]+\d+[A-Za-z0-9]*\b/g, ""));
}
/** The agent's own words for one item: plain, no number it could have made up. */
function words(v, max, where) {
  if (typeof v !== "string" || !v.trim()) return "";
  const s = v.trim().replace(/\s+/g, " ");
  if (typedNumber(s)) fail(`refused, a number in ${where}: "${s.slice(0, 60)}". Say it without numbers`);
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
  if (!arg.startsWith("@")) fail("give it as @<file>: the JSON you wrote into catch-up/data/.work/");
  const file = path.join(workDir, path.basename(arg.slice(1)));
  try { return readJson(file); } catch { return fail(`${arg.slice(1)} is not JSON in catch-up/data/.work/`); }
}
function where(c) { return { kind: c.kind, name: String(c.name).slice(0, 90), team: c.team ? String(c.team).slice(0, 60) : "" }; }
function linkOf(m) { return m.link || m.conv.link || ""; }
function said(m) { return m.text.slice(0, 240); }

// ── The gift ──
function giftOf(g) {
  if (!g || typeof g !== "object" || Array.isArray(g)) fail("the gift must be an object");
  const kind = String(g.kind || "");
  if (!GIFT_KINDS.includes(kind)) fail(`the gift kind is ${GIFT_KINDS.join(", ")}, not "${kind}"`);
  const out = { kind };
  // The order is the person's: someone waiting, then a promise, then noise, then calm.
  const md = model();
  const promiseOpen = mine().some((m) => Date.now() - m.at.getTime() >= 12 * HOUR);
  const loudOne = md.convs.some((c) => countIn(c) >= 15 && !needs().some((x) => x.m.conv === c) && !md.msgs.some((m) => m.conv === c && m.mentionsMe && md.inWindow(m)));
  if (kind !== "waiting" && needs().length) fail("refused, someone may be waiting for you (see needs): give a waiting gift");
  if ((kind === "noise" || kind === "calm") && promiseOpen) fail("refused, you made a promise (see mine): give a promise gift");
  if (kind === "calm" && loudOne) fail("refused, a loud place never needed you (see loud): give a noise gift");
  const gist = words(g.gist, 140, "the gist");
  if (gist) out.gist = gist;
  if (kind === "waiting" || kind === "promise") {
    const m = msgFor(g.messageId);
    if (!m) fail(`refused, no saved message ${g.messageId || "(give messageId: its ref, like m3)"}`);
    if (kind === "waiting") {
      if (m.mine) fail("refused, that message is yours: a waiting gift is someone else's message");
      if (!needs().some((x) => x.m === m)) fail("refused, that message is not in needs (answered, or not to you): pick from needs");
      out.who = m.fromName.slice(0, 80);
    } else {
      if (!m.mine) fail("refused, a promise gift is a message you wrote: pick from mine");
      if (!PROMISE.test(m.text)) fail("refused, that message does not sound like a promise: pick from mine");
      if (Date.now() - m.at.getTime() < 12 * HOUR) fail("refused, that promise is from the last few hours: it is not late yet");
      const theirs = model().msgs.filter((x) => x.conv === m.conv && !x.mine && !x.system);
      out.who = (m.conv.kind === "oneOnOne" ? m.conv.name : (theirs[theirs.length - 1] || {}).fromName || m.conv.name).slice(0, 80);
    }
    out.where = where(m.conv);
    out.said = said(m);
    out.since = iso(m.at);
    const l = linkOf(m);
    if (l) out.link = l;
    out.messageId = m.ref;
  }
  if (kind === "noise") {
    const c = convFor(g.conv);
    if (!c) fail(`refused, no place ${g.conv || "(give conv: its ref from loud, like c3)"}`);
    const n = countIn(c);
    if (n < 15) fail(`refused, ${c.name} moved ${n} times in the window: noise is 15 or more. Give calm`);
    if (needs().some((x) => x.m.conv === c) || model().msgs.some((m) => m.conv === c && m.mentionsMe && model().inWindow(m))) fail("refused, that place has something for you: it is not noise");
    out.who = c.name.slice(0, 90);
    out.where = where(c);
    out.count = withWord(n, "message", "messages");
    out.days = Math.max(1, Math.round((Date.now() - since().getTime()) / DAY));
    if (c.link) out.link = c.link;
  }
  return out;
}

// ── latest.json: the agent gives refs and its own words; the facts come from the saved answers ──
function latestOf(l) {
  if (!l || typeof l !== "object" || Array.isArray(l)) fail("latest.json must be an object");
  if (typeof l.headline !== "string" || !l.headline.trim()) fail("latest.json needs a headline");
  const md = model();
  const headline = fill(l.headline, "the headline").slice(0, 220);
  const open = new Set(needs().map((x) => x.m));
  const used = new Set();
  const pick = (arr, max, make) => (Array.isArray(arr) ? arr : []).map((x) => {
    const m = msgFor(x && x.id);
    if (!m || used.has(m)) return null;
    const out = make(m, x);
    if (out) used.add(m);
    return out;
  }).filter(Boolean).slice(0, max);
  const waiting = pick(l.waiting, 12, (m, x) => {
    if (m.mine || !open.has(m)) return null;
    const n = needs().find((y) => y.m === m);
    const o = { id: m.ref, who: m.fromName.slice(0, 80), where: where(m.conv), said: said(m), gist: words(x.gist, 160, "a waiting gist"),
      why: n.why === "@you" ? "mention" : n.why === "direct" ? "direct" : "question", at: iso(m.at), urgent: x.urgent === true,
      reply: typeof x.reply === "string" ? x.reply.trim().slice(0, 700) : "" };
    if (n.more) o.more = n.more;
    if (linkOf(m)) o.link = linkOf(m);
    return o;
  });
  const promises = pick(l.promises, 10, (m, x) => {
    if (!m.mine || !PROMISE.test(m.text)) return null;
    const theirs = md.msgs.filter((y) => y.conv === m.conv && !y.mine && !y.system);
    const o = { id: m.ref, to: (m.conv.kind === "oneOnOne" ? m.conv.name : (theirs[theirs.length - 1] || {}).fromName || m.conv.name).slice(0, 80),
      where: where(m.conv), said: said(m), gist: words(x.gist, 160, "a promise gist"), at: iso(m.at) };
    if (typeof x.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.due)) o.due = x.due;
    if (linkOf(m)) o.link = linkOf(m);
    return o;
  });
  const decided = pick(l.decided, 8, (m, x) => {
    const gist = words(x.gist, 180, "a decided gist");
    if (!gist) return null;
    const o = { id: m.ref, who: m.mine ? "You" : m.fromName.slice(0, 80), where: where(m.conv), gist, at: iso(m.at) };
    if (linkOf(m)) o.link = linkOf(m);
    return o;
  });
  // Every channel that moved, with what the agent said about it.
  const said2 = {};
  for (const ch of Array.isArray(l.channels) ? l.channels : []) if (ch && typeof ch.id === "string") said2[ch.id] = ch;
  const channels = md.convs.filter((c) => c.kind === "channel" && countIn(c) > 0).map((c) => {
    const a = said2[c.ref] || {};
    const needsYou = waiting.some((w) => w.where.name === c.name) || md.msgs.some((m) => m.conv === c && m.mentionsMe && md.inWindow(m));
    const o = { id: c.ref, team: String(c.team).slice(0, 60), name: String(c.topic || "General").slice(0, 60), count: countIn(c),
      needs: needsYou ? "you" : a.needs === "fyi" ? "fyi" : "none", gist: words(a.gist, 160, "a channel gist") };
    if (c.link) o.link = c.link;
    return o;
  }).sort((a, b) => (a.needs === "you" ? 0 : a.needs === "fyi" ? 1 : 2) - (b.needs === "you" ? 0 : b.needs === "fyi" ? 1 : 2) || b.count - a.count);
  // Loud: the places that moved most and asked nothing of you.
  const busy = new Set([...waiting, ...promises, ...decided].map((x) => x.where.name));
  const loud = md.convs.map((c) => ({ c, n: countIn(c) }))
    .filter((x) => x.n >= 5 && !busy.has(x.c.name) && !md.msgs.some((m) => m.conv === x.c && m.mentionsMe && md.inWindow(m)))
    .sort((a, b) => b.n - a.n).slice(0, 6)
    .map((x) => ({ id: x.c.ref, name: String(x.c.name).slice(0, 90), kind: x.c.kind, count: x.n, ...(x.c.link ? { link: x.c.link } : {}) }));
  // The pulse: every message of the window in time buckets, and which bucket holds what waits for you.
  const w = md.msgs.filter(md.inWindow);
  const from = md.from.getTime(), now = Date.now();
  const hours = Math.max(1, Math.ceil((now - from) / HOUR));
  const step = Math.max(1, Math.ceil(hours / 48));
  const buckets = Math.ceil(hours / step);
  const pulse = Array.from({ length: buckets }, () => 0);
  const you = Array.from({ length: buckets }, () => 0);
  const slot = (d) => Math.min(buckets - 1, Math.max(0, Math.floor((d.getTime() - from) / (step * HOUR))));
  for (const m of w) pulse[slot(m.at)]++;
  for (const x of waiting) you[slot(new Date(x.at))]++;
  const skipped = w.filter((m) => !m.mine && !busy.has(m.conv.name)).length;
  const out = {
    schema: SCHEMA + "@1", example: false, generatedAt: iso(new Date()), since: iso(md.from), timeZone: TZ,
    person: { name: l.person && typeof l.person.name === "string" && inSaved(l.person.name) ? l.person.name.slice(0, 60) : md.me.first.slice(0, 60) },
    headline,
    totals: { messages: w.length, chats: counted("chats"), channels: counted("channels"), mine: w.filter((m) => m.mine).length, mentions: counted("mentions"), skipped },
    pulse: { start: iso(md.from), stepHours: step, counts: pulse, you },
    waiting, promises, decided, channels, loud
  };
  if (mode().channelsRefused) out.channelsRefused = true;
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

function listLine(m) {
  const flags = [m.mine ? "YOU" : "", m.mentionsMe ? "@you" : "", m.mentionsAll ? "@all" : "", !m.mine && answered(m) ? "you answered" : ""].filter(Boolean).join(" ");
  const d = m.at;
  return `${m.ref} | ${ymd(d).slice(5)} ${hhmm(d)} | ${m.conv.ref} | ${m.fromName || "?"}${flags ? " | " + flags : ""} | ${m.text.slice(0, 170)}`;
}
function convLine(c) {
  const kind = c.kind === "oneOnOne" ? "1:1" : c.kind;
  return `${c.ref} | ${kind} | ${c.name} | ${countIn(c)} in the window`;
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "window") {
  const s = sinceFor(args.includes("--morning"));
  console.log([`NOW='${iso(new Date())}'`, `TODAY='${ymd(new Date())}'`, `SINCE='${utc(s)}'`, `TZ_NAME='${TZ}'`].join("\n"));
} else if (cmd === "start") {
  const morning = args.includes("--morning");
  if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });
  const s = sinceFor(morning);
  writeJson(modeFile, { morning, since: utc(s) });
  if (!morning) writeJson(readingFile, { schema: SCHEMA + "/reading@1", startedAt: iso(new Date()), done: false, lines: [] });
  console.log(`${morning ? "morning" : "first reading"} started; the window is from ${iso(s)}. Next: me, then chats, then channels`);
} else if (cmd === "me") {
  mode();
  try { const it = await save("me", "/me?$select=id,displayName,givenName,mail,userPrincipalName"); console.log(`you are ${it[0].displayName || "?"}`); }
  catch (e) {
    // /me needs User.Read, which a Teams-only sign-in may not hold. The token Microsoft
    // signed says who it was given to: its object id is the same id Teams uses.
    const who = tokenClaims();
    if (e.status !== 403 || !who || !who.oid) fail(e.message + ": could not read who you are", 4);
    const name = String(who.name || "");
    const me = { id: who.oid, displayName: name, givenName: who.given_name || name.split(" ")[0] || "", userPrincipalName: who.upn || who.preferred_username || "", from: "token" };
    fs.mkdirSync(workDir, { recursive: true });
    fs.writeFileSync(path.join(workDir, "me.json"), JSON.stringify(me) + "\n");
    if (!savedNames().includes("me")) writeJson(savedList, [...savedNames(), "me"]);
    let paths = {};
    try { paths = readJson(pathsFile); } catch { /* first one */ }
    writeJson(pathsFile, { ...paths, me: "/me" });
    console.log(`you are ${name || "?"} (from your sign-in)`);
  }
} else if (cmd === "chats") {
  const s = since();
  let chats;
  try { chats = await save("chats", "/me/chats?$expand=lastMessagePreview&$orderby=lastMessagePreview/createdDateTime%20desc&$top=50", 2); }
  catch (e) {
    if (e.status === 403 || e.status === 400 || e.status === 404) fail(`${e.message}: Teams chats can't be read for this account. Microsoft allows it only for work and school accounts, with Chat.Read`, 4);
    fail(e.message, 4);
  }
  const moved = chats.filter((c) => c && c.id && c.lastMessagePreview && new Date(c.lastMessagePreview.createdDateTime) >= s).slice(0, MAX_CHATS);
  const filter = encodeURIComponent(utc(s));
  let n = 0, refused = 0;
  await inTurns(moved.map((c, i) => async () => {
    try { await save("chat-" + (i + 1), `/chats/${encodeURIComponent(c.id)}/messages?$top=50&$orderby=lastModifiedDateTime%20desc&$filter=lastModifiedDateTime%20gt%20${filter}`, mode().morning ? 2 : 3); n++; }
    catch (e) { if (e.status === 401) fail("Teams needs a new sign-in (401)", 3); refused++; }
  }), 3);
  console.log(`saved ${chats.length} chats; ${moved.length} moved in the window, ${n} read${refused ? `, ${refused} refused` : ""}${moved.length === MAX_CHATS ? " (only the most recent " + MAX_CHATS + ")" : ""}. Next: channels, then list`);
} else if (cmd === "channels") {
  const s = since();
  let teams;
  try { teams = await save("teams", "/me/joinedTeams"); }
  catch (e) { if (e.status === 401) fail("Teams needs a new sign-in (401)", 3); const m = mode(); writeJson(modeFile, { ...m, channelsRefused: true }); fail(`${e.message}: your teams can't be read here, go on without channels`, 4); }
  const chans = [];
  await inTurns(teams.slice(0, MAX_TEAMS).map((t, i) => async () => {
    try {
      const list2 = await save("channels-" + (i + 1), `/teams/${encodeURIComponent(t.id)}/channels?$select=id,displayName,webUrl,membershipType`);
      for (const c of list2) chans.push({ team: t, c });
    } catch (e) { if (e.status === 401) fail("Teams needs a new sign-in (401)", 3); }
  }), 3);
  let read = 0, refused = 0, moved = 0;
  await inTurns(chans.slice(0, MAX_CHANNELS).map(({ team, c }, i) => async () => {
    try {
      const msgsIn = await save("chan-" + (i + 1), `/teams/${encodeURIComponent(team.id)}/channels/${encodeURIComponent(c.id)}/messages?$top=50&$expand=replies`);
      read++;
      if (msgsIn.some((m) => new Date(m.lastModifiedDateTime || m.createdDateTime) >= s || (m.replies || []).some((r) => new Date(r.createdDateTime) >= s))) moved++;
    } catch (e) { if (e.status === 401) fail("Teams needs a new sign-in (401)", 3); refused++; }
  }), 3);
  if (chans.length && !read && refused) { const m = mode(); writeJson(modeFile, { ...m, channelsRefused: true }); }
  console.log(`saved ${teams.length} teams, ${chans.length} channels; ${read} read, ${moved} moved in the window${refused ? `, ${refused} refused (channel messages need your IT admin's OK: go on with chats)` : ""}. Next: list`);
} else if (cmd === "get") {
  try { const it = await save(args[0], args[1], args[2]); console.log(`saved ${cleanName(args[0])}: ${it.length} items`); }
  catch (e) { fail(e.message + ": nothing saved, leave this out", 4); }
} else if (cmd === "list") {
  const md = model();
  const only = args[0] ? convFor(args[0]) : null;
  if (args[0] && !only) fail(`no place ${args[0]}`);
  const convs = (only ? [only] : md.convs.filter((c) => countIn(c) > 0)).sort((a, b) => countIn(b) - countIn(a));
  console.log(`you: ${md.me.name} | window from ${iso(md.from)} | ${md.msgs.filter(md.inWindow).length} messages`);
  for (const c of convs) console.log(convLine(c));
  for (const c of convs) {
    const ms = md.msgs.filter((m) => m.conv === c && md.inWindow(m));
    console.log(`\n== ${convLine(c)}`);
    for (const m of ms.slice(only ? 0 : -15)) console.log(listLine(m));
    if (!only && ms.length > 15) console.log(`(${ms.length - 15} earlier: list ${c.ref})`);
  }
} else if (cmd === "needs") {
  const list2 = needs();
  if (!list2.length) console.log("nobody seems to wait for you in the window");
  for (const x of list2) console.log(`${listLine(x.m)} | why: ${x.why}${x.more ? ` | +${x.more} more from them` : ""} | in: ${x.m.conv.name}`);
} else if (cmd === "mine") {
  const list2 = mine();
  if (!list2.length) console.log("nothing you wrote in the window sounds like a promise");
  for (const m of list2) console.log(`${listLine(m)} | in: ${m.conv.name}`);
} else if (cmd === "loud") {
  const md = model();
  const nd = needs();
  for (const c of md.convs.filter((c) => countIn(c) > 0).sort((a, b) => countIn(b) - countIn(a)).slice(0, 15)) {
    const forYou = nd.filter((x) => x.m.conv === c).length + md.msgs.filter((m) => m.conv === c && m.mentionsMe && md.inWindow(m)).length;
    console.log(`${convLine(c)} | ${forYou ? "has something for you" : "nothing for you"}`);
  }
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
  const w = md.msgs.filter(md.inWindow);
  const own = w.filter((m) => m.mine);
  out.days = Math.max(1, Math.round((Date.now() - md.from.getTime()) / DAY));
  if (w.length) out.messages = w.length;
  if (own.length) out.mine = own.length;
  const ment = counted("mentions");
  if (ment) out.mentions = ment;
  // The hours they write in, from their own messages: the middle of them, on this clock.
  if (own.length >= 5) {
    const mins = own.map((m) => m.at.getHours() * 60 + m.at.getMinutes()).sort((a, b) => a - b);
    const q = (f) => mins[Math.min(mins.length - 1, Math.floor(f * (mins.length - 1)))];
    out.active = { from: pad(q(0.1) / 60) + ":" + pad(q(0.1) % 60), to: pad(q(0.9) / 60) + ":" + pad(q(0.9) % 60) };
  }
  const top = md.convs.map((c) => ({ c, n: countIn(c) })).sort((a, b) => b.n - a.n)[0];
  if (top && top.n) out.busiest = { name: String(top.c.name).slice(0, 90), count: top.n };
  writeJson(path.join(dataDir, "profile.json"), out);
  console.log("profile written: " + Object.keys(out).join(", "));
} else if (cmd === "latest") {
  calmIfNoGift();
  const l = latestOf(argFile(args));
  writeJson(path.join(dataDir, "latest.json"), l);
  writeJson(path.join(dataDir, "status.json"), { at: iso(new Date()), ok: true });
  console.log(`latest.json written: ${l.waiting.length} waiting, ${l.promises.length} promises, ${l.decided.length} decided, ${l.channels.length} channels, ${l.loud.length} loud; and status.json`);
} else if (cmd === "done") {
  calmIfNoGift();
  let morning = true;
  try { morning = mode().morning; } catch { /* already gone */ }
  if (!morning && fs.existsSync(readingFile)) {
    const r = readJson(readingFile);
    r.done = true;
    writeJson(readingFile, r);
  }
  try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("catch-up/data/.work/ is busy: delete it in your next call"); }
  console.log("done");
} else {
  fail("use window, start, me, chats, channels, get, list, needs, mine, loud, push, gift, profile, latest or done");
}
