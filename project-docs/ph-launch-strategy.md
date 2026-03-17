# Product Hunt Launch Strategy — Vouch

## Target launch date
~2 weeks from first waitlist signup reaching 50. We need momentum before PH.

## Pre-launch checklist
- [ ] PH Ship page live and collecting subscribers (#92)
- [ ] socialproof.dev resolving (#90)
- [ ] At least 50 waitlist signups
- [ ] At least 5 beta users who've actually used the product (testimonials for our own PH page — meta)
- [ ] Stripe billing live (#83)
- [ ] Video demo (60-90 seconds, shows the full collector → widget flow)
- [ ] PH maker profile set up

## Launch day logistics
- Post at 12:01am PST (Tuesday or Wednesday — highest traffic days)
- First comment from maker explaining the "why" — personal story about bad testimonial tools
- Ask 10 real users to upvote + leave honest reviews
- Have someone in Hunter network submit (or self-submit)
- Reply to every comment on launch day — PH rewards engagement

## Positioning on PH

**Tagline options** (pick 1, A/B test on Ship page first):
1. "Collect and display testimonials that actually convert"
2. "Turn happy customers into your best marketing"  
3. "The testimonial tool that gets out of your way"

Recommend option 2 — most benefit-led, speaks to the outcome not the feature.

**First comment (maker note):**
> I built Vouch because I kept seeing the same pattern: founders would get amazing feedback in Slack DMs, in emails, after demos — and none of it ever made it to their website. The friction of asking + formatting + publishing was just too high.
>
> Vouch makes it a 2-minute job: send a collection link, customer fills out a quick form, you approve it, it shows up on your site via a JavaScript widget. No design work, no copy-paste, no maintaining a Google Sheet of testimonials.
>
> We're free to start. Pro ($9/mo) unlocks unlimited testimonials + custom branding + advanced widget options.
>
> Would love your feedback — especially if you've felt this pain as a founder or marketer.

## Competitor benchmarks (research before launch)
- Senja: launched on PH, 500+ upvotes, strong community response
- Testimonial.to: 800+ upvotes
- We need: 200+ upvotes to be visible in daily rankings

## What we have that they don't
- Widget-first (embed anywhere in 2 lines of JS)
- Cloudflare Workers — genuinely fast, globally distributed
- $9/mo vs Senja's $29/mo
- Open to self-hosting (makes devs love us)

## Risks
- Launching before we have real users = low engagement = poor ranking
- Senja has established community — we need a differentiated angle
- Don't launch on Friday/Saturday/Sunday — low traffic

## Decision gate
**Do not launch on PH until:**
1. 50+ waitlist signups (proof of demand)
2. 5+ active beta users who will upvote + comment authentically
3. Video demo is polished
4. All critical bugs fixed (no 500s in prod)
