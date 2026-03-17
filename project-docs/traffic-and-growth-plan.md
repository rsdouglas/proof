# Traffic & Growth Plan — Post-Waitlist

**Written:** 2026-03-04  
**Context:** PR #113 kills the waitlist. When it merges, visitors can sign up directly. But who are the visitors? This doc answers: how do we get the first 100 users?

---

## The Funnel Today

```
Traffic → socialproof.dev → [used to: waitlist form] → [soon: app.socialproof.dev/signup]
```

Once PR #113 merges, the conversion path works. The bottleneck becomes: **no traffic**.

---

## First 100 Users: The Plan

### Tier 1: Zero-cost, high-intent (start now)

**1. Waitlist outreach (issue #89)**  
We have email addresses from the waitlist form. These are warm. When Resend (#94) is wired, send:  
- "You're in — start now, it's free" email to everyone on the list  
- No drip needed yet. One email: here's the link, here's how to embed a widget in 5 minutes.

**2. IndieHackers & Reddit (issue #79)**  
Post in:
- r/EntrepreneurRideAlong — "I built a simple testimonial widget, free tier, no credit card"
- r/SideProject — launch post
- IndieHackers — milestone post: "shipped my first SaaS"
- r/webdev — "Show HN"-style: here's what I built and how the widget works

Key: these audiences respond to builders, not polish. Honest, minimal, "I made this" framing.

**3. Product Hunt Ship (issue #92)**  
Get on Product Hunt Ship now while building the subscriber list ahead of a proper PH launch.  
Planned PH launch: ~2 weeks after first paying customer.

### Tier 2: SEO (start now, pays off in 60-90 days)

**4. Blog — long-tail keywords**  
Target:
- "how to add testimonials to webflow site"
- "best free testimonial widget for small business"
- "how to collect customer reviews without paying for software"
- "testimonial widget for squarespace"

Each post: practical, walkthrough, ends with a widget embed. Blog is live at socialproof.dev/blog.  
File a marketing issue for blog post #1.

### Tier 3: Direct outreach (when we have a working product to show)

**5. Reach out to Webflow/Framer/Squarespace communities**  
These users are constantly looking for plugins and embeds. We support all of them.  
Target: community forums, Facebook groups, Discord servers.

**6. Founder communities**  
MicroConf Slack, Indie Hackers, Makerpad. DM people who complain about expensive testimonial tools.

---

## What We're NOT Doing (yet)

- Paid ads — too early, no conversion data yet
- Influencer outreach — not enough social proof ourselves
- AppSumo — possible later if we want to spike users, but devalues Pro

---

## Success Metrics

| Milestone | Target Date |
|-----------|------------|
| PR #113 merged | ASAP (today) |
| First organic signup (non-test) | Within 3 days of PR #113 merge |
| First 10 signups | 1 week post-merge |
| First Reddit/IH post live | Within 48h of PR #113 merge |
| First blog post published | Within 1 week |
| First paying customer | When Stripe (#83) is wired |

---

## Decisions needed from @rsdouglas

1. Merge PR #113 (issue #119)
2. Wire Resend (#94) — enables waitlist email
3. Wire Stripe (#83) — enables paid conversion

Everything else the team can execute autonomously.
