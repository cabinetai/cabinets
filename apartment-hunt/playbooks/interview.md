---
title: The interview
created: '2026-11-23T00:00:00Z'
modified: '2026-11-23T00:00:00Z'
tags: [playbooks, interview]
---
# The interview

How the Scout learns what the person needs. The goal is not a filled form. It is to
understand this person's life well enough to recognise the right apartment before they do.

## The shape

- **Rounds, not a questionnaire.** Two or three questions at a time, in plain words, then
  listen. Five rounds is plenty. If they answer three questions in one line, skip ahead.
- **Start wide, then narrow.** Life first, then places, then money, then the apartment,
  then the edges.
- **Ask why once.** "Why Tel Aviv?" turns "Tel Aviv" into "20 minutes from work and near
  friends", which opens Givatayim and Ramat Gan at a lower price.
- **Offer, do not only ask.** When you know something useful, say it: "For 7,000 in Lev
  HaIr you will mostly find 2.5 rooms. In Givatayim near Borochov the same money gets 3
  rooms with a safe room. Want me to include it?"
- **Use what they already told you.** Never ask for something they said. Read the chat and
  `hunt/.data/shared.json` first.
- **Accept "I do not know".** Then propose a sensible default, say it is one, and move on.

## Round 1: the life

- Renting or buying? If buying: to live in, or as an investment?
- Who will live there? (alone, a couple, kids and their ages, a roommate, a pet)
- What does a normal week look like: where do you work or study, how do you get there, and
  how often? Any place you must be near (a school, parents, a clinic, a synagogue, the sea)?

## Round 2: the places

- Which cities or neighbourhoods do you have in mind, and why those?
- What is the longest commute you would accept, and by what (car, bus, train, bike, walking)?
- Any area you would not live in, and why?

Then, from what you heard: suggest one or two areas they did not name that fit the life
and the money better, and say why in one line each. Ask if you may include them.

## Round 3: the money

Renting:
- What is the most you can pay a month, and what would feel comfortable?
- Does that include `ועד בית` (building fee) and `ארנונה` (city tax)? Most ads do not.
  Give a rough figure for their city from `israel.md` so they can decide.
- Is a broker's fee fine (usually a month's rent plus VAT), or do you want only places
  without one?

Buying:
- How much cash do you have for the deal, and what monthly mortgage payment is fine?
- Is this your only home? (It changes the tax and how much a bank lends. See `israel.md`.)
- Do you have a mortgage approval in principle (`אישור עקרוני`)?
- New from a developer, second hand, or either? Would a building waiting for TAMA 38 or
  `פינוי בינוי` (urban renewal) be a plus or a worry?

Then say back what the budget buys in their areas, honestly. If it does not fit, say so now
and offer the trade: a smaller place, another area, or a higher budget.

## Round 4: the apartment

- How many rooms at least? (Remind them: in Israel the living room counts. 3 rooms is a
  living room and two bedrooms.) A smallest size in square meters?
- When do you need to move in, and how flexible is that date?
- Which of these matter to you: a safe room (`ממ"ד`), an elevator, parking, a balcony, a
  floor you prefer, furnished or empty, pets, step-free access, quiet, light?

Then split what they said into three lists and read them back:
- **Must have**: a place without it is out.
- **Nice to have**: it adds points.
- **Never**: a deal breaker (a ground floor, a bedroom without a window).

Push gently on the must list. Every must halves the market. Ask for each one: "If the
perfect place lacked only this, would you still go and see it?"

## Round 5: the edges

- How long do you plan to stay? (A two year lease or more changes what to ask an owner.)
- Anything from past apartments you never want again? (Noise, mould, stairs, a landlord who
  never answered.) These are the best filters there are.
- Anything else I should know that a form would never ask?

## Close the interview

1. Say the brief back in five or six lines: the life, the areas, the money, the must list,
   the nice list, the deal breakers. Ask "Is that right?"
2. Look up every place they named as an anchor (Nominatim works for Hebrew and English
   addresses) and write its coordinates.
3. Write `search/brief.md` in the shape `how-it-works.md` gives, with `status: ready`, and
   a few lines in their words under `## What matters most`.
4. Search at once, following `method.md`, and finish with the best three, or with what
   you found and what would widen it.

## Changing the brief later

When the person says something that changes the search ("I can go up to 8,000", "no more
ground floors", "we are having a baby"), change only that, keep the rest, set `updated`,
and say what changed in one line. When their "Not for me" reasons on the map show a pattern
they never said, propose the change and make it only when they agree.
