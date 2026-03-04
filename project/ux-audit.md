# Vouch — UX Audit

**Date:** 2026-03-04  
**Author:** CEO  
**Trigger:** Issue #97 from rsdouglas  
**Updated:** 2026-03-04 (model corrected after discussion with rsdouglas)

---

## TL;DR

The product has solid bones but a confusing information architecture. The core problem: too many coupled concepts. The fix is to fully decouple **collecting** from **displaying**.

---

## The correct mental model (final)

```
Account
  ├── Collection link (auto-exists on signup — how testimonials get IN)
  ├── Testimonials (single pool, belong to account not to any widget)
  └── Widgets (optional display surfaces — how testimonials get OUT)
```

**Three principles:**
1. Testimonials belong to the **account**, not to a widget
2. Collection link is **account-level**, auto-created on signup, no setup required
3. Widgets are **display surfaces only** — they read from the pool, they don't own it

**Users should never have to create a widget to collect testimonials.** Collecting and displaying are independent actions.

---

## The 5 UX problems found

### Problem 1: Two required creation flows to do one thing (HIGH — filing #98)

**Current:** User must (a) create a Widget AND (b) create a Collection Form before they can do anything. The two are not visibly related in the UI.

**Root cause:** The data model has `collection_forms.widget_id` FK, implying forms belong to widgets. But the UI doesn't enforce or explain this relationship — it just creates two separate confusing entry points.

**Correct fix (per #98):**
- Auto-create one collection link per account on signup — no user action required
- `/collect` page becomes a simple "here's your link, copy it" page — no create/manage flow
- Widgets are created only when the user wants to display testimonials on their site
- Widget display query shows ALL approved account testimonials, not filtered by widget_id
- Getting started: step 1 = share your link; widget creation is optional step 3

**What NOT to do:** Don't make the form belong to the widget. That couples two things that should be free.

### Problem 2: Duplicate moderation UI (MEDIUM — handle in #98)

**Current:** Testimonials can be approved/rejected from:
- `/testimonials` — global list
- `/widgets/:id` — per-widget tabs (Pending | Approved | Rejected)

Under the new model (testimonials don't belong to widgets), the per-widget moderation tabs don't make sense. All moderation should happen in `/testimonials`.

**Fix:** Remove the Pending/Approved/Rejected tabs from the widget detail page. Widget detail = display config only (style, embed code). Moderation lives in `/testimonials`.

### Problem 3: Getting started checklist links to wrong places (MEDIUM — handle in #98)

**Current:** Step 2 of getting started links to `/collect` with a "create collection form" flow that shouldn't exist.

**Fix:** Update checklist to: (1) Share your collection link → /collect (just copy the link), (2) Approve your first testimonial → /testimonials, (3) [Optional] Add to your site → /widgets

### Problem 4: Submission URL shows API subdomain (LOW — blocked on DNS #90)

**Current:** `https://api.socialproof.dev/submit/{formId}` — looks technical and untrustworthy.

**Fix:** Route through main domain. Blocked on DNS. Follow up after #90 resolved.

### Problem 5: Analytics zero-state looks broken (LOW — #100)

**Current:** Empty page for new users, no explanation.

**Fix:** Add zero-state copy + CTA to create a widget (analytics tracks embed activity, so widget is the right CTA here).

---

## The correct first-time user flow

**Current (broken):**
1. Sign up
2. Stare at dashboard
3. Create a widget (what's a widget?)
4. Go to Collect, create a collection form (why do I name it?)
5. Copy `api.socialproof.dev/submit/...` link (looks sketchy)
6. Send to customers
7. Approve testimonials (from /testimonials or /widgets/:id — unclear)
8. Go to /widgets, get embed code
9. Add to site

**Target (after #98):**
1. Sign up
2. Go to Collect — link is already there, copy it
3. Send to customers
4. Approve from /testimonials
5. [When ready] Go to /widgets, create a widget, get embed code, add to site

Collecting testimonials: 2 steps (copy, send).  
Displaying testimonials: separate, optional, when ready.

---

## What's NOT broken

- Dashboard stats (total, approved, pending) — clear and useful
- Widget embed code generation — works, clean
- Manual testimonial addition — great for seeding day-1 social proof
- Settings page — adequate
- Login/forgot password/reset — clean flow

---

## Issues filed from this audit

| Issue | Status | Description |
|-------|--------|-------------|
| #98 | Open | Core fix: decouple collect from widgets, auto-create account link on signup |
| #99 | Closed | Wrong — based on old model (widget-owned testimonials). Not needed. |
| #100 | Open | Analytics zero-state polish |

