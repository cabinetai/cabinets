---
title: Slack Team Memory
created: '2026-09-16T00:00:00Z'
modified: '2026-10-29T00:00:00Z'
tags: [slack, questions, knowledge, search, faq, showcase]
order: 1
---
# Slack Team Memory

Every question your team has already answered in Slack, kept as a page in your knowledge base so nobody has to ask it again.

Every night it reads the day's Slack threads and keeps one page per answered question:

- **The answer**: in a few plain lines, with the other ways people asked it and a link to
  every thread it came from.
- **How often it was asked**: a question asked four times is a gap in what people read.
  The page that comes up most is marked worth pinning.
- **Settled, Shifting or Open**: when an answer changes, the page is rewritten and keeps
  what it used to be. A question nobody answered stays Open.

The pages are ordinary pages in **answers/topics**, so Cabinet's search finds them and
every other agent can read them. Nothing is thrown away. A note you add to a page under its
own heading is kept. If an answer is a key or a password, the page says where it is kept,
never the secret itself.

## To start

Open **Answer Book** and connect Slack on Cabinet's integrations screen: press **Connect
Slack**, check the workspace on Slack's page and press **Allow**. There is no app to make
and no key to paste. Cabinet then asks which channels it may use. Pick the channels where
questions get answered and give them **Read**. Direct messages are never read. Until the
first sweep the page shows made-up questions, clearly marked.

## It only reads, unless you allow it

The nightly sweep only reads. It can also keep a **Team FAQ** canvas in one Slack channel,
refreshed every Monday with the most asked answers and bookmarked at the top. It is off
until you turn it on:

1. Open **FAQ Canvas** in this cabinet and write the channel's name after `channel:`.
2. On Cabinet's channel screen, set that channel to **Write**.

The canvas shows you as its author, because Cabinet signs in to Slack as you. It never
posts a message.

## Inside

- **Answer Book**: the app this cabinet opens on. Search it, filter it, or see what the
  last sweep changed.
- **Answer Keeper**: the agent. Reads the threads and keeps one page per question.
- **Nightly Answer Sweep**: the routine, every night at 2.
- **Weekly FAQ Canvas**: Mondays at 8, only once you choose a channel.
- **FAQ Canvas**: where you turn the Slack canvas on and off.
