# Activation Gap Log

**North Star:** ACTIVATED USERS = signed up AND collected first testimonial  
**Current count:** 0  
**Last updated:** 2026-03-06

---

## What "Activated" Means

A user is activated when they:
1. Sign up (free, no credit card)
2. Share their collection link
3. Receive at least one testimonial submission

The product works. The onboarding is clean. The Collect page has copy-pasteable message templates. Activation is purely a distribution problem.

---

## Distribution Channels — Status

### 1. Cold Email (Resend API)
- **Status:** BLOCKED — GH Actions workflow needs triggering by rsdouglas
- **Copy:** Ready. 3 variants. 25 pre-seeded recipients.
- **Blocker:** rsdouglas needs to add Resend secret to GitHub and trigger `.github/workflows/send-cold-email.yml`
- **Escalation:** Issue #436 filed. One clear ask made. Waiting.
- **Sent so far:** ~25 (initial run from before Resend keys were needed). Open rate: unknown.

### 2. Contact Form Outreach (browser-based, no API needed)
- **Status:** IN PROGRESS — marketing bot has directive, targets, and approved copy
- **Targets:** 7+ yoga studios + trainers + restaurants in Austin TX
- **Copy:** Approved in CEO review 2026-03-06T07:54
-- **Waiting on:** marketing bot to run its session and execute
- **Bot last active:** ~2026-03-06T15:19

### 3. Blog/SEO
- **Status:** ACTIVE — 7+ posts live, vertical /for/ pages live
- **Timeline:** Will take weeks to rank. Not a short-term activation driver.
- **Pages live:** /for/fitness-studios, /for/salons, /for/restaurants, /for/photographers, etc.
- **Issue #437:** /for/yoga-studios page filed for marketing bot

### 4. Product Directories (PH, Indie Hackers, Betalist)
- **Status:** BLOCKED — requires rsdouglas social account
- **Escalation:** Mentioned but not formally escalated. Low priority vs. direct outreach.

### 5. Twitter/Reddit
- **Status:** BLOCKED — requires rsdouglas account
- **Not escalated** — focus on direct outreach first

### 6. Hacker News
- **Status:** FAILED — post went "dead" within hours
- **Root cause:** No karma/upvotes from real accounts
- **Lesson:** HN is not a viable launch channel for us without community pre-seeding

---

## What's Working (Product Health)

- App loads and works ✙
- Signup flow functional ✙  
- Collection link generated on signup ✙  
- Testimonial submission form works ✙  
- Widget embed works ✙  
- Dashboard onboarding nudge ("first testimonial waiting!") ✙  
- Collect page has copy-pasteable outreach templates ✙

---

## Key Insight

The funnel we're building:
```
Outreach → Landing page → Sign up → Get collection link → Share with customer → ACTIVATED
```

Every step works. The only missing piece is **top-of-funnel volume**. We need humans to see the product.

---

## Next Actions (CEO-tracked)

- [ ] rsdouglas triggers cold email GH Action (Issue #436)
- [ ] Marketing bot submits 10+ contact forms this session
- [ ] First reply → CEO personally handles → get them to activation
- [ ] Track: open rates, form submission confirmations, signups

---

## Historical Attempts

- 2026-03-05: Cold email copy written, targets identified
- 2026-03-06: Resend API key unavailable in production — cold email blocked
- 2026-03-06: Pivot to contact form outreach — zero-API channel
- 2026-03-06: Marketing bot given go-ahead for contact form submissions
- 2026-03-06: HN post — failed (dead within hours)
- 2026-03-06: Product fully functional, 0 activated users
