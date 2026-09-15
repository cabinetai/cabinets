// The connector checks and the wire form, over the fixture roots in
// ../fixtures/connectors. Each fixture is a tiny repo root: run the builder on
// it with --check and read what it prints, or call build() directly.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "../build-manifest.mjs";
import {
  annotation,
  loadConnectorIds,
  normalizeForWire,
  sentencesOf,
  undeclaredMentions,
  validateCabinet,
} from "../connectors.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS = path.resolve(HERE, "..");
const BUILDER = path.join(SCRIPTS, "build-manifest.mjs");
const FIXTURES = path.join(SCRIPTS, "fixtures");
const IDS_PATH = path.join(FIXTURES, "connector-ids.json");
const fixture = (name) => path.join(FIXTURES, "connectors", name);
const ids = loadConnectorIds(IDS_PATH);

function runBuilder(root, ...flags) {
  const result = spawnSync(process.execPath, [BUILDER, "--root", root, "--ids", IDS_PATH, ...flags], {
    encoding: "utf8",
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

const check = (name) => runBuilder(fixture(name), "--check");

const tempDirs = [];
after(() => {
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
});

function tempDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

/** A copy of a fixture in a temp dir, so a build that writes cannot touch the repo. */
function copyFixture(name) {
  const dir = tempDir(`connectors-${name}-`);
  fs.cpSync(fixture(name), dir, { recursive: true });
  return dir;
}

function validate(meta, extra = {}) {
  return validateCabinet({
    slug: "demo",
    meta,
    jobs: ["morning-summary"],
    agents: ["summarizer"],
    jobPrompts: [],
    personaTexts: [],
    tags: [],
    ids,
    heroes: new Map(),
    ...extra,
  });
}

const messages = (list) => list.map((item) => item.message);
const gmail = {
  id: "gmail",
  need: "needs",
  access: ["read"],
  why: "Reads the mail that arrived overnight.",
};

// ── The builder over the fixtures ────────────────────────────────────

test("an unknown id fails naming the file, with the exact sentence", () => {
  const { status, output } = check("unknown-id");
  assert.equal(status, 1);
  assert.ok(
    output.includes(
      'gmail-inbox/.cabinet: unknown connector "gmial". Known ids are in .github/connector-ids.json.',
    ),
    output,
  );
  assert.ok(output.includes("::error file=gmail-inbox/.cabinet::"), output);
});

for (const [name, expected] of [
  ["dash-in-why", "why contains an em dash or en dash"],
  ["two-heroes", 'morning-mail/.cabinet: a second hero for "gmail"; gmail-inbox/.cabinet is already its hero'],
  ["missing-used-by", 'usedBy "jobs/nope" names a job this cabinet does not have'],
  ["both-id-and-anyof", "has both id and anyOf"],
  ["open-with-id", "open: true is for anyOf, not id"],
  ["too-many-prompts", "prompts has 17 entries; keep it to 16"],
  ["prompt-connector-undeclared", 'prompt 2 names connector "notion", which connectors does not declare'],
]) {
  test(`${name} exits 1`, () => {
    const { status, output } = check(name);
    assert.equal(status, 1, output);
    assert.ok(output.includes(expected), output);
    assert.ok(output.includes("Nothing was written."), output);
  });
}

test("an undeclared Gmail tool in a job prompt warns and the build passes", () => {
  const { status, output } = check("undeclared-gmail");
  assert.equal(status, 0, output);
  assert.ok(
    output.includes("::warning file=gmail-inbox/.jobs/morning-summary.yaml::"),
    output,
  );
  assert.ok(output.includes("mcp__claude_ai_Gmail__"), output);
  assert.ok(!output.includes("::error"), output);
});

test("a persona saying it replaces the Notion docs does not warn", () => {
  const { status, output } = check("replace-notion");
  assert.equal(status, 0, output);
  assert.ok(!output.includes("::warning"), output);
});

test("a tag equal to an id with no entry warns", () => {
  const { status, output } = check("tag-without-entry");
  assert.equal(status, 0, output);
  assert.ok(output.includes('::warning file=gmail-inbox/.cabinet::'), output);
  assert.ok(output.includes('is tagged "gmail"'), output);
});

test("a hand-written stop step under a needs entry warns", () => {
  const { status, output } = check("stop-step-with-needs");
  assert.equal(status, 0, output);
  assert.ok(output.includes('still has a hand-written "STOP HERE" step'), output);
});

test("the valid fixture checks clean", () => {
  const { status, output } = check("valid");
  assert.equal(status, 0, output);
  assert.ok(!output.includes("::warning") && !output.includes("::error"), output);
});

test("--check writes nothing", () => {
  const root = copyFixture("valid");
  const before = fs.readdirSync(root).sort();
  const { status } = runBuilder(root, "--check");
  assert.equal(status, 0);
  assert.deepEqual(fs.readdirSync(root).sort(), before);
  assert.ok(!fs.existsSync(path.join(root, "manifest.json")));
  assert.ok(!fs.existsSync(path.join(root, "details")));
});

test("an error stops a full build before anything is written", () => {
  const root = copyFixture("unknown-id");
  const { status } = runBuilder(root);
  assert.equal(status, 1);
  assert.ok(!fs.existsSync(path.join(root, "manifest.json")));
  assert.ok(!fs.existsSync(path.join(root, "details")));
});

test("a full build writes the declarations, and files is empty outside git", () => {
  const root = copyFixture("valid");
  const { status, output } = runBuilder(root);
  assert.equal(status, 0, output);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
  const entry = manifest.cabinets.find((c) => c.slug === "gmail-inbox");
  assert.deepEqual(entry.connectors[0], { ids: ["gmail"], need: "needs", hero: true });
  const detail = JSON.parse(fs.readFileSync(path.join(root, "details", "gmail-inbox.json"), "utf8"));
  assert.equal(detail.schemaVersion, 1);
  assert.deepEqual(detail.files, []);
  assert.equal(detail.prompts.length, 3);
});

test("valid emits connectors after tags, and connectors and prompts after children", () => {
  const { manifest, details, errors, warnings } = build({
    root: fixture("valid"),
    idsPath: IDS_PATH,
    withFiles: false,
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.equal(manifest.schemaVersion, 1);

  const entry = manifest.cabinets.find((c) => c.slug === "gmail-inbox");
  const entryKeys = Object.keys(entry);
  assert.equal(entryKeys.at(-1), "connectors");
  assert.equal(entryKeys.at(-2), "tags");
  assert.deepEqual(entry.connectors, [
    { ids: ["gmail"], need: "needs", hero: true },
    { ids: ["google-calendar", "microsoft-365"], need: "better-with" },
    { ids: ["notion", "slack"], need: "needs", open: true },
  ]);

  const detail = details.find((d) => d.slug === "gmail-inbox");
  assert.deepEqual(Object.keys(detail), [
    "schemaVersion",
    "slug",
    "meta",
    "tags",
    "readme",
    "agents",
    "jobs",
    "children",
    "connectors",
    "prompts",
    "files",
  ]);
  assert.deepEqual(detail.connectors[0], {
    ids: ["gmail"],
    need: "needs",
    open: false,
    access: ["read"],
    why: "Reads the mail that arrived overnight.",
    usedBy: ["jobs/morning-summary"],
    hero: true,
  });
  assert.deepEqual(detail.connectors[2], {
    ids: ["notion", "slack"],
    need: "needs",
    open: true,
    access: [],
    why: "Reads whichever notes or chats are connected.",
    usedBy: [],
    hero: false,
  });
  assert.deepEqual(detail.prompts, [
    { text: "What needs me in today's mail?", connector: "gmail" },
    { text: "Which meetings clash this week?", connector: "google-calendar" },
    { text: "Summarise the last three mornings." },
  ]);
  assert.deepEqual(detail.files, []);
});

test("an undeclared cabinet carries neither key, in the manifest or its detail", () => {
  const { manifest, details } = build({ root: fixture("valid"), idsPath: IDS_PATH, withFiles: false });
  const entry = manifest.cabinets.find((c) => c.slug === "plain-notes");
  assert.deepEqual(Object.keys(entry), [
    "slug",
    "name",
    "description",
    "version",
    "domain",
    "cover",
    "agentCount",
    "jobCount",
    "childCount",
    "tags",
  ]);
  const detail = details.find((d) => d.slug === "plain-notes");
  assert.ok(!("connectors" in detail) && !("prompts" in detail));
});

test("a missing vocabulary file is an error, not a crash", () => {
  const { errors, manifest } = build({
    root: fixture("valid"),
    idsPath: path.join(FIXTURES, "no-such-file.json"),
    withFiles: false,
  });
  assert.equal(manifest, null);
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /Cannot read the connector ids/);
});

test("unknown flags exit 2 without building", () => {
  const result = spawnSync(process.execPath, [BUILDER, "--nope"], { encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Unknown option --nope/);
});

// ── validateCabinet ──────────────────────────────────────────────────

test("a cabinet without connectors or prompts has nothing to say", () => {
  assert.deepEqual(validate({ name: "Plain" }), { errors: [], warnings: [] });
});

test("every error in a cabinet is collected, not just the first", () => {
  const { errors } = validate({
    connectors: [
      { id: "gmial", need: "sometimes", access: ["write"], why: "x".repeat(91) },
      { anyOf: ["notion"], need: "needs", open: true, why: "Reads notes." },
      { need: "needs", why: "Nothing named." },
      { id: "gmail", need: "needs", why: "Again.", usedBy: ["agents/ghost", "people/x"] },
      { id: "gmail", need: "needs", why: "Twice." },
      "gmail",
    ],
    prompts: [{ text: "y".repeat(81) }, { text: "A dash – here?" }, { connector: "gmail" }],
  });
  const text = messages(errors).join("\n");
  for (const expected of [
    'unknown connector "gmial"',
    'need must be needs or better-with, not "sometimes"',
    'access "write" is not one of read, draft, send, post, change, create',
    "why is 91 characters; keep it to 90",
    "open: true needs at least two ids in anyOf",
    "connectors entry 3 needs an id, or anyOf for alternatives",
    'usedBy "agents/ghost" names an agent this cabinet does not have',
    'usedBy "people/x" must be jobs/<id> or agents/<slug>',
    'connector "gmail" is declared more than once',
    "connectors entry 6 must be a mapping with id or anyOf",
    "prompt 1 is 81 characters; keep it to 80",
    "prompt 2 contains an em dash or en dash",
    "prompt 3 has no text",
  ]) {
    assert.ok(text.includes(expected), `missing "${expected}" in:\n${text}`);
  }
  for (const error of errors) assert.equal(error.file, "demo/.cabinet");
  assert.ok(errors.every((error) => error.message.startsWith("demo/.cabinet: ")));
});

test("connectors and prompts must be lists", () => {
  const { errors } = validate({ connectors: { id: "gmail" }, prompts: "What now?" });
  assert.deepEqual(messages(errors), [
    "demo/.cabinet: connectors must be a list.",
    "demo/.cabinet: prompts must be a list.",
  ]);
});

test("why is required, and counted as one line", () => {
  assert.match(messages(validate({ connectors: [{ id: "gmail", need: "needs" }] }).errors)[0], /has no why/);
  const wrapped = `${"word ".repeat(17)}\n   end.`;
  assert.deepEqual(validate({ connectors: [{ ...gmail, why: wrapped }] }).errors, []);
});

test("the app's limit of 12 declarations is an error", () => {
  const names = [...ids.keys()];
  const connectors = Array.from({ length: 13 }, (_, i) => ({
    anyOf: [names[i % names.length], `extra-${i}`],
    need: "better-with",
    why: "Filler.",
  }));
  assert.ok(messages(validate({ connectors }).errors).some((m) => m.includes("at most 12")));
});

test("heroes are tracked across cabinets and a cut id still builds", () => {
  const heroes = new Map();
  const first = validateCabinet({
    slug: "one",
    meta: { connectors: [{ ...gmail, hero: true }, { id: "tiktok", need: "better-with", why: "Old." }] },
    ids,
    heroes,
  });
  assert.deepEqual(first.errors, []);
  assert.equal(heroes.get("gmail"), "one/.cabinet");
  const second = validateCabinet({ slug: "two", meta: { connectors: [{ ...gmail, hero: true }] }, ids, heroes });
  assert.deepEqual(messages(second.errors), [
    'two/.cabinet: a second hero for "gmail"; one/.cabinet is already its hero. Keep one hero: true.',
  ]);
  const again = validateCabinet({ slug: "one", meta: { connectors: [{ ...gmail, hero: true }] }, ids, heroes });
  assert.deepEqual(again.errors, []);
});

test("hero and open take only true or false", () => {
  const { errors } = validate({ connectors: [{ ...gmail, hero: "yes", open: 1 }] });
  assert.deepEqual(messages(errors).length, 2);
});

test("the stop step warns only when a needs entry covers that job", () => {
  const stopJob = {
    id: "morning-summary",
    ownerAgent: "summarizer",
    file: "demo/.jobs/morning-summary.yaml",
    text: "If you cannot, STOP HERE and tell them to open Cabinet's integrations screen.",
  };
  const warns = (connectors) =>
    validate({ connectors }, { jobPrompts: [stopJob] }).warnings.filter((w) =>
      w.message.includes("STOP HERE"),
    ).length;
  assert.equal(warns([gmail]), 1, "an entry for every job covers it");
  assert.equal(warns([{ ...gmail, usedBy: ["agents/summarizer"] }]), 1, "its owner covers it");
  assert.equal(warns([{ ...gmail, usedBy: ["jobs/other"] }]), 0, "another job does not");
  assert.equal(warns([{ ...gmail, need: "better-with" }]), 0, "better-with never holds a job");
});

test("a tag for a cut id or a declared id does not warn", () => {
  const { warnings } = validate({ connectors: [gmail] }, { tags: ["gmail", "tiktok", "email"] });
  assert.deepEqual(warnings, []);
});

// ── Mentions ─────────────────────────────────────────────────────────

test("mentions: names are case-sensitive whole words, tool prefixes are substrings", () => {
  const found = (text, declared = []) =>
    undeclaredMentions(text, ids, new Set(declared)).map((m) => m.ids.join("|"));
  assert.deepEqual(found("Read Gmail first."), ["gmail"]);
  assert.deepEqual(found("Read gmail first."), [], "lowercase is not the brand");
  assert.deepEqual(found("Read Gmails first."), [], "part of a longer word");
  assert.deepEqual(found("Call mcp__claude_ai_Gmail__search."), ["gmail"]);
  assert.deepEqual(found("Post in Slack and read Notion."), ["notion", "slack"]);
  assert.deepEqual(found("Post in Slack.", ["slack"]), []);
  assert.deepEqual(found("Check your outlook for the week."), [], "a lowercase alias is an ordinary word");
  assert.deepEqual(found("Post to TikTok."), [], "cut ids never warn");
});

test("mentions: sentences about replacing a tool are skipped, even when wrapped", () => {
  const found = (text) => undeclaredMentions(text, ids, new Set()).length;
  assert.equal(found("Keep your CRM. Replace the Notion docs\naround it."), 0);
  assert.equal(found("Use this instead of Slack threads."), 0);
  assert.equal(found("This replaces the Notion wiki."), 0);
  assert.equal(found("Keep your CRM.\n- Read the Notion docs."), 1);
});

test("sentencesOf joins wrapped lines and splits list items", () => {
  assert.deepEqual(sentencesOf("One line\nwrapped. Two.\n\n- item one\n- item two"), [
    "One line wrapped.",
    "Two.",
    "- item one",
    "- item two",
  ]);
});

// ── Wire form and annotations ────────────────────────────────────────

test("normalizeForWire turns id and anyOf into ids and leaves undeclared cabinets empty", () => {
  assert.deepEqual(normalizeForWire({}), { manifestRefs: [], detailConnectors: [], prompts: [] });
  const wire = normalizeForWire({
    connectors: [{ anyOf: ["gmail", "gmail", "microsoft-365"], need: "needs", why: "Reads\n mail." }],
    prompts: ["  Spaced   out  "],
  });
  assert.deepEqual(wire.manifestRefs, [{ ids: ["gmail", "microsoft-365"], need: "needs" }]);
  assert.equal(wire.detailConnectors[0].why, "Reads mail.");
  assert.deepEqual(wire.prompts, [{ text: "Spaced out" }]);
});

test("annotations escape what GitHub would otherwise read as syntax", () => {
  assert.equal(
    annotation("error", { file: "a,b:c/.cabinet", message: "100% sure\nnext" }),
    "::error file=a%2Cb%3Ac/.cabinet::100%25 sure%0Anext",
  );
});

test("loadConnectorIds refuses a vocabulary that lists an id twice", () => {
  const dir = tempDir("connector-ids-");
  const file = path.join(dir, "ids.json");
  fs.writeFileSync(file, JSON.stringify([{ id: "gmail" }, { id: "gmail" }]));
  assert.throws(() => loadConnectorIds(file), /listed twice/);
});
