// The TikTok Digest helper: every number on Your TikTok comes from compute, so its counting is
// tested here. A cabinet is copied verbatim into people's workspaces, which is why this file
// lives with the registry's tests and not next to the script.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cleanTitle, computeRead, giftOf, latestOf, troubleOf, wordsOn } from "../../../tiktok-digest/your-tiktok/first-read.mjs";

const SCRIPT = fileURLToPath(new URL("../../../tiktok-digest/your-tiktok/first-read.mjs", import.meta.url));
const NOW = new Date("2026-10-15T09:00:00");
const HOUR = 3600;
const secs = (hoursAgo) => Math.floor(NOW.getTime() / 1000) - hoursAgo * HOUR;
const user = (over = {}) => ({ display_name: "Juno", username: "juno", follower_count: 1000, following_count: 5, likes_count: 900, video_count: 3, ...over });
const video = (id, hoursAgo, views, over = {}) => ({
  id, title: "Video " + id, create_time: secs(hoursAgo), duration: 30, view_count: views,
  like_count: 0, comment_count: 0, share_count: 0, share_url: "https://www.tiktok.com/@juno/video/" + id, ...over
});
const seen = (id, views) => ({ videoId: id, views, likes: 0, comments: 0, shares: 0, at: "2026-10-14T09:00:00" });
const prior = (over = {}) => ({
  generatedAt: "2026-10-14T09:00:00", account: { handle: "@juno", followers: 900 },
  videos: [], next: [], history: [{ day: "2026-10-14", followers: 900 }], known: [], ...over
});

test("a video in known subtracts, and only a new one counts whole", () => {
  const { latest, first } = computeRead({
    user: user(), now: NOW,
    prev: prior({ known: [seen("a", 900)] }),
    videos: [video("a", 100, 1000), video("new", 5, 70), video("oldnever", 400, 5000)]
  });
  assert.equal(first, false);
  const by = Object.fromEntries(latest.videos.map((v) => [v.videoId, v]));
  assert.equal(by.a.gained.views, 100);
  assert.equal(by.new.gained.views, 70);
  // Posted long before the last read and never read: its lifetime is not this window's gain.
  assert.equal(by.oldnever.gained, undefined);
  assert.equal(latest.totals.views, 170);
  assert.equal(latest.totals.followers, 100);
  assert.equal(latest.totals.newVideos, 1);
});

test("Catch up now the same day stays against the day before", () => {
  const today = prior({ generatedAt: "2026-10-15T08:00:00", known: [seen("a", 990), seen("new", 50)], history: [{ day: "2026-10-14" }, { day: "2026-10-15" }] });
  const yesterday = prior({ known: [seen("a", 900)] });
  const { latest } = computeRead({ user: user(), now: NOW, prev: today, earlier: yesterday, videos: [video("a", 100, 1000), video("new", 5, 70)] });
  assert.equal(latest.videos.find((v) => v.videoId === "a").gained.views, 100, "subtracts yesterday's known, not this morning's");
  assert.equal(latest.videos.find((v) => v.videoId === "new").gained.views, 70, "still whole since yesterday");
  assert.equal(latest.totals.views, 170);
  assert.equal(new Date(latest.since).getTime(), new Date("2026-10-14T09:00:00").getTime());
  assert.equal(latest.history.filter((h) => h.day === "2026-10-15").length, 1, "one entry a day");
});

test("known keeps every video read, and best can be an older one", () => {
  const videos = Array.from({ length: 30 }, (_, i) => video("v" + i, (i + 1) * 24, 100));
  const old = videos[25];
  old.view_count = 5000;
  const { latest } = computeRead({ user: user(), now: NOW, prev: prior({ known: videos.map((v) => seen(v.id, 100)) }), videos });
  assert.equal(latest.known.length, 30);
  const best = latest.videos.find((v) => v.mark === "best");
  assert.equal(best.videoId, old.id);
  assert.equal(best.older, true);
  assert.equal(latest.videos.length, 11);
});

test("spans.top holds the most viewed of the days, older videos in them included", () => {
  const videos = Array.from({ length: 12 }, (_, i) => video("v" + i, (i + 1) * 24, i === 11 ? 9000 : 100 + i));
  const { latest } = computeRead({ user: user(), now: NOW, videos });
  assert.equal(latest.spans.last28.top[0].videoId, "v11");
  assert.equal(latest.spans.last28.top.length, 4);
  assert.equal(latest.spans.last7.videos, 6);
});

test("views at the first read after a day are saved once, and used against the usual", () => {
  const known = ["x", "y", "z"].map((id) => ({ ...seen(id, 100), day1: { views: 100, hours: 26 } }));
  const prev = prior({ known });
  const first = computeRead({ user: user(), now: NOW, prev, videos: [video("a", 30, 500), video("x", 500, 900)] }).latest;
  const a = first.known.find((k) => k.videoId === "a");
  assert.deepEqual(a.day1, { views: 500, hours: 30 });
  assert.equal(first.videos.find((v) => v.videoId === "a").firstDay.pace, "ahead");
  // A day later the number stays what it was, and a video first read at 30 days never gets one.
  const later = new Date(NOW.getTime() + 24 * HOUR * 1000);
  const second = computeRead({ user: user(), now: later, prev: first, videos: [video("a", 30, 800), video("b", 700, 1)] }).latest;
  assert.equal(second.known.find((k) => k.videoId === "a").day1.views, 500);
  assert.equal(second.known.find((k) => k.videoId === "b").day1, undefined);
  assert.ok(second.known.find((k) => k.videoId === "x"), "a video not read today stays known");
});

test("a changed handle counts as a first catch-up", () => {
  const { latest, first } = computeRead({ user: user({ username: "someoneelse" }), now: NOW, prev: prior({ known: [seen("a", 10)] }), videos: [video("a", 100, 1000)] });
  assert.equal(first, true);
  assert.equal(latest.totals.views, undefined);
  assert.equal(latest.history.length, 1);
  assert.equal(latest.videos[0].gained, undefined);
});

test("on a first read a video under a day old cannot be best", () => {
  const { latest } = computeRead({ user: user(), now: NOW, videos: [video("fresh", 3, 90000), video("old", 72, 3000)] });
  assert.equal(latest.videos.find((v) => v.mark === "best").videoId, "old");
  const only = computeRead({ user: user(), now: NOW, videos: [video("fresh", 3, 90000)] }).latest;
  assert.equal(only.videos.some((v) => v.mark === "best"), false);
});

test("quiet is the fewest total views among videos 7 to 60 days old", () => {
  const videos = [video("a", 24 * 8, 1000), video("b", 24 * 9, 900), video("low", 24 * 20, 100), video("c", 24 * 30, 800), video("past", 24 * 70, 1), video("young", 24 * 2, 2)];
  const { latest } = computeRead({ user: user(), now: NOW, videos });
  assert.equal(latest.videos.find((v) => v.mark === "quiet").videoId, "low");
});

test("works shows only groups of 3 or more, from videos old enough to compare", () => {
  const videos = [10, 12, 14].map((d, i) => video("s" + i, d * 24, 100 * (i + 1), { duration: 20 }))
    .concat([video("m", 24 * 20, 5000, { duration: 45 }), video("young", 24, 9, { duration: 20 })]);
  const { works } = computeRead({ user: user(), now: NOW, videos }).latest;
  assert.equal(works.videos, 4);
  assert.deepEqual(works.length, [{ label: "Under 30 seconds", videos: 3, median: 200 }]);
});

test("titles are cleaned, never refused", () => {
  assert.equal(cleanTitle("Bread — the long way"), "Bread, the long way");
  assert.equal(cleanTitle("The null hypothesis of bread"), "The null hypothesis of bread");
  assert.equal(cleanTitle("null"), "");
  assert.equal(cleanTitle("Watch https://www.tiktok.com/@a/video/1 now"), "Watch now");
  const { latest } = computeRead({ user: user(), now: NOW, videos: [video("a", 100, 10, { title: "", video_description: "Rye loaf — day one #bread #fyp" })] });
  assert.equal(latest.videos[0].title, "Rye loaf, day one");
  assert.doesNotThrow(() => latestOf(latest));
});

test("the agent's numbers never reach the page, and its own must be real", () => {
  const c = computeRead({ user: user(), now: NOW, prev: prior({ known: [seen("a", 900)], next: [{ title: "Bread again" }] }), videos: [video("a", 100, 1000), video("b", 200, 40)] });
  const l = wordsOn(c, { videos: [{ id: "v1", gist: "Most views lately", views: 999999 }], next: [{ title: "More bread", why: "Video a has 1,000 views", from: "v1" }] });
  assert.equal(l.videos[0].views, 1000);
  assert.equal(l.videos[0].gist, "Most views lately");
  assert.deepEqual(l.next, [{ id: "n1", title: "More bread", why: "Video a has 1,000 views", from: "v1" }]);
  assert.throws(() => wordsOn(c, { videos: [{ id: "v1", gist: "Up 4,321 views" }] }), /not a number from this catch-up/);
  assert.throws(() => wordsOn(c, { videos: [{ id: "v1", gist: "On pace with your usual first day" }] }), /no first-day number/);
  assert.throws(() => wordsOn(c, { next: [{ title: "Bread again", why: "Good", from: "v2" }] }), /nothing new backs it/);
  assert.doesNotThrow(() => wordsOn(c, { next: [{ title: "Bread again", why: "Good", from: "v1" }] }), "built on the video that moved");
});

test("the relay's signed-out is a sign-in failure, and other errors are not", () => {
  assert.equal(troubleOf({ error: { code: "signed-out", message: "x" } }), "signed-out");
  assert.equal(troubleOf({ error: { code: "access_token_invalid" } }), "signed-out");
  assert.equal(troubleOf({ error: { code: "rate_limit_exceeded" } }), "rate-limited");
  assert.equal(troubleOf({ error: { code: "not-allowed" } }), "other");
  assert.equal(troubleOf(null), "unreachable");
  assert.equal(troubleOf({ data: {}, error: { code: "ok" } }), null);
});

test("a gift for videos that have no views yet is not the no-videos one", () => {
  assert.deepEqual(giftOf({ kind: "early" }), { kind: "early" });
  assert.throws(() => giftOf({ kind: "best", video: "A", views: 0, at: NOW.toISOString() }), /give early/);
});

// The commands, on real files: a copy of the script, so its data/ is a temporary folder.
function cabinet() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tiktok-digest-"));
  const script = path.join(dir, "first-read.mjs");
  fs.copyFileSync(SCRIPT, script);
  fs.mkdirSync(path.join(dir, "data"));
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
  const put = (name, value) => fs.writeFileSync(path.join(dir, "data/.work", name), JSON.stringify(value));
  const data = (name) => JSON.parse(fs.readFileSync(path.join(dir, "data", name), "utf8"));
  return { dir, run, put, data, has: (name) => fs.existsSync(path.join(dir, "data", name)) };
}
const nowSecs = () => Math.floor(Date.now() / 1000);
const page = (videos, more = false) => ({ data: { videos, has_more: more, cursor: 123 }, error: { code: "ok" } });
const profile = (count) => ({ data: { user: { display_name: "Juno", username: "juno", follower_count: 10, video_count: count } }, error: { code: "ok" } });
const fresh = (id, views) => ({ id, title: "Video " + id, create_time: nowSecs() - 30 * 3600, duration: 20, view_count: views });

test("a failed first video page keeps the catch-up that was there, and says why", () => {
  const c = cabinet();
  assert.equal(c.run("start").status, 0);
  c.put("user.json", profile(200));
  c.put("videos.json", page([fresh("a", 100)]));
  assert.equal(c.run("compute", "@user.json", "@videos.json").status, 0);
  c.put("words.json", {});
  assert.equal(c.run("latest", "@words.json").status, 0);
  c.run("done");
  const before = c.data("latest.json").generatedAt;

  assert.equal(c.run("start", "--morning").status, 0);
  c.put("user.json", profile(200));
  c.put("videos.json", { error: { code: "signed-out", message: "TikTok needs a new sign-in in Cabinet." } });
  const failed = c.run("compute", "@user.json", "@videos.json");
  assert.equal(failed.status, 4);
  assert.match(failed.stdout, /NEEDS_CONNECTION: tiktok/);
  assert.equal(c.data("status.json").kind, "signed-out");
  assert.equal(c.data("status.json").ok, false);
  assert.equal(c.data("latest.json").generatedAt, before);
  assert.equal(c.data("latest.json").videos.length, 1);

  // An answer that is fine but empty, on an account that had videos, is no reason to wipe them.
  c.put("user.json", profile(200));
  c.put("videos.json", page([]));
  assert.equal(c.run("compute", "@user.json", "@videos.json").status, 4);
  assert.equal(c.data("status.json").kind, "other");
  assert.equal(c.data("latest.json").videos.length, 1);
});

test("a failed second page carries on, and says so", () => {
  const c = cabinet();
  c.run("start", "--morning");
  c.put("user.json", profile(40));
  c.put("videos.json", page([fresh("a", 100)], true));
  c.put("videos-2.json", { error: { code: "rate_limit_exceeded" } });
  assert.equal(c.run("compute", "@user.json", "@videos.json", "@videos-2.json").status, 0);
  c.put("words.json", {});
  assert.equal(c.run("latest", "@words.json").status, 0);
  assert.equal(c.data("status.json").ok, true);
  assert.match(c.data("status.json").why, /newest video was read/);
  assert.equal(c.data("latest.json").spans.last28.partial, true);
});

test("a first catch-up with videos but no views gets the early gift, and a failed run closes its reading", () => {
  const c = cabinet();
  c.run("start");
  c.put("user.json", profile(2));
  c.put("videos.json", page([fresh("a", 0), fresh("b", 0)]));
  assert.equal(c.run("compute", "@user.json", "@videos.json").status, 0);
  assert.equal(c.run("gift", "@gift.json").status, 0);
  assert.equal(c.run("recent", "@recent.json").status, 0);
  assert.equal(c.data("reading.json").gift.kind, "early");
  assert.equal(c.data("reading.json").recent.length, 2);
  execFileSync(process.execPath, [path.join(c.dir, "first-read.mjs"), "push", "**Juno**: 10 followers"]);
  assert.equal(c.run("push", "**Juno**: 123,456 followers").status, 1, "a number nobody printed");
  assert.equal(c.run("fail", "unreachable").status, 4);
  assert.equal(c.data("reading.json").done, true);
  assert.equal(c.data("status.json").kind, "unreachable");
  assert.equal(c.has("latest.json"), false);
});

test("before compute, a line may carry a video's number from the saved page", () => {
  const c = cabinet();
  c.run("start");
  c.put("user.json", profile(1));
  assert.equal(c.run("push", "**Video a**: 412,600 views").status, 1, "not answered yet");
  c.put("videos.json", page([fresh("a", 412600)]));
  assert.equal(c.run("push", "**Video a**: 412,600 views").status, 0);
  assert.equal(c.run("push", "**Video a**: 999,999 views").status, 1, "a number TikTok never gave");
});

test("a lock that cannot be made fails at once instead of waiting", () => {
  const c = cabinet();
  c.run("start");
  fs.rmSync(path.join(c.dir, "data"), { recursive: true, force: true });
  fs.writeFileSync(path.join(c.dir, "data"), "");
  const started = Date.now();
  const r = c.run("push", "**Juno**: 10 followers");
  assert.equal(r.status, 1);
  assert.ok(Date.now() - started < 4000, "it did not wait for the lock");
});
