---
title: What the Studio reads
---
# What the Studio reads

The Studio reads the files below and shows them. A change the person makes in the Studio
is saved at once in the Studio's own store, `studio/.data/shared.json`, with no chat. The
Producer copies those changes into the files before its next work. The rules for each part
are in `.agents/producer/persona.md`.

| File | Written by | What it holds |
|---|---|---|
| `profile.md` | Fill in my profile, the Producer, or the person | The brand profile: eight `## ` parts in a fixed order. |
| `studio/data/ideas.json` | Get video ideas | The latest set of ideas. |
| `studio/data/videos/<id>/video.json` | Make my video, Update my video | One video's plan. |
| `studio/data/videos/<id>/render.json` | `studio/render.mjs` | `{ state: "rendering" \| "ready" \| "failed", at, why?, seconds?, tookSeconds?, bytes? }`: `seconds` is the video's length, `tookSeconds` how long the render took. |
| `studio/data/videos/<id>/video.mp4` | `studio/render.mjs` | The finished video, 1080 by 1920. |
| `studio/data/videos/<id>/scene-<n>.wav`, `scene-<n>.png` | The Producer, through Cabinet | One scene's voice line and picture. |
| `studio/.data/shared.json` | The Studio (through Cabinet's app store) | Key `profile`: the person's changes not yet in `profile.md`, from a part's heading to its answer. The Studio shows them over `profile.md`; the Producer folds them in and removes the key. Key `picked`: the id of the idea the person picked. Key `videos`: the person's changes to a video, `{ "<id>": { "scenes": [ { "onScreen", "said", "picture" } ], "post": { … } } }`, scenes in order. Key `render`: the id of the video Update my video makes again. |

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

## studio/data/ideas.json

```json
{
  "schema": "shorts/ideas@1",
  "generatedAt": "2026-11-03T18:00:00Z",
  "blocked": [],
  "ideas": [
    {
      "id": "price-beaten",
      "hook": "Price beaten in 7 days or it's free",
      "pattern": "The rule",
      "angle": "The guarantee nobody else in travel gives",
      "fact": "Price-match within 7 days or the planning fee is refunded",
      "source": "../strategy/index.md",
      "platforms": ["TikTok", "Instagram Reels"]
    }
  ]
}
```

- `id`: short, lowercase, words joined by `-`, unique in the set.
- `hook`: at most 7 words. `pattern`: one of the hook patterns in the short-video skill.
- `platforms`: only those in "Where it's posted".
- `blocked`: the parts still "Not filled yet" when the run stopped; then `ideas` is empty.

## studio/data/videos/<id>/video.json

```json
{
  "schema": "shorts/video@1",
  "id": "price-beaten",
  "ideaId": "price-beaten",
  "title": "Price beaten in 7 days or it's free",
  "createdAt": "2026-11-03T18:00:00Z",
  "brand": "Wayfare",
  "palette": ["#2f4f63", "#132433", "#1d3a4a"],
  "voice": "Kore",
  "scenes": [
    {
      "onScreen": "Price beaten in 7 days",
      "said": "Found the same trip cheaper within seven days? We match it.",
      "picture": "A couple comparing prices on a laptop at a kitchen table, morning light",
      "seconds": 3.5,
      "audio": "scene-1.wav",
      "audioSeconds": 3.1,
      "image": "scene-1.png"
    }
  ],
  "post": {
    "TikTok": { "title": "…", "caption": "…", "hashtags": ["#travel", "#honeymoon"] }
  },
  "notes": []
}
```

- `audio`, `audioSeconds` and `image` are there only when they were made. File names are
  relative to the video's folder.
- `post` has one entry per platform in "Where it's posted", named the same way.
- `notes`: plain sentences on anything that could not be made, shown in the Studio.
