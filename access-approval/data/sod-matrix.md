# Segregation of Duties (SoD) Matrix

Conflicts that the Access Compliance Agent checks on every request.
If both the existing role and requested role appear in the same row, the request is a SoD conflict.

| Conflict ID | Role A (existing) | Role B (requested) | Risk | Policy |
|---|---|---|---|---|
| SOD-001 | NetSuite AP Processor | NetSuite Payment Approver | High | No one can both submit and approve payments |
| SOD-002 | GitHub Code Contributor | GitHub CI/CD Deployment Approver | Medium | Prevents self-approving deployments |
| SOD-003 | Workday Payroll Processor | Workday HR Data Editor | High | Prevents self-modifying pay records |
| SOD-004 | AWS Developer | AWS Production Admin | High | Limits blast radius of compromised developer accounts |
| SOD-005 | Okta User | Okta Admin | Critical | No end-user holds IdP admin rights |
| SOD-006 | NetSuite Purchasing | NetSuite Vendor Setup | Medium | Prevents fraudulent vendor creation |
| SOD-007 | Salesforce Opportunity Owner | Salesforce Contract Signer | Medium | Limits deal manipulation |
| SOD-008 | Looker Viewer | Looker Admin | Low | Data visibility control; escalate if business-justified |
