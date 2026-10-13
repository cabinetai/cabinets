---
title: How My files gets its files
---
# How My files gets its files

My files never talks to Google Drive. Its routines read Drive and write files here, and the
page shows them. The full rules for each field are in the agent's persona
(`.agents/file-helper/persona.md`). Every routine writes through `first-sort.mjs`, which checks
that each file, name, size, date and number is in what Drive answered.

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Morning Drive read, every day at 7 | Storage, where you left off, files shared with you, your biggest files. Schema `google-drive-personal/my-files@1`. |
| `data/sharing.json` | Sunday sharing check, Sundays at 9 am | Files you own that anyone with the link can open. Schema `google-drive-personal/sharing@1`. |
| `data/papers.json` | Important papers, on the 1st of the month at 9 am | Your important papers (passport, insurance, the house, the car, taxes) and the dates in them, each with the words that say it. Schema `google-drive-personal/papers@1`. |
| `data/EXAMPLE-*.json` | Nobody (they ship with the template) | A made-up person in the same shapes. Shown, marked as an example, until `latest.json` exists. |
| `data/status.json` | Every routine | `{ at, ok, why }`. `ok: false` means the last run could not read Drive; the page shows `why` with a Try again button. |
| `data/layout-change.json` | The agent, in a chat | Boxes someone asked to `add` or `remove`, with `at`, `for` and a `note`. Schema `google-drive-personal/layout-change@1`. |
| `data/reading.json` | The first read, as it reads | `{ startedAt, done, lines[], gift }`: one short line for each thing found, `**bold**` for the finding. |
| `data/profile.json` | The first read | What the agent learned: `name`, `people[]` (who shares with you), `papers[]` (the kinds found), `files`, `folders`, `photos`, `storage { used, limit }`. Shown once as "This is you". |
| `setup.md` | You, or the agent in a chat | Who shares with you, where your papers live, what is private, what you keep in Drive. |

`latest.json` in short: `generatedAt`, `since`, `account`, `headline`, an optional `lead`
`{ id, why }`, `storage` `{ used, limit }` in bytes (set by the helper from Drive's own
answer), `changed7` (files changed in the last 7 days), and three lists, each item with the
`fileId` Drive gave it, which the page turns into an "Open in Drive" link:

- `recent`: `id` (r1...), `fileId`, `name`, `kind`, `modifiedAt`, `by` ("you" or a name), `gist`.
- `shared`: `id` (s1...), `fileId`, `name`, `kind`, `from`, `fromEmail`, `sharedAt`, `opened`,
  `gist`.
- `big`: `id` (b1...), `fileId`, `name`, `kind`, `size` (bytes), `viewedAt` (when you last
  opened it; missing when never).

`kind` is one of `doc`, `sheet`, `slides`, `pdf`, `form`, `image`, `video`, `folder`, `other`.

`sharing.json`: `generatedAt`, `headline`, and `open` (`id` o1..., `fileId`, `name`, `kind`,
`how` always anyone, `sensitive`, `why`), the most private first.

`papers.json`: `generatedAt`, `headline`, `papers` (`id` p1..., `fileId`, `name`, `kind`,
`type` id, insurance, home, car, tax, health, school, warranty, money, family or other,
`folder`, `gist`, `modifiedAt`), and `dates` (`id` d1..., `fileId`, `file`, `kind`, `what`
expires, renews, ends, due or notice, `date` `YYYY-MM-DD`, `who`, `gist`, `quote` (the words
in the paper that give the date)), soonest first.

The readable pages go to `reports/` beside this folder: one per morning
(`<YYYY-MM-DD>-morning.md`), one per Sunday check (`<YYYY-MM-DD>-sharing.md`), one per month
(`<YYYY-MM>-papers.md`), and the lists you ask for in the chat.
