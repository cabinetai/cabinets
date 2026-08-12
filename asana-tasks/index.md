---
title: Asana Tasks
created: '2026-08-09T00:00:00Z'
modified: '2026-08-09T00:00:00Z'
tags: [asana, tasks, my-tasks, showcase]
order: 1
---
# Asana Tasks

Every morning, the Asana tasks that are actually on you today.

## What you get

One page, waiting for you at 8. Every task with your name on it gets one line — what it is,
where it stands, when it is due, and the one thing that happens next. The task somebody else
is stuck behind sits at the top. The one you are only waiting on a reply for sits at the
bottom, where you can safely leave it.

**Your work, not the project.** Not a plan for your manager: the tasks assigned to you that
are still open, plus anything of yours that another person is blocked on. Tasks you have
ticked off drop away.

## About the status column

Asana has no statuses. A task is finished or it is not, and everything else you would want
to know — is this late, is somebody waiting on me, can I even move it today — is spread
across the due date, the dependencies and the comments. This page does that reading for you
and gives every task one of five plain words: Blocking, Overdue, In progress, To do,
Waiting. A task too thin to judge is marked Unclear rather than guessed at.

The due date is written the way you would say it: **Today**, **Tomorrow**, **Fri 15 Aug**, or
a dash when the task has no date. Anything already past its date is coloured so you cannot
scroll by it.

## What it will not do

It never changes your Asana. No new tasks, no ticking anything off, no moved due dates, no
reassigning, no comments. The connection to Asana can do all of that; this morning routine
uses none of it. It only reads.

It does not cover the team. Tasks assigned to somebody else never appear, even on a project
you own.

It is not live. It is a photo of your Asana at 8 in the morning, not a window into it —
something that lands at ten shows up tomorrow.

## How to look at it

Open the **My Tasks** app in this cabinet. It comes pre-filled with a made-up example so you
can see the shape of it straight away — the page says clearly that those tasks are fake.
Your first real list takes its place.

## Before it can read your real Asana

This is not a one-click connection. Asana wants you to create your own app inside Asana
first, then paste two of its values into Cabinet. About five minutes, once.

1. Open Asana's app console at **app.asana.com/0/my-apps** and click **Create new app**.
2. Name it Cabinet, set the type to **MCP app**, tick the terms box, and click **Create app**.
   Your app's own page opens.
3. Open **OAuth** in the left sidebar. Under **Redirect URLs**, click **Add redirect URL**,
   paste the address Cabinet shows you, and click **Add**.
4. Click **Save changes** at the bottom of that page.
5. Copy the **Client ID** and **Client secret** from the same page into Cabinet's two Asana
   fields, click **Connect & sign in**, and approve Cabinet in the browser tab that opens.

**Choose MCP app, not API app.** Asana offers both and pre-selects the wrong one. An API app
cannot be used here, and the type cannot be changed after the app is created — pick it wrong
and the only fix is to start again with a new app.

**Step 4 is a real step.** The redirect address looks added the moment you add it, but it is
not saved until you click Save changes, and sign-in fails without it.

Asana gives the app you just made full access to your tasks and projects; Asana does not yet
let you narrow that down. This cabinet still only reads. Your Client ID and Client secret are
kept on this computer.

Until you connect, the page keeps showing the example.

## What's inside

- **Task Reader** — the one agent. Reads your tasks, writes the list.
- **Morning Asana Tasks** — the one routine. Runs at 08:00 every day.
- **My Tasks** — the one page. Opens on today, with a dropdown for earlier days.
