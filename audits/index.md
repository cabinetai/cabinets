---
title: Audits
created: '2026-05-02T00:00:00Z'
modified: '2026-05-02T00:00:00Z'
tags:
  - audit
  - quality
  - ux
  - cabinet
order: 1
---

# Audits

A cabinet for running **end-to-end product audits** — walk every surface of your product, file every friction as its own markdown issue, ship the fixes with a 20-year Senior Product Lead bar, then hand a stakeholder an **interactive review slideshow** at the end.

The bar isn't *"matches the spec."* The bar is *"this is the version a competitor will copy."*

## What this cabinet gives you

- **A method.** [`how-to-audit.md`](how-to-audit.md) — when to audit, the walkthrough order (cold-boot → primary flows → empty states → errors → edge cases → a11y → perf), the Chrome DevTools playbook, the issue-file format with severity rubric and area codes.
- **An agent.** [Product Senior](.agents/product-senior/persona.md) — Senior Product Lead, 20+ years across Netflix, Tesla, X, and Duolingo. Picks up `status: open` issues, ships fixes, updates the issue file's `## Resolution` section, appends to `progress.md`, and commits. One issue per commit.
- **A skeleton.** [`_template/`](_template/index.md) — copy this when you start a new audit. Walkthrough page, progress tracker, issues directory, screenshots directory, and a one-command **review-app generator** that turns the audit into a shareable slideshow.
- **A scheduled job.** [`.jobs/audit-fix-loop.yaml`](.jobs/audit-fix-loop.yaml) — wakes the Product Senior agent on weekday mornings to chip away at the backlog without prompting.

## The flow

```
1. Walk the product cold-boot end-to-end. Screenshot every friction.
2. File each finding as audit-YYYY-MM-DD/issues/NNN-slug.md
3. Write the long-form walkthrough in audit-YYYY-MM-DD/index.md
4. Hand the cabinet to the Product Senior agent
5. Agent ships fixes, updates issue files + progress.md
6. Run `node build-review.mjs` → a paper-themed slideshow lands in review/
7. Stakeholder clicks Pass / Fail / comment per issue
8. Failures loop back into the fix queue
```

## Folder layout

```
audits/
├── how-to-audit.md             ← the guide (read first)
├── .agents/product-senior/     ← the fixer agent (UX/UI focused)
├── .jobs/                      ← scheduled prompts (weekday morning fix loop)
├── _template/                  ← copy this when starting a new audit
│   ├── index.md                ← walkthrough skeleton
│   ├── progress.md             ← progress-tracker skeleton
│   ├── issues/                 ← drop NNN-slug.md files here as you walk
│   └── build-review.mjs        ← review-app generator (auto-derives label)
└── audit-YYYY-MM-DD/           ← one folder per audit (you create these)
    ├── index.md                ← long-form findings + screenshots
    ├── progress.md             ← fix tracker (table)
    ├── issues/                 ← one .md per finding (NNN-slug.md)
    ├── screenshots/            ← assets
    ├── build-review.mjs        ← `node build-review.mjs` → review/index.html
    ├── review/                 ← generated; click `review` in tree to open
    │   ├── index.html          ← interactive slideshow (paper theme)
    │   └── .app                ← marker → renders as fullscreen Cabinet app
    └── feedback.md             ← optional: reviewer's verdict + comment table
```

## Why "Senior Product Lead" as the bar

Most product audits read like enterprise QA reports. This one is opinionated: every finding is judged through the lens of *"would a brand-new user love this, or tolerate it?"* — and the standard is the best-in-class reference product (Linear's command palette, Stripe's checkout, Duolingo's streak, Netflix's autoplay rhythm, Tesla's feedback latency). The agent's persona is built around that taste, so the fixes don't just close the issue — they raise the bar.

## Get started

```bash
# from inside the audits cabinet
cp -r _template audit-$(date +%Y-%m-%d)
cd audit-$(date +%Y-%m-%d)
# walk your product, drop screenshots into screenshots/, file each finding as issues/NNN-slug.md
# when you're done...
node build-review.mjs   # → review/index.html
```

The review folder shows up in your sidebar tree as a fullscreen app — click it, walk every issue with Pass / Fail / comment per slide, export `reviews.json` for a portable record. Reviewer feedback flows back to the agent as the next fix queue.

Read [how-to-audit.md](how-to-audit.md) for the full method.
