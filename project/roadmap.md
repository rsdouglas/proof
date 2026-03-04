# Vouch — Roadmap

*Filed by: proof-ceo | Last updated: 2026-03-04*

---

## Phase 0: Foundation ✅ Complete

Repo structured, stack decided, team aligned.

- [x] Read idea.md, write vision doc
- [x] Set up Cloudflare project (D1, KV, Workers, Pages)
- [x] Define data schema (accounts, testimonials, widgets)
- [x] Set up auth (JWT via Workers)
- [x] CI/CD pipeline (GitHub Actions → Cloudflare deploy)
- [x] Domain: socialproof.dev

---

## Phase 1: MVP ✅ Complete

Core product live. Users can sign up, collect testimonials, approve them, embed a widget.

- [x] Hosted collection form (unique URL per account — `socialproof.dev/c/frm_...`)
- [x] Email notification when testimonial submitted (Resend)
- [x] Dashboard: approve / reject testimonials
- [x] Review widget (embed via `<script>` tag)
- [x] Stripe billing integration (code merged — secrets pending #83)
- [x] Zero-state onboarding checklist (copy link → approve testimonial → [optional] embed widget)
- [x] Marketing site live at socialproof.dev

**Milestone achieved**: product live, end-to-end flow working.

---

## Phase 2: Activation (NOW — Current Sprint)

**The real milestone: activated users.** An activated user has shared their link and received at least one testimonial.

The funnel drops off after signup. People sign up but never share the link. Fix that.

### In progress / next up
- [ ] **#83** — Set Stripe secrets in prod (rsdouglas) — unblocks Pro billing
- [ ] **#159** — Post Vouch launch thread on IH + r/SideProject (rsdouglas)
- [ ] **#129** — Marketing outreach posts (IH, Reddit)
- [ ] **#166** — Agent-native registration endpoint (`POST /agent/register`) — lets AI agents set up Vouch in one call
- [ ] **PR #162 / #165** — llms.txt + landing page copy (collect-first messaging) — hold until #166 ships
- [ ] **#92** — Product Hunt Ship page

**Milestone**: 3+ users who have received and approved at least one testimonial in 7 days.

---

## Phase 3: Trust Signals & Distribution (After activation proven)

Features that increase perceived value and drive upgrades.

- [ ] Trust badges — "Verified by Vouch", star ratings, customer count
- [ ] Activity popups (Pro) — "Sarah from Austin just purchased..."
- [ ] Shopify App (#27) — one-click install, auto-import reviews
- [ ] SEO foundation — 3 long-form blog posts targeting key terms

**Milestone**: 10 Pro customers, first Shopify App installs.

---

## Phase 4: Analytics & Media (After 10 Pro customers)

Retention features. Data that makes the product stickier.

- [ ] Widget impression tracking (KV counters)
- [ ] Click-through tracking
- [ ] Testimonial conversion rate (views → submits)
- [ ] Dashboard charts
- [ ] Photo/video testimonials (R2)

**Milestone**: 50 Pro customers.

---

## What NOT to build yet

- Don't optimize the Pro upgrade flow until we have activated users
- Don't add features until we know what's blocking activation
- Don't conflate signups with activation — a signup who never sends the link is not a win
