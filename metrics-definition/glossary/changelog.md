# Metrics Glossary Changelog

All definition changes, certifications, and deprecations. Append only.

---

## 2026-05-19 — Weekly Review (W21)

All 6 certified metrics reviewed. All passed freshness and formula checks. No owner changes detected. No re-review flags. Source: `glossary/review-2026-W21.md`.

---

## 2026-04-15 — Certification: `dau`

Certified by: Definition QA
Notes: Added workspace-level vs account-level distinction; `dau_account` alias documented. Formula verified against `fct_daily_active` WHERE clause.

---

## 2026-04-01 — Certification: `activation-rate`

Certified by: Definition QA
Notes: QA returned once — initial draft did not specify the 7-day window explicitly. Researcher updated formula and noted the growth-team variant (14-day window) as a separate slug. Approved on second pass.

---

## 2026-03-10 — Initial certification: `arr`, `mrr`, `nrr`, `churn-rate`

Certified by: Definition QA
Notes: Batch certification for the four core revenue/retention metrics. All four verified against `fct_subscriptions` and `fct_churn_monthly` dbt models. FX edge case added to ARR definition post-review.
