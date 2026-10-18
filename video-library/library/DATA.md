---
title: How Your Video Library gets its words
---
# How Your Video Library gets its words

The page never saves a video and never talks to YouTube or any other site for data. When the
person presses **Save** with a link from YouTube, Instagram, TikTok, X, LinkedIn or Facebook,
the page asks the Video Librarian in the chat. The agent looks the video up with `video_info`
(size, length, captions, the post's text, free space), asks before anything over about
500 MB, saves it with `save_video`, reads the transcript, and writes the files below.
Nothing runs on a schedule. The full rules are in the agent's persona
(`.agents/video-librarian/persona.md`).

| File | Written by | What it holds |
|---|---|---|
| `library/data.json` | The agent, in a chat | The library the page shows. Schema `video-library/library@1`. |
| `library/EXAMPLE-data.json` | Nobody (it ships with the template) | A made-up library in the same shape, shown, marked as an example, until `data.json` exists. |
| `library/layout-change.json` | The agent, in a chat | Boxes someone asked to `add` or `remove`, with `at`, `for` and a `note`. Schema `video-library/layout-change@1`. The page offers it with Apply and No thanks; each person's layout itself stays in Cabinet (`cabinet.mine`). |
| `library/reading.json` | The first save only, through `first-read.mjs` | `{ schema, startedAt, updatedAt, done, lines, gift, offers }`: each step of the first save, one line at a time, and the things to do meanwhile, while the person watches. Schema `video-library/reading@1`. |
| `library/.work/` | The first save, through `first-read.mjs` | The agent's own files for the helper (`gift.json`, `offer.json`, `line.txt`). Deleted when the save is told. |
| `videos/<slug>/` | `save_video` | The media file (`video` or `audio` only), `transcript.md` (a time every 5 to 10 seconds, when the video has captions) and `index.md` (site, title, channel or who posted it, link, length, upload day, size, and the description or the post's text). |
| `videos/<slug>/summary.md` | The agent | Five lines, key points with times, lines worth quoting, clip ideas. |
| `videos/EXAMPLE-*/` | Nobody | The made-up videos' transcripts and summaries. No media. |
| `imports/` | The person (TikTok's data export), the agent (`<YYYY-MM-DD>.md`) | "Bring in my TikTok favorites": the agent reads only the video links in the export's lists whose names have Favorite or Like, saves them one at a time after one yes, and notes what was saved and what failed. The export's exact JSON shape is not fixed, so it looks for objects with a `Link` or `link` under any such list. "Bring in my YouTube likes": with YouTube connected, the agent lists the Liked videos playlist (or one of the person's own playlists) through YouTube's read access, counts them, saves them the same way and writes the same note. Watch later and History are not open to any app. Nothing is uploaded or posted, and nothing on YouTube is liked or changed. |

`data.json` in short: `updatedAt`, `disk` `{ freeBytes, at }` (the free space the agent last
read; the page shows it small under the headline), and `videos`, newest first, each:
`slug`, `title`, `channel`, `link`, `source` (`youtube`, `instagram`, `tiktok`, `x`,
`linkedin` or `facebook`), `videoId` (YouTube only), `postId` (any other site), `postText`
(the post's text, other sites only), `own`, `durationSec`, `uploaded`, `option`
(`video`, `audio` or `transcript`), `sizeBytes`, `savedAt`, `paths` `{ folder, media,
audio, transcript, info, summary }` (cabinet-relative, always under `videos/`), `oneLine`,
`subjects` (two to four, small letters, "sourdough", "baking"), `summary` (five lines), `keyPoints` `[{ sec, text }]`, `quotes` `[{ sec, text }]`, `clips`
`[{ fromSec, toSec, why }]`, and `status` (`saving`, `saved`, or `failed` with `why`).

A video saved both ways keeps one entry: `option` is `video`, `paths.media` the video file,
`paths.audio` (optional, only then) the sound file, and `sizeBytes` both files together. The
card says "Video and sound only", plays the video and links to the sound file, and the
numbers count it as a video and as a sound only.

How a card plays: the cabinet's own copy (`../videos/<slug>/<file>`, served with byte ranges)
when `paths.media` is there, else, for a YouTube video, YouTube's privacy-enhanced player
(`youtube-nocookie.com/embed/<id>`) once the person presses play. A copy that cannot be
reached (deleted, or a sealed frame on Cloud with no login to send) falls back to the
YouTube player. A video from another site plays only from the cabinet's copy. Each card
names its site, links to the post there, and shows the first two lines of `postText`, all
of it when the card is open. A time anywhere on the page jumps the card's player there.

The Subjects box lists every subject of the saved videos with how many videos have it, and
"All videos" first. A press shows only that subject's videos in Your videos; the choice is
each person's own (`cabinet.mine`, `video-library-subject@1`). Videos with no `subjects` get
a "Give them subjects" button, which asks the agent in the chat. The Ask box offers "Show me
all my videos about ..." with the chosen subject, or the most common one.

The transcript under a card is read from `paths.transcript` when the person opens it. Any
line that starts with a time (`**[1:23]**` as Cabinet writes it, or `[00:01:23]`, `1:23`, `**1:23**`, `(1:23)`) gets a button
that jumps the player there.

The page is a 12-column grid of boxes on YouTube's light grey under a red headline band,
laid out like YouTube Digest: Headline, Save a video, Subjects, Bring videos in (how to save one
link, all TikTok favorites from TikTok's data export, or all YouTube likes), Your videos, Clip ideas, Worth quoting,
Ask about your videos and Ideas for your videos to start with, and more to add (Key points,
three numbers, and each idea as its own box with its picture from `ideas/`). Ideas and
Layout sit in the headline. The idea pictures are copies of existing template covers,
shrunk, until unique ones are made.

The first save (no video in `data.json` is `saved` yet) is told as it happens. The agent
runs `node library/first-read.mjs start` before it looks the video up, then `push '<line>'`
at each step ("Found the video: **How Tiny Houses Are Built**, from Small Space Studio, 18
min", "Downloading **the video, 412 MB**", "Writing **the transcript**"), `gift @gift.json`
once and `offer @offer.json` twice before the download, and `done` last. The helper writes
`reading.json` atomically under a lock, refuses an empty, broken or repeated line, a 15th line
(the page shows 14), a line with a link, a file or a tool's name, and a gift or offer whose title is not the one in **bold** in
a line already pushed. From the moment Save is pressed on the example (or a library with no
saved video), the page shows "Saving your first video": the lines one by one, the newest
step pulsing, and beside them "While I save it, you can...": the gift `{ kind: "summary",
video, at }` ("Yes, sum it up" asks for its 5-line summary), then the `offers`: `{ kind:
"more", video }` (three more videos like it) and `{ kind: "weekly" }` (how to make it a weekly
habit, explained only). Every press asks the agent in the chat; nothing is saved, posted or
set up to run on its own. Until the first line, the screen says it is opening the link, for
90 seconds at most. A reading quiet for 20 minutes is ignored, unless its video is still
saving (up to 3 hours). After the save the gift and the offers not yet used stand under the
band, where the Example ribbon was, for 3 days or until "Not now". Later saves are told on
their own card.
