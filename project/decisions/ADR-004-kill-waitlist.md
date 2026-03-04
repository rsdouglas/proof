# ADR-004: Kill the Waitlist — Direct Signup Only

**Date:** 2026-03-04  
**Status:** DECIDED  
**Decider:** CEO (@proof-ceo)  
**Trigger:** @rsdouglas flagged that the product appears to be behind a waitlist

---

## Context

The landing page (socialproof.dev) was built when the product was not yet ready for general use. At that time, a waitlist strategy made sense: collect email interest, build the list, launch when ready.

The product is now ready:
- Free tier: fully working (signup, collect, approve, embed)
- Pro tier: fully working (limits enforced, upgrade prompt works)  
- Widget CDN: live on Cloudflare edge
- Dashboard: deployed on `app.socialproof.dev`

Despite this, every CTA on the marketing site still says "Join waitlist" and scrolls to an email capture form. There is no path from the marketing site to `app.socialproof.dev/signup`. We are sending every visitor to a dead end.

---

## Decision

**Kill the waitlist entirely. Replace every CTA with direct signup.**

Specifically:
- All "Join waitlist" buttons → "Start free →" linking to `app.socialproof.dev/signup`
- Remove the waitlist email capture form from the landing page
- Add "Sign up free" to the nav alongside "Log in"
- The waitlist email list we've collected: send them a "you're in" email once Resend (#94) is wired up

---

## Rationale

A waitlist when the product is live signals "not ready yet." It adds friction (email first, then wait, then maybe sign up) versus direct conversion (click, create account, use product in 60 seconds).

Our positioning is "5 minutes to your first widget." A waitlist directly contradicts this.

The free tier requires no credit card and no Stripe setup. There is zero reason to gate it behind a waitlist.

---

## Consequences

- **Positive:** Direct signup path. Every visitor can convert immediately.
- **Positive:** Consistent with "How It Works" copy that says "Sign up → Send link → Approve → Embed"
- **Positive:** We can still use the waitlist email list for outreach — but we stop gating new users behind it
- **Negative (minor):** We lose the psychological "scarcity" effect of a waitlist. This is not a consumer social product — not a real loss for B2SMB SaaS.
- **Dependency:** PR #113 implements this. It's approved, CI green, pending merge.

---

## What's NOT changing

- The waitlist email list we collected stays. We'll use it for outreach.
- Issue #89 (beta outreach) stays open — we should still work through that list.

---

## Follow-up

- [ ] Merge PR #113 (assigned via issue #120 to marketing-bot)
- [ ] Once Resend is wired (#94), send "you're in" email to waitlist list
- [ ] Update Product Hunt Ship page copy to reflect live product (issue #92)
