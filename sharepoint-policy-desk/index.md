---
title: Policy Desk
created: '2026-09-16T00:00:00Z'
modified: '2026-09-16T00:00:00Z'
tags: [sharepoint, policy, handbook, compliance, showcase]
order: 1
---
# Policy Desk

Ask what the company policy says. The answer comes back with the document it came from.

## What you get

Somebody asks whether they can expense a taxi home, or how much notice a resignation
needs, or whether a contractor can use their own laptop. Today that question goes to a
person, who goes looking through a SharePoint library, who comes back an hour later with
a link and a guess.

Here you ask the question and get a real answer: the rule in one sentence, the exact words
from the document, which document it was, and when that document was last reviewed. If two
policies disagree, you are told both. If nothing in the library covers it, you are told
that too, in those words, rather than being handed something that sounds close.

The last part is the point. A policy answer that might be invented is worse than no answer,
because somebody will act on it.

## Read only, and that is the feature

Cabinet reads your policy library. It cannot write to it, and the connection is built so
it cannot: the folder is mounted view only, and every route in Cabinet that could put bytes
on disk refuses inside it. Nothing is edited, renamed, moved, shared or deleted in
SharePoint. Your document library stays exactly the system of record your auditors already
signed off.

Keep SharePoint as the place policies live. What this replaces is the hunting.

## How to look at it

Open the **Policies** app in this cabinet. It lists every policy in the library with its
owner, the date it was last reviewed, and whether that date has gone stale. Anything
overdue sits at the top, because an out of date policy is the one that causes the problem.

It comes pre-filled with a made up example so you can see the shape of it straight away.
The page says clearly that those policies are invented. Your first real index takes their
place.

To ask a question, talk to **Policy Desk** in this cabinet. That is the part people use.

## Before it can read your real policies

Connect SharePoint in Cabinet's integrations screen and pick your policy library. The
popup walks you through it: it needs the OneDrive app on this computer, and it needs you to
press **Add shortcut to My files** on the library in SharePoint once, so OneDrive brings
the folder down to the machine. After that Cabinet reads the folder like any other.

Until you connect, both the page and the desk keep to the example and say so.

## If the page still shows the example

The routine only writes when it can actually read your library. If it has run and the
example is still sitting there, the folder is not connected yet, or it is connected
somewhere this cabinet cannot see.

Nothing was overwritten and nothing errored. Fix the connection and run the routine again.

## What's inside

- **Policy Desk** the agent you ask. Answers with the document, never from memory.
- **Library Keeper** the agent that runs. Rebuilds the index and flags what has gone stale.
- **Weekly Policy Index** the one routine. Runs at 07:00 every Monday.
- **Policies** the one page. Opens on the newest index, with a dropdown for earlier ones.
