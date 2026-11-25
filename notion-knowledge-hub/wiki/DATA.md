---
title: How Wiki gets your Notion
---
# How Wiki gets your Notion

The page never reads Notion itself. The morning routine runs `read-notion.mjs` over the
Notion copy Cabinet keeps, and the page shows the files it writes here.

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | `read-notion.mjs`, every morning run | The wiki. Schema `notion/wiki@1`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up team in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | `read-notion.mjs`, or the routine when Notion is not connected | `{ at, ok, why }`. `ok: false` means the last run could not read Notion; the page shows `why`. |

`read-notion.mjs <Notion folder> [...]` reads every `index.md` under the folders whose
frontmatter has a `notion_id`, and takes `title` (or the first `# ` heading), `icon`,
`notion_url`, `edited` and `edited_by`. A link is `[[Title]]`; a page's links count once per
page that links to it.

`latest.json` in short: `generatedAt`, `folders[]`, `totals { pages, editedWeek, stale }`, and
up to eight of each, every page as `{ title, icon, url, edited, by, links }`:

- `recent[]`: newest edit first.
- `stale[]`: not edited for 90 days and linked from another page, most linked first.
- `linked[]`: most linked first.
- `editors[] { name, pages }`: pages each person edited last in the last 30 days, most first.
