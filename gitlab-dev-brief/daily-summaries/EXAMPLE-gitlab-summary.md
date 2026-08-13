---
headline: 3 of 6 things are waiting on you
lead: "checkout · MR — speeds up the receipt export"
verdict: Its pipeline is failing — nothing else on that branch can merge until it's green.
source: GitLab
generated: 2026-08-09 09:00
pending: true
status: ok
---

## Quick wins
- Re-run the failed pipeline on the receipt export MR — might just be a flake
- Review the payment webhook retry MR — it's the only one waiting on you

| Project | Kind | What | State | URL |
|---|---|---|---|---|
| checkout | MR | Speeds up the receipt export | Pipeline failed | https://gitlab.com/northwind/checkout/-/merge_requests/84 |
| checkout | MR | Adds a retry to the payment webhook | Needs review | https://gitlab.com/northwind/checkout/-/merge_requests/85 |
| website | Issue | Contact form drops long messages | Open | https://gitlab.com/northwind/website/-/issues/142 |
| billing | MR | Tidied up the invoice email | Waiting on them | https://gitlab.com/northwind/billing/-/merge_requests/31 |
| billing | MR | Renamed the VAT field | Merged | https://gitlab.com/northwind/billing/-/merge_requests/29 |
| website | Commit | Updated the pricing copy | Done | https://gitlab.com/northwind/website/-/commit/7e2b9f4 |
