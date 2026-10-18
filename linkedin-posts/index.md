---
title: LinkedIn Posts
created: '2026-10-18T00:00:00Z'
modified: '2026-10-18T00:00:00Z'
tags: [linkedin, posts, writing, drafts, showcase]
order: 1
---
# LinkedIn Posts

Write your LinkedIn posts with an agent in the chat, keep every draft in one place, and
publish one only when you say yes.

The cabinet opens on it: **Your posts**.

## What you get

- **Your drafts**: every post you are working on, each marked Draft, Approved or Posted.
  Open one to polish it, make three variants, copy it, or publish it.
- **Ideas for your next posts**: every Monday at 9, three ideas from your notes and drafts
  in this cabinet, each one tap from a draft.
- **Ask about your posts**: "Draft a post about what I shipped this week", "Which of my
  drafts is ready?". The answer comes up in the chat.
- **Ideas**: a post about your week, three takes on a draft, a month in review. Ask once,
  switch one on to run on a schedule, or keep it on the page as a box. Once your past posts
  are in, these read them, so a draft sounds like you and a month in review counts what you
  posted.
- **Your page, your way**: move, resize, add and remove the boxes, or ask the agent to
  suggest them. Each person's page is their own.

## Getting started

1. On the page, press **Connect LinkedIn** and sign in to LinkedIn. It takes about a
   minute, once. You choose who sees your posts: everyone on LinkedIn, or only your
   connections.
2. Keep notes in this cabinet about what you work on. Ask the agent for a draft in the chat.

Until you connect, the page shows made-up drafts, and says so.

## It publishes only when you say yes

The agent writes a draft only when you ask for one. Before anything goes on LinkedIn it
shows you the exact words and who will see them, and waits for your yes. It publishes only
from a chat you started: the weekly ideas never publish, and no routine ever does.

LinkedIn lets apps like Cabinet read only your name and picture. Cabinet cannot read your
posts, comments, messages or numbers, so this page shows what you wrote here, never how a
post did. LinkedIn asks apps to keep only what they need: the cabinet keeps the words you
published and the post's id, and nothing about other people on LinkedIn.

Your past posts can come in from LinkedIn's own copy of your data. On linkedin.com: Me,
Settings and Privacy, Data privacy, Get a copy of your data. LinkedIn emails you a file,
usually within a day. Put it in this cabinet's `imports/` folder (on Cabinet Cloud, upload it
in Files) and ask "Bring in my LinkedIn posts". The agent counts what is there, asks once, and writes your posts down in `imports/`.
Nothing is uploaded or posted, and the file stays in this cabinet.

A sign-in lasts 60 days. After that, the page asks you to sign in again.

## What's inside

- **Post Writer** is the one agent. Writes drafts when you ask and publishes after your yes.
- **Weekly post ideas** is the one routine. Runs at 09:00 every Monday and only writes ideas.
- **Your posts** is the page the cabinet opens on.
- `drafts/` holds your drafts, one page each. `ideas/` holds each week's ideas. `imports/`
  holds your LinkedIn export and the past posts brought in from it.
