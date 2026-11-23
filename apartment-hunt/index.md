---
title: Apartment Hunt
created: '2026-11-23T00:00:00Z'
modified: '2026-11-23T00:00:00Z'
tags: [apartments, rent, buy, israel, yad2, madlan, real-estate, map]
order: 1
---
# Apartment Hunt

An apartment scout that works for you, in Israel for now. You tell it what you need. It
searches the listing sites twice a day, reads every listing like a seasoned broker would,
and puts only the places worth your time on a map, each with why it fits, what to watch
out for, and what to ask before you go.

## How it starts

Press **Start** on the map. The **Apartment Scout** asks you a few rounds of questions:
rent or buy, where your days take you, the budget you can live with and the one you
cannot pass, the rooms, the move-in date, what you will not give up and what you would
trade. It writes what it learned to `search/brief.md` and searches right away.

## What you get

- **A map of real options.** Every find is a pin with its price. Green is a top pick, blue
  a good one, amber worth a look. The places that matter to you (work, school, family) are
  on the map too, with the distance from each find.
- **A verdict on every listing.** Is the price fair for the street, does it have what you
  need (a safe room, an elevator, parking), what is missing from the ad, and what smells
  wrong.
- **Questions to ask** the owner or broker before you travel to see it.
- **It learns from you.** Press **Not for me** and say why. The Scout reads every reason
  before its next search and tightens the search.
- **A weekly market read.** Once a week: what places like yours cost now, what moved, and
  whether your budget or your areas should change.

## Sources

Yad2, Madlan, Homeless, Komo, WinWin and agency sites, plus the government's record of
real sale prices (nadlan.gov.il) to check what a place is really worth. On the Cabinet
desktop app the Scout uses Cabinet's own browser, which reads sites that refuse plain
requests. It never signs in, never pays and never sends a message for you.

## Where things are kept

- `search/brief.md`: what you are looking for. The Scout keeps it. You can edit it.
- `listings/`: one file per apartment worth a look.
- `search/runs.json`: what each search looked at and found.
- `search/market.md`: the weekly market read.
- `playbooks/`: how the Scout works. `method.md` is its craft.

The places you see at first are examples, made up, in and around Tel Aviv. They go away
as soon as your own search starts.
