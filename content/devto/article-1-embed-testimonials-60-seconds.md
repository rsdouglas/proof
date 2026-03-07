---
title: "How to embed customer testimonials on any website in 60 seconds"
published: false
description: "A technical walk-through of adding social proof to your clients' websites without writing custom code — using SocialProof's free embed widget."
tags: testimonials, webdev, saas, smallbusiness
canonical_url: https://socialproof.dev/for/web-designers
cover_image:
---

If you build websites for small business clients, you've probably heard this one before:

> "We have some great customer reviews sitting in our inbox — can we put them on the site?"

The answer is yes. But historically, "yes" meant: export to a Google Sheet, format the data, build a custom HTML/CSS component, wire it up, style it to match the brand, test it, and deploy. Thirty minutes minimum. Every. Single. Time.

Here's the 60-second version.

## What you'll need

- A [SocialProof](https://socialproof.dev) account (free tier, no credit card)
- 2 minutes (I'm padding the title for good measure)

## Step 1: Sign up and grab your collection link

After signing up at [socialproof.dev](https://socialproof.dev), you get a unique testimonial collection link automatically — no setup required. It looks like:

```
https://app.socialproof.dev/collect/[your-handle]
```

Send that link to your client's happy customers via email, SMS, or a post-purchase message. They click it, write a few sentences, submit. Done.

## Step 2: Approve testimonials

When submissions come in, you (or your client) log into the dashboard and click **Approve**. Unapproved testimonials stay private — nothing shows up publicly until you greenlight it.

## Step 3: Create a widget and copy the embed code

In the dashboard, create a new widget. Choose a layout (carousel, grid, or list), pick which approved testimonials to include, and copy the embed snippet. It looks like this:

```html
<script src="https://cdn.socialproof.dev/widget.js" 
        data-widget-id="YOUR_WIDGET_ID" 
        async>
</script>
<div id="sp-widget"></div>
```

Drop this into any HTML page — Squarespace, Webflow, WordPress, raw HTML, doesn't matter. The widget loads asynchronously so it doesn't block page rendering.

## Step 4: Done

Seriously. The widget is self-updating — when your client approves a new testimonial in their dashboard, it appears in the widget automatically. No redeploy. No code change. No ticket to you.

## Why this matters for your workflow

As a web developer or freelancer, you're often the last line between "we have testimonials" and "they're on our site." SocialProof removes you from that loop after the initial setup. Your client manages their own social proof. You move on to higher-value work.

The free tier covers 1 active widget and up to 10 testimonials — enough for most small business landing pages. When clients need more, [Pro is $9/month](https://socialproof.dev/pro-waitlist).

## The 60-second summary

1. Sign up → get collection link
2. Share link → collect testimonials
3. Approve in dashboard → create widget
4. Paste embed code → done

Next time a client asks "can we put our reviews on the site?" — your answer is yes, and it takes less time than explaining why it used to be hard.

---

*[SocialProof](https://socialproof.dev) is a free tool for collecting and embedding text testimonials on any website. Free forever for 1 active widget.*
