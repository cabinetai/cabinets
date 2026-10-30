---
title: How Decisions gets its rows
---
# How Decisions gets its rows

The page never talks to Slack or Discord. Every hour the Check for Decisions routine
finds messages marked with 🧠 or 📝, reads their threads, and writes files here. The page
shows them. The full rules for each field are in the agent's persona
(`.agents/decision-keeper/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data/latest.json` | Check for Decisions, every hour | Every logged decision and RFC, kept forever. Schema `decision-rfc-log/decisions@1`. |
| `data/status.json` | The same routine | `{ at, ok, why, sources }`. `sources` says, for `slack` and `discord`, `read`, `not connected` or `failed`. `ok: false` means nothing connected could be read; the page shows `why` with a Try again button. |
| `data/EXAMPLE-latest.json` | Nobody (it ships with the template) | A made-up team in the same shape. Shown, marked as an example, until `latest.json` exists. |

## Shape

```json
{
  "schema": "decision-rfc-log/decisions@1",
  "generatedAt": "2026-10-12T09:00:00+03:00",
  "workspace": "Team name",
  "rows": [ { "...": "one row per marked message" } ],
  "cursors": { "slack": { "checkedAt": "..." }, "discord": { "<channel id>": "<newest message id read>" } },
  "people": { "U0123ABCD": "Dana" },
  "pending": [ { "source": "slack", "channel": "C0123ABCD", "ts": "1760252400.000100", "emoji": "brain" } ]
}
```

`cursors`, `people` (Slack names already looked up) and `pending` (marked messages found
but not read yet) are for the next run; the page ignores them. `generatedAt` is written on
every run, so the page knows the log is fresh.

Each row:

| Field | What it is |
|---|---|
| `id` | `slack-<channel id>-<ts>` or `discord-<channel id>-<message id>`, from the marked message. Never added twice. |
| `kind` | `decision` (marked 🧠) or `rfc` (marked 📝). |
| `source` | `slack` or `discord`. |
| `topic` | A few words: what the thread is about. |
| `decision` | One line: what was decided. For an open RFC, the proposal and that it is still open, such as "Proposed: move auth to sessions (open)". |
| `stakeholders` | The people who took part in deciding, by display name, at most 5. |
| `date` | `YYYY-MM-DD`, the day of the decision (or of the proposal for an RFC). |
| `link` | The marked message's own address in Slack or Discord, as the tool gave it. |
| `channel` | The channel name, such as `#eng-platform`. |
| `summary` | 2 to 4 short sentences on what the thread said. |
| `why` | Why it was decided this way. |
| `quotes` | 2 to 4 `{ author, text }` taken word for word from the thread. |
| `markedBy` | Who added the 🧠 or 📝, when known. Optional. |
| `status` | `decided`, `open` (an RFC still being discussed) or `superseded` (a later decision replaced it). |

Rows are newest first. An RFC that gets a 🧠, or a reply that settles it, becomes a
decision in the same row. A decision a later one replaces becomes `superseded`. Direct and
group messages are never logged.

The example file also carries `example: true`, `nextCheck` and `connections` (how Slack and
Discord look in the example when the page is opened outside Cabinet). A real `latest.json`
leaves them out: inside Cabinet the page asks Cabinet which are connected and reads the
next check from the routine's schedule.
