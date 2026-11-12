---
title: Campaigns
order: 7
---
# Campaigns

One folder per promotion that fired. The Promo Manager writes the plan (`index.md`). The Social Creator adds the post, the animated Story and the caption. The dashboard shows them all, and its **Save PNG** button exports the images Instagram needs into the same folder.

## Folder name
`YYYY-MM-DD-<team>-<promotion-id>`, dated by the game. Example: `2026-10-06-rangers-win-slice`.

| File | Written by | What it is |
|---|---|---|
| `index.md` | Promo Manager | The campaign plan: why it fired, the offer, the posting plan, the stock decision, results. |
| `post.svg` | Social Creator | The 1080 x 1350 feed post, with the real score or matchup in it. |
| `story.svg` | Social Creator | The 1080 x 1920 animated Story. |
| `caption.md` | Social Creator | Caption, call to action, hashtags, alt text. |
| `post.png`, `story-still.png` | Dashboard (Save PNG) | Ready-to-upload images. |

## Plan fields
| Field | Meaning |
|---|---|
| `title` | Promotion and moment. |
| `promotion` | Promotion id from [[promotions]]. |
| `game_id` | The game it fired for. Matches the marker in the game file. |
| `status` | `draft`, `ready-for-review`, `approved`, `live`, `done` or `held`. |
| `fired_at` | When it fired. |
| `live` | `{from, to}` when the offer is redeemable. |
| `weather_mode` | `good`, `bad` or empty (game-day only). |
| `inventory` | The stock check: item, on hand, reserve, need, cap, decision (`ok`, `capped`, `held`). |
| `deliverables` | Files expected in the folder. |
| `receipts` | What triggered it and which sources verified the game. |

Nothing here is posted automatically. A human approves and posts.
