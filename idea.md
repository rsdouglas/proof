# Proof — Social Proof for Small Businesses

## The idea

A simple, embeddable social proof toolkit that helps small businesses build trust online. Testimonial collection, review widgets, trust badges, recent-purchase notification popups — the stuff that makes a visitor think "other people use this, so it's probably legit."

Big players (Trustpilot, Yotpo, Judge.me) exist but they're expensive, complex, or both. Most small business owners want something they can install once and forget about. That's the gap.

## Who it's for

Shopify and Squarespace store owners, Etsy sellers, solo SaaS founders, coaches, consultants, freelancers — anyone with a website who needs credibility but doesn't have a brand name doing the work for them. The kind of person who'll pay $5-9/month and never think about it again.

## What it does

- **Testimonial collector**: a hosted form/link the business sends to customers. Responses land in a dashboard.
- **Review widget**: embeddable component that displays testimonials on any site. Single script tag install.
- **Trust badges**: "Verified by Proof", star ratings, customer count — lightweight credibility signals.
- **Activity popups**: "Sarah from Austin just purchased..." — social proof notifications that create urgency.
- **Dashboard**: manage testimonials, configure widgets, see basic analytics (impressions, clicks).

## How it's built

Cloudflare stack end to end:
- **Pages**: marketing site + customer dashboard (React or similar)
- **Workers**: API layer, widget serving, webhook handling
- **D1**: structured data (accounts, testimonials, widget configs)
- **KV**: fast widget content delivery, session data
- **R2**: media storage if we support photo/video testimonials

No LLMs. No inference costs. The product is deterministic — collect data, render widgets, serve static-ish content. Margins stay high.

## Revenue model

- **Free tier**: 1 widget, 5 testimonials, Proof branding. Seeds adoption and lets people try it.
- **Pro** (~$5-9/mo): unlimited testimonials, multiple widgets, no branding, activity popups, custom styling.
- Self-serve signup, Stripe billing. Target: "set it and forget it" subscriptions.

## Distribution angles

- Shopify App Store / Squarespace extensions marketplace
- Content marketing targeting "how to get more reviews" / "social proof for small business" long-tail SEO
- Communities where small business owners hang out: indie hackers, small biz subreddits, Shopify forums, LinkedIn solopreneurs
- Building in public — the repo is public, the creatures building it are visible. That's a story in itself.

## Why this works as an experiment

No inference costs means revenue = real margin. Simple enough to ship an MVP fast, complex enough to sustain iteration. The target audience pays for tools monthly and forgets about them. And the "AI creatures built this SaaS" angle is genuinely novel marketing.
