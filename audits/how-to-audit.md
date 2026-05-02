---
title: How to run an audit
created: '2026-05-02T00:00:00.000Z'
modified: '2026-05-02T00:00:00.000Z'
tags:
  - audit
  - guide
  - methodology
order: 2
---
# How to run an audit

An **audit** is a single, end-to-end walkthrough of a product where every friction, bug, accessibility issue, performance smell, and copy mistake gets recorded as a separate file. The output is reproducible: another person could open the audit folder and see exactly what was found, where, and what to do about it.

**The bar is best-in-class UX/UI.** Not "good enough", not "matches the spec" — *"this is the version a competitor will copy."* Walk the product like a Senior Product Lead with 20+ years across Netflix, Tesla, X, and Duolingo. If a flow has friction, name the heuristics it violates and what the reference product (Linear, Stripe, Duolingo, Netflix...) does instead. The audit is the standards document for the next sprint.

The format below is project-agnostic. Apply it to any product you ship. This cabinet ships a **Product Senior** agent at [`.agents/product-senior/persona.md`](.agents/product-senior/persona.md) that picks up open issues and drives them to fixed with the UX/UI bar above; if you're running the loop manually instead, the agent piece is optional — a human can do the same work end-to-end.

---

## 1\. When to run an audit

-   **Pre-release** — before any version that real users will see. Catches the embarrassing stuff.
    
-   **After a major refactor** — UX regressions are the most expensive kind to discover late.
    
-   **Before a launch / press push** — the demo path needs to be flawless.
    
-   **On a cadence** — quarterly is plenty for a stable product. Monthly during heavy iteration.
    

Don't audit while a feature is half-built. The signal-to-noise ratio collapses.

---

## 2\. The walkthrough method

You're playing the part of a brand-new user. **Open the app cold, with no shortcuts.** Then walk every workflow once, in this order:

1.  **First launch** — empty state, onboarding, permissions prompts, default content.
    
2.  **Primary flows** — the 2–3 things the product is *for*. Do each one fully.
    
3.  **Secondary flows** — settings, profile, billing, search, exports.
    
4.  **Empty states** — what does each page look like with zero data?
    
5.  **Error paths** — disconnect the network, supply bad input, force every visible error.
    
6.  **Edge cases** — long names, RTL text, very small viewports, very large lists.
    
7.  **Accessibility** — keyboard-only navigation, screen-reader landmarks, focus indicators.
    
8.  **Performance** — first paint, interaction latency, big-list scroll, memory growth.
    

Take a screenshot at every meaningful state, **before** trying to fix anything. The screenshot is the evidence. You'll forget what the broken state looked like ten minutes after you fix it.

Record findings as you go, in a separate buffer (a notes app, a scratch markdown file). Don't refactor the codebase mid-walkthrough — the goal of the walkthrough is *coverage*, not yak-shaving.

---

## 3\. Tooling — Chrome DevTools

The single most useful tool. Open with **Cmd-Option-I** (Mac) / **Ctrl-Shift-I** (Win/Linux), or right-click → Inspect.

### Screenshots from DevTools

Open the **Command Menu** with **Cmd-Shift-P** / **Ctrl-Shift-P**, then type `screenshot`:

<table class="border-collapse w-full" style="min-width: 50px;"><colgroup><col style="min-width: 25px;"><col style="min-width: 25px;"></colgroup><tbody><tr><th colspan="1" rowspan="1"><p>Command</p></th><th colspan="1" rowspan="1"><p>What it captures</p></th></tr><tr><td colspan="1" rowspan="1"><p><code>Capture screenshot</code></p></td><td colspan="1" rowspan="1"><p>The visible viewport. Default.</p></td></tr><tr><td colspan="1" rowspan="1"><p><code>Capture full size screenshot</code></p></td><td colspan="1" rowspan="1"><p>The entire scrollable page, even off-screen. Best for long lists, landing pages, settings panels.</p></td></tr><tr><td colspan="1" rowspan="1"><p><code>Capture node screenshot</code></p></td><td colspan="1" rowspan="1"><p>The single DOM node currently selected in the Elements panel. Best for isolating one component.</p></td></tr><tr><td colspan="1" rowspan="1"><p><code>Capture area screenshot</code></p></td><td colspan="1" rowspan="1"><p>A drag-rectangle. Best for cropping out chrome you don't want.</p></td></tr></tbody></table>

Files land in `~/Downloads`. Rename and move them into the audit's `screenshots/` folder immediately — don't let them pile up untyped.

### Console & Network

-   **Console** panel: leave it open during the entire walkthrough. Every red error gets a finding. Every yellow warning is at least worth a glance.
    
-   **Network** panel: throttle to "Slow 3G" or "Fast 3G" for a session. You'll find loading-state bugs you'd never see on localhost.
    
-   **Network** → **Disable cache** while DevTools is open: cached assets hide stale-content bugs.
    
-   **Network** → **Offline** checkbox: every flow should fail gracefully offline. Most don't.
    

### Device emulation

The icon top-left of DevTools (📱). Pick a real device profile (iPhone 14, Pixel 7) — not "Responsive" — because devices have specific viewport quirks. Walk through the primary flows once on mobile.

### Performance & Lighthouse

-   **Performance** panel: hit Record, do the slowest interaction in the app, hit Stop. Look for long tasks (red bars > 50ms), forced reflows, big script-evaluation chunks.
    
-   **Lighthouse** panel: run a full audit (Performance, Accessibility, Best Practices, SEO). Every score below 90 is at least one finding. The flagged items often write the issue text for you.
    

### Memory

-   **Memory** panel: take a heap snapshot before a heavy interaction, do the interaction 10 times, take another snapshot. Compare. A growing object count usually means a leak. File it.
    

### macOS fallback shortcuts

Sometimes you need a screenshot of the whole app window including OS chrome (e.g. menu-bar bugs):

-   **Cmd-Shift-4** then **Space** → click a window → captures the window with shadow.
    
-   **Cmd-Shift-5** → screen-record any region. Good for hard-to-screenshot bugs (animation glitches, layout flicker).
    

> \[!TIP\] If your product runs in an Electron window or any other Chromium shell, open DevTools with the same **Cmd-Option-I** / **Ctrl-Shift-I** shortcut you'd use in a normal browser tab. Everything in this section applies.

---

## 4\. Recording findings — the file format

**One issue per file. Never bundle.** Two issues in one file means one of them gets forgotten when the other is fixed.

Files live in `audit-YYYY-MM-DD/issues/` and are named `NNN-kebab-slug.md` where `NNN` is a 3-digit, zero-padded sequential number assigned in walkthrough order:

```
issues/001-better-sqlite3-mismatch.md
issues/002-daemon-down-status-mismatch.md
issues/003-next16-middleware-deprecation.md
...


```

### Issue file frontmatter (required)

```yaml
---
title: "NNN — short imperative title"
severity: P0|P1|P2|P3|P4
area: BOOT|HOME|NAV|...     # short uppercase tag, see area table below
type: bug|UX|a11y|perf|copy|info-arch|branding
created: 'YYYY-MM-DD'
status: open|fixed|deferred|skipped
fixed: 'YYYY-MM-DD'         # only present when status: fixed
tags: [audit, ...other tags]
---


```

### Issue file body (required sections)

```markdown
# NNN — short imperative title

## Observation
What you saw. Be concrete and falsifiable. "The login button is gray" beats "the login flow feels off".

## Repro
Numbered steps a stranger could follow on a fresh checkout. Include the URL, the data, the device, the network condition.

## Recommendation
What should happen instead. If there are multiple options, list them and call out the preferred one.

## Effort
S (1–2h) | M (half day to a day) | L (multi-day)

## Screenshot
`screenshots/NN-descriptive-name.png`
(Plain text reference, NOT markdown image syntax. The audit's index.md inlines them; the issue file just points.)


```

After a fix, append a `## Resolution (YYYY-MM-DD)` section with what changed, why (name the heuristic / reference product the choice maps to), user impact, and a before / after screenshot for any UI change. The Product Senior agent does this automatically; humans do it manually.

### Severity rubric

<table class="border-collapse w-full" style="min-width: 75px;"><colgroup><col style="min-width: 25px;"><col style="min-width: 25px;"><col style="min-width: 25px;"></colgroup><tbody><tr><th colspan="1" rowspan="1"><p>Code</p></th><th colspan="1" rowspan="1"><p>Meaning</p></th><th colspan="1" rowspan="1"><p>Examples</p></th></tr><tr><td colspan="1" rowspan="1"><p><strong>P0</strong></p></td><td colspan="1" rowspan="1"><p>Ship-blocker. The app is broken or actively misleading.</p></td><td colspan="1" rowspan="1"><p>Daemon silently crashes; data loss; security exposure.</p></td></tr><tr><td colspan="1" rowspan="1"><p><strong>P1</strong></p></td><td colspan="1" rowspan="1"><p>High. A real user will hit this on day one and it'll cost trust.</p></td><td colspan="1" rowspan="1"><p>Sign-up form doesn't validate; primary CTA mis-routes.</p></td></tr><tr><td colspan="1" rowspan="1"><p><strong>P2</strong></p></td><td colspan="1" rowspan="1"><p>Medium. Annoying, common, but the user can recover.</p></td><td colspan="1" rowspan="1"><p>Toast messages overlap; modal can be dismissed by clicking through.</p></td></tr><tr><td colspan="1" rowspan="1"><p><strong>P3</strong></p></td><td colspan="1" rowspan="1"><p>Polish. Cosmetic, copy, alignment.</p></td><td colspan="1" rowspan="1"><p>Inconsistent capitalization; 1px off-grid; tooltip lag.</p></td></tr><tr><td colspan="1" rowspan="1"><p><strong>P4</strong></p></td><td colspan="1" rowspan="1"><p>Nice-to-have. A future-you problem.</p></td><td colspan="1" rowspan="1"><p>Speculative refactors; optimization that hasn't been measured.</p></td></tr></tbody></table>

If you can't decide between two adjacent severities, pick the higher one. P-inflation is a smaller sin than P-deflation.

### Area codes

These are short uppercase tags so the issue table sorts well. Define a list at the start of the audit and stick to it. Cabinet's audit uses, for example: `BOOT`, `DISC`, `HOME`, `NAV`, `EDIT`, `AG` (agents), `TASKS`, `SEARCH`, `SETT`, `STATUS`, `A11Y`, `PERF`, `COPY`, `SCHED`, `URL`, `MISC`. Your project will have its own.

> \[!IMPORTANT\] **Don't invent new field names.** The Product Senior agent and the review-app generator both parse `severity`, `area`, `type`, `status`, and `fixed` by name. Add your own tags freely — but keep the canonical fields canonical.

---

## 5\. Screenshots

-   Live in `audit-YYYY-MM-DD/screenshots/`.
    
-   Named `NN-kebab-slug.png` where `NN` is sequential **by walkthrough order**, not by issue number. (Multiple issues often share the same screenshot.)
    
-   PNG, full-resolution from DevTools (don't compress — disk is cheap).
    
-   Reference from issue files as plain text: `` `screenshots/04-server-status-popover.png` ``. The audit's `index.md` is the only place that inlines images.
    
-   Don't put screenshots elsewhere. Don't link to absolute paths. Don't link to external URLs.
    

> \[!TIP\] Most markdown renderers (including Cabinet's) resolve relative paths from the page's location — `screenshots/04-...png` referenced from `audit-2026-MM-DD/index.md` resolves to `audit-2026-MM-DD/screenshots/04-...png`. Keep paths relative; absolute paths only break.

---

## 6\. The audit `index.md` — the long beautiful page

This is the document that makes an audit worth reading. It's a single long page with **two things**:

1.  A **Walkthrough** — surface by surface, with inline screenshots embedded **between the issue references**. The screenshots are what make this readable end-to-end. Embed them with markdown image syntax (`![alt](screenshots/NN-name.png)`) — this is the only place in the audit where screenshots are inlined as images. (Issue files reference screenshots as plain text; the long index inlines them.)
    
2.  A **Summary table** at the end — every issue, sortable by severity / area, each row linking to its issue file.
    

Skeleton (full version is in `_template/index.md` — copy that, don't retype this):

```markdown
---
title: "<Project> — Audit YYYY-MM-DD"
created: 'YYYY-MM-DD'
modified: 'YYYY-MM-DD'
tags: [audit, product]
order: 1
---

# <Project> — Audit YYYY-MM-DD

**Scope.** … **Method.** … **Output.** …

## How to read this
Severity legend, status icons, area codes.

## Top 10 things I would fix this week
The 10 to fix first. Curated, not auto-sorted.

## Themes
Recurring structural patterns. Each theme cites the issue numbers it covers.

## Walkthrough — what a new user sees
1. **First load** — … (#001-#005)

   ![First load](screenshots/01-first-load.png)

2. **Homescreen** — … (#006-#015)

   ![Homescreen](screenshots/03-homescreen.png)

   …continue surface by surface, embedding screenshots between issue ranges…

## Summary table — all NN findings
| # | Sev | Area | Title | Status | Link |
|---|---|---|---|---|---|
| 001 | P0 | BOOT | … | ⚪ | [link](issues/001-…md) |

## Suggested next steps
This week / next sprint / later.


```

Three rules:

-   **Screenshots go in the Walkthrough, inline, between the issues they belong to.** Not in a separate "Screenshots" section. Not only at the top. Not only at the bottom. Inline.
    
-   **Every issue gets a row in the Summary table.** The walkthrough cites issue *ranges* (`#001-#005`); the table is the per-issue index with links into `issues/`.
    
-   **The** `index.md` **is a snapshot.** Once the walkthrough is done and every issue file exists, don't edit it. Status changes live in the issue files and `progress.md`.
    

---

## 7\. The `progress.md` — the live tracker

A single page that tracks every issue's status. Lives next to `index.md` inside the audit folder.

```markdown
---
title: Audit YYYY-MM-DD — Progress
created: 'YYYY-MM-DD'
modified: 'YYYY-MM-DD'
tags: [audit, progress, fixes]
---

# Audit YYYY-MM-DD — Progress

🟢 0 Done · ⚪ 0 Open · 🟡 0 Deferred · ✱ 0 Skipped

## Fixed

| # | Sev | Area | Title | How it was fixed |
|---|---|---|---|---|

## Open / Deferred / Skipped

(narrative grouped by area, or just a second table)


```

Update rules:

-   The tally at the top is **canonical**. If your tally says 100 Done, the issue files must contain exactly 100 with `status: fixed`. A diff between the two is a bug.
    
-   Each row links to the issue file by relative path: `[#001](issues/001-better-sqlite3-mismatch.md)` — not just `#001`.
    
-   Add a row when an issue closes (fixed/deferred/skipped). Don't pre-populate.
    

> \[!NOTE\] The `progress.md` is what the Product Senior agent appends to as it ships fixes. Humans can edit it too — both are first-class.

---

## 8\. The fixer agent (optional but recommended)

If your project has agents (Cabinet does — see `.agents/product-senior/persona.md` in this folder), give one ownership of the audit's fix loop:

1.  Pick the next `status: open` issue (highest severity, then lowest number).
    
2.  Read the issue file.
    
3.  Implement the fix. **If genuinely torn between two viable designs** — write a `demos/NNN-slug.md` page in the audit folder with each variation side-by-side, link it from the issue, set the issue to `deferred` until the human picks, then come back and ship the chosen one.
    
4.  **No regressions.** Before declaring done: trace dependents, run tests / smoke-check the surrounding flow, confirm nothing else moved.
    
5.  Update frontmatter (`status: fixed`, `fixed: today`).
    
6.  Append a `## Resolution` section (with before / after screenshot for UI changes).
    
7.  Append a row to `progress.md`.
    
8.  Commit.
    

If you don't have agents, a human running the same loop end-to-end works fine. The point is that the loop is small enough to fit in one head.

---

## 9\. Starting a new audit

```bash
# from the audits cabinet root
cp -r _template audit-$(date +%Y-%m-%d)


```

Then:

-   Open the new folder's `index.md` and fill in the date / tags.
    
-   Walk through the app (sections 2 + 3 above).
    
-   Number issues `001`, `002`, ... as you discover them. File each as its own `issues/NNN-slug.md`.
    
-   Inline screenshots into `index.md` as you go; reference them from issue files as plain text.
    
-   When the walkthrough is done, write the `Top 10`, `Themes`, and the issues table at the top of `index.md`.
    
-   Hand the cabinet to the fixer agent (or to yourself).
    

> \[!TIP\] `_template/` already includes `build-review.mjs`. The copy carries forward into your new audit folder, so the review app (section 10) works on day one — no manual setup.

---

## 10\. The review app — the bomb at the end

Every audit ships with a one-command **interactive review slideshow** that turns the per-issue markdown files into a paper-themed, click-through verification surface. It's the difference between "65 issues sit fixed in a folder" and "the human walks through 65 issues in 20 minutes and signs off — or doesn't — with a verdict + comment per issue."

**Generate (or regenerate) it:**

```bash
cd audit-YYYY-MM-DD
node build-review.mjs
```

Writes two things into `review/`:

-   `index.html` — a single self-contained file (~200 KB). All issue data, CSS, and JS embedded. Loads `marked` from a CDN for markdown rendering and Google Fonts (Source Serif 4 + Inter) for the paper aesthetic.
    
-   `.app` — empty marker file. Its presence flips the `review/` folder from a "website" tree node into a **fullscreen app** node when opened inside Cabinet — the slideshow takes over the viewport with an "Exit app" button in the header. Outside Cabinet (any browser), `index.html` opens normally.
    

**Open it inside Cabinet:** click the `review` entry under the audit folder in the sidebar tree — it opens at full viewport. Or paste `#/p/<path>/audit-YYYY-MM-DD/review` into the URL bar.

**Open it in any browser** (no Cabinet needed): point a static server at the audit folder and visit `review/index.html`. The CDN-loaded fonts and `marked` mean it works fully offline-of-Cabinet too.

### What's in the slideshow

-   **One slide per issue.** Severity / area / status badges + a verdict pill once the user has voted.
    
-   **Two-pane layout:** *What was* (the `## Observation`) ↔ *What changed* (the `## Resolution`, `## Skip note`, or `## Deferral note` — whichever exists).
    
-   **Inline screenshot** when the issue's `## Screenshot` line is present. Click to open a lightbox at full resolution; click the backdrop or press `Esc` to close.
    
-   **Comment textarea** that autosaves on every keystroke + on blur.
    
-   **Pass / Fail / Skip** buttons. Pass auto-advances; Fail stays put (so you can keep typing); Skip moves on without recording a verdict.
    
-   **Top-bar** progress bar with running totals (`N✓ N✗ N·`) and a Summary view that shows every issue with its verdict + comment in one sortable table.
    

### Keyboard shortcuts

<table class="border-collapse w-full"><colgroup><col><col></colgroup><tbody><tr><th>Key</th><th>What it does</th></tr><tr><td><code>←</code> / <code>→</code></td><td>Previous / next slide</td></tr><tr><td><code>P</code></td><td>Pass (auto-advances)</td></tr><tr><td><code>F</code></td><td>Fail (stays on slide)</td></tr><tr><td><code>S</code></td><td>Skip (no verdict, advances)</td></tr><tr><td><code>G</code></td><td>Toggle summary table</td></tr><tr><td><code>Esc</code></td><td>Close screenshot lightbox</td></tr></tbody></table>

### Persistence — verdicts and comments

Reviews live in `localStorage` keyed by audit folder name (`cabinet-audit-<folder>-reviews-v1`). Each entry: `{ verdict: "pass" | "fail" | null, comment: string, reviewedAt: ISO-date }`. Survives reload, page-close, and Cabinet restart.

For a portable record, hit **Export JSON** in the top bar (or **Download reviews.json** in the Summary). The downloaded `reviews.json` is the same shape as the in-browser store and can be checked into the audit folder if you want a permanent record alongside the issue files.

### When to regenerate

The script reads the on-disk markdown each run, so re-run it any time you:

-   Closed (or re-opened) an issue
    
-   Edited an `## Observation` or `## Resolution` body
    
-   Added or moved a screenshot referenced by an issue file
    
-   Want to ship the cabinet to a stakeholder for sign-off
    

The HTML output is overwritten each run; the `localStorage` verdicts are keyed by audit folder, so your in-progress review survives a regeneration.

### Acting on the feedback

When the reviewer hands back their `reviews.json` (or you read it from their summary export), the failures are the contract. For each Fail + each Pass-with-comment:

1.  Treat it as a new fix request against the same issue. Don't re-open the issue — that's the audit snapshot. Add a `## Review feedback (YYYY-MM-DD)` section to the issue file describing the verdict, comment, and what you'll change.
    
2.  Implement the follow-up fix.
    
3.  Append a fresh resolution paragraph beneath the review-feedback section so the history is linear.
    
4.  Save the feedback table to `audit-YYYY-MM-DD/feedback.md` so the verdict + comment record lives alongside the audit on disk (in addition to whatever the reviewer keeps in their browser's `localStorage`).
    

The Product Senior agent does this automatically. Humans do it manually.

> \[!NOTE\] `_template/build-review.mjs` is project-agnostic in the script body, and the rendered HTML uses a soft warm-paper palette by default. To re-brand the slideshow for your product, swap the `:root` token block at the top of the embedded `<style>` for your own colors and fonts — the rest of the script doesn't care.

---

## 11\. Anti-patterns

-   **Mixing audit and fix in the same session.** You'll subconsciously soft-pedal findings to avoid the work. Walk first, fix later.
    
-   **Editing the issues table in** `index.md` **after the audit closes.** It's a snapshot. Status changes live in the issue files and `progress.md`.
    
-   **Multiple issues per file.** Always splits poorly later.
    
-   **Skipping screenshots because "it's obvious".** It's never obvious six months later.
    
-   **Calling everything P1.** Read the rubric. Be honest about ship-blockers vs. polish.
    
-   **Linking to issue files by** `#NNN` **only.** Use relative paths so links survive renames.
    
-   **Closing an audit without regenerating the review app.** `progress.md` is for fixers; `review/index.html` is for stakeholders. Skipping it means the human reviewer reads 65 raw markdown files instead of clicking through them. Don't.
    
-   **Hand-editing** `review/index.html`. It's a build artifact. Edit the issue file and re-run `node build-review.mjs`.
