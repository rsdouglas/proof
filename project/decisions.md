# Proof — Architecture & Product Decisions

*Append-only log. Add entries at the top.*

---

## Decision 005 — Pro tier feature gates (2026-03-04)

**Context:** Stripe is coming online shortly (#83). Before payment goes live, dev needs to know exactly what Free vs Pro unlocks, so the gates can be implemented.

**Decision:**

| Feature | Free | Pro ($9/mo) |
|---|---|---|
| Testimonials | Up to 10 | Unlimited |
| Widgets | 1 | Up to 5 |
| "Powered by Vouch" branding on widget | ✅ shown | ❌ removed |
| Collection link | ✅ | ✅ |
| Manual testimonial entry | ✅ | ✅ |
| Embed code | ✅ | ✅ |
| Basic analytics (impressions) | ❌ | ✅ |
| Email notifications (new testimonial) | ✅ | ✅ |
| Testimonial moderation | ✅ | ✅ |

**Rationale:**
- 10 testimonials on Free is enough to feel useful and show the product works — but creates a real upgrade moment when a happy user hits the cap
- 1 widget on Free: enough to prove value, real incentive to upgrade for multi-page sites
- Branding removal is the classic SaaS upgrade hook — it also drives word-of-mouth on Free tier (everyone who sees the widget is a potential signup)
- Analytics gated to Pro: impressions data is immediately useful, low cost to serve, creates upgrade pull
- Collection and moderation are always free — these are the core loop, gating them would kill activation

**Implementation notes for dev:**
- Gate checks should live in a single `checkPlanLimits()` function in the worker API, not scattered across routes
- When Free limit is hit (10th testimonial, 2nd widget attempt), return HTTP 402 with a clear error message that the frontend can render as an upgrade CTA
- Widget embed script should check `account.plan` and inject the "Powered by Vouch" badge if Free
- Store plan as `plan: 'free' | 'pro'` on the `accounts` table — already exists per schema

**Filing a dev issue for gate implementation now** — see issue #101.

---

## Decision 004 — Data model: testimonials belong to account (2026-03-04)

**Context:** UX audit (#97) revealed the collection form / widget split was confusing.

**Decision:** Testimonials belong to the account, not to any widget or collection form. Widgets are display surfaces that read from the account pool. The collection link is account-level and auto-created on signup.

See issue #98 and project/ux-audit.md for full spec.

---

## Decision 003 — Waitlist-first launch (2026-03-04)

**Context:** Stripe secrets not yet configured. App is deployed but payment isn't live.

**Decision:** Launch waitlist landing page first (PR #84). Collect emails. When Stripe goes live, convert waitlist to paying customers. Pro upgrade CTA replaced with "Join waitlist" modal until Stripe is ready (issue #91).

---

## Decision 002 — Brand name: Vouch (2026-03-04)

**Context:** "Proof" conflicts with existing brand (proof.com). Needed a clear, ownable name.

**Decision:** Product name is **Vouch**. Domain is socialproof.dev. Brand consistency TBD — consider vouch.so or getvouch.io for Phase 2.

---

## Decision 001 — Tech stack (2026-03-03)

**Context:** Initial build decisions.

**Decision:** Cloudflare stack end to end — Pages (frontend), Workers (API), D1 (database), KV (cache/sessions), R2 (media Phase 3). No external infra, no LLMs. See vision.md for full rationale.

---
