# Vouch Launch Playbook — Day 0 through Day 7

**Purpose:** The moment @rsdouglas confirms the site is live, we execute this plan. No deliberating. Every hour matters in the first week.

---

## Day 0 — The moment we're live (first 2 hours)

### Verify everything works
- [ ] Visit https://socialproof.dev — landing loads
- [ ] Click "Start for free" → dashboard signup works
- [ ] Create a test widget → get embed code
- [ ] Visit collector form → submit a test testimonial
- [ ] Approve it in dashboard → appears in widget
- [ ] Visit /wall/[slug] → testimonial wall renders

### Announce in founder channels (do these personally, @rsdouglas)
Post this exact copy in each place:

**Indie Hackers (post, not comment):**
> I shipped a thing: Vouch (socialproof.dev) — a lightweight widget for collecting and displaying testimonials on any website.
>
> Built for solo founders and small businesses who want social proof without paying $29/mo for Senja or $49/mo for Trustpilot.
>
> $9/mo. Works on Webflow, Shopify, Squarespace, plain HTML. Collector form is hosted — no dev required. Built on Cloudflare Workers so it's fast everywhere.
>
> Would love feedback from the IH community. First 10 users get hands-on onboarding — I'll personally help you get your first testimonials.

**Twitter/X:**
> Shipped: Vouch ✓ — collect real testimonials, display them anywhere
>
> Problem: existing tools are $29–$299/mo. Way too much for a solo founder or small biz.
>
> Solution: same outcome, $9/mo, edge-fast widget, zero dev required
>
> socialproof.dev — first 10 users get 1:1 onboarding
>
> #buildinpublic #indiedev

### Set up Stripe (if not already)
- Create product: "Vouch Pro" $9/mo
- Add product ID to Worker secrets
- Test checkout flow

---

## Day 1 — Outreach sprint

**Identify 20 specific targets.** Don't blast — go direct.

### IH threads to comment in (search for these):
- "how do you collect testimonials" → last 3 months
- "social proof for landing page" → last 3 months
- "Senja alternative" or "Testimonial.to alternative"
- "webflow testimonials"
- Any IH "what are you building" threads from this week

**Template comment:**
> I built something for this exact problem — Vouch (socialproof.dev). It's $9/mo vs. Senja's $29. Hosted collector form so your customers don't need to go anywhere, edge-served widget so it doesn't slow your page. Happy to set you up if you want to try it.

### Direct Twitter DMs — find these people:
Search "my webflow site" OR "squarespace testimonials" OR "collecting reviews" this week. DM the ones who have under 5K followers (more likely to respond).

### Reddit — post in:
- r/webflow: "Built an alternative to Elfsight/Senja for testimonials — honest feedback welcome"
- r/squarespace: same
- r/SaaS: "I built a $9/mo testimonial widget — roast my landing page"

---

## Day 2-3 — First users → first testimonials

**Offer this deal to the first 10 signups:**
> "I'll personally help you collect your first 3 testimonials — I'll write the outreach email, set up the widget, and make sure it's working on your site. Takes 30 min on a call or async over email."

This is in `project/beta-offer.md`. Execute it. Don't wait for them to figure it out.

**First user success = first case study.** The moment someone has a working widget with real testimonials, document it and ask permission to share.

---

## Day 4-5 — Feedback loop

**Ask every user who signed up (even free):**
> "Quick question — what almost stopped you from signing up? And what would make you upgrade to Pro if you're on free?"

This is not a survey. It's a direct message. Expect 2-3 responses from 10 signups.

**Look for patterns:**
- If multiple people mention the same friction → fix it this week
- If nobody upgrades → pricing or value prop is off
- If nobody's using the widget after signup → activation is broken

---

## Day 6-7 — Amplify what's working

**Product Hunt launch (if traction is real):**
- Only do this if we have 5+ real users with live widgets
- Write a killer first comment from @rsdouglas explaining the build-in-public story
- Hunter: someone in the IH community, not @rsdouglas (more credible)

**Content (if @rsdouglas has time):**
- Write a short post on IH: "I built a Senja competitor in [X hours] — here's what I learned about the testimonial market"
- This doubles as SEO content and community credibility

---

## Success metrics for Week 1

| Metric | Target |
|---|---|
| Signups | 25+ |
| Activated (embedded widget) | 10+ |
| Paying (Pro) | 3+ |
| NPS-style responses | 5+ |

If we hit 3 paying users by Day 7, the product has PMF signal. Double down.
If we have 25 signups and 0 conversions, the pricing/value prop needs work — not the product.

---

## What CEO does during launch week

1. Monitor signups in Cloudflare D1 (or ask @rsdouglas for access to dashboard)
2. Personally reach out to every signup within 24h
3. Document feedback in `project/user-feedback-log.md`
4. If a user hits a bug → file a GitHub issue immediately with details
5. If a user asks for a feature → assess priority, file issue if it would affect 3+ others

**The goal is not to be hands-off this week. The goal is to get 3 paying users.**
