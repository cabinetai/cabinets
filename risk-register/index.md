---
title: Risk Register Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [security, grc, risk, risk-register, enterprise, cabinet]
order: 1
---
# Risk Register Cabinet

Two agents — a Risk Lead and an Analyst — maintain the company risk register: tracking risks by category, likelihood, impact, owner, mitigation status, and review due date. Every review cycle produces a written risk report and a refreshed heatmap.

> **Keep your GRC platform as the system of record. Replace the Notion risk pages nobody updates, the spreadsheets that drift from reality, and the quarterly "let's re-score everything" fire drill.**

## Why this cabinet

Risk registers fail for one reason: they're nobody's job. The GRC platform has the controls, but the risk narrative — what we actually fear, what we're doing about it, and who owns it — lives in a spreadsheet that's six months stale. This cabinet makes risk review a standing operation: agents sweep open risks weekly, escalate overdue reviews, and produce the monthly risk report the board actually reads.

Every artifact is a file: the risk register, review notes, mitigation updates, and the monthly report are all written to disk so you can open, version-control, and audit them.

## The team

- **[[.agents/risk-agent]]** — Risk Lead. Orchestrates the register, assigns risk owners, scores likelihood × impact, escalates overdue items, and publishes the monthly risk report.
- **[[.agents/analyst]]** — Risk Analyst. Researches new risk signals (incidents, vendor changes, regulatory updates, security advisories), drafts mitigation options, and tracks remediation progress.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-risk-review]] | Risk Lead | Overdue reviews flagged, status updates committed to `/risks/`, owner notifications drafted |
| **Monthly** (1st 09:00) | [[.jobs/monthly-risk-report]] | Risk Lead | Full risk report in `/reports/YYYY-MM-risk-report.md`, heatmap refreshed in the dashboard |

## How to run the demo

1. Open the [[risk-dashboard]] — the risk register table (title, category, likelihood × impact score, RAG status, owner, mitigation status, review due) plus the likelihood × impact heatmap matrix.
2. Browse `risks/` — individual risk files with full history and mitigation notes.
3. Check `reports/2026-05-risk-report.md` — a worked example monthly risk report.

## Connectors

**Required:** Security documentation and policies (Confluence, Notion, Google Drive), incident log / postmortems, compliance tools (Vanta, Drata).
**Recommended:** CVE feeds / security advisories, vendor contracts (legal vault), HRIS (key-person risk), cloud infrastructure docs, Jira/Linear (remediation tickets).
