---
name: instagram-content
description: Design a campaign's Instagram creative as files in its campaign folder (a polished SVG feed post built from the real game result and the offer day's weather, an animated four-scene SVG Story, and a caption with CTA, hashtags and alt text) following the brand guide, then render and review it before handing it over. Use when a campaign plan is ready for creative or when asked for a post, Story or caption.
---

# Instagram content

Make three files in `/campaigns/<folder>/`: `post.svg`, `story.svg` and `caption.md`. The bar is **"a local design studio made this last night"**, not a template. Every piece is built from that night's real data, so no two campaigns look the same.

## 1. Collect the facts first
Read and note, before drawing anything:
- From the **plan** (`index.md`): the offer (verbatim), the cap if capped, `live.from` and `live.to`, `weather_mode`, `weather_live`, and whether the title says **DEMO**.
- From the **game file** it links to: our team, the opponent, final score (or start time for game day), date, venue, home or away, season type, and anything notable in the body (rivalry, comeback, shutout, overtime).
- From `/brand.md`: colors, font stacks, `team_colors`, core hashtags, voice and words to avoid.
- From `/business.md`: address and Instagram handle.

Write the copy lines down first (kicker, headline, offer line, deadline, weather line). Every number and name must match these files exactly.

## 2. Design system
- **Canvas:** post `viewBox="0 0 1080 1350" width="1080" height="1350"`; Story `viewBox="0 0 1080 1920" width="1080" height="1920"`. Safe margin 72px; keep Story text out of the top 220px and bottom 260px (Instagram's own buttons cover them).
- **Fonts:** only the stacks in `/brand.md` (display stack for numbers and headlines, body stack for small text). No web fonts or `@import`: the PNG export cannot load them. At most three type sizes per piece. Estimate width before placing: display type is about `0.55 × font-size` per character; if a line would cross the safe margin, shrink it or break it.
- **Color:** brand ink and cream as the base, brand red for the offer, marigold for highlights, and the **winning team's colors** (from `team_colors`) as the accent: stripes, the score panel edge, confetti. Check contrast: light text only on dark fills, and the reverse.
- **Depth:** use `<linearGradient>`/`<radialGradient>` for surfaces and a soft `<filter>` with `<feDropShadow>` under the hero and the score panel. A subtle `<pattern>` (diagonal team-color stripes at 6 to 10% opacity, or halftone dots) on the background gives texture. Keep everything vector; no `<image>` with an http link.
- **No logos, wordmarks, mascots or jerseys with numbers.** Team names as plain words and team colors as shapes are fine.

### Visual direction: make it look like a photo, not a diagram
- **Scene:** a night-at-the-Garden background: a deep navy radial gradient, two or three soft light beams from the top, 40 to 60 blurred "arena light" circles (`feGaussianBlur`) in white, light blue, team red and warm yellow, a dark vignette at the edges and a light film grain (`feTurbulence` at about 9% opacity).
- **Scoreboard:** a translucent glass panel (white at 4 to 16% opacity, thin white edge) instead of a flat dark box. Next to each team name, a round **team-color badge** with the team's initials (for example `NYR`, `UTA`): an outer ring and inner fill in the team's two colors and a thin white stripe. Initials and colors only, never a logo.
- **Slice:** rendered, not flat. The cheese uses a radial gradient plus a `feTurbulence` mottle for browned spots, blurred blisters, an oil sheen and oregano flecks. The crust has char spots and a light top edge, the pepperoni have a darker rim, small fat specks and a grease highlight, and a few basil leaves sit on top. Add soft steam above the slice and a blurred shadow below it.
- **Story motion:** the slice drops in, then each topping lands one after another, then the price badge pops and gently pulses, then the offer card fades up. Steam rises and the arena lights twinkle in a loop. The final-frame rule below still applies.

## 3. Post (`post.svg`): layout, top to bottom
1. **Kicker band** across the top in the team accent color: `FINAL · MADISON SQUARE GARDEN · SUN OCT 4` (real result, venue and date), or for game day `TONIGHT · 7:30 PM · MADISON SQUARE GARDEN`.
2. **Scoreboard panel:** a dark rounded rectangle (rx 28) with a thin team-color edge and a drop shadow. Two rows: `RANGERS  4` and `UTAH  2` in the display font, the winning score in marigold, a small `FINAL` label (or `OT`/`SO` when relevant). For game day: the matchup and start time instead.
3. **Hero slice illustration**, drawn in SVG and rotated a few degrees:
   - crust: a thick rounded arc with a warm brown gradient and a lighter top edge
   - cheese body: a triangle-ish path with a marigold-to-gold gradient, a thin sauce-red edge peeking out along the sides
   - 5 to 7 pepperoni: circles in deep red with a darker rim and a small highlight
   - 2 or 3 cheese drips: smooth paths hanging off the bottom edge
   - a drop shadow underneath
4. **Offer sticker:** a rotated marigold circle or burst with the price huge (`$1`), overlapping the slice. Next to or under it, the offer line verbatim, and the deadline in plain words (`6 AM TO NOON, MONDAY`).
5. **Weather chip:** a small rounded pill with a drawn icon (sun: circle plus short rays; cloud: overlapping circles; rain: cloud plus three slanted lines) and `18°C · CLEAR`, plus one short line that ties the weather to the offer: sunny "Sunny walk to work? Grab it on 8th Ave.", rainy "Rainy morning. Hot slice, two blocks from Penn.", cold "Cold one out. Warm slice inside." Use `weather_live`; leave the chip out if it is null.
6. **Footer:** address and handle in the small body type.
7. If the plan says **DEMO**, add a diagonal corner ribbon `DEMO · NOT FOR POSTING`.

## 4. Story (`story.svg`): four scenes, about 8 seconds
Animate with a `<style>` block of CSS `@keyframes` inside the SVG, `animation-fill-mode: both`, and `transform-box: fill-box; transform-origin: center;` on animated groups.

| Time | Scene | What happens |
|---|---|---|
| 0 to 2s | **The result** | Kicker slides down; the score counts up (stack text elements `0`, `1`, `2` … and fade each in and out on a schedule so the last one stays); team-color stripes sweep across. |
| 2 to 4s | **The slice** | The slice drops in from above with a small bounce; drips stretch down. |
| 4 to 6s | **The offer** | The price sticker pops (scale from 0.4 with overshoot); confetti in team colors falls (15 to 25 small rects and circles with different delays). |
| 6 to 8s | **The close** | Offer line, deadline, weather chip and "Link in bio" fade in and stay. |

**Final-frame rule (required).** Each element's normal attributes and style are where it ends up. Keyframes may go through anything, but they must **end** at the element's normal state. So:
- things that stay visible at the end (scene 4, the final score digit, the slice, the sticker, fallen confetti) have normal opacity 1 and animate **from** their starting state;
- things that disappear before the end (scene 1 extras, the counting digits other than the last) have normal `opacity: 0`, and their keyframes show them and then fade them back to 0.

With animations switched off, the Story must show its finished last frame. The PNG export and the preview both rely on this.

## 5. Caption (`caption.md`)
```markdown
---
campaign: <folder name>
promotion: <promotion id>
status: draft
---
# Caption

<hook naming the real moment: "Rangers 4, Utah 2. The Garden was loud and so are we.">
<offer exactly as in the plan>
<deadline + weather tie-in: "6 to noon Monday, and it's 18 and sunny. Walk over.">
<one call to action>

#CoreTag1 #CoreTag2 #CoreTag3 #Moment1 #Moment2 #Moment3

## Story text
The text of each scene, in order.

## Alt text
One sentence describing the post image.
```
6 to 8 hashtags: the core set from `/brand.md` plus 3 to 5 for the moment, never team or league hashtags that imply partnership. At most two emoji. No em-dashes.

## 6. Render and review (do this before you finish)
Look at what you made, fix it, and look again. At most two rounds.

1. Make square previews in `/tmp/<folder>/` (Quick Look crops to a square, so wrap the art in a square canvas):
   - `post-preview.svg`: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1350 1350" width="1350" height="1350"><rect width="1350" height="1350" fill="#777"/><g transform="translate(135,0)"> …everything inside post.svg's root element… </g></svg>`
   - `story-preview.svg`: the same with a 1920 square, `translate(420,0)`, and `<style>*{animation:none!important}</style>` added just before the closing `</svg>` (this shows the final frame).
2. Render: `qlmanage -t -s 1600 -o /tmp/<folder> /tmp/<folder>/post-preview.svg /tmp/<folder>/story-preview.svg` (macOS). Then open the two PNGs and look at them.
3. Check, and fix anything that fails:
   - every number, name, date, venue, offer word and weather value matches the files
   - no text runs past the safe margin or collides with another element
   - the slice reads as pizza at a glance, and the score is the first thing you see
   - contrast is strong everywhere; nothing is muddy or flat
   - the final Story frame shows the offer, deadline and weather chip
4. If `qlmanage` is not available, skip rendering and go through the checklist against the SVG source instead, and say so in your report.

The previews stay in `/tmp`. Never write them into the cabinet.

## Rules
- Write only `post.svg`, `story.svg` and `caption.md`, only in the given folder. Never edit the plan.
- The offer must read exactly as in the plan. Never invent prices, items or extras.
- Team names only as plain facts. No "official", no partnership language.
- When done, list the three files and one line on what you checked in review. Do not message anyone: the Promo Check job reviews finished creative from the files.

## Queue (what the Creative Queue job runs)
1. List folders in `/campaigns/` whose plan has `status: draft` and that are missing `post.svg`, `story.svg` or `caption.md`.
2. Take at most two per run, oldest `fired_at` first, and write only the missing files.
3. If none are waiting, end with "Queue empty".
