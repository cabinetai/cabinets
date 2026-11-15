#!/usr/bin/env node
// Every reading of a person's Slack goes through here. The run has no Slack token on purpose:
// Cabinet serves Slack to agents only through its own read tools, which keep to the channels
// the person allowed. So the agent asks the tools and hands each answer to this helper as it
// came (`save`). Every number on the page is counted from those saved answers, and every
// name, quote, time and link is copied from them, never typed. The agent only picks (by ref)
// and writes its own words.
// Run it from the cabinet root:
//   node catch-up/slack-sort.mjs window            shell lines to eval: NOW TODAY SINCE AFTER TZ_NAME
//   node catch-up/slack-sort.mjs start             the first reading: new data/reading.json, data/.work/,
//                                                  reads the last 7 days; prints the searches to run
//   node catch-up/slack-sort.mjs start --morning   a morning: data/.work/ only, reads since the last
//                                                  morning (at most 7 days)
//   node catch-up/slack-sort.mjs start --chat      a question in the chat: like a morning, never while one runs,
//                                                  and it writes nothing the page shows
//   node catch-up/slack-sort.mjs take              keep every Slack tool answer of this run, read from the
//                                                  run's own transcript exactly as Slack gave it; says what is missing
//   node catch-up/slack-sort.mjs save <name> @<file> [--in <channel id>]
//   node catch-up/slack-sort.mjs save <name> - [--in <channel id>]   (the answer on stdin, from a heredoc)
//                                                  keep one Slack tool answer, exactly as it came
//   node catch-up/slack-sort.mjs people            the people to look up with slack_get_user
//   node catch-up/slack-sort.mjs list [ref]        the conversations, then their messages, with refs
//                                                  (c1 a direct or group message, h1 a channel, m1 a message)
//   node catch-up/slack-sort.mjs needs             messages that may need an answer from you, oldest first
//   node catch-up/slack-sort.mjs asked             your own questions that nobody answered after (for nudges)
//   node catch-up/slack-sort.mjs mine              your own messages that sound like a promise
//   node catch-up/slack-sort.mjs loud              the conversations by how much they moved
//   node catch-up/slack-sort.mjs push '<line>'     add one line to the reading (single quotes)
//   node catch-up/slack-sort.mjs gift @<file>      the one thing for the person, shown while you read
//   node catch-up/slack-sort.mjs profile @<file>   write data/profile.json ("This is you")
//   node catch-up/slack-sort.mjs latest @<file>    write data/latest.json and data/status.json
//   node catch-up/slack-sort.mjs fail '<why>'      Slack could not be read: data/status.json with ok:false, then done
//   node catch-up/slack-sort.mjs done              finish, delete data/.work/
// Save names: a name starting with "mine" is a from:me search. Others: dms, groups, mentions,
// threads, everything (and -2, -3 for more pages), in-<channel>, thread-<n> and channel-<n>
// (a slack_read_thread or slack_read_channel answer: give --in <channel id>), channels
// (slack_list_channels), dm-list (slack_list_dms), people (slack_get_user answers, one or a
// JSON array of several).
// Placeholders in a line or the headline (the helper counts; the word after | follows the number):
//   {messages:|message|messages}   messages in the window          {dms:|conversation|conversations}
//   {channels:|channel|channels}   channels that moved              direct and group messages that moved
//   {mentions:|time|times}         @mentions of you                 {waiting:|person|people} who may wait for you
//   {in:c3|message|messages}       in one place
// A line may hold no other digit than these and a clock time. A **bold** name must be written
// in a saved answer.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const SCHEMA = "slack/catch-up";
const SAFE_LINK = /^https:\/\/[a-z0-9-]+\.slack\.com\//;
const GIFT_KINDS = ["waiting", "promise", "noise", "calm"];
const NAME = /^(mine|dms|groups|mentions|threads|everything|in-[a-z0-9_-]{1,40}|thread|channel|channels|dm-list|people|person|files)(-\d{1,3})?$/i;
/** The searches a reading must have before it writes the page; their next pages too while Slack has more (up to page 3). */
const NEEDED = ["mine", "dms", "groups", "mentions", "threads"];

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const readingFile = path.join(dataDir, "reading.json");
const refsFile = path.join(workDir, ".refs.json");
const savedList = path.join(workDir, ".saved.json");
const placesFile = path.join(workDir, ".in.json");
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
/** Slack's after: leaves its own day out, so the search starts the day before the window. */
const afterDay = (d) => ymd(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));

/** Stops the run with a code the agent reads. The command chain catches this. */
class Exit extends Error {}
function fail(msg, code) { console.error("slack-sort: " + msg); process.exitCode = code || 1; throw new Exit(msg); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function writeJson(file, value) {
  const tmp = file + ".part";
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}
function cleanName(name) {
  const n = String(name || "").trim().replace(/\.json$/i, "").replace(/^.*data[\\/]\.work[\\/]/, "");
  if (!NAME.test(n)) fail(`"${name}" is not a save name: use mine, dms, groups, mentions, threads, everything, in-<channel>, thread-1, channel-1, channels, dm-list or people (add -2 for a second page)`);
  return n.toLowerCase();
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
function answerOf(name) { return readJson(path.join(workDir, name + ".json")); }
function placesOf() { try { return readJson(placesFile); } catch { return {}; } }
let savedTextCache = null;
function savedText() {
  if (savedTextCache === null) savedTextCache = savedNames().map((n) => { try { return fs.readFileSync(path.join(workDir, n + ".json"), "utf8"); } catch { return ""; } }).join("\n");
  return savedTextCache;
}
/** Written in a saved answer, as Slack wrote it (JSON escapes included). */
function inSaved(v) {
  const t = savedText();
  const s = String(v).trim().replace(/^[#@]/, "");
  return !!s && (t.includes(s) || t.includes(JSON.stringify(s).slice(1, -1)) || t.toLowerCase().includes(s.toLowerCase()));
}
/** The text of one answer as the agent got it: the tool's JSON, or Claude's [{type:"text",text}] around it. */
function parseAnswer(raw) {
  let v;
  try { v = JSON.parse(String(raw).replace(/^﻿/, "").trim()); } catch { return fail("that is not JSON: copy the tool's answer exactly as it came, nothing before or after it"); }
  if (Array.isArray(v) && v.length && v.every((x) => x && x.type === "text" && typeof x.text === "string")) {
    try { v = v.length === 1 ? JSON.parse(v[0].text) : v.map((x) => JSON.parse(x.text)); } catch { fail("the text inside that answer is not JSON"); }
  }
  return v;
}
const isMsg = (m) => m && typeof m === "object" && typeof m.ts === "string" && /^\d{9,11}\.\d{1,6}$/.test(m.ts) && typeof m.text === "string";
const isUser = (u) => u && typeof u === "object" && typeof u.id === "string" && /^[UWB][A-Z0-9]{4,}$/.test(u.id) && (typeof u.name === "string" || typeof u.real_name === "string");
/** What kind of answer a name holds, checked against what is in it. */
function checkAnswer(n, v, inChannel) {
  const base = n.replace(/-\d+$/, "");
  if (base === "people" || base === "person") {
    const users = Array.isArray(v) ? v : [v];
    if (!users.length || !users.every(isUser)) fail("people holds slack_get_user answers: {id, name, real_name, ...}, one or a JSON array of them");
    return { users: users.length };
  }
  if (base === "channels") {
    if (!v || !Array.isArray(v.channels)) fail("channels holds the slack_list_channels answer: {channels:[...]}");
    return { channels: v.channels.length };
  }
  if (base === "files") {
    if (!v || !Array.isArray(v.files)) fail("files holds the slack_list_files answer: {files:[...]}");
    return { files: v.files.length };
  }
  if (base === "dm-list") {
    if (!v || !Array.isArray(v.conversations)) fail("dm-list holds the slack_list_dms answer: {conversations:[...]}");
    return { conversations: v.conversations.length };
  }
  if (!v || typeof v !== "object" || !Array.isArray(v.messages)) fail(`${n} holds a slack_search_messages, slack_read_thread or slack_read_channel answer: {messages:[...]}`);
  const bad = v.messages.filter((m) => !isMsg(m));
  if (bad.length) fail(`${bad.length} of the messages in ${n} have no ts or text as Slack gives them: copy the answer exactly`);
  const read = base === "thread" || base === "channel";
  if (read && !/^[CDG][A-Z0-9]{4,}$/.test(inChannel || "")) fail(`${n} is a read of one conversation: add --in <its channel id>, like --in C0123ABCD`);
  if (!read && v.messages.some((m) => !m.channel || typeof m.channel.id !== "string")) fail(`the messages of a search carry their channel: ${n} looks like a read, name it thread-1 or channel-1 with --in`);
  if (base === "mine") {
    const users = new Set(v.messages.map((m) => m.user).filter(Boolean));
    if (users.size > 1) fail("a mine answer is a from:me search: every message in it is yours, but this has several people");
  }
  return { messages: v.messages.length, more: v.more === true || v.has_more === true };
}
function saveAnswer(name, raw, inChannel) {
  const n = cleanName(name);
  const v = parseAnswer(raw);
  const info = checkAnswer(n, v, inChannel);
  fs.mkdirSync(workDir, { recursive: true });
  fs.writeFileSync(path.join(workDir, n + ".json"), JSON.stringify(v));
  const names = savedNames();
  if (!names.includes(n)) writeJson(savedList, [...names, n]);
  if (inChannel) writeJson(placesFile, { ...placesOf(), [n]: inChannel });
  savedTextCache = null; modelCache = null;
  return info;
}

// ── take: every Slack answer of this run, read from the run's own transcript ──
// Retyping a long answer is slow and invites cutting it short. Claude Code keeps every tool
// answer of the run in its session file; the helper reads them from there, exactly as Slack
// gave them, and names each one by what was asked.
function transcriptFile() {
  const sid = String(process.env.CLAUDE_CODE_SESSION_ID || "").trim();
  if (!/^[0-9a-f-]{8,}$/i.test(sid)) return "";
  const roots = [process.env.CLAUDE_CONFIG_DIR, path.join(os.homedir(), ".claude")].filter(Boolean);
  for (const root of roots) {
    const dir = path.join(root, "projects");
    let subs = [];
    try { subs = fs.readdirSync(dir); } catch { continue; }
    for (const d of subs) {
      const f = path.join(dir, d, sid + ".jsonl");
      if (fs.existsSync(f)) return f;
    }
  }
  return "";
}
/** What a Slack tool call was, as a save name, from its tool and query. */
function nameFor(tool, input) {
  const t = tool.replace(/^.*__/, "");
  const q = String(input.query || "");
  const page = Number(input.page) > 1 ? Number(input.page) : 1;
  const paged = (n) => (page > 1 ? n + "-" + page : n);
  if (t === "slack_search_messages") {
    if (/(^|\s)from:me\b/.test(q)) return paged("mine");
    if (/<@[UW][A-Z0-9]+>/.test(q)) return paged("mentions");
    if (/\bis:dm\b/.test(q)) return paged("dms");
    if (/\bis:mpim\b/.test(q)) return paged("groups");
    if (/\bis:thread\b/.test(q)) return paged("threads");
    const inCh = /\bin:#?([a-z0-9_-]{1,40})/i.exec(q);
    if (inCh) return paged("in-" + inCh[1].toLowerCase());
    return paged("everything");
  }
  if (t === "slack_get_user") return "person";
  if (t === "slack_read_thread") return "thread";
  if (t === "slack_read_channel") return "channel";
  if (t === "slack_list_channels") return "channels";
  if (t === "slack_list_dms") return "dm-list";
  if (t === "slack_list_files" && !(input || {}).channel_id) return "files";
  return "";
}
function take() {
  const file = transcriptFile();
  if (!file) return fail("this run's answers can't be read here: hand each answer over with save <name> - and the answer on stdin", 6);
  const startedAt = new Date(mode().startedAt || 0).getTime() - 5000;
  const uses = new Map();
  const answers = [];
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    const at = new Date(o.timestamp || 0).getTime();
    const content = o.message && Array.isArray(o.message.content) ? o.message.content : [];
    for (const b of content) {
      if (b && b.type === "tool_use" && /slack_/.test(String(b.name))) uses.set(b.id, b);
      if (b && b.type === "tool_result" && uses.has(b.tool_use_id) && at >= startedAt) {
        const text = Array.isArray(b.content) ? b.content.filter((x) => x && x.type === "text").map((x) => x.text).join("") : String(b.content || "");
        answers.push({ id: b.tool_use_id, use: uses.get(b.tool_use_id), text, error: b.is_error === true });
      }
    }
  }
  let taken = {};
  try { taken = readJson(path.join(workDir, ".taken.json")); } catch { /* none yet */ }
  const out = [];
  for (const a of answers) {
    if (taken[a.id]) continue;
    const base = nameFor(a.use.name, a.use.input || {});
    if (!base) { taken[a.id] = "-"; continue; }
    let v;
    try { v = JSON.parse(a.text); } catch { v = null; }
    if (a.error || !v || typeof v !== "object") {
      taken[a.id] = "refused:" + base;
      out.push(`${base}: Slack did not answer it: "${a.text.replace(/\s+/g, " ").slice(0, 200)}"`);
      continue;
    }
    // A name already saved gets the next number (a second person, a second thread).
    let n = base;
    const names = savedNames();
    if (/^(person|thread|channel)$/.test(base) || names.includes(n)) {
      let i = /^(person|thread|channel)$/.test(base) ? 1 : 2;
      const stem = base.replace(/-\d+$/, "");
      while (names.includes(stem + "-" + i)) i++;
      n = stem + "-" + i;
    }
    const ch = /^(thread|channel)/.test(n) ? String((a.use.input || {}).channel_id || "") : "";
    try {
      const info = saveAnswer(n, a.text, ch);
      taken[a.id] = n;
      out.push(`${n}: ${describe(n, info)}`);
    } catch (e) {
      if (!(e instanceof Exit)) throw e;
      process.exitCode = 0;
      taken[a.id] = "bad";
      out.push(`${n}: not kept (${e.message})`);
    }
  }
  writeJson(path.join(workDir, ".taken.json"), taken);
  return out;
}
function describe(n, info) {
  const stem = n.replace(/-\d+$/, "");
  const page = Number((/-(\d+)$/.exec(n) || [])[1] || 1);
  if (info.messages !== undefined) return `${info.messages} messages` + (info.more ? `; Slack has more: ask page ${page + 1} of the same search${NEEDED.includes(stem) && page < 3 ? " (needed)" : ""}` : "");
  if (info.users !== undefined) return `${info.users} ${info.users === 1 ? "person" : "people"}`;
  if (info.channels !== undefined) return `${info.channels} channels`;
  if (info.files !== undefined) return `${info.files} files`;
  return `${info.conversations} conversations`;
}
/** What is still missing before the page can be written: a search, a next page, a name. */
function missing() {
  const names = savedNames();
  const out = [];
  for (const n of NEEDED) if (!names.includes(n)) out.push(`the ${n} search`);
  if (!names.some((n) => /^(everything|in-)/.test(n))) out.push("the everything search (or in:#channel searches)");
  // The files list: kept, or Slack refused it (then the page has no Files box, and that is fine).
  let tried = {};
  try { tried = readJson(path.join(workDir, ".taken.json")); } catch { /* none */ }
  if (!names.includes("files") && !Object.values(tried).includes("refused:files")) out.push("the files list (slack_list_files, no channel_id, count 50)");
  for (const n of names) {
    const stem = n.replace(/-\d+$/, "");
    const page = /^(mine|dms|groups|mentions|threads)$/.test(stem) ? Number((/-(\d+)$/.exec(n) || [])[1] || 1) : 0;
    if (!page || page >= 3) continue;
    let v;
    try { v = answerOf(n); } catch { continue; }
    if (v && v.more === true && !names.includes(stem + "-" + (page + 1))) out.push(`page ${page + 1} of ${stem}`);
  }
  if (!out.length) {
    const md = model();
    const unnamed = [...new Set(needs().map((x) => x.m.fromId).concat(md.convs.filter((c) => c.kind === "dm").map((c) => c.peer),
      askedCandidates().map((x) => x.whoId), topPeople().map((x) => x.id), fileList().slice(0, 12).map((f) => f.user),
      md.msgs.filter((m) => md.inLook(m) && !m.mine && !m.bot && /https?:\/\//.test(m.raw)).map((m) => m.fromId)))]
      .filter((id) => /^[UW]/.test(id) && !md.people[id]).slice(0, 20);
    if (unnamed.length) out.push(`names: slack_get_user for ${unnamed.join(" ")}`);
  }
  return out;
}
function mustBeComplete(what) {
  const m = missing();
  if (m.length) fail(`refused, ${what} needs ${m.join(", ")} first. Then run take`);
}

// ── The model: conversations and messages, from the saved answers only ──
const ESC = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
/** Slack's markup as plain words: <@U1> as @Name, <#C1|name> as #name, links as their words. */
function plain(textIn, nameOf) {
  return String(textIn || "")
    .replace(/<@([UW][A-Z0-9]+)(?:\|([^>]+))?>/g, (_, id, label) => "@" + (nameOf(id) || label || "someone"))
    .replace(/<#([CG][A-Z0-9]+)(?:\|([^>]*))?>/g, (_, id, label) => "#" + (label || "a channel"))
    .replace(/<!subteam\^[A-Z0-9]+(?:\|([^>]+))?>/g, (_, label) => label || "@a group")
    .replace(/<!(here|channel|everyone)(?:\|[^>]*)?>/g, "@$1")
    .replace(/<!date\^\d+\^[^|>]*\|([^>]+)>/g, "$1")
    .replace(/<(https?:\/\/[^|>]+)\|([^>]+)>/g, "$2")
    .replace(/<(https?:\/\/[^>]+)>/g, "$1")
    .replace(/<mailto:[^|>]+\|([^>]+)>/g, "$1")
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, e) => ESC[e])
    .replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}
const oneLine = (s) => s.replace(/\s+/g, " ").trim();
let modelCache = null;
function model() {
  if (modelCache) return modelCache;
  const names = savedNames();
  const places = placesOf();
  // The people Slack named, from slack_get_user answers.
  const people = {};
  for (const n of names.filter((x) => /^(people|person)(-\d+)?$/.test(x))) {
    const v = answerOf(n);
    for (const u of Array.isArray(v) ? v : [v]) if (isUser(u)) people[u.id] = { name: String(u.real_name || u.name || "").trim() || String(u.name || ""), tz: u.tz || "", bot: u.is_bot === true };
  }
  // Who you are: the one person in your from:me searches.
  const mineIds = {};
  for (const n of names.filter((x) => /^mine(-\d+)?$/.test(x))) for (const m of answerOf(n).messages) if (m.user) mineIds[m.user] = (mineIds[m.user] || 0) + 1;
  const meId = Object.keys(mineIds).sort((a, b) => mineIds[b] - mineIds[a])[0] || "";
  if (!meId) fail("save a from:me search as mine first: the helper needs your own id (search from:me alone, count 1, when you wrote nothing in the window)");
  // Handles Slack showed beside a user id, for people nobody looked up.
  const handles = {};
  const channelNames = {};
  for (const n of names) {
    const v = answerOf(n);
    if (v && Array.isArray(v.messages)) for (const m of v.messages) { if (m.user && m.username) handles[m.user] = m.username; }
    if (v && Array.isArray(v.channels)) for (const c of v.channels) if (c && c.id) channelNames[c.id] = c.name || "";
  }
  const nameOf = (id) => (people[id] && people[id].name) || handles[id] || "";
  const me = { id: meId, name: nameOf(meId), first: String(nameOf(meId)).split(/[\s.]/)[0] || "" };
  let host = "";
  for (const n of names) {
    const hit = /https:\/\/([a-z0-9-]+\.slack\.com)\/archives\//.exec(fs.readFileSync(path.join(workDir, n + ".json"), "utf8"));
    if (hit) { host = hit[1]; break; }
  }
  const r = refs();
  const convs = new Map();
  const msgs = new Map();
  const dmPeer = {};
  for (const n of names.filter((x) => /^dm-list(-\d+)?$/.test(x))) for (const c of answerOf(n).conversations) if (c && c.id && c.user) dmPeer[c.id] = c.user;
  const conv = (id, chName) => {
    if (!convs.has(id)) {
      const kind = /^D/.test(id) || /^[UW][A-Z0-9]+$/.test(chName || "") ? "dm" : /^mpdm-/.test(chName || "") ? "group" : "channel";
      convs.set(id, { key: id, kind, raw: chName || channelNames[id] || "", ref: r.conv[id], peer: kind === "dm" ? (/^[UW][A-Z0-9]+$/.test(chName || "") ? chName : dmPeer[id] || "") : "" });
    }
    const c = convs.get(id);
    if (!c.raw && chName) c.raw = chName;
    return c;
  };
  for (const n of names) {
    const v = answerOf(n);
    if (!v || !Array.isArray(v.messages)) continue;
    for (const m of v.messages) {
      const chId = (m.channel && m.channel.id) || places[n];
      if (!chId || !isMsg(m)) continue;
      const c = conv(chId, m.channel && m.channel.name);
      const key = chId + "-" + m.ts;
      if (msgs.has(key)) { const old = msgs.get(key); if (!old.link && m.permalink) old.link = SAFE_LINK.test(m.permalink) ? m.permalink : ""; continue; }
      const link = typeof m.permalink === "string" && SAFE_LINK.test(m.permalink) ? m.permalink : "";
      const tt = (/[?&]thread_ts=(\d+\.\d+)/.exec(link) || [])[1] || (typeof m.thread_ts === "string" ? m.thread_ts : "");
      const bot = m.bot === true || (!m.user && !!m.username) || !!(people[m.user] && people[m.user].bot);
      msgs.set(key, {
        id: key, conv: c, ts: m.ts, at: new Date(Number(m.ts) * 1000), raw: m.text, fromId: m.user || "", handle: m.username || "",
        bot, system: !m.user && !m.username, mine: m.user === meId,
        mentionsMe: m.text.includes("<@" + meId + ">") || m.text.includes("<@" + meId + "|"),
        mentionsAll: /<!(here|channel|everyone)/.test(m.text),
        root: tt || m.ts, replies: Number(m.reply_count) || 0, link
      });
    }
  }
  const all = [...msgs.values()];
  for (const m of all) {
    m.text = plain(m.raw, nameOf);
    m.fromName = nameOf(m.fromId) || m.handle || "";
    m.inThread = m.root !== m.ts;
  }
  // Names: a direct message is the other person, a group the people in it, a channel its #name.
  for (const c of convs.values()) {
    const others = [...new Set(all.filter((m) => m.conv === c && !m.mine && !m.bot && m.fromName).map((m) => m.fromName))];
    if (c.kind === "dm") c.name = nameOf(c.peer) || others[0] || "A direct message";
    else if (c.kind === "group") {
      const hs = c.raw.replace(/^mpdm-/, "").replace(/-\d+$/, "").split("--").filter((h) => h && h !== handles[meId]);
      c.name = (others.length ? others : hs).slice(0, 3).join(", ") || "A group message";
    } else c.name = "#" + (c.raw || channelNames[c.key] || "a-channel");
    c.link = host ? `https://${host}/archives/${c.key}` : "";
  }
  for (const m of all) if (!m.link && host) m.link = `https://${host}/archives/${m.conv.key}/p${m.ts.replace(".", "")}` + (m.inThread ? `?thread_ts=${m.root}&cid=${m.conv.key}` : "");
  // Refs, kept the same for the whole run.
  for (const c of convs.values()) if (!c.ref) { const k = c.kind === "channel" ? "h" : "c"; c.ref = k + ++r.n[k]; r.conv[c.key] = c.ref; }
  all.sort((a, b) => a.at - b.at);
  for (const m of all) { if (!r.msg[m.id]) r.msg[m.id] = "m" + ++r.n.m; m.ref = r.msg[m.id]; }
  writeJson(refsFile, r);
  const from = since();
  const back = new Date(mode().lookback || mode().since);
  const inWindow = (m) => !m.system && m.at >= from;
  const inLook = (m) => !m.system && m.at >= back;
  const weekFrom = new Date(mode().week || mode().lookback || mode().since);
  const inWeek = (m) => !m.system && m.at >= weekFrom;
  modelCache = { me, people, nameOf, convs: [...convs.values()], msgs: all, inWindow, inLook, inWeek, weekFrom, back, from, host };
  return modelCache;
}
function refs() {
  try { return readJson(refsFile); } catch { return { n: { c: 0, h: 0, m: 0 }, conv: {}, msg: {} }; }
}
function convFor(ref) { return model().convs.find((c) => c.ref === ref) || null; }
function msgFor(ref) { const md = model(); return md.msgs.find((m) => m.ref === ref || m.id === ref) || null; }
/** What you wrote after this message where it counts as an answer: the same thread, or the same direct message. */
function laterMine(m) {
  return model().msgs.filter((x) => x.mine && x.conv === m.conv && x.at > m.at && (m.conv.kind !== "channel" || x.root === m.root));
}
/** Answered: you wrote after it, and not only "I'll do it tomorrow" (that still waits on you). */
function answered(m) {
  return laterMine(m).some((x) => !PROMISE.test(x.text));
}
/** Your "I'll…" after it, when that is all you wrote: the ask is still open, with your own day. */
function deferral(m) {
  const later = laterMine(m);
  return later.length && later.every((x) => PROMISE.test(x.text)) ? later[0] : null;
}
/** Threads you wrote in: a reply there that asks something waits on you. */
function myThreads() {
  const md = model();
  return new Set(md.msgs.filter((m) => m.mine).map((m) => m.conv.key + "|" + m.root));
}
/**
 * Messages that may need an answer from you, one entry per place and person, oldest first.
 * Every ask of that person there is kept in `all`: the second one may matter more.
 */
function needs() {
  const md = model();
  const mineIn = myThreads();
  const seen = new Map();
  for (const m of md.msgs) {
    if (!md.inLook(m) || m.mine || m.bot || answered(m)) continue;
    const asked = /\?\s*$|\?\s/.test(m.text);
    const meByName = md.me.first.length > 1 && new RegExp("(^|[^\\p{L}])" + md.me.first.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&") + "([^\\p{L}]|$)", "iu").test(m.text);
    const inMine = m.conv.kind === "channel" && mineIn.has(m.conv.key + "|" + m.root);
    // A question to a whole channel is not yours until it names you or comes in your thread.
    const why = m.mentionsMe ? "@you" : m.conv.kind === "dm" ? "direct" : m.conv.kind === "group" && asked ? "group" : inMine && asked ? "your thread" : meByName && asked ? "asked you by name" : "";
    if (!why) continue;
    const key = m.conv.key + "|" + (m.conv.kind === "channel" ? m.root : "") + "|" + m.fromId;
    if (seen.has(key)) { const s = seen.get(key); s.more++; s.all.push(m); continue; }
    seen.set(key, { m, why, more: 0, all: [m], deferred: deferral(m) });
  }
  return [...seen.values()].sort((a, b) => a.m.at - b.m.at);
}
/** The entry of needs that holds this message, as its first ask or a later one. */
function needOf(m) { return needs().find((x) => x.all.includes(m)) || null; }
const PROMISE = /\b(i'?ll|i will|i'?m going to|i am going to|let me|will (send|share|check|look|get|do|update|follow)|i can (send|share|check|do|get)|by (monday|tuesday|wednesday|thursday|friday|tomorrow|tonight|end of (the )?(day|week)|eod|eow)|later today|tomorrow|next week)\b/i;
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
/** The day a message names ("today", "tomorrow", "Friday", "Oct 21"), counted from when it was written. */
function dueHint(m) {
  const t = m.text.toLowerCase(), at = m.at;
  const day = (d) => ymd(d);
  const mon = "(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?";
  const md1 = new RegExp("\\b" + mon + " (\\d{1,2})(?:st|nd|rd|th)?\\b").exec(t) || null;
  const md2 = md1 ? null : new RegExp("\\b(\\d{1,2})(?:st|nd|rd|th)? (?:of )?" + mon + "\\b").exec(t);
  if (md1 || md2) {
    const month = MONTHS.indexOf((md1 ? md1[1] : md2[2]).slice(0, 3)), date = Number(md1 ? md1[2] : md2[1]);
    if (date >= 1 && date <= 31) {
      let d = new Date(at.getFullYear(), month, date);
      if (d < new Date(at.getFullYear(), at.getMonth(), at.getDate())) d = new Date(at.getFullYear() + 1, month, date);
      return day(d);
    }
  }
  if (/\b(today|tonight|eod|end of (the )?day|later today|this (morning|afternoon|evening))\b/.test(t)) return day(at);
  if (/\btomorrow\b/.test(t)) return day(new Date(at.getFullYear(), at.getMonth(), at.getDate() + 1));
  const wd = new RegExp("\\b(by |on |this |next )?(" + WEEKDAYS.join("|") + ")\\b").exec(t);
  if (wd) {
    let ahead = (WEEKDAYS.indexOf(wd[2]) - at.getDay() + 7) % 7 || 7;
    if (wd[1] === "next ") ahead += ahead < 7 ? 7 : 0;
    return day(new Date(at.getFullYear(), at.getMonth(), at.getDate() + ahead));
  }
  return "";
}
/** "Fine by me", "+1", "OK for me too": agreeing with what someone else proposed. */
const AGREE = /^\s*(ok(ay)?|fine|sure|yes|yep|agreed?|sounds good|works( for me)?|great|perfect|got it|same|\+1|:\+1:|:thumbsup:|👍)(?![a-z])[\s\S]{0,40}$/iu;
function mine() {
  const md = model();
  return md.msgs.filter((m) => md.inLook(m) && m.mine && PROMISE.test(m.text));
}
function countIn(c) { const md = model(); return md.msgs.filter((m) => m.conv === c && md.inWindow(m)).length; }
/** Someone else's name in a place: for a promise, who you told. */
function toWhom(m) {
  if (m.conv.kind === "dm") return m.conv.name;
  const md = model();
  const before = md.msgs.filter((y) => y.conv === m.conv && !y.mine && !y.bot && y.root === m.root && y.at <= m.at);
  const theirs = before.length ? before : md.msgs.filter((y) => y.conv === m.conv && !y.mine && !y.bot);
  return (theirs[theirs.length - 1] || {}).fromName || m.conv.name;
}

// ── Counting ──
function withWord(n, one, many) {
  const num = n.toLocaleString("en-US");
  return one ? `${num} ${n === 1 ? one : many || one}` : num;
}
function counted(kind, arg) {
  const md = model();
  const w = md.msgs.filter(md.inWindow);
  if (kind === "messages") return w.length;
  if (kind === "dms") return new Set(w.filter((m) => m.conv.kind !== "channel").map((m) => m.conv)).size;
  if (kind === "channels") return new Set(w.filter((m) => m.conv.kind === "channel").map((m) => m.conv)).size;
  if (kind === "mentions") return w.filter((m) => m.mentionsMe && !m.mine).length;
  if (kind === "waiting") return new Set(needs().map((x) => x.m.fromId)).size;
  if (kind === "in") { const c = convFor(arg); if (!c) fail(`no place ${arg}: give a ref from list, like c3`); return countIn(c); }
  return fail("unknown count " + kind);
}
/** Placeholders filled; then the words may hold no typed number and no name nobody wrote. */
function fill(textIn, where) {
  const made = [];
  const out = String(textIn).replace(/\{(messages|dms|channels|mentions|waiting|in):([^}]*)\}/g, (_, kind, spec) => {
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
    for (const piece of inner.split(/,\s*|\s+and\s+/).map((s) => s.trim()).filter(Boolean)) {
      if (!inSaved(piece)) fail(`refused, "${piece}" is not written in any saved answer: copy names as Slack wrote them`);
    }
  }
  return out;
}
/** A number standing alone, not part of a name like Q4, v2 or #team-2, nor a clock time. */
function typedNumber(s) {
  return /\d/.test(String(s).replace(/\b\d{1,2}:\d{2}\b/g, "").replace(/#[\w-]+/g, "").replace(/\b[A-Za-z]+\d+[A-Za-z0-9]*\b/g, ""));
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
function where(m) {
  const c = m.conv || m;
  const out = { kind: c.kind, name: String(c.name).slice(0, 90) };
  if (m.conv && m.inThread) out.thread = true;
  return out;
}
function linkOf(m) { return m.link || m.conv.link || ""; }
function said(m) { return oneLine(m.text).slice(0, 240); }
/** Where to answer, so a reply can be proposed in the right place: the channel id, and the thread. */
function replyTo(m) {
  const o = { channel: m.conv.key };
  if (m.inThread || (m.conv.kind === "channel")) o.thread = m.root;
  return o;
}

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
      if (!needOf(m)) fail("refused, that message is not in needs (answered, or not to you): pick from needs");
      out.who = m.fromName.slice(0, 80);
      out.replyTo = replyTo(m);
    } else {
      if (!m.mine) fail("refused, a promise gift is a message you wrote: pick from mine");
      if (!PROMISE.test(m.text)) fail("refused, that message does not sound like a promise: pick from mine");
      if (Date.now() - m.at.getTime() < 12 * HOUR) fail("refused, that promise is from the last few hours: it is not late yet");
      out.who = toWhom(m).slice(0, 80);
    }
    out.where = where(m);
    out.said = said(m);
    out.since = iso(m.at);
    const l = linkOf(m);
    if (l) out.link = l;
    out.messageId = m.ref;
  }
  if (kind === "noise") {
    const c = convFor(g.conv);
    if (!c) fail(`refused, no place ${g.conv || "(give conv: its ref from loud, like h3)"}`);
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

// ── The extras Slack does not show: your week, files, links, and what you asked that nobody answered ──
const median = (xs) => { const a = xs.slice().sort((p, q) => p - q); const n = a.length; return n ? (n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2) : 0; };
/** A message to you: a DM or group DM, an @mention, or a reply in a thread you wrote in. */
function toMe(m, mineIn) {
  if (m.mine || m.bot || m.system) return false;
  return m.conv.kind !== "channel" || m.mentionsMe || mineIn.has(m.conv.key + "|" + m.root);
}
/** The people you talk with most this week: their messages to you and yours to them. */
function topPeople() {
  const md = model();
  const mineIn = myThreads();
  const score = {};
  const add = (id) => { if (id && /^[UW]/.test(id) && id !== md.me.id && !(md.people[id] && md.people[id].bot)) score[id] = (score[id] || 0) + 1; };
  for (const m of md.msgs) {
    if (!md.inWeek(m)) continue;
    if (toMe(m, mineIn)) add(m.fromId);
    else if (m.mine) {
      if (m.conv.kind === "dm") add(m.conv.peer);
      for (const hit of m.raw.matchAll(/<@([UW][A-Z0-9]+)/g)) add(hit[1]);
    }
  }
  // One message is not a habit: someone you talk with has at least two this week.
  return Object.keys(score).map((id) => ({ id, count: score[id] })).filter((x) => x.count >= 2).sort((a, b) => b.count - a.count).slice(0, 5);
}
function weekOf() {
  const md = model();
  const mineIn = myThreads();
  const w = md.msgs.filter(md.inWeek);
  const own = w.filter((m) => m.mine);
  const out = {
    since: iso(md.weekFrom), days: Math.max(1, Math.round((Date.now() - md.weekFrom.getTime()) / DAY)),
    toYou: w.filter((m) => toMe(m, mineIn)).length, mine: own.length, mentions: w.filter((m) => m.mentionsMe && !m.mine && !m.bot).length
  };
  out.people = topPeople().map((x) => ({ name: (md.nameOf(x.id) || "Someone").slice(0, 60), count: x.count }));
  // The hours you write in, on this clock.
  const hours = Array.from({ length: 24 }, () => 0);
  for (const m of own) hours[m.at.getHours()]++;
  if (own.length >= 5) { out.hours = hours; out.busiestHour = hours.indexOf(Math.max(...hours)); }
  // How long until you answer: a message that asked you something, then your next message there.
  const replies = new Map();
  for (const m of w) {
    if (!toMe(m, mineIn)) continue;
    const asked = m.mentionsMe || /\?\s*$|\?\s/.test(m.text);
    if (!asked) continue;
    const mineAfter = md.msgs.find((x) => x.mine && x.conv === m.conv && x.at > m.at && (m.conv.kind !== "channel" || x.root === m.root));
    if (!mineAfter || mineAfter.at - m.at > 3 * DAY) continue;
    // Several asks answered by one message count once, from the first of them.
    const prev = replies.get(mineAfter.id);
    if (!prev || m.at < prev.m.at) replies.set(mineAfter.id, { m, mins: Math.max(1, Math.round((mineAfter.at - m.at) / 60000)) });
  }
  const gaps = [...replies.values()];
  if (gaps.length >= 3) {
    out.answer = { minutes: Math.round(median(gaps.map((g) => g.mins))), samples: gaps.length };
    const by = {};
    for (const g of gaps) if (g.m.fromName) (by[g.m.fromName] = by[g.m.fromName] || []).push(g.mins);
    const per = Object.keys(by).filter((n) => by[n].length >= 2).map((n) => ({ name: n.slice(0, 60), minutes: Math.round(median(by[n])) })).sort((a, b) => a.minutes - b.minutes);
    if (per.length >= 2 && per[per.length - 1].minutes >= 2 * per[0].minutes) { out.answer.fastest = per[0]; out.answer.slowest = per[per.length - 1]; }
  }
  out.places = md.convs.filter((c) => c.kind === "channel").map((c) => ({ c, n: md.msgs.filter((m) => m.conv === c && md.inWeek(m)).length }))
    .filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 3)
    .map((x) => ({ name: String(x.c.name).slice(0, 60), count: x.n, ...(x.c.link ? { link: x.c.link } : {}) }));
  return out;
}
const KINDS = { pdf: "pdf", png: "image", jpg: "image", jpeg: "image", gif: "image", heic: "image", webp: "image", svg: "image",
  mp4: "video", mov: "video", webm: "video", m4v: "video",
  docx: "doc", doc: "doc", gdoc: "doc", xlsx: "doc", xls: "doc", gsheet: "doc", pptx: "doc", ppt: "doc", gpres: "doc", key: "doc", numbers: "doc", pages: "doc", txt: "doc", text: "doc", md: "doc", markdown: "doc", csv: "doc", rtf: "doc" };
/** The files Slack listed, newest first, without the person's own. Never their bytes. */
function fileList() {
  const md = model();
  if (!savedNames().includes("files")) return [];
  return answerOf("files").files.filter((f) => f && typeof f.id === "string" && f.user !== md.me.id)
    .sort((a, b) => (Number(b.created) || 0) - (Number(a.created) || 0));
}
function filesOf() {
  const md = model();
  return fileList().slice(0, 50).map((f) => {
    const type = String(f.filetype || "").toLowerCase();
    const o = { id: f.id, name: String(f.title || f.name || "A file").slice(0, 120), type: type.slice(0, 12), kind: KINDS[type] || "other" };
    if (Number(f.size) > 0) o.size = Math.round(Number(f.size));
    if (f.user) o.who = (md.nameOf(f.user) || "").slice(0, 60);
    if (Number(f.created) > 0) o.at = iso(new Date(Number(f.created) * 1000));
    if (typeof f.permalink === "string" && SAFE_LINK.test(f.permalink)) o.link = f.permalink;
    return o;
  });
}
/** A friendly name for where a link goes. */
function siteOf(u) {
  const h = u.hostname.replace(/^www\./, "").toLowerCase();
  if (h === "docs.google.com") return /^\/spreadsheets/.test(u.pathname) ? "Google Sheets" : /^\/presentation/.test(u.pathname) ? "Google Slides" : /^\/forms/.test(u.pathname) ? "Google Forms" : "Google Docs";
  const known = { "drive.google.com": "Google Drive", "figma.com": "Figma", "github.com": "GitHub", "notion.so": "Notion", "notion.site": "Notion", "loom.com": "Loom",
    "linear.app": "Linear", "youtube.com": "YouTube", "youtu.be": "YouTube", "miro.com": "Miro", "dropbox.com": "Dropbox", "airtable.com": "Airtable", "trello.com": "Trello" };
  for (const k of Object.keys(known)) if (h === k || h.endsWith("." + k)) return known[k];
  return h;
}
/** Links other people shared lately, newest first, one each, never Slack's own. */
function linksOf() {
  const md = model();
  const seen = new Map();
  const msgs = md.msgs.filter((m) => md.inLook(m) && !m.mine && !m.bot).sort((a, b) => b.at - a.at);
  for (const m of msgs) {
    const found = [];
    const rest = m.raw.replace(/<(https?:\/\/[^|>\s]+)(?:\|([^>]*))?>/g, (_, url, label) => { found.push({ url, label }); return " "; });
    for (const hit of rest.matchAll(/https?:\/\/[^\s<>"]+/g)) found.push({ url: hit[0] });
    for (const f of found) {
      const url = f.url.replace(/[).,;:!?]+$/, "").replace(/&amp;/g, "&");
      let u;
      try { u = new URL(url); } catch { continue; }
      if (!/^https?:$/.test(u.protocol) || /(^|\.)slack\.com$/i.test(u.hostname) || /(^|\.)slack-edge\.com$/i.test(u.hostname)) continue;
      const host = u.hostname.replace(/^www\./, "");
      // A pull request and its "changes" or "files" page are one link.
      const gh = /github\.com$/i.test(host) ? /^\/([^/]+)\/([^/]+)\/(pull|issues)\/(\d+)/.exec(u.pathname) : null;
      const key = gh ? ("github.com/" + gh.slice(1).join("/")).toLowerCase() : (host + u.pathname.replace(/\/$/, "") + u.search).toLowerCase();
      if (seen.has(key)) continue;
      const label = f.label ? plain(f.label, md.nameOf).trim() : "";
      let pathWords = "";
      try { pathWords = decodeURIComponent(u.pathname).replace(/^\/+|\/+$/g, ""); } catch { pathWords = u.pathname.replace(/^\/+|\/+$/g, ""); }
      const named = label && label !== url && !/^https?:/.test(label) && label.replace(/^www\./, "") !== host + u.pathname.replace(/\/$/, "") && !label.startsWith(host + "/") ? label : "";
      const title = named || (gh ? `${gh[2]} ${gh[3] === "pull" ? "pull request" : "issue"} ${gh[4]}` : pathWords ? pathWords.slice(0, 90) : host);
      seen.set(key, { url: u.href.slice(0, 600), site: siteOf(u), title: title.slice(0, 120), who: m.fromName.slice(0, 60), where: where(m), at: iso(m.at), ...(m.link ? { link: m.link } : {}) });
    }
  }
  return [...seen.values()].slice(0, 30);
}
/** Your own questions to someone that nobody answered after: in a DM, a thread, or with an @mention. */
function askedCandidates() {
  const md = model();
  const out = [];
  for (const m of md.msgs) {
    if (!m.mine || !md.inLook(m) || Date.now() - m.at.getTime() < 2 * HOUR) continue;
    if (!/\?\s*$|\?\s/.test(m.text) || AGREE.test(m.text)) continue;
    let whoId = "", who = "";
    if (m.conv.kind === "dm") { whoId = m.conv.peer; who = m.conv.name; }
    else if (m.conv.kind === "group") who = m.conv.name;
    else {
      const tag = [...m.raw.matchAll(/<@([UW][A-Z0-9]+)/g)].map((h) => h[1]).find((id) => id !== md.me.id);
      const root = m.inThread ? md.msgs.find((x) => x.conv === m.conv && x.ts === m.root) : null;
      whoId = tag || (root && !root.mine && !root.bot ? root.fromId : "");
      who = whoId ? md.nameOf(whoId) : "";
    }
    if (!who) continue;
    const later = md.msgs.filter((x) => x.conv === m.conv && x.at > m.at && !x.mine && !x.bot && !x.system &&
      (m.conv.kind !== "channel" || x.root === m.root || (whoId && x.fromId === whoId)));
    // You wrote again there after it: you moved on, or asked again (that later one counts instead).
    const mineLater = md.msgs.some((x) => x.mine && x.conv === m.conv && x.at > m.at && (m.conv.kind !== "channel" || x.root === m.root));
    if (later.length || mineLater) continue;
    out.push({ m, whoId, who });
  }
  return out.sort((a, b) => a.m.at - b.m.at).slice(-8);
}

// ── latest.json: the agent gives refs and its own words; the facts come from the saved answers ──
function latestOf(l) {
  if (!l || typeof l !== "object" || Array.isArray(l)) fail("latest.json must be an object");
  if (typeof l.headline !== "string" || !l.headline.trim()) fail("latest.json needs a headline");
  const md = model();
  const headline = fill(l.headline, "the headline").slice(0, 220);
  const open = new Set(needs().flatMap((x) => x.all));
  const used = new Set();
  const pick = (arr, max, make) => (Array.isArray(arr) ? arr : []).map((x) => {
    const m = msgFor(x && x.id);
    if (!m || used.has(m)) return null;
    const out = make(m, x);
    if (out) used.add(m);
    return out;
  }).filter(Boolean).slice(0, max);
  const WHY = { "@you": "mention", direct: "direct", group: "question", "your thread": "thread", "asked you by name": "question" };
  const waiting = pick(l.waiting, 12, (m, x) => {
    if (m.mine || !open.has(m)) return null;
    const n = needOf(m);
    const o = { id: m.ref, who: m.fromName.slice(0, 80), where: where(m), said: said(m), gist: words(x.gist, 160, "a waiting gist"),
      why: WHY[n.why] || "question", at: iso(m.at), urgent: x.urgent === true,
      reply: typeof x.reply === "string" ? x.reply.trim().slice(0, 700) : "", replyTo: replyTo(m) };
    // The other asks of this person here, unless they have rows of their own (counted below).
    o.asks = n.all.filter((y) => y !== m).map((y) => y.ref);
    const d = deferral(m);
    if (d) {
      o.youSaid = { id: d.ref, said: said(d), at: iso(d.at) };
      const due = dueHint(d);
      if (due) o.youSaid.due = due;
      if (due && due <= ymd(new Date())) o.urgent = true;
    }
    if (linkOf(m)) o.link = linkOf(m);
    return o;
  });
  for (const w of waiting) {
    const more = w.asks.filter((ref) => !waiting.some((y) => y.id === ref)).length;
    delete w.asks;
    if (more) w.more = more;
  }
  // "I'll decide tomorrow" under a question shows on that question's row, not twice.
  const deferredIds = new Set(waiting.filter((w) => w.youSaid).map((w) => w.youSaid.id));
  const promises = pick((Array.isArray(l.promises) ? l.promises : []).filter((x) => !(x && deferredIds.has((msgFor(x.id) || {}).ref))), 10, (m, x) => {
    if (!m.mine || !PROMISE.test(m.text)) return null;
    const o = { id: m.ref, to: toWhom(m).slice(0, 80), where: where(m), said: said(m), gist: words(x.gist, 160, "a promise gist"), at: iso(m.at) };
    const due = typeof x.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.due) ? x.due : dueHint(m);
    if (due) o.due = due;
    if (linkOf(m)) o.link = linkOf(m);
    return o;
  });
  const decided = pick(l.decided, 8, (m, x) => {
    const gist = words(x.gist, 180, "a decided gist");
    if (!gist) return null;
    // A decision belongs to whoever made or proposed it, not to the last "fine by me".
    if (AGREE.test(m.text)) fail(`refused, ${m.ref} only agrees ("${m.text.slice(0, 40)}"): give the message that proposed or made the decision`);
    const after = md.msgs.filter((y) => y.conv === m.conv && y.at > m.at && !y.bot && y.fromId !== m.fromId && AGREE.test(y.text) && (m.conv.kind !== "channel" || y.root === m.root));
    const agreed = [...new Set(after.map((y) => (y.mine ? "You" : y.fromName.slice(0, 60))))];
    const o = { id: m.ref, who: m.mine ? "You" : m.fromName.slice(0, 80), where: where(m), gist, at: iso(m.at) };
    if (agreed.length) o.agreed = agreed.slice(0, 5);
    if (linkOf(m)) o.link = linkOf(m);
    return o;
  });
  // Every channel that moved, with what the agent said about it.
  const said2 = {};
  for (const ch of Array.isArray(l.channels) ? l.channels : []) if (ch && typeof ch.id === "string") said2[ch.id] = ch;
  const channels = md.convs.filter((c) => c.kind === "channel" && countIn(c) > 0).map((c) => {
    const a = said2[c.ref] || {};
    const needsYou = waiting.some((w) => w.where.name === c.name) || md.msgs.some((m) => m.conv === c && m.mentionsMe && !m.mine && md.inWindow(m));
    const o = { id: c.ref, name: String(c.name).slice(0, 60), count: countIn(c),
      needs: needsYou ? "you" : a.needs === "fyi" ? "fyi" : "none", gist: words(a.gist, 160, "a channel gist") };
    if (c.link) o.link = c.link;
    return o;
  }).sort((a, b) => (a.needs === "you" ? 0 : a.needs === "fyi" ? 1 : 2) - (b.needs === "you" ? 0 : b.needs === "fyi" ? 1 : 2) || b.count - a.count);
  // Loud: the places that moved most and asked nothing of you. A decision or a notice in a busy
  // place does not make the rest of its talk yours: that place can still be skipped.
  const busy = new Set([...waiting, ...promises].map((x) => x.where.name));
  const loud = md.convs.map((c) => ({ c, n: countIn(c) }))
    .filter((x) => x.n >= 5 && !busy.has(x.c.name) && !needs().some((y) => y.m.conv === x.c) && !md.msgs.some((m) => m.conv === x.c && m.mentionsMe && md.inWindow(m)))
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
  for (const x of waiting) if (new Date(x.at).getTime() >= from) you[slot(new Date(x.at))]++;
  const skipped = w.filter((m) => !m.mine && !busy.has(m.conv.name)).length;
  const out = {
    schema: SCHEMA + "@1", example: false, generatedAt: iso(new Date()), since: iso(md.from), timeZone: TZ,
    person: { name: l.person && typeof l.person.name === "string" && inSaved(l.person.name) ? l.person.name.slice(0, 60) : md.me.first.slice(0, 60) },
    headline,
    totals: { messages: w.length, dms: counted("dms"), channels: counted("channels"), mine: w.filter((m) => m.mine).length, mentions: counted("mentions"), skipped },
    pulse: { start: iso(md.from), stepHours: step, counts: pulse, you },
    waiting, promises, decided, channels, loud
  };
  // What Slack does not show: the week in numbers, the files and links, and the questions you asked.
  out.week = weekOf();
  if (savedNames().includes("files")) out.files = filesOf();
  out.links = linksOf();
  const unanswered = askedCandidates();
  out.asked = (Array.isArray(l.asked) ? l.asked : []).map((x) => {
    const m = msgFor(x && x.id);
    const c = m && unanswered.find((y) => y.m === m);
    if (!c) return null;
    const o = { id: m.ref, who: c.who.slice(0, 80), where: where(m), said: said(m), at: iso(m.at),
      reply: typeof x.reply === "string" ? x.reply.trim().slice(0, 500) : "", replyTo: replyTo(m) };
    if (linkOf(m)) o.link = linkOf(m);
    return o;
  }).filter(Boolean).slice(0, 8);
  if (md.host) out.workspace = "https://" + md.host + "/";
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
function finish() {
  let morning = true;
  try { morning = readJson(modeFile).morning; } catch { /* already gone */ }
  if (!morning && fs.existsSync(readingFile)) {
    const r = readJson(readingFile);
    r.done = true;
    writeJson(readingFile, r);
  }
  try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("catch-up/data/.work/ is busy: delete it in your next call"); }
}

function listLine(m) {
  const flags = [m.mine ? "YOU" : "", m.bot ? "bot" : "", m.mentionsMe ? "@you" : "", m.mentionsAll ? "@all" : "", m.inThread ? "in thread " + m.root : m.replies ? m.replies + " replies" : "", !m.mine && answered(m) ? "you answered" : ""].filter(Boolean).join(" ");
  const d = m.at;
  return `${m.ref} | ${ymd(d).slice(5)} ${hhmm(d)} | ${m.conv.ref} | ${m.fromName || "?"}${flags ? " | " + flags : ""} | ${oneLine(m.text).slice(0, 170)}`;
}
function convLine(c) {
  const kind = c.kind === "dm" ? "direct" : c.kind;
  return `${c.ref} | ${kind} | ${c.name} | ${countIn(c)} in the window`;
}
function searches(s, meId) {
  const after = afterDay(s);
  const me = meId ? `<@${meId}>` : "<@YOUR_ID>";
  return [
    `mine        from:me after:${after}                (count 100; the user on these is your id)`,
    `dms         is:dm after:${after}`,
    `groups      is:mpim after:${after}`,
    `mentions    ${me} -from:me after:${after}`,
    `threads     is:thread -from:me after:${after}`,
    `everything  -from:me after:${after}            (every channel; when it comes back empty, search in:#channel after:${after} for at most six channels from slack_list_channels)`
  ].join("\n  ");
}

const [cmd, ...args] = process.argv.slice(2);
try {
if (cmd === "window") {
  const s = sinceFor(args.includes("--morning"));
  console.log([`NOW='${iso(new Date())}'`, `TODAY='${ymd(new Date())}'`, `SINCE='${utc(s)}'`, `AFTER='${afterDay(s)}'`, `TZ_NAME='${TZ}'`].join("\n"));
} else if (cmd === "start") {
  const chat = args.includes("--chat");
  // No profile yet means nobody has met this person: that is the first reading, whatever was asked.
  const met = fs.existsSync(path.join(dataDir, "profile.json"));
  const morning = chat || (args.includes("--morning") && met);
  if (!chat && args.includes("--morning") && !met) console.log("There is no profile yet, so this is the first reading and the person is watching: follow \"The first reading\" (lines, the gift, the profile).");
  if (chat && fs.existsSync(modeFile) && Date.now() - fs.statSync(modeFile).mtimeMs < 15 * 60000) {
    let busy = true;
    try { busy = !readJson(modeFile).chat; } catch { /* half written */ }
    if (busy) fail("the morning reading is running right now: answer from data/latest.json, or try again in a few minutes", 5);
  }
  if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });
  const s = sinceFor(morning);
  // Who waits on you and what you promised look back at least three days: an ask still open
  // from yesterday stays on the page even when the window since the last morning is short.
  const back = morning ? new Date(Math.min(s.getTime(), Date.now() - 3 * DAY)) : s;
  // "Your week" counts the last seven days on every run, so the searches always reach that far.
  const week = new Date(Math.min(back.getTime(), Date.now() - 7 * DAY));
  writeJson(modeFile, { morning, chat, since: utc(s), lookback: utc(back), week: utc(week), after: afterDay(week), startedAt: new Date().toISOString() });
  if (!morning) writeJson(readingFile, { schema: SCHEMA + "/reading@1", startedAt: iso(new Date()), done: false, lines: [] });
  console.log(`${morning ? "morning" : "first reading"} started; the window is from ${iso(s)}.\n` +
    `Search with slack_search_messages (sort timestamp, count 100):\n  ${searches(week, "")}\n` +
    `  files       slack_list_files with no channel_id, count 50 (the files people shared; never fetch a file)\n` +
    `Run the mine search first, then take: it keeps the answer and tells you your own id for the mentions search. ` +
    `After each round of searches, run take; never copy an answer by hand.`);
} else if (cmd === "take") {
  mode();
  const got = take();
  console.log(got.length ? got.join("\n") : "nothing new: ask Slack first, then take");
  try {
    const md = model();
    if (!savedNames().includes("mentions")) console.log(`you are ${md.me.id}${md.me.name ? " (" + md.me.name + ")" : ""}: search mentions with <@${md.me.id}>`);
    const m = missing();
    console.log(m.length ? "still to do: " + m.join("; ") : "all searches and names are in. Next: list, needs, mine, loud");
  } catch (e) { if (!(e instanceof Exit)) throw e; process.exitCode = 0; console.log("still to do: the mine search (from:me)"); }
} else if (cmd === "save") {
  mode();
  const [name, src, ...rest] = args;
  const at = rest.indexOf("--in");
  const inChannel = at >= 0 ? String(rest[at + 1] || "") : "";
  let raw;
  if (src === "-" || src === undefined) raw = fs.readFileSync(0, "utf8");
  else if (String(src).startsWith("@")) {
    const file = path.join(workDir, path.basename(src.slice(1)));
    try { raw = fs.readFileSync(file, "utf8"); } catch { fail(`${src.slice(1)} is not in catch-up/data/.work/`); }
    if (path.basename(file) === cleanName(name) + ".json") fail("give the file another name than the save, like dms.raw.json");
  } else fail("give the answer as @<file> in catch-up/data/.work/, or - and the answer on stdin");
  if (!String(raw || "").trim()) fail("the answer is empty: copy what the tool answered");
  const info = saveAnswer(name, raw, inChannel);
  if (String(src).startsWith("@")) { try { fs.rmSync(path.join(workDir, path.basename(src.slice(1)))); } catch { /* gone */ } }
  const n = cleanName(name);
  const msg = info.messages !== undefined ? `${info.messages} messages${info.more ? "; Slack has more: search page 2 and save it as " + n.replace(/-\d+$/, "") + "-2" : ""}` : info.users !== undefined ? `${info.users} people` : info.channels !== undefined ? `${info.channels} channels` : `${info.conversations} conversations`;
  let you = "";
  if (/^mine/.test(n)) { try { const md = model(); you = `. You are ${md.me.id}${md.me.name ? " (" + md.me.name + ")" : ""}: search mentions with <@${md.me.id}>`; } catch (e) { if (!(e instanceof Exit)) throw e; } }
  console.log(`saved ${n}: ${msg}${you}`);
} else if (cmd === "people") {
  const md = model();
  const w = md.msgs.filter(md.inWindow);
  const nd = needs();
  const score = {};
  const add = (id, k) => { if (id) score[id] = (score[id] || 0) + k; };
  for (const m of w) if (!m.bot) add(m.fromId, 1);
  for (const x of nd) add(x.m.fromId, 100);
  for (const c of md.convs) if (c.kind === "dm") add(c.peer, 50);
  add(md.me.id, 1000);
  const ids = Object.keys(score).filter((id) => /^[UW]/.test(id)).sort((a, b) => score[b] - score[a]);
  console.log(`you: ${md.me.id}${md.people[md.me.id] ? " = " + md.people[md.me.id].name : ""}`);
  const missing = ids.filter((id) => !md.people[id]).slice(0, 12);
  for (const id of ids.slice(0, 20)) console.log(`${id} | ${md.people[id] ? md.people[id].name : "not looked up"} | ${(md.msgs.find((m) => m.fromId === id) || {}).handle || ""}${nd.some((x) => x.m.fromId === id) ? " | may wait for you" : ""}`);
  console.log(missing.length ? `Look up with slack_get_user: ${missing.join(" ")}. Save the answers together: save people - with a JSON array of them.` : "everyone who matters has a name.");
} else if (cmd === "list") {
  const md = model();
  const only = args[0] ? convFor(args[0]) : null;
  if (args[0] && !only) fail(`no place ${args[0]}`);
  const convs = (only ? [only] : md.convs.filter((c) => countIn(c) > 0)).sort((a, b) => countIn(b) - countIn(a));
  console.log(`you: ${md.me.name || md.me.id} | window from ${iso(md.from)} | ${md.msgs.filter(md.inWindow).length} messages`);
  for (const c of convs) console.log(convLine(c));
  for (const c of convs) {
    const ms = md.msgs.filter((m) => m.conv === c && md.inLook(m));
    console.log(`\n== ${convLine(c)}`);
    for (const m of ms.slice(only ? 0 : -15)) console.log(listLine(m));
    if (!only && ms.length > 15) console.log(`(${ms.length - 15} earlier: list ${c.ref})`);
  }
} else if (cmd === "needs") {
  const list2 = needs();
  if (!list2.length) console.log("nobody seems to wait for you in the window");
  for (const x of list2) {
    console.log(`${listLine(x.m)} | why: ${x.why} | in: ${x.m.conv.name}`);
    for (const y of x.all.slice(1)) console.log(`   also asked: ${listLine(y)}`);
    if (x.deferred) console.log(`   you only said: ${x.deferred.ref} "${oneLine(x.deferred.text).slice(0, 120)}"${dueHint(x.deferred) ? ` (due ${dueHint(x.deferred)})` : ""}: still open`);
  }
} else if (cmd === "asked") {
  const list2 = askedCandidates();
  if (!list2.length) console.log("nothing you asked is still without an answer");
  for (const x of list2) console.log(`${listLine(x.m)} | asked: ${x.who} | in: ${x.m.conv.name}`);
} else if (cmd === "mine") {
  const list2 = mine();
  if (!list2.length) console.log("nothing you wrote in the window sounds like a promise");
  for (const m of list2) console.log(`${listLine(m)}${dueHint(m) ? ` | due: ${dueHint(m)}` : ""} | in: ${m.conv.name}`);
} else if (cmd === "loud") {
  const md = model();
  const nd = needs();
  for (const c of md.convs.filter((c) => countIn(c) > 0).sort((a, b) => countIn(b) - countIn(a)).slice(0, 15)) {
    const forYou = nd.filter((x) => x.m.conv === c).length + md.msgs.filter((m) => m.conv === c && m.mentionsMe && !m.mine && md.inWindow(m)).length;
    console.log(`${convLine(c)} | ${forYou ? "has something for you" : "nothing for you"}`);
  }
} else if (cmd === "push") {
  lockReading();
  if (mode().morning) fail("a morning has no reading lines");
  mustBeComplete("a line");
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
  mustBeComplete("the gift");
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
  if (mode().chat) fail("a chat does not write the page: answer in the chat");
  mustBeComplete("latest");
  calmIfNoGift();
  const l = latestOf(argFile(args));
  writeJson(path.join(dataDir, "latest.json"), l);
  writeJson(path.join(dataDir, "status.json"), { at: iso(new Date()), ok: true });
  console.log(`latest.json written: ${l.waiting.length} waiting, ${l.promises.length} promises, ${l.decided.length} decided, ${l.channels.length} channels, ${l.loud.length} loud; and status.json`);
} else if (cmd === "fail") {
  const why = String(args.join(" ") || "").replace(/\s+/g, " ").trim().slice(0, 240);
  if (!why) fail("say why in plain words: fail 'Slack is not connected. Press Connect Slack.'");
  let chat = false;
  try { chat = readJson(modeFile).chat === true; } catch { /* no run started */ }
  if (!chat) {
    fs.mkdirSync(dataDir, { recursive: true });
    writeJson(path.join(dataDir, "status.json"), { at: iso(new Date()), ok: false, why });
  }
  finish();
  console.log(chat ? "done (a chat writes no status)" : "status.json written: ok false. Done");
} else if (cmd === "done") {
  calmIfNoGift();
  finish();
  console.log("done");
} else {
  fail("use window, start, take, save, people, list, needs, asked, mine, loud, push, gift, profile, latest, fail or done");
}
} catch (e) { if (!(e instanceof Exit)) throw e; }
