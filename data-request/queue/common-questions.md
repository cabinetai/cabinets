# Common Questions — Deflection Library

Questions that have been asked ≥2 times. Check here before routing to an analyst.

---

## What is our current MRR / ARR?

**Answer:** See the KPI Narrative Dashboard (`dashboard/index.html` in the `kpi-narrative` cabinet) — MRR and ARR tiles are updated weekly from `fct_subscriptions`. For real-time values, query:
```sql
SELECT SUM(mrr_amount) AS mrr, SUM(mrr_amount * 12) AS arr
FROM fct_subscriptions
WHERE subscription_status = 'active' AND contract_type = 'recurring';
```
**Self-serve:** Looker → Finance → ARR / MRR explore.

---

## What is our churn rate this month?

**Answer:** See the KPI Narrative Dashboard (Retention tab) or the Metrics Definition Cabinet for the certified formula. To query directly:
```sql
SELECT
  (SUM(churned_mrr) + SUM(contraction_mrr)) / SUM(mrr_at_period_start) AS churn_rate
FROM fct_churn_monthly
WHERE period_month = DATE_TRUNC('month', CURRENT_DATE());
```
**Self-serve:** Looker → Retention → Churn Rate explore.

---

## How many DAUs did we have [date]?

**Answer:** Query `fct_daily_active`:
```sql
SELECT event_date, COUNT(DISTINCT user_id) AS dau
FROM fct_daily_active
WHERE event_date = '<date>' AND is_internal = false
GROUP BY 1;
```
**Self-serve:** Metabase → Engagement → DAU chart (pick date range).

---

## Which accounts churned in [month]?

**Answer:** Query `fct_churn_monthly` joined to `dim_accounts`:
```sql
SELECT a.account_name, a.csm_owner, c.churned_mrr, c.churn_reason
FROM fct_churn_monthly c
JOIN dim_accounts a ON c.account_id = a.account_id
WHERE DATE_TRUNC('month', c.churn_date) = '<month>';
```
**Self-serve:** Looker → Retention → Churned Accounts.

---

## What is our NRR?

**Answer:** See the KPI Narrative Dashboard (Retention tile) for the current value. Certified definition in the Metrics Definition Cabinet (`../metrics-definition/glossary/metrics/nrr.yaml`). For the trailing 12-month value:
```sql
SELECT nrr_trailing_12m FROM fct_nrr_cohort
WHERE snapshot_date = (SELECT MAX(snapshot_date) FROM fct_nrr_cohort);
```
**Last asked:** 2026-05-20 (DR-2026-0046 family)
