---
title: Playwright Site Check
created: '2026-08-13T00:00:00Z'
modified: '2026-08-13T00:00:00Z'
tags: [playwright, browser, monitoring, showcase]
order: 1
---
# Playwright Site Check

Every morning, opens your site and tells you if anything broke.

## What you get

One page, waiting for you every morning. Every page it checked gets one row — the
path, whether it passed, what a visitor would actually see, and a screenshot for
anything that failed or ran slow. A page that quietly stopped working doesn't wait
for someone to notice; it's already on the page when you open it.

The pages checked are `example.com` until you edit the agent — a home page, a
pricing page, a contact page, none of them yours. Open the **Site Checker** agent
and replace them with your own site's pages before you rely on this for anything.

## How to look at it

Open the **Checks** app in this cabinet. It comes pre-filled with a made-up example
so you can see the shape of it straight away — the page says clearly that the check
is fake. Your first real check takes its place.

## Before it can check the real web

Playwright is one of the easy ones. Click Connect in Cabinet's integrations screen —
there's no account and no sign-in. Cabinet runs Playwright on this computer, and
your agents can open a real browser from then on.

## What's inside

- **Site Checker** — the one agent. Opens each page, writes what it found.
- **Morning Site Check** — the one routine. Runs at 07:00 every day.
- **Checks** — the one page. Opens on today's check, with a picker for earlier days.
