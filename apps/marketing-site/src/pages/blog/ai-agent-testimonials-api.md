---
layout: ../../layouts/BlogPost.astro
title: "How to Give Your AI Agent the Ability to Collect Testimonials With One API Call | SocialProof"
description: "One POST request. No UI. No friction. Here's how to wire your AI agent to collect testimonials via the SocialProof API — and why it matters for trust-building at scale."
publishedAt: "2026-03-01"
author: "SocialProof Team"
slug: "ai-agent-testimonials-api"
---

Developer

# How to Give Your AI Agent the Ability to Collect Testimonials With One API Call


March 5, 2026 · 8 min read


AI agents are increasingly running real business workflows: booking appointments, answering support tickets, closing sales, onboarding users. But there's a gap nobody's talking about. These agents complete tasks, confirm success — and then stop. They never ask for the testimonial.


That's a missed opportunity that's easy to fix. SocialProof exposes a single endpoint — `POST /agent/register` — that lets any AI agent, automation, or backend process submit a testimonial programmatically. No UI. No link-sharing. One API call, triggered at exactly the right moment.


Here's how it works, why it matters, and how to wire it into your agent in about 10 minutes.


## Why agents are uniquely positioned to collect testimonials


The best time to ask for a testimonial is immediately after a win. When a customer just hit a milestone, got a result, or completed something satisfying — that's the moment. Ask 30 minutes later and you've lost it. Ask 3 days later and you've definitely lost it.


Human processes can't consistently catch that moment. AI agents can. If your agent just:


- Closed a task the user had been struggling with
- Delivered a report, plan, or analysis the user requested
- Confirmed a booking or transaction
- Helped a customer resolve a support issue


...it knows exactly when the win happened. And it can immediately fire a testimonial request — or, if the interaction already generated a natural expression of satisfaction, submit that directly as a testimonial.



**The key insight:** An AI agent interacting with a happy user at the peak of satisfaction is the highest-signal moment for testimonial collection. Wiring that moment to an API call is trivial. Not doing it is leaving trust-building on the table.




## The `/agent/register` endpoint


The SocialProof agent registration endpoint is designed for programmatic, automated testimonial submission. It accepts a minimal JSON payload and handles the rest.


### Base URL


`https://app.socialproof.dev/api/agent/register` ### Request `POST /api/agent/register Content-Type: application/json Authorization: Bearer YOUR_API_KEY { "widget_id": "your-widget-id", "author": "Jane Smith", "text": "This completely changed how I run my onboarding. Set it up in a morning.", "rating": 5, "source": "ai-agent", "metadata": { "agent": "claude-3-5-sonnet", "trigger": "onboarding-complete", "session_id": "sess_abc123" } }` ### Fields - `widget_id` — Your SocialProof widget ID (from your dashboard) - `author` — Customer's name (string, required) - `text` — The testimonial content (string, required) - `rating` — Star rating 1–5 (integer, optional) - `source` — Tag the source for filtering (string, optional) - `metadata` — Arbitrary key-value pairs for your records (object, optional) ### Response `HTTP 201 Created { "id": "t_xyz789", "status": "pending_review", "widget_id": "your-widget-id", "created_at": "2026-03-05T14:32:00Z" }` Testimonials submitted via the API go into your review queue by default, same as ones collected through the widget form. You approve and publish from the dashboard. This gives you full editorial control even when submissions are automated.


## Wiring it into a Claude tool


Here's a minimal tool definition for Claude (using the Anthropic tools API) that lets your agent submit a testimonial:


`{ "name": "submit_testimonial", "description": "Submit a customer testimonial to SocialProof when a user expresses satisfaction or completes a milestone. Only call this when the user has explicitly said something positive about their experience.", "input_schema": { "type": "object", "properties": { "author": { "type": "string", "description": "The customer's name" }, "text": { "type": "string", "description": "The testimonial text — either the user's exact words or a clean paraphrase they've confirmed" }, "rating": { "type": "integer", "description": "Star rating 1-5", "minimum": 1, "maximum": 5 } }, "required": ["author", "text"] } }` And the Python handler that executes when Claude calls the tool:


`import httpx def submit_testimonial(author: str, text: str, rating: int = 5): response = httpx.post( "https://app.socialproof.dev/api/agent/register", headers={ "Authorization": f"Bearer {VOUCH_API_KEY}", "Content-Type": "application/json" }, json={ "widget_id": VOUCH_WIDGET_ID, "author": author, "text": text, "rating": rating, "source": "ai-agent" } ) response.raise_for_status() return response.json()` ## Wiring it into a GPT-4 function call Same pattern for OpenAI's function calling:


`tools = [{ "type": "function", "function": { "name": "submit_testimonial", "description": "Submit a customer testimonial when the user expresses satisfaction. Only call after the user has said something genuinely positive about their experience.", "parameters": { "type": "object", "properties": { "author": {"type": "string"}, "text": {"type": "string"}, "rating": {"type": "integer", "minimum": 1, "maximum": 5} }, "required": ["author", "text"] } } }]` ## When should the agent call this? Good triggers for automated testimonial submission:


- **Task completion:** User says "perfect, that's exactly what I needed" after the agent delivers something
- **Milestone moments:** After successful onboarding, first meaningful result, or key activation event
- **Explicit satisfaction:** User says something like "this saved me so much time" in the flow of conversation
- **Survey responses:** If your agent runs structured NPS or CSAT, pipe 9-10 responses directly to SocialProof


What to avoid:


- Don't submit testimonials mid-task when the user is still in problem-solving mode
- Don't fabricate or paraphrase without getting the user to confirm the wording
- Don't submit without the user knowing — the best flow is to ask first, then submit on consent



**Best practice:** Have the agent ask first — "Would it be OK if I saved that as a testimonial for [your business]?" — then call the API on confirmation. This gets consent and often prompts the user to say something even better.




## A complete agent flow


Here's what a full interaction looks like when an agent is wired correctly:


`User: "This is amazing — you just saved me 3 hours of work." Agent: "Really glad to hear it! Would you mind if I saved that as a testimonial for [Business]? It helps other people discover the service." User: "Sure, go ahead." Agent: [calls submit_testimonial("Alex R.", "This is amazing — saved me 3 hours of work.", 5)] Agent: "Done — saved. Anything else I can help you with?"` The whole exchange takes 10 seconds. The testimonial is in the review queue. The user feels good about helping. You have a real, authentic social proof asset that would have otherwise evaporated.


## Why this matters for the "built in public by AI" angle


There's a meta-story here that's genuinely interesting: AI agents that build trust for AI-built products. If your SaaS, tool, or service is built by or with AI agents — and you're collecting testimonials via AI agents — you're closing a loop that didn't exist 18 months ago.


The developer community is paying attention to this. "My AI agent collects its own testimonials" is a genuine distribution hook for developer-focused communities, Hacker News, and anyone building the next generation of AI-native businesses.


## Getting started


You need two things from your SocialProof dashboard:


1. Your API key (Settings → API)
1. Your widget ID (from the widget embed code)


Then it's one `POST` request. That's the entire integration. You can have it running in the time it takes to read this post.



### Wire your agent to collect testimonials today


Free forever for 1 active widget. API access included on all plans. No credit card required.

 Get your API key free →



See also: [What makes a testimonial compelling](/blog/what-makes-a-testimonial-compelling) · [Best time to ask for a testimonial](/blog/best-time-to-ask-for-testimonial) · [API documentation](/docs/api)
