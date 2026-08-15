---
title: Obsidian Knowledge Base
created: '2026-08-13T00:00:00Z'
modified: '2026-08-13T00:00:00Z'
tags: [notes, knowledge-base, obsidian, showcase]
order: 1
---
# Obsidian Knowledge Base

Turns the vault you already wrote into a knowledge base you can ask questions of.

## What you get

A set of topic pages built from years of scattered vault notes — a project, a
person, a recurring question, a decision that got made over several notes, each
pulled together into one page you can actually read.

**This cabinet writes files into itself.** Every other showcase in this set only
reads from wherever its source lives — it creates pages. The Librarian reads your
imported vault and writes real markdown pages into `pages/`, and rewrites them again
on the next run as the vault changes. Nothing else in the cabinet is ever touched.

## How to look at it

Open the **Library** app in this cabinet. It comes pre-filled with two made-up
example pages — "the Thursday thing" and "flat move" — so you can see the shape of
it straight away. The page says plainly that those are examples. Your first real
library replaces them.

## Before it can build your real library

Import your Obsidian vault from Cabinet's integrations screen. It's a one-off
import, not a live connection — Cabinet reads your vault once and mirrors it in as
plain markdown. Run the import again whenever you want a fresher build.

## What's inside

- **Librarian** — the one agent. Reads the imported vault, writes the pages.
- **Build The Library** — the one routine. Runs Monday at 10:00, rebuilding the
  pages from whatever notes are there.
- **Library** — the one page. A card per topic, linking to its page.
