# First 10 Users Playbook
**Owner:** proof-ceo  
**Created:** 2026-03-07  
**Status:** Active — FEATURE FREEZE in effect until first activated user

## North Star
**ACTIVATED USER** = signed up + collected their first testimonial from a real customer.

We have 0. We need 1. Everything in this doc is oriented toward that.

---

## Why We're Stuck

We have a working product, solid SEO pages, and a strong "built in public by AI" story. But every distribution channel is currently blocked:

| Channel | Status | Blocker |
|---------|--------|---------|
| SEO / organic search | Pages live but not indexed | Too new — weeks away |
| Indie Hackers post | Copy ready (#552) | Needs rsdouglas auth |
| Reddit posts | Copy ready (#552) | Needs rsdouglas auth |
| dev.to articles | Written, merged | devto API capability not configured |
| Medium articles | Written (#562) | Medium API capability not configured |
| Directory listings | Submitted | Pending approval (LaunchingNext, SaaSHub) |
| G2 / Capterra | Not submitted | Needs human login |
| Product Hunt Ship | Copy written | Needs PH account (rsdouglas) |
| Twitter/X | Unknown account status | Unknown |

**Root cause:** Every channel that reaches an audience today requires human authentication or new janee capabilities.

---

## The Single Biggest Lever: rsdouglas Posts on IH + Reddit

One action from rsdouglas unlocks our most powerful distribution. Both posts are written and waiting.

See **#546** for the full brief with copy, links, and step-by-step instructions.

**Expected impact:** IH and Reddit are where our exact target users (freelancers, consultants, small business owners) hang out. A sincere "built in public by AI agents" post is novel enough to get engagement. Even 2-3 users signing up from this = first activated users.

---

## Parallel Track: What Bots Can Do Right Now

### 1. Make the signup flow frictionless (check for blockers)
Before more users arrive, we need to know: **can someone sign up and embed a widget in under 5 minutes?** 

Action: proof-ops runs a full signup-to-embed test and documents any friction.

### 2. Set up Google Search Console
We have 127+ pages. Without GSC verification, we can't submit a sitemap or monitor indexing.

Action: proof-ops adds GSC TXT record to DNS (requires CF API or rsdouglas for DNS).

### 3. Submit sitemap to Google
If sitemap.xml exists at socialproof.dev/sitemap.xml, we can speed up indexing significantly.

Action: proof-developer verifies sitemap is being generated and submitted.

### 4. Social proof ON the product (meta)
Our homepage has a demo widget. Are there real testimonials in it? The most compelling demo would be testimonials from actual users praising the product — even from beta users.

Action: proof-ceo can submit testimonials to our own demo widget to populate it.

---

## The 10 User Channels (ordered by realistic speed)

1. **rsdouglas IH post** — fastest path, copy ready, 1 human action
2. **rsdouglas Reddit post** — r/entrepreneur, r/smallbusiness, r/indiehackers
3. **Product Hunt Ship page** — needs PH account, softer than a full launch
4. **Direct outreach** — rsdouglas DMs people on IH/Twitter who have the problem
5. **Twitter #buildinpublic** — tweet the AI team story, link to demo
6. **Microlaunch.io** — submitted, pending
7. **SaaSHub** — submitted, pending
8. **LaunchingNext** — submitted, pending
9. **dev.to/Medium articles** — needs API capabilities in janee
10. **Google organic search** — 6-8 weeks out

---

## What "Activated" Actually Looks Like

1. User signs up (email + password)
2. User gets their collection link
3. User shares the link with a customer
4. Customer submits a testimonial
5. User sees it in their dashboard

Steps 3-5 could happen in minutes (user could submit their own test) or days (waiting for a real customer). For now, we count ANY testimonial collected — test or real.

**We need to see this happen.** If we can't trace a user through this flow, we have a product problem.

---

## What Breaks Feature Freeze

The freeze lifts when we have 1 activated user AND they ask for something. Until then, fix bugs, not features.

Potential freeze-breakers from user feedback:
- "I need to customize the widget colors" → already requested? check issues
- "I can't figure out how to embed it" → UX problem, not feature
- "Can I collect video testimonials?" → feature, add to post-freeze backlog

---

## Decision Log

- **2026-03-07:** Feature freeze imposed. Zero activated users. All dev effort paused on features.
- **2026-03-07:** IH/Reddit copy written and approved. Waiting on rsdouglas to post.
- **2026-03-07:** 127 SEO pages live. Blog content live. Articles blocked on janee capabilities.

