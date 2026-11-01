// The Instagram Digest helper: every number on Your Instagram comes from compute, so its counting
// is tested here. A cabinet is copied verbatim into people's workspaces, which is why this file
// lives with the registry's tests and not next to the script.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { accountCalls, callsFor, cleanText, commentsFrom, computeRead, giftOf, insightsFrom, latestOf, postNumbers, postsToRead, threadsToRead, titleFrom, troubleOf, wordsOn } from "../../../instagram-digest/your-instagram/first-read.mjs";

const SCRIPT = fileURLToPath(new URL("../../../instagram-digest/your-instagram/first-read.mjs", import.meta.url));
const NOW = new Date("2026-10-15T09:00:00");
const HOUR = 3600000;
const stamp = (hoursAgo) => new Date(NOW.getTime() - hoursAgo * HOUR).toISOString().replace(/\.\d+Z$/, "+0000");
const me = (over = {}) => ({ user_id: "1784", username: "juno", name: "Juno", account_type: "MEDIA_CREATOR", followers_count: 1000, follows_count: 5, media_count: 3, ...over });
const post = (id, hoursAgo, likes, over = {}) => ({
  id, caption: "Post " + id, media_type: "IMAGE", media_product_type: "FEED", permalink: `https://www.instagram.com/p/${id}/`,
  timestamp: stamp(hoursAgo), like_count: likes, comments_count: 0, ...over
});
const nums = (views, reach = views, saves = 0, shares = 0) => ({ views, reach, saves, shares });
const seen = (id, views, over = {}) => ({ mediaId: id, views, reach: views, likes: 0, comments: 0, saves: 0, shares: 0, at: "2026-10-14T09:00:00", ...over });
const prior = (over = {}) => ({
  generatedAt: "2026-10-14T09:00:00", account: { username: "juno", userId: "1784", followers: 900 },
  posts: [], next: [], history: [{ day: "2026-10-14", followers: 900 }], known: [], ...over
});

test("a post in known subtracts, and only a new one counts whole", () => {
  const { latest, first } = computeRead({
    me: me(), now: NOW, prev: prior({ known: [seen("a", 900, { saves: 10 })] }),
    media: [post("a", 100, 5), post("new", 5, 7), post("oldnever", 400, 50)],
    numbers: { a: nums(1000, 800, 14), new: nums(70), oldnever: nums(5000) }
  });
  assert.equal(first, false);
  const by = Object.fromEntries(latest.posts.map((p) => [p.mediaId, p]));
  assert.equal(by.a.gained.views, 100);
  assert.equal(by.a.gained.saves, 4);
  assert.equal(by.new.gained.views, 70);
  // Posted long before the last read and never read: its lifetime is not this window's gain.
  assert.equal(by.oldnever.gained, undefined);
  assert.equal(latest.totals.views, 170);
  assert.equal(latest.totals.saves, 4);
  assert.equal(latest.totals.followers, 100);
  assert.equal(latest.totals.newPosts, 1);
});

test("Catch up now the same day stays against the day before", () => {
  const today = prior({ generatedAt: "2026-10-15T08:00:00", known: [seen("a", 990), seen("new", 50)], history: [{ day: "2026-10-14" }, { day: "2026-10-15" }] });
  const yesterday = prior({ known: [seen("a", 900)] });
  const { latest } = computeRead({ me: me(), now: NOW, prev: today, earlier: yesterday, media: [post("a", 100, 1), post("new", 5, 1)], numbers: { a: nums(1000), new: nums(70) } });
  assert.equal(latest.posts.find((p) => p.mediaId === "a").gained.views, 100, "subtracts yesterday's known, not this morning's");
  assert.equal(latest.posts.find((p) => p.mediaId === "new").gained.views, 70, "still whole since yesterday");
  assert.equal(latest.totals.views, 170);
  assert.equal(new Date(latest.since).getTime(), new Date("2026-10-14T09:00:00").getTime());
  assert.equal(latest.history.filter((h) => h.day === "2026-10-15").length, 1, "one entry a day");
});

test("known keeps every post read, and best can be an older one", () => {
  const media = Array.from({ length: 30 }, (_, i) => post("p" + i, (i + 1) * 24, 10));
  const numbers = Object.fromEntries(media.map((m) => [m.id, nums(100)]));
  numbers.p25 = nums(5000);
  const { latest } = computeRead({ me: me(), now: NOW, prev: prior({ known: media.map((m) => seen(m.id, 100)) }), media, numbers });
  assert.equal(latest.known.length, 30);
  const best = latest.posts.find((p) => p.mark === "best");
  assert.equal(best.mediaId, "p25");
  assert.equal(best.older, true);
  assert.equal(latest.posts.length, 11);
});

test("an older post not read today keeps its numbers from known, never a 0", () => {
  const { latest } = computeRead({ me: me(), now: NOW, prev: prior({ known: [seen("old", 500, { saves: 40, shares: 8 })] }), media: [post("old", 24 * 40, 9)], numbers: {} });
  assert.equal(latest.posts[0].saves, 40);
  assert.equal(latest.posts[0].shares, 8);
  assert.equal(latest.known[0].saves, 40);
});

test("a post Instagram sends no numbers for stays null, and works is honest about likes", () => {
  const media = [10, 12, 14].map((d, i) => post("s" + i, d * 24, 100 * (i + 1)));
  const { latest } = computeRead({ me: me(), now: NOW, media });
  assert.equal(latest.posts[0].views, null);
  assert.equal(latest.works.measure, "likes");
  assert.equal(latest.works.format[0].median, 200);
  assert.equal(latest.posts.some((p) => p.mark === "best"), true, "best falls back on likes");
});

test("saves and shares per 1,000 reached decide what works, and groups under 3 hide", () => {
  const reel = { media_product_type: "REELS", media_type: "VIDEO" };
  const media = [post("r1", 96, 1, reel), post("r2", 120, 1, reel), post("r3", 144, 1, reel), post("c1", 168, 1, { media_type: "CAROUSEL_ALBUM" }), post("young", 24, 1, reel)];
  const numbers = { r1: nums(1000, 1000, 10, 10), r2: nums(1000, 1000, 20, 20), r3: nums(1000, 1000, 30, 30), c1: nums(1000, 1000, 90, 90), young: nums(9, 9, 9, 9) };
  const { works } = computeRead({ me: me(), now: NOW, media, numbers }).latest;
  assert.equal(works.measure, "kept");
  assert.equal(works.posts, 4, "a post under 3 days old is left out");
  assert.deepEqual(works.format, [{ label: "Reels", posts: 3, median: 40 }]);
});

test("views at the first read after a day are saved once, and used against the usual", () => {
  const known = ["x", "y", "z"].map((id) => seen(id, 100, { day1: { views: 100, hours: 26 } }));
  const first = computeRead({ me: me(), now: NOW, prev: prior({ known }), media: [post("a", 30, 1), post("x", 500, 1)], numbers: { a: nums(500), x: nums(900) } }).latest;
  assert.deepEqual(first.known.find((k) => k.mediaId === "a").day1, { views: 500, hours: 30 });
  assert.equal(first.posts.find((p) => p.mediaId === "a").firstDay.pace, "ahead");
  const later = new Date(NOW.getTime() + 24 * HOUR);
  const second = computeRead({ me: me(), now: later, prev: first, media: [post("a", 30, 1), post("b", 700, 1)], numbers: { a: nums(800), b: nums(1) } }).latest;
  assert.equal(second.known.find((k) => k.mediaId === "a").day1.views, 500);
  assert.equal(second.known.find((k) => k.mediaId === "b").day1, undefined);
  assert.ok(second.known.find((k) => k.mediaId === "x"), "a post not read today stays known");
});

test("another account counts as a first catch-up, and a new username on the same account does not", () => {
  const prev = prior({ known: [seen("a", 10)] });
  const other = computeRead({ me: me({ user_id: "99", username: "someoneelse" }), now: NOW, prev, media: [post("a", 100, 1)], numbers: { a: nums(1000) } });
  assert.equal(other.first, true);
  assert.equal(other.latest.totals.views, undefined);
  assert.equal(other.latest.history.length, 1);
  assert.equal(other.latest.posts[0].gained, undefined);
  const renamed = computeRead({ me: me({ username: "juno.new" }), now: NOW, prev, media: [post("a", 100, 1)], numbers: { a: nums(1000) } });
  assert.equal(renamed.first, false);
  assert.equal(renamed.latest.posts[0].gained.views, 990);
});

test("on a first read a post under a day old cannot be best", () => {
  const { latest } = computeRead({ me: me(), now: NOW, media: [post("fresh", 3, 1), post("old", 72, 1)], numbers: { fresh: nums(90000), old: nums(3000) } });
  assert.equal(latest.posts.find((p) => p.mark === "best").mediaId, "old");
});

test("quiet is the smallest reach among posts 7 to 60 days old", () => {
  const media = [post("a", 24 * 8, 1), post("b", 24 * 9, 1), post("low", 24 * 20, 1), post("c", 24 * 30, 1), post("past", 24 * 70, 1), post("young", 24 * 2, 1)];
  const numbers = { a: nums(1000), b: nums(900), low: nums(100), c: nums(800), past: nums(1), young: nums(2) };
  const { latest } = computeRead({ me: me(), now: NOW, media, numbers });
  assert.equal(latest.posts.find((p) => p.mark === "quiet").mediaId, "low");
});

test("spans count the posts of those days, most saved and shared first", () => {
  const media = Array.from({ length: 12 }, (_, i) => post("p" + i, (i + 1) * 24, 5));
  const numbers = Object.fromEntries(media.map((m, i) => [m.id, nums(100, 100, i === 11 ? 90 : 1, 1)]));
  const { spans } = computeRead({ me: me(), now: NOW, media, numbers }).latest;
  assert.equal(spans.last28.top[0].mediaId, "p11");
  assert.equal(spans.last28.top[0].kept, 91);
  assert.equal(spans.last7.posts, 6);
});

// ── Comments ──
const talk = (id, username, hoursAgo, text, over = {}) => ({ id, username, timestamp: stamp(hoursAgo), text, like_count: 0, ...over });

test("a comment the account answered is not waiting, and a later question in the thread is", () => {
  const posts = [{ mediaId: "m", title: "Mug", kind: "photo", url: "" }];
  const threads = { m: [
    talk("1", "maya", 20, "Do you ship?", { replies: { data: [talk("2", "juno", 10, "Yes"), talk("3", "maya", 5, "To Canada too?")] } }),
    talk("4", "ben", 8, "Which glaze?", { like_count: 3 }),
    talk("5", "juno", 7, "New batch soon"),
    talk("6", "spam", 6, "Buy now", { hidden: true }),
    talk("7", "old", 24 * 20, "Too old")
  ] };
  const { list, own } = commentsFrom(threads, "juno", posts, NOW);
  assert.deepEqual(list.map((c) => [c.who, c.answered]), [["@maya", false], ["@ben", false], ["@maya", true]]);
  assert.equal(list[0].commentId, "1", "a reply to a reply goes under the comment that started the thread");
  assert.equal(own.m, 2);
});

test("the agent picks and words comments, and everything else comes from compute", () => {
  const threads = { a: [talk("1", "maya", 20, "Is it dishwasher safe?", { like_count: 19 }), talk("2", "ben", 18, "Dishwasher ok?"), talk("3", "lea", 3, "Love it 2 pieces")] };
  const c = computeRead({ me: me(), now: NOW, media: [post("a", 30, 5, { comments_count: 3 })], numbers: { a: nums(100) }, threads });
  const maya = c.comments.find((x) => x.who === "@maya");
  const ben = c.comments.find((x) => x.who === "@ben");
  const l = wordsOn(c, {
    waiting: [{ id: maya.id, gist: "Asks if it is dishwasher safe", short: "A real question.", likes: 9999, since: "2000-01-01" }],
    asks: [{ what: "Dishwasher safe?", ids: [maya.id, ben.id] }]
  });
  assert.equal(l.waiting[0].who, "@maya");
  assert.equal(l.waiting[0].likes, 19);
  assert.equal(l.waiting[0].commentId, "1");
  assert.equal(new Date(l.waiting[0].since).getTime(), timeFor(20));
  assert.equal(l.totals.waiting, 1);
  assert.equal(l.asks[0].people, 2);
  assert.equal(l.recent[0].who, "@lea");
  assert.throws(() => wordsOn(c, { asks: [{ what: "Dishwasher", ids: [maya.id, maya.id] }] }), /at least 2 different people/);
  assert.throws(() => wordsOn(c, { waiting: [{ id: "c99", gist: "x" }] }), /no comment c99/);
});
const timeFor = (hoursAgo) => new Date(stamp(hoursAgo).replace("+0000", "Z")).getTime();

test("a thread that could not be read keeps who was waiting there, and clears nobody", () => {
  const prev = prior({ waiting: [{ id: "w1", who: "@maya", post: "Mug", mediaId: "a", commentId: "1", gist: "Asks about glaze", since: new Date(timeFor(30)).toISOString(), likes: 0 }] });
  const c = computeRead({ me: me(), now: NOW, prev, media: [post("a", 40, 5, { comments_count: 3 })], numbers: { a: nums(100) }, missed: ["a"] });
  const l = wordsOn(c, {});
  assert.equal(l.waiting.length, 1);
  assert.equal(l.waiting[0].who, "@maya");
  assert.equal(l.commentsMissed, 1);
});

test("at the read level nothing about comments is claimed", () => {
  const c = computeRead({ me: me(), now: NOW, readComments: false, media: [post("a", 40, 5)], numbers: { a: nums(100) } });
  assert.equal(c.latest.readComments, false);
  assert.equal(c.latest.totals.comments, undefined);
  assert.throws(() => wordsOn({ ...c, comments: [{ id: "c1", who: "@a", text: "x" }] }, { waiting: [{ id: "c1", gist: "x" }] }), /no comments were read/);
});

test("the agent's numbers never reach the page, and its own must be real", () => {
  const c = computeRead({ me: me(), now: NOW, prev: prior({ known: [seen("a", 900)], next: [{ title: "Mugs again" }] }), media: [post("a", 100, 5), post("b", 200, 4)], numbers: { a: nums(1000), b: nums(40) } });
  const l = wordsOn(c, { posts: [{ id: "p1", gist: "Most views lately", views: 999999 }], next: [{ title: "More mugs", why: "It has 1,000 views", from: "p1", format: "Reel" }] });
  assert.equal(l.posts[0].views, 1000);
  assert.equal(l.posts[0].gist, "Most views lately");
  assert.deepEqual(l.next, [{ id: "n1", title: "More mugs", why: "It has 1,000 views", format: "Reel", from: "p1" }]);
  assert.throws(() => wordsOn(c, { posts: [{ id: "p1", gist: "Up 4,321 views" }] }), /not a number from this catch-up/);
  assert.throws(() => wordsOn(c, { posts: [{ id: "p1", gist: "On pace with your usual first day" }] }), /no first-day number/);
  assert.throws(() => wordsOn(c, { next: [{ title: "Mugs again", why: "Good", from: "p2" }] }), /nothing new backs it/);
  assert.doesNotThrow(() => wordsOn(c, { next: [{ title: "Mugs again", why: "Good", from: "p1" }] }), "built on the post that moved");
  assert.throws(() => wordsOn(c, { next: [{ title: "x", why: "y", from: "p99" }] }), /from is a post id/);
});

test("captions are cleaned, never refused", () => {
  assert.equal(cleanText("Glaze — the long way"), "Glaze, the long way");
  assert.equal(cleanText("The null glaze"), "The null glaze");
  assert.equal(cleanText("null"), "");
  assert.equal(cleanText("Look https://www.instagram.com/p/x/ now"), "Look now");
  assert.equal(titleFrom("🔥 Glazing the speckled mugs, start to finish and beyond it all\n#pottery"), "Glazing the speckled mugs, start to finish and");
  assert.equal(titleFrom("#only #tags"), "");
  const { latest } = computeRead({ me: me(), now: NOW, media: [post("a", 100, 1, { caption: "" })] });
  assert.equal(latest.posts[0].title, "");
  assert.doesNotThrow(() => latestOf(latest));
});

// ── Reads ──
test("the relay's words and Meta's codes are told apart", () => {
  assert.equal(troubleOf({ error: { code: "signed-out" } }), "signed-out");
  assert.equal(troubleOf({ error: { code: 190 } }), "signed-out");
  for (const code of [4, 17, 32, 613, 80002]) assert.equal(troubleOf({ error: { code } }), "rate-limited");
  assert.equal(troubleOf({ error: { code: "unreachable" } }), "unreachable");
  assert.equal(troubleOf({ error: { code: "not-allowed" } }), "other");
  assert.equal(troubleOf(null), "unreachable");
  assert.equal(troubleOf({ data: [] }), null);
});

test("an older post with numbers saves a call, one without gets one", () => {
  const media = Array.from({ length: 20 }, (_, i) => post("p" + i, (i + 1) * 24 * 3, 1));
  const known = media.map((m) => seen(m.id, 10));
  known[19].saves = null;
  const ids = postsToRead(media, known, NOW).map((m) => m.id);
  assert.equal(ids.includes("p11"), true);
  assert.equal(ids.includes("p15"), false);
  assert.equal(ids.includes("p19"), true);
});

test("only recent posts with comments get a comments call, and none at the read level", () => {
  const media = [post("a", 24, 1, { comments_count: 2 }), post("b", 24, 1), post("c", 24 * 20, 1, { comments_count: 5 })];
  assert.deepEqual(threadsToRead(media, NOW).map((m) => m.id), ["a"]);
  assert.equal(callsFor("comments", { me: me(), media, access: "read", now: NOW }).length, 0);
  assert.match(callsFor("comments", { me: me(), media, access: "comments", now: NOW })[0].path, /^a\/comments\?fields=.*replies\{/);
});

test("follower numbers are asked for only from 100 followers", () => {
  const small = accountCalls(99, NOW).map((c) => c.file);
  assert.equal(small.includes("acc-online.json"), false);
  assert.equal(small.some((f) => f.endsWith("-f.json")), false);
  assert.equal(accountCalls(100, NOW).some((c) => c.file === "acc-countries.json"), true);
  assert.equal(accountCalls(100, NOW).some((c) => /follower_count|impressions/.test(c.path)), false, "metrics Meta's page does not list");
});

test("a group Instagram turns down by name is asked one metric at a time", () => {
  const get = (f) => (f === "acc-28-a.json" ? { error: { code: 100, message: "metric" } } : null);
  const out = callsFor("retry", { me: me(), media: [], now: NOW, get }).map((c) => c.file);
  assert.deepEqual(out, ["acc-28-a--views.json", "acc-28-a--reach.json", "acc-28-a--accounts_engaged.json", "acc-28-a--total_interactions.json"]);
});

test("a post's numbers and the account's are read from Instagram's own shapes", () => {
  assert.deepEqual(postNumbers({ data: [{ name: "views", values: [{ value: 12 }] }, { name: "saved", values: [{ value: 3 }] }] }), { views: 12, reach: null, saves: 3, shares: null });
  assert.deepEqual(postNumbers({ error: { code: 100 } }), {});
  const total = (name, value) => ({ name, total_value: { value } });
  const files = {
    "acc-7-a.json": { data: [total("views", 500), total("reach", 300)] },
    "acc-28-a.json": { data: [total("views", 900)] },
    "acc-28-c.json": { data: [{ name: "profile_links_taps", total_value: { breakdowns: [{ results: [{ value: 2 }, { value: 3 }] }] } }] },
    "acc-28-f.json": { data: [{ name: "follows_and_unfollows", total_value: { breakdowns: [{ results: [{ dimension_values: ["FOLLOWER"], value: 40 }, { dimension_values: ["NON_FOLLOWER"], value: 7 }] }] } }] },
    "acc-daily.json": { data: [{ name: "reach", values: [{ value: 11, end_time: "2026-10-13T07:00:00+0000" }, { value: 12, end_time: "2026-10-14T07:00:00+0000" }] }] }
  };
  const a = insightsFrom((f) => files[f] || null, NOW);
  assert.equal(a.ok, true);
  assert.equal(a.until, "2026-10-13");
  assert.deepEqual(a.daily[0], { day: "2026-10-12", reach: 11 });
  assert.equal(a.last7.reach, 300);
  assert.equal(a.last28.reach, null, "a number Instagram did not send is never a 0");
  assert.equal(a.last28.linkTaps, 5);
  assert.equal(a.last28.follows, 40);
  assert.equal(a.last28.unfollows, 7);
});

test("no account numbers at all says why, and never stops the catch-up", () => {
  assert.deepEqual(insightsFrom(() => null, NOW), { ok: false, why: "unavailable" });
  assert.deepEqual(insightsFrom((f) => (f === "acc-28-a.json" ? { error: { code: 10 } } : null), NOW), { ok: false, why: "not-allowed" });
});

test("a gift comes from a comment compute printed", () => {
  const comments = [{ id: "c1", who: "@a", post: "P", mediaId: "1", commentId: "2", at: "2026-10-15T08:00:00+03:00", answered: false }, { id: "c2", answered: true }];
  assert.equal(giftOf({ kind: "waiting", id: "c1", gist: "Asks about glaze" }, comments).who, "@a");
  assert.deepEqual(giftOf({ kind: "calm" }, comments), { kind: "calm" });
  assert.throws(() => giftOf({ kind: "waiting", id: "c2" }, comments), /answered already/);
  assert.throws(() => giftOf({ kind: "waiting", id: "c1", gist: "3 people" }, comments), /a number in the gift/);
});

// The commands, on real files: a copy of the script, so its data/ is a temporary folder.
function cabinet() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "instagram-digest-"));
  const script = path.join(dir, "first-read.mjs");
  fs.copyFileSync(SCRIPT, script);
  fs.mkdirSync(path.join(dir, "data"));
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8", env: { ...process.env, CABINET_INSTAGRAM_ACCESS: "comments" } });
  const put = (name, value) => fs.writeFileSync(path.join(dir, "data/.work", name), JSON.stringify(value));
  const data = (name) => JSON.parse(fs.readFileSync(path.join(dir, "data", name), "utf8"));
  return { dir, run, put, data, has: (name) => fs.existsSync(path.join(dir, "data", name)) };
}
const liveStamp = (hoursAgo) => new Date(Date.now() - hoursAgo * HOUR).toISOString().replace(/\.\d+Z$/, "+0000");
const profile = (over = {}) => ({ user_id: "1784", username: "juno", name: "Juno", account_type: "BUSINESS", followers_count: 10, follows_count: 1, media_count: 5, ...over });
const live = (id, over = {}) => ({ id, caption: "Post " + id, media_type: "IMAGE", permalink: `https://www.instagram.com/p/${id}/`, timestamp: liveStamp(30), like_count: 4, comments_count: 0, ...over });

test("a failed read keeps the catch-up that was there, and says why", () => {
  const c = cabinet();
  assert.equal(c.run("start").status, 0);
  c.put("me.json", profile());
  c.put("media.json", { data: [live("a")] });
  assert.equal(c.run("compute").status, 0);
  c.put("words.json", {});
  assert.equal(c.run("latest", "@words.json").status, 0);
  c.run("done");
  const before = c.data("latest.json").generatedAt;

  assert.equal(c.run("start", "--morning").status, 0);
  c.put("me.json", profile());
  c.put("media.json", { error: { code: "signed-out", message: "Instagram needs a new sign-in in Cabinet." } });
  const failed = c.run("compute");
  assert.equal(failed.status, 4);
  assert.match(failed.stdout, /NEEDS_CONNECTION: instagram/);
  assert.equal(c.data("status.json").kind, "signed-out");
  assert.equal(c.data("status.json").ok, false);
  assert.equal(c.data("latest.json").generatedAt, before);

  // An answer that is fine but empty, on an account that had posts, is no reason to wipe them.
  c.put("media.json", { data: [] });
  assert.equal(c.run("compute").status, 4);
  assert.equal(c.data("status.json").kind, "other");
  assert.equal(c.data("latest.json").posts.length, 1);
});

test("a personal account stops plainly", () => {
  const c = cabinet();
  c.run("start");
  c.put("me.json", profile({ account_type: "PERSONAL" }));
  c.put("media.json", { data: [] });
  assert.equal(c.run("compute").status, 4);
  assert.equal(c.data("status.json").kind, "personal");
  assert.match(c.data("status.json").why, /Business and Creator/);
  assert.equal(c.data("reading.json").done, true);
  assert.equal(c.has("latest.json"), false);
});

test("a failed second page carries on and says so, and the cursor is never the address", () => {
  const c = cabinet();
  c.run("start", "--morning");
  c.put("me.json", profile({ media_count: 40 }));
  c.put("media.json", { data: [live("a")], paging: { next: "http://127.0.0.1/secret", cursors: { after: "ABC" } } });
  assert.equal(c.run("cursor").stdout.trim(), "ABC");
  c.put("media-2.json", { error: { code: 4 } });
  assert.equal(c.run("compute").status, 0);
  c.put("words.json", {});
  assert.equal(c.run("latest", "@words.json").status, 0);
  assert.equal(c.data("status.json").ok, true);
  assert.match(c.data("status.json").why, /newest post was read/);
  assert.equal(c.data("latest.json").spans.last28.partial, true);
});

test("comments that could not be read are said, and the read level comes from the relay's refusal", () => {
  const c = cabinet();
  c.run("start", "--morning");
  c.put("me.json", profile());
  c.put("media.json", { data: [live("a", { comments_count: 2 })] });
  c.put("comments-a.json", { error: { code: 4 } });
  assert.equal(c.run("compute").status, 0);
  c.put("words.json", {});
  c.run("latest", "@words.json");
  assert.match(c.data("status.json").why, /Comments on one post could not be read/);
  assert.equal(c.data("latest.json").commentsMissed, 1);
  c.put("comments-a.json", { error: { code: "comments-level" } });
  c.run("compute");
  c.run("latest", "@words.json");
  assert.equal(c.data("latest.json").readComments, false);
  assert.equal(c.data("latest.json").commentsMissed, 0);
});

test("a first catch-up with no posts is a real page, and a failed run closes its reading", () => {
  const c = cabinet();
  c.run("start");
  c.put("me.json", profile({ media_count: 0 }));
  c.put("media.json", { data: [] });
  assert.equal(c.run("compute").status, 0);
  assert.equal(c.run("recent").status, 0);
  c.put("gift.json", { kind: "calm" });
  assert.equal(c.run("gift", "@gift.json").status, 0);
  assert.equal(c.data("reading.json").recent.length, 0);
  execFileSync(process.execPath, [path.join(c.dir, "first-read.mjs"), "push", "**Juno**: 10 followers"]);
  assert.equal(c.run("push", "**Juno**: 123,456 followers").status, 1, "a number nobody printed");
  assert.equal(c.run("fail", "unreachable").status, 4);
  assert.equal(c.data("reading.json").done, true);
  assert.equal(c.data("status.json").kind, "unreachable");
  assert.equal(c.has("latest.json"), false);
});

test("a full catch-up on real files, with the agent's words", () => {
  const c = cabinet();
  c.run("start", "--morning");
  c.put("me.json", profile());
  c.put("media.json", { data: [live("111", { comments_count: 1 })] });
  const calls = c.run("calls", "posts").stdout.trim().split("\n");
  assert.equal(calls[0], "post-111.json 111/insights?metric=views,reach,saved,shares");
  c.put("post-111.json", { data: [{ name: "views", values: [{ value: 40 }] }, { name: "reach", values: [{ value: 30 }] }, { name: "saved", values: [{ value: 2 }] }, { name: "shares", values: [{ value: 1 }] }] });
  c.put("comments-111.json", { data: [{ id: "9", username: "maya", timestamp: liveStamp(2), text: "Do you ship?", like_count: 1 }] });
  const printed = c.run("compute");
  assert.equal(printed.status, 0);
  assert.match(printed.stdout, /c1 @maya under "Post 111", 1 likes: Do you ship\?/);
  c.put("words.json", { waiting: [{ id: "c1", gist: "Asks if you ship" }] });
  assert.equal(c.run("latest", "@words.json").status, 0);
  const l = c.data("latest.json");
  assert.equal(l.posts[0].saves, 2);
  assert.equal(l.waiting[0].who, "@maya");
  assert.equal(l.timeZone.length > 0, true);
  assert.equal(c.has(path.join("days", fs.readdirSync(path.join(c.dir, "data/days"))[0])), true);
});
