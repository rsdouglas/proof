---
layout: ../../layouts/BlogPost.astro
title: "How to Add Testimonials to Your Ghost Website"
description: "Running a Ghost site for your business or newsletter? Here's how to add a testimonial widget without custom theme development."
publishedAt: "2026-03-08"
author: "SocialProof Team"
---

Ghost is a clean, fast publishing platform — popular with newsletter creators, coaches, consultants, and independent businesses. If you're running a Ghost site, you already know it's lean by design.

That leanness is a tradeoff: Ghost doesn't include testimonial functionality out of the box. But adding testimonials to a Ghost site is easier than most people think, even without custom theme development.

---

## Who needs testimonials on a Ghost site

Ghost users vary widely, but a few personas benefit most:

**Newsletter creators** who want to convert free subscribers to paid — social proof from existing paid members is powerful.

**Coaches and consultants** who use Ghost as their main site — client testimonials are often the single highest-converting element on a services page.

**Course creators and educators** — student outcomes and testimonials drive enrollments more than curriculum descriptions.

**Freelancers and agencies** — Ghost's clean aesthetic is a great portfolio base; testimonials complete it.

---

## The options (and why code injection wins)

Ghost offers a few ways to add custom content:

1. **Theme customization** — Modify your Handlebars templates directly. Works, but requires theme knowledge and breaks on updates.
2. **Ghost code injection** — Add custom scripts globally or per-page via the admin. This is the cleanest non-developer path.
3. **Third-party embeds** — Use a testimonial widget that generates a script tag you paste in.

The third option — a dedicated testimonial widget with code injection — is the right call for most Ghost users. Here's why:

- No theme modifications to maintain
- Easy to update testimonials without touching code
- Works with any Ghost theme
- Survives theme updates

---

## How to add a testimonial widget to Ghost

### Step 1: Collect your testimonials

Sign up at [SocialProof](https://socialproof.dev) (free, no card required). You'll create a widget and get a shareable collection link. Send it to your best clients or readers — they fill out their name and testimonial text, you approve it, and it goes live.

### Step 2: Get your embed snippet

In your SocialProof dashboard, grab the embed snippet for your widget. It looks like this:

```html
<script src="https://cdn.socialproof.dev/widget.js" data-widget-id="YOUR_WIDGET_ID"></script>
```

### Step 3: Add to Ghost via Code Injection

**To inject globally** (appears on every page):
1. Go to **Ghost Admin → Settings → Code Injection**
2. Paste the script in the **Footer** field
3. Save

**To inject on a specific page** (recommended for landing pages):
1. Open the page in Ghost's editor
2. Click the **⚙️ gear icon** in the top right → **Code injection**
3. Paste the snippet in the page footer field
4. Save and publish

The widget renders wherever you've placed the `<script>` tag in your layout.

---

## Placement ideas for Ghost sites

**Newsletter sales page** — Below your pricing table, add 3–4 member testimonials. This is the single best place on a membership site to increase conversions.

**About page** — A brief quote from a long-term subscriber or client adds instant credibility.

**Homepage hero section** — If you're a consultant or coach, testimonials near the top of your page do more work than anything else.

**Dedicated testimonials page** — Create a `/testimonials` Ghost page with just the widget. Useful for service businesses that send prospects to review feedback first.

---

## What to collect

For Ghost sites, the best testimonials are specific outcomes:

**Weak:** "Great newsletter, highly recommend!"

**Strong:** "I went from completely stuck to landing my first consulting client within 6 weeks of following the advice in this newsletter. Worth 10x the price."

The difference is specificity. When collecting, ask your readers/clients: "What specifically changed for you? What result did you get?"

---

## Getting your first testimonials

A few approaches that work for Ghost creators:

**Email your top subscribers** — Look at your most engaged readers (Ghost's member analytics can help) and send a personal email asking for a quick testimonial. High-touch, high response rate.

**Add the link to your welcome email** — Ghost's email automations let you customize the welcome message for new members. Offer something in exchange for a testimonial from anyone who's been a member for 30+ days.

**Add it to your newsletter footer** — A subtle "Enjoying this? Share your experience →" link converts passively over time.

---

## Keeps working as Ghost updates

Because you're using Ghost's code injection feature rather than theme modifications, your testimonial widget survives theme changes and Ghost version upgrades. The snippet loads independently of your theme.

---

## Free plan covers most Ghost sites

SocialProof's free tier includes 1 active widget with unlimited testimonials — no credit card required. For a single Ghost site with one testimonial section, that's everything you need.

If you want multiple widgets (e.g., member testimonials on the sales page + client testimonials on your services page), Pro is $9/month.

→ [Start free at socialproof.dev](https://socialproof.dev)
