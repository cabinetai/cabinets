---
title: What the Studio reads
---
# What the Studio reads

The Studio reads the files below and shows them. A change the person makes in the Studio
is saved at once in the Studio's own store, `studio/.data/shared.json`, with no chat. Profile
changes are copied into `profile.md` by the Producer. Changes to a video are copied into
`video.json` by `node studio/apply.mjs <id>`, a script, so they are exact. The rules for each
part are in `.agents/producer/persona.md`.

The Studio goes in six steps: Brand, Idea, Script, Look, Make, Post. Pick an idea and
**Write my script** writes `video.json` with `stage: "script"` and makes nothing else. The
person changes the script and the look, then **Make my video** applies the changes, makes a
picture for each scene and the voice when the plan asks for one, and renders.

The pictures come from Cabinet's Images integration and the voice from Voiceovers. Both are
a must (`.cabinet` says `need: needs` for Make my video): Cabinet does not start that job
until they are connected. Every video has a voice unless the person turns it off for that
video in the Studio (`speak` false). Moving scenes come from Cabinet's Video integration,
which is optional: the person picks still pictures, the first scene moving, or every scene
moving, and the Studio asks for Video only then. The Studio reads both through
`cabinet.connectors`, shows each one next to the feature it makes, and opens Cabinet's own
connect flow over itself. It never asks for a key.

| File | Written by | What it holds |
|---|---|---|
| `profile.md` | Fill in my profile, the Producer, or the person | The brand profile: six `## ` parts in a fixed order. |
| `studio/data/ideas.json` | Get video ideas | The latest set of ideas. |
| `studio/data/assets.json` | `studio/assets.mjs`, the Producer | The business's own pictures: `{ "schema": "shorts/assets@1", "assets": [ { "path", "bytes", "kind", "shows", "uses", "last"? } ] }`. The script lists the files and counts how past videos used each one (`uses`: in how many videos; `last`: how the newest video used it, `photo`, `pop` or `refs`). The Producer writes `kind` (`photo`, `product`, `logo`, `screen`, `proof` or `skip`) and `shows`, once per picture. |
| `studio/data/videos/<id>/video.json` | Write my script, `studio/apply.mjs` | One video's plan. |
| `studio/data/videos/<id>/render.json` | `studio/render.mjs` | `{ state: "rendering" \| "ready" \| "failed", at, why?, seconds?, tookSeconds?, bytes? }`: `seconds` is the video's length, `tookSeconds` how long the render took. |
| `studio/data/videos/<id>/video.mp4` | `studio/render.mjs` | The finished video, 1080 by 1920 at about 5 Mbps, light enough to post to every app. |
| `studio/voices/<voice>.m4a` | Shorts Factory | A short sample of each voice, so the person hears it before choosing. |
| `studio/compose.js` | Shorts Factory | How a caption and a look are drawn. The Studio's preview and `render.mjs` both use it, so they match. |
| `studio/data/videos/<id>/scene-<uid>.wav`, `scene-<uid>.jpg`, `scene-<uid>.mp4` | The Producer, with Cabinet's Voiceovers, Images and Video | One scene's voice line, picture (a picture may be `.png` or `.webp`, as the tool answers) and, when it moves, its clip. |
| `studio/.data/shared.json` | The Studio (through Cabinet's app store) | Key `profile`: the person's changes not yet in `profile.md`, from a part's heading to its answer. The Studio shows them over `profile.md`; the Producer folds them in and removes the key. Key `picked`: the id of the idea the person picked. Key `videos`: the person's changes to a video, `{ "<id>": { "scenes": [ { "from", "kind", "onScreen", "said", "picture", "seconds", "key", "pos", "pop"? } ], "look": { … }, "speak", "motion", "voice", "palette", "post": { … } } }`. `scenes` is the whole list in order; `from` is the scene's place in the plan, `null` for a new one. `apply.mjs` takes an entry out once it is applied. Key `render`: the id of the video Make my video makes. |

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
| What never to say | Free text, or `Nothing to avoid` |

All six must be answered before ideas start. The Studio counts them and marks a
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
      "source": "../strategy/index.md"
    }
  ]
}
```

- `id`: short, lowercase, words joined by `-`, unique in the set.
- `hook`: at most 7 words. `pattern`: one of the hook patterns in the short-video skill.
- `blocked`: the parts still "Not filled yet" when the run stopped; then `ideas` is empty.

## studio/data/videos/<id>/video.json

```json
{
  "schema": "shorts/video@1",
  "id": "price-beaten",
  "ideaId": "price-beaten",
  "title": "Price beaten in 7 days or it's free",
  "createdAt": "2026-11-03T18:00:00Z",
  "palette": ["#2f4f63", "#132433", "#1d3a4a"],
  "voice": "Kore",
  "speak": false,
  "stage": "script",
  "visual": "Real phone photo, soft window light, warm muted colours, a little grain",
  "cast": "The planner: a woman in her thirties, dark curly hair, an olive sweater",
  "look": { "preset": "karaoke", "style": "outline", "font": "montserrat", "upper": true, "size": 96, "accent": "#ffe14d", "x": 50, "y": 64 },
  "scenes": [
    {
      "uid": "a1b2c3",
      "kind": "hook",
      "onScreen": "Found the same trip cheaper within seven days? We match it.",
      "said": "Found the same trip cheaper within seven days? We match it.",
      "picture": "A couple comparing prices on a laptop at a kitchen table, morning light",
      "seconds": 3.5,
      "audio": "scene-a1b2c3.wav",
      "audioSeconds": 3.1,
      "image": "scene-a1b2c3.jpg"
    }
  ],
  "post": {
    "TikTok": { "title": "…", "caption": "…", "hashtags": ["#travel", "#honeymoon"] }
  },
  "notes": []
}
```

- `kind`: `hook`, `point`, `proof` or `cta`. `uid`: names the scene's files (`scene-<uid>.wav`),
  so moving a scene never mixes them up. `key`: the caption word to colour (a word's place).
  `pos`: `{ x, y }`, the caption's place in percent, when the person moved it.
- `said`: the scene's line. The voice reads it and the captions show exactly these words,
  each one timed to the voice: `render.mjs` reads where the voice speaks and pauses in the
  scene's WAV file, and the Studio preview does the same. `onScreen` holds the same words, and
  is the caption only for a video with no voice.
- `speak`: a voice reads the scenes. Every scene always gets a picture. `stage: "script"` is
  there until the video is made. `look`: see `studio/compose.js` for every field and
  its limits (`preset`: `karaoke`, `box`, `classic`, `label`, `hype` or `minimal`; `style`: `highlight`,
  `color`, `outline`, `pill`, `label` or `dim`; `font`: `tiktok`, `montserrat`, `comic`, `inter`,
  `serif`, `grotesk` or `condensed`; `upper`: every word in capitals).
- `visual`: one sentence on the look, which every picture prompt gets, so all the scenes
  look like one shoot: the light, the colours, the feel. No person and no place.
- `cast`: one sentence on the one person the video follows, starting with a role ("The
  planner: …"). Only a scene whose `picture` names that role gets it in its prompt.
- `castFrom`: the business's photo that shows that person, a path like `photo`. `apply.mjs`
  copies it into the video's folder and names the copy in `castImage`; it goes to
  `make_image` with each made picture that names the role, so the person stays the same.
- `photo`: a real photo from the cabinet for this scene, a path from the cabinet root
  (`../` for the folder it was added to). `apply.mjs` copies it into the video's folder as
  the scene's `image`, so it costs nothing. The Studio shows it before the video is made. A
  scene whose picture the person rewrites loses its `photo` and gets a made picture.
- `pop`: one of the business's own pictures that pops out on a white card over the scene,
  a path like `photo`. `apply.mjs` copies it into the video's folder and names the copy in
  `popImage`. The person can take it off in the Studio (`"pop": false` in their changes).
- `refs`: up to 2 of the business's own pictures that the made picture keeps true (the real
  product or place). `apply.mjs` copies them into the video's folder and names the copies in
  `refImages`; the Producer sends those to `make_image` as `pictures`. A Cabinet whose
  `make_image` does not take `pictures` makes the picture from the words alone. A scene
  whose picture the person rewrites loses its `refs`.
- `motion`: `still` (default), `hook` (the first scene moves) or `all` (every scene moves).
  A scene that moves gets `clip`, a short MP4 made from its picture, and `clipSeconds`.
- `audio`, `audioSeconds`, `image`, `clip` and `clipSeconds` are there only when they were made. `audioSeconds`
  starts as the voice file's length; making the video sets it to how long the line is said
  (the video plays only that part of the file, and the file itself is never changed). File names are
  relative to the video's folder.
- `post` has one entry for each of `TikTok`, `Instagram Reels`, `YouTube Shorts` and `X`, named exactly so.
- `notes`: plain sentences on anything that could not be made, shown in the Studio.
