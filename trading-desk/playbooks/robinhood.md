---
title: Robinhood
order: 5
---
# Robinhood

Read this before you use a Robinhood tool. It applies to every assistant and every routine.

The person connects Robinhood in Cabinet (Settings, then Connections). You never see a
password or a key, and you never ask for one. When it is connected you have tools whose
names start with `mcp__cabinet-robinhood__`. If you have none, Robinhood is not connected:
say so in one line and do the rest of the ask without it.

Each tool describes its own arguments. Read that description before the first call, and
never guess an account number, an order id or an instrument id: ask a tool for it.

## What it is for

| The person wants | You use | You write |
|---|---|---|
| Their account on the desk | `get_accounts`, `get_portfolio`, `get_equity_positions`, `get_option_positions`, `get_crypto_positions`, `get_equity_orders` | `account/robinhood.json` |
| The journal to fill itself | `get_pnl_trade_history`, `get_equity_orders` | `journal/trades.json` |
| The whole market scanned | `get_scans`, `run_scan`, `create_scan`, `get_equity_quotes`, `get_equity_news` | `account/scan.json` |
| A check on what they hold | `get_earnings_calendar`, `get_equity_news`, `get_equity_analyst_ratings`, `get_equity_fundamentals` | `account/attention.json` |
| An alert on their phone | `get_alerts`, `create_alert`, `update_alert`, `delete_alert` | `account/alerts.json` |
| Their month in money | `get_realized_pnl`, `get_pnl_trade_history`, `get_equity_tax_lots` | `account/YYYY-MM-money.md` |
| An order placed | `review_equity_order`, then `place_equity_order` | nothing: the next sync reads it back |

`desk/DATA.md` gives each of these files field by field. Files starting with `EXAMPLE-`
are examples the desk shows before the person connects. Never copy from them and never
edit them.

## Numbers

Every number you write comes from a tool's answer in this run. If a tool fails, leave the
field out and add one line to the file's `problems` list saying what is missing. Never
carry a number over from an older file, and never work a price out yourself.

## Reading is free. Changing is not.

Reading the account, running a scan and writing the desk's own files need no permission:
the person asked for them when they connected.

These change something at Robinhood, so each has its own rule:

- **A phone alert** (`create_alert`, `update_alert`, `delete_alert`). Allowed in the
  `set-price-alerts` routine and whenever the person asks. Only touch alerts whose id is
  in `account/alerts.json`: those are the ones this desk made. An alert the person made in
  the Robinhood app is theirs. Leave it.
- **A saved scan or a watchlist** (`create_scan`, `create_watchlist`, `add_to_watchlist`).
  Only when the person asks for it by name.
- **An order.** See the next part.
- **Money in or out** (the banking tools). Never. If the person asks, tell them to do it in
  the Robinhood app.

## Placing an order

Robinhood lets an assistant trade in one account only, the one it calls the Agentic
account, which the person funds on purpose. Everything else is read only. Inside that
account these rules still hold, every time:

1. **Only when the person asks, in this conversation, for this order.** Never from a
   routine, never because a plan's entry price was reached, never because an earlier
   conversation said so.
2. **Check it against the person's limits, in code.** Run
   `node desk/engine/check-order.mjs --sym <SYMBOL> --side <long|short> --qty <n> --entry <price> --stop <price>`
   (add `--target <price>` when the plan has one). If it prints a `STOP:` line, give the
   person each one word for word and stop there: do not review or place the order. The
   person changes the plan on the desk, or their own limits in the desk's settings, and you
   check again. Read out every `NOTE:` line with the review.
3. **Review first.** Call `review_equity_order` and show what comes back in a short table:
   the symbol, buy or sell, how many, the order type, the price, what it costs, and the
   account. Add the plan's stop and what the trade loses if the stop is hit.
4. **Wait for a clear yes.** "Yes", "place it", "go". Anything else is a no. A changed
   number means a new review.
5. **Never bigger than the plan.** If the buying power does not cover the plan's size, say
   so and stop. Do not shrink the order quietly.
6. **A plan to short cannot be sent.** Robinhood's assistants buy and sell shares the
   person owns, single options and crypto. Say that in one line.
7. **Offer the stop, do not assume it.** After a buy fills, offer a stop order for the same
   quantity at the plan's stop. It is a second order with its own review and its own yes.
8. **One try.** If Robinhood refuses the order, give its reason word for word and stop.
9. **Say what happened.** The order's state and id, in one line. Tell the person that the
   desk shows it after the next sync, or run `sync-robinhood` if they ask.

You are not a financial adviser. Placing an order the person asked for is not advice, and
you never suggest one.

## Robinhood's own limits

- US accounts only.
- Robinhood decides which apps may connect. If the sign-in is refused, say that Robinhood
  refused it and that the person can ask Robinhood's support to allow Cabinet.
- Quotes outside market hours are the last trade. Say when a price is from the close.
