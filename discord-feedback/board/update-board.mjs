#!/usr/bin/env node
// Every write to the board goes through here, so the board stays one honest file: each message
// once, each person counted once, the time from this machine's clock, and a size that stops
// growing. The agent never rewrites data.json by hand. Run it from anywhere:
//   node <app>/update-board.mjs begin            start of a routine run: prints the cursors and the
//                                                board in short, and notes when the run began
//   node <app>/update-board.mjs brief            the same, for the chat: changes nothing
//   node <app>/update-board.mjs apply @run.json  a routine run's findings, from data/.work/. Repeat it
//                                                as you go: what is applied survives a timeout
//   node <app>/update-board.mjs add @add.json    the same shape from the chat: no cursors, and the
//                                                board keeps its last checked time
//   node <app>/update-board.mjs mark <id> <Open|Shipped|Not doing>
//   node <app>/update-board.mjs spec <id> <path of the page in this cabinet>
//   node <app>/update-board.mjs merge <into id> <from id> [<from id>...]
//   node <app>/update-board.mjs watch <add|skip|clear> <channel name>
//   node <app>/update-board.mjs problem <no-channels|unreachable|clear>
// The shape of each file is in DATA.md. Nothing here talks to Discord.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const boardFile = path.join(here, "data.json");
const backupFile = path.join(dataDir, "backup.json");
const problemFile = path.join(dataDir, "problem.json");
const watchFile = path.join(dataDir, "watch.json");
const exampleFile = path.join(dataDir, "EXAMPLE-data.json");
const startFile = path.join(workDir, "run-start.json");

const TYPES = ["Feature", "Bug", "UI/UX", "Integration", "Other"];
const STATES = ["Open", "Shipped", "Not doing"];
// The limits that keep the file small enough for Cabinet to hand to the page (2 MB).
const MAX_REQUESTS = 300;
const MAX_MESSAGES = 10;
const MAX_PEOPLE = 100;
const MAX_TEXT = 300;
const MAX_THREADS = 300;
const MAX_BYTES = 1_500_000;
const QUIET_DAYS = 90;   // an open request one person made, with no new ask
const CLOSED_DAYS = 180; // a shipped or declined request nobody raised again
const THREAD_DAYS = 60;
const DAY = 86400000;

// ── Time, in this machine's zone (the person's own) ──
const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, "0");
function iso(d) {
  const o = -d.getTimezoneOffset();
  const zone = (o >= 0 ? "+" : "-") + pad(o / 60) + ":" + pad(o % 60);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${zone}`;
}

function fail(msg) { console.error("update-board: " + msg); process.exit(1); }
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".part";
  fs.writeFileSync(tmp, JSON.stringify(value, null, 1));
  fs.renameSync(tmp, file);
}
const usable = (d) => d && typeof d === "object" && Array.isArray(d.requests);

/** A run and a chat may write at once: one at a time, each on the file as it is now. */
function lock() {
  fs.mkdirSync(dataDir, { recursive: true });
  const dir = path.join(dataDir, ".board.lock");
  const until = Date.now() + 8000;
  for (;;) {
    try { fs.mkdirSync(dir); break; } catch {
      try { if (Date.now() - fs.statSync(dir).mtimeMs > 15000) { fs.rmSync(dir, { recursive: true, force: true }); continue; } } catch { continue; }
      if (Date.now() > until) fail("another update is still running: try again in a moment");
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
  process.on("exit", () => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* gone */ } });
}

/** The board, its last good copy when it broke, or null on the first run. */
function openBoard() {
  if (!fs.existsSync(boardFile)) return null;
  try {
    const d = readJson(boardFile);
    if (usable(d)) return d;
  } catch { /* told below */ }
  try {
    const d = readJson(backupFile);
    if (usable(d)) { writeJson(boardFile, d); console.log("data.json was broken: restored the last good copy"); return d; }
  } catch { /* no copy */ }
  fs.renameSync(boardFile, boardFile + ".broken");
  console.log("data.json was broken and has no good copy: starting again");
  return null;
}
function saveBoard(board) {
  if (fs.existsSync(boardFile)) { try { if (usable(readJson(boardFile))) fs.copyFileSync(boardFile, backupFile); } catch { /* keep the older copy */ } }
  writeJson(boardFile, board);
}

// ── Plain values ──
const words = (value, max) => String(value ?? "").replace(/\s*[—–]\s*/g, ", ").replace(/\s+/g, " ").trim().slice(0, max);
const isId = (s) => /^\d{5,25}$/.test(String(s ?? ""));
const newer = (a, b) => (BigInt(a) > BigInt(b) ? a : b);
const when = (s) => { const t = Date.parse(s); return Number.isFinite(t) ? t : null; };
const slug = (s) => words(s, 60).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
const sameWords = (s) => words(s, 80).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
const discordLink = (s) => (/^https:\/\/(ptb\.|canary\.)?discord\.com\/channels\/\d+\/\d+\/\d+$/.test(String(s ?? "")) ? s : null);
const hash = (s) => (String(s).startsWith("#") ? String(s) : "#" + s);

function priorityOf(r) {
  if (r.count >= 3 || r.blocking) return "High";
  if (r.count === 2 || r.type === "Bug") return "Medium";
  return "Low";
}
/** Most people first: the order the page ranks by, so the end of it is what goes first. */
const rank = (r) => (r.count || 0) + (r.votes || 0);
function byRank(a, b) { return rank(b) - rank(a) || (when(b.lastSeen) ?? 0) - (when(a.lastSeen) ?? 0); }

function findRequest(board, id) {
  return board.requests.find((r) => r.id === id || (r.merged || []).some((m) => m.id === id)) ?? null;
}

function addPerson(r, id, name) {
  const key = String(id || name);
  if (r.people.some((p) => p.id === key)) return;
  if (r.people.length < MAX_PEOPLE) r.people.push({ id: key, name: words(name, 40) || "Someone" });
  r.count = (r.count || 0) + 1;
}

/** Everyone and everything from one row moves to another; the old name still finds it. */
function mergeRows(board, intoId, fromIds) {
  const into = findRequest(board, intoId);
  if (!into) return `no request "${intoId}"`;
  for (const id of fromIds) {
    const from = findRequest(board, id);
    if (!from) return `no request "${id}"`;
    if (from === into) continue;
    const beyond = (from.count || 0) - from.people.length;
    for (const p of from.people) addPerson(into, p.id, p.name);
    into.count += Math.max(0, beyond);
    const seen = new Set(into.messages.map((m) => m.id));
    into.messages.push(...from.messages.filter((m) => !seen.has(m.id)));
    into.asks = (into.asks || 0) + (from.asks || 0);
    into.votes = (into.votes || 0) + (from.votes || 0);
    if ((when(from.firstSeen) ?? Infinity) < (when(into.firstSeen) ?? Infinity)) into.firstSeen = from.firstSeen;
    if ((when(from.lastSeen) ?? 0) > (when(into.lastSeen) ?? 0)) into.lastSeen = from.lastSeen;
    into.blocking = into.blocking || from.blocking;
    into.merged = [...(into.merged || []), ...(from.merged || []), { id: from.id, title: from.title }];
    for (const t of Object.values(board.threads || {})) if (t.request === from.id) t.request = into.id;
    board.requests = board.requests.filter((r) => r !== from);
  }
  return null;
}

/** Shortens every row and drops what has gone quiet. Says how many went. */
function prune(board, now) {
  for (const r of board.requests) {
    r.messages.sort((a, b) => (when(b.at) ?? 0) - (when(a.at) ?? 0));
    // The newest messages, and always the first one: it says what was asked.
    if (r.messages.length > MAX_MESSAGES) r.messages = [...r.messages.slice(0, MAX_MESSAGES - 1), r.messages[r.messages.length - 1]];
    r.priority = priorityOf(r);
  }
  const before = board.requests.length;
  board.requests = board.requests.filter((r) => {
    const age = (now - (when(r.lastSeen) ?? now)) / DAY;
    if (r.state === "Shipped" || r.state === "Not doing") return age <= CLOSED_DAYS;
    return r.count > 1 || r.spec || age <= QUIET_DAYS;
  });
  board.requests.sort(byRank);
  board.requests.length = Math.min(board.requests.length, MAX_REQUESTS);
  while (board.requests.length && Buffer.byteLength(JSON.stringify(board, null, 1)) > MAX_BYTES) board.requests.pop();
  board.dropped = (board.dropped || 0) + before - board.requests.length;
  const threads = Object.entries(board.threads || {}).filter(([, t]) => now - (when(t.seen) ?? now) <= THREAD_DAYS * DAY);
  threads.sort(([, a], [, b]) => (when(b.seen) ?? 0) - (when(a.seen) ?? 0));
  board.threads = Object.fromEntries(threads.slice(0, MAX_THREADS));
}

function emptyBoard() {
  return { version: 2, generated: null, status: "ok", server: null, channels: [], left: [], cursors: {}, threads: {}, last: null, dropped: 0, requests: [] };
}

/** Sorts findings into the board. Returns what happened, in words the agent can act on. */
function sortIn(board, run, routine, now) {
  const refused = [];
  let added = 0;
  let fresh = 0;

  for (const m of Array.isArray(run.merge) ? run.merge : []) {
    const said = mergeRows(board, m.into, Array.isArray(m.from) ? m.from : []);
    if (said) refused.push("merge: " + said);
  }
  for (const n of Array.isArray(run.new) ? run.new : []) {
    const title = words(n.title, 80);
    const id = slug(n.id || title);
    if (!id || !title) { refused.push("a new request needs id and title"); continue; }
    // The same request under another name is the commonest way a board goes wrong.
    const twin = findRequest(board, id) || board.requests.find((r) => sameWords(r.title) === sameWords(title));
    if (twin) { if (twin.id !== id) (twin.merged ||= []).push({ id, title }); continue; }
    board.requests.push({
      id, title, summary: words(n.summary, 200), type: TYPES.includes(n.type) ? n.type : "Other", state: "Open",
      priority: "Low", count: 0, people: [], asks: 0, votes: 0, firstSeen: null, lastSeen: null, blocking: !!n.blocking, messages: [],
    });
    fresh++;
  }
  for (const u of Array.isArray(run.update) ? run.update : []) {
    const r = findRequest(board, u.id);
    if (!r) { refused.push(`update: no request "${u.id}"`); continue; }
    if (u.title) r.title = words(u.title, 80);
    if (u.summary) r.summary = words(u.summary, 200);
    if (TYPES.includes(u.type)) r.type = u.type;
    if (typeof u.blocking === "boolean") r.blocking = u.blocking;
  }
  const seen = new Set(board.requests.flatMap((r) => r.messages.map((m) => m.id)));
  for (const m of Array.isArray(run.messages) ? run.messages : []) {
    const r = findRequest(board, m.request);
    if (!r) { refused.push(`message ${m.id}: no request "${m.request}"`); continue; }
    const at = when(m.at);
    if (!isId(m.id) || at === null) { refused.push(`message ${m.id}: needs its id and at, as the tool gave them`); continue; }
    if (m.bot === true || seen.has(String(m.id))) continue;
    seen.add(String(m.id));
    addPerson(r, m.authorId, m.author);
    r.asks = (r.asks || 0) + 1;
    const votes = Number.isFinite(m.votes) && m.votes > 0 ? Math.round(m.votes) : 0;
    r.votes = (r.votes || 0) + votes;
    r.messages.push({
      id: String(m.id), author: words(m.author, 40) || "Someone", text: String(m.text ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_TEXT),
      at: new Date(at).toISOString(), channel: m.channel ? hash(words(m.channel, 60)) : "", link: discordLink(m.link), votes,
    });
    if ((when(r.firstSeen) ?? Infinity) > at) r.firstSeen = new Date(at).toISOString();
    if ((when(r.lastSeen) ?? 0) < at) r.lastSeen = new Date(at).toISOString();
    added++;
  }
  // A request nobody could be attached to is not a request: it would show 0 people.
  const empty = board.requests.filter((r) => !r.messages.length && !r.count);
  for (const r of empty) refused.push(`request "${r.id}" has no message: send one with it next time`);
  board.requests = board.requests.filter((r) => r.messages.length || r.count);
  fresh = Math.max(0, fresh - empty.length);

  if (routine) {
    if (run.server && run.server.id) board.server = { id: String(run.server.id), name: words(run.server.name, 80) };
    if (Array.isArray(run.channels)) {
      board.channels = run.channels.filter((c) => c && c.name).slice(0, 12).map((c) => ({
        id: String(c.id ?? ""), name: hash(words(c.name, 60)), kind: words(c.kind, 20) || "text",
        back: when(c.back) === null ? null : new Date(when(c.back)).toISOString(), problem: words(c.problem, 160),
      }));
    }
    if (Array.isArray(run.left)) board.left = run.left.slice(0, 60).map((n) => hash(words(n, 60)));
    if (typeof run.setup === "string") board.setup = words(run.setup, 40);
    for (const [channel, id] of Object.entries(run.cursors && typeof run.cursors === "object" ? run.cursors : {})) {
      if (!isId(channel) || !isId(id)) { refused.push(`cursor ${channel}: needs ids`); continue; }
      board.cursors[channel] = board.cursors[channel] ? newer(board.cursors[channel], String(id)) : String(id);
    }
    for (const [thread, t] of Object.entries(run.threads && typeof run.threads === "object" ? run.threads : {})) {
      if (!isId(thread) || !t) continue;
      const had = board.threads[thread] || {};
      const cursor = isId(t.cursor) ? (isId(had.cursor) ? newer(had.cursor, String(t.cursor)) : String(t.cursor)) : had.cursor;
      board.threads[thread] = { messages: Number(t.messages) || had.messages || 0, cursor, request: t.request || had.request || null, seen: iso(new Date(now)) };
    }
    let started = {};
    try { started = readJson(startFile); } catch { /* a run that skipped begin */ }
    const same = board.last && started.at && board.last.run === started.at;
    board.previousGenerated = started.at ? started.generated ?? undefined : board.generated ?? undefined;
    board.last = {
      run: started.at || iso(new Date(now)), read: (same ? board.last.read : 0) + (Number(run.read) || 0),
      added: (same ? board.last.added : 0) + added, requests: (same ? board.last.requests : 0) + fresh,
    };
    board.generated = iso(new Date(now));
    board.status = words(run.status, 200) || "ok";
  }
  prune(board, now);
  return { refused, added, fresh };
}

function outline(board) {
  const b = board ?? emptyBoard();
  let watch = { add: [], skip: [] };
  try { watch = { ...watch, ...readJson(watchFile) }; } catch { /* none set */ }
  return {
    now: iso(new Date()), firstRun: !board, server: b.server, cursors: b.cursors, threads: b.threads,
    watch, channels: b.channels.map((c) => c.name), setup: b.setup ?? null, generated: b.generated,
  };
}
function printBrief(board) {
  console.log(JSON.stringify(outline(board)));
  for (const r of board?.requests ?? []) {
    const also = (r.merged || []).map((m) => m.title).join(", ");
    console.log(`${r.id} | ${r.state} | ${r.count} | ${r.type} | ${r.title}${also ? ` (also: ${also})` : ""} | ${words(r.summary, 100)}`);
  }
}
/** Findings are files the agent wrote in data/.work/, named without the path. */
function workJson(arg) {
  if (!String(arg).startsWith("@")) fail("give the findings as @<file>: the JSON you wrote into data/.work/");
  const file = path.resolve(workDir, String(arg).slice(1).replace(/^.*data[\\/]\.work[\\/]/, ""));
  if (!file.startsWith(workDir + path.sep)) fail("that file is not inside data/.work/");
  if (!fs.existsSync(file)) fail(`${path.basename(file)} is not in data/.work/ (write it there first)`);
  try { return readJson(file); } catch { return fail(`${path.basename(file)} is not valid JSON`); }
}
function report(board, did) {
  console.log(`board: ${board.requests.length} requests, ${did.fresh} new, ${did.added} messages added`);
  if (did.refused.length) console.log("not applied, fix and apply again:\n  " + did.refused.join("\n  "));
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "begin" || cmd === "brief") {
  if (cmd === "begin") lock();
  const board = openBoard();
  if (cmd === "begin") writeJson(startFile, { at: iso(new Date()), generated: board?.generated ?? null });
  printBrief(board);
} else if (cmd === "apply" || cmd === "add") {
  const run = workJson(args[0]);
  lock();
  const routine = cmd === "apply";
  if (!routine && !fs.existsSync(boardFile)) fail("there is no board yet: the first update makes it");
  const board = openBoard() ?? emptyBoard();
  const did = sortIn(board, run, routine, Date.now());
  saveBoard(board);
  if (routine) {
    // Reaching Discord is what ends the example and any problem the page was showing.
    fs.rmSync(exampleFile, { force: true });
    fs.rmSync(problemFile, { force: true });
  }
  report(board, did);
} else if (cmd === "mark" || cmd === "spec" || cmd === "merge") {
  lock();
  const board = openBoard();
  if (!board) fail("there is no board yet");
  const [id, ...rest] = args;
  if (cmd === "merge") {
    const said = mergeRows(board, id, rest);
    if (said) fail(said);
  } else {
    const r = findRequest(board, id);
    if (!r) fail(`no request "${id}"`);
    if (cmd === "spec") r.spec = words(rest.join(" "), 160);
    else {
      const state = rest.join(" ");
      if (!STATES.includes(state)) fail(`the state is ${STATES.join(", ")}`);
      r.state = state;
      if (state === "Open") delete r.stateAt; else r.stateAt = iso(new Date());
    }
  }
  prune(board, Date.now());
  saveBoard(board);
  console.log(`done: ${cmd} ${args.join(" ")}`);
} else if (cmd === "watch") {
  const [how, ...name] = args;
  const channel = hash(words(name.join(" "), 60).replace(/^#/, ""));
  if (!["add", "skip", "clear"].includes(how) || channel === "#") fail("use watch add, skip or clear with a channel name");
  lock();
  let watch = { add: [], skip: [] };
  try { watch = { ...watch, ...readJson(watchFile) }; } catch { /* first one */ }
  watch.add = watch.add.filter((n) => n !== channel);
  watch.skip = watch.skip.filter((n) => n !== channel);
  if (how !== "clear") watch[how].push(channel);
  writeJson(watchFile, watch);
  console.log(`always read: ${watch.add.join(", ") || "none"}. never read: ${watch.skip.join(", ") || "none"}`);
} else if (cmd === "problem") {
  const kind = args[0];
  if (!["no-channels", "unreachable", "clear"].includes(kind)) fail("use problem no-channels, unreachable or clear");
  lock();
  if (kind === "clear") fs.rmSync(problemFile, { force: true });
  else writeJson(problemFile, { kind, at: iso(new Date()) });
  console.log("problem: " + kind);
} else {
  fail("use begin, brief, apply, add, mark, spec, merge, watch or problem");
}
