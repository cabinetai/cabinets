# Cluster: API — Rate Limit Errors

**Slug:** api-rate-limit-errors
**Updated:** 2026-05-23
**Volume:** 64 (7d) | 118 (30d)
**Trend:** ↑ +52% vs prior 7d (SPIKE — see emerging flag)
**Sentiment:** Negative — dominant emotion: urgency / frustration

## Summary
Customers hitting API rate limits are receiving inconsistent error responses. The documented behaviour is a 429 status code with a Retry-After header. At least 60% of tickets this week report receiving a 500 error instead, breaking their retry logic. Several enterprise customers have automated workflows that halted as a result.

## Representative customer quotes
1. "Your docs say I'll get a 429 when I'm rate limited but I'm getting a 500. My retry logic doesn't know what to do with a 500."
2. "Our nightly sync failed three times this week with a 500 error. We thought it was our infrastructure. Now I see it's your rate limiter returning the wrong code."
3. "We're on the Enterprise plan — I thought we had higher limits. Why are we hitting the ceiling at all? What is the actual limit for our tier?"

## Ticket IDs (most recent 10)
ZD-84801, ZD-84789, ZD-84776, ZD-84762, ZD-84748, ZD-84735, ZD-84719, ZD-84703, ZD-84688, ZD-84672

## Escalation flag
Volume spike of 52% in 48h. 500-instead-of-429 behaviour is likely a product bug. Recommend escalation to engineering. See `/clusters/emerging/api-rate-limit-errors-2026-05-23.md`.
