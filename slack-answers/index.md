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

Open **Answer Book** and press **Connect Slack**, check the workspace on Slack's page and
press **Allow**. There is no app to make and no key to paste. Cabinet then asks which
channels it may use. Pick the channels where questions get answered and give them
**Read**. Direct messages are never read. Until the first sweep the page shows made-up
questions, clearly marked, and you can start the first sweep right there.

## Ask about any answer

Open an answer in the Answer Book for its next steps, each one a question to the Answer
Keeper in the chat beside the page:

- **Draft a reply with this answer**, for the next person who asks it.
- **Turn this into a doc page**, in `handbook/` or in a page you already have.
- **This answer is wrong**: it reads the thread again, updates the page and says what
  changed.

**Ideas** holds questions to try, and the box at the bottom takes your own.

## It only reads, unless you allow it

The nightly sweep only reads. Two things can write to Slack, and both wait for you:

- **A reply you approved.** A drafted reply is shown in the chat first. It is posted only
  after you say yes, once, in that thread, and only in a channel you set to **Write**.
  Otherwise you get the text to copy.
- **A Team FAQ canvas** in one Slack channel, refreshed every Monday with the most asked
  answers and bookmarked at the top. It is off until you turn it on: press **Turn on the
  FAQ canvas** at the bottom of the Answer Book, or write the channel's name after
  `channel:` in **FAQ Canvas**. Then set that channel to **Write** on Cabinet's channel
  screen.

Anything posted or made shows you as its author, because Cabinet signs in to Slack as you.

## Inside

- **Answer Book**: the app this cabinet opens on. Search it, filter it, see what the
  last sweep changed, or ask about an answer. **Layout** hides the parts you do not use,
  just for you.
- **Answer Keeper**: the agent. Reads the threads and keeps one page per question.
- **Nightly Answer Sweep**: the routine, every night at 2.
- **Weekly FAQ Canvas**: Mondays at 8, only once you choose a channel.
- **FAQ Canvas**: where you turn the Slack canvas on and off.
