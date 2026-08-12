---
title: Email Delivery
created: '2026-08-09T00:00:00Z'
modified: '2026-08-09T00:00:00Z'
tags: [mailchimp, transactional, email, deliverability, showcase]
order: 1
---
# Email Delivery

Every morning, whether yesterday's email actually reached people.

## This is your product's email, not your newsletter

The name is misleading, so start here. **Mailchimp Transactional** — it used to be called
Mandrill — is the email your product sends one person at a time: receipts, password resets,
order confirmations, invitations. It is a separate product from the Mailchimp you send
campaigns with. It has its own dashboard, at mandrillapp.com, and its own bill.

This cabinet reads that one and only that one. Campaigns, newsletters, audiences and signup
forms never appear here.

## It only ever reads

Say it early, because these tools can send email. This routine never does. It sends no
message, no test, not one to your own address. It changes no template, no sending domain,
no block list. It reads yesterday's numbers and writes one page — nothing you see here put
anything in anybody's inbox.

## What you get

One page, waiting for you at 8. Seven lines, in the same order every morning, for the last
24 hours: how much mail arrived, how much bounced, how much was blocked, how many people
called it junk or opted out, and how much mail providers currently trust you.

Each line carries what changed since the day before. That is the part worth having. "96
bounces" means nothing on its own; "96 bounces, up from 28" means you have a problem this
morning. And each line ends in a plain sentence saying what it means for you — "Nothing to
do", or "17 addresses are dead, remove them".

## The words on the page

Five terms do all the work, and they are the whole of what you need to know.

- **Hard bounce** — the address does not exist. It never will. Take it off your list.
- **Soft bounce** — the mailbox was full or the server was busy. It usually clears itself.
- **Rejected** — it was never sent. The address is already blocked, because it bounced or
  someone complained before.
- **Marked as spam** — someone hit the spam button on your email.
- **Reputation** — how much mail providers trust you, scored out of 100. It decides how much
  of your mail lands in an inbox instead of a spam folder.

## How to look at it

Open the **Delivery Health** app in this cabinet. It comes pre-filled with a made-up example
so you can see the shape of it straight away — the date list labels those numbers as made
up. Your first real morning takes its place.

## Before it can read your real numbers

Mailchimp Transactional is a paid add-on, bought separately from a regular Mailchimp plan.
You need it switched on before any of this works.

Unlike most connections here, this one is a key you copy across.

1. Open **mandrillapp.com** and sign in with your Mailchimp account.
2. Go to **Settings → API keys**.
3. Select **Add a new key**.
4. Copy the key the moment it appears. **Mailchimp shows it once and never again** — if you
   close the page without copying it, you cannot get that key back, and you have to create
   another one.
5. In Cabinet, open the integrations screen, find Mailchimp Transactional, and paste the key
   in.

That is enough for this cabinet. Reading your numbers works from the moment the key is in.

One thing to know even though it does not affect this cabinet: sending needs a verified
domain. If you have not verified yours under **Settings → Domains** at mandrillapp.com, your
product's email will not go out at all — which is worth checking before you wonder why the
numbers here are zero. Until you connect, the page keeps showing the example.

## What's inside

- **Delivery Watcher** — the one agent. Reads yesterday's delivery numbers, writes the page.
- **Morning Delivery Check** — the one routine. Runs at 08:00 every day.
- **Delivery Health** — the one page. Opens on today, with a dropdown for earlier days.
