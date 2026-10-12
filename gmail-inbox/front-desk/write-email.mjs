#!/usr/bin/env node
// The "Write an email" box: what the agent writes for it goes only through here, so an
// address is never guessed and a price is never made up. Run it from anywhere:
//   node <app>/write-email.mjs start <id>         a new request from the box: empty data/.write/,
//                                                 data/compose.json says "writing"
//   node <app>/write-email.mjs save @<file>       the email, from a JSON file you wrote into data/.write/:
//                                                 {"id","status":"ready"|"pick"|"not-found","to":{"name","email"},
//                                                 "from":"mail"|"you","subject","body","threadId",
//                                                 "can":"drafts"|"send"|"copy","options":[{"name","email"}],"note"}
//   node <app>/write-email.mjs done <id> drafted|proposed   after the drafts call, or the SEND_EMAIL line
// An address from the mail ("from":"mail") must be written in a saved Gmail answer in
// data/.write/. One the owner typed ("from":"you") must be in data/.write/asked.txt, the
// owner's words saved as they are. A money amount in the email must be in one of those too.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const writeDir = path.join(dataDir, ".write");
const composeFile = path.join(dataDir, "compose.json");
const SCHEMA = "gmail-inbox/compose@1";
const MONEY = /(?:[$€£₪¥]\s?\d[\d,]*(?:\.\d+)?)|(?:\d[\d,]*(?:\.\d+)?\s?(?:USD|EUR|GBP|ILS|NIS|₪|€))/g;
const EMAIL = /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[a-z]{2,}$/i;

const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, "0");
function iso(d) {
  const o = -d.getTimezoneOffset();
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" +
    pad(d.getMinutes()) + ":" + pad(d.getSeconds()) + (o >= 0 ? "+" : "-") + pad(o / 60) + ":" + pad(o % 60);
}
function fail(msg) { console.error("write-email: " + msg); process.exit(1); }
function writeJson(file, value) {
  const tmp = file + ".part";
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}
function readCompose() { try { return JSON.parse(fs.readFileSync(composeFile, "utf8")); } catch { return null; } }
function checkId(id) {
  if (!/^w\d{10,14}$/.test(String(id || ""))) fail(`the id is the one in the owner's message, like w1760270000000, not "${id}"`);
  return String(id);
}
/** What gws or the Gmail skill wrote into data/.write/: the only proof of an address. */
function savedMail() {
  if (!fs.existsSync(writeDir)) return "";
  return fs.readdirSync(writeDir).filter((f) => f !== "asked.txt" && !/^email|\.(m?js|py|sh)$/i.test(f)).map((f) => {
    try {
      const t = fs.readFileSync(path.join(writeDir, f), "utf8");
      return /"(messages|snippet|payload|headers|from|to|body|threads)"\s*:/i.test(t) ? t : "";
    } catch { return ""; }
  }).join("\n");
}
function asked() {
  try { return fs.readFileSync(path.join(writeDir, "asked.txt"), "utf8"); } catch { return ""; }
}
function has(text, v) { return text.toLowerCase().includes(v.toLowerCase()); }
function line(v, max, what) {
  const s = String(v == null ? "" : v).replace(/\s+/g, " ").trim();
  if (s.length > max) fail(`${what} is longer than ${max} characters`);
  return s;
}
/** A person the email goes to, with an address that is really written where it says. */
function person(p, from, mail, own, what) {
  if (!p || typeof p !== "object") fail(`${what} needs {"name","email"}`);
  const email = line(p.email, 200, what + " email").replace(/^<|>$/g, "");
  if (!EMAIL.test(email)) fail(`${what} email "${email}" is not an address`);
  if (from === "you" ? !has(own, email) : !has(mail, email))
    fail(from === "you"
      ? `refused, ${email} is not in the owner's words in data/.write/asked.txt`
      : `refused, ${email} is not written in any saved Gmail answer in data/.write/: search for the person first, and never guess an address`);
  const name = line(p.name, 80, what + " name");
  return name ? { name, email } : { email };
}

const [cmd, ...args] = process.argv.slice(2);

if (cmd === "start") {
  const id = checkId(args[0]);
  fs.rmSync(writeDir, { recursive: true, force: true });
  fs.mkdirSync(writeDir, { recursive: true });
  writeJson(composeFile, { schema: SCHEMA, id, at: iso(new Date()), status: "writing" });
  console.log("data/.write/ is ready. Save the owner's words there as asked.txt, and every Gmail answer you use.");
} else if (cmd === "save") {
  const ref = String(args[0] || "");
  if (!ref.startsWith("@")) fail("save takes @<file>, a JSON file in data/.write/");
  const file = path.resolve(writeDir, ref.slice(1));
  if (!file.startsWith(writeDir + path.sep) || !fs.existsSync(file)) fail(`${ref.slice(1)} is not in data/.write/`);
  let e;
  try { e = JSON.parse(fs.readFileSync(file, "utf8")); } catch { fail(`${ref.slice(1)} is not JSON`); }
  const id = checkId(e.id);
  const now = readCompose();
  if (!now || now.id !== id) fail(`run "start ${id}" first`);
  const status = String(e.status || "");
  if (!["ready", "pick", "not-found"].includes(status)) fail(`status is ready, pick or not-found, not "${status}"`);
  const from = e.from === "you" ? "you" : "mail";
  const mail = savedMail();
  const own = asked();
  if (!own.trim()) fail("save the owner's words as data/.write/asked.txt first, as they wrote them");
  const out = { schema: SCHEMA, id, at: iso(new Date()), status, from };

  if (status !== "not-found") {
    out.subject = line(e.subject, 200, "subject");
    out.body = String(e.body == null ? "" : e.body).replace(/\r\n/g, "\n").trim();
    if (!out.subject || !out.body) fail("the email needs a subject and a body");
    if (out.body.length > 5000) fail("the body is longer than 5000 characters: keep it short");
    if (/[—–]/.test(out.subject + out.body)) fail("refused, a long dash: write the way the owner writes, with a comma or a period");
    // A price or an amount must be the owner's or the mail's, never made up.
    for (const m of (out.subject + "\n" + out.body).match(MONEY) || []) {
      const v = m.trim();
      if (!has(mail, v) && !has(own, v)) fail(`refused, ${v} is not in the owner's words or a saved answer: put [the price] in brackets for the owner to fill`);
    }
    const can = String(e.can || "");
    if (!["drafts", "send", "copy"].includes(can)) fail('can is "drafts" (Sign in with Google, may write drafts), "send" (app password) or "copy" (read only)');
    out.can = can;
    if (e.threadId) {
      const t = line(e.threadId, 30, "threadId");
      if (!/^[0-9a-f]{8,24}$/i.test(t) || !has(mail, t)) fail(`threadId ${t} is not in a saved answer`);
      out.threadId = t;
    }
  }
  if (status === "ready") out.to = person(e.to, from, mail, own, "to");
  if (status === "pick") {
    if (!Array.isArray(e.options) || e.options.length < 2 || e.options.length > 4) fail("pick needs 2 to 4 options, each a person from the mail");
    out.options = e.options.map((p, i) => person(p, "mail", mail, own, "option " + (i + 1)));
    out.from = "mail";
  }
  const note = line(e.note, 200, "note");
  if (status === "not-found" && !note) fail('not-found needs a note: who you looked for, like "No email from or to Dana in your mail."');
  if (note) out.note = note;
  writeJson(composeFile, out);
  console.log("data/compose.json written: " + status + (out.to ? " to " + out.to.email : ""));
} else if (cmd === "done") {
  const id = checkId(args[0]);
  const what = String(args[1] || "");
  if (!["drafted", "proposed"].includes(what)) fail('done takes "drafted" or "proposed"');
  const now = readCompose();
  if (!now || now.id !== id || now.status !== "ready") fail(`there is no ready email ${id} in data/compose.json`);
  now.status = what;
  now.doneAt = iso(new Date());
  writeJson(composeFile, now);
  console.log("data/compose.json: " + what);
} else {
  fail("use start <id>, save @<file> or done <id> drafted|proposed");
}
