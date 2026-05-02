# Cabinets

A public registry of [Cabinet](https://runcabinet.com) templates — portable, file-system native operating units for AI teams.

## What is a Cabinet?

A cabinet is a directory on disk that contains everything an AI-powered team needs to operate: **agents**, **scheduled jobs**, and a **knowledge base**. A company is modeled as a tree of cabinets.

```
my-company/
  .cabinet              # identity & metadata (YAML, no extension)
  .cabinet-state/       # runtime state (gitkeep'd, never committed)
  .agents/              # persistent AI team members
    ceo/
      persona.md        # agent identity, heartbeat, behavior
    cto/
      persona.md
  .jobs/                # scheduled automations
    weekly-brief.yaml
  cover.jpg             # registry cover image (1200×630)
  index.md              # entry point with frontmatter
  marketing/            # child cabinet
    reddit/             #   nested child cabinet
    tiktok/             #   nested child cabinet
  app-development/      # child cabinet
```

A cabinet is just a directory. Copy it, version it, share it — it works anywhere.

## Browse the Registry

Each top-level directory in this repo is a complete cabinet template you can install and customize.

| Cabinet | Domain | Agents | Jobs | Children | Description |
|---------|--------|--------|------|----------|-------------|
| [agency](./agency) | Professional Services | 2 | 2 | 2 | Digital agency managing multiple client engagements |
| [ai-hero](./ai-hero) | Education | 2 | 2 | 0 | Self-paced AI course from Python up through GPT-2 construction |
| [audits](./audits) | Operations | 1 | 2 | 0 | End-to-end product audits — walk every surface, file each friction as a markdown issue, ship fixes with a 20-yr Senior Product Lead bar, hand stakeholder an interactive review slideshow |
| [biology-experiments](./biology-experiments) | Education | 1 | 1 | 0 | Five browser-based simulations of landmark biology experiments |
| [book-factory](./book-factory) | Media | 1 | 2 | 0 | Book OS — premise, outline, chapter draft, blurb, and publishing-path matrix |
| [career-ops](./career-ops) | Operations | 2 | 5 | 0 | AI-powered job search command center with pipeline tracking and CV tailoring |
| [content-creator](./content-creator) | Media | 2 | 2 | 0 | Solo content creator operation with strategy, editing, and analytics |
| [cooking](./cooking) | Lifestyle | 1 | 1 | 0 | Pantry tracker, recipe suggestions, and weekly meal-plan generator |
| [course-factory](./course-factory) | Education | 1 | 2 | 0 | Course OS — curriculum, lessons, sales page, and launch sequence |
| [ecommerce](./ecommerce) | E-commerce | 2 | 2 | 0 | DTC brand with inventory, email marketing, and fulfillment ops |
| [fitness](./fitness) | Lifestyle | 1 | 1 | 0 | Strength and conditioning tracker with smart deload suggestions |
| [job-hunt-hq](./job-hunt-hq) | Operations | 2 | 4 | 0 | Career strategist, resume tailor, interview coach, and networking scout |
| [keto-hq](./keto-hq) | Lifestyle | 2 | 4 | 0 | Macros, electrolytes, stall diagnosis, and meal planning for keto protocol |
| [mom-command](./mom-command) | Lifestyle | 1 | 2 | 0 | Root cabinet for the Mom & Baby series — shared family context and data |
| [music-factory](./music-factory) | Media | 0 | 0 | 0 | Browser-native MIDI factory with piano roll, Web Audio playback, and .mid export |
| [newborn](./newborn) | Lifestyle | 1 | 2 | 0 | Survival tracker for weeks 0–12 — feeds, sleep, milestones, red flags |
| [newsletter-factory](./newsletter-factory) | Media | 1 | 2 | 0 | Newsletter OS — brand voice, calendar, drafts, subject-line generators, platform guide |
| [personal-os](./personal-os) | Operations | 1 | 1 | 6 | Second-brain cabinet with six life areas (brain, family, home, money, health, play) |
| [physics-101](./physics-101) | Education | 1 | 1 | 0 | 6-module beginner curriculum — Motion through Light, no calculus required |
| [physics-experiments](./physics-experiments) | Education | 1 | 1 | 0 | Five browser-based simulations of classic physics experiments |
| [podcast-factory](./podcast-factory) | Media | 1 | 2 | 0 | Podcast OS — brand, calendar, scripts, shownotes, and recording-platform guide |
| [reading-room](./reading-room) | Education | 1 | 1 | 0 | Private Goodreads — TBR, ratings, what-I-learned notes, year-in-review |
| [real-estate](./real-estate) | Sales | 2 | 2 | 3 | Real estate brokerage with listings management, marketing, and client relations |
| [saas-startup](./saas-startup) | Software | 2 | 2 | 0 | B2B SaaS with product-led growth, engineering, and customer success |
| [text-your-mom](./text-your-mom) | Software | 2 | 3 | 3 | B2C app company with TikTok, Reddit, and engineering child cabinets |
| [usa-travel-planner](./usa-travel-planner) | Lifestyle | 2 | 3 | 0 | National parks map, state fairs, and event-hunter agent for US travel |
| [wedding-planner](./wedding-planner) | Lifestyle | 1 | 2 | 0 | Wedding OS — timeline, budget tracker, vow generators, and day-of runbook |
| [youtube-channel-factory](./youtube-channel-factory) | Media | 1 | 2 | 0 | YouTube OS — brand, calendar, scripts, thumbnail briefs, and gear guide |

**Totals:** 28 cabinets, 38 agents, 56 jobs across the registry.

## Cabinet File Format

### `.cabinet` (YAML, no extension)

The identity file. Every cabinet directory must have one.

```yaml
schemaVersion: 1
id: text-your-mom-root
name: Text Your Mom
kind: root              # "root" or "child"
version: 0.1.0
description: Relatable B2C app company cabinet.
entry: index.md         # markdown entry point
```

Child cabinets declare their relationship to the parent:

```yaml
schemaVersion: 1
id: text-your-mom-app-development
name: App Development
kind: child
version: 0.1.0
description: Product, engineering, QA, and release cabinet.
entry: index.md

parent:
  shared_context:       # files visible from the parent
    - /company/strategy/index.md
    - /company/goals/index.md

access:
  mode: subtree-plus-parent-brief
```

### `.agents/<slug>/persona.md` (Markdown + YAML frontmatter)

Each agent is a directory containing a `persona.md` file. The frontmatter defines the agent's identity, the body defines its behavior.

```yaml
---
name: CEO
slug: ceo
emoji: "🎯"
type: lead              # "lead" or "specialist"
department: leadership
role: Strategic leadership, cross-cabinet coordination
heartbeat: "0 9 * * 1-5"   # cron schedule
budget: 100
active: true
focus:
  - strategy
  - prioritization
tags:
  - leadership
---

# CEO Agent

You are the CEO of Text Your Mom.
Your job is to keep the whole company aligned...
```

**Frontmatter fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `name` | yes | Display name |
| `slug` | yes | Directory name / identifier |
| `emoji` | no | Visual identifier |
| `type` | yes | `lead` or `specialist` |
| `department` | no | Organizational grouping |
| `role` | yes | One-line role description |
| `heartbeat` | no | Cron schedule for periodic check-ins |
| `budget` | no | Relative token budget (0-100) |
| `active` | no | Whether the agent is active (default: true) |
| `focus` | no | List of focus area tags |
| `tags` | no | Classification tags |

### `.jobs/<name>.yaml` (YAML)

Scheduled automations owned by agents.

```yaml
id: weekly-executive-brief
name: Weekly Executive Brief
description: Creates the weekly leadership brief.
ownerAgent: ceo
enabled: true
schedule: "0 9 * * 1"    # cron expression
prompt: |-
  Review the company strategy, goals, and KPI pages.
  Write a sharp weekly executive brief that includes:
  - what changed this week
  - the biggest growth or retention signal
  - the top product risk
  - one decision leadership should make next
```

**Job fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Unique identifier |
| `name` | yes | Display name |
| `description` | no | What the job does |
| `ownerAgent` | yes | Agent slug that runs this job |
| `enabled` | yes | Whether the job is active |
| `schedule` | yes | Cron expression |
| `prompt` | yes | The prompt the agent executes |

### `index.md` (Markdown + YAML frontmatter)

The entry point for the cabinet. Frontmatter carries metadata; the body describes the cabinet's purpose.

```yaml
---
title: Text Your Mom
tags:
  - b2c
  - company
---

# Text Your Mom

A consumer app that helps people stay close to family...
```

### `cover.jpg`

The registry cover image shown in the Cabinet app carousel and browser. Every cabinet in this registry ships with one.

- **Size:** 1200×630 px
- **File size:** under 100 KB
- **Style:** pastel, minimalist, flat — soft gradient background, a single centered icon or simple illustration, the cabinet name in clean sans-serif. No photos, no busy layouts.

### `.cabinet-state/` (runtime directory)

Reserved for runtime state — conversation history, agent memory, generated outputs. Kept empty with a `.gitkeep` in templates so the directory exists but nothing inside gets committed.

## Cabinet Tree Structure

Cabinets nest. A root cabinet can contain child cabinets, which can contain their own children. Each child is a self-contained operating unit that inherits shared context from its parent.

```mermaid
graph TD
    CEO["🎯 CEO"]
    COO["⚙️ COO"]
    CFO["💰 CFO"]
    CTO["🛠️ CTO"]

    CEO --> COO
    CEO --> CFO
    CEO --> CTO

    subgraph App Development
        PM["🎯 Product Manager"]
        DEV["🛠️ CTO"]
        QA["🧪 QA"]
        DEVOPS["🚀 DevOps"]
    end

    subgraph Reddit Growth
        GM["🚀 Growth Marketer"]
        RES["🔍 Researcher"]
        CW["✍️ Copywriter"]
        DA["📊 Data Analyst"]
    end

    subgraph TikTok Growth
        TS["🔍 Trend Scout"]
        SW["✍️ Script Writer"]
        IC["🎨 Image Creator"]
        PO["📈 Post Optimizer"]
    end

    CTO --> PM
    CTO --> DEV
    PM --> QA
    PM --> DEVOPS

    COO --> GM
    COO --> RES
    GM --> CW
    GM --> DA

    COO --> TS
    TS --> SW
    SW --> IC
    IC --> PO
```

*Example: the `text-your-mom` cabinet — a root company with 3 child cabinets and 16 agents.*

## The Transposition

A cabinet maps the three pillars of a human organization onto plain files:

| Human Organization | Cabinet Equivalent | Location |
|---|---|---|
| **People** (employees, roles) | **Agents** (personas, heartbeats) | `.agents/<slug>/persona.md` |
| **Meetings** (standups, reviews) | **Jobs** (cron schedules, prompts) | `.jobs/<name>.yaml` |
| **Knowledge** (tribal, institutional) | **Files** (markdown, CSV, data) | `*.md`, `*.csv` in the tree |

## Install a Cabinet

```bash
npx cabinets add hilash/cabinets/text-your-mom
```

Or with git directly:

```bash
git clone --filter=blob:none --sparse https://github.com/hilash/cabinets.git && cd cabinets && git sparse-checkout set text-your-mom
```

## Community

Have a cabinet idea? Want to see what others are building?

Join the **[Cabinet Discord](https://discord.com/invite/hJa5TRTbTH)**:

- **`#cabinets` channel** — request a cabinet you'd like to see, upvote others' ideas, or share one you built
- Ask questions about the format, get feedback on your structure, or just lurk and see what's coming next

## Contributing

Want to add a cabinet to the registry? Here's the full checklist.

### Required files

Every cabinet must include these files — no exceptions:

```
my-cabinet/
  .cabinet                      # YAML identity file (see schema above)
  .cabinet-state/
    .gitkeep                    # keeps the dir in git; nothing else goes here
  .agents/
    <slug>/
      persona.md                # at least one agent
  .jobs/
    <name>.yaml                 # at least one job
  index.md                      # entry point with YAML frontmatter
  cover.jpg                     # 1200×630 px, < 100 KB, pastel minimalist style
```

### Steps

1. Scaffold with `npx create-cabinet` or copy an existing cabinet as a starting point
2. Fill in real content — agents with clear personas, jobs with useful prompts, an `index.md` that explains the cabinet's purpose
3. Add a `cover.jpg` that matches the registry style: pastel background, single icon or simple illustration, cabinet name in clean sans-serif
4. Run `node .github/scripts/build-manifest.mjs` locally and confirm your cabinet appears in `manifest.json`
5. Fork this repo, add your cabinet directory, and open a pull request — CI rebuilds the manifest on merge

Not sure where to start or want feedback before opening a PR? Post in the [#cabinets channel on Discord](https://discord.com/invite/hJa5TRTbTH).

## License

[MIT](./LICENSE)
