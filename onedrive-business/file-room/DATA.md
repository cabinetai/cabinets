---
title: How the file room gets its files
---
# How the file room gets its files

The file room never talks to OneDrive. Its routines read OneDrive and write files here, and
the page shows them. The full rules for each field are in the agent's persona
(`.agents/file-keeper/persona.md`). Every routine writes through `first-sort.mjs`, which checks
that each file, name, date and number is in what OneDrive answered.

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning OneDrive read, every day at 7 | Storage, your recent work, files shared with you, comments waiting on you, files in several versions, the client folders. Schema `onedrive-business/file-room@1`. |
| `data/sharing.json` | Monday sharing check, Mondays at 8 am | Files you own that anyone with the link can open, or that are shared outside your company. Schema `onedrive-business/sharing@1`. |
| `data/dates.json` | Contract dates, on the 1st of the month at 8 am | Ends, renewals, notice days and due dates found inside your documents, each with the words that say it. Schema `onedrive-business/dates@1`. |
| `data/EXAMPLE-*.json` | Nobody (they ship with the template) | A made-up HVAC company in the same shapes. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | Every routine | `{ at, ok, why }`. `ok: false` means the last run could not read OneDrive; the page shows `why` with a Try again button. |
| `data/layout-change.json` | The agent, in a chat | Boxes someone asked to `add` or `remove`, with `at`, `for` and a `note`. Schema `onedrive-business/layout-change@1`. |
| `data/reading.json` | The first read, as it reads | `{ startedAt, done, lines[], gift }`: one short line for each thing found, `**bold**` for the finding. |
| `data/profile.json` | The first read | What the agent learned: `name`, `business { name, what, where }`, `domain`, `clients[]`, `clientsMore`, `team[]`, `files`, `folders`, `storage { used, limit }`. Shown once as "This is you". |
| `setup.md` | The owner, or the agent in a chat | What the business does, its clients, which folders matter, what is private. |

`latest.json` in short: `generatedAt`, `since`, `account`, `headline`, an optional `lead`
`{ id, why }`, `storage` `{ used, limit }` in bytes (set by the helper from OneDrive's own
answer), `changed7` (files changed in the last 7 days), and five lists, each item with the
`fileId` OneDrive gave it and its `url`, the page's "Open in OneDrive" link:

- `recent`: `id` (r1...), `fileId`, `name`, `kind`, `modifiedAt`, `by` ("you" or a name), `gist`.
- `shared`: `id` (s1...), `fileId`, `name`, `kind`, `from`, `fromEmail`, `outside` (from
  outside the company), `sharedAt`, `gist`.
- `comments`: `id` (c1...), `fileId`, `file`, `kind`, `from`, `said`, `at`, `mention` (it
  names you; the helper reads comments from inside the Word, Excel and PowerPoint files), `quote` (the words it is on), `reply` (an answer drafted in your voice).
- `versions`: `id` (v1...), `base`, `latest` `{ fileId, name, modifiedAt, by }`, `others`
  `[{ fileId, name, modifiedAt }]`, `gist`.
- `folders`: `id` (f1...), `fileId`, `name`, `lastAt`, `by`, `quiet` (no change in 30 days),
  `client` (a client's folder).

`kind` is one of `doc` (Word), `sheet` (Excel), `slides` (PowerPoint), `note` (OneNote), `pdf`, `image`, `video`, `folder`, `other`.

`sharing.json`: `generatedAt`, `headline`, `domain`, and `open` (`id` o1..., `fileId`, `name`,
`kind`, `how` anyone or outside, `with` (the outside domains), `sensitive`, `why`), the most
sensitive first.

`dates.json`: `generatedAt`, `headline`, and `dates` (`id` d1..., `fileId`, `file`, `kind`,
`what` ends, renews, notice, due or expires, `date` `YYYY-MM-DD`, `who`, `gist`, `quote` (the
words in the document that give the date)), soonest first.

The readable pages go to `reports/` beside this folder: one per morning
(`<YYYY-MM-DD>-morning.md`), one per Monday check (`<YYYY-MM-DD>-sharing.md`), one per month
(`<YYYY-MM>-contract-dates.md`), and the lists the owner asks for in the chat.
