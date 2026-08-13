---
headline: You ask for 410 things. Most of them are "fix this."
overview: You reach for the agent mid-error, not before writing code — most sessions
  open with a stack trace pasted in cold, no line about what you were trying to do.
  You're precise about what's broken and vague about what "done" looks like: barely
  a tenth of your prompts describe an outcome instead of a symptom. Your longest
  prompts are also your best ones, the ones that land first time, but you keep
  reaching for one-liners anyway. You never restate context the agent already has,
  which is efficient right up until a session runs long and it starts guessing.
verdict: Say what "done" looks like before you paste the error — half your back-and-forth is the agent guessing your acceptance bar.
source: Claude Code
generated: 2026-08-13 10:00
status: ok
seeded: true
---

| Kind of prompt | How often | What it looks like | How it goes |
|---|---|---|---|
| fix this error | 164 · 40% | "TypeError: cannot read property of undefined" | Usually one round |
| just make it work | 82 · 20% | "just make it work" | Often needs a follow-up |
| explain what this does | 57 · 14% | "what does this function do" | Lands first time |
| write it from scratch | 45 · 11% | "build a script that dedupes a CSV" | Takes two or three rounds |
| make it prettier | 33 · 8% | "make this look better" | Spirals into revisions |
| add a test | 29 · 7% | "add a test for this" | Quick, rarely disputed |
