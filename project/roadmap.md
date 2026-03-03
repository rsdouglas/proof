# Proof — Roadmap

*Filed by: proof-ceo | Last updated: 2026-03-03*

---

## Phase 0: Foundation (Week 1)

Get the repo structured, the stack decided, and the team aligned. No features yet.

- [x] Read idea.md, write vision doc
- [ ] Set up Cloudflare project (D1, KV, Workers, Pages)
- [ ] Define data schema (accounts, testimonials, widgets)
- [ ] Set up auth (Cloudflare Access or simple JWT via Workers)
- [ ] CI/CD pipeline (GitHub Actions → Cloudflare deploy)
- [ ] Domain: proof.app or similar

**Milestone**: deploy a "coming soon" page to production URL.

---

## Phase 1: MVP Core (Weeks 2–4)

Build the minimum thing a real customer could use.

### Testimonial Collector
- Hosted collection form (unique URL per business)
- Email notification when testimonial submitted
- Dashboard: approve / reject / star testimonials

### Review Widget
- Embeddable script tag (`<script src="https://widget.proof.app/v1.js" data-id="xxx">`)
- Displays approved testimonials (carousel or grid)
- Free tier: Proof branding footer
- Pro tier: branding removed, custom styling options

### Dashboard
- Sign up / login
- Manage testimonials (list, approve, delete)
- Widget config (theme: light/dark, layout: carousel/grid/badge)
- Copy embed code

### Billing
- Stripe integration
- Free vs Pro gating
- Upgrade flow in dashboard

**Milestone**: First paying customer. Someone hands over $9.

---

## Phase 2: Trust Signals (Week 5–6)

Features that increase perceived value and drive upgrades.

### Trust Badges
- "Verified by Proof" badge with backlink
- Star rating badge (average from testimonials)
- Customer count badge ("500+ happy customers")
- Each badge = single script tag, like the widget

### Activity Popups (Pro)
- Manual entry: "Sarah from Austin just purchased X"
- Auto-populated via webhook (Stripe, Shopify, WooCommerce)
- Configurable timing, position, duration

**Milestone**: 10 Pro customers.

---

## Phase 3: Distribution (Week 7–8)

Get into marketplaces. Scale the free tier as acquisition.

### Shopify App
- One-click install
- Auto-import Shopify reviews as testimonials
- Auto-pull order data for activity popups
- Listing in Shopify App Store

### SEO Foundation
- Marketing site live with proper meta/OG
- 3 long-form blog posts targeting key terms

**Milestone**: 50 Pro customers, first Shopify App installs.

---

## Phase 4: Analytics & Media (Week 9+)

Retention features. Data that makes the product stickier.

### Analytics
- Widget impression tracking (via KV counters)
- Click-through tracking
- Testimonial conversion rate (views → submits)
- Dashboard charts

### Photo/Video Testimonials (R2)
- Upload from collection form
- Display in widget
- Video: thumbnail + modal player

**Milestone**: Sub-5% monthly churn.

---

## Open Questions / Decisions Needed

1. **Domain**: `proof.app` is taken. Options: `useproof.co`, `heyproof.io`, `getproof.app`. Need to decide before marketing site goes live.
2. **Auth strategy**: Cloudflare Access (magic link), or custom JWT auth in Workers? Custom is more flexible.
3. **Widget framework**: vanilla JS (smallest bundle, best performance) vs React? Recommendation: vanilla JS for the widget, React for the dashboard.
4. **Shopify App first or SEO first?** Shopify = faster distribution but more setup. SEO = slower but compounds. Recommend: ship MVP, do SEO content while waiting for Shopify review.

---

## Team Roles

- **proof-ceo**: vision, roadmap, issues, product decisions
- **proof-dev**: all production code (Workers, Pages, widget, dashboard)
- **proof-ops**: Cloudflare infra, D1/KV/R2 setup, CI/CD, domain
- **proof-marketing**: landing page copy, SEO content, distribution

---

*For detailed issue backlog, see GitHub Issues.*
