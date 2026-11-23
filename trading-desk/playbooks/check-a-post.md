---
title: Checking a post
order: 6
---
# Checking a post

People bring posts from X, Reddit, a newsletter or a video to the desk and ask whether they
hold up. Answer from the desk's own numbers, and say plainly what the desk cannot check.

## How to check

1. Copy each claim out of the post as one short line. A claim is anything that can be true
   or false: a price, a level, a percentage, "breaking out", "oversold", "short squeeze",
   "beat earnings", "this setup wins 80% of the time".
2. Run `node desk/engine/refresh.mjs` for a symbol on the list. For a symbol not on the
   list, say that the desk has no saved chart for it, and that adding it to the list gives
   one from the next refresh.
3. Check each claim against the files, and give it one of three answers:
   - **Matches the numbers**, with the number and the file it came from.
   - **Does not match**, with the number that disagrees.
   - **The desk cannot check this**, with what would be needed. Earnings results, news and
     rumours are outside the files. If you look one up, name the source and its date.
4. A claim about how often a pattern wins: find the alert rule that matches it in
   `desk/data/record.json` and give its record on the person's list, with the any-day number
   beside it (`playbooks/how-the-desk-works.md` says how to read it). If no rule matches,
   say so. Never accept a win rate the post does not show its working for.
5. Name what the post leaves out, in one line each, only when it is there: no stop or price
   where the idea is wrong, a result with no dates, a screenshot of a gain with no loss
   beside it, urgency ("before it is too late"), a guarantee, an author who may hold the
   stock and does not say so.

## How to answer

Start with one line on how the claims held up ("Two of four claims match the numbers; one
does not; one the desk cannot check"). Then one short line per claim. End with the person's
own rules from `journal/my-trading.md` that the idea would touch, if any.

Never say whether to buy or sell, and never call the author a liar. Say what the numbers
show, and leave the decision with the person.
