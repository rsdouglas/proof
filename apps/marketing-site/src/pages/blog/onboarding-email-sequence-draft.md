---
layout: ../../layouts/BlogPost.astro
title: "Onboarding Email Sequence — Internal Draft (SocialProof Free Trial)"
description: "Internal draft of the onboarding email drip for new SocialProof free-plan signups. 5 emails over 14 days."
publishedAt: "2025-01-01"
author: "SocialProof Team"
draft: true
---

> **INTERNAL DRAFT** — This is NOT a public blog post. This is the proposed onboarding email sequence for new free-plan signups. Filed here for dev review and iteration before wiring to Resend.

---

# SocialProof Onboarding Email Sequence

**Goal:** Get users from signup → first testimonial collected → widget live on their site → upgrade consideration.

**Trigger:** User completes signup (email confirmed).

**Duration:** 14 days, 5 emails.

---

## Email 1 — Welcome (Immediate, T+0)

**Subject:** Your social proof widget is ready 🎉

**From:** team@socialproof.dev

**Body:**

Hey [First Name],

You just made a smart move.

Your SocialProof widget is set up and waiting. Here's what to do in the next 10 minutes:

**Step 1:** Copy your embed code from your dashboard.
**Step 2:** Paste it on your website (homepage or service page).
**Step 3:** Send your collection link to your 3 happiest customers and ask for a quick quote.

That's it. By tomorrow you could have real testimonials live on your site.

→ [Go to your dashboard](https://app.socialproof.dev/dashboard)

Talk soon,  
The SocialProof Team

P.S. — The free plan gives you 1 active widget, forever. No credit card. No expiration.

---

## Email 2 — First Testimonial Prompt (T+1 day)

**Subject:** The fastest way to get your first testimonial today

**From:** team@socialproof.dev

**Body:**

Hey [First Name],

The #1 reason people don't get testimonials is simple: they don't ask.

Here's a message you can copy-paste right now and send to your best customer:

---
*"Hey [Name] — I'm adding a testimonials section to my website and you'd be the perfect person to be featured. Would you mind writing 1-2 sentences about your experience working with me? Here's the link: [your collection link]*

*Takes 2 minutes and would mean a lot. Thanks!"*

---

That's all it takes.

→ [Copy your collection link](https://app.socialproof.dev/dashboard)

— The SocialProof Team

---

## Email 3 — Value / Social Proof About Social Proof (T+3 days)

**Subject:** Why testimonials convert 4x better than product descriptions

**From:** team@socialproof.dev

**Body:**

Hey [First Name],

Quick stat: 88% of consumers trust online reviews as much as personal recommendations.

But here's what most business owners miss: **it's not just about having reviews somewhere — it's about having them *where prospects are deciding*.**

That's what makes SocialProof different. Your testimonials live on *your* website, on *your* service page, right next to your contact form or booking button. Not buried on Google or Yelp where your competitors are right next to you.

**The businesses that convert best have testimonials:**
- On their homepage (builds immediate trust)
- On their pricing or service page (reduces hesitation at the moment of decision)
- On their contact page (converts the 40% who almost reach out but don't)

Have you embedded your widget yet?

→ [Go to your dashboard](https://app.socialproof.dev/dashboard)

— The SocialProof Team

---

## Email 4 — Upgrade Nudge (T+7 days)

**Subject:** Unlock all your testimonials (quick question)

**From:** team@socialproof.dev

**Body:**

Hey [First Name],

How's it going with SocialProof?

If you've collected a few testimonials already — nice work. If you haven't yet, it's not too late. Your collection link is waiting in your dashboard.

**One thing worth knowing:** the free plan gives you 1 active widget. If you want to show testimonials on multiple pages — your homepage *and* your services page, for example — the Growth plan unlocks unlimited widgets.

Most of our customers upgrade when they realize they want the widget on more than one place. 

→ [See plans](https://app.socialproof.dev/upgrade)

No pressure — the free widget works great for a long time. Just wanted you to know the option is there.

— The SocialProof Team

---

## Email 5 — Check-in / Re-engagement (T+14 days)

**Subject:** Quick check-in from SocialProof

**From:** team@socialproof.dev

**Body:**

Hey [First Name],

It's been two weeks since you signed up. I wanted to check in.

**If you've collected testimonials and your widget is live:** amazing. That's exactly what this is for. Reply and let me know how it's going — I'd love to hear.

**If you haven't gotten started yet:** totally normal. Things get busy. Here's the one thing I'd suggest:

> Pick your top 3 customers. Open a text or email. Send this: *"Hey, I'm adding testimonials to my site — would you write a quick sentence about working with me? [link]"*

That's your entire job. Takes 3 minutes. The results are worth it.

→ [Back to your dashboard](https://app.socialproof.dev/dashboard)

Always here if you have questions,  
The SocialProof Team

---

## Implementation Notes (for dev)

- **Trigger:** Email confirmed → enqueue sequence in Resend
- **Personalization fields needed:** `first_name`, `collection_link`, `dashboard_url`
- **Unsubscribe:** Standard Resend footer required on all emails
- **Suppression:** If user upgrades before Email 4 fires, suppress Email 4 and replace with a congratulations email
- **Analytics to track:** Open rate, click rate on CTA, conversion to first testimonial collected, upgrade within 14 days

Filed as a dependency of the product launch. See GitHub issue for dev handoff.
