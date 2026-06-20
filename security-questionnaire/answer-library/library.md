# Security Questionnaire Answer Library

Each entry is a reusable answer, tagged by domain and framework. Confidence level: High = direct policy match. Last-verified = date the answer was last checked against its source.

---

## entry: encryption-at-rest
**Domain:** Encryption  **Framework:** SOC2 CC6.7 / ISO 27001 A.10.1  **Confidence:** High  **Last-verified:** 2026-05-01

**Question pattern:** "Does your organisation encrypt data at rest?"

**Answer:**
Yes. All customer data stored in our production environment is encrypted at rest using AES-256. This applies to primary databases (Amazon RDS with encryption enabled), object storage (S3 with SSE-S3), and backup volumes. Encryption key management is handled via AWS Key Management Service (KMS) with key rotation enabled on a 12-month cycle.

**Source:** Information Security Policy v3.1, §7.2 — Data Encryption at Rest; Control CC6.7 (SOC2 Type II, period ended Dec 31 2025)

---

## entry: encryption-in-transit
**Domain:** Encryption  **Framework:** SOC2 CC6.7 / ISO 27001 A.10.1  **Confidence:** High  **Last-verified:** 2026-05-01

**Question pattern:** "Is data encrypted in transit?"

**Answer:**
Yes. All data in transit between clients and our services is encrypted using TLS 1.2 or higher. TLS 1.0 and 1.1 are explicitly disabled across all customer-facing endpoints. Internal service-to-service communication within our VPC uses TLS 1.2+ for sensitive data paths and VPC security groups for all other traffic.

**Source:** Network Security Policy v2.4, §5.1; Control CC6.7 (SOC2 Type II, period ended Dec 31 2025)

---

## entry: access-control-mfa
**Domain:** Access Control  **Framework:** SOC2 CC6.1 / ISO 27001 A.9.4  **Confidence:** High  **Last-verified:** 2026-04-15

**Question pattern:** "Do you enforce multi-factor authentication for access to production systems?"

**Answer:**
Yes. Multi-factor authentication (MFA) is enforced for all employee access to production systems, cloud infrastructure (AWS console and CLI), the code repository (GitHub), and the identity provider (Okta). MFA is enforced via Okta policy; users cannot bypass it. Customer-facing MFA is available as an opt-in feature on all paid plans and is mandatory for Enterprise plan customers.

**Source:** Access Control Policy v2.1, §4.3; Control CC6.1 (SOC2 Type II, period ended Dec 31 2025)

---

## entry: incident-response-plan
**Domain:** Incident Response  **Framework:** SOC2 CC7.3 / ISO 27001 A.16.1  **Confidence:** High  **Last-verified:** 2026-03-20

**Question pattern:** "Do you have a documented incident response plan? What is your notification timeline?"

**Answer:**
Yes. We maintain a documented Incident Response Plan (IRP) that is reviewed annually and after any significant incident. The plan covers detection, triage, containment, eradication, recovery, and post-incident review. For security incidents affecting customer data: we commit to notifying affected customers within 72 hours of confirming a breach, consistent with GDPR Art. 33/34 requirements. Our security team is on-call 24/7 via PagerDuty. The IRP was last updated in March 2026.

**Source:** Incident Response Plan v4.0, §2 and §6; Control CC7.3 (SOC2 Type II, period ended Dec 31 2025)

---

## entry: vendor-management-soc2
**Domain:** Vendor Management  **Framework:** SOC2 CC9.2 / ISO 27001 A.15.2  **Confidence:** High  **Last-verified:** 2026-04-01

**Question pattern:** "How do you assess the security posture of your sub-processors and third-party vendors?"

**Answer:**
All vendors that process customer data or have access to production systems undergo a formal security review prior to engagement, and annually thereafter. Our review process requires: (1) a current SOC2 Type II report or ISO 27001 certificate from Tier 1 vendors, (2) a completed security questionnaire for Tier 2 vendors, and (3) a signed Data Processing Agreement (DPA) for any vendor processing personal data. The vendor register and review status are maintained in our GRC platform (Vanta). A list of sub-processors is available on our Trust page.

**Source:** Vendor Management Policy v2.0, §3; Control CC9.2 (SOC2 Type II, period ended Dec 31 2025)

---

## entry: penetration-testing
**Domain:** Vulnerability Management  **Framework:** SOC2 CC7.1 / ISO 27001 A.12.6  **Confidence:** High  **Last-verified:** 2026-05-01

**Question pattern:** "Do you conduct penetration testing? How often?"

**Answer:**
Yes. We conduct annual third-party penetration tests of our production environment, performed by an independent security firm. The most recent test was completed in Q1 2026. Additionally, we run continuous automated vulnerability scanning via our cloud security tooling. Critical and high vulnerabilities have a remediation SLA of 14 days; medium vulnerabilities are remediated within 60 days. Penetration test executive summaries are available to customers under NDA.

**Source:** Vulnerability Management Policy v1.3, §5; Control CC7.1 (SOC2 Type II, period ended Dec 31 2025)
