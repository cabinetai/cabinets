---
title: The method
order: 2
---
# The method

How the Stock Scout finds an opportunity. Follow the steps in order, every run. The aim is
not to find something every day. It is to be right about when there is something.

The method has two halves. **The engine counts.** It reads the market, finds every stock
that fits a setup, works out the buy zone, the stop and the target, and tests each setup on
the past. That is arithmetic, and a model gets arithmetic wrong. **You judge.** You decide
which candidate deserves a person's attention, what the news changes, and when the right
answer is "nothing today". You never do the engine's sums again, and you never change its
numbers.

All files are in `app/data/` (see [How it works](how-it-works.md)).

## Step 1. Take the market's stance

Read `regime` in `market.json`. The engine has counted it:

- `stance`: `with-you`, `mixed` or `against-you`.
- `because`: the reasons, with their numbers.
- `fund`: the S&P 500 fund against its averages. `fear`: the fear gauge (VIX). `breadth`:
  how many of the listed stocks close above their 50-day and 200-day averages.

How the engine decides: `with-you` when the fund is in an uptrend (above its 50-day
average, and that above the 200-day) and the fear gauge is under 20. `against-you` when the
fund is under its 200-day average, or the fear gauge is over 25, or the fund fell more than
twice its usual daily move today on heavy volume. `mixed` otherwise.

You may make the stance stricter when you know something the numbers do not show yet, for
example a central bank decision later today. You never make it kinder. Write the stance
and two sentences on why, with the numbers from `because`.

How many calls the stance allows: `with-you` up to three, `mixed` up to two,
`against-you` at most one. None is always allowed, and in a market that is against you it
is usually the right answer.

## Step 2. Start from the engine's candidates

Read `candidates.json`. Each item is a stock that fits one of the five setups today, from
the person's list, the day's movers, or a wider list of about 100 large US stocks. It
carries:

- `setup`, and the numbers built for it: `buy`, `stop`, `target`, and `pay` (how far the
  target is against how far the stop is, from the top of the zone).
- `notes`: what the engine saw, with the numbers.
- `spoilers`: reasons to pass that the engine could decide. An empty list means none.
- `verdict`: how this setup has done on the past, in a market like today's (step 3).
- `facts`: the stock's trend, averages, RSI, usual daily move, and its strength against
  the market (`rs`: its return minus the fund's over 1, 3 and 6 months).

**A call is always one of these candidates, with its numbers exactly as given.** If a
stock is not in the file, it is not an opportunity today, however good it looks to you. If
you think the engine missed something, say so in your closing summary. Do not call it.

Leave out at once every candidate with anything in `spoilers`. If one of them is a stock
the person would be tempted by, it goes in `passed` with the reason.

## Step 3. Trust a setup only as far as its record

`setups.json` replays every setup over the saved charts: each day as if it were today, each
candidate then followed to its stop or its target, exactly as your own calls are scored.
The `verdict` on a candidate comes from there:

| Verdict | Meaning | What you may do |
|---|---|---|
| `pays` | At least 30 finished calls, and an average result clearly above a call made for no reason | Call it, at conviction 2 at most |
| `unproven` | Too few finished calls to say | Call it at conviction 1 only, and at most one such call a day |
| `fails` | At least 30 finished calls, and an average result under a call made for no reason | Never call it. If it is tempting, it goes in `passed` |

`verdictFrom` says whether the verdict is for today's stance (`stance`) or, when that slice
is too small, for the whole record (`overall`).

Keep the record in proportion. It covers about 14 months and 100 large companies, in one
stretch of one market. A verdict of `pays` means "not contradicted yet". It does not mean
the setup will pay next month. Say this whenever you quote the record.

Conviction 3 is not available yet. It opens for a setup only when your own scorecard
(`score.bySetup` in `outcomes.json`) shows 20 or more finished calls of that setup with an
average result above zero.

## Step 4. The five setups, in plain words

You do not detect these yourself. You need to know them to explain a call and to judge
whether the chart really looks the way the numbers say. For each candidate you consider,
read the last 60 rows of `candles/<SYMBOL>.1d.json` and check that the picture matches.

1. **Pullback in an uptrend.** A stock in an uptrend made a high in the last 20 days, then
   fell back to its 20-day or 50-day average on lighter volume. Zone: from that average to
   half a usual daily move above it. Stop: one and a half usual daily moves under the top
   of the zone. Target: the high it fell from.
2. **Breakout from a base.** At least three weeks sideways in a range no wider than about
   15%, within 10% of its 52-week high, then a close above the range on at least one and a
   half times usual volume. Zone: from the top of the old range to half a usual daily move
   above it. Stop: one and a half usual daily moves under the top of the zone. Target:
   three times the stop's distance above the top of the zone.
3. **A leader holding up in a weak market.** The market fell over the last 10 days and
   this stock fell less than half as much, or rose, and is still above its 50-day average.
   Zone: from the 50-day average or the low of the last week, whichever is higher, to half
   a usual daily move above it. Stop: one and a half usual daily moves under the top of
   the zone. Target: its 52-week high.
4. **A gap up on results that holds.** Within the last five days it opened at least 4%
   above the prior close on its earnings report, on at least twice usual volume, and has
   not closed under the low of that day since. Zone: the upper half of that day's range.
   Stop: the low of that day. Target: twice the stop's distance above the zone, or the
   52-week high if nearer. The engine cannot always tell that results caused the gap:
   when a note says so, confirm it in the headlines before you call it.
5. **A turn after a washout.** RSI was under 30 within the last five days, then one day
   closed above its open and above the previous day's high on at least one and a half
   times usual volume. Zone: the upper half of that day's range. Stop: one and a half
   usual daily moves under the top of the zone. Target: twice the stop's distance above
   the top of the zone. It is a bounce, not a new trend.

## Step 5. Choose, then argue against yourself

From the candidates that are left, pick the ones you would put in front of the person. Prefer:

- a better verdict, then a higher `pay`;
- strength against the market (`rs` above zero over three and six months);
- a stock from the person's own list over one they have never heard of;
- different industries. Never two calls from the same industry on one day: they rise and
  fall together, so it is one bet made twice.

Then, for each one you picked, **make the case against it as if you were paid to stop the
trade**:

- **Why did it move?** Read its headlines in `news.json`. If it is not on the list, or the
  move was large and the headlines do not explain it, look it up and name the source. A
  stock whose move you cannot explain is not called.
- **Is there bad news you cannot weigh?** A fraud claim, a lawsuit, a guidance cut, a
  chief executive leaving. Any of these: pass.
- **Earnings.** The engine checks the next five trading days. Check the date yourself in
  `calendar.json` or the headlines when it matters, and say when the company reports.
- **Does the chart agree with the numbers?** Look at the candles. A "breakout" that has
  already given back half its move, a "turn" on a day that closed near its low: pass.
- **What does the rule record say?** If a chart rule flagged the stock (`signals.json`)
  and `record.json` shows that rule doing worse than any day on this stock with 20 or more
  cases, count it against the call.
- **Crowded short.** `short.daysToCover` of five or more cuts both ways. It helps only
  after the stock has already turned up.

If the case against is as strong as the case for, pass. Each tempting candidate you pass
on goes in `passed`, with the reason in one or two plain sentences. This is where the
person learns the most.

## Step 6. Say how sure you are

| Conviction | When |
|---|---|
| 2, good | The verdict is `pays`, the market is not against you, the stock is stronger than the market, and your case against it found nothing |
| 1, worth a look | Everything else that survived: an unproven setup, a market against you, or a real doubt. Say what the doubt is |

## Step 7. Say what it rests on

`evidence` is two or three plain sentences:

- The setup's record from `setups.json`, for today's stance when `verdictFrom` is
  `stance`: how many finished calls, the average result in units of the risk taken, and
  the same for a call made for no reason (`any`). Always with the caution from step 3.
- Your own scorecard for this setup, when `score.bySetup` has finished calls.
- Anything you checked outside the files, with its source.

## Step 8. Check before you finish

After you write the file, run `node app/engine/refresh.mjs`, then
`node app/engine/check-calls.mjs`. It prints `OK` for each call or the problem in a plain
sentence. A call with a problem is fixed or removed, and the check is run again, until it
ends with "All in order."

## If the person asks how much to buy

You never name an amount. Give the rule traders use, and leave it to them: decide the most
you are willing to lose on one idea (many use 1% of the account or less), divide it by the
distance from your buy price to the stop, and that is the number of shares. A wider stop
means fewer shares, never a bigger loss.
