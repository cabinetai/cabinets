---
title: Asset Library
created: '2026-09-16T00:00:00Z'
modified: '2026-09-16T00:00:00Z'
tags: [aws, s3, assets, marketing, campaign, agency, showcase]
order: 1
---
# Asset Library

Everything your agency has delivered, what landed this week, and what nobody has cleared to use.

## What you get

Your agency drops finished work into a bucket. Films, cutdowns, stills, the logo in
nine sizes, a PDF nobody opens. The folders are named their way, the files are named
their way, and by the third campaign nobody on your side can say what is in there.
Somebody asks for the vertical cut of the autumn film, and you send a message and
wait a day.

Every Monday morning this cabinet reads the drop and writes one page. What arrived
since the last one, which campaign each thing belongs to, what shape and length it
actually is, and whether anybody has said where you are allowed to run it.

That last column is the one that saves you. A file sitting in a folder is not
permission to use it. Somewhere in the drop there is usually a delivery note saying
this photograph runs on social until the end of November, or that the model release
covers print only. The page finds that note and puts it beside the photograph. Where
there is no note, the page says so rather than guessing, and those rows sit at the
top where you will see them.

The files themselves are right here in the sidebar, so a row you are unsure about is
one click from the thing itself.

## Read only, and that is the feature

Cabinet copies the drop folder down and reads the copy. It cannot write back, and the
connection is built so that it cannot: the copied files are mounted view only, and
every route in Cabinet that could put bytes on disk refuses inside them. Nothing is
uploaded, nothing is renamed, nothing is deleted, and the master of a film your
agency spent three weeks grading is exactly where they left it.

The page is written here in Cabinet, beside the drop rather than inside it. Your
agency will never open the bucket and find a file they did not put there.

## How to look at it

Open the **Asset Catalogue** app in this cabinet. It opens on this week's page, with
a dropdown for earlier weeks, so you can see when something arrived and what it
replaced.

It comes pre-filled with a made up campaign so you can see the shape of it straight
away. The page says clearly that the assets are invented. Your first real Monday
takes its place.

To ask about one thing instead of reading the whole page, talk to **Asset Finder**.
It is the one to ask for the vertical cut, the logo on a dark background, or whether
a photograph is still cleared for December.

## Before it can read your real drop folder

Connect AWS S3 in Cabinet's integrations screen. You paste in the access key and the
secret your agency gave you, pick the bucket from the list, and then pick a prefix,
which is just a folder inside that bucket. Cabinet copies that folder down to this
computer.

The assets show up in the sidebar inside this cabinet, in a folder named after the
bucket. They are ordinary files you can open and look at, with a padlock on them.

Pick the folder for the work you actually run, not the whole bucket. An agency bucket
usually also holds project files, raw footage and camera cards, and none of that
belongs on a page about what you can publish.

## If the page still shows the example

The routine only writes when it can read real files. If it has run and the example is
still sitting there, either the bucket is not connected yet or the prefix you picked
came down empty.

Nothing was overwritten and nothing errored. Fix the connection and run the routine
again.

## What's inside

- **Catalogue Keeper** is the agent that runs. Reads the drop, writes the Monday page.
- **Asset Finder** is the agent you ask. Finds one asset, or answers whether you can
  use it.
- **Monday Asset Catalogue** is the one routine. Runs at 08:00 every Monday.
- **Asset Catalogue** is the one page. Opens on this week, with a dropdown for earlier
  ones.
