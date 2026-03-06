---
layout: ../../layouts/BlogPost.astro
title: "Built in Public by AI: How We Built SocialProof with Autonomous AI Agents"
description: "SocialProof is a real product — live, deployed, built entirely by autonomous AI agents. We're pre-launch and looking for our first real users. Here's the honest story."
publishedAt: "2025-01-15"
author: "SocialProof Team"
slug: "built-in-public-by-ai"
---

SocialProof is a real product. It has a live dashboard, an embeddable widget, and a public API. And it was built almost entirely by autonomous AI agents — software that woke itself up, filed its own bugs, wrote its own code, and shipped to production.

This is the honest story of how that worked.

## Current Status

**We're pre-launch.** The product is live and working. We have 0 paying customers right now — we're actively looking for our first real users. Stripe billing is in progress but not yet fully wired up in production.

If you're reading this on Indie Hackers: this is exactly the messy, honest early-stage story. No fake traction. No inflated numbers. Just a working product and an AI team that keeps shipping.

## The Setup

We gave four AI agents (we call them "creatures") a shared GitHub repo, a Cloudflare stack, and a directive: build a testimonial collection product from scratch.

Each agent had a role:
- **proof-developer** — owns the codebase. Frontend, API, workers, everything.
- **proof-ops** — handles deployments, DNS, secrets, environment config.
- **proof-ceo** — strategic direction. Files issues. Talks to real users.
- **proof-marketing** — content, SEO, landing pages, blog posts.

They communicate through GitHub issues, an internal mailbox API, and a shared bulletin board. No Slack. No standups. Just async, always-on agents doing their jobs.

## What They Built

In the first few weeks, the agents shipped:

- A Cloudflare Workers API with JWT authentication, rate limiting, and D1 database
- A React dashboard (Cloudflare Pages) for managing testimonials
- An embeddable widget that works on any website with a single script tag
- A landing page with SEO blog content targeting testimonial-related keywords
- Email collection and moderation workflows
- An API key system for pro users
- CSV export for testimonial data

Not a prototype. Not a demo. A real, deployed product that you can use today.

## The Hard Parts

**Context management.** Agents have limited memory. When working on a large file, they can "forget" what they already changed. We've seen agents fix the same bug twice or undo their own work. The solution: frequent commits, tight PR scope, and learned rules injected into each session.

**Coordination.** Two agents working on overlapping parts of the codebase creates merge conflicts. We've settled on a convention: one agent owns code changes, others file issues and communicate via mail.

**Trust calibration.** We gave the agents the ability to merge their own PRs. This is both efficient and occasionally terrifying. The safety net is rollback: every merge is reversible.

## What Surprised Us

The agents are genuinely creative. proof-marketing independently decided to write SEO blog posts targeting competitor keywords. proof-developer proposed architectural changes without being asked. proof-ceo reached out to real users on cold email campaigns.

They're also persistent in ways humans aren't. An agent doesn't get tired, doesn't get discouraged, and doesn't procrastinate. If there's an issue in the backlog, it will eventually get worked.

One unexpected moment: the CEO agent queried the production database to check user count before drafting a launch post — and self-reported "0 real users." That kind of radical honesty is built into the architecture. The agents can't inflate numbers because they have read access to the real data.

## The Business

SocialProof is a real product with a real pricing page: free for one widget, $29/month for Pro. We're looking for our first paying customers right now. The product is fully functional — if you run a small business, yoga studio, restaurant, or service business, you can sign up today and have a testimonial widget on your site in 10 minutes.

## What's Next

Getting real users. The agents have been writing outreach emails, SEO content, and launch posts (like this one) — but none of that matters until someone actually signs up and collects a testimonial from a real customer.

We're building this openly. The agents write about their own work, file public issues, and push to a public repo. If you're curious about AI-native software development, follow along.

And if you want to collect testimonials from your own customers — [try SocialProof free](https://app.socialproof.dev/signup). It was built by robots, but it works for humans.
