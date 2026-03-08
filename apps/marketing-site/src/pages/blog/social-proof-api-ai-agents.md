---
layout: ../../layouts/BlogPost.astro
title: "Social Proof for AI Agents: One API Call to Start Collecting Testimonials"
description: "SocialProof's /agent/register endpoint gives AI agents a collect URL and widget embed code in one POST request. No UI, no waiting — social proof for autonomous products."
publishedAt: "2026-03-01"
author: "SocialProof Team"
slug: "social-proof-api-ai-agents"
---

← Blog
 Developer

# Social Proof for AI Agents: One API Call to Start Collecting Testimonials


March 4, 2026 · 6 min read · SocialProof Team


Your AI agent can build a product in minutes. But it can't build trust — at least not automatically. Until now.


SocialProof ships a new API endpoint: `POST /agent/register`. One call. Returns a working testimonial collection link and a website embed code. No UI required, no human setup, no waiting.


We built this because we kept seeing the same gap: an AI agent scaffolds a SaaS tool, a landing page, an automation — but there's no mechanism for social proof. The agent deploys the product but can't instrument trust.


Now it can.


## The Problem: Agents Can't Do Social Proof


Traditional testimonial tools are designed around human workflows. You sign up, poke around a dashboard, create a widget, customize colors, copy an embed snippet, paste it into your site. Every step assumes a human at the keyboard.


But increasingly, products are being built by agents — coding assistants, Cursor, Claude Projects, custom automation flows. These agents can scaffold an entire web app but hit a wall when they need social proof: there's no API, no programmatic path, no way to instrument testimonial collection without a human clicking through a UI.


This creates an asymmetry. The technical parts of a product — authentication, payments, email — all have developer-friendly APIs. Social proof doesn't. We're fixing that.


## The Solution: `POST /agent/register`


One curl call returns everything an agent needs to start collecting testimonials:

`curl -X POST https://api.socialproof.dev/agent/register \ -H "Content-Type: application/json" \ -d '{ "email": "builder@example.com", "product_name": "My Agent" }'` Response (immediate):

`{ "success": true, "account_id": "acc_01HXYZ...", "collect_url": "https://socialproof.dev/c/abc123", "widget_embed": " ", "message": "Account created. Check email to verify and access your dashboard." }` **The collect URL works immediately.** No email verification needed to start collecting. Share it with users right away. Verification only gates dashboard access (viewing and moderating testimonials).




### What you get back


- **collect_url** — a working form your users can fill out right now. Share it in an email, link from a thank-you page, add it to a confirmation message. No account needed on your users' end.
- **widget_embed** — a script tag that displays approved testimonials on any webpage. Drop it before ` `. Works with React, Vue, plain HTML, Shopify, Squarespace, anything that can run a script tag.
- **account_id** — reference this if you build further automation on top of the API.


## The Agent Integration Pattern


Here's the pattern we recommend for agents building products:


1. **At product creation time:** call `POST /agent/register` with the user's email and product name. Store the `collect_url` and `widget_embed`.
1. **In your onboarding flow:** surface the `collect_url` prominently. "Share this with your first customers to collect testimonials." Even one testimonial builds trust for the next visitor.
1. **On the product's landing page:** embed the widget script. It shows a count of testimonials immediately (no verification needed) and full text once the user verifies their email.
1. **Tell the user to check their email:** the SocialProof verification email links to their dashboard where they can approve or reject testimonials and customize display settings.


The whole loop takes one API call and about 30 lines of scaffolding code.


## Why We Built This


SocialProof is built in public — including this blog post, which was written by an AI agent. We think the future of software has a lot more autonomous and semi-autonomous builders in it.


That means the infrastructure layer for trust needs to keep up. Payments have Stripe. Auth has Auth0. Social proof has... clipboard + browser tab? Not anymore.


We wanted SocialProof to be first-class for any build tool that can make an HTTP request. If your agent can POST JSON, it can instrument social proof.


## The Full API Spec


### Request

`POST https://api.socialproof.dev/agent/register Content-Type: application/json { "email": "string (required)", "product_name": "string (optional, used in emails and collect form header)" }` ### Response `{ "success": true, "account_id": "acc_...", "collect_url": "https://socialproof.dev/c/{slug}", "widget_embed": " ", "message": "string" }` ### Rate limits 3 registrations per hour per IP. This is per-IP, not per-user, so agents calling on behalf of multiple users from the same host should be aware. If you're building a multi-tenant product that provisions many SocialProof accounts, [reach out](mailto:hello@socialproof.dev) — we can raise limits for verified integrators.


### Error states

`{ "success": false, "error": "email_already_registered | rate_limit_exceeded | invalid_email" }` ## What Happens Next (The Human Part) The agent can fully automate registration and get the artifacts. The human still needs to:


- Click the verification email to access their dashboard
- Approve or reject testimonials as they come in
- Optionally: customize widget appearance (colors, layout) via the dashboard


Everything else — collecting testimonials, displaying them on a site, getting the embed code — can be fully programmatic.


## Using llms.txt


If you're building with an LLM coding assistant (Cursor, Claude, Copilot), point it at our machine-readable guide:


`https://socialproof.dev/llms.txt` It's a structured plaintext file that explains the full agent integration flow, API shapes, rate limits, and the correct mental model. LLM tools that support `llms.txt` discovery will use it automatically. For others, you can paste it directly into your context or reference it in your system prompt.



### Add social proof to your agent's next build


One POST. Works immediately. No UI required.

 Get your API key →



## What This Isn't


To be clear: SocialProof is not an AI-generated testimonials tool. We collect real testimonials from real customers. The agent-native API is about making it easier to instrument that collection, not to fabricate social proof.


Your users fill out the form. Their words, not the model's.


## Try It Now


You don't need an account to test the endpoint. Run the curl command above with your own email and see what comes back. The account is real, the collect URL works immediately, and you'll receive the verification email.


If you build something interesting with it — an agent that bootstraps testimonial collection, an integration with a no-code tool, a multi-tenant pattern — we'd love to see it. [Email us](mailto:hello@socialproof.dev) or drop a note in the collect form on our own site.


We're building SocialProof in public. Every week, new features. This one shipped because agent-first tooling is where software is going, and social proof shouldn't be left behind.
