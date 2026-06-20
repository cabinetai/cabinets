---
title: Clause Library Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [legal, clauses, playbook, negotiation, enterprise, cabinet]
order: 1
---
# Clause Library Cabinet

A living, searchable library of every approved contract clause — standard language, tiered fallback positions, when-to-use guidance, negotiation notes, and risk explanations. Legal ops maintains it; every team references it during contract review so negotiations start from approved positions, not a blank page.

> **Keep your CLM, Drive, and SharePoint. Replace the "legal playbook" Google Doc buried three folder levels deep, the email thread asking "what's our fallback on limitation of liability?", and the clause language that was negotiated once but never captured.**

> **Note:** Clause library content is maintained by legal ops for reference and negotiation guidance. All contract language must be reviewed and approved by qualified legal counsel before use in executed agreements. This cabinet does not constitute legal advice.

## The team

- **[[.agents/clause-researcher]]** — Clause Researcher. Lead orchestrator. Researches, drafts, and maintains approved clause language — standard positions, fallback tiers, risk ratings, and negotiation notes. Sweeps the CLM for new negotiated positions and updates the library accordingly.
- **[[.agents/clause-qa]]** — Clause QA. Reviews every new or updated clause entry for accuracy, completeness, internal consistency, and alignment with current legal policy before it is published to the library.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-clause-review]] | Clause Researcher | Clause library reviewed; stale entries flagged; newly negotiated positions captured |
| **On-demand** | [[.jobs/update-clause]] | Clause Researcher | Single clause updated with new language, fallback, or negotiation notes |

## How to run the demo

1. Open the [[library]] — the clause library UI showing clauses by category (Liability, IP, Data Privacy, Payment, Termination, SLA), with standard language, fallback tiers, when-to-use guidance, and risk notes. Full-text searchable.
2. Browse `clauses/` — the individual clause files maintained by the Researcher.
3. Open `clauses/limitation-of-liability.md` — a worked clause entry with standard language, two fallback tiers, risk rating, and negotiation notes.

## Connectors

**Required:** CLM system (Ironclad, ContractPodAi, or Agiloft — source of negotiated positions), Google Drive or SharePoint (historical contracts and redlines).
**Recommended:** DocuSign (executed agreements), Slack (clause lookup bot), internal wiki (policy cross-references).

**Keep your systems of record.** The CLM holds executed agreements and the negotiation workflow. This cabinet maintains the approved language library that feeds every new negotiation.
