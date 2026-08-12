---
title: TikTok Queue
created: '2026-08-12T00:00:00Z'
modified: '2026-08-12T00:00:00Z'
tags: [tiktok, video, publishing, social, showcase]
order: 1
---
# TikTok Queue

Finished videos go up on TikTok as private posts, ready for you to release.

## How it works

Put a finished `.mp4` in the **to-post** folder. That evening, the routine uploads it to
your TikTok account and writes down what happened. The next morning the video is sitting on
your profile, and you decide whether the world sees it.

Nothing else is needed. No caption file, no settings, no naming scheme — though there is a
caption trick below if you want one.

## It never posts in public

This is the whole shape of the thing, so it goes before anything else.

Every video this routine uploads is posted as **Only me**. It lands on your profile, where
you are the only person who can see it — not your followers, not your friends, nobody. To
release it you open TikTok on your phone, find the video, and change who can see it. That
one action is yours and the routine cannot do it.

So the worst thing a mistake here can do is put a video where only you will find it. It
cannot publish the wrong cut to your followers, because it cannot publish to your followers
at all.

There is a second reason, and it is worth knowing: TikTok itself insists. An app that
hasn't been through TikTok's review — which includes the one you set up for Cabinet — is
only ever allowed to post privately. Even if this routine tried to go public, TikTok would
refuse it.

## Captions

If you want a caption, save a plain text file next to the video with the same name and a
`.txt` on the end:

```
to-post/kitchen-reno-day-4.mp4
to-post/kitchen-reno-day-4.txt      <- the caption
```

No text file, and the filename becomes the caption, tidied up — `kitchen-reno-day-4.mp4`
posts as "kitchen reno day 4". Which is a good enough reason to name your files like
sentences.

## What you get

One page — **Posting History** — listing every video it has sent, newest first, with what
TikTok said back. Live, still processing, or refused, with the reason in plain words. Each
one links to the post on TikTok.

Every upload also leaves a small file behind in **post-log**. That folder is how the
routine remembers what it has already sent, which is why a video is never posted twice.
Leave those files alone and the queue stays honest.

## What it will not do

- It will not make anything public. Ever. That is yours.
- It will not delete or move your video files. Once posted, a video simply stays in
  **to-post** — the log is what marks it done, not its location.
- It will not edit, trim, crop, caption on-screen or re-encode anything. The file you put
  in is the file TikTok gets.
- It will not post more than three videos in one evening, however many are waiting. TikTok
  limits how much an app may post in a day, and a queue that empties itself in one go is
  how you find that limit the hard way.
- It will not touch a video already in the log, even if you edit the file.

## Before the first run

The TikTok connector needs connecting, and it needs your own TikTok app to do it — the
connector page walks you through that in about ten minutes. Until that is done this routine
writes nothing and says so, rather than inventing a posting history.
