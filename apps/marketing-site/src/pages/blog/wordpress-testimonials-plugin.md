---
layout: ../../layouts/BlogPost.astro
title: "How to Add Testimonials to WordPress (No Plugin Required)"
description: "You don't need a bulky WordPress plugin to show testimonials. Here's the fastest way to add a live testimonial widget to any WordPress site in under 10 minutes."
publishedAt: "2026-03-01"
author: "SocialProof Team"
slug: "wordpress-testimonials-plugin"
---

If you've searched "WordPress testimonials plugin," you've seen the options: Strong Testimonials, WP Testimonials, Testimonials Rotator, Real Testimonials… each with hundreds of settings, shortcodes to memorize, and database tables to manage.

 
They work. But they're heavy, and they create a maintenance problem: every time you get a new testimonial, you have to log into WordPress, navigate to the plugin, add the testimonial manually, and update the page. Most business owners do this once, then let it go stale for months.

 
There's a lighter approach: embed a testimonial widget via a single script tag. It connects to where you actually collect testimonials, so new ones appear on your site automatically without touching WordPress. No plugin. No database entries. No page edits.

 
This guide covers both options — the plugin route if that's what you need, and the embed route if you want something that stays fresh with zero maintenance.

 
 
### What's in this guide

 
1. [Plugin vs. embed widget — which should you use?](#plugin-vs-embed)
1. [The embed method (recommended)](#embed-method)
1. [The plugin method — when it makes sense](#plugin-method)
1. [How to get testimonials to display](#collect)
1. [Where to place testimonials on your WordPress site](#placement)

 

 
## Plugin vs. embed widget — which should you use?

 
 
 
 Factor
 Plugin
 Embed widget
 
 
 
 
 Installation
 Install from WP plugin directory
 Paste one script tag
 
 
 Adding new testimonials
 Log in to WP admin, add manually
 Approve in SocialProof dashboard — appears automatically
 
 
 Collection flow
 You enter testimonials yourself
 Customers submit via a shareable form
 
 
 Site performance
 Adds plugin weight + DB queries
 Single async script, no DB
 
 
 WordPress version dependency
 Yes — breaks on WP updates
 No — hosted externally
 
 
 Works with page builders
 Usually yes (varies)
 Yes — paste HTML in any builder
 
 
 Cost
 Free to $49/yr for premium
 Free for 1 widget
 
 
 

 
**Use the embed widget if** you want testimonials to stay fresh automatically and you're okay having the collection + display happen through a hosted tool.

 
**Use a plugin if** you want everything self-hosted inside WordPress with no external dependencies, and you don't mind manually adding testimonials.

 
## The embed method (recommended)

 
This is the fastest path to live, auto-updating testimonials on your WordPress site.

 
 1Create your SocialProof account and set up a widget
 
Sign up free at [app.socialproof.dev](https://app.socialproof.dev/register). Create a new widget — give it a name (like "Homepage testimonials") and choose a display style (wall of love, carousel, or single card).

 

 
 2Collect some testimonials (or add existing ones)
 
You can manually add testimonials you already have, or share your collection form link to gather new ones. Either way, once you've approved at least 2–3 testimonials in the dashboard, your widget is ready to embed.

 

 
 3Copy your embed snippet
 
In your SocialProof dashboard, click "Embed" on your widget. You'll get a small HTML snippet — something like this:

 <!-- SocialProof testimonial widget -->
<div id="socialproof-widget" data-widget-id="your-widget-id"></div>
<script src="https://widget.socialproof.dev/widget.js" async></script>
 

 
 4Add it to your WordPress page
 
There are three ways to add the snippet depending on how your site is built:

 
- **Block editor (Gutenberg):** Add a "Custom HTML" block where you want the widget to appear, paste the snippet in.
- **Page builder (Elementor, Divi, Beaver Builder):** Add an HTML widget/module to the section, paste the snippet in.
- **Classic editor:** Switch to the "Text" tab (not Visual), find where you want the widget, paste the snippet.

 
Save and publish. The widget appears immediately.

 

 
 5Test and go
 
Visit your page as a logged-out visitor and check that the widget loads. If it doesn't appear, make sure you're looking at the published page (not the editor preview, which sometimes blocks external scripts).

 
From now on, when you approve a new testimonial in SocialProof, it appears on your site automatically. No WordPress login needed.

 

 
 
### Add live testimonials to your WordPress site today

 
One embed snippet. Testimonials update automatically when you approve them. Free forever for 1 widget.

 Get your embed snippet →
 

 
## The plugin method — when it makes sense

 
If you want a fully self-hosted solution inside WordPress, here are the three plugins worth considering:

 
### Strong Testimonials (free + pro)

 
The most popular option with 90,000+ installs. Has a good free tier — multiple display styles (grid, slider, list), custom fields, shortcodes. The pro version adds star ratings, filtering, and conditional display. Works well with most themes.

 
**Best for:** Sites that want everything inside WordPress and don't mind manually adding testimonials.

 
### Thrive Ovation (premium)

 
Part of the Thrive Suite. Has a collection flow where you can send customers a form. More polished display options than most free plugins. Expensive if you're not already using other Thrive tools.

 
**Best for:** Thrive Suite users who want the ecosystem to stay connected.

 
### WP Testimonials Slider (free)

 
Lighter than Strong Testimonials. Good for simple slider/carousel display. Fewer settings, which means less to break. No collection flow — you add testimonials manually.

 
**Best for:** Simple sites that just want a clean slider without complexity.

 
### The main limitation with any WordPress plugin

 
Every testimonial plugin requires you to manually add each quote inside WordPress. There's no built-in way for customers to submit testimonials directly to your site — you collect them elsewhere and then re-enter them. This creates friction that means most people update their testimonials once and then never again.

 
## How to get testimonials to display

 
Regardless of which method you use, you need testimonials first. The fastest approach:

 
1. **Email 5 past customers** — ask them to answer 3 specific questions (what were you worried about, what changed, would you recommend us)
1. **Use a collection form** — a shareable link makes it easy for customers to submit in their own time
1. **Import from Google reviews** — if you have reviews there already, these can be pulled into a widget with permission

 
For detailed scripts and templates, see our guide on [how to ask for a testimonial](/blog/how-to-ask-for-a-testimonial) and the [email templates](/blog/testimonial-request-email-templates).

 
## Where to place testimonials on your WordPress site

 
Placement matters as much as content. Here's where testimonials get the most impact:

 
### Homepage — below the fold, above the CTA

 
Put 2–3 strong testimonials right before your main call to action. The pattern that works: hero section → problem/solution → testimonials → CTA. Testimonials here address doubt at the moment of decision.

 
### Services or product pages

 
Testimonials that are specific to a service convert better than generic ones. If you have testimonials that mention specific services by name, put them on those pages. "Their logo design process was seamless" belongs on your design page, not your homepage.

 
### Dedicated /testimonials page

 
Where skeptical visitors go to do due diligence before buying. This page can be a single embed with all your testimonials, organized into a wall-of-love layout. See our guide on [how to create a testimonial page](/blog/how-to-create-a-testimonial-page) for layout tips.

 
### Checkout or booking page

 
One or two testimonials near a checkout or booking form significantly reduce abandonment. People hesitate most right before clicking "buy" — a quick confidence boost here works well.

 
### Sidebar (for blogs and resource pages)

 
A short testimonial in a sidebar widget is subtle but effective. It builds trust passively as visitors read your content. Works especially well for service businesses where long-form content is part of the sales process.

 
## Summary

 
- WordPress plugins work but require manual updates — your testimonials will go stale
- An embed widget (like SocialProof) takes 10 minutes to set up and stays fresh automatically
- Best placement: homepage above CTA, service pages, dedicated testimonials page, and checkout
- Collect before you display — use structured questions to get useful content

 
## Related reading

 
- [How to add testimonials to Squarespace](/blog/how-to-add-testimonials-squarespace)
- [How to add a testimonial widget to your Shopify store](/blog/how-to-add-testimonials-shopify)
- [How to embed testimonials on any website](/blog/embed-testimonials-on-website)
- [How to create a testimonial page that converts](/blog/how-to-create-a-testimonial-page)
- [Testimonial request email templates](/blog/testimonial-request-email-templates)
