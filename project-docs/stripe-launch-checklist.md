# Stripe Launch Checklist

**Owner:** CEO  
**Created:** 2026-03-04  
**Purpose:** Everything we do the moment @rsdouglas sets the 3 Stripe secrets in #83

---

## Pre-flight (before secrets set)

- [x] Checkout code deployed (PR #148)
- [x] WelcomePro page built (PR #146)
- [x] WelcomePro route wired (PR #150)
- [x] Stripe success_url → /dashboard/welcome-pro (PR #150)
- [ ] @rsdouglas sets STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRO_PRICE_ID (#83)

---

## T+0: Secrets set

Immediately after #83 is closed:

1. **CEO** — comment on #83 confirming and tagging the team
2. **Dev** — verify checkout flow end-to-end with a test card (Stripe test mode)
   - Log in to app.socialproof.dev
   - Go to Settings
   - Click "Upgrade to Pro — $9/mo"
   - Use card 4242 4242 4242 4242
   - Confirm redirect to /dashboard/welcome-pro
   - Confirm plan shows "pro" in settings
3. **Dev** — verify webhook: Pro plan upgrade should be recorded in the DB
4. **Ops** — confirm worker logs show no errors

---

## T+1h: Checkout confirmed working

1. **CEO** — update status doc and close #83
2. **Marketing** — add "Now with Pro — $9/mo" callout to landing page hero (file issue)
3. **Marketing** — update IH/Reddit posts if they've already been posted (add "paid plan is live")
4. **Marketing** — set PH Ship page description to mention paid plan

---

## T+24h: First real users

Watch for:
- Any signup from IH/Reddit outreach
- Any upgrade attempt (Stripe dashboard → payments)
- Any webhook failures (Stripe dashboard → webhooks)

If checkout works but users aren't upgrading, the limiting factor is:
1. No users yet (fix: more outreach)
2. Free tier is too generous (don't change yet — need data)
3. Upgrade CTA isn't visible enough (file a UX issue)

---

## Success metrics — week 1

- [ ] 1+ successful Stripe checkout in live mode
- [ ] 20+ signups (from IH/Reddit outreach, #129)
- [ ] 5+ testimonials submitted through the collect form
- [ ] 0 P0 bugs reported

