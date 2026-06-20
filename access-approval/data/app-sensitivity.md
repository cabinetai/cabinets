# App Sensitivity Registry

Used by the Access Compliance Agent for regulatory flag checks.

| App | Sensitivity | Regulatory Tag | Notes |
|---|---|---|---|
| Workday | High | HRIS, PII | Contains all employee personal data |
| NetSuite | High | SOX, Financial | Revenue and financial records |
| Salesforce | Medium | PII, CRM | Customer contact data |
| GitHub (org admin) | High | IP, Security | Source code and infrastructure |
| AWS root/admin | Critical | Security, SOX | Full infrastructure access |
| GCP prod-analytics | High | PII, Financial | Customer analytics with PII |
| Okta Admin | Critical | Security, SOX | Identity provider admin |
| Jira | Low | — | Project tracking only |
| Slack | Low | — | Internal communications |
| Notion | Low | — | Documentation |
| Looker | Medium | Financial | BI with financial dashboards |
| HubSpot | Medium | PII, CRM | Marketing contacts |
| Figma | Low | — | Design files |
| 1Password (admin) | Critical | Security | Credential vault admin |
