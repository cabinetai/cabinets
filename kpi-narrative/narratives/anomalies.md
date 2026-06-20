# Anomaly Log

Rolling log of metric anomalies detected by the daily scan. Append only — never delete entries.

| Date | Metric | Value | Delta | Severity | 30d Mean | Hypothesis |
|---|---|---|---|---|---|---|
| 2026-05-19 | expansion_mrr | $48,200 | +$9,100 WoW (+23.3%) | WARNING | $37,800 | Expansion spike — likely Acme Corp upsell ($8K MRR); confirm in fct_subscriptions |
| 2026-05-19 | new_signups | 1,847 | +235 WoW (+14.6%) | WARNING | 1,580 | Above 1σ — likely driven by Product Hunt launch May 18; check fct_signups UTM source |
| 2026-05-12 | activation_rate | 57.8% | +1.6pp WoW | INFO | 56.4% | Onboarding flow A/B test (variant B) rolled to 40% of new users May 10 |
| 2026-05-07 | churn_rate | 3.1% | +0.7pp WoW | WARNING | 2.5% | Above rolling mean; 2 enterprise non-renewals — confirm with CS team |
| 2026-05-07 | dau | 24,100 | −2,820 WoW (−10.5%) | WARNING | 27,920 | Holiday week (May 5 bank holiday EU); seasonality expected |
| 2026-05-01 | arr | $4,430,000 | flat | INFO | $4,580,000 | No new closes in final week of April; normal month-end pattern |
| 2026-04-29 | all clear | — | — | — | — | — |
| 2026-04-28 | all clear | — | — | — | — | — |
