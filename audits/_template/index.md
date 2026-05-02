---
title: "<Project> — Audit YYYY-MM-DD"
created: 'YYYY-MM-DD'
modified: 'YYYY-MM-DD'
tags: [audit, product]
order: 1
---

# <Project> — Audit YYYY-MM-DD

**Auditor persona.** Senior Product Lead, 20+ years across Netflix, Tesla, X, and Duolingo. Bar: best-in-class UX/UI — _"the version a competitor will copy."_
**Scope.** _e.g._ Web app on `npm run dev`, build `X.Y.Z`, branch `…`, macOS, Chrome DevTools-driven walkthrough.
**Method.** Cold-boot the app, walk every primary surface, capture screenshots, read the network + console while clicking.
**Output.** This index (walkthrough with inline screenshots + summary table at the end), one page per issue under `issues/`, screenshots in `screenshots/`.

> Replace `YYYY-MM-DD` and the `<Project>` placeholder above. Delete this blockquote when done.

---

## How to read this

**Severity** P0 ship-blocker · P1 high · P2 medium · P3 polish · P4 nice-to-have
**Status** 🟢 fixed · ⚪ open · 🟡 deferred · ✱ skipped
**Areas** _list your project's area codes here, e.g._ `BOOT`, `HOME`, `NAV`, `EDIT`, `A11Y`, `PERF`, `COPY`, `MISC`

The walkthrough below references issues by `#NNN`. Click any ID in the summary table to jump to its full issue page.

---

## Top 10 things I would fix this week

1. **#001 — _short title_** — _one-line "why this matters"_
2. _..._

---

## Themes

Recurring structural patterns across multiple issues. Each theme cites the issue numbers it covers.

### Theme 1 — _name_
_one-paragraph description._
Issues: #NNN, #NNN, #NNN.

### Theme 2 — _name_
_..._

---

## Walkthrough — what a new user sees

> The "long beautiful list". Each numbered step is one surface of the app, in walkthrough order. Embed screenshots **inline between the issue references** — that's what makes this page worth reading end to end.

1. **First load** — _what you see_, _what's broken_. (#001-#005)

   ![First load — disclaimer + tour stacked](screenshots/01-first-load.png)

   _One short paragraph describing the screenshot if it's not self-evident._

2. **Homescreen** — _..._. (#006-#015)

   ![Homescreen viewport](screenshots/03-homescreen.png)

3. **Editor** — _..._. (#016-#030)

   ![Editor toolbar overflow](screenshots/12-editor-toolbar.png)

4. **Agents** — _..._. (#031-#045)

5. **Tasks** — _..._. (#046-#060)

6. **Search / Settings / Status bar / Terminal** — _..._. (#061-#NNN)

> Tip: don't wait until every issue is filed before writing the walkthrough. Write each numbered step as you finish that surface — the screenshots are still on top of your `~/Downloads`.

---

## Summary table — all NN findings

The numbering is stable. Each row links to the issue page; the issue page has the full repro and recommendation.

| #   | Sev | Area | Title                         | Status | Link                                      |
|-----|-----|------|-------------------------------|--------|-------------------------------------------|
| 001 | P?  | ???  | _short title_                 | ⚪      | [link](issues/001-slug.md)                |
| 002 | P?  | ???  | _..._                         | ⚪      | [link](issues/002-slug.md)                |
| ... | ... | ...  | ...                           | ...    | ...                                       |

---

## Suggested next steps

- **This week.** Ship the Top 10. _list._
- **Next sprint.** Themes 1 and 3 in one batch.
- **Later.** P3/P4 polish pass, accessibility sweep, perf budget.
