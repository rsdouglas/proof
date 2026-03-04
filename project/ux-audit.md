# Vouch — UX Audit
**Date:** 2026-03-04  
**Author:** CEO  
**Trigger:** Issue #97 from rsdouglas

---

## TL;DR

The product has solid bones but a confusing information architecture. The core problem: too many top-level concepts that users have to wire together manually. The fix is to make **Widget** the single organizing concept for everything.

---

## The 5 UX problems I found

### Problem 1: Two creation flows to do one thing (HIGH)
**Current:** User must (a) create a Widget, then (b) create a Collection Form separately, then somehow understand these are related.  
**Reality:** They should be one thing. A widget IS both the display and the collection point.  
**Fix:** Filed as issue #98. Auto-create collect link on widget creation. Remove "Collect" nav item. Add "Share" tab to widget detail.

### Problem 2: "Testimonials" page vs "Widget" tabs — duplicate moderation UI (MEDIUM)
**Current:** You can approve/reject testimonials from:
- `/testimonials` (global list, all widgets)
- `/widgets/:id` (widget-specific tabs: Pending | Approved | Rejected)

This means there are two places to do the same action. Confusing.  
**Fix short-term:** Make `/testimonials` clearly labeled "All testimonials — across all widgets" and add a "Widget" column/filter.  
**Fix long-term:** Probably kill the global testimonials page and do everything from within the widget. But that's a bigger refactor — hold for v2.

### Problem 3: Dashboard "Getting Started" sends users to /collect (MEDIUM)
**Current:** Step 2 of the getting started checklist is "Collect your first testimonial → Get collection link →" which links to `/collect`.  
If we kill `/collect` as part of #98, this link breaks.  
**Fix:** Update the getting started flow to point users to their widget's Share tab. Filed to be handled in #98.

### Problem 4: The submission form URL is ugly and shows the API domain (LOW)
**Current:** Collection form URL is `https://api.socialproof.dev/submit/{formId}` — the API subdomain, looks technical, not trust-building.  
**Better:** Could be `https://submit.socialproof.dev/r/{formId}` or just `https://socialproof.dev/submit/{formId}`.  
This is blocked on DNS (#90) anyway. File as a follow-up after DNS is live.

### Problem 5: "Analytics" is a graveyard for zero-state users (LOW)
**Current:** The analytics page shows event data (widget views, impressions). For a brand new user with no embed and no testimonials, it's completely empty.  
**Fix:** Add a zero-state to analytics that says "Your analytics will appear here once you've embedded a widget on your site" with a link to get embed code. Minor polish item.

---

## The correct first-time user flow

**As-is:**
1. Sign up ✅
2. ... stare at dashboard
3. Create a widget (what's a widget?)
4. Go to "Collect", create a collection form (why do I need to name it?)
5. Copy a link that goes to `api.socialproof.dev/submit/...` (looks sketchy)
6. Send to customers
7. Come back, approve testimonials (from /testimonials or /widgets/:id?)
8. Go back to /widgets, find embed code, copy it
9. Add to site

**After fix (#98):**
1. Sign up ✅
2. Getting started checklist: "Create your first widget" → do it
3. Widget detail shows "Share" tab automatically → copy the link
4. Send to customers
5. Testimonials come in → approve from widget tabs
6. "Embed" tab → copy code, add to site

That's the flow. Four steps instead of nine.

---

## What's NOT broken

- The dashboard stats (total, approved, pending, widgets deployed) — clear, useful
- Widget embed code generation — works, clean
- Testimonial approve/reject/feature workflow within widget — solid
- Manual testimonial addition — useful for seeding social proof on day 1
- Settings page — adequate for now
- Login/forgot password/reset — clean flow

---

## Priority order for fixes

1. **#98** — Collapse Collection Forms into Widget (kills the biggest UX confusion)
2. **#98 follow-up** — Fix getting started checklist to point to widget Share tab
3. **(New issue)** — Add "widget" column/filter to global testimonials page
4. **(After DNS #90)** — Clean up submission URL domain
5. **(Minor)** — Analytics zero state

