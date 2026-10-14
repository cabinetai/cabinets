---
title: How My files gets your SharePoint
---
# How My files gets your SharePoint

The page never talks to SharePoint. The morning routine reads SharePoint through Microsoft
Graph with `first-sort.mjs` and writes files here, and the page shows them. The rules for each
field are in the agent's persona (`.agents/librarian/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning files, every weekday at 8 | The morning. Schema `sharepoint/my-files@1`. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up company in the same shape. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | Every routine | `{ at, ok, why }`. `ok: false` means the last run could not read SharePoint; the page shows `why` with Try again. |
| `data/reading.json` | The first reading only | `{ startedAt, done, lines[], gift }`: the lines the page tells while the agent reads, and one gift (`yours`, `row`, `open`, `twins` or `calm`). |
| `data/profile.json` | The first reading | What it learned: `name`, `regulars`, `yourSites`, `changed`, `mine`, `kind`, `active {from,to}`, `busiest`. Shown once as "This is you". |
| `data/layout-change.json` | The agent, when asked to change the page | `{ at, for, add[], remove[], note }`: box ids, shown with Apply. |
| `setup.md` | The person, or the agent in a chat | Sites that matter, what to skip, files they care about, their name at work. |

`first-sort.mjs` is the only way a run talks to SharePoint and writes these files: it saves
every Graph answer, counts every number from them and copies every name, file, time and link,
so nothing on the page is typed by the agent except its own short words (gists and the
headline), and those may hold no numbers.

How it finds things, all read only:

- **Files that changed**: one search across every site (`POST /search/query`, `driveItem`,
  newest first), personal OneDrive left out. The site of each file by its site id.
- **Your files**: a file someone else saved last that you made, or saved before (its saves,
  from `/drives/{drive}/items/{item}/versions`).
- **Rows with your name**: the lists on the sites you follow and the busiest sites, your own
  id on each site from its people list, and every open row with a person column set to you.
- **Open to anyone**: the sharing of the files you made or saved (`/permissions`): a link
  with scope `anonymous`, or a guest from outside your company. Microsoft shows a file's full
  sharing only to its owner.
- **Which one is real**: files in one folder whose names differ only by "v2", "final",
  "copy", a date or "(1)", with the folder read once to find the older ones.
- **News**: site pages promoted as news, on the sites you follow and the busiest ones.

`latest.json` in short: `generatedAt`, `since`, `timeZone`, `person { name }`, `headline`,
`totals { changed, sites, people, mine, yours, rows, open, twins, news }`,
`shelf[] { id, name, count, spines[] { k, y, m } }` (the banner: a spine per file, `k` its
kind, `y` it touches you, `m` you saved it), and:

- `yours[]`: `id`, `name`, `ext`, `site`, `library`, `folder`, `at`, `link`, `who`, `made`,
  `saves`, `others`, `gist`.
- `rows[]`: `id`, `title`, `list`, `site`, `column`, `status`, `due`, `at`, `by`, `gist`, `link`.
- `open[]`: the file fields, `anyone`, `guests[]`, `by`.
- `twins[]`: `id`, `site`, `folder`, `count`, `gist`, `items[] { name, at, by, link }`, newest first.
- `sites[]`: `id`, `name`, `count`, `people`, `names[]`, `needs` (`you`, `fyi`, `none`), `gist`,
  `top`, `followed`, `link`.
- `news[]`: `id`, `title`, `site`, `by`, `at`, `gist`, `link`.
- `refused[]`: what the company did not let Cabinet read: `lists`, `sharing`, `news`.

Links are kept only when they open SharePoint (`https://<name>.sharepoint.com/...`).
