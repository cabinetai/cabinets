---
name: local-campaign-strategy
description: Turn a scored local marketing opportunity into a campaign brief (goal, audience, exact offer, big idea, posting plan, guardrails, KPIs) saved as campaigns/<slug>/index.md, ready for the content creator. Use when the user or the Marketing Lead picks an opportunity to run.
---

# Local campaign strategy

Turn one opportunity into a brief that a content creator can execute without asking questions, and a human can approve in two minutes.

## Inputs
- The opportunity file in `/opportunities/` and its event in `/events/`.
- The chosen promotion in `/promotions.md` (use the top `matched_promotions` entry unless told otherwise).
- `/business.md` (goals and "what we will not do"), `/locations.md`, `/audience.md`, `/brand.md`, `/learnings.md`.
- `/campaigns/index.md` for folder and frontmatter conventions.

## Method
1. **Slug.** `<promotion-id>` or `<promotion-id>-<moment>` if that promotion has run before, in kebab-case. Create `/campaigns/<slug>/`.
2. **Goal.** One measurable target tied to the promotion's constraints (for example: sell out the cap, or N units in the daypart). Use `/learnings.md` to set a realistic number.
3. **Audience.** Exactly one primary segment from `/audience.md`, optionally one secondary.
4. **Offer.** Copy the promotion's `offer` verbatim, then restate the constraints that customers need to know (cutoffs, pickup only, limits).
5. **Big idea.** One line in quotes that connects the moment, the place and the food. It should work without naming any team, festival or venue brand.
6. **Posting plan.** A table of when, format, deliverable link and purpose, working back from the event:
   - Reel 2 to 3 days before for reach.
   - Feed post or carousel 1 to 2 days before for saves and shares.
   - Stories the evening before and on the day for conversion, with link, countdown or location stickers.
   - Same-night offers lean on Stories; group pre-orders lean on Reel + carousel.
   Post at the audience's engagement peaks listed in `/audience.md`.
7. **Guardrails.** Trademark and partnership limits, unverified facts that need placeholders, caps and what to do when they are hit, any cultural sensitivity.
8. **Dependencies and approvals.** A checklist: facts to verify, staffing, assets to shoot, human sign-off.
9. **Results section.** An empty line of KPIs to fill in after the campaign.
10. **Link back.** Set the opportunity's `status: campaign` and `campaign: <slug>`.

## Brief template
```markdown
---
title: <Promotion name>, <moment>
status: draft
location: <location-id>
opportunity: <opportunity file name without .md>
promotion: <promotion-id>
segment: <segment-id>
launch: '<YYYY-MM-DD>'
end: '<YYYY-MM-DD>'
channels: [instagram-feed, instagram-reels, instagram-stories]
deliverables: [feed-post, reel, stories, captions]
kpis: [<metric>, <metric>]
owner: marketing-lead
---
# <title>

## Goal
## Audience
## Offer (exactly as in the promotion library)
## Big idea
## Key message
## Posting plan
## Guardrails
## Dependencies
## Approvals
## Results (fill in after)
```

## Rules
- A brief never introduces a price, discount or product that is not in `/menu.md` or `/promotions.md`.
- Mark unverified event facts at the top in italics: "*... are illustrative/unverified. Verify before posting.*"
- Nothing is published automatically. The brief ends at `status: draft` (or `ready-for-review` once deliverables exist).
