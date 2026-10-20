---
title: Campaigns
order: 12
---
# Campaigns

One folder per campaign. The Marketing Lead creates the folder and the brief (`index.md`) with the `local-campaign-strategy` skill; the Social Content Creator adds the deliverables with the `instagram-content` skill. The dashboard lists every folder here and shows a chip for each deliverable file it finds.

## Folder
`campaigns/<campaign-slug>/`, slug in kebab-case, usually the promotion plus the moment (for example `game-day-taco-bucket`).

| File | Written by | Contents |
|---|---|---|
| `index.md` | Marketing Lead | The brief: goal, segment, offer, timing, posting plan, KPIs, approvals. |
| `feed-post.md` | Social Content Creator | Feed post or carousel: frames, on-image text, shot notes. |
| `reel.md` | Social Content Creator | Reel concept and shot-by-shot script with timings and audio. |
| `stories.md` | Social Content Creator | Story sequence, frame by frame, with stickers. |
| `captions.md` | Social Content Creator | Captions per post, CTAs, hashtags, alt text. |

## Brief frontmatter
| Field | Meaning |
|---|---|
| `title` | Campaign name. |
| `status` | `draft`, `ready-for-review`, `approved`, `live`, `done` or `cancelled`. |
| `location` | Location id. |
| `opportunity` | Opportunity file name (without `.md`). |
| `promotion` | Promotion id. |
| `segment` | Primary audience segment id. |
| `launch` / `end` | ISO dates the campaign is live. |
| `channels` | Usually `[instagram-feed, instagram-reels, instagram-stories]`. |
| `deliverables` | Which deliverable files are expected. |
| `kpis` | What will be measured. |

Nothing is posted automatically. A human approves the brief and the copy, then posts.
