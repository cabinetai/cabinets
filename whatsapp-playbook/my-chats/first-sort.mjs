#!/usr/bin/env node
// Reads the WhatsApp chats where Cabinet saves them (whatsapp/<chat>/YYYY-MM.md in another
// cabinet, today WhatsApp Catch-Up) and writes the page's files here, so every name, time and
// number on the page is worked out from the chats, never typed. It only reads that folder:
// it never writes, moves or deletes anything there. Run it from the cabinet root:
//   node my-chats/first-sort.mjs where             the folder the chats are read from
//   node my-chats/first-sort.mjs read [days]       the chats to read: the time, setup.md, the last
//                                                  sort, then for each chat with new lines a header
//                                                  and its last 40 lines. With no last sort (or one
//                                                  older than 3 days): the last `days` (14). Exit 2
//                                                  when WhatsApp saves no chat anywhere yet.
//   node my-chats/first-sort.mjs start             new data/reading.json and data/.work/ (first sort)
//   node my-chats/first-sort.mjs push '<line>'     add one reading line (single quotes)
//   node my-chats/first-sort.mjs gift @<file>      the one thing for the owner, while you read
//   node my-chats/first-sort.mjs profile @<file>   write data/profile.json (the counts are added here)
//   node my-chats/first-sort.mjs latest @<file>    write data/latest.json and data/status.json
//   node my-chats/first-sort.mjs off '<why>'       write data/status.json with ok:false
//   node my-chats/first-sort.mjs done              mark the reading done, delete data/.work/
// In a line: {chats|one|many} chats saved, {active|one|many} chats with new lines,
// {messages|one|many} new lines, {mine|one|many} of them yours, {waiting|one|many} chats waiting
// for you, {groups|one|many} groups with new lines, {busy} the busiest group and
// {busycount|one|many} its new lines, {people} the people you talk with most. Type no digit.
// A <file> is relative to data/.work/. A chat is named by the key `read` prints.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA = "whatsapp-playbook";
const LANES = ["waiting", "plans", "groups", "promises", "money", "keep"];
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const dataDir = path.join(here, "data");
const workDir = path.join(dataDir, ".work");
const readingFile = path.join(dataDir, "reading.json");
const MONEY = /(?:[$€£₪¥]\s?\d[\d,]*(?:\.\d+)?)|(?:\d[\d,]*(?:\.\d+)?\s?(?:USD|EUR|GBP|ILS|NIS|₪|€|ש״ח|ש"ח|שקל(?:ים)?))/g;
const DAY = 86400000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ── Time, in this machine's zone (the person's own) ──
const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, "0");
const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const stamp = (d) => ymd(d) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
function offsetOf(d) { const o = -d.getTimezoneOffset(); return (o >= 0 ? "+" : "-") + pad(o / 60) + ":" + pad(o % 60); }
function iso(d) { return stamp(d) + ":" + pad(d.getSeconds()) + offsetOf(d); }
function dayStart(days) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + days); return d; }

function fail(msg, code) { console.error("first-sort: " + msg); process.exit(code || 1); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".part";
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}
function workJson(arg) {
  if (!arg.startsWith("@")) fail("give it as @<file>: the JSON your script wrote into my-chats/data/.work/");
  const file = path.resolve(workDir, arg.slice(1).replace(/^.*data[\\/]\.work[\\/]/, ""));
  if (!file.startsWith(workDir + path.sep) || !fs.existsSync(file)) fail(`${arg.slice(1)} is not in my-chats/data/.work/`);
  try { return readJson(file); } catch { return fail(`${arg.slice(1)} is not JSON`); }
}

// ── Where Cabinet saves the chats ──
// Cabinet saves WhatsApp into one cabinet's whatsapp/ folder and marks it with .origin.yaml
// (provider: whatsapp). It is looked for under Cabinet's data folder (the one that holds
// .cabinet.db), never in this cabinet. If an old marked folder was left behind after a move,
// the one with the newest month page wins.
const SKIP = new Set(["node_modules", ".git"]);
function dataRoot() {
  let dir = root;
  for (;;) {
    if (fs.existsSync(path.join(dir, ".cabinet.db"))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return path.dirname(root);
    dir = up;
  }
}
function newestPage(dir) {
  let newest = 0;
  for (const chat of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!chat.isDirectory() || chat.name === "all-conversations") continue;
    for (const f of fs.readdirSync(path.join(dir, chat.name))) {
      if (/^\d{4}-\d{2}\.md$/.test(f)) newest = Math.max(newest, fs.statSync(path.join(dir, chat.name, f)).mtimeMs);
    }
  }
  return newest;
}
function findChats() {
  const top = dataRoot();
  const found = [];
  (function walk(dir, depth) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isDirectory() || SKIP.has(e.name) || e.name.startsWith(".")) continue;
      const full = path.join(dir, e.name);
      if (full === root) continue;
      const marker = path.join(full, "whatsapp", ".origin.yaml");
      if (fs.existsSync(marker) && /^provider:\s*whatsapp\s*$/m.test(fs.readFileSync(marker, "utf8"))) found.push(path.join(full, "whatsapp"));
      if (depth < 6) walk(full, depth + 1);
    }
  })(top, 0);
  found.sort((a, b) => newestPage(b) - newestPage(a));
  if (!found.length) return null;
  const cabinet = path.dirname(found[0]);
  const meta = fs.existsSync(path.join(cabinet, ".cabinet")) ? fs.readFileSync(path.join(cabinet, ".cabinet"), "utf8") : "";
  return {
    dir: found[0],
    cabinet: { name: yamlText(((/^name:\s*(.+)$/m.exec(meta) || [])[1] || path.basename(cabinet)).trim()), path: path.relative(top, cabinet).split(path.sep).join("/") }
  };
}
const source = findChats();
const chatsDir = source ? source.dir : null;

// ── The saved chats ──
function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  const out = {};
  if (!m) return out;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^\s+(chat|name):\s*(.*)$/.exec(line);
    if (kv) out[kv[1]] = yamlText(kv[2].trim());
  }
  return out;
}
/** A YAML value: 'single' (with '' for '), or "double" with its escapes (an emoji is \U0001F30A). */
function yamlText(v) {
  if (/^'.*'$/.test(v)) return v.slice(1, -1).replace(/''/g, "'");
  if (!/^".*"$/.test(v)) return v;
  return v.slice(1, -1).replace(/\\(U[0-9a-fA-F]{8}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (_, e) =>
    e.length > 1 ? String.fromCodePoint(parseInt(e.slice(1), 16)) : e === "n" || e === "t" ? " " : e);
}
/** "**14 Sep 2026 10:41 · Dana Levi:** text <!-- wa:... -->", a message over several lines kept whole. */
function linesOf(text) {
  const out = [];
  const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  for (const raw of body.split(/\r?\n/)) {
    const m = /^\*\*(\d{1,2}) ([A-Z][a-z]{2}) (\d{4}) (\d{2}):(\d{2}) · (.+?):\*\*\s?(.*)$/.exec(raw);
    if (m && MONTHS.includes(m[2])) {
      out.push({ at: new Date(+m[3], MONTHS.indexOf(m[2]), +m[1], +m[4], +m[5]), who: m[6].trim(), text: clean(m[7]) });
    } else if (out.length && raw.trim()) {
      out[out.length - 1].text = (out[out.length - 1].text + " " + clean(raw)).trim();
    }
  }
  return out;
}
function clean(s) { return String(s).replace(/<!--[\s\S]*?(-->|$)/g, "").trim(); }

/** Every saved chat: who it is with, its lines (oldest first), and whose each line is. */
function loadChats() {
  if (!chatsDir) return [];
  const chats = [];
  for (const folder of fs.readdirSync(chatsDir)) {
    const dir = path.join(chatsDir, folder);
    if (folder === "all-conversations" || folder.startsWith(".") || !fs.statSync(dir).isDirectory()) continue;
    const pages = fs.readdirSync(dir).filter((f) => /^\d{4}-\d{2}\.md$/.test(f)).sort();
    if (!pages.length) continue;
    const index = fs.existsSync(path.join(dir, "index.md")) ? fs.readFileSync(path.join(dir, "index.md"), "utf8") : "";
    const owner = (/From (.+?)['’]s WhatsApp/.exec(index) || [])[1] || "";
    let meta = {};
    const lines = [];
    for (const page of pages) {
      const text = fs.readFileSync(path.join(dir, page), "utf8");
      meta = { ...meta, ...frontmatter(text) };
      lines.push(...linesOf(text));
    }
    lines.sort((a, b) => a.at - b.at);
    for (const l of lines) l.mine = / \(me\)$/.test(l.who) || l.who === "You" || (!!owner && l.who === owner);
    const group = meta.chat === "group";
    const number = !group && /\d/.test(meta.chat || "") ? String(meta.chat).replace(/\D/g, "") : "";
    chats.push({ folder, key: keyOf(folder), group, number, name: nameOf(meta, group, number, folder), lines, owner });
  }
  return chats;
}
/** A folder named by a number or an id shows only its last four digits, anywhere. */
function keyOf(folder) { const m = /^(chat|group)-(\d+)$/.exec(folder); return m ? `${m[1]}-...${m[2].slice(-4)}` : folder; }
/** The saved name; a number with no saved name is "the number ending 4410", never the whole number. */
function nameOf(meta, group, number, folder) {
  let name = (meta.name || "").trim();
  if (number) {
    const spaced = String(meta.chat || "").trim();
    if (spaced && name.startsWith(spaced)) name = name.slice(spaced.length).trim();
    if (!name || /^[+\d\s()-]+$/.test(name)) return "the number ending " + number.slice(-4);
  }
  if (group && !name) return /^group-\d+$/.test(folder) ? "Group " + folder.slice(-4) : folder;
  return name || folder;
}
function ownerName(chats) {
  const counts = {};
  for (const c of chats) for (const l of c.lines) if (/ \(me\)$/.test(l.who)) { const n = l.who.replace(/ \(me\)$/, ""); counts[n] = (counts[n] || 0) + 1; }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : (chats.find((c) => c.owner) || {}).owner || "";
}
const quiet = (l) => /^\[(sticker|message deleted)\]$/i.test(l.text);

/** What one chat says now: waiting for the owner since when, and its lines in the window. */
function factsOf(c, since, me) {
  const inWindow = c.lines.filter((l) => l.at >= since);
  let i = c.lines.length;
  while (i > 0 && !c.lines[i - 1].mine) i--;
  const after = c.lines.slice(i).filter((l) => !quiet(l));
  const first = me ? me.split(" ")[0] : "";
  const mentions = c.group && first ? after.filter((l) => l.text.includes(first) || l.text.includes("@")).length : 0;
  const waiting = c.group ? mentions > 0 : after.length > 0;
  return {
    key: c.key, who: c.name, kind: c.group ? "group" : c.number && /^the number ending/.test(c.name) ? "number" : "person",
    messages: inWindow.length, mine: inWindow.filter((l) => l.mine).length,
    last: c.lines.length ? stamp(c.lines[c.lines.length - 1].at) : null,
    waiting, unread: waiting ? after.length : 0, since: waiting && after.length ? stamp(after[0].at) : null, mentions
  };
}

function lastSort() {
  try { const l = readJson(path.join(dataDir, "latest.json")); return l && l.example !== true ? l : null; } catch { return null; }
}
/** The window: since the last sort when it is under 3 days old, otherwise the last `days`. */
function windowStart(days) {
  const l = lastSort();
  const g = l && new Date(l.generatedAt);
  if (g && !isNaN(g) && Date.now() - g.getTime() < 3 * DAY) return g;
  return dayStart(-days);
}

function allFacts(days) {
  const chats = loadChats();
  const since = windowStart(days);
  const me = ownerName(chats);
  return { chats, since, me, facts: chats.map((c) => factsOf(c, since, me)) };
}

// ── Placeholders: every number in a line is counted here ──
function withWord(n, one, many) { const num = n.toLocaleString("en-US"); return one ? `${num} ${n === 1 ? one : many || one}` : num; }
function andList(names) { return names.length <= 1 ? names.join("") : names.slice(0, -1).join(", ") + " and " + names[names.length - 1]; }
function topPeople(facts, n) {
  return facts.filter((f) => f.kind !== "group" && f.mine > 0 && f.messages - f.mine > 0).sort((a, b) => b.messages - a.messages).slice(0, n);
}
function busiest(facts) { return facts.filter((f) => f.kind === "group" && f.messages > 0).sort((a, b) => b.messages - a.messages)[0] || null; }
function fill(text, all) {
  const { chats, facts } = all;
  const active = facts.filter((f) => f.messages > 0);
  const out = String(text).replace(/\{(chats|active|messages|mine|waiting|groups|busy|busycount|people)(?:\|([^}|]*)(?:\|([^}]*))?)?\}/g, (_, kind, one, many) => {
    const busy = busiest(facts);
    if (kind === "busy") { if (!busy) fail("refused, no group had new lines: leave that line out"); return busy.who; }
    if (kind === "people") { const p = topPeople(facts, 3); if (!p.length) fail("refused, nobody wrote both ways: leave that line out"); return andList(p.map((f) => f.who)); }
    const n = kind === "chats" ? chats.length
      : kind === "active" ? active.length
      : kind === "messages" ? active.reduce((s, f) => s + f.messages, 0)
      : kind === "mine" ? active.reduce((s, f) => s + f.mine, 0)
      : kind === "waiting" ? facts.filter((f) => f.waiting).length
      : kind === "groups" ? active.filter((f) => f.kind === "group").length
      : busy ? busy.messages : fail("refused, no group had new lines: leave that line out");
    return withWord(n, one, many);
  });
  return out;
}
/** Your own words carry no digit: every number is the helper's. */
function ownWords(text, where) {
  const typed = String(text).replace(/\{[^}]*\}/g, "");
  if (/\d/.test(typed)) fail(`refused, a number typed in ${where}: use a placeholder ({waiting|person|people}), or leave it out`);
}

// ── The cards: who, when and how many come from the chats ──
function chatFor(key, facts, where) {
  const f = facts.find((x) => x.key === key || x.key === String(key || "").replace(/^whatsapp\//, ""));
  if (!f) fail(`refused, ${where}: no saved chat "${key}". Use the key \`read\` printed.`);
  return f;
}
function textOf(chats, key) { const c = chats.find((x) => x.key === key); return c ? c.lines.map((l) => l.text).join("\n") : ""; }
/** Every amount must be written, as it is, in that chat. */
function checkMoney(value, text, where) {
  for (const amount of String(value).match(MONEY) || []) {
    if (!text.includes(amount.trim())) fail(`refused, ${amount.trim()} in ${where} is not written in that chat: copy it as written`);
  }
}
function cards(l, all) {
  const { chats, facts } = all;
  for (const lane of LANES) {
    if (!Array.isArray(l[lane])) { l[lane] = []; continue; }
    l[lane] = l[lane].filter((x) => x && typeof x === "object").map((x, i) => {
      const where = `${lane}[${i}]`;
      const f = chatFor(x.chat, facts, where);
      const text = textOf(chats, f.key);
      const card = { ...x, id: x.id || lane.charAt(0) + (i + 1), chat: f.key, who: f.who, kind: x.kind, chatKind: f.kind };
      for (const k of ["gist", "short", "why"]) if (typeof card[k] === "string") ownWords(card[k].replace(MONEY, ""), `${where}.${k}`);
      for (const k of ["gist", "short", "what", "reply", "amount", "quote"]) if (typeof card[k] === "string") checkMoney(card[k], text, `${where}.${k}`);
      if (typeof card.quote === "string" && card.quote && !text.includes(card.quote)) fail(`refused, ${where}.quote is not written in that chat: copy a few words exactly, or leave it out`);
      if (lane === "waiting") {
        if (!f.waiting) fail(`refused, ${where}: ${f.who} is not waiting for an answer (the newest line is yours${f.kind === "group" ? ", or nobody named you" : ""})`);
        card.since = f.since;
        card.unread = f.unread;
      }
      if (lane === "groups") {
        if (f.kind !== "group") fail(`refused, ${where}: ${f.who} is not a group`);
        card.messages = f.messages;
        card.mentions = f.mentions;
      }
      if (lane === "money" && typeof card.amount === "string" && !(card.amount.match(MONEY) || []).length) fail(`refused, ${where}.amount is not an amount with its currency`);
      return card;
    });
  }
}

// ── The gift: one thing the owner can act on now, shown while the reading goes on ──
function giftOf(g, all) {
  if (!g || typeof g !== "object" || Array.isArray(g)) fail("the gift must be an object");
  const kind = String(g.kind || "");
  if (!["waiting", "plan", "group", "calm"].includes(kind)) fail(`the gift kind is waiting, plan, group or calm, not "${kind}"`);
  const out = { kind };
  if (typeof g.gist === "string" && g.gist.trim()) {
    ownWords(g.gist, "the gist");
    if (g.gist.length > 140) fail("the gist is longer than 140 characters");
    out.gist = g.gist.trim();
  }
  if (kind === "calm") return out;
  const f = chatFor(g.chat, all.facts, "the gift");
  out.chat = f.key;
  out.who = f.who;
  if (kind === "waiting") {
    if (!f.waiting) fail(`refused, ${f.who} is not waiting for an answer: give the next kind down`);
    out.since = f.since;
    out.unread = f.unread;
  } else if (kind === "group") {
    const week = all.chats.find((c) => c.key === f.key).lines.filter((l) => l.at >= dayStart(-6)).length;
    if (f.kind !== "group" || week < 20) fail("refused, a group gift needs a group with 20 new lines or more this week");
    out.count = withWord(week, "message", "messages");
    out.mentions = f.mentions;
  } else {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(g.when || ""))) fail('a plan needs "when" as YYYY-MM-DD, worked out from the line that set it');
    const d = new Date(+g.when.slice(0, 4), +g.when.slice(5, 7) - 1, +g.when.slice(8, 10));
    if (d < dayStart(0) || d > dayStart(14)) fail("refused, a plan gift is from today to 14 days from now");
    if (!f.messages) fail(`refused, ${f.who} wrote nothing in the window`);
    if (typeof g.what !== "string" || !g.what.trim()) fail("a plan needs what: a few words, like \"Dinner at Noa's\"");
    ownWords(g.what, "the plan's what");
    out.when = g.when;
    out.what = g.what.trim().slice(0, 80);
    if (/^\d{2}:\d{2}$/.test(String(g.time || ""))) out.time = g.time;
  }
  return out;
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
function reading() { return fs.existsSync(readingFile) ? readJson(readingFile) : fail("run start first"); }

const NO_CHATS = "No WhatsApp chats are saved in Cabinet yet. Connect WhatsApp and pick your chats in WhatsApp Catch-Up, then sort again.";
const [cmd, ...args] = process.argv.slice(2);
if (cmd === "where") {
  if (!source) fail(NO_CHATS, 2);
  console.log(`${source.dir}\n(the chats of ${source.cabinet.name}: read them, never write, move or delete there)`);
} else if (cmd === "read") {
  const days = Math.min(30, Math.max(1, Number(args[0]) || 14));
  const all = allFacts(days);
  console.log("now: " + iso(new Date()) + (all.me ? "\nyou: " + all.me : ""));
  const setup = path.join(here, "setup.md");
  if (fs.existsSync(setup)) console.log("== my-chats/setup.md\n" + fs.readFileSync(setup, "utf8").replace(/^---[\s\S]*?---\s*/, "").trim());
  if (!all.chats.length) fail(NO_CHATS, 2);
  console.log(`== chats from ${source.cabinet.name} (${source.cabinet.path}), read only`);
  const last = lastSort();
  if (last && new Date(last.generatedAt) >= all.since) {
    const keep = {};
    for (const lane of ["plans", "promises", "money", "keep"]) if (Array.isArray(last[lane]) && last[lane].length) keep[lane] = last[lane];
    console.log("== the last sort, " + last.generatedAt + " (keep what still holds)\n" + JSON.stringify(keep));
  }
  console.log(`== chats with new lines since ${stamp(all.since)}, and chats still waiting: key · name · person, group or number · new lines`);
  // A chat still waiting for an answer is printed even with no new line, so it stays on the page.
  const changed = all.chats.map((c, i) => ({ c, f: all.facts[i] })).filter((x) => x.f.messages > 0 || x.f.waiting)
    .sort((a, b) => (b.f.last || "").localeCompare(a.f.last || "")).slice(0, 30);
  for (const { c, f } of changed) {
    console.log(`\n== ${f.key} · ${f.who} · ${f.kind} · ${f.messages} new` + (f.waiting ? ` · waiting since ${f.since} (${f.unread} unanswered${f.kind === "group" ? `, ${f.mentions} name you` : ""})` : ""));
    for (const l of c.lines.slice(-40)) console.log(`${stamp(l.at)} ${l.mine ? "me" : l.who}: ${l.text.slice(0, 300)}`);
  }
  if (!changed.length) console.log("(no new lines)");
} else if (cmd === "start") {
  if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });
  writeJson(readingFile, { schema: `${SCHEMA}/reading@1`, startedAt: iso(new Date()), done: false, lines: [] });
  console.log("reading started; save your files in my-chats/data/.work/");
} else if (cmd === "push") {
  lockReading();
  const r = reading();
  if (r.done) fail("the reading is done: no more lines");
  const typed = String(args.join(" ") || "").trim();
  ownWords(typed, "the line");
  const line = fill(typed, allFacts(14));
  if (!line) fail("empty line");
  if (/\bundefined\b|\bNaN\b|\bnull\b|\{|\}/.test(line)) fail(`refused, the line is broken: ${line}`);
  if (line.length > 200) fail("refused, the line is longer than 200 characters");
  // "**0 groups** wrote" is not a finding.
  const bold = (line.match(/\*\*[^*]+\*\*/g) || []).join(" ");
  const nums = (bold || line).match(/\d[\d,]*/g) || [];
  if (nums.length && nums.every((x) => Number(x.replace(/,/g, "")) === 0)) fail("refused, a 0 is not a finding: say what is there, or leave the line out");
  if (r.lines.includes(line)) fail("that line is already there");
  r.lines.push(line);
  writeJson(readingFile, r);
  console.log(`line ${r.lines.length}: ${line}`);
} else if (cmd === "gift") {
  const gift = giftOf(workJson(args.join(" ").trim()), allFacts(14));
  lockReading();
  const r = reading();
  if (r.done) fail("the reading is done: the gift comes while you read");
  if (r.gift) fail("there is a gift already: one is enough");
  r.gift = { ...gift, at: iso(new Date()) };
  writeJson(readingFile, r);
  console.log("gift: " + JSON.stringify(r.gift));
} else if (cmd === "profile") {
  const p = workJson(args.join(" ").trim());
  if (!p || typeof p !== "object" || Array.isArray(p)) fail("the profile must be an object");
  const all = allFacts(30);
  const month = all.chats.map((c) => factsOf(c, dayStart(-30), all.me));
  const out = { schema: `${SCHEMA}/profile@1`, at: iso(new Date()) };
  // Only how they write comes from you: a few words, no number.
  if (typeof p.tone === "string" && p.tone.trim()) { ownWords(p.tone, "the tone"); out.tone = p.tone.trim().slice(0, 80); }
  if (all.me) out.name = all.me;
  const people = topPeople(month, 6);
  if (people.length) { out.people = people.slice(0, 3).map((f) => f.who); if (people.length > 3) out.peopleMore = people.length - 3; }
  out.chats = all.chats.length;
  out.groups = all.chats.filter((c) => c.group).length;
  out.messages30 = month.reduce((s, f) => s + f.messages, 0);
  out.mine30 = month.reduce((s, f) => s + f.mine, 0);
  const busy = busiest(month);
  if (busy) out.busiest = { name: busy.who, count: busy.messages };
  // How fast they answer a person: the middle of every wait, from the first unanswered line to theirs.
  const waits = [];
  for (const c of all.chats) {
    if (c.group) continue;
    let from = null;
    for (const l of c.lines) {
      if (l.at < dayStart(-30)) continue;
      if (!l.mine && !from) from = l.at;
      else if (l.mine && from) { const m = (l.at - from) / 60000; if (m < 3 * 24 * 60) waits.push(m); from = null; }
    }
  }
  if (waits.length >= 3) { waits.sort((a, b) => a - b); out.replyMinutes = Math.round(waits[Math.floor(waits.length / 2)]); }
  writeJson(path.join(dataDir, "profile.json"), out);
  console.log("profile written: " + Object.keys(out).join(", "));
} else if (cmd === "latest") {
  const l = workJson(args.join(" ").trim());
  if (!l || typeof l !== "object" || Array.isArray(l)) fail("latest.json must be an object");
  if (typeof l.headline !== "string" || !l.headline.trim()) fail("latest.json needs a headline (\"Nobody is waiting for your answer\" is one)");
  const all = allFacts(14);
  for (const k of ["headline"]) { ownWords(l[k], k); l[k] = fill(l[k], all); }
  if (l.lead && typeof l.lead === "object" && typeof l.lead.why === "string") ownWords(l.lead.why, "lead.why");
  cards(l, all);
  const active = all.facts.filter((f) => f.messages > 0);
  const n = new Date();
  Object.assign(l, {
    schema: `${SCHEMA}/my-chats@1`, example: false, generatedAt: iso(n), since: iso(all.since),
    chatsRead: all.chats.length, arrived: active.reduce((s, f) => s + f.messages - f.mine, 0),
    source: source ? source.cabinet : null
  });
  if (l.leftOut && typeof l.leftOut === "object") {
    l.leftOut = { chats: (Array.isArray(l.leftOut.chats) ? l.leftOut.chats : []).map((k) => chatFor(k, all.facts, "leftOut")).filter((f) => f.messages > 0).map((f) => ({ name: f.who, count: f.messages })) };
    l.leftOut.count = l.leftOut.chats.reduce((s, x) => s + x.count, 0);
    if (!l.leftOut.count) delete l.leftOut;
  }
  writeJson(path.join(dataDir, "latest.json"), l);
  writeJson(path.join(dataDir, "status.json"), { at: iso(n), ok: true });
  console.log("latest.json written, and status.json");
} else if (cmd === "off") {
  const why = String(args.join(" ") || "").trim() || "The chats could not be read.";
  writeJson(path.join(dataDir, "status.json"), { at: iso(new Date()), ok: false, why: why.slice(0, 240) });
  console.log("status.json written: ok false");
} else if (cmd === "done") {
  const r = reading();
  r.done = true;
  writeJson(readingFile, r);
  try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { console.log("my-chats/data/.work/ is busy: delete it in your next call"); }
  console.log("reading done");
} else {
  fail("use where, read, start, push, gift, profile, latest, off or done");
}
