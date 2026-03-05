# Rename Playbook: Vouch → Credible

**Status:** DRAFT — pending rsdouglas confirmation in #255  
**Trigger:** When @rsdouglas confirms "Credible" in issue #255 and registers credible.dev

---

## Why Credible

- Zero products named Credible in testimonials/social proof space
- Conceptually precise: makes your business *credible* to buyers
- `credible.dev` available to register
- "Vouch" and "SocialProof" both have naming conflicts in our space

---

## What Changes (by role)

### @rsdouglas (human — must do these)
1. **Register credible.dev** at Cloudflare Registrar → Domain Registration
2. Add credible.dev to Cloudflare account (same account as socialproof.dev)
3. Update Resend sender email: `hello@credible.dev` (after DNS configured)

### @proof-ops (infra)
1. Add credible.dev custom domain to Cloudflare Pages (proof-landing)
2. Add app.credible.dev to Cloudflare Pages (proof-dashboard)  
3. Add api.credible.dev route to vouch-worker
4. Add widget.credible.dev route to vouch-widget worker
5. Set up 301 redirects: socialproof.dev/* → credible.dev/*
6. Keep widget.socialproof.dev/v1/vouch.js alive (existing embeds) — proxy to widget.credible.dev
7. Update wrangler.toml DKIM_DOMAIN → "credible.dev"

### @proof-dev (code)
1. Update landing page HTML: brand name "Vouch" → "Credible" everywhere
2. Update dashboard HTML: brand name "Vouch" → "Credible"
3. Update email templates: from/reply-to addresses, brand references
4. Update widget script: CDN path, branding
5. Update og:image, favicon, meta tags
6. Update docs/ references

### @proof-marketing (content)
1. Update /vs/ comparison pages with Credible brand
2. Update /for/ landing pages with Credible brand
3. Update all blog posts with Credible brand
4. File new IH post: "We renamed to Credible — here's why"
5. Update content catalog

---

## What Does NOT Change (to protect SEO)
- Existing blog post URLs (keep /blog/vouch-vs-birdeye as a redirect if indexed)
- Widget script functionality (just CDN path changes with redirect)
- All customer data — stored in D1, no changes needed
- Internal Cloudflare Worker names (vouch-worker, vouch-widget) — cosmetic only

---

## Migration Window
1. Register credible.dev (day 0)
2. Dev + ops make changes on a branch (day 1-2)
3. QA: verify all flows work on credible.dev (day 2)
4. DNS cutover: credible.dev goes live, socialproof.dev redirects (day 3)
5. Widget redirect: socialproof.dev/v1/vouch.js → credible.dev/v1/credible.js
6. Marketing: announce rename, post on IH, update socials (day 3)

Total: ~3 days from green light to live.

---

## Issues to file when @rsdouglas confirms

- [ ] ops: add credible.dev to Cloudflare account + Pages custom domains
- [ ] ops: 301 redirects socialproof.dev → credible.dev
- [ ] ops: keep widget.socialproof.dev alive for 90-day migration window  
- [ ] dev: rename brand from Vouch → Credible in landing + dashboard
- [ ] dev: update email templates with credible.dev addresses
- [ ] marketing: update all /vs/ and /for/ content for Credible brand
- [ ] marketing: write rename announcement for IH
- [ ] human: register credible.dev, update Resend sender

