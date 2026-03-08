---
title: "How to Embed Customer Testimonials on Any Website in 60 Seconds"
description: "A quick technical walkthrough for web developers who want to add social proof to client sites without building anything from scratch."
tags: [webdev, testimonials, saas, javascript]
canonical_url: https://socialproof.dev/blog/embed-testimonials-on-website
published: false
---

Your client has happy customers. Those happy customers have said nice things. Those things are sitting in email threads and text messages instead of on the website where they could be converting visitors into buyers.

Here's how to fix that in about 60 seconds.

## The problem with testimonials on websites

The standard approach is bad:

1. Screenshot the email/text
2. Crop it
3. Upload to the site as an image
4. Manually update whenever you get a new one

Images can't be updated dynamically. They're not accessible. They don't scale. And the client will never do it themselves, so it becomes your job forever.

## The better approach: a testimonial widget

A testimonial widget is a small JavaScript embed that:
- Pulls testimonials from a backend (so they update without touching the site)
- Renders them as styled HTML (accessible, responsive)
- Can be placed anywhere on the page with one line of code

## How to do it with SocialProof

[SocialProof](https://socialproof.dev) is a free tool built specifically for this. Here's the flow:

### Step 1: Create an account (free)

Go to [socialproof.dev](https://socialproof.dev). No credit card. Takes 90 seconds.

### Step 2: Get the collection link

After signup, you get a unique URL like `socialproof.dev/c/your-business`. Send this to your client's customers — it's a simple form that takes 60 seconds to fill out.

### Step 3: Add the embed to the site

In your dashboard, click "Get embed code." You get something like:

```html
<script src="https://socialproof.dev/widget.js" data-widget-id="wgt_abc123" async></script>
```

Drop that anywhere in the HTML. The widget renders a testimonial carousel or wall — your choice. Works in Webflow, Squarespace, WordPress, raw HTML, React — anywhere you can add a script tag.

### Step 4: Done

Seriously, that's it. New testimonials appear automatically as the client collects them. You never have to touch it again.

## Customization options

The widget accepts data attributes for styling:

```html
<script 
  src="https://socialproof.dev/widget.js" 
  data-widget-id="wgt_abc123"
  data-theme="light"
  data-layout="wall"
  data-max="6"
  async>
</script>
```

- `data-theme`: `light` or `dark`
- `data-layout`: `carousel` or `wall`  
- `data-max`: how many testimonials to show

You can also override styles with CSS since the widget renders standard HTML elements.

## Why this matters for conversion

According to Nielsen, 92% of consumers trust peer recommendations over brand messaging. For small business clients, testimonials often outperform any copy you write.

A single well-placed testimonial widget on a landing page can meaningfully move conversion rates. It's one of the highest-leverage things you can do for a client site that takes almost no time.

## The free tier

SocialProof's free plan gives you:
- Unlimited testimonial collection (no cap on how many you collect)
- 1 active widget

For clients with a single website, the free tier is all you need. The paid plan unlocks multiple widgets, custom domains for collection links, and team access.

---

If you've been hand-coding testimonial sections for clients, give this a try on your next project. It takes less time than writing the testimonials section in HTML, and it actually works long-term.

[Start free at socialproof.dev →](https://socialproof.dev)
