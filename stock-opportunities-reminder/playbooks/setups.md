---
title: The rules
order: 3
---
# The rules

The chart rules the engine checks on every stock of the list at each refresh, for free.
A rule that fires is a reason for the Scout to look closer. It is never a reason to buy by
itself: the Scout judges it with [the method](method.md), and `app/data/record.json` shows
how each rule has done on this list. The last column describes a habit of traders. It is
not an instruction.

| Rule | Fires when | Leans | How traders use it |
|---|---|---|---|
| Breakout | The close is above the highest high of the last 20 days, on at least 1.5 times usual volume | Long | Buy the break or the first pullback to the old high. Stop under that level |
| Breakdown | The close is below the lowest low of the last 20 days, on at least 1.5 times usual volume | Short | Short the break or the first bounce to the old low. Stop above it |
| New 52-week high | The highest price in a year | Long | Strength tends to continue. Nobody above is waiting to sell at a loss |
| New 52-week low | The lowest price in a year | Short | Weakness tends to continue. Catching the bottom rarely pays |
| Gap | The open is 4% or more from yesterday's close | Either | The first 30 minutes decide. Holding the gap is strength, filling it is weakness |
| Unusual volume | Volume is at least twice the 20-day average | Either | Something changed. Look for the news |
| Big move | The day's move is at least twice the usual daily move | Either | Chasing it is late. The next day's pause is the usual entry |
| Golden cross | The 50-day average crosses above the 200-day | Long | A slow confirmation that the long trend turned up |
| Death cross | The 50-day average crosses below the 200-day | Short | A slow confirmation that the long trend turned down |
| Back above a moving average | The close crosses above the 20, 50 or 200-day average | Long | The trend on that time frame is back. The average becomes the stop level |
| Lost a moving average | The close crosses below the 20, 50 or 200-day average | Short | The trend on that time frame is in doubt |
| Oversold | RSI falls under 30 | Long | A bounce is common. In a real downtrend it stays oversold, so wait for a turn |
| Overbought | RSI rises over 70 | Short | A pause is common. Strong trends stay overbought, so do not short strength alone |
| Momentum turned up or down | MACD crosses its signal line | Either | An early sign, often wrong in sideways markets |
| Inside day | Today's high and low are inside yesterday's | Either | Wait for a break of yesterday's high or low |
| Squeeze | Bollinger band width is at its 120-day low | Either | Quiet ends in a sharp move. Trade the direction of the break |
| Bull flag | A run of 15% or more within 10 days, then 3 quiet days on lighter volume that give back less than half. Reported once, on the third quiet day | Long | Buy a close above the top of the flag. Stop under the flag |

The three rules too noisy to flag a chart with (momentum turned up or down, inside day) stay off,
but their record is still kept.
