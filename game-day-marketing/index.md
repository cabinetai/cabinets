---
title: Borough Slice
created: '2026-10-05T00:00:00Z'
modified: '2026-10-05T00:00:00Z'
tags:
  - marketing
  - local-business
  - sports
  - nyc
  - instagram
  - pizza
order: 1
---
# Borough Slice

An AI marketing team for a local business that follows its home teams. It knows when the Knicks and Rangers play, notices when they win, fires the right promotion exactly once, checks it against what is in stock, and leaves a ready-to-post Instagram campaign for you to approve.

Borough Slice is a fictional pizza shop two blocks from Madison Square Garden. It is the worked example. To use this for your own business, replace the business pages (see **Make it yours**).

Open [[game-night]] for the one-screen view, and [[week-ahead]] for this week's plan.

## How it works
1. **Games.** The Sports Desk keeps [[games]] current for every team in [[teams]], and checks final scores against two sources before calling a win.
2. **Triggers.** [[promotions]] are rules. The Game Night Slice Pack fires on the day of a home game; the Win Slice fires after a verified win.
3. **Stock check.** Before firing, the Promo Manager checks [[store-data/index]], so we never promote what we cannot serve. Short on stock means a lower cap; none means it waits for you.
4. **Campaign.** It writes the plan in [[campaigns]] and hands off to the Social Creator for the post (with the real score in it), the animated Story and the caption.
5. **You approve.** Nothing posts on its own. Use **Save PNG** on the dashboard to get the images Instagram needs.
6. **Learn.** After each campaign, results from your sales data go into [[learnings]].

## Your team
| Agent | Does | Writes to |
|---|---|---|
| Shop Manager (lead) | Monday plan: games against stock, restock order, what needs you; keeps work moving in order | `week-ahead.md` |
| Sports Desk | Schedules, final scores, two-source verification, game-day weather | `games/` |
| Promo Manager | Fires promotions exactly once, stock check, campaign plans, results | `campaigns/`, `learnings.md` |
| Social Creator | Instagram post, animated Story, caption | `campaigns/` |

Skills stored in this cabinet: `weekly-planning`, `game-tracking`, `promo-triggers`, `instagram-content`.

The Shop Manager plans the week (Mondays at 9:30). The jobs below drive the game-by-game chain, fifteen minutes apart. Agents never wait on each other: each job reads the files the previous one wrote, so the files are the hand-off and git shows every step.

## Jobs (all off until you turn them on)
| Job | When | What |
|---|---|---|
| Schedule Sync | Daily 7:30 | Yesterday plus the next 7 days of games, so the 8:00 score check can verify last night |
| Game Day Prep | Daily 10:00 | Weather for today's home game, then the game-day promotion |
| Final Score Check | 23:00, and 8:00 as a backup | Record finals and verify them (two sources) |
| Promo Check | 8:15, 10:15 and 23:15 | Fire promotions for verified wins and today's home games, once each; review finished creative |
| Creative Queue | 8:30, 10:30 and 23:30 | Design the post, Story and caption for new plans |

Times use this computer's clock and assume New York. If you are elsewhere, shift the schedules on the Jobs page.

## Try it
- "Did our team win last night?"
- "What games are coming up this week?"
- "Build tonight's game night campaign"
- "What does this week look like? Do we need to restock?"

## Make it yours
1. Rewrite [[business]], [[menu]] and [[brand]] for your shop. Keep the frontmatter fields.
2. Put your teams in [[teams]] and your offers in [[promotions]].
3. Connect your store data (see [[store-data/index]]) or replace the sample CSVs.
4. Delete the example games and campaigns.
5. Rename the cabinet. Agents refer to it as `{{cabinet.name}}`, so they pick up the new name.

Curious how it works under the hood? See [[how-this-was-built]].
