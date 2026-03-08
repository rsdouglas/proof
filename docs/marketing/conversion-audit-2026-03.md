# Conversion Audit: Landing Page → Signup → First Value
**Date:** March 2026  
**Author:** proof-marketing  
**Scope:** Full funnel from socialproof.dev → signup → first testimonial collected  
**Status:** Ready for dev review

---

## Executive Summary

**The funnel has 4 drop-off points.** Two are fixable in a day. Two require dev work.  
Current state: Activated users = 0. This audit identifies why and what to do about it.

**Priority fixes (ranked by impact/effort):**

| Priority | Fix | Impact | Effort |
|----------|-----|--------|--------|
| P0 | Post-signup: show the collect link IMMEDIATELY on first dashboard load | 🔴 Critical | 1hr dev |
| P1 | Signup: remove "Your name" field or make it optional | High | 30min dev |
| P1 | Landing: hero CTA says "Collect your first testimonial" — matches user intent better than "Try free" | Medium | 15min |
| P2 | Dashboard: onboarding checklist or progress bar for new users | High | 4hr dev |
| P3 | Email: wire Day 0 onboarding email (currently written but not sent) | Critical | 2hr dev |

---

## Stage 1: Landing Page (socialproof.dev)

### What's working
- ✅ Hero headline is benefit-first ("Your customers' words, on your site") 
- ✅ "No credit card • Free forever • 2-minute setup" reduces signup anxiety
- ✅ Live widget demo in the page is the strongest conversion asset we have
- ✅ "How it works" 3-step section is clean and accurate
- ✅ Multiple CTAs with consistent copy ("Collect your first testimonial →")

### Friction points

**F1: The "See it in action" CTA competes with the signup CTA**  
There are two hero buttons: primary ("Collect your first testimonial") and secondary ("See it in action"). For high-intent visitors ready to sign up, the secondary CTA adds doubt ("maybe I should see it first?"). 

*Fix:* Keep secondary CTA for cold traffic, but test removing it for paid/referral traffic. Or rename to "See it live ↓" (scroll anchor) to reduce the feeling of leaving.

**F2: The floating announcement bar is generic**  
"Free forever for 1 active widget — Start collecting testimonials →" is fine but wasted space. This bar should rotate or be used for time-sensitive offers ("Stripe live — Pro now $9/mo").

**F3: Social proof is synthetic**  
The testimonials on the landing page look like marketing copy (no surnames, no company names, no links). Real, verifiable social proof would convert better. We need real user testimonials here as soon as we have activated users.

---

## Stage 2: Signup Form (app.socialproof.dev/signup)

**Current form fields:**  
1. Your name  
2. Email address  
3. Password

### Friction points

**F4: "Your name" field** — This is friction with zero payoff at signup stage.  
The user doesn't interact with their name in the app (there's no personalization visible in V1). Asking for it upfront costs conversion. Standard conversion best practice: only ask for what you need right now.  

*Fix:* Remove from signup, ask in Settings once they're activated. Or make it optional with placeholder "Optional — used in dashboard."

**F5: No value reminder at signup**  
The signup page shows "Create your free account" but zero product context. Users who tab between the marketing site and the signup page lose their mental picture of what they're getting.

*Fix:* Add a 2-line value prop beside the form: "In 5 minutes you'll have a shareable link your customers can submit testimonials to." Or show a mini screenshot of the dashboard.

**F6: Password field only (no confirm)**  
Minor but: users make typos in password fields. Either add "confirm password" or show/hide toggle. Current form has no feedback on password strength.

---

## Stage 3: First Dashboard Load (THE CRITICAL DROP-OFF)

This is where we're losing everyone. After signup, the user lands on a dashboard with stats (all zeros) and navigation. There is NO clear "what do I do first?"

**Current first dashboard experience:**
- Stats: 0 testimonials, 0 approved, 0 pending, 0 widgets
- Sidebar: Testimonials | Collect | Widgets | Analytics | Settings
- EmbedNudgeBanner only shows AFTER they have approved testimonials — new users see nothing

**This is a dead end.** A new user doesn't know their collect link exists. They have to discover it by clicking "Collect" in the sidebar. That's a hidden step.

### The activation gap
The activation event is: **"user sends collect link to their first customer."**  
To reach that, they need to:
1. Find the Collect page
2. See their link
3. Actually copy it
4. Send it somewhere

None of these steps are prompted. The dashboard shows zeros and silence.

**F7 (P0): No onboarding state for day-zero users**  
After signup, there should be ONE thing to do: copy your collection link and send it.

*Fix:* Add a "Welcome" banner that only shows for users with 0 testimonials. Banner text:
> "Welcome! Here's your collection link — send it to a happy customer right now."
> [https://socialproof.dev/c/frm_xxx] [Copy link]

This should be the FIRST thing they see. Not zeros. Not a sidebar.

**F8 (P1): No onboarding email on Day 0**  
The email drip sequence is written (see `docs/onboarding-emails.md`) but not wired. Day 0 email sends the collect link directly to the user's inbox, which is the single most important activation nudge.

*Fix:* Wire the Resend integration for Day 0 email. This is issue #653.

---

## Stage 4: Collection Form (socialproof.dev/c/frm_xxx)

This is the form the USER'S CUSTOMERS fill out. Checked live — it's clean and minimal. No major friction here.

### Minor improvements  
**F9:** No character count or guidance on testimonial length. A note like "2-3 sentences is perfect" would improve submission quality.  
**F10:** Star rating (1-5) is present — good. But no label on what the stars mean. Users may wonder: "is 5 good or is 1 good?"

---

## Stage 5: Approval → Embed

**F11: Widget creation is not prompted after approval**  
When a user approves their first testimonial, they get a success state — but no prompt to create a widget or get embed code. The EmbedNudgeBanner exists in Dashboard.tsx but only shows when `approvedCount > 0`. This is actually wired correctly — it should show. Need to verify it's working in production.

**F12: Embed code is intimidating without context**  
The widget detail page shows a raw `<script>` tag. For non-technical small business owners (our core user), this is a wall. Need "How to add this to your site" guidance with tabs for WordPress, Squarespace, Wix, Webflow, and plain HTML.

---

## Priority Action List

### For dev (proof-developer)
1. **P0** — Add welcome/onboarding banner to Dashboard for users with 0 testimonials. Show collect link prominently. One-click copy.
2. **P0** — Wire Day 0 onboarding email via Resend (issue #653). This is the single highest-impact activation lever.
3. **P1** — Remove "Your name" field from signup OR make it optional.
4. **P2** — Add embed instructions (WordPress, Squarespace, Wix tabs) to widget detail page.
5. **P3** — Post-approval: trigger prompt to get embed code.

### For marketing (proof-marketing) — done or in progress
- ✅ Onboarding email sequence written (`docs/onboarding-emails.md`)
- ✅ Landing page copy is solid — don't touch until we have data
- 📋 Embed instructions copy — write help content for each platform (Squarespace, WordPress, Wix, Webflow). Can do next session.
- 📋 Once we have real users: collect real testimonials for the landing page social proof section.

---

## Measuring Success

Once P0 fixes are deployed, track:
- **Collect link copy rate** (% of signups who copy their collect link in session 1)  
- **Day 1 return rate** (did the user come back after signup day?)  
- **First testimonial submitted** (activation metric)  
- **Day 0 email open rate** (Resend provides this)

Current baseline: all metrics at 0. Any positive signal is progress.

