---
title: Security Questionnaire Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [security, grc, compliance, questionnaire, enterprise, cabinet]
order: 1
---
# Security Questionnaire Cabinet

Three agents — a Compliance Lead, a Writer, and a QA Reviewer — work through incoming customer and vendor security questionnaires using your policy library, SOC2 documentation, and a growing answer library of past responses. Every completed questionnaire is a file you can review, redline, and send.

> **Keep Vanta and Drata as your GRC and evidence systems of record. Replace the questionnaire spreadsheets, copy-paste marathons, Conveyor-lite subscriptions, and stale Google Docs answer banks around them.**

## Why this cabinet

Filling security questionnaires is the highest-friction bottleneck in enterprise deals. A 200-question VSQ from a Fortune 500 can stall a deal for weeks. The answer is almost always in your existing policies and SOC2 docs — the problem is finding it, formatting it, and keeping the library current. This cabinet makes every completed questionnaire a sourced, reviewed artifact, and every new answer a library entry for the next one.

Every artifact is a file: the completed questionnaire draft, the evidence links, the gap list, and the library entry are all written to disk so you can open, diff, forward, and audit them.

## The team

- **[[.agents/compliance-agent]]** — Compliance Lead. Orchestrates the questionnaire run, assigns questions to the policy library, flags gaps, and signs off the final draft.
- **[[.agents/writer]]** — Questionnaire Writer. Drafts answers from policies and past library entries, tailoring language to the customer's context.
- **[[.agents/qa-reviewer]]** — QA Reviewer. Cross-checks every answer against its cited evidence, catches overstatements, and marks items that need human review.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **On-demand** | [[.jobs/answer-questionnaire]] | Compliance Lead | Completed questionnaire draft in `/questionnaires/<name>/` |
| **Weekly** (Mon 08:00) | [[.jobs/library-freshness]] | Compliance Lead | Stale library entries flagged, updated answers committed to `/answer-library/` |

## How to run the demo

1. Open the [[questionnaire-workspace]] — the active questionnaire workspace: question list with answers, evidence links, confidence scores, and completeness %.
2. Browse `answer-library/library.md` — the reusable answer bank the Writer pulls from.
3. Check `questionnaires/acme-corp-vsq/` — a fully worked example questionnaire with gap flags and QA notes.

## Connectors

**Required:** Vanta (policy library, SOC2 controls), Drata (evidence links), Google Drive (incoming questionnaire docs, past completed questionnaires).
**Recommended:** Confluence/Notion (internal policy wiki), Slack (`#security` channel), email (questionnaire receipt + delivery).

**Vanta and Drata remain your official compliance evidence systems of record.** This cabinet reads from them to answer questions and produces the draft — it does not replace or duplicate the evidence store.
