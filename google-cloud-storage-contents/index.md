---
title: Google Cloud Storage Contents
created: '2026-08-13T00:00:00Z'
modified: '2026-08-13T00:00:00Z'
tags: [google, cloud-storage, gcs, storage, files, showcase]
order: 1
---
# Google Cloud Storage Contents

What's actually in your Cloud Storage bucket, and what changed last.

## What you get

One page, waiting for you whenever you open it. What the bucket holds, in plain
words — what it's mostly for, judging by what's actually in there — followed by
the twenty files that changed most recently, newest first. Not an inventory of
everything: a bucket with a hundred thousand files still gets twenty rows, because
what matters is what moved.

Nothing is uploaded, deleted or renamed. It only reads.

## How to look at it

Open the **Contents** app in this cabinet. It comes pre-filled with a made-up
example so you can see the shape of it straight away — the page says clearly that
those files are fake. Your first real summary takes its place.

## Before it can read your real bucket

Connect Google Cloud Storage in Cabinet's integrations screen with an HMAC
interoperability key — the access id and secret from the Interoperability tab,
not a service-account JSON file — and choose a prefix. Cabinet syncs it down as
ordinary files. Nothing here talks to Google — it reads the files after they land.

Set aside a minute for it once. After that it stays connected. Until then the page
keeps showing the example.

## What's inside

- **Cloud Storage Reader** — the one agent. Reads the synced files, writes the summary.
- **Daily Cloud Storage Contents** — the one routine. Runs at 09:00 every day.
- **Contents** — the one page. Opens on today, with a picker for earlier days.
