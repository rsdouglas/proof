# Competitive Analysis
*Proof — Social Proof Widget Platform*
*Last updated: 2026-03-04*

## TL;DR

The space has incumbents (Proof, Fomo, TrustPulse) that are expensive and complex, and free options (Elfsight) that are limited and branded. We win on simplicity, price, and Cloudflare edge performance. Our wedge is the "zero-friction collector" — the hosted form that email-solicits testimonials without requiring the customer to create an account.

---

## Competitors

### 1. Proof (useproof.com) — the OG
- **Price:** $29–$299/mo
- **Core product:** Live visitor counts + recent activity popups ("Sarah from Chicago just bought X")
- **Strengths:** Strong brand, A/B testing, converts well for e-commerce
- **Weaknesses:** Expensive, requires traffic volume to work, no testimonial collection, no review widgets
- **Our angle:** They track live visitors. We showcase curated testimonials. Different product, same surface area. Their name is a problem for us — we should consider `proofwidget.com` or `getproof.io` if `useproof.com` is crowded with that brand

### 2. Fomo (fomo.com)
- **Price:** $19–$99/mo
- **Core product:** Social proof notifications (popup "someone just did X")
- **Strengths:** 60+ integrations, good UI, established
- **Weaknesses:** Still requires real transaction data, expensive, no static testimonial widgets
- **Our angle:** We don't need a data feed — we *collect* testimonials ourselves. Fomo needs Shopify data; we work anywhere

### 3. TrustPulse (trustpulse.com)
- **Price:** $5–$19/mo (very cheap tier)
- **Core product:** Same as Fomo — activity/purchase notifications
- **Strengths:** Cheapest in class, WordPress plugin available
- **Weaknesses:** WordPress-focused, no testimonial widget, no collection mechanism
- **Our angle:** Different product category. They show "5 people are viewing this" — we show "Here's what real customers said." Different psychological trigger.

### 4. Elfsight (elfsight.com)
- **Price:** Free / $5–$30/mo
- **Core product:** Widget marketplace including Google Reviews, Testimonials, Instagram feeds
- **Strengths:** Huge variety, easy embed, very cheap, has testimonial widget
- **Weaknesses:** Pulls from Google/FB — no collection mechanism, widgets are generic, slow (3rd party CDN), shows Elfsight branding
- **Our angle:** We *collect* the testimonials ourselves instead of pulling from Google. Much cleaner widget. Edge-served = faster. Dedicated product = better UX.

### 5. Senja (senja.io) — closest competitor
- **Price:** Free (limited) / $29/mo
- **Core product:** Testimonial collection + wall of love widgets
- **Strengths:** Polished UI, good collection form, integrates with Loom for video testimonials
- **Weaknesses:** $29/mo feels expensive for small sites, can be complex, US-only video
- **Our angle:** **This is our most direct competitor.** We must be cheaper ($9/mo vs $29/mo) and simpler. Senja targets agencies; we target solo founders and store owners.

### 6. Testimonial.to
- **Price:** Free / $25–$50/mo
- **Core product:** Video + text testimonials, wall of love
- **Strengths:** Good video UX, clean design
- **Weaknesses:** Expensive, complex, overkill for most sites
- **Our angle:** Same as Senja — we're simpler and cheaper. We skip video (Phase 1) and win on speed of setup.

### 7. Trustmary (trustmary.com)
- **Price:** $19–$199/mo
- **Core product:** Review + testimonial + NPS collection with widgets
- **Strengths:** Comprehensive, multiple channels
- **Weaknesses:** Very expensive, enterprise-focused
- **Our angle:** We're 10x cheaper for 80% of the value they provide

---

## Positioning Map

```
                     EXPENSIVE
                         |
    Proof.com     Testimonial.to
                         |
    Senja --------+------+------ Trustmary
     Fomo         |      |
                         |
              [US HERE]  |
  TrustPulse             |
                         |
  Elfsight               |
                     CHEAP
         SIMPLE ←————————→ COMPLEX
```

We want to own: **cheap + simple + fast setup**. Nobody owns that clearly for testimonials specifically.

---

## Feature Comparison

| Feature | Proof (us) | Senja | Elfsight | TrustPulse |
|---------|-----------|-------|----------|------------|
| Testimonial collection | ✓ (hosted form) | ✓ | ✗ | ✗ |
| Text widget | ✓ | ✓ | ✓ | ✗ |
| Activity popup | Roadmap | ✗ | ✗ | ✓ |
| Video testimonials | Roadmap | ✓ | ✗ | ✗ |
| Edge CDN | ✓ Cloudflare | ✗ | ✗ | ✗ |
| Moderation | ✓ | ✓ | ✗ | ✗ |
| No branding (paid) | ✓ | ✓ | ✓ | ✓ |
| Setup time | ~5 min | ~10 min | ~5 min | ~5 min |
| **Price (starting)** | **$9/mo** | **$29/mo** | **$5/mo** | **$5/mo** |

---

## Our Differentiators (ranked)

1. **Hosted collector form** — email a link, customer fills it out. No account needed. Nobody else does this as simply.
2. **Edge performance** — Cloudflare global network means <50ms widget load anywhere. Elfsight is slow; this matters.
3. **$9/mo Pro** — Senja is 3x more expensive. We're cheaper for a better product.
4. **Moderation** — Approve/reject before publishing. Elfsight shows all Google reviews (can't curate).
5. **Pure testimonials** — Not trying to do live visitor counts AND testimonials AND NPS. One thing, done well.

---

## Risks

1. **Senja** copies our collector form UX (they could, it's not patented)
2. **Proof.com** brand confusion — our name is the same as the OG social proof tool. CEO note: worth reconsidering brand if domain #25 shows `useproof.com` is crowded with their SEO. Alternative: `Kudos`, `Vouch`, `Sayso`.
3. **TrustPulse** drops price further — unlikely, they're already losing to Fomo
4. **Google/Trustpilot** embeds become more common — but they're not curated, and we're complementary

---

## Beta Pitch (what to say to first 10 users)

> "You know those little quote blocks on landing pages — 'This tool saved me 10 hours a week — Jane, CEO'? That's a testimonial widget. Right now, getting one means copy-pasting from email, formatting it manually, and hard-coding it into your site. Proof makes this automatic: email your customer a link, they fill out a form in 30 seconds, you approve it, and it shows up on your site instantly. $9/month. Takes 5 minutes to set up. That's it."

---

## CEO Notes

- Don't build video testimonials until we have 100 paying users. Senja has it; it adds complexity.
- The activity popup ("Maria just left a testimonial") is Phase 2 and is our moat against TrustPulse.
- Consider renaming before any real marketing push — "Proof" has SEO competition from useproof.com.
- Shopify App Store is the distribution channel that wins this market. File a Phase 3 issue for that.
