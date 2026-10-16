---
title: Deal Watch
created: '2026-10-15T00:00:00Z'
modified: '2026-10-15T00:00:00Z'
tags: [salesforce, deals, pipeline, sales, watch]
order: 1
---
# Deal Watch

Most mornings your deals are fine. This cabinet tells you which ones are not: one ranked
board of the deals and leads that need a person today, each with the facts behind it and one
next step.

## What you get

A **Deal board**. Every morning it reads your Salesforce and keeps one list:

- **Slipping**: a deal whose close date moved later since yesterday.
- **Past its close date**: a deal still open after the day it was meant to close.
- **Gone quiet**: a big deal with no call, email or meeting for two weeks or more.
- **Overdue tasks**: a task on an open deal that is past its due date.
- **No next step**: an open deal with nothing written in its Next Step.
- **New leads waiting**: a lead nobody has called or emailed a few days after it came in.

Each item is ranked **Urgent**, **Worth a look** or **Can wait**, keeps its place from day
to day, and moves to **Back on track** when it is sorted out. The board also shows what is
due to close in the next six weeks. A quiet morning says so in one line.

## How it works

- **It checks every morning at 8:30**, your open deals, the overdue tasks on them and the
  leads of the last 30 days, against yesterday's board, so it can tell when a close date
  moved.
- **It only reads on its own.** See below.
- **For the whole pipeline**, stage by stage, see Pipeline Digest.

## Getting started

1. On the board, press **Connect Salesforce** and sign in with your Salesforce account. Your
   Salesforce admin may need to approve Cabinet once.
2. Open **Setup** in this cabinet and add your Salesforce address (the one in your browser
   when you open Salesforce). With it, every deal on the board opens in Salesforce.
3. The first check starts right away and takes a few minutes. After that the board checks
   again every morning at 8:30.

Until then, the board shows a made-up company, Northwind Tools, and says so.

## It only reads on its own

- **The morning check only reads.** It never changes a deal, a task, a lead or a setting in
  Salesforce, whatever a deal's name or a note says.
- **A change happens only in a chat you started**, when you ask for it. The Deal Watcher
  shows you the exact change first (the deal, the field, its value now and its new value) and
  makes it only after you say yes. It can add a task, add a note, or change one field on one
  record. It never deletes anything, never changes many records at once, never changes an
  owner and never converts a lead.
- **A routine you set up** may change only exactly what you asked for and approved in the
  chat. Everything else it does is read and draft.
- **The page never changes anything.** Every button on the board asks the Deal Watcher in
  the chat, for a draft, a plan or an answer.

## What's inside

- **Deal Watcher** is the one agent. Reads your Salesforce and keeps the board.
- **Daily Deal Watch** is the one routine. Runs at 08:30 every day.
- **Deal board** is the one page. Open it to see which deals need you.
- **Setup** holds your Salesforce address and the few settings the board uses.
