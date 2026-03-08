---
layout: ../../layouts/BlogPost.astro
title: "How to Add Testimonials to Your Webflow Site"
description: "A simple, no-code guide to embedding a testimonials section in Webflow. Collect customer reviews and display them beautifully on any Webflow page."
publishedAt: "2025-06-05"
author: "SocialProof Team"
---

# How to Add Testimonials to Your Webflow Site

Webflow gives designers and developers total control over layout and style. But collecting and displaying real customer testimonials still requires a system behind the scenes. Here's how to add a working testimonials section to any Webflow site — without hardcoding quotes or maintaining a CMS schema.

## Why Webflow Sites Need Real Testimonials

Webflow makes it easy to *design* a testimonials section. The hard part is the workflow:

- Asking customers for quotes
- Keeping the section fresh as your business grows
- Approving and publishing only the testimonials you want

Placeholder quotes look polished in staging. On a live site, visitors notice the difference between a curated fake and a real customer's words.

## Option 1: Embed a SocialProof Widget

[SocialProof](https://socialproof.dev) is a testimonials tool built for this exact use case. You collect testimonials via a shareable link, approve them in your dashboard, and embed them anywhere with a script tag.

**Steps for Webflow:**

1. Sign up at [socialproof.dev](https://socialproof.dev) (free — no credit card required)
2. Share your collection link with past customers and ask for a short testimonial
3. Approve submissions in your SocialProof dashboard
4. Copy your embed snippet (a single `<script>` tag)
5. In Webflow, open the page you want to embed testimonials on
6. Drag an **Embed** element onto the canvas
7. Paste the SocialProof script into the embed code field
8. Publish your Webflow site

The widget renders a clean grid or carousel of your approved testimonials. It updates automatically as you approve new submissions — no Webflow republish needed.

## Option 2: Use Webflow CMS

If you want complete visual control and already pay for Webflow CMS:

1. Create a **Testimonials** CMS collection with fields: Name, Company, Quote, Star Rating
2. Manually paste quotes into each CMS item
3. Connect the collection to a Collection List on your page
4. Style as needed

**The tradeoff:** CMS testimonials require you to manually copy each quote from email, Slack, or wherever customers sent it. There's no collection link to share. You also need a CMS plan ($16+/mo on Webflow).

## Option 3: Static Hardcoded Quotes

If you only have 2–3 testimonials and they'll never change, hardcode them directly in Webflow Designer. Add a Div Block, a Text element for the quote, and another for the name. Style to match your brand.

**The tradeoff:** To update, you have to republish. To add testimonials, you or a developer must edit the site.

## Which Approach Is Right for You?

| Approach | Best for | Effort |
|----------|----------|--------|
| SocialProof embed | Sites you update regularly; growing businesses | Low |
| Webflow CMS | Designers who want full style control | Medium |
| Hardcoded | Early-stage sites with 2–3 static quotes | Low (but won't scale) |

## What Makes a Good Testimonials Section in Webflow?

Regardless of which approach you use, a few design principles hold:

**Keep it scannable.** Visitors don't read long testimonials. 1–3 sentences is ideal. If a customer writes a paragraph, edit it down (with their permission) or pull out the best one-liner as a pull quote.

**Include name and context.** "Sarah M." is less credible than "Sarah Mitchell, owner of Bloom Floral Studio." The more specific, the better.

**Put it above the fold or near your CTA.** A testimonials section buried at the bottom of a long page gets less lift. Test placing it near your main call to action.

**Match your brand.** Webflow's strength is design control — use it. A testimonial section should feel native to your site, not like a dropped-in widget.

## Getting Your First Testimonials

The hardest part isn't adding the section — it's getting real quotes to put in it.

A few tactics that work:
- **Email your last 5–10 customers** and ask directly. "Would you be willing to share a sentence or two about working with us? I'm building out my site." Most people say yes.
- **Use a collection link** (SocialProof generates one automatically). Share it via email, invoice follow-ups, or at the end of a project.
- **Ask for specifics.** "What problem did we solve? What result did you see?" Specific questions yield specific, credible quotes.

---

Adding testimonials to Webflow takes 15 minutes. Getting good testimonials takes a little longer — but the lift to your conversion rate is worth it.

[Try SocialProof free →](https://socialproof.dev)
