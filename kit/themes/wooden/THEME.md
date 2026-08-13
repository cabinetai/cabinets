# Wooden

Wooden is Cabinet's own look: the warm, tactile design system behind the app's
default "paper" theme and the brand's wood-and-brass artwork. Interfaces built
with it read like paperwork on a good desk — bright white sheets resting on warm
parchment, one wood-brown accent doing all the pointing, and soft, physical
shadows instead of lines and boxes.

It is the first Cabinet Kit theme, and the default for every app that ships in a
registry template. Use it when an app should feel like part of Cabinet itself:
digests, trackers, planners, logs — calm pages a person checks once a day, not
dashboards that shout.

## Design tokens

### Color palette

| Token | Value | Purpose |
|---|---|---|
| `--cabinet-bg` | `#FAF6F1` | Page background — warm parchment |
| `--cabinet-desk` | `#F0E5D3` | Manila "desk" behind raised sheets; sidebar rails |
| `--cabinet-surface` | `#FFFFFF` | Cards, dialogs — the white sheet |
| `--cabinet-surface-muted` | `#FAF0E9` | Subtle panel fill |
| `--cabinet-surface-tan` | `#F3E1D4` | Secondary panel fill |
| `--cabinet-surface-hover` | `#F2ECE7` | Hover wash |
| `--cabinet-ink` | `#221716` | Body text — dark warm brown, never pure black |
| `--cabinet-ink-muted` | `#99887F` | Captions, secondary text |
| `--cabinet-wood` | `#834A2B` | The one accent: buttons, links, lead edges |
| `--cabinet-wood-deep` | `#5C2603` | Focus rings, active accent |
| `--cabinet-wood-brand` | `#B05926` | Brighter brand hue for small marks |
| `--cabinet-border` | `#E1D6CE` | Opaque hairline; input borders |
| `--cabinet-danger` | `#D40924` | Errors, destructive states |
| `--cabinet-success` | `#14823E` | Good news, paid, done |
| `--cabinet-warning` | `#9A6722` | Pending, worth a look |
| `--cabinet-info` | `#0F74C4` | Neutral notices |

One accent is the discipline of the theme. Wood-brown (`#834A2B`) marks
everything interactive or leading; status colors appear only as small pills and
edges, never as fills. If two things on a page are both wood-brown, one of them
should not be.

### The wooden effect

What actually makes a page feel like Cabinet, in order of weight:

- **Sheets on a desk** — content sits on white cards (`--cabinet-surface`)
  over the parchment page, lifted by soft two-layer shadows
  (`--cabinet-shadow-2`), with a whisper border rather than a drawn box. For an
  app-shell feel, a manila `--cabinet-desk` band can sit behind the sheet.
- **Serif headings, sans chrome** — real headings wear Fraunces (falling back
  to Georgia); labels, buttons, and table heads stay in the sans stack, small
  and slightly letterspaced.
- **Warm ink** — text is dark warm brown, never `#000`. Muted text leans tan,
  not grey.
- **Wood-and-brass artwork** — the brand's 3D icon set: pale maple objects
  with brass rims and rivets, soft rim light, kawaii faces on the mascots.
  Covers and hero art come from this world. Apps do not need artwork to feel
  wooden; the palette and shadows carry it.
- **No texture** — there is no wood-grain or paper-noise overlay anywhere.
  The warmth is flat color plus shadow. Resist adding grain.

### Typography

| Role | Stack | Notes |
|---|---|---|
| Headings | `'Fraunces', Georgia, 'Times New Roman', serif` | `letter-spacing: -0.02em`; the serif is the theme's voice |
| Body & chrome | `'Inter', ui-sans-serif, system-ui, …` | 15px/1.55 body; 14px controls; 12px uppercase table heads |
| Mono | `'JetBrains Mono', ui-monospace, …` | File names, amounts, timestamps |

Apps never load web fonts — the stacks are fallback-first and the system serif
carries the look when Fraunces is absent.

### Radius & elevation

One base radius (`0.625rem`), everything derived: controls at 10px, dialogs at
14px, the content sheet at 18px. Five shadow levels exist in the source app;
apps here need only three: `--cabinet-shadow-1` (buttons), `--cabinet-shadow-2`
(cards), `--cabinet-shadow-sheet` (a sheet lifted off the desk). A child surface
never out-lifts its parent.

### Spacing

Comfortable, not dense: cards pad 18–20px, tables row at 11px vertical, the page
column caps near 780px. These are reading pages — one column, generous margins,
no sidebars inside an app.

## Component coverage

`theme.css` ships exactly the components the template apps use — cards (with a
`--lead` variant whose wood edge marks the one thing worth reading first),
buttons (solid, outline, secondary), inputs and selects, status pills, wood-tint
badges, quiet-hairline tables, warning banners, and empty states. Anything an
app needs beyond this list gets built inline in that app, in this palette, and
promoted here only when a second app wants it.

## Accessibility

- WCAG 2.2 AA contrast holds on every shipped pair: ink on parchment 15.0:1,
  ink on white 16.4:1, wood on white 7.0:1, white on wood 7.0:1, muted ink on
  white 3.1:1 (large/secondary text only)
- Focus is a visible ring (`--cabinet-focus-ring`, deep wood at 35% over 3px) on
  a solid border — never a translucent outline
- Status is never color alone: pills carry the status word, tables keep the
  state column textual
- Motion is limited to press feedback (`translateY(1px)`) and 150ms eases;
  nothing moves that a `prefers-reduced-motion` user would miss

## Anti-patterns

- No pure black, no cool greys — every neutral is warm
- No opaque boxed borders around everything ("old boxy"); edges are whispers,
  depth comes from shadow
- No second accent color; no gradients except the amber highlight CTA
- No wood-grain textures, no skeuomorphic panels — the theme is warm, not rustic
- Do not mix with competing metaphors (glass, neobrutalism) in one app
