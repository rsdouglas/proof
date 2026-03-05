# Cold Email Outreach — SocialProof Launch Batch

> Status: COPY READY — awaiting CEO authorization + Resend credentials
> GitHub Issue: #288 (this document)
> Filed: 2026-03-05

## Background

We have a free tier live now: Free forever for 1 active widget, no credit card required.
The collection form works. This is a real product. Time to find early adopters via direct outreach.

**Important constraints before sending:**
1. Resend API key lives in Cloudflare Worker secrets — CEO must authorize API access or provide key
2. CAN-SPAM / GDPR: outreach must have a legitimate business reason + opt-out mechanism
3. Target list must be verified (no purchased lists) — warm contacts or opt-in lists only
4. Volume: start small (< 50) and track open/reply rate before scaling

---

## Email Variants (3)

### Variant A — Direct / Functional
**Subject:** Free tool for collecting customer testimonials

Hi [First Name],

I noticed [Business Name] doesn't have testimonials on your site yet.

I built a free tool for exactly this. You send customers a link, they leave a review, you embed it in one line. No account required for customers, no credit card for you.

Try it free → https://socialproof.dev

— [Your name]

---

### Variant B — Pain-led
**Subject:** The problem with asking customers for testimonials

Hi [First Name],

Asking customers for reviews is awkward. They mean to do it, then forget.

SocialProof fixes that with a simple collection link you text or email. Testimonials land in your dashboard. Embed them on your site in seconds.

Free forever for 1 widget. No card needed.

See how it works → https://socialproof.dev

— [Your name]

---

### Variant C — Founder-to-Founder
**Subject:** Quick question about your marketing

Hi [First Name],

Do your customers know what other customers think of you?

If there's nothing on your site, you're losing sales. Not because your work is bad — but because strangers can't verify you're real.

SocialProof makes testimonial collection stupid simple. Free to try, live in 5 minutes.

→ https://socialproof.dev

— [Your name]

---

## Target Criteria (for manual list building)

Look for businesses that:
- Have a real website (not just a Facebook page)
- Serve real customers (service businesses, coaches, consultants, Etsy shops, local contractors)
- Have NO testimonials page / widget visible on their site
- Are based in English-speaking markets

**Good sources to build a list:**
- Google Maps searches for "life coach [city]", "home cleaning [city]", "personal trainer [city]"
- Thumbtack / Bark.com business listings (they have contact info)
- Etsy shops with email in their profile
- LinkedIn searches for "freelance consultant"

**Do NOT scrape or purchase lists.**

---

## Sending Protocol (once authorized)

1. CEO provides Resend API key OR adds proof-marketing to Resend account
2. Send from hello@socialproof.dev (already configured in worker)
3. Batch 1: 10 emails, manual personalization
4. Track replies (Resend dashboard)
5. If reply rate > 5%, scale to 50
6. File each batch as a comment on issue #288

---

## Legal Checklist (before sending)

- [ ] Each email includes unsubscribe mechanism
- [ ] Sender is identified (real person name + company)
- [ ] No deceptive subject lines
- [ ] Physical address in footer (CAN-SPAM req)
- [ ] Privacy policy linked on socialproof.dev
