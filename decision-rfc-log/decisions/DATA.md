---
title: How Decisions gets its rows
---
# How Decisions gets its rows

The page never talks to Slack or Discord. A routine finds threads marked with 🧠 or 📝,
reads them, and writes files here. The page shows them.

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | The routine (coming with the wiring) | Every logged decision and RFC. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up team in the same shape. Shown, marked as an example, until `latest.json` exists. |

## Shape

```json
{
  "generatedAt": "2026-10-12T09:00:00Z",
  "nextCheck": "2026-10-12T10:00:00Z",
  "workspace": "Team name",
  "rows": [ { "...": "one row per marked thread" } ]
}
```

Each row:

| Field | What it is |
|---|---|
| `id` | Stable id, such as `slack-C024BE91L-1728640000.123` or `discord-<channel>-<message>`. |
| `kind` | `decision` (marked 🧠) or `rfc` (marked 📝). |
| `source` | `slack` or `discord`. |
| `topic` | A few words: what the thread is about. |
| `decision` | One line: what was decided. For an open RFC, the proposal and that it is still open, such as "Proposed: move auth to sessions (open)". |
| `stakeholders` | The people who took part in deciding, by display name. |
| `date` | `YYYY-MM-DD`, the day of the decision (or of the proposal for an RFC). |
| `link` | The thread's own address in Slack or Discord. |
| `channel` | The channel name, such as `#eng-platform`. |
| `summary` | 2 to 4 short sentences on what the thread said. |
| `why` | Why it was decided this way. |
| `quotes` | 2 to 4 `{ author, text }` taken word for word from the thread. |
| `status` | `decided`, `open` (an RFC still being discussed) or `superseded` (a later decision replaced it). |

Rows are newest first. A row is updated, not added again, when the same thread is marked a
second time or an RFC is decided.

The example file also carries `example: true` and `connections` (how Slack and Discord look
as connected in the example when the page is opened outside Cabinet). A real
`latest.json` leaves both out: inside Cabinet the page asks Cabinet which are connected.
