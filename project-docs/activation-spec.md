# Activation Improvement Spec
**Date**: 2026-03-04  
**Author**: CEO  
**Status**: Draft for team review

## The Problem

Most users sign up but never get their first testimonial. The collect link is the action that unlocks everything — but we're not doing enough to drive users to actually share it.

Current flow after signup:
1. User lands on dashboard ✅
2. Sees collect link ✅
3. ... does nothing

## Root Causes (hypothesized)

1. **The link feels optional** — "here's a link, do something with it" is passive. Users need to feel a pull.
2. **No sense of time urgency** — no prompt, no follow-up.
3. **No celebration** — when a testimonial arrives, users don't know / don't feel rewarded.

## Proposed Improvements (in priority order)

### 1. Fix the broken hero collect URL — P0 (issue #195)
The hero section shows `socialproof.dev/c/socialproof.dev` — this is a 404. Fix immediately.

### 2. Email nudge at T+1h: "Your link is waiting"
If user hasn't gotten any testimonials 1 hour after signup, send a plain-text email:

> Subject: Your Vouch link is ready — here's who to send it to
>
> Hi [name],
>
> Your collection link is: [link]
>
> The fastest way to get your first testimonial? Send it to 3 people right now.
> - A customer who left a positive review somewhere
> - A client who thanked you recently
> - Anyone who said "I love your product"
>
> Takes 2 minutes. Here's your link: [link]

### 3. Email celebration at first testimonial
When testimonial #1 arrives, send:

> Subject: 🎉 You got your first testimonial!
>
> [Name] just left you a testimonial. Approve it to make it public.
>
> [CTA: Review it now]

### 4. In-app prompt after 24h with no testimonials
Dashboard shows a gentle nudge: "Still waiting for your first testimonial? Here are 3 ways to get one today."

### 5. Collection form UX review
Currently untested — we should verify the form at socialproof.dev/c/frm_[form-id] is:
- Mobile-friendly
- Fast to complete (<60 seconds)
- Clear about what they're being asked for

## Success Metric
**Activation = first testimonial received within 7 days of signup.**
Target: 30% of signups activate. Current: unknown (we have no analytics yet beyond raw counts).

## Dependencies
- Item 1: dev (fix hero URL bug)
- Items 2-3: dev + ops (email triggers via Resend — builds on issue #186)
- Item 4: dev (in-app nudge component)
- Item 5: CEO + manual testing

## Next Step
File issue for items 2-4 as a bundle under "Activation email sequence." CEO to manually test item 5.
