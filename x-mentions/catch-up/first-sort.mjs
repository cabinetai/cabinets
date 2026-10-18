#!/usr/bin/env node
// The X Digest helper. The morning routine reads X only through this file, and
// writes every file the page reads only through it, so every number, name, quote,
// time and link on the page comes from X and never from the agent's typing.
//
//   node catch-up/first-sort.mjs <command>      (from the cabinet root)
//
//   start [--morning]   read the mentions and the person's own posts once, and keep them
//   needs               the mentions nobody answered yet, oldest first
//   list <ref>          one mention in full, with the post it answers or quotes
//   push '<line>'       one line for the first reading's live page
//   gift @gift.json     the first reading's one gift
//   profile @p.json     what the first reading learned ("This is you")
//   latest @l.json      the morning page
//   done                the run is over
//   fail '<why>'        the run could not read X; the page shows why
//
// Every read costs the person money (X charges per post), so `start` makes at most
// two calls and keeps what it got in data/.work/x.json for the rest of the run.

import fs from "node:fs";
import path from "node:path";

const APP = "catch-up";
const DATA = path.join(APP, "data");
const WORK = path.join(DATA, ".work");
const CACHE = path.join(WORK, "x.json");
const API = (process.env.X_API_BASE || "https://api.x.com/2").replace(/\/$/, "");
const TOKEN = process.env.X_ACCESS_TOKEN || "";
const ME_ID = process.env.X_USER_ID || "";
const ME_NAME = (process.env.X_USERNAME || "").replace(/^@/, "");
const DAY = 86400000;
const FIRST_DAYS = 7;
const MAX_MENTIONS = 50;
const MAX_MINE = 20;
const MAX_WAITING = 12;
const MAX_LINES = 6;
const REPLY_MAX = 280;
/** X's pay-per-use prices, per item returned (docs.x.com pricing, October 2026). */
const PRICE = { post: 0.005, user: 0.01, owned: 0.001 };
const SCHEMA = "x/digest@1";

const FIELDS =
  "tweet.fields=created_at,author_id,conversation_id,in_reply_to_user_id,referenced_tweets,public_metrics" +
  "&expansions=author_id,referenced_tweets.id,referenced_tweets.id.author_id" +
  "&user.fields=username,name,verified,profile_image_url";

// ── Small helpers ────────────────────────────────────────────────────────

function say(line) { process.stdout.write(line + "\n"); }
function stop(message, code = 1) { process.stderr.write(message + "\n"); process.exit(code); }
function nowIso() { return new Date().toISOString(); }
function readJson(file) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; } }
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + "\n");
  fs.renameSync(tmp, file);
}
function plural(n, one, many) { return `${n} ${n === 1 ? one : many}`; }
function timeZone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; } }
function ago(iso) {
  const h = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 3600000));
  return h < 1 ? "just now" : h < 48 ? `${h}h ago` : `${Math.round(h / 24)} days ago`;
}
function short(text, max = 90) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}
function postLink(username, id) { return `https://x.com/${encodeURIComponent(username)}/status/${encodeURIComponent(id)}`; }

/** A file the agent gives as `@name.json`, from data/.work/ only. */
function given(arg) {
  if (!arg || !arg.startsWith("@")) stop("Give a file as @name.json (written into catch-up/data/.work/).");
  const name = arg.slice(1);
  if (name.includes("/") || name.includes("\\")) stop("Give the file by its name only; it must be in catch-up/data/.work/.");
  const value = readJson(path.join(WORK, name));
  if (!value || typeof value !== "object") stop(`catch-up/data/.work/${name} is missing or is not JSON.`);
  return value;
}

/** Words the agent writes hold no numbers, except clock times like 9:30. */
function typedNumber(words) {
  return /\d/.test(String(words || "").replace(/\b\d{1,2}:\d{2}\b/g, ""));
}

function cache() {
  const c = readJson(CACHE);
  if (!c) stop("Run `start` first.");
  return c;
}
function firstReading() { return !fs.existsSync(path.join(DATA, "profile.json")); }

// ── Reading X ────────────────────────────────────────────────────────────

class XRefused extends Error {}

async function get(pathAndQuery) {
  let res;
  try {
    res = await fetch(API + pathAndQuery, { headers: { Authorization: `Bearer ${TOKEN}` } });
  } catch {
    throw new XRefused("Cabinet could not reach X. Check the internet connection and press Try again.");
  }
  const body = await res.text();
  if (res.status === 401) throw new XRefused("X didn't accept the key. Open X in Integrations and connect it again.");
  if (res.status === 402 || (res.status === 429 && /usage.?cap/i.test(body)))
    throw new XRefused("Your X account is out of credits or hit its spending limit. Add credits in X's Developer Console, then press Try again.");
  if (res.status === 429) throw new XRefused("X asked Cabinet to slow down. Try again in a few minutes.");
  if (res.status === 403) throw new XRefused("X doesn't let this app read mentions. Check that the app sits inside a project in X's Developer Console.");
  if (!res.ok) throw new XRefused(`X answered with an error (${res.status}). Try again later.`);
  try { return JSON.parse(body); } catch { throw new XRefused("X sent an answer Cabinet could not read. Try again later."); }
}

function count(answer) {
  return {
    posts: (answer.data || []).length + ((answer.includes && answer.includes.tweets) || []).length,
    users: ((answer.includes && answer.includes.users) || []).length,
  };
}

function kindOf(post) {
  const refs = post.referenced_tweets || [];
  if (refs.some((r) => r.type === "quoted" && r.mine)) return "quote";
  if (post.in_reply_to_user_id === ME_ID) return "reply";
  return "mention";
}

async function start(morning) {
  if (!TOKEN || !ME_ID || !ME_NAME) {
    fail("X is not connected. Press Connect X.");
    stop("X is not connected (no X_ACCESS_TOKEN, X_USER_ID or X_USERNAME).", 2);
  }
  const now = Date.now();
  const last = readJson(path.join(DATA, "latest.json"));
  const lastAt = morning && last && !last.example ? Date.parse(last.generatedAt) : NaN;
  const from = new Date(Math.max(now - FIRST_DAYS * DAY, Number.isFinite(lastAt) ? lastAt : now - (morning ? DAY : FIRST_DAYS * DAY)));
  const startTime = from.toISOString().replace(/\.\d{3}Z$/, "Z");

  if (firstReading()) writeJson(path.join(DATA, "reading.json"), { startedAt: nowIso(), done: false, lines: [], gift: null });

  let mentions;
  let mine;
  try {
    mentions = await get(`/users/${ME_ID}/mentions?max_results=${MAX_MENTIONS}&start_time=${startTime}&${FIELDS}`);
    mine = await get(`/users/${ME_ID}/tweets?max_results=${MAX_MINE}&start_time=${startTime}&exclude=retweets&tweet.fields=created_at,conversation_id,referenced_tweets,public_metrics`);
  } catch (error) {
    if (error instanceof XRefused) { fail(error.message); stop(error.message, 4); }
    throw error;
  }

  const users = {};
  for (const u of (mentions.includes && mentions.includes.users) || [])
    users[u.id] = { name: u.name, username: u.username, verified: !!u.verified, pic: u.profile_image_url || "" };
  const others = {};
  for (const t of (mentions.includes && mentions.includes.tweets) || [])
    others[t.id] = { text: t.text, authorId: t.author_id, at: t.created_at };

  const own = (mine.data || []).map((t) => ({
    id: t.id, text: t.text, at: t.created_at, conv: t.conversation_id,
    replyTo: ((t.referenced_tweets || []).find((r) => r.type === "replied_to") || {}).id || null,
    metrics: t.public_metrics || {},
  }));

  const list = (mentions.data || [])
    .filter((t) => t.author_id !== ME_ID)
    .map((t) => {
      const refs = (t.referenced_tweets || []).map((r) => ({ type: r.type, id: r.id, mine: (others[r.id] || {}).authorId === ME_ID }));
      const post = { ...t, referenced_tweets: refs };
      // Answered: a reply to this post, or a later reply in its thread that names its writer.
      // A reply to someone else in the same thread does not count.
      const at = "@" + String((users[t.author_id] || {}).username || "").toLowerCase();
      const answered = own.some((o) => o.replyTo === t.id ||
        (!!o.replyTo && o.conv === t.conversation_id && Date.parse(o.at) > Date.parse(t.created_at) &&
          at.length > 1 && new RegExp(at + "\\b").test(String(o.text).toLowerCase())));
      const about = refs.find((r) => r.mine) || null;
      return {
        postId: t.id, text: t.text, at: t.created_at, authorId: t.author_id, conv: t.conversation_id,
        kind: kindOf(post), answered, about: about ? about.id : null, metrics: t.public_metrics || {},
      };
    })
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
    .map((m, i) => ({ ref: `m${i + 1}`, ...m }));

  const reads = count(mentions);
  const c = {
    startedAt: nowIso(), morning, from: from.toISOString(), to: new Date(now).toISOString(),
    more: !!(mentions.meta && mentions.meta.next_token),
    me: { id: ME_ID, username: ME_NAME },
    mentions: list, users, others, own,
    reads: { posts: reads.posts, users: reads.users, owned: own.length },
    pushed: [],
  };
  writeJson(CACHE, c);

  const waiting = list.filter((m) => !m.answered);
  say(`Read X for @${ME_NAME} since ${c.from} (${morning ? "morning" : "first reading"}).`);
  say(`${plural(list.length, "post", "posts")} mentioned you, from ${plural(new Set(list.map((m) => m.authorId)).size, "person", "people")}.`);
  say(`${plural(waiting.length, "is", "are")} not answered yet; you answered ${list.length - waiting.length}.`);
  if (c.more) say("X had more mentions than one page; only the newest page was read, to save credits.");
  say(`This read cost about $${cost(c).usd.toFixed(3)} of the person's X credits.`);
  say("Next: `needs`, then `list <ref>` only where you need the context.");
}

function cost(c) {
  const usd = c.reads.posts * PRICE.post + c.reads.users * PRICE.user + c.reads.owned * PRICE.owned;
  return { posts: c.reads.posts + c.reads.owned, users: c.reads.users, usd: Math.round(usd * 1000) / 1000 };
}

function who(c, m) {
  const u = c.users[m.authorId] || { name: "Someone on X", username: "unknown" };
  return u;
}

function needs() {
  const c = cache();
  const open = c.mentions.filter((m) => !m.answered);
  const quotes = c.mentions.filter((m) => m.kind === "quote");
  if (quotes.length) {
    say(`Quotes of your posts (give each a gist in latest's "quoted"):`);
    for (const m of quotes) say(`${m.ref} · ${who(c, m).name} · "${short(m.text, 160)}"`);
    say("");
  }
  if (!open.length) { say("Nobody is waiting: every mention was answered, or there were none."); return; }
  say(`${plural(open.length, "mention", "mentions")} not answered, oldest first:`);
  for (const m of open) {
    const u = who(c, m);
    const about = m.about && c.others[m.about] ? ` · about your post "${short(c.others[m.about].text, 50)}"` : "";
    const q = /\?/.test(m.text) ? " · asks a question" : "";
    say(`${m.ref} · ${u.name} @${u.username} · ${m.kind}${about} · ${ago(m.at)}${q}\n    "${short(m.text, 220)}"`);
  }
}

function listOne(ref) {
  const c = cache();
  const m = c.mentions.find((x) => x.ref === ref);
  if (!m) stop(`No mention ${ref}. Run \`needs\` to see the refs.`);
  const u = who(c, m);
  say(`${m.ref} · ${u.name} @${u.username} · ${m.kind} · ${m.at}${m.answered ? " · you answered it" : ""}`);
  say(`"${m.text}"`);
  const about = m.about && c.others[m.about];
  if (about) say(`It ${m.kind === "quote" ? "quotes" : "answers"} your post: "${about.text}"`);
  const mine = c.own.filter((o) => o.conv === m.conv);
  for (const o of mine) say(`  you, ${o.at}: "${short(o.text, 200)}"`);
}

// ── Lines, gift, profile ─────────────────────────────────────────────────

function counts(c) {
  const open = c.mentions.filter((m) => !m.answered);
  return {
    mentions: c.mentions.length,
    people: new Set(c.mentions.map((m) => m.authorId)).size,
    waiting: new Set(open.filter((m) => !noise(c, m)).map((m) => m.authorId)).size,
    answered: c.mentions.length - open.length,
    replies: c.mentions.filter((m) => m.kind === "reply").length,
    quotes: c.mentions.filter((m) => m.kind === "quote").length,
  };
}

/** Fills {name:|one|many} placeholders; refuses typed numbers and unknown bold names. */
function fill(line, c) {
  const n = counts(c);
  let bad = null;
  const filled = line.replace(/\{(\w+):\|([^|}]*)\|([^}]*)\}/g, (all, key, one, many) => {
    if (!(key in n)) { bad = `There is no count called {${key}:…}. Use one of: ${Object.keys(n).join(", ")}.`; return all; }
    return `\u0000${plural(n[key], one, many)}\u0001`;
  });
  if (bad) stop(bad);
  if (typedNumber(filled.replace(/\u0000[^\u0001]*\u0001/g, ""))) stop("A line holds a number you typed. Use a count placeholder instead, like {mentions:|post|posts}.");
  const names = new Set(Object.values(c.users).flatMap((u) => [u.name, "@" + u.username]).concat(["@" + ME_NAME]));
  for (const b of filled.matchAll(/\*\*([^*]+)\*\*/g)) {
    const inner = b[1];
    if (/\u0000/.test(inner)) continue;
    if (!names.has(inner.trim())) stop(`"${inner}" in bold is not a name X gave. Write names exactly as X shows them, or drop the bold.`);
  }
  return filled.replace(/[\u0000\u0001]/g, "");
}

function push(line) {
  if (!firstReading()) stop("`push` is for the first reading only.");
  const c = cache();
  if (!line || !line.trim()) stop("Give the line in quotes.");
  if (/\b(I|I'm|I've|we)\b/.test(line)) stop("A line is about the person, never about yourself.");
  const file = path.join(DATA, "reading.json");
  const r = readJson(file) || { startedAt: nowIso(), done: false, lines: [], gift: null };
  if (r.lines.length >= MAX_LINES) stop(`The page shows at most ${MAX_LINES} lines.`);
  r.lines.push(fill(line.trim(), c));
  writeJson(file, r);
  say(`Pushed: ${r.lines[r.lines.length - 1]}`);
}

function gift(arg) {
  if (!firstReading()) stop("`gift` is for the first reading only.");
  const c = cache();
  const g = given(arg);
  const open = c.mentions.filter((m) => !m.answered);
  let out;
  if (open.length) {
    if (g.kind !== "waiting") stop("Someone is waiting for an answer: give a `waiting` gift with their messageId and a gist.");
    const m = open.find((x) => x.ref === g.messageId);
    if (!m) stop(`${g.messageId} is not an unanswered mention. Pick one from \`needs\`.`);
    if (!g.gist || typedNumber(g.gist)) stop("Give a short gist of what they want, with no numbers.");
    const u = who(c, m);
    out = { kind: "waiting", at: nowIso(), name: u.name, username: u.username, said: m.text, gist: String(g.gist).trim(), postAt: m.at, link: postLink(u.username, m.postId) };
  } else {
    if (g.kind !== "calm") stop("Nobody is waiting, so the gift is `{\"kind\":\"calm\"}`.");
    out = { kind: "calm", at: nowIso() };
  }
  const file = path.join(DATA, "reading.json");
  const r = readJson(file) || { startedAt: nowIso(), done: false, lines: [], gift: null };
  r.gift = out;
  writeJson(file, r);
  say(`Gift saved: ${out.kind}.`);
}

function profile(arg) {
  const c = cache();
  const p = given(arg);
  if (!p.name || typedNumber(p.name)) stop("Give the person's first name.");
  const byAuthor = {};
  for (const m of c.mentions) if (!noise(c, m)) byAuthor[m.authorId] = (byAuthor[m.authorId] || 0) + 1;
  const regulars = Object.entries(byAuthor)
    .filter(([, n]) => n > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, n]) => ({ name: (c.users[id] || {}).name || "", username: (c.users[id] || {}).username || "", count: n }));
  const busiest = c.own.slice().sort((a, b) => (b.metrics.reply_count || 0) - (a.metrics.reply_count || 0))[0];
  const hours = c.own.map((o) => new Date(o.at).getHours()).sort((a, b) => a - b);
  const out = {
    at: nowIso(), name: String(p.name).trim(), username: ME_NAME,
    days: Math.max(1, Math.round((Date.parse(c.to) - Date.parse(c.from)) / DAY)),
    ...counts(c),
    posts: c.own.length,
    regulars,
    busiest: busiest && (busiest.metrics.reply_count || 0) > 0
      ? { text: busiest.text, replies: busiest.metrics.reply_count || 0, likes: busiest.metrics.like_count || 0, link: postLink(ME_NAME, busiest.id) }
      : null,
    active: hours.length ? { from: hours[0], to: hours[hours.length - 1] } : null,
  };
  writeJson(path.join(DATA, "profile.json"), out);
  say(`Profile saved for ${out.name} (@${ME_NAME}).`);
}

// ── The morning page ─────────────────────────────────────────────────────

function pulse(c) {
  const from = Date.parse(c.from);
  const to = Date.parse(c.to);
  const stepHours = Math.max(1, Math.ceil((to - from) / 3600000 / 24));
  const n = Math.max(1, Math.ceil((to - from) / (stepHours * 3600000)));
  const countsArr = new Array(n).fill(0);
  const you = new Array(n).fill(0);
  return { start: c.from, stepHours, counts: countsArr, you, add(m, open) {
    const i = Math.min(n - 1, Math.max(0, Math.floor((Date.parse(m.at) - from) / (stepHours * 3600000))));
    countsArr[i] += 1;
    if (open) you[i] += 1;
  } };
}

function latest(arg) {
  const c = cache();
  const l = given(arg);
  if (!l.headline || typedNumber(l.headline)) stop("Give a one-sentence headline with no numbers (clock times are fine).");
  const rows = Array.isArray(l.waiting) ? l.waiting : [];
  if (rows.length > MAX_WAITING) stop(`Keep at most ${MAX_WAITING} people in waiting, the ones who really ask something.`);
  const seen = new Set();
  const waiting = rows.map((w) => {
    const m = c.mentions.find((x) => x.ref === w.id);
    if (!m) stop(`${w.id} is not a mention ref. Use the refs from \`needs\`.`);
    if (m.answered) stop(`${w.id} was already answered on X, so it is not waiting.`);
    if (seen.has(w.id)) stop(`${w.id} is in waiting twice.`);
    seen.add(w.id);
    if (!w.gist || typedNumber(w.gist)) stop(`${w.id}: give a gist with no numbers.`);
    const reply = String(w.reply || "").trim();
    if (!reply) stop(`${w.id}: write a reply draft in the person's voice.`);
    if (reply.replace(/\[([^\]]*)\]/g, "$1").length > REPLY_MAX) stop(`${w.id}: the reply is longer than X's ${REPLY_MAX} characters.`);
    const u = who(c, m);
    const about = m.about && c.others[m.about] ? { text: c.others[m.about].text, at: c.others[m.about].at, link: postLink(ME_NAME, m.about) } : null;
    return {
      id: m.ref, postId: m.postId,
      who: { name: u.name, username: u.username, verified: !!u.verified, pic: /^https:\/\/pbs\.twimg\.com\//.test(u.pic) ? u.pic : "" },
      kind: m.kind, said: m.text, at: m.at,
      metrics: { replies: m.metrics.reply_count || 0, reposts: m.metrics.retweet_count || 0, likes: m.metrics.like_count || 0, views: m.metrics.impression_count || 0 },
      about, gist: String(w.gist).trim(), urgent: w.urgent === true, reply,
      link: postLink(u.username, m.postId),
    };
  });

  const quotedGists = {};
  for (const q of Array.isArray(l.quoted) ? l.quoted : []) {
    if (!q || !q.id) continue;
    if (!c.mentions.some((m) => m.ref === q.id && m.kind === "quote")) stop(`${q.id} is not a quote of the person's post. Use a ref that \`needs\` shows as a quote.`);
    if (!q.gist || typedNumber(q.gist)) stop(`${q.id}: give the quote a gist with no numbers.`);
    quotedGists[q.id] = String(q.gist).trim();
  }

  const n = counts(c);
  const p = pulse(c);
  const listed = new Set(waiting.map((w) => w.id));
  for (const m of c.mentions) p.add(m, listed.has(m.ref));
  delete p.add;
  const out = {
    schema: SCHEMA,
    generatedAt: nowIso(), since: c.from, timeZone: timeZone(),
    person: { name: l.person && l.person.name ? String(l.person.name).trim() : "", username: ME_NAME },
    headline: String(l.headline).trim(),
    totals: { ...n, skipped: c.mentions.filter((m) => !m.answered).length - waiting.length, more: c.more },
    pulse: p,
    cost: cost(c),
    waiting,
    quoted: quotedOf(c, quotedGists),
    posts: postsOf(c),
    regulars: regularsOf(c),
    skip: skipOf(c, listed),
  };
  writeJson(path.join(DATA, "latest.json"), out);
  say(`Page written: ${plural(waiting.length, "person", "people")} waiting, headline "${out.headline}".`);
}

// The other boxes come from what `start` already read, so they cost nothing more.

function whoOut(u) {
  return { name: u.name, username: u.username, verified: !!u.verified, pic: /^https:\/\/pbs\.twimg\.com\//.test(u.pic || "") ? u.pic : "" };
}

/** Quotes of the person's posts, newest first, with the agent's gist when it gave one. */
function quotedOf(c, gists) {
  return c.mentions
    .filter((m) => m.kind === "quote")
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 6)
    .map((m) => {
      const u = who(c, m);
      const about = m.about && c.others[m.about] ? { text: c.others[m.about].text, at: c.others[m.about].at, link: postLink(ME_NAME, m.about) } : null;
      return {
        id: m.ref, postId: m.postId, who: whoOut(u), said: m.text, at: m.at, answered: m.answered,
        metrics: { replies: m.metrics.reply_count || 0, reposts: m.metrics.retweet_count || 0, likes: m.metrics.like_count || 0, views: m.metrics.impression_count || 0 },
        about, gist: gists[m.ref] || "", link: postLink(u.username, m.postId),
      };
    });
}

/** The person's own posts since the window opened, newest first, and how many mentions each drew. */
function postsOf(c) {
  return c.own
    .filter((o) => !o.replyTo)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 5)
    .map((o) => ({
      postId: o.id, text: o.text, at: o.at,
      metrics: { replies: o.metrics.reply_count || 0, reposts: o.metrics.retweet_count || 0, likes: o.metrics.like_count || 0, quotes: o.metrics.quote_count || 0 },
      open: c.mentions.filter((m) => m.conv === o.conv && !m.answered).length,
      link: postLink(ME_NAME, o.id),
    }));
}

/** Who wrote to the person most, and how many of theirs are still unanswered. */
function regularsOf(c) {
  const by = {};
  for (const m of c.mentions) {
    if (noise(c, m)) continue;
    const r = (by[m.authorId] ||= { count: 0, open: 0, last: m.at });
    r.count += 1;
    if (!m.answered) r.open += 1;
    if (Date.parse(m.at) > Date.parse(r.last)) r.last = m.at;
  }
  return Object.entries(by)
    .filter(([, r]) => r.count > 1)
    .sort((a, b) => b[1].count - a[1].count || Date.parse(b[1].last) - Date.parse(a[1].last))
    .slice(0, 5)
    .map(([id, r]) => ({ ...whoOut(c.users[id] || { name: "Someone on X", username: "unknown" }), count: r.count, open: r.open, last: r.last }));
}

/** An account that calls itself a bot. */
const BOT_NAME = /bot\b|_bot|bot_/i;

/** A giveaway or airdrop: "claim your 5 ETH", "free crypto". */
const GIVEAWAY = /\b(giveaway|airdrop|claim (your|now)|free (eth|btc|crypto|nft|money)|\d+ ?(eth|btc|usdt))\b/i;

/** A mention that wants nothing from the person: a bot, a giveaway, a "gm". */
function noise(c, m) {
  const u = c.users[m.authorId] || {};
  return BOT_NAME.test(u.username || "") || GIVEAWAY.test(m.text) || GIVEAWAY.test(u.name || "") || shortPost(m.text);
}

/** A mention with almost no words of its own: "gm", a thank-you, a lone emoji. */
function shortPost(text) {
  const own = String(text || "").replace(/@\w+/g, "").replace(/https?:\/\/\S+/g, "").replace(/[\s\p{P}\p{Extended_Pictographic}]/gu, "");
  return own.length < 6 || /^(gm|gn|ty|thanks?|thankyou|lol|wow|nice|congrats)+$/i.test(own);
}

/** The unanswered mentions left off Waiting on you, counted by why they can wait. */
function skipOf(c, listed) {
  const left = c.mentions.filter((m) => !m.answered && !listed.has(m.ref));
  const perAuthor = {};
  for (const m of c.mentions) perAuthor[m.authorId] = (perAuthor[m.authorId] || 0) + 1;
  const reason = (m) => {
    const u = c.users[m.authorId] || {};
    if (BOT_NAME.test(u.username || "") || GIVEAWAY.test(m.text) || GIVEAWAY.test(u.name || "") || (perAuthor[m.authorId] > 3 && /https?:\/\//.test(m.text))) return "bots";
    if (shortPost(m.text)) return "short";
    return "other";
  };
  const out = { count: left.length, bots: 0, short: 0, other: 0, examples: [] };
  for (const m of left) {
    out[reason(m)] += 1;
    if (out.examples.length < 4) {
      const u = who(c, m);
      out.examples.push({ name: u.name, username: u.username, said: short(m.text, 120), link: postLink(u.username, m.postId) });
    }
  }
  return out;
}

function status(ok, why) {
  writeJson(path.join(DATA, "status.json"), ok ? { at: nowIso(), ok: true } : { at: nowIso(), ok: false, why });
}

function done() {
  const file = path.join(DATA, "reading.json");
  const r = readJson(file);
  if (r && !r.done) { r.done = true; writeJson(file, r); }
  status(true);
  const c = readJson(CACHE);
  say(c ? `Done. This run cost about $${cost(c).usd.toFixed(3)} of the person's X credits.` : "Done.");
}

function fail(why) {
  const words = String(why || "").trim() || "The reading did not finish. Try again.";
  status(false, words);
  const file = path.join(DATA, "reading.json");
  const r = readJson(file);
  if (r && !r.done) { r.done = true; r.failed = words; writeJson(file, r); }
}

// ── Commands ─────────────────────────────────────────────────────────────

const [cmd, ...rest] = process.argv.slice(2);
switch (cmd) {
  case "start": await start(rest.includes("--morning")); break;
  case "needs": needs(); break;
  case "list": listOne(rest[0]); break;
  case "push": push(rest.join(" ")); break;
  case "gift": gift(rest[0]); break;
  case "profile": profile(rest[0]); break;
  case "latest": latest(rest[0]); break;
  case "done": done(); break;
  case "fail": fail(rest.join(" ")); say("Saved. The page shows why, with Try again."); break;
  default:
    stop("Commands: start [--morning], needs, list <ref>, push '<line>', gift @f.json, profile @f.json, latest @f.json, done, fail '<why>'.");
}
