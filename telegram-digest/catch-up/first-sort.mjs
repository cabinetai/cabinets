#!/usr/bin/env node
// Telegram Digest helper: the only way a run reads Telegram and writes the files the page shows.
//
// Cabinet's Telegram gateway keeps every message the person's bot receives in a log on this
// computer (one JSON line per message, a file per day, found through CABINET_TELEGRAM_MESSAGES).
// This helper reads that log, gives every chat and message a short ref (c3, m14), counts every
// number, and copies every name, quote, time and link into the page's files. The agent only adds
// its own short words: gists, replies, the headline. Run it from the cabinet root:
//
//   node catch-up/first-sort.mjs <command>
//
// start [--morning]   read the window (the first reading: up to 7 days; a morning: since the last one)
// list [c3]           the chats that moved and their last messages, or every message of one chat
// needs               messages that may wait for the person, one per person and chat, oldest first
// mine                the person's own messages that sound like a promise
// shared              links, files, photos, videos and voice messages people sent
// loud                the chats by how much they moved, and whether any of it was for the person
// push '<line>'       a reading line for the first reading; counts go in placeholders
// gift @file          the first reading's gift          profile @file   "This is you"
// latest @file        the morning's page                done            the first reading is over
// fail '<why>'        the run could not read Telegram
//
// A file is JSON the agent writes into catch-up/data/.work/, given by its name only.
// Exit 3: there is no message log yet (Telegram not connected, or the bot has received nothing).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(APP, "data");
const WORK = path.join(DATA, ".work");
const STATE = path.join(WORK, "state.json");
const DAY = 86400000;
const FIRST_DAYS = 7;
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const PROMISE = /\b(i'?ll|i will|i'm going to|i am going to|let me|will do|i can do|on it|leave it with me)\b/i;
const AGREE = /^(ok|okay|yes|yep|yeah|sure|deal|agreed|sounds good|perfect|great|fine|works for me|\+1|👍|👌|✅)(?=$|[\s!.,])/iu;
const QUESTION = /\?\s*$|\?\s/;

// ── Small helpers ────────────────────────────────────────────────────────

function die(message, code = 1) {
  console.error(message);
  process.exit(code);
}
function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + "\n");
  fs.renameSync(tmp, file);
}
/** Now with the computer's own offset, the way `date +%Y-%m-%dT%H:%M:%S%z` prints it. */
function localIso(d = new Date()) {
  const pad = (n) => String(Math.abs(n)).padStart(2, "0");
  const off = -d.getTimezoneOffset();
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) +
    (off >= 0 ? "+" : "-") + pad(Math.trunc(off / 60)) + ":" + pad(off % 60);
}
function dateOnly(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}
function clock(iso) {
  const d = new Date(iso);
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}
function short(text, max = 160) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}
function fileArg(arg) {
  if (!arg || !arg.startsWith("@")) die("Give a file as @name.json, written into catch-up/data/.work/.");
  const name = path.basename(arg.slice(1));
  const value = readJson(path.join(WORK, name));
  if (!value || typeof value !== "object") die("Could not read catch-up/data/.work/" + name + " as JSON.");
  return value;
}
/** Words the agent wrote may hold clock times, never a number of its own: counts come from here. */
function noNumbers(field, words) {
  const bare = String(words || "").replace(/\b\d{1,2}:\d{2}\b/g, "");
  if (/\d/.test(bare)) die(field + " has a number in it: \"" + words + "\". Counts come from the helper; say it in words, or leave the number out.");
}
function plural(n, one, many) {
  return n + " " + (n === 1 ? one : many);
}

// ── The log ──────────────────────────────────────────────────────────────

function logDir() {
  const env = process.env.CABINET_TELEGRAM_MESSAGES;
  if (env && fs.existsSync(env)) return env;
  // Without the variable, the log sits in the data folder this cabinet lives in.
  let dir = APP;
  for (let i = 0; i < 8; i++) {
    // .agents/.telegram is where Cabinet keeps it now; .runtime/telegram is where it was.
    for (const candidate of [
      path.join(dir, ".agents", ".telegram", "messages"),
      path.join(dir, ".agents", ".runtime", "telegram", "messages"),
    ]) {
      if (fs.existsSync(candidate)) return candidate;
    }
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

function readLog(since) {
  const dir = logDir();
  if (!dir) die("There is no Telegram message log on this computer yet. Telegram is not connected here, or Cabinet has not received a message since it was connected.", 3);
  const meta = readJson(path.join(dir, "meta.json"), {});
  const from = dateOnly(new Date(since.getTime() - DAY));
  const out = [];
  for (const name of fs.readdirSync(dir).sort()) {
    const m = /^(\d{4}-\d{2}-\d{2})\.jsonl$/.exec(name);
    if (!m || m[1] < from) continue;
    for (const line of fs.readFileSync(path.join(dir, name), "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (new Date(msg.at) >= since) out.push(msg);
      } catch {
        // A line cut short by a crash is skipped.
      }
    }
  }
  out.sort((a, b) => a.at.localeCompare(b.at) || a.id - b.id);
  return { meta, messages: out };
}

// ── State: the window this run reads, with refs ──────────────────────────

function loadState() {
  const s = readJson(STATE);
  if (!s) die("Run `start` first.");
  return s;
}
function chatKind(type) {
  return type === "channel" ? "channel" : type === "private" ? "private" : "group";
}

function cmdStart(args) {
  const morning = args.includes("--morning");
  const now = new Date();
  let since = new Date(now.getTime() - FIRST_DAYS * DAY);
  if (morning) {
    const last = readJson(path.join(DATA, "latest.json"));
    const lastAt = last && !last.example ? new Date(last.generatedAt) : null;
    since = lastAt && now - lastAt < 3 * DAY && now - lastAt > 3600000 ? lastAt : new Date(now.getTime() - DAY);
  }
  const { meta, messages } = readLog(since);
  const me = new Set((meta.me || []).map(Number));
  const myNames = new Set();
  for (const m of messages) if (m.mine || (m.from && me.has(m.from.id))) { m.mine = true; if (m.from && m.from.username) myNames.add(m.from.username.toLowerCase()); }
  const chats = new Map();
  for (const m of messages) {
    const key = String(m.chat.id);
    if (!chats.has(key)) chats.set(key, { id: m.chat.id, kind: chatKind(m.chat.type), name: m.chat.title || "A chat", username: m.chat.username || null, count: 0, mine: 0 });
    const c = chats.get(key);
    c.count++;
    if (m.mine) c.mine++;
    if (m.chat.title) c.name = m.chat.title;
  }
  const ordered = [...chats.values()].sort((a, b) => b.count - a.count);
  ordered.forEach((c, i) => { c.ref = "c" + (i + 1); });
  const refOf = new Map(ordered.map((c) => [String(c.id), c.ref]));
  messages.forEach((m, i) => { m.ref = "m" + (i + 1); m.c = refOf.get(String(m.chat.id)); });
  const myFirst = messages.find((m) => m.mine && m.from)?.from.name.split(" ")[0] || "";
  const state = { startedAt: localIso(now), since: localIso(since), morning, me: [...me], myNames: [...myNames], myFirst, bot: meta.bot || null, chats: ordered, messages };
  writeJson(STATE, state);
  if (!morning) writeJson(path.join(DATA, "reading.json"), { startedAt: state.startedAt, done: false, lines: [], gift: null });
  const t = totals(state);
  console.log("Window: since " + state.since + (morning ? " (the last morning)" : " (the first reading)") + ".");
  console.log(plural(t.messages, "message", "messages") + " in " + plural(t.chats, "chat", "chats") + " and " + plural(t.channels, "channel", "channels") + "; " + plural(t.mine, "was", "were") + " the person's own.");
  if (!state.me.length) console.log("Note: the log does not say who the person is (no allowlisted Telegram user). Their own messages cannot be told apart.");
  if (!messages.length) console.log("Nothing in the window. A quiet window is true: write a calm page, and never invent a chat.");
  for (const c of ordered.slice(0, 20)) console.log("  " + c.ref + "  " + c.kind.padEnd(7) + " " + c.name + "  (" + c.count + ")");
}

// ── Reading commands ─────────────────────────────────────────────────────

function line(m) {
  const who = m.mine ? "YOU" : m.from ? m.from.name : "(channel)";
  const bits = [];
  if (m.kind !== "text") bits.push("[" + m.kind + (m.file ? ": " + m.file : "") + "]");
  if (m.links) bits.push("[link: " + m.links[0] + "]");
  if (m.reply) bits.push("(reply to " + m.reply.id + ")");
  return "  " + m.ref + " " + clock(m.at) + " " + who + ": " + short(m.text, 220) + (bits.length ? " " + bits.join(" ") : "");
}

function cmdList(args) {
  const s = loadState();
  const ref = args[0];
  if (ref) {
    const chat = s.chats.find((c) => c.ref === ref);
    if (!chat) die("No chat " + ref + ".");
    console.log(chat.ref + " " + chat.name + " (" + chat.kind + ", " + chat.count + ")");
    for (const m of s.messages.filter((x) => x.c === ref)) console.log(line(m));
    return;
  }
  for (const c of s.chats) {
    console.log(c.ref + " " + c.name + " (" + c.kind + ", " + plural(c.count, "message", "messages") + (c.mine ? ", " + c.mine + " yours" : "") + ")");
    for (const m of s.messages.filter((x) => x.c === c.ref).slice(-5)) console.log(line(m));
  }
}

function mentionsMe(s, m) {
  const ids = new Set(s.me);
  if ((m.mentionIds || []).some((id) => ids.has(id))) return true;
  return (m.mentions || []).some((u) => s.myNames.includes(u));
}
function namesMe(s, m) {
  return !!s.myFirst && new RegExp("\\b" + s.myFirst.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(m.text);
}
function whyOf(s, m) {
  if (mentionsMe(s, m)) return "mention";
  if (m.reply && s.me.includes(m.reply.from)) return "reply";
  if (m.chat.type === "private") return "direct";
  if (QUESTION.test(m.text) && namesMe(s, m)) return "question";
  return null;
}
/** What the person wrote in that chat after a message, if anything. */
function myAnswer(s, m) {
  return s.messages.find((x) => x.mine && x.c === m.c && x.at > m.at && (!x.reply || x.reply.id === m.id || x.reply.from === (m.from && m.from.id))) || null;
}
function needsList(s) {
  const out = [];
  const seen = new Map();
  for (const m of s.messages) {
    if (m.mine || !m.from || m.from.bot || m.chat.type === "channel") continue;
    const why = whyOf(s, m);
    if (!why) continue;
    const answer = myAnswer(s, m);
    const onlySaid = answer && PROMISE.test(answer.text);
    if (answer && !onlySaid) continue;
    const key = m.from.id + "|" + m.c;
    if (seen.has(key)) { seen.get(key).also.push(m.ref); continue; }
    const row = { m, why, onlySaid: onlySaid ? answer : null, also: [] };
    seen.set(key, row);
    out.push(row);
  }
  return out;
}
function cmdNeeds() {
  const s = loadState();
  const rows = needsList(s);
  if (!rows.length) console.log("Nobody seems to wait for the person in the chats the bot sees.");
  for (const r of rows) {
    const chat = s.chats.find((c) => c.ref === r.m.c);
    console.log(r.m.ref + " [" + r.m.c + " " + chat.name + "] " + r.m.from.name + " " + clock(r.m.at) + " (" + r.why + "): " + short(r.m.text, 240));
    if (r.also.length) console.log("    also asked there: " + r.also.join(", "));
    if (r.onlySaid) console.log("    you only said: " + r.onlySaid.ref + " \"" + short(r.onlySaid.text, 120) + "\"");
  }
}
function cmdMine() {
  const s = loadState();
  const mine = s.messages.filter((m) => m.mine && PROMISE.test(m.text));
  if (!mine.length) console.log("No message of the person's sounds like a promise.");
  for (const m of mine) console.log(line(m) + "  [" + m.c + "]" + (dueFrom(m.text, new Date(m.at)) ? "  due " + dueFrom(m.text, new Date(m.at)) : ""));
}
function isShared(m) {
  return !m.mine && (m.kind !== "text" && m.kind !== "sticker" && m.kind !== "other" || (m.links || []).length > 0);
}
function cmdShared() {
  const s = loadState();
  const list = s.messages.filter(isShared);
  if (!list.length) console.log("Nobody sent a link or a file.");
  for (const m of list) console.log(line(m) + "  [" + m.c + "]");
}
function loudList(s, used = new Set()) {
  const needChats = new Set(needsList(s).map((r) => r.m.c));
  return s.chats.map((c) => ({ c, forYou: needChats.has(c.ref) || used.has(c.ref) }));
}
function cmdLoud() {
  const s = loadState();
  for (const { c, forYou } of loudList(s)) console.log(c.ref + " " + c.name + " (" + c.kind + ", " + c.count + ") " + (forYou ? "has something for you" : "nothing for you"));
}

// ── Counting ─────────────────────────────────────────────────────────────

function totals(s) {
  const nonChannel = s.chats.filter((c) => c.kind !== "channel");
  return {
    messages: s.messages.length,
    chats: nonChannel.length,
    groups: nonChannel.filter((c) => c.kind === "group").length,
    channels: s.chats.length - nonChannel.length,
    mine: s.messages.filter((m) => m.mine).length,
    mentions: s.messages.filter((m) => !m.mine && mentionsMe(s, m)).length,
  };
}

/** "tomorrow", "tonight", "on Friday", "by Oct 21": the day a promise names, as a date, or null. */
function dueFrom(text, at) {
  const t = String(text).toLowerCase();
  const day = new Date(at.getFullYear(), at.getMonth(), at.getDate());
  if (/\b(today|tonight|this evening|later today)\b/.test(t)) return dateOnly(day);
  if (/\btomorrow\b/.test(t)) return dateOnly(new Date(day.getTime() + DAY));
  for (let i = 0; i < 7; i++) {
    if (new RegExp("\\b(on |by |this |next )?" + WEEKDAYS[i] + "\\b").test(t)) {
      let ahead = (i - day.getDay() + 7) % 7 || 7;
      return dateOnly(new Date(day.getTime() + ahead * DAY));
    }
  }
  const m = /\b(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{1,2})\b/.exec(t);
  if (m) {
    const mon = MONTHS.indexOf(m[2] || m[3]);
    const d = +(m[1] || m[4]);
    let when = new Date(day.getFullYear(), mon, d);
    if (when < day) when = new Date(day.getFullYear() + 1, mon, d);
    return dateOnly(when);
  }
  return null;
}

function where(s, m) {
  const c = s.chats.find((x) => x.ref === m.c);
  return { kind: c.kind, name: c.name };
}
function byRef(s, ref, what) {
  const m = s.messages.find((x) => x.ref === ref);
  if (!m) die(what + ": no message " + ref + ". Use the refs that list, needs, mine and shared print.");
  return m;
}
function chatLink(c) {
  return c.username ? "https://t.me/" + c.username : undefined;
}

// ── The first reading ────────────────────────────────────────────────────

function reading() {
  const r = readJson(path.join(DATA, "reading.json"));
  if (!r) die("No first reading is open. `start` (without --morning) opens one.");
  return r;
}
function fillPlaceholders(s, raw) {
  const t = { ...totals(s), waiting: needsList(s).length };
  return raw.replace(/\{(\w+):(c\d+)?\|([^|}]*)\|([^}]*)\}/g, (all, key, ref, one, many) => {
    let n;
    if (key === "in") {
      const c = s.chats.find((x) => x.ref === ref);
      if (!c) die("No chat " + ref + " in " + all + ".");
      n = c.count;
    } else if (key in t) n = t[key];
    else die("Unknown count " + all + ". Use messages, chats, groups, channels, mine, mentions, waiting or in:cN.");
    return n.toLocaleString("en-US") + " " + (n === 1 ? one : many);
  });
}
function cmdPush(args) {
  const s = loadState();
  const raw = args.join(" ").trim();
  if (!raw) die("Give the line in quotes.");
  noNumbers("The line", raw.replace(/\{\w+:(c\d+)?\|[^}]*\}/g, ""));
  const r = reading();
  r.lines.push(fillPlaceholders(s, raw));
  writeJson(path.join(DATA, "reading.json"), r);
  console.log("Pushed: " + r.lines[r.lines.length - 1]);
}
function cmdGift(args) {
  const s = loadState();
  const g = fileArg(args[0]);
  const at = localIso();
  let gift;
  const needs = needsList(s);
  if (g.kind === "waiting") {
    const row = needs.find((r) => r.m.ref === g.messageId);
    if (!row) die("waiting: " + g.messageId + " is not in needs. Pick from what needs printed.");
    if (needs.length && row !== needs[0] && !g.why) die("waiting: the one who waited longest is " + needs[0].m.ref + ". Give it, or say why another comes first in \"why\".");
    noNumbers("gist", g.gist);
    const m = row.m;
    gift = { kind: "waiting", at, who: m.from.name, said: short(m.text, 240), gist: short(g.gist, 140), since: m.at, where: where(s, m), link: m.link };
  } else if (g.kind === "promise") {
    if (needs.length) die("promise: someone is waiting (" + needs[0].m.ref + "). The gift is them first.");
    const m = byRef(s, g.messageId, "promise");
    if (!m.mine || !PROMISE.test(m.text)) die("promise: " + g.messageId + " is not one of the person's promises. Use what mine printed.");
    noNumbers("gist", g.gist);
    gift = { kind: "promise", at, who: promiseTo(s, m), said: short(m.text, 240), gist: short(g.gist, 140), since: m.at, where: where(s, m), link: m.link };
  } else if (g.kind === "noise") {
    const loud = loudList(s).filter((x) => !x.forYou && x.c.count >= 5);
    const pick = loud.find((x) => x.c.ref === g.chat);
    if (!pick) die("noise: " + g.chat + " is not a loud chat with nothing for the person. Use loud.");
    const days = Math.max(1, Math.round((Date.now() - new Date(s.since)) / DAY));
    gift = { kind: "noise", at, who: pick.c.name, count: pick.c.count.toLocaleString("en-US") + " messages", days, where: { kind: pick.c.kind, name: pick.c.name } };
  } else if (g.kind === "calm") {
    if (needs.length) die("calm: someone is waiting (" + needs[0].m.ref + ").");
    gift = { kind: "calm", at };
  } else die("kind is waiting, promise, noise or calm.");
  const r = reading();
  r.gift = gift;
  writeJson(path.join(DATA, "reading.json"), r);
  console.log("Gift set: " + gift.kind + (gift.who ? " (" + gift.who + ")" : ""));
}
function promiseTo(s, m) {
  if (m.reply) {
    const to = s.messages.find((x) => x.id === m.reply.id && x.c === m.c);
    if (to && to.from) return to.from.name;
  }
  const c = s.chats.find((x) => x.ref === m.c);
  if (c.kind === "private") return c.name;
  const before = [...s.messages].reverse().find((x) => x.c === m.c && x.at < m.at && !x.mine && x.from);
  return before ? before.from.name : c.name;
}
function cmdProfile(args) {
  const s = loadState();
  const p = fileArg(args[0]);
  const t = totals(s);
  const hours = s.messages.filter((m) => m.mine).map((m) => { const d = new Date(m.at); return d.getHours() * 60 + d.getMinutes(); }).sort((a, b) => a - b);
  const hm = (v) => String(Math.floor(v / 60)).padStart(2, "0") + ":" + String(Math.round((v % 60) / 15) * 15 % 60).padStart(2, "0");
  const busiest = s.chats.filter((c) => c.kind !== "channel")[0];
  const known = new Set(s.messages.filter((m) => m.from).map((m) => m.from.name));
  const regulars = (Array.isArray(p.regulars) ? p.regulars : []).filter((n) => known.has(n)).slice(0, 5);
  const profile = {
    at: localIso(),
    name: short(p.name, 40),
    regulars,
    days: Math.max(1, Math.round((Date.now() - new Date(s.since)) / DAY)),
    messages: t.messages,
    mine: t.mine,
    mentions: t.mentions,
    ...(hours.length >= 4 ? { active: { from: hm(hours[Math.floor(hours.length * 0.1)]), to: hm(hours[Math.floor(hours.length * 0.9)]) } } : {}),
    ...(busiest ? { busiest: { name: busiest.name, count: busiest.count } } : {}),
  };
  writeJson(path.join(DATA, "profile.json"), profile);
  console.log("Profile written" + (regulars.length < (p.regulars || []).length ? " (left out names Telegram never showed)" : "") + ".");
}
function cmdDone() {
  const file = path.join(DATA, "reading.json");
  const r = readJson(file);
  if (r) { r.done = true; writeJson(file, r); }
  console.log("Done.");
}
function cmdFail(args) {
  const why = args.join(" ").trim() || "The last reading could not get into your Telegram.";
  writeJson(path.join(DATA, "status.json"), { at: localIso(), ok: false, why });
  console.log("Status written.");
}

// ── The morning's page ───────────────────────────────────────────────────

function cmdLatest(args) {
  const s = loadState();
  const a = fileArg(args[0]);
  noNumbers("headline", a.headline);
  const needs = needsList(s);
  const used = new Set();
  const list = (x) => (Array.isArray(x) ? x.filter((v) => v && typeof v === "object") : []);

  const waiting = list(a.waiting).map((w) => {
    let row = needs.find((r) => r.m.ref === w.id);
    // A second ask of the same person in the same chat ("also asked") gets its own row.
    const first = row ? null : needs.find((r) => r.also.includes(w.id));
    if (first) {
      const m2 = byRef(s, w.id, "waiting");
      const answer = myAnswer(s, m2);
      row = { m: m2, why: whyOf(s, m2) || first.why, onlySaid: answer && PROMISE.test(answer.text) ? answer : null, also: [] };
    }
    if (!row) die("waiting: " + w.id + " is not in needs.");
    noNumbers("gist of " + w.id, w.gist);
    const m = row.m;
    used.add(m.c);
    const more = s.messages.filter((x) => x.c === m.c && x.from && x.from.id === m.from.id && x.at > m.at).length;
    const out = { id: m.ref, who: m.from.name, where: where(s, m), said: short(m.text, 400), gist: short(w.gist, 160), why: row.why, at: m.at, urgent: w.urgent === true };
    if (typeof w.reply === "string" && w.reply.trim()) out.reply = w.reply.trim().slice(0, 1500);
    if (more) out.more = more;
    if (row.onlySaid) out.youSaid = { said: short(row.onlySaid.text, 400), at: row.onlySaid.at, due: dueFrom(row.onlySaid.text, new Date(row.onlySaid.at)) || undefined };
    if (m.link) out.link = m.link;
    return out;
  });

  const saidIds = new Set(needs.filter((r) => r.onlySaid).map((r) => r.onlySaid.ref));
  const promises = list(a.promises).map((p) => {
    const m = byRef(s, p.id, "promises");
    if (!m.mine) die("promises: " + p.id + " is not the person's own message.");
    if (saidIds.has(m.ref)) die("promises: " + p.id + " is already the person's answer to someone in waiting. Leave it out here.");
    noNumbers("gist of " + p.id, p.gist);
    used.add(m.c);
    const out = { id: m.ref, to: promiseTo(s, m), where: where(s, m), said: short(m.text, 400), gist: short(p.gist, 160), at: m.at };
    const due = dueFrom(m.text, new Date(m.at));
    if (due) out.due = due;
    if (m.link) out.link = m.link;
    return out;
  });

  const decided = list(a.decided).slice(0, 5).map((d) => {
    const m = byRef(s, d.id, "decided");
    if (AGREE.test(m.text.trim())) die("decided: " + d.id + " only agrees with something. Give the message that made or proposed it.");
    noNumbers("gist of " + d.id, d.gist);
    // A decision alone does not make a loud chat worth reading: it can still be safe to skip.
    const agreed = [...new Set(s.messages.filter((x) => x.c === m.c && x.at > m.at && x.from && x.from.id !== (m.from && m.from.id) &&
      (x.reply ? x.reply.id === m.id : true) && AGREE.test(x.text.trim())).map((x) => (x.mine ? "You" : x.from.name)))].slice(0, 4);
    const out = { id: m.ref, who: m.from ? (m.mine ? "You" : m.from.name) : where(s, m).name, where: where(s, m), gist: short(d.gist, 180), at: m.at };
    if (agreed.length) out.agreed = agreed;
    if (m.link) out.link = m.link;
    return out;
  });

  const shared = list(a.shared).slice(0, 8).map((x) => {
    const m = byRef(s, x.id, "shared");
    if (!isShared(m)) die("shared: " + x.id + " has no link or file. Use what shared printed.");
    const url = (m.links || []).find((l) => /^https:\/\//.test(l));
    const kind = m.kind === "photo" || m.kind === "video" || m.kind === "voice" ? m.kind : m.kind === "text" ? "link" : "file";
    let host = "";
    try { host = url ? new URL(url).hostname.replace(/^www\./, "") : ""; } catch { host = ""; }
    const out = { id: m.ref, kind, title: short(x.title, 120) || m.file || host || (kind === "voice" ? "Voice message" : kind.charAt(0).toUpperCase() + kind.slice(1)),
      who: m.from ? m.from.name : where(s, m).name, where: where(s, m), at: m.at };
    if (typeof x.gist === "string" && x.gist.trim()) { noNumbers("gist of " + x.id, x.gist); out.gist = short(x.gist, 160); }
    if (url) out.url = url;
    if (m.link) out.link = m.link;
    return out;
  });

  const channels = list(a.channels).map((x) => {
    const c = s.chats.find((y) => y.ref === x.id && y.kind === "channel");
    if (!c) die("channels: " + x.id + " is not a channel ref.");
    noNumbers("gist of " + x.id, x.gist);
    const needs2 = ["you", "fyi", "none"].includes(x.needs) ? x.needs : "none";
    if (needs2 !== "none") used.add(c.ref);
    const out = { id: c.ref, name: c.name, count: c.count, needs: needs2, gist: short(x.gist, 160) };
    const link = chatLink(c);
    if (link) out.link = link;
    return out;
  });

  const loud = loudList(s, used).filter((x) => !x.forYou && x.c.count >= 5).slice(0, 6)
    .map((x) => ({ id: x.c.ref, name: x.c.name, kind: x.c.kind, count: x.c.count, ...(chatLink(x.c) ? { link: chatLink(x.c) } : {}) }));
  const t = totals(s);
  t.skipped = loud.reduce((sum, x) => sum + x.count, 0);

  // The banner's dots: every message by hour (by six hours past a day and a half), and the ones that wait.
  const since = new Date(s.since);
  const now = new Date();
  const step = now - since > 36 * 3600000 ? 6 : 1;
  const slots = Math.max(1, Math.ceil((now - since) / (step * 3600000)));
  const slot = (iso) => Math.min(slots - 1, Math.max(0, Math.floor((new Date(iso) - since) / (step * 3600000))));
  const counts = new Array(slots).fill(0);
  const you = new Array(slots).fill(0);
  for (const m of s.messages) counts[slot(m.at)]++;
  for (const w of waiting) you[slot(w.at)]++;

  const latest = {
    schema: "telegram/digest@1",
    generatedAt: localIso(now),
    since: s.since,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    person: { name: short(a.person && a.person.name, 40) || s.myFirst || "" },
    headline: short(a.headline, 220),
    totals: t,
    pulse: { start: s.since, stepHours: step, counts, you },
    waiting, promises, decided, shared, channels, loud,
  };
  writeJson(path.join(DATA, "latest.json"), latest);
  writeJson(path.join(DATA, "status.json"), { at: latest.generatedAt, ok: true });
  console.log("latest.json written: " + plural(waiting.length, "person waiting", "people waiting") + ", " + plural(promises.length, "promise", "promises") + ", " +
    plural(decided.length, "decision", "decisions") + ", " + plural(shared.length, "link or file", "links and files") + ", " + plural(channels.length, "channel", "channels") + ", " + plural(loud.length, "loud chat", "loud chats") + ".");
}

// ── Main ─────────────────────────────────────────────────────────────────

const [cmd, ...rest] = process.argv.slice(2);
const commands = { start: cmdStart, list: cmdList, needs: cmdNeeds, mine: cmdMine, shared: cmdShared, loud: cmdLoud, push: cmdPush, gift: cmdGift, profile: cmdProfile, latest: cmdLatest, done: cmdDone, fail: cmdFail };
if (!commands[cmd]) die("Commands: " + Object.keys(commands).join(", ") + ". See the top of this file.");
commands[cmd](rest);
