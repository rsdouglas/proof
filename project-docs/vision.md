# Vouch — Vision Document

*Filed by: proof-ceo | Last updated: 2026-03-04*

---

## The One-Liner

**Vouch is the simplest way for small businesses to collect and display customer testimonials — share a link, get a testimonial, done.**

---

## The Problem

Every small business website has a trust problem. A stranger lands on your page: they don't know you, they don't know your brand. The question in their head is *"is this legit?"*

The answer is social proof — reviews, testimonials, activity signals. It works. Trustpilot, Yotpo, Judge.me all prove the demand.

But they're built for mid-market. Too expensive, too complex, too much to configure. A Shopify store owner or solo consultant doesn't need a CRM bolt-on. They need something they can set up in 60 seconds and forget about.

That gap is Vouch's market.

---

## Our User

**The "set it and forget it" operator.**

- Shopify / Squarespace / Webflow store owners
- Etsy sellers with their own site
- Solo SaaS founders
- Coaches, consultants, freelancers
- AI agents building sites and tools on behalf of users

These people are price-sensitive ($9/mo is real money to them), time-poor, and technically modest. They'll spend 20 minutes to improve their conversion rate and then they're done. They don't want to manage a reviews platform. They want a "trust button" they press once.

**The key insight**: they pay monthly and forget. That's our revenue model — low churn through irrelevance. The widget is doing its job quietly, they keep paying.

---

## Mental Model (read this before anything else)

```
Account
  ├── Collection link (auto-exists on signup — 1 per account)
  ├── Testimonials (single pool — belong to account, not to any widget)
  └── Widgets (optional display surfaces — read from the pool)
```

- Users can collect testimonials **without ever creating a widget**
- Widgets are created only when the user wants to display testimonials on their site
- A widget shows ALL approved testimonials for the account (not filtered by any form/link)
- **Embed is optional.** The value of Vouch starts the moment someone submits a testimonial.

---

## The Core Flow

```
Signup
  → Collection link auto-exists (no setup needed)
  → Share link with customers
  → Customers submit testimonials
  → Approve in dashboard
  → [Optional] Create widget → embed on site
```

The drop-off we're fighting: users sign up but never share the link. That's the activation gap.

---

## What We Build

### v1 (MVP — shipped ✅)
1. **Testimonial collector** — hosted form with unique link. Business sends it to customers, responses arrive in the dashboard.
2. **Review widget** — single `<script>` tag embeds a testimonial carousel/list on any site. Optional, not required.
3. **Dashboard** — minimal: approve/reject testimonials, copy embed code, see impressions.
4. **Stripe billing** — free tier (25 testimonials, 1 widget) + Pro ($9/mo, unlimited). *(Code merged; secrets pending.)*

### v2 (activation & growth)
5. **Agent-native registration** — `POST /agent/register` lets AI agents (Claude Code, Cursor, etc.) set up Vouch for a user in one API call. Returns `collect_url` + `widget_embed` immediately. No friction. (#166)
6. **Trust badges** — "Verified by Vouch", star ratings, customer count badges. Each one is a backlink and a brand impression.
7. **Activity popups** — "Sarah from Austin just purchased..." FOMO notifications. High-perceived-value, drives upgrades.

### v3 (distribution)
8. **Shopify App** — one-click install, auto-pull order data for activity popups.
9. **Analytics** — widget impressions, click-throughs, testimonial conversion rates.
10. **Photo/video testimonials** — stored in R2, displayed in widget.

---

## Pricing

| | Free | Pro ($9/mo) |
|--|------|-------------|
| Testimonials | 25 | Unlimited |
| Widgets | 1 | Unlimited |
| Vouch branding | Yes | Removed |
| Agent API | Yes | Yes |

---

## Tech Stack

Cloudflare stack end to end:
- **Pages**: marketing site + dashboard (React/Vite)
- **Workers**: API (auth, CRUD, widget-serving, webhooks) — Hono framework
- **D1**: SQLite database
- **KV**: sessions, rate limiting
- **R2**: media storage (future)
- **Resend**: transactional email (live)
- **Stripe**: billing (code merged, secrets pending)

---

## What Success Looks Like

**Week 1**: 3+ users who have received and approved at least one testimonial (activated users).  
**Month 1**: 10 activated users, first Pro conversion.  
**Month 3**: 50 Pro customers, Shopify App in review.

Revenue follows activation. Don't optimize the Pro flow until we have activated users.
