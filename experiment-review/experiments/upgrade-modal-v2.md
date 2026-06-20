---
id: EXP-005
title: Freemium to Paid Upgrade Modal v2
slug: upgrade-modal-v2
status: shipped
hypothesis: A contextual upgrade modal triggered by feature gating (user tries a paid feature) will convert more trials to paid than a static persistent banner.
variants:
  control: Static persistent "Upgrade to Pro" banner (always visible)
  treatment: Contextual modal (appears when user tries to use a gated feature)
primary_metric: Trial-to-paid conversion rate (7-day window)
guardrail_metrics: [session_length, support_tickets, feature_engagement_rate]
target_n: 2000 per variant
start_date: '2026-04-28'
end_date: '2026-05-09'
analyst: growth-analyst
decision_owner: product-scientist
---

# Experiment Readout: Upgrade Modal v2

## Results

### Primary Metric

| | Control | Treatment | Lift | p-value | 95% CI |
|--|---------|-----------|------|---------|--------|
| Trial-to-paid conversion | 8.4% | 9.8% | +2.9% (+34.5% relative) | 0.018 | [+0.5%, +5.3%] |
| Sample size | N=2,148 | N=2,091 | | | |

### Guardrail Metrics

| Metric | Control | Treatment | Significant? | Flag? |
|--------|---------|-----------|-------------|-------|
| Session length (min) | 18.4 | 17.9 | No (p=0.31) | No |
| Support tickets (7d) | 0.12/user | 0.13/user | No (p=0.54) | No |
| Feature engagement rate | 61% | 63% | No (p=0.18) | No |

All guardrail metrics clear. No adverse movements.

### Segment Breakdown (pre-specified)

| Segment | Control CTR | Treatment CTR | Lift |
|---------|------------|--------------|------|
| Tenure <30 days | 6.1% | 8.8% | +2.7% |
| Tenure 30–90 days | 9.2% | 11.4% | +2.2% |
| Tenure 90+ days | 11.8% | 12.1% | +0.3% (not sig) |

Note: Effect concentrated in early-tenure users. High-tenure users convert via other pathways.

## Statistical Summary

- Experiment powered at 80% to detect 2.5pp lift. Achieved 2.9pp — just above MDE.
- p=0.018 (significant at α=0.05). CI [+0.5%, +5.3%] — meaningful lower bound.
- No guardrail violations.

## Decision

**Ship.** The contextual modal delivers +2.9pp conversion lift (significant, p=0.018) with no adverse guardrail movements. The CI lower bound of +0.5pp is small but positive — even the pessimistic case is better than control. Effect is concentrated in early-tenure users, which is the target segment for trial conversion. Static banner will be deprecated.

Decision owner: Product Scientist · 2026-05-12

## Learnings

1. **Context beats persistence for upgrade prompts.** A modal that appears exactly when a user hits a gated feature outperforms a persistent banner — the moment of friction is also the moment of highest conversion intent.
2. **Segment by tenure for conversion experiments.** The treatment had near-zero effect on users with 90+ day tenure — they convert through different pathways (champion-driven, CS-assisted). Tenure segmentation is now pre-specified on all conversion experiments.
3. **Iteration hypothesis:** Test the modal copy — current CTA is "Upgrade to Pro." Hypothesis: adding the specific feature the user tried ("Upgrade to unlock Role-based Permissions") increases conversion further. EXP-009 queued.
