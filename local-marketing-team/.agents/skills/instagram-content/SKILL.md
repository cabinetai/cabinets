---
name: instagram-content
description: Write a campaign's Instagram deliverables (feed post or carousel, Reel concept and shot-by-shot script, Story sequence, captions with CTAs, hashtags and alt text) as four markdown files in the campaign folder, following the brand guide. Use when a campaign brief is ready for content or when asked for posts, Reels, Stories or captions.
---

# Instagram content

Produce four files in `/campaigns/<slug>/`: `feed-post.md`, `reel.md`, `stories.md`, `captions.md`. Each starts with frontmatter so the dashboard and the team can track it.

## Inputs
- The brief: `/campaigns/<slug>/index.md` (offer, segment, location, posting plan, guardrails are fixed).
- `/brand.md`: voice, visual style, words to use and avoid, emoji policy, core hashtags.
- `/menu.md` and `/promotions.md`: real items, prices and constraints.
- `/learnings.md`: what has worked before.

## Shared frontmatter
```yaml
---
title: <Deliverable>, <Campaign title>
campaign: <slug>
format: <carousel|single-image|reel|stories|captions>
post_at: '<ISO datetime from the posting plan>'   # omit for stories and captions
status: draft
---
```
Add `frames`, `aspect` ("4:5" for feed, "9:16" for Reels and Stories) and `length_seconds` (Reels) where relevant.

## feed-post.md
- A headline in quotes describing the post's job ("Send this to whoever is hosting").
- Frame table: `Frame | Visual | On-image text`. Carousels 3 to 7 frames; first frame is the hook, last frame is the offer and CTA.
- Shot notes: light, props, what must not appear (logos, marks).
- Alt text for at least the first frame.

## reel.md
- **Concept** in two sentences. **Length** (12 to 30 seconds), **aspect**, **audio** direction (licensed library track or original sound; never a team chant or a copyrighted song you cannot license).
- Shot table: `Time | Shot | On-screen text | Sound`. Hook in the first 2 seconds, offer card in the final 3 to 4 seconds.
- Cover frame and production notes (fps, extras' clothing, locations to avoid).

## stories.md
- Group frames by posting time from the brief. Table: `# | Visual | Text | Sticker`.
- Use stickers on purpose: poll or quiz for engagement, countdown before a cutoff, link for orders, location on every frame.
- Use bold placeholders for live facts with instructions, for example **[N]** buckets left, **[time]** pickup.

## captions.md
- One caption per post in the posting plan, as block quotes. First line is the hook and names the neighborhood or moment; the offer appears exactly as in the brief; end with one CTA.
- A shorter alt version for the main post.
- 3 to 5 rotating CTAs.
- Hashtags: the core set from `/brand.md` plus 3 to 5 campaign tags, 6 to 8 total. No brand or league hashtags in paid boosts.
- Alt text, and "Replies to expect" with on-brand answers to 2 to 4 likely comments.

## Rules
- Voice and emoji follow `/brand.md` (default: at most two emoji per caption).
- Every customer-facing constraint (cutoff, pickup only, one per customer) appears in at least the captions and one Story frame.
- No logos, marks, artist names or "official" language for teams, leagues, festivals or venues.
- Never state an unverified fact as true; use placeholders.
- Write for a human to approve and post. Nothing here is published automatically.
