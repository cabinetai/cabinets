---
title: Brand Cabinet
created: '2026-05-23T00:00:00Z'
modified: '2026-05-23T00:00:00Z'
tags: [marketing, brand, design, messaging, assets, enterprise, cabinet]
order: 1
---
# Brand Cabinet

One source of truth for everything brand: logos, colors, typography, messaging pillars, approved copy blocks, and do/don't guidelines. The Brand Researcher maintains the asset inventory and messaging library; the Brand QA agent runs weekly audits to catch inconsistencies before they ship.

> **Keep Figma, Drive, and your design system. Replace the "which logo is current?" thread, the brand guide PDF from two rebrandings ago, and the off-brand copy that ships because nobody checked the source.**

## The team

- **[[.agents/brand-researcher]]** — Brand Researcher. Lead orchestrator. Maintains the brand asset inventory, messaging library, and approved copy blocks. Flags new assets for review and sequences QA.
- **[[.agents/brand-qa]]** — Brand QA. Runs the weekly asset-audit and monthly messaging consistency check. Reviews copy submissions against brand guidelines. Doesn't create — validates.

## Recurring rhythm

| Cadence | Job | Owner | Output |
|---|---|---|---|
| **Weekly** (Mon 08:00) | [[.jobs/weekly-brand-asset-review]] | Brand Researcher | Asset review log in `reviews/weekly-<date>.md` |
| **Monthly** (1st 09:00) | [[.jobs/monthly-messaging-audit]] | Brand QA | Messaging consistency report in `audits/messaging-<date>.md` |

## How to run the demo

1. Open [[brand-hub]] — the brand hub: logo variants, color palette swatches with hex, typography scale, messaging pillars, do/don't examples, and approved boilerplate copy with copy-to-clipboard.
2. Browse `assets/` — the asset inventory: each asset as a file with metadata (type, format, approved use cases, Figma link).
3. Review `messaging/pillars.md` — the 3 messaging pillars every piece of copy should map to.
4. Check `audits/` — monthly messaging consistency reports.

## Connectors

**Required:** Figma (design files, component library), Google Drive (exported assets, presentations).
**Recommended:** Notion or Confluence (brand guide embedding), website CMS (approved copy blocks), Canva Brand Kit, Bynder or Brandfolder (asset DAM).
