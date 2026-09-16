---
title: Bid Room
created: '2026-09-16T00:00:00Z'
modified: '2026-09-16T00:00:00Z'
tags: [sharepoint, bid, proposal, rfp, tender, showcase]
order: 1
---
# Bid Room

One page that says where the bid stands. What is written, what is missing, what is due next.

## What you get

A bid lives in one SharePoint folder and nobody can tell you where it stands. The proposal
is in there, and three versions of the pricing sheet, and a security questionnaire somebody
started, and the client's requirement list that nobody has checked the answers against.
Asking the team means four messages and two of them come back wrong.

Every weekday morning this cabinet reads that folder and writes one page: every part of
the bid, whether it is drafted, in review or not started, who touched it last, and when it
is due. What is missing sits at the top. Days left sits next to the deadline, in a colour
you can read across a room.

It works out what is there from the folder itself, not from a checklist somebody has to
keep updating. A file that stopped moving four days before submission is the thing the page
is for.

## Read only, and that is the feature

Cabinet reads the bid folder. It cannot write to it, and the connection is built so it
cannot: the folder is mounted view only, and every route in Cabinet that could put bytes on
disk refuses inside it. No draft is edited, no version is overwritten, nothing is renamed
or moved, and nothing is sent to the client. The status page is written here, in Cabinet,
beside the folder rather than inside it.

For a bid that is worth winning, that matters. The one place a status tool can hurt you is
by touching the submission pack, and this one cannot reach it.

## How to look at it

Open the **Bid Status** app in this cabinet. It opens on this morning's page, with a
dropdown for earlier mornings, so you can see what moved.

It comes pre-filled with a made up example so you can see the shape of it straight away.
The page says clearly that the bid is invented. Your first real morning takes its place.

To ask about one thing rather than read the whole page, talk to **Bid Captain**. To check
the pack against the client's own requirement list, ask **Requirements Checker**.

## Before it can read your real bid

Connect SharePoint in Cabinet's integrations screen and pick the bid folder. The popup
walks you through it: it needs the OneDrive app on this computer, and it needs you to press
**Add shortcut to My files** on the folder in SharePoint once, so OneDrive brings it down
to the machine. After that Cabinet reads the folder like any other.

Pick the bid folder itself, not the whole team site. The page is about one bid, and a page
about forty bids is a page nobody opens.

## If the page still shows the example

The routine only writes when it can actually read the folder. If it has run and the example
is still sitting there, the folder is not connected yet, or it is connected somewhere this
cabinet cannot see.

Nothing was overwritten and nothing errored. Fix the connection and run the routine again.

## What's inside

- **Bid Captain** the agent that runs. Reads the folder, writes the morning page.
- **Requirements Checker** the agent you ask. Matches the pack against the client's list.
- **Daily Bid Status** the one routine. Runs at 07:30, Monday to Friday.
- **Bid Status** the one page. Opens on this morning, with a dropdown for earlier ones.
