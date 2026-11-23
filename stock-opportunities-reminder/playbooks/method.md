---
title: The method
order: 2
---
# The method

How the Stock Scout finds an opportunity. Follow the steps in order, every run. The aim is
not to find something every day. It is to be right about when there is something.

All numbers come from the files in `app/data/` (see [How it works](how-it-works.md)). A
term in `code` is a field in those files.

## Step 1. Read the market

A stock is carried by its market. Before any single chart, answer three questions from
`market.json`:

| Question | Where | Reading |
|---|---|---|
| Is the S&P 500 fund in an uptrend? | `quotes.SPY.facts` | Above its 50-day average, and the 50-day above the 200-day, is an uptrend. Under its 200-day is a downtrend |
| How nervous is it? | `quotes["^VIX"].price` | Under 18 calm. 18 to 25 uneasy. Over 25 frightened |
| Are stocks rising together? | every listed stock's `facts` | Count how many close above their 50-day average. Over 60% is broad strength. Under 40% is broad weakness |

Then name the stance:

- **`with-you`**: the fund is in an uptrend and the fear gauge is under 20. Up to three calls.
- **`mixed`**: the signs disagree. Up to two calls, none above conviction 2.
- **`against-you`**: the fund is under its 200-day average, or the fear gauge is over 25, or
  it fell more than twice its usual daily move (`atrPercent`) today on heavy volume. At
  most one call, at conviction 1, and only a stock that is plainly stronger than the
  market. Usually none. Saying "nothing today, the market is falling" is the most valuable
  call you make in a year.

Write the stance and two sentences on why, with the numbers.

## Step 2. Gather candidates

Look in three places, in this order:

1. **The person's list.** Every stock on it, whether or not a rule fired.
2. **What the rules flagged.** `signals.json`, the newest `day` only. A flag is a reason to
   look, never a reason to buy.
3. **The day's movers.** `movers.json`, the `gainers` and `active` rows that carry `facts`.
   These are stocks off the list that the whole market is trading today.

Leave out at once:

- Coins, futures, currencies and the index funds themselves. This is about stocks.
- Anything under 5 dollars or trading fewer than 500,000 shares on a usual day.
- Any stock with an open call of yours in `outcomes.json` (`waiting`, `in-zone` or `open`).
  You do not call the same stock twice.

## Step 3. Find one of the five setups

An opportunity is one of these five and nothing else. If a chart fits none, it is not an
opportunity today, however interesting it looks. For each candidate read its `facts` and
the last 60 rows of `candles/<SYMBOL>.1d.json`.

### 1. Pullback in an uptrend

The bread and butter. A strong stock rests, then goes on.

- `trend` is `up`: the price is above the 50-day average and that is above the 200-day.
- It made a high in the last 20 days, then fell back to its 20-day or 50-day average.
- The days of the fall had lighter volume than the days of the rise.
- `rsi` between 40 and 60. Under 40 the fall is more than a rest.
- **Buy zone:** from the average it is resting on, up to about half a usual daily move
  (`atr`) above it.
- **Wrong below:** the lowest low of the pullback, less a small margin. If that low is
  more than one and a half usual daily moves under the zone, the stop is too far: pass.
- **Aim for:** the high it fell from.

### 2. Breakout from a base

A stock goes quiet near its highs, then leaves.

- At least three weeks moving sideways in a range no wider than about 15%, within 10% of
  its 52-week high (`fromHigh`).
- Then a close above the top of the range on at least one and a half times usual volume
  (`rvol`). The `breakout` and `squeeze` rules point at these.
- **Buy zone:** from the top of the old range to half a usual daily move above it. A stock
  already more than one usual daily move above the range has left: name the zone it would
  have to come back to and mark it as waiting, or pass.
- **Wrong below:** the middle of the base. A breakout that falls back into the lower half
  of its base has failed.
- **Aim for:** the height of the base added to its top.

### 3. A leader holding up in a weak market

When the market falls, most stocks fall harder. The ones that refuse to are being bought.

- The market stance is `mixed` or `against-you`.
- Over the last 10 days the stock fell less than half of what the S&P 500 fund fell, or rose.
- It is still above its 50-day average.
- **Buy zone:** around the 50-day average or the low of the last week, whichever is nearer.
- **Wrong below:** a close under the 50-day average by more than half a usual daily move.
- **Aim for:** its 52-week high.
- Conviction 1 while the market is against you. These pay when the market turns, not before.

### 4. A gap up on results that holds

Good results reprice a company in one morning, and the move often continues for weeks.

- Within the last five days the stock opened at least 4% above the prior close on its
  earnings report (`gap` rule, with the report in `calendar.json` or the headlines), on at
  least twice usual volume.
- Since then it has not closed under the low of the gap day.
- **Buy zone:** the upper half of the gap day's range.
- **Wrong below:** the low of the gap day.
- **Aim for:** twice the distance from the zone to the stop, or the 52-week high if nearer.

### 5. A turn after a washout

The riskiest of the five. Use it rarely.

- `rsi` was under 30 within the last five days.
- Then one day that closed higher than it opened, above the previous day's high, on at
  least one and a half times usual volume. Without that day there is no setup: oversold
  alone is a falling knife, and the Oversold rule's own record usually shows no edge.
- Better when the price is still above its 200-day average.
- **Buy zone:** the upper half of the turn day's range.
- **Wrong below:** the low of the washout.
- **Aim for:** the 20-day average first. It is a bounce, not a new trend.
- Never above conviction 1.

## Step 4. Try to break it

For every candidate that fits a setup, look for the reason to pass. Any one of these is
enough:

- **Earnings inside the next five trading days** (`earnings` on the quote, or
  `calendar.json`). A stop does not protect against a gap. Pass, and say when it reports.
- **Stretched.** The price is more than two usual daily moves above its 20-day average.
  You would be buying where others are selling.
- **Poor pay.** From the top of the buy zone, the distance to the target is less than
  twice the distance to the stop.
- **A wide stop.** The stop has to sit more than 8% under the zone.
- **A ceiling just above.** The 200-day average or a recent high sits between the zone and
  the target, closer than the stop is far.
- **The record says no.** The rule that flagged it shows "worse than any day" for this
  stock in `record.json`, with 20 or more past cases.
- **Bad news you cannot weigh.** A fraud claim, a lawsuit, a guidance cut. Read the
  headlines in `news.json`; look the story up when the move is large and name the source.
- **Crowded short with no turn.** `short.daysToCover` of five or more cuts both ways. It
  is fuel only after the stock has already turned up.

Each candidate you pass on that someone might be tempted by goes in `passed` with the
reason in one or two plain sentences. This is where the person learns the most.

## Step 5. Build the numbers

- Every level is read off the candles: an average, a prior high, a prior low. Say which.
- The buy zone is never wider than one usual daily move.
- The stop is below the zone, the target above it.
- **Give the stop room.** It sits at least one usual daily move (`atr`) under the top of the
  buy zone. A stop nearer than that is hit by an ordinary day, and you lose on an idea that
  was right. If the level the chart gives is nearer, move the stop down to that distance,
  then check the pay again. If the pay no longer holds, pass.
- **The stop is a price, not a close.** The scorecard counts a call as stopped on the day
  the price touches it, so set it where a touch already means the idea failed.
- Round to a price a person would type: two decimals under 20 dollars, one under 100,
  whole dollars above.
- Check the pay once more with the final numbers: target minus the top of the zone,
  divided by the top of the zone minus the stop, is 2 or more.
- `horizon`: how long this kind of idea usually takes. Pullbacks and breakouts, 2 to 6
  weeks. Gaps on results, 1 to 4 weeks. Turns after a washout, a few days to 2 weeks.

## Step 6. Say how sure you are

| Conviction | When |
|---|---|
| 3, strong | The market is with you, the trend is up, volume agrees, the pay is 3 to 1 or better, and nothing in step 4 came close |
| 2, good | One of those is missing |
| 1, worth a look | A real idea with a real doubt. Say what the doubt is |

Never 3 when the market stance is not `with-you`. Never more than one call at 3 in a day.

## Step 7. Say what it rests on

`evidence` is one or two sentences on what backs the call:

- If a rule flagged it and `record.json` has that rule for this stock, quote it: how many
  times it fired, the average move 10 days later, and how that compares with any day.
  Under 20 cases, say the sample is small.
- If no rule flagged it, say so: this is a read of the trend, not a tested pattern.
- If your own scorecard has finished calls of this setup, say how they did.

## If the person asks how much to buy

You never name an amount. Give the rule traders use, and leave it to them: decide the most
you are willing to lose on one idea (many use 1% of the account or less), divide it by the
distance from your buy price to the stop, and that is the number of shares. A wider stop
means fewer shares, never a bigger loss.
