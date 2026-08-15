---
headline: You ask for 356 things. Most of them are "fix this error."
overview: You hand it a failing command more than you hand it a plan — most sessions
  open with a test run or a stack trace, not a line about what you're building. You're
  specific about the symptom and loose about the target state, so it often has to
  infer what "fixed" means from the error alone. Your feature requests are your
  longest prompts and also your best-landing ones; your one-line fixes are the ones
  that come back for a second pass. You rarely ask it to explain itself before it
  acts.
verdict: State the target behavior before the command output — half your follow-ups are it guessing what you actually wanted fixed.
source: Codex
generated: 2026-08-13 10:00
status: ok
seeded: true
---

| Kind of prompt | How often | What it looks like | How it goes |
|---|---|---|---|
| fix this error | 143 · 40% | "npm test is failing, fix it" | Usually one round |
| implement this feature | 78 · 22% | "add rate limiting to the API" | Takes two or three rounds |
| run the tests and fix what's broken | 54 · 15% | "run the suite, fix whatever's red" | Often needs a follow-up |
| review this diff | 39 · 11% | "does this diff look right to you" | Lands first time |
| refactor this file | 25 · 7% | "clean this module up, keep behavior" | Spirals into revisions |
| write the migration | 17 · 5% | "write the migration for this schema change" | Quick, rarely disputed |
