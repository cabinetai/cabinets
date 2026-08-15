// Competitor tracking data — one entry per rostered competitor.
// Each scan appends to `snapshots`; `current` mirrors the latest snapshot.
const competitors = {
  gumloop: {
    name: "Gumloop",
    website: "https://www.gumloop.com",
    changelog: "https://www.gumloop.com/changelog", // discovered 2026-07-06; primary diff anchor
    pricing: {
      model: "credits",
      tiers: [
        { name: "Free", price: 0, credits: 5000, notes: "1 seat, 1 active trigger, 2 concurrent runs" },
        { name: "Pro", price: 37, credits: 20000, notes: "from $37/mo, usage-selected credit volume, unlimited seats, BYO API keys" },
        { name: "Enterprise", price: null, credits: null, notes: "custom; RBAC, SCIM/SAML, audit logs, VPC" },
      ],
    },
    social: {
      x: "https://twitter.com/gumloop",
      linkedin: "https://www.linkedin.com/company/gumloop",
      youtube: "https://www.youtube.com/@Gumloop_AI",
      forum: "https://forum.gumloop.com/",
    },
    current: {
      scanned: "2026-07-06",
      positioning: "Build AI agents for work — model-flexible agent platform for enterprise/mid-market workflow automation (GTM, marketing, support, recruiting)",
      funding: {
        totalDisclosed: "$70M+ (seed + $17M Series A Jan 2025 + $50M Series B Mar 2026)",
        lastRound: { type: "Series B", amount: "$50M", date: "2026-03-12", lead: "Benchmark" },
        valuation: null, // not disclosed
      },
    },
    snapshots: [
      {
        date: "2026-07-04",
        type: "baseline",
        report: "../competitors/gumloop/2026-07-04.md",
        notes: "First scan. Credit-per-action rates and Pro price ladder not public; valuation undisclosed; no follower counts collected.",
      },
      {
        date: "2026-07-06",
        type: "sweep",
        report: "../signals/log.md",
        notes: "Changelog discovered (10.6.0, bi-weekly train). MATERIAL candidate: AI steps flat-credit → token-based billing (10.2.0–10.6.0); pricing page unchanged. Careers 0 visible roles; G2 403-blocked.",
      },
    ],
  },
};
