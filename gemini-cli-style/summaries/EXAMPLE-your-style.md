---
headline: You ask for 438 things. Most of them are "explain what this does."
overview: You ask for context before you ask for changes — "explain this" and
  "summarize these files" together outnumber every fix request you send. You're
  generous with background when you want it to understand something and terse to
  the point of bare when you want it to build something, which is the opposite of
  what gets you a clean first pass. Your best-landing prompts describe the shape of
  the output you want; the ones that spiral are the ones where you paste an error
  and wait. You almost never ask it to double-check its own output before you look.
verdict: Describe the shape of the output you want on "write it from scratch" prompts too, not just the explain ones — that's where the back-and-forth lives.
source: Gemini CLI
generated: 2026-08-13 10:00
status: ok
seeded: true
---

| Kind of prompt | How often | What it looks like | How it goes |
|---|---|---|---|
| explain what this does | 118 · 27% | "walk me through what this script does" | Lands first time |
| fix this error | 97 · 22% | "this build is failing, here's the log" | Usually one round |
| write it from scratch | 88 · 20% | "scaffold a CLI that watches a folder" | Takes two or three rounds |
| summarize these files | 61 · 14% | "summarize what changed across these five files" | Quick, rarely disputed |
| make it prettier | 43 · 10% | "clean up the formatting on this" | Spirals into revisions |
| just make it work | 31 · 7% | "just make it work" | Often needs a follow-up |
