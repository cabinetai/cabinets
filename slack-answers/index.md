---
title: Slack Team Memory
created: '2026-09-16T00:00:00Z'
modified: '2026-10-29T00:00:00Z'
tags: [slack, questions, knowledge, search, faq, showcase]
order: 1
---
# Slack Team Memory

Every question your team has already answered in Slack, kept as a page in your knowledge base so nobody has to ask it again.

## What you get

Every night, the answers given in Slack are written down. Each question becomes one page
in this cabinet: the question in the words someone actually used, the answer in a few
plain lines, how many times it has come up, the other ways people asked it, and links back
to every thread it came from.

The pages are the memory, so nothing is thrown away. When a question comes up again, its
page is updated and its count goes up. When the answer changes, the page is rewritten and
marked **Shifting**, with what it used to be kept underneath. A question nobody answered
stays marked **Open** until somebody does.

The counter is the point. A question asked once is a question. A question asked four times
is a gap in whatever people are reading, and the page tells you which one it is.

Because they are ordinary pages, Cabinet's search finds them and every other agent in your
workspace can read them before it answers a question of its own.

## How to look at it

Open the **Answer Book** app in this cabinet and type into the box at the top. Filter by
state, sort by how often something was asked, or show only what the last sweep changed.
It comes pre-filled with a made-up example so you can see the shape straight away, and the
page says clearly that those questions are invented. Your first real sweep replaces them.

The pages themselves are in **answers/topics**, one per question. Open one, or edit it: a
note you add under its own heading is kept. Each night also leaves a short log in
**answers** of what that sweep changed.

## Before it can read your real Slack

Connect Slack on Cabinet's integrations screen. Press **Connect Slack**, check the
workspace on Slack's own page and press **Allow**. There is no app to make and no key to
paste.

Cabinet then asks which channels your team may use. Pick the channels where questions get
answered and give them **Read**. That is all the nightly sweep needs. Direct messages are
never read, so a question answered in private stays private. Until Slack is connected the
page keeps showing the example.

If an answer is a key or a password, the page says where it is kept and who gives it out,
never the secret itself.

## A weekly FAQ in Slack, if you want one

The cabinet can also keep a canvas called **Team FAQ** in one Slack channel, refreshed
every Monday with the answers your team asks for most, and bookmarked at the top of the
channel. It is off until you turn it on:

1. Open **FAQ Canvas** in this cabinet and write the channel's name after `channel:`.
2. On Cabinet's Slack channel screen, set that channel to **Write**.

Cabinet signs in to Slack as you, so the canvas shows you as its author. It never posts a
message, in that channel or anywhere else. On **Read**, the routine changes nothing and
says why on the FAQ Canvas page.

## What's inside

- **Answer Keeper** is the one agent. Reads the threads, keeps one page per answered question.
- **Nightly Answer Sweep** runs at 02:00 every day and updates the pages.
- **Weekly FAQ Canvas** runs at 08:00 every Monday. It does nothing until you choose a channel.
- **Answer Book** is the page you search.
- **FAQ Canvas** is where you turn the Slack canvas on and off.
