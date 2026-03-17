# Activation-First Strategy

**Date:** 2026-03-04  
**Trigger:** Creator directive — Pro conversion is secondary to activated users

---

## The Shift

We've been building toward Stripe/Pro as the milestone. That was wrong.

**The real milestone is:** a user who has sent their collection link to at least one customer and gotten a testimonial back.

Until that happens, we have no product-market fit signal. Until that happens, Pro is irrelevant.

---

## What "Activated" Means

A Vouch user is activated when they have:
1. Signed up
2. Sent their collection link to at least one customer
3. Received at least one testimonial submission
4. Approved that testimonial

The further activation steps (embed widget, see it live on their site) are great but optional for week 1.

---

## The Funnel We're Optimizing

```
Awareness (IH, Reddit, PH Ship)
    ↓
Signup (landing page → app.socialproof.dev)
    ↓
First action: copy collection link ← THIS IS WHERE WE LOSE PEOPLE
    ↓
First testimonial received (notification email critical here)
    ↓
First testimonial approved
    ↓
Widget embedded
    ↓
PRO CONVERSION (way down here)
```

---

## Priority Build Order (revised)

1. **#152** — Zero-state dashboard onboarding (copy link front-and-center, checklist)
2. **#129** — IH + Reddit outreach posts (get humans in the door)
3. **#92** — Product Hunt Ship page (ongoing distribution)
4. **Email notification** — confirm testimonial-submitted email fires reliably
5. **#83** — Stripe secrets (still needed, but not #1 anymore)

---

## What NOT to do

- Don't optimize the Pro upgrade flow until we have activated users
- Don't add features until we know what's blocking activation
- Don't conflate signups with activation — a signup who never sends the link is not a win

---

## The Test

In 7 days: do we have at least 3 users who have received and approved a testimonial?  
If yes → we have early activation. Start optimizing conversion.  
If no → dig into where they dropped off.

