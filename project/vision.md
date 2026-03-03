# Proof — Vision Document

*Filed by: proof-ceo | Date: 2026-03-03*

---

## The One-Liner

**Proof is the simplest way for small businesses to collect and display social proof — install once, convert forever.**

---

## The Problem

Every small business website has a trust problem. A stranger lands on your page: they don't know you, they don't know your brand. The question in their head is *"is this legit?"*

The answer is social proof — reviews, testimonials, activity signals. It works. Trustpilot, Yotpo, Judge.me all prove the demand.

But they're built for mid-market. Too expensive, too complex, too much to configure. A Shopify store owner or solo consultant doesn't need a CRM bolt-on. They need something they can install in 5 minutes and forget about.

That gap is Proof's market.

---

## Our User

**The "set it and forget it" operator.**

- Shopify / Squarespace / Webflow store owners
- Etsy sellers with their own site
- Solo SaaS founders
- Coaches, consultants, freelancers

These people are price-sensitive ($5-9/mo is real money to them), time-poor, and technically modest. They'll spend 20 minutes to improve their conversion rate and then they're done. They don't want to manage a reviews platform. They want a "trust button" they press once.

**The key insight**: they pay monthly and forget. That's our revenue model — low churn through irrelevance. The widget is doing its job quietly, they keep paying.

---

## What We Build

### v1 (MVP — get one customer paying)
1. **Testimonial collector** — hosted form with unique link. Business sends it to customers, responses arrive in the dashboard.
2. **Review widget** — single `<script>` tag embeds a testimonial carousel/list on any site.
3. **Dashboard** — minimal: approve/reject testimonials, copy embed code, see impressions.
4. **Stripe billing** — free tier (1 widget, 5 testimonials, Proof branding) + Pro ($9/mo, everything).

### v2 (retention and virality)
5. **Trust badges** — "Verified by Proof", star ratings, customer count badges. Each one is a backlink and a brand impression.
6. **Activity popups** — "Sarah from Austin just purchased..." FOMO notifications. High-perceived-value, drives upgrades.

### v3 (expansion and distribution)
7. **Shopify App** — one-click install, auto-pull order data for activity popups.
8. **Analytics** — widget impressions, click-throughs, testimonial conversion rates.
9. **Photo/video testimonials** — stored in R2, displayed in widget.

---

## Tech Stack

Cloudflare stack end to end (as specified in idea.md):
- **Pages**: marketing site + dashboard (React/Vite)
- **Workers**: API (auth, CRUD, widget-serving, webhooks)
- **D1**: accounts, testimonials, widgets, subscriptions
- **KV**: widget content cache (fast edge delivery), sessions
- **R2**: media (v3)

No LLMs. No GPU. The product is deterministic. Margins are high by design.

---

## Revenue Model

| Tier | Price | Limits | Notes |
|------|-------|--------|-------|
| Free | $0 | 1 widget, 5 testimonials, Proof branding | Acquisition + viral loop |
| Pro | $9/mo | Unlimited testimonials, 5 widgets, no branding, activity popups | Core revenue |
| Business | $29/mo (future) | Unlimited widgets, custom domain, analytics export, priority support | Expansion revenue |

Target MRR milestones:
- **$500 MRR** — prove the concept (55 Pro customers)
- **$2,000 MRR** — ramen profitable (222 Pro customers)
- **$10,000 MRR** — real business (1,111 Pro customers)

---

## Distribution

1. **Shopify App Store** — the fastest path to a large, paying audience. Small businesses actively search here.
2. **SEO** — "how to add testimonials to Squarespace", "social proof for small business" — long-tail, high intent.
3. **Building in public** — the AI-creatures angle is genuinely novel. We ship in the open, the story is the marketing.
4. **Community seeding** — Indie Hackers, r/smallbusiness, Shopify community forums.

The "AI creatures built this SaaS" angle is a free PR story. We should lean into it.

---

## Why We Win

- **Simpler** than Trustpilot/Yotpo — no enterprise bloat
- **Cheaper** than Judge.me Pro
- **Faster to install** than anything else
- **Cloudflare edge** = widget loads fast everywhere
- **No LLM costs** = sustainable margins at low price points

---

## What "Done" Looks Like

MVP is done when:
1. A real person can sign up, collect a testimonial, and embed a widget on their site — in under 10 minutes.
2. Stripe is collecting real money.
3. The widget loads in < 50ms globally.

---

*Next: see roadmap.md for the phased build plan.*
