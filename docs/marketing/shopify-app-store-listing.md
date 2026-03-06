# Shopify App Store Listing — SocialProof

> Status: DRAFT — ready for review when Phase 3 dev begins
> Related: Issue #27

## App Name (40 chars max)
SocialProof — Customer Testimonials

## Tagline (80 chars max)
Collect, display, and share customer testimonials. Free forever for 1 widget.

## App Store Short Description (100 chars max)
Let happy customers sell for you. Collect real testimonials in seconds, embed anywhere.

---

## Full Description (2000 chars max for App Store)

**Turn customer love into sales — automatically.**

SocialProof is the simplest way to collect, display, and share customer testimonials on your Shopify store. When a customer buys from you, SocialProof emails them a frictionless collection link. They share their experience in 30 seconds. You get a formatted testimonial you can display on your storefront immediately.

**Why testimonials matter more than reviews:**
Product reviews tell shoppers about a product. Brand testimonials tell them about *you* — your service, your reliability, your values. Testimonials convert skeptical visitors into buyers.

---

**How it works:**

1. **Collect automatically** — After an order fulfills, SocialProof emails your customer a simple collection form. No account needed. 30 seconds to submit.

2. **Approve and display** — Testimonials land in your dashboard. Approve with one click. Embed the widget anywhere in your store using our theme app block — no coding required.

3. **Share everywhere** — Post testimonials to Instagram, your email newsletter, or your product pages. Your customers' words, working everywhere you sell.

---

**Features:**
✅ Order-triggered testimonial collection (Shopify-native webhook)
✅ Drag-and-drop theme app block — no code needed
✅ Auto-embed on homepage, product pages, collection pages
✅ Mobile-optimized collection form
✅ Star ratings + free-text testimonials
✅ One-click testimonial approval
✅ Shareable image exports for social media
✅ Schema.org markup for SEO (review rich snippets)
✅ Video testimonial support (upload or link)

---

**Free forever:**
1 active widget. Unlimited testimonial collection. No credit card required.

**Paid plans:** Multiple widgets, custom branding, priority email support, video testimonials.

---

## Keywords (for Shopify App Store search)
- testimonials
- social proof
- customer reviews
- trust badges
- review widget
- brand testimonials
- customer stories
- word of mouth

## Primary Category
Store design → Reviews and testimonials

## App Icon Description
Clean, minimal — speech bubble containing a five-star arrangement. Brand colors: deep navy (#1a2744) and electric green (#00ff87).

---

## Screenshot Descriptions (5 required)

### Screenshot 1 — "Collect"
**Headline:** Customers submit in 30 seconds
**Content:** Mobile view of the collection form — clean, minimal, no login required. Shows a text box and star rating. Tagline overlay: "No account needed. No friction. Just their words."

### Screenshot 2 — "Dashboard"
**Headline:** All your testimonials in one place
**Content:** Dashboard showing a list of testimonials — approved/pending states, customer names, star ratings. Shows approve, edit, and share buttons.

### Screenshot 3 — "Embed"
**Headline:** Live on your storefront in 60 seconds
**Content:** Shopify theme editor with the SocialProof app block being dragged onto the homepage. Live preview shows a 3-up testimonial grid.

### Screenshot 4 — "Order Trigger"
**Headline:** Automatically sent after every order
**Content:** Shopify order workflow diagram showing: Order fulfilled → SocialProof sends collection email → Customer submits → Approved testimonial appears on store.

### Screenshot 5 — "Social Share"
**Headline:** Share to Instagram in one click
**Content:** Share UI showing a branded quote card being exported — customer photo, quote, star rating, store logo. Caption pre-filled for Instagram.

---

## App Store Categories to Select
- [ ] Reviews and testimonials (primary)
- [ ] Marketing and conversion
- [ ] Store design

---

## Compliance Notes for Shopify Review

- App must use Shopify OAuth (not API key auth) — see dev spec
- Billing must use Shopify Subscription API — no external payment gateways for in-app upgrades
- Must not access customer data beyond order email for collection trigger
- Email sending must respect Shopify Marketing Consent API (only send to opted-in customers)
- Collection emails must include unsubscribe link

---

## Beta Merchant Targets (Phase 3 Launch)

For the 10-merchant beta before App Store submission:

**Ideal beta merchants:**
- 50–500 orders/month (enough volume to get testimonials quickly)
- Service or handmade goods (where brand story matters more than product specs)
- Currently has NO testimonial section on site (high pain)
- Located in US, Canada, or UK (English-speaking, CAN-SPAM/GDPR compliance)

**Outreach approach:**
- Comment in Shopify Community forums (r/shopify, Shopify Partner Community)
- DM merchants who tweet about social proof / reviews
- Pitch existing SocialProof users who have Shopify stores

---

*File this issue under Phase 3 prep. Marketing deliverable: copy is ready when dev starts building.*
