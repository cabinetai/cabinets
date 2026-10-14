---
title: How This Was Built
order: 20
tags:
  - architecture
  - decisions
---
# How This Was Built

A short engineering note for anyone reviewing this template: what it does, how it maps onto Cabinet, the decisions behind it, and what I found in Cabinet along the way.

## The problem
A local business near an arena gets a crowd on game nights and a happy crowd the morning after a win. Catching both takes someone watching schedules and scores, checking stock, making a post, and doing it fast, every time. Most small shops do not have that person.

## The approach
Humans define intent once. Agents act when the world gives them a reason. Git keeps the receipts.

- **Intent** lives in plain pages: [[promotions]] (offers written as rules), [[teams]], [[brand]], [[menu]], and the shop's own numbers in [[store-data/index]].
- **The world** comes in through public data: league schedules and scores, and the weather.
- **Action** is three agents and three skills. A promotion fires only when its rule matches, at most once per game, and only as far as stock allows.
- **The output** is a real campaign: a plan, an Instagram post with the actual score in it, an animated Story, and a caption, all waiting for a human to approve.

The template is general. Borough Slice is fictional demo data; a real business replaces six pages and keeps everything else.

## How it maps onto Cabinet
| Need | Cabinet building block | Where |
|---|---|---|
| Business knowledge | Markdown pages with frontmatter | `business.md`, `menu.md`, `brand.md`, `teams.md`, `promotions.md` |
| Live state | One file per game, frontmatter as the record | `games/` |
| Workers | Agent personas | `.agents/<slug>/persona.md` |
| Know-how | Skills stored inside the cabinet (highest precedence over machine-wide skills, so the cabinet carries its own) | `.agents/skills/` |
| Schedule | Jobs on Cabinet's scheduler, all shipped off | `.jobs/` |
| Internal data | A folder meant for a Connect Knowledge mount, with samples until then | `store-data/` |
| UI | An embedded app that reads the cabinet's own files | `game-night/` |
| Receipts | Git history and each task's Diff and Logs | built in |

Nothing in Cabinet's code was changed.

## Decisions

### Exactly once
Score checks run more than once (23:00 and 8:00), and a person can also ask at any time. The same win must never produce two campaigns.
- Each game file has `promotions_fired`, keyed by the league's own game id.
- The Promo Manager checks it **before writing anything** and logs `already fired for <game_id>`.
- It writes the campaign plan **first** and the marker **last**. The marker is the commit point.
- If a run dies in between, the next run finds a campaign folder with no marker, writes the marker instead of a second campaign, and logs `repaired marker for <game_id>`.

### A win counts only when two sources agree
- Hockey: the NHL's official API plus ESPN's public JSON. One live run also showed why the *facts* live in fields and the prose stays secondary: the Sports Desk filled every field correctly but called a game the "home opener" when a regular-season home game had been played two days earlier. Promotions read fields only. Basketball: ESPN plus the official box score found by web search (NBA's own CDN refuses direct requests).
- Every check is stored in `sources_checked`. `verified: true` needs two agreeing sources.
- ESPN's JSON is public but undocumented and could change. If it does, the skill falls back to the official box score, and an unconfirmed game simply stays unverified. A missed promotion is cheap; a wrong one is not.

### Never promote what you cannot serve
Before firing, the Promo Manager reads `inventory.csv`: available = on hand minus a reserve; need = planned cap times stock used per redemption. Enough means fire, some means fire with a lower cap stated in the copy, none means hold and tell a human.

### A chain, with a manager for the week
An early test run made the case for this. I started a schedule sync and a week plan at the same time, and the planner finished first, against an empty calendar. Adding a "boss" agent that delegates would not have fixed it: in Cabinet, delegating starts a new task and the delegating run does not wait for it. It also turned out that in Cabinet an agent's delegation is a *proposal a human approves*, and agents' messages are read only at the recipient's next heartbeat. Either would stall an overnight chain.

So **the files are the message bus**. Each agent owns a job that looks for work in the files, fifteen minutes after the step before it: Final Score Check (23:00, 8:00) writes `verified: true`; Promo Check (23:15, 8:15, 10:15) fires promotions for verified wins and today's home games and reviews finished creative; Creative Queue (23:30, 8:30, 10:30) designs plans still waiting at `draft`. The first version ran these every 30 minutes (about 28 runs a day); the calendar made the waste obvious, and 10 runs a day cover the same windows. Nobody messages anybody in the routine path, every step is safe to re-run (that is what the exactly-once marker is for), and git shows the whole chain. Delegation proposals stay for exceptions, where a human should be in the loop anyway.

The **Shop Manager** is the one lead, and it owns a different problem: the week. Every Monday it checks the calendar is fresh (and asks for a sync first if not), adds up the stock every likely promotion will use, writes a restock order, and lists what needs a human. The same test run's week plan surfaced a real gap: the Slice Pack includes garlic knots but only checked dough. Stock checks are now a list, the tightest item sets the cap, and with sample stock the knots cap the pack at 80 even though dough allows 120.

### An agent fixing its own schedule
In a live run, the Sports Desk was asked to make the sync reach back one day. It noticed a real gap (a game first synced at 9:00 would not be verified until the 22:00 score check, after the Win Slice window) and patched it by editing a job file, adding a 9:00 score check that collided with the 9:00 sync. It reported the collision itself. Two lessons: agents can and will edit outside their folder (see the findings below), and the better fix was a schedule change, not a patch: the sync moved to 7:30, so the existing 8:00 score check verifies last night's game and the Win Slice can fire at 8:15.

### Agents from Cabinet's library: adopted, adapted, benched
During testing I added eight agents from Cabinet's built-in library (CEO, CFO, Calendar Keeper, Copywriter, Data Analyst, Image Creator, Researcher, Social Media Manager) to see what fits. As added, each had 70 to 250 words of generic instructions, no knowledge of this cabinet's files or skills, and a heartbeat switched on, which would have meant about eight extra runs every weekday morning. Three still contained unfilled `{{company_name}}`, `{{goals}}` or `{{workspace_name}}` placeholders (finding 9 below, seen live).

Two had a real job here and were rewritten for it: the **Data Analyst became the Results Analyst** (measuring every promotion against real sales, taking that job off the Promo Manager so each agent has one responsibility), and the **Copywriter became the Caption Writer** (on-demand caption options). The other six overlapped an existing agent or had nothing to work with (no finance data, no calendar connector, no image service), so they were switched off and later removed, leaving a cabinet that holds only what it uses. A small team where every agent owns one folder, one skill and one schedule turned out to be easier to trust and to explain.

### Weather changes the message, not the decision
Rain or cold turns the game-night offer delivery-first; a nice evening makes it walk-up first. One rule, no extra promotion.

### Creative from data
The Social Creator writes the post and Story as SVG, so the real score and offer are in the image, and every campaign is specific to its night. Claude cannot generate photos, but it designs well in code. A real shop would add its own food photos, which also avoids showing customers AI-invented food. Generated imagery can come later as an optional connector.

The dashboard's **Save PNG** turns the SVG into the PNG Instagram needs and saves it into the campaign folder through Cabinet's upload route. The Story follows a final-frame rule (an element's normal style is its last frame), so switching animations off gives a clean still for export.

### Safety by default
- Agents and jobs ship turned off. Nothing runs until the owner turns it on.
- Skills are markdown only, which puts them in Cabinet's lowest trust tier when skills are mounted.
- Nothing posts automatically. Every campaign ends at `ready-for-review` or `held`.
- No team, league or arena marks and no partnership language.

### What I left out, on purpose
MP4 or Reel export, auto-posting, multiple shops, generated photography, and a "set this up from one sentence" bootstrap. Each is a reasonable next step; none was needed to prove the loop.

## What I found in Cabinet
Read from the Cabinet source (v0.5.3, the version available to read; the desktop app is 0.6.0, so each item is worth re-checking there).

1. **Agent folder scope is an instruction, not a boundary.** Agents run the Claude CLI with `--dangerously-skip-permissions` (`src/lib/agents/adapters/claude-local.ts:50`), with their working directory set to the cabinet (`resolveAgentCwd`, `src/lib/storage/path-utils.ts:25`). The persona's `workspace` field does not restrict writes. This template's personas still declare their folders, and the skills repeat it.
2. **The view-only guard covers Cabinet's HTTP routes, not agents' own file tools.** `assertWritablePath` is called from the pages, assets and upload routes (`src/lib/knowledge-sources/store.ts`). An agent writing through its CLI tools does not go through those routes, so a view-only Connect Knowledge mount is likely protected from the UI but not from an agent, unless the folder is also read-only at the operating-system level. **To confirm with a live test.** A fix could pass mount paths to the agent's permission settings as denied for writing, or mount them read-only at the OS level.
3. **Job schedules have no timezone.** Cron runs on the machine's local clock. This template assumes New York time and says so on its front page.
4. **`PUT /api/assets` writes text only** (`req.text()`), so binary files must go through `POST /api/upload`.
5. **Embedded apps cannot list dot-folders.** `/api/tree` leaves out `.agents` and `.jobs`, so dashboards must name their agents and jobs in code.
6. **Delegation is a proposal, and it does not wait.** The runner tells agents their `LAUNCH_TASK` lines "will be reviewed by the human before any spawn" (`src/lib/agents/conversation-runner.ts:185`), and a spawn returns without waiting for the task. Agent-to-agent `MESSAGE_TO` lines are parsed only from heartbeats and read at the recipient's next heartbeat (`src/lib/agents/heartbeat.ts:228`). Unattended pipelines therefore have to coordinate through files and schedules.
7. **No "export as template".** `src/lib/agents/skills/export-bundling.ts` notes that cabinet export is not implemented yet, so templates are assembled by hand.
8. **Skills from linked repos are not loaded yet** (`src/lib/agents/skills/loader.ts:325`).
9. **`{{company_name}}` in the built-in agent library is only filled in during onboarding** (`src/app/api/onboarding/setup/route.ts:284`). In an imported template it stays literal; `{{cabinet.name}}` is the placeholder that works everywhere, and it is what this template uses.

## Live runs
The loop is proven by running it against real games in the desktop app: a schedule sync, a verified win, the promotion firing once, the second run skipping, the crash repair, and the stock cap. Results are recorded here as each run happens.
