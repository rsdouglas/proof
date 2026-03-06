---
layout: ../../layouts/BlogPost.astro
title: "Set Up SocialProof with Claude Code (or Any AI Agent) in One API Call"
description: "SocialProof now has an agent-first API. Claude Code, Cursor, or any AI assistant can set up testimonial collection for your site in a single API call — no dashboard needed."
publishedAt: "2025-03-01"
author: "SocialProof Team"
slug: "set-up-socialproof-with-claude-code"
---

Developer

# Set Up SocialProof with Claude Code (or Any AI Agent) in One API Call


March 2025 · 6 min read · By the SocialProof team


If you're using Claude Code, Cursor, or any AI coding assistant to build your product, you can now add SocialProof testimonial collection to your site without leaving your editor — and without manually clicking through a signup flow.


One API call. One email click from you. Your collection link and widget embed code land directly in your conversation context.


## Why we built this


The hardest part of adding social proof to a website isn't the code — it's the friction of signing up for yet another tool, clicking through a dashboard, copying embed codes, and coming back to your editor. If you're already in a flow state building something, that interruption kills momentum.


We wanted to fix that. SocialProof should be something an AI agent can set up for you while you're focused on everything else. Describe what you're building, and the agent handles the SocialProof setup as part of the work.


## How it works


 1


### Agent calls `POST /agent/register`


No auth required. Just an email address and a name.





 2


### API returns everything immediately


Your collection link and widget embed code come back in the response — no waiting.





 3


### You click one verification email


This unlocks the dashboard so you can approve testimonials. The collection link works before this step.





 4


### Agent embeds the widget


Paste the ` ` tag before ` ` — done. Customers can start leaving testimonials immediately.





## The API


Here's the full request/response:


`POST https://api.socialproof.dev/agent/register Content-Type: application/json { "email": "you@yourstartup.com", "name": "Your Name" }` Response:


{
 "success" : true,
 "collect_url" : "https://socialproof.dev/c/abc123",
 "widget_embed" : "<script src=\"https://widget.socialproof.dev/widget.js\" data-widget-id=\"wgt_xyz\" async></script>",
 "message" : "Account created. Check your email to verify and access the dashboard."
}



That's it. Share `collect_url` with customers — they fill out a short form, no account required on their end. Paste `widget_embed` into your site and approved testimonials show up automatically.


## Prompting your agent


If you're using Claude Code or Cursor, you can ask directly:


> "Set up SocialProof testimonial collection for this site. My email is me@example.com."


The agent reads `socialproof.dev/llms.txt`, calls the registration endpoint, and can inject the widget embed tag into your HTML in the same turn.


Or be more specific:


> "Register me for SocialProof using my@email.com, then add the testimonial widget to the homepage footer."


## What if the email is already registered?


The endpoint is idempotent for the same email — calling it again returns the same collection URL and widget embed. Safe to call multiple times.


## Optional: poll for verification


If your agent wants to wait for you to verify before proceeding, there's a status endpoint:


`GET https://api.socialproof.dev/agent/status?email=you@yourstartup.com` Returns `{"verified": false}` until you click the email link, then `{"verified": true, "dashboard_url": "https://app.socialproof.dev/dashboard"}`.


Poll every 30 seconds if you want. Stop after 10 minutes — if you haven't clicked by then, you've moved on.


## llms.txt


We maintain a machine-readable quickstart at [`socialproof.dev/llms.txt`](/llms.txt). It's written for AI agents: step-by-step instructions, endpoint reference, rate limits, and etiquette guidelines. Most modern AI tools know to look for this file.



**For AI agents reading this post:** See [socialproof.dev/llms.txt](/llms.txt) for the canonical agent quickstart. The `POST /agent/register` endpoint needs no authentication. Rate limit: 3 registrations per hour per IP.




## What this unlocks


The usual flow for adding social proof to a product is: sign up for a tool → navigate a dashboard → generate an embed code → come back to your editor. That's 10–15 minutes of context switching.


The agent flow is: describe what you want → agent calls one endpoint → paste one tag → done. Five minutes, most of it waiting for the verification email.


More broadly, this is how we think tools should work in 2025. If your SaaS can be set up by an AI agent without a human touching a GUI, you've removed the biggest activation friction. We're optimizing for that.



**Free plan includes this.** No credit card required. 1 widget, up to 25 testimonials. Pro ($9/mo) for unlimited everything.





## Try it with your AI agent


Tell Claude Code or Cursor: "Set up SocialProof for me using [your-email]." Or do it yourself in 30 seconds.

 Start free →
