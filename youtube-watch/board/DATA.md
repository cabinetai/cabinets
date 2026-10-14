---
title: How the Watch Board gets its words
---
# How the Watch Board gets its words

The Watch Board never talks to YouTube. Its morning routine reads the channel and writes one
file here, and the page shows it. The full rules for each field are in the agent's persona
(`.agents/channel-watcher/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `data.json` | Daily Channel Watch, every day at 8:30 | What on the channel needs a look, ranked. Replaced whole each run. |
| `data/EXAMPLE-data.json` | Nobody (it ships with the template) | A made-up woodworking channel in the same shape. Shown, marked as an example, until `data.json` exists. |

## data.json

| Field | What it is |
|---|---|
| `version` | Always `1`. |
| `generated` | When the run finished, ISO time in UTC. |
| `status` | `"ok"`, or one plain sentence on what went wrong. The page shows it above the board. |
| `channel` | `{ id, title }` of the channel. |
| `usual.viewsPerDay` | The middle daily views of the last 10 uploads, to measure a drop against. |
| `cursor` | The time of the newest comment read, so the next run reads only what is new. |
| `known` | Each recent video's views at this check, at most 50, for tomorrow's drop check. |
| `items` | What needs a look. Each item is one row on the board. |

Each item has:

| Field | What it is |
|---|---|
| `id` | A short kebab-case name, the same every run. |
| `kind` | `Angry`, `Complaint`, `Spam`, `Waiting`, `Business`, `Drop`, `Claim` or `Other`. The page filters by it. |
| `level` | `High`, `Medium` or `Low`. The board ranks by it; `High` shows as "Urgent" in red. |
| `title`, `summary`, `next` | The problem in a few words, one sentence about it, and one step the creator can take. |
| `video`, `videoId` | The video it is under, or empty when it spans several. |
| `count` | How many comments are behind it (0 for a `Drop`). |
| `firstSeen`, `lastSeen` | When the first and the newest comment came in. |
| `link` | `https://www.youtube.com/watch?v=<videoId>&lc=<commentId>` of the newest comment, or the video's link. |
| `comments` | Up to 10, newest first: `{ id, author, text, at, video, link }`, the words as written. |

A `Business` item (a sponsorship, collab, job, consulting, partnership, bulk order or press
ask found in the comments) has three more fields:

| Field | What it is |
|---|---|
| `ask` | `Sponsorship`, `Collaboration`, `Hiring`, `Consulting`, `Partnership`, `Bulk order` or `Press`. |
| `from` | Who asked, as YouTube shows their name. |
| `reach` | `chat`: a short public reply is enough, drafted in the chat and posted only if the creator says yes. `email`: it touches money or private details, so the creator writes from their own email. |

A business ask is `Medium` ("Worth a look") when a real business says what it wants, and
`Low` when it is vague. It is never `High`, and the board ranks it after the trouble at the
same level. The board never answers one: its button asks the chat for a draft to copy.
