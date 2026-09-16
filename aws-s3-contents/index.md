---
title: AWS S3 Contents
created: '2026-08-13T00:00:00Z'
modified: '2026-09-16T00:00:00Z'
tags: [aws, s3, storage, bucket, files, showcase]
order: 1
---
# AWS S3 Contents

What's actually in your bucket, and what changed last.

## What you get

A bucket is where things go to be kept, and a year later nobody can say what is in
there. The folder names were picked by whoever set it up, half of them are dates,
and the person who knew has left.

Every morning this cabinet writes one page about it. A short paragraph saying what
the bucket is for, judging by what is actually in it, and then the twenty files that
changed most recently, newest first, each with a line saying what it is for rather
than what it is called.

It is not an inventory, on purpose. A bucket with a hundred thousand files still gets
twenty rows, because the useful question is never "what is in here" but "what moved".
If the nightly backup stopped landing four nights ago, the top of the list is where
you find that out.

## Read only, and that is the feature

Cabinet copies the folder down and reads the copy. It cannot write back, and the
connection is built so that it cannot: the copied files are mounted view only, and
every route in Cabinet that could put bytes on disk refuses inside them. Nothing is
uploaded, nothing is deleted, nothing is renamed, nothing in your bucket is touched
at all. The morning page is written here in Cabinet, beside the files rather than
into your storage.

Buckets are where the irreplaceable things live. Anything that reads yours should
not be able to rearrange them, and this cannot.

## How to look at it

Open the **Contents** app in this cabinet. It opens on this morning's page, with a
dropdown for earlier mornings, so you can see what the bucket looked like last week.

It comes pre-filled with a made up example so you can see the shape of it straight
away. The page says clearly that the bucket is invented. Your first real morning
takes its place.

## Before it can read your real bucket

Connect AWS S3 in Cabinet's integrations screen. You paste in the access key and the
secret you already have, pick your bucket from the list, and then pick a prefix,
which is just a folder inside that bucket. Cabinet copies that folder down to this
computer.

The files show up in the sidebar inside this cabinet, in a folder named after your
bucket. They are ordinary files you can open and read here, with a padlock on them:
nothing in Cabinet can change them, and nothing goes back the other way.

Pick one prefix rather than the whole bucket. A folder you actually care about, read
properly, is worth more than everything you have ever stored, skimmed.

## If the page still shows the example

The routine only writes when it can read real files. If it has run and the example
is still sitting there, either the bucket is not connected yet or the prefix you
picked came down empty.

Nothing was overwritten and nothing errored. Fix the connection and run the routine
again.

## What's inside

- **Bucket Reader** is the agent that runs. Reads the copied files, writes the
  morning page.
- **Daily Bucket Contents** is the one routine. Runs at 09:00 every day.
- **Contents** is the one page. Opens on this morning, with a dropdown for earlier
  ones.
