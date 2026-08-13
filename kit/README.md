# Cabinet Kit

Shared design source for the apps that ship inside Cabinet templates. One folder
per theme under `themes/`; each theme is a documented design system (`THEME.md`)
plus a single CSS block (`theme.css`).

## Themes

| Theme | Based on | Status |
|---|---|---|
| [`wooden`](themes/wooden/THEME.md) | The Cabinet app's default "paper" look — warm parchment, white sheets, wood-and-brass accents | Current |

More themes land here over time, each built the same way: a real visual world
distilled into tokens, components, and rules an app can inline.

## How a template uses a theme

Copy the theme's CSS block into the `<style>` of the app's `index.html` and
delete what the app does not use. **Nothing links to this folder at runtime.**

That rule is structural, not stylistic: a cabinet installs by copying one
directory (`npx cabinets add <name>` fetches just that template), so a path
outside the cabinet does not exist on the user's machine. Every app must stay a
single self-contained HTML file with zero external requests — no CDN, no Google
Fonts, no shared `/kit/` URL. This folder is where the look is defined once, so
the copies stay consistent and drift is a diff away.

## Rules for every theme

- System font fallbacks first; web fonts are optional and never fetched by apps
- Honest failure states: an empty folder is day one, not an error; a missing
  integration says so in a sentence
- WCAG AA text contrast on every surface the theme defines
- No decorative motion beyond press/hover feedback; respect `prefers-reduced-motion`
