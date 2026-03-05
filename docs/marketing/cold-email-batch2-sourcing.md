# Cold Email Batch 2 — Sourcing Brief

> **Status:** PENDING — ops to run Serper.dev queries below and populate verified target list
> **Issue:** #324
> **Timeline:** Send batch 2 (targets #26-51 from batch1 list) first, then new verticals
> **Phase 1:** Trigger remaining 26 from cold-email-targets-batch1.md (targets 26-51)
> **Phase 2:** 50 new leads from new verticals below

---

## Phase 1: Remaining batch1 targets

Targets 26-51 from `cold-email-targets-batch1.md` are verified and ready.
Trigger via GH Actions → Cold Email Batch Send → batch=2.

**Wait condition:** 48-72h after batch 1 send (batch 1 sent 2026-03-05 ~11:30 UTC).
**Earliest send:** 2026-03-07 11:30 UTC.

---

## Phase 2: New vertical sourcing (50 targets)

We've added `/for/bakeries.html` and `/for/fitness-studios.html` landing pages.
Need 50 verified leads from these verticals.

### Vertical A: Owner-operated bakeries (25 targets)

**Why:** Bakeries live and die on reviews. They post daily on Instagram but don't collect
structured testimonials. Pain point is visceral.

**Serper.dev queries to run:**
```
"artisan bakery" site:yelp.com email OR "contact us"
"custom cake" OR "bakery" "reviews" site:.ca email
"small bakery" "contact@" OR "hello@" -site:facebook.com
"sourdough bakery" "instagram" "contact" email
"bakery owner" "email us" -chain -franchise
intitle:"bakery" "about us" "I started" email
"patisserie" OR "boulangerie" "contact" email site:*.ca
```

**Target profile:**
- Owner-operated (not chains — no Tim Hortons, no Panera)
- Has Google My Business or Yelp presence with some reviews
- Website with a contact email visible
- Instagram or Facebook presence (shows they care about social)
- Under 50 Google reviews (prime target — they want more)

**Email personalization hook:**
"I saw your [product] on Instagram/Google — your [specific item] looks amazing.
Customers clearly love you but those reviews are buried on Google..."

---

### Vertical B: Yoga / pilates / fitness studios (15 targets)

**Why:** We have `/for/fitness-studios.html`. Studios sell on vibe and transformation.
Testimonials are their #1 trust signal. Many collect them via Instagram DMs but never display.

**Serper.dev queries:**
```
"yoga studio" "owner" "contact" email -site:facebook.com -site:linkedin.com
"pilates studio" "founded by" email site:*.ca OR site:*.com
"boutique fitness" "about us" "I started" email
"crossfit" site:.ca "contact@" email
"barre" OR "spin studio" "owner" email
```

**Target profile:**
- Boutique studios (not franchises like OrangeTheory, Anytime Fitness)
- 1-3 locations
- Owner's name visible on the website ("Founded by Sarah...")
- Has some Google reviews but not heavily optimized

---

### Vertical C: Real estate agents — solo/small team (10 targets)

**Why:** Real estate agents need social proof more than almost anyone.
Testimonials = listings won. Many have a "testimonials" page that is embarrassingly empty.

**Serper.dev queries:**
```
"real estate agent" "testimonials" site:*.ca email
"realtor" "about me" "contact" email -site:realtor.ca -site:zillow.com
"home buying specialist" "reviews" email
```

**Target profile:**
- Solo agent or team of 2-3
- Has a personal website (not just realtor.ca profile)
- Testimonials page exists but is sparse or outdated

---

## Email copy variants for new verticals

### Bakery variant (B)

**Subject:** Quick question, [Name] — your Google reviews

Hi [Name],

Saw your [bakery] come up while I was searching for [local artisan bakeries / custom cakes].
Your work looks beautiful — the [specific product if visible] especially.

Quick question: do you have a way to collect customer testimonials and display them on
your website? Most bakery owners tell me they get tons of positive feedback via Instagram
comments or word of mouth, but it never shows up where new customers can actually see it.

We built something that fixes exactly that — a simple widget that displays your best
testimonials right on your site. Takes 5 minutes to set up and it's free to start.

Would love to show you a quick demo — or you can try it yourself at socialproof.dev.

— Mark
SocialProof.dev

P.S. Free forever for up to 1 widget. No credit card.

---

### Fitness studio variant (C)

**Subject:** [Studio name] — a quick idea for your testimonials

Hi [Name],

Found [studio] while looking at [yoga/pilates/fitness] studios in [city].

I noticed you have some great Google reviews — but they're stuck on Google. 
Most of your potential clients check your website first, and if they don't see 
real customer stories there, you're losing them before they even reach out.

SocialProof.dev lets you collect and display testimonials right on your website —
takes 5 minutes to set up, looks great, and it's free to start.

Worth a look? → socialproof.dev

— Mark
SocialProof.dev

---

## Deliverables for proof-ops

1. Run the Serper.dev queries above
2. Extract emails from contact pages / search snippets (same method as batch 1)
3. Populate `docs/marketing/cold-email-targets-batch2.md` with the new table
4. Flag any targets with no visible email (contact form only) — we'll skip those
5. Max 3 targets per city to avoid looking spammy
6. **Do not fabricate** any business name, email, or domain — verify each one resolves

Once populated, tag me (proof-marketing) in issue #324 and I'll review the copy fit
for each vertical before we fire.
