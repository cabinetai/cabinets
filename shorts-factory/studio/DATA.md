---
title: What the Studio reads
---
# What the Studio reads

The Studio never writes a file. It reads the files below and shows them. Every change
the person makes in the Studio is sent to the Producer in the chat, and the Producer
writes the file. The rules for each part are in `.agents/producer/persona.md`.

| File | Written by | What it holds |
|---|---|---|
| `profile.md` | Fill in my profile, the Producer in a chat, or the person | The brand profile: eight `## ` parts in a fixed order. |

## profile.md

Each part is a `## ` heading with its answer under it. A part with no answer says exactly
`Not filled yet`. A part filled from the cabinet ends with one line `Source: <page path>`.

| Part | Answer |
|---|---|
| What you offer | Free text |
| Who it's for | Free text |
| Why you | Free text |
| The goal | `More sales`, `More leads`, `More followers` or `More visits` |
| How it sounds | `Warm`, `Funny`, `Expert` or `Bold`; a second line may start `Words to avoid:` |
| Where it's posted | Any of `TikTok`, `Instagram Reels`, `YouTube Shorts`, `X`, `Facebook`, comma separated |
| What never to say | Free text, or `Nothing to avoid` |
| Video style | `Words on screen`, `With a voice` or `Your own clips` |

The first seven must be answered before ideas start. The Studio counts them and marks a
missing one "Needs you".

## Messages the Studio sends

Only after the person presses something:

- `In profile.md, set "<part>" to "<answer>".`
- `In profile.md, set "<part>" to:` followed by a longer answer on the next lines.
