# SocialProof Onboarding Email Drip Sequence

> **For proof-developer**: Wire these to Resend. Trigger: new user signup.  
> Audience: free-tier users who signed up but haven't activated their widget yet.  
> Schedule: Day 0 (immediate), Day 2, Day 5, Day 9, Day 14.

---

## Email 1 — Day 0: Welcome + First Action

**Subject:** Your SocialProof account is ready — here's what to do first

**From:** SocialProof <hello@socialproof.dev>  
**Reply-to:** hello@socialproof.dev

---

Hi {{first_name}},

You just made a smart move. Customer testimonials are the #1 trust signal that converts skeptical visitors — and you now have everything you need to collect and display them.

**Here's your one thing to do today:**

1. Go to your [dashboard](https://app.socialproof.dev)
2. Copy your collection link
3. Send it to your 3 happiest customers (text message works great)

That's it. When they submit, you'll get an email and their testimonial will be waiting for you to approve.

**Your widget is pre-built.** Once you approve a testimonial, add one line to your site and it goes live:

```html
<script src="https://cdn.socialproof.dev/widget.js" data-id="YOUR_ID"></script>
```

Takes under 2 minutes. [See the setup guide →](https://socialproof.dev/docs/embed-guide)

Welcome aboard,  
The SocialProof team

---

*Free forever for 1 active widget · No credit card required*  
*[Dashboard](https://app.socialproof.dev) · [Help docs](https://socialproof.dev/docs) · [Unsubscribe]({{unsubscribe_url}})*

---

## Email 2 — Day 2: The "Send Your Link" Nudge

**Subject:** Have you sent your collection link yet?

**From:** SocialProof <hello@socialproof.dev>

---

Hi {{first_name}},

Two days ago you signed up for SocialProof. Quick question: have you sent your testimonial collection link to a customer yet?

If not, no worries — it takes 30 seconds. Here's how most people do it:

**The easiest method: text message**

> "Hey [name], quick favor — would you mind leaving a short review? [your collection link] Takes about 60 seconds. Thanks!"

That's it. Send that to your 3 best customers right now.

Why text? Because response rates are 3-5x higher than email for this kind of ask. People check texts.

[Go to your dashboard →](https://app.socialproof.dev)

Your link is on the Collect tab.

— SocialProof

---

*[Unsubscribe]({{unsubscribe_url}})*

---

## Email 3 — Day 5: The "First Testimonial" Win

**Subject:** What your first testimonial can do for your business

**Trigger variant A (no testimonials yet):** Send this copy  
**Trigger variant B (has ≥1 testimonial):** Skip — send the "Widget Live" congratulations email instead (see Email 3B below)

---

Hi {{first_name}},

Here's something that might surprise you: for most small businesses, **one well-placed testimonial** outperforms a month of social media posts.

Why? Because testimonials speak to doubt. When a visitor lands on your site and thinks "will this actually work for me?" — a real customer story answers that question better than anything you can write yourself.

The businesses that convert best usually show testimonials:
- On the homepage, above the fold
- On the pricing page, next to the price
- On any page where you're asking someone to buy or book

**Ready to get your first one?**

[Open your collection link](https://app.socialproof.dev) and send it to your happiest customer. Ask them: "What problem did I solve for you? How has it helped?" You'll get a testimonial you can actually use.

— SocialProof

---

## Email 3B — Day 5 (variant): First Testimonial Approved 🎉

**Subject:** You got a testimonial — here's how to show it off

**Trigger:** user has ≥1 approved testimonial but widget not yet installed

---

Hi {{first_name}},

You have a testimonial. That's the hard part done.

Now let's put it to work. **Adding it to your site takes 2 minutes:**

1. Go to your [dashboard](https://app.socialproof.dev) → Widget tab
2. Copy the one-line script
3. Paste it into your site before the closing `</body>` tag

It works on **WordPress, Squarespace, Wix, Webflow, Shopify, and any custom site**.

[Step-by-step guide for each platform →](https://socialproof.dev/docs/embed-guide)

Once it's live, every new testimonial you approve automatically appears in the widget. No code changes needed.

— SocialProof

---

## Email 4 — Day 9: The "Social Proof Science" Value Email

**Subject:** Why your customers trust other customers more than they trust you

**Trigger:** Send regardless of state (pure value, no hard sell)

---

Hi {{first_name}},

There's a concept called **social proof** — the psychological tendency to trust the choices of people like us.

It's why Amazon reviews sell products. Why "1,200 happy customers" on a landing page beats a paragraph about your expertise. Why Yelp exists.

The thing is: most small businesses know this matters, but they never actually collect testimonials. The usual reasons:

- "I don't want to seem pushy"
- "I keep forgetting to ask"
- "I'm not sure where to put them"

Here's what the data says: **92% of consumers read reviews before buying.** And customers who see at least one review convert at 3.5x the rate of those who don't.

You've already solved the hardest part by signing up. Your collection link is waiting.

If you've already sent it and you're waiting for responses: try following up with one reminder text. "Hey, did you get a chance to leave that review?" — 40% of first-time asks convert on the follow-up.

[Go to your dashboard →](https://app.socialproof.dev)

— SocialProof

P.S. If you're getting stuck anywhere — setup, embeds, anything — reply to this email and I'll help personally.

---

## Email 5 — Day 14: The Upgrade Pitch (Paid Tier)

**Subject:** Unlock unlimited testimonials for your business

**Trigger variant A (widget not yet installed):** Lead with activation  
**Trigger variant B (widget live):** Lead with upgrade

---

**Variant A (not activated):**

Hi {{first_name}},

It's been two weeks since you signed up, and I want to make sure SocialProof is actually working for you.

A lot of people sign up and mean to set it up "later" — and then later never comes.

If you hit a snag — your site platform isn't listed, the embed code didn't work, you're not sure where to put it — reply to this email. We'll fix it together, for real.

Your free account is still here. [Let's get it working →](https://app.socialproof.dev)

— SocialProof

---

**Variant B (widget live, ≥1 testimonial):**

Hi {{first_name}},

You're using SocialProof and it's working. Nice.

Your free plan includes **1 active widget** with unlimited testimonial submissions. That covers most solo businesses.

If you're ready to go further, **SocialProof Pro** unlocks:

- **Unlimited widgets** — one for each product, service, or page
- **Custom branding** — replace "Powered by SocialProof" with your own identity
- **Priority collection** — get notified instantly and track response rates
- **Analytics** — see which testimonials drive the most engagement

Most businesses upgrade when they launch a second product or run a campaign for a specific service.

[See pricing →](https://socialproof.dev/pricing)

Still free and happy? That's great too. I just wanted you to know the option is there.

— SocialProof

---

## Implementation Notes for proof-developer

### Trigger
- Email 1: immediate on signup confirmation
- Emails 2-5: time-delayed from signup date
- Skip emails 2-3 if user has completed setup (widget installed + testimonial approved)

### Personalization variables
- `{{first_name}}` — from signup form or fallback "there"
- `{{unsubscribe_url}}` — Resend-managed unsubscribe link
- `{{collection_link}}` — user's unique testimonial collection URL

### State-based skipping
| Email | Skip condition |
|-------|---------------|
| Email 2 | Has sent collection link (track link clicks if possible) |
| Email 3A | Has ≥1 approved testimonial → send 3B instead |
| Email 5 | Has not activated → send variant A; activated → send variant B |

### Resend setup
- API key lives in GitHub repo secrets (`RESEND_API_KEY`)
- Domain: hello@socialproof.dev  
- See issue #653 for wiring spec
- Unsubscribe: use Resend's built-in unsubscribe management

---

*File: docs/marketing/EMAIL_DRIP_SEQUENCE.md*  
*Owner: proof-marketing*  
*Ready for: proof-developer to wire via Resend (issue #653)*
