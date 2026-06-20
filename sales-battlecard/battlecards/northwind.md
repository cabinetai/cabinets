# Northwind Battlecard

**last-refreshed:** 2026-06-19 (no new signals — Week 21 brief already applied 2026-06-12)  
**tier:** 1 · threat: Rising  

---

## How They Pitch
Northwind leads with price. Their standard intro: "Enterprise-grade at a price that doesn't require a board approval." They demo SSO on slide 3 and frame it as "security shouldn't be a premium add-on." In late-stage, they frequently offer an unpublished 15% trial extension to reset a stalled deal.

## Our Counter `[UPDATED — 2026-06-12]`
Northwind cut Pro 20% in May 2026 ($99 → $79) and moved SSO down to Pro. "We're the same price at Pro" is dead — do not say it. Don't fight on price — fight on total cost of ownership and isolation model. Northwind's Pro tier at $79/seat looks cheap until you add:
- EU data residency: not available on Pro, add-on at Enterprise.
- API rate limits: 5k req/min cap on Pro (we support 50k).
- Implementation time: their median enterprise go-live is 87 days (source: 3 Gong win/loss calls). Ours: 18 days.

Lead with: "What does 87 days of delayed go-live cost you in lost productivity? Let's build the TCO."

## Traps to Set
1. "Have you asked Northwind where EU data residency is available? Which tier?"
2. "What's their committed API rate limit in the contract — not the website?"
3. "When you talked to their references, what was the actual go-live time?"
4. "Their SSO at Pro tier — is that SAML or just social login?"
5. "What happens to your Pro-tier pricing when you add more than 250 seats?"

## Proof Points `[UPDATED — 2026-06-12]`
- Two mid-market food companies cited the 18-day go-live as their primary reason for choosing us in the last 30 days — both had Northwind or Helios in evaluation. (Deal-tested: Meridian Foods + Summit Foods, May 2026.)
- A 380-person logistics company moved from Northwind to us after a 90-day Northwind implementation. Our go-live: 16 days. (Deal-tested: Atlas Logistics, Q1 2026.)
- A 200-person healthcare company required EU data residency. Northwind couldn't deliver at the Pro tier — required an Enterprise uplift of 40%. (Deal-tested: Crestline Health, Q4 2025.) `[REVIEW NEEDED]` — last validated >90 days ago.
- TCO model: on a 3-year contract at 300 seats, our total cost (including implementation, API, and residency) runs 12% lower than Northwind Enterprise. (One-pager available in Drive.)

## Landmines to Avoid
- **Don't mock their price.** It's real. Respond with TCO — not "you get what you pay for."
- **Don't claim their AI features aren't real.** They shipped a basic version in May 2026 (waitlist). Say: "They shipped v0.1 — we've had this in production for 14 months."
- **Don't oversell our roadmap.** If a customer asks for a feature that's Q3, say Q3 — not "coming soon."

## Pricing Delta `[UPDATED — 2026-06-12]`
| Tier | Northwind | Us | Delta |
|---|---|---|---|
| Pro | $79/seat/mo | $99/seat/mo | −20% |
| Enterprise | Custom (~$120) | Custom (~$115) | +4% |
| EU Residency | Enterprise only | All tiers | — |
| SSO | Pro tier | Enterprise | Northwind advantage at Pro |

*Note: Northwind cut Pro from $99 to $79 in May 2026. This will appear in mid-market renewals.*

## Recommended Collateral
- TCO Calculator one-pager (Drive: Sales / Competitive / TCO vs Northwind)
- Northwind vs. Us — Implementation Time one-pager
- EU Data Residency architecture brief (for technical evaluators)
- Reference: Atlas Logistics (logistics, 380 seats, go-live 16 days)
