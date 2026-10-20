---
name: caption-variants
description: Write alternative Instagram captions and short comment replies for a campaign, in the brand voice and grounded in the real game and weather data, so the owner can pick before posting. Use when asked for caption options, a different tone, or replies to comments.
---

# Caption variants

Give the owner choices without changing the plan. The Social Creator writes the main caption; you write alternatives next to it.

## Inputs
- The campaign plan `/campaigns/<folder>/index.md`: offer (verbatim), cap, `live`, `weather_live`, DEMO flag.
- The existing `/campaigns/<folder>/caption.md` (do not edit it).
- The linked game file: score, opponent, date, venue, anything notable.
- `/brand.md`: voice, words to use and avoid, core hashtags.

## Write `/campaigns/<folder>/caption-variants.md`
```markdown
---
campaign: <folder>
status: draft
---
# Caption options

## A. Hype
...
## B. Neighborly
...
## C. Short and punchy (under 120 characters)
...

## Replies to likely comments
| Comment | Reply |
|---|---|
| "Is it any slice?" | ... |
| "Delivery?" | ... |
| "What time does it end?" | ... |
```
For each option:
- First line names the real moment (score, opponent or "last night at the Garden").
- The offer appears exactly as in the plan, with the cap if capped, and the deadline in plain words.
- Use the weather when it helps ("sunny walk to work", "rainy morning, hot slice").
- One call to action. The core hashtags from `/brand.md` plus 2 or 3 for the moment, 6 to 8 total.
- At most two emoji. No em-dashes. No team or league hashtags or "official" language.

## Rules
- Write only `caption-variants.md` in the given folder. Never edit `caption.md`, the plan or the SVG files.
- If the plan says DEMO, say so in the frontmatter (`demo: true`).
