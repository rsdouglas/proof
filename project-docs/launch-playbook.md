# Vouch Launch Playbook — Waitlist → Beta → General Availability

**Last updated:** 2026-03-04  
**Status:** Pre-launch. Waiting on: DNS (#90), Stripe secrets (#83), Resend (#94), PR #84 merge.

---

## Phase 0 — Before anything: prerequisites checklist

These must be done by @rsdouglas. Nothing else can proceed without them.

| # | Task | Issue | Status |
|---|---|---|---|
| 1 | Merge PR #84 (waitlist landing page) | PR #84 | ⏳ ready to merge |
| 2 | Point socialproof.dev DNS → Cloudflare Pages | #90 | ⏳ needs @rsdouglas |
| 3 | Run `wrangler secret put JWT_SECRET` | #83 | ⏳ needs @rsdouglas |
| 4 | Run `wrangler secret put STRIPE_SECRET_KEY` | #83 | ⏳ needs @rsdouglas |
| 5 | Run `wrangler secret put STRIPE_WEBHOOK_SECRET` | #83 | ⏳ needs @rsdouglas |
| 6 | Set up Resend, add DNS records, run `wrangler secret put RESEND_API_KEY` | #94 | ⏳ needs @rsdouglas |

---

## Phase 1 — Waitlist live (T+0 after Phase 0 complete)

**Goal:** Get the landing page live and start capturing emails. No payments yet.

### Verify landing page works (5 min)
- [ ] Visit https://socialproof.dev — page loads, looks right
- [ ] Fill out waitlist form → see success message
- [ ] Check `GET https://socialproof.dev/api/waitlist/count` returns a number
- [ ] Check no console errors

### First 24h: seed the waitlist
Marketing bot executes outreach scripts in `project-docs/beta-outreach-scripts.md`, in this order:

1. **Indie Hackers** — Script 2 (build-in-public angle). Link to socialproof.dev.
2. **r/SideProject** — Script 3. Lead with the problem, not the product.
3. **Product Hunt Ship** — Start the Ship page (issue #92). Builds notification list before full launch.
4. **Hold** — Twitter thread until IH post is live to link back to.

**Target:** 50 waitlist signups before moving to Phase 2.

---

## Phase 2 — Stripe live (payment gates on)

**Trigger:** @rsdouglas confirms Stripe secrets are in place (#83 closed).

### Before opening signups
- [ ] Dev merges #101 (plan gates — Free vs Pro limits)
- [ ] Dev merges #91 (replace "Join Pro waitlist" CTA with real Stripe checkout)
- [ ] Test full payment flow: signup → free → upgrade to Pro → webhook fires → plan updates
- [ ] Test that Free tier limits work: 11th testimonial blocked, 2nd widget blocked
- [ ] Test that Pro removes branding badge from widget

### Open signups
- Update landing page: "Join waitlist" → "Start for free" (remove the waitlist gate, or keep it and invite waitlist first)
- Email waitlist: "You're in — claim your spot" (Resend onboarding sequence fires automatically once #94/#88 done)

**Waitlist invite sequence:**
1. Email all existing waitlist signups: "Vouch is live — here's your link"
2. Offer first 20 users: 3 months Pro free (mentioned in beta-offer.md)
3. Post on IH: "We're live — waitlist is open"

---

## Phase 3 — Beta closed (first 10 paying users)

**Goal:** 10 paying customers. Validate retention, not just signups.

### Active onboarding (do this personally, @rsdouglas)
For each of the first 10 paying users:
- Send a personal DM/email: "I saw you just signed up — can I hop on a 15-min call to make sure you get value from day one?"
- Walk them through: create account → send collection link to 3 customers → embed widget
- Ask at end: "What would make you cancel?" and "What's missing?"

### What to watch
- Activation rate: did they create a widget + embed it within 48h?
- Collection rate: did they send the form to at least one customer?
- Week 1 retention: still logged in after 7 days?

### Signals for Phase 4
- 10+ paying users → open to all
- NPS > 50 → start marketing push
- No churn in first 30 days → write the case study

---

## Phase 4 — General availability

**Trigger:** 10+ paying users, product stable, no critical bugs open.

### Distribution ramp
1. **Shopify App Store** (issue #27) — file the listing. Biggest channel by far.
2. **Twitter thread** — "I built X, here's how" thread with real metrics (MRR, users, testimonials collected)
3. **Content SEO** — 5 blog posts ready to publish (PRs #61/#76). Enable the blog route (issue #62).
4. **Product Hunt** — full launch (not just Ship). Coordinate with proof-marketing.

### Pricing review
At 50 paying customers, reconsider:
- Is $9/mo converting? Check free → paid conversion rate.
- Should Business tier ($29/mo) launch now? (unlimited widgets, analytics export, custom domain)
- Is annual pricing worth adding? ($90/yr = 2 months free)

---

## Emergency contacts

| Situation | Who | How |
|---|---|---|
| Site is down | @rsdouglas | GitHub issue with `[URGENT]` prefix |
| Payment failed | @rsdouglas | Check Stripe dashboard → webhook logs |
| User data issue | @rsdouglas | D1 console in Cloudflare dashboard |
| Bad press / angry user | @rsdouglas | Respond personally, fast. Offer refund immediately. |

---

## Key metrics dashboard (check weekly)

| Metric | Target (Month 1) | Target (Month 3) |
|---|---|---|
| Waitlist signups | 200 | — |
| Free users | 50 | 300 |
| Paying users | 10 | 55 |
| MRR | $90 | $500 |
| Free → Pro conversion | >5% | >8% |
| 30-day retention (Pro) | >80% | >85% |
| Widget impressions/day | 1,000 | 10,000 |
