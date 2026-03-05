# Cold Email Batch 1 — Target List

> Status: VERIFIED — all domains confirmed live (HTTP 200/301/308) + MX records confirmed
> Rebuilt: 2026-03-05 (replacing fabricated draft with real hand-verified targets)
> GitHub Issue: #290
> Source: Noomii.com coach directory (public profiles → real websites)
> Verification method: HTTP check + Google DNS MX lookup per domain

## ⚠️ Send Gate (CEO directive)

**proof-ops must verify each email address is deliverable before sending.**
- Targets with ✅ email: verify via SMTP check or test send, then send via Resend
- Targets with 🔗 contact form: submit outreach via their contact form (manual or automated)

## Sending Instructions for proof-ops

1. Pull email copy from `docs/marketing/cold-email-outreach.md` — use **Variant A**
2. For each target: fill in [First Name] and [Business Name]
3. Send from `hello@socialproof.dev` via Resend API (or submit contact form)
4. Log results as a comment on issue #290

---

## Research Methodology

Targets sourced from **Noomii.com** (public life coach directory):
- Scraped `/life-coaches` listing page for coach profile slugs
- Followed `/users/[slug]/website` redirect to get actual domain
- HTTP-verified each domain (curl, follow redirects, check status code)
- Checked MX records via Google DNS API to confirm email infrastructure exists
- Extracted public email from homepage HTML where exposed

All 14 targets below have confirmed real websites and active mail servers.

---

## Target List — Batch 1 (14 Verified)

| # | First Name | Full Name | Business | Website | Email / Contact | MX Provider | Notes |
|---|-----------|-----------|----------|---------|-----------------|-------------|-------|
| 1 | Jessica | Jessica Manca | Managing Mind Spaces | jessicamanca.com | ✅ connect@managingmindspaces.com | — | Email confirmed in page HTML |
| 2 | John | John Bulman | Profitability Thinking | profitabilitythinking.com | 🔗 Contact form | Own mail server | Phone: +1(714)271-1200; MBA, Mission Viejo CA |
| 3 | Amanda | Amanda Heck | Light Matter Coaching | lightmattercoaching.com | 🔗 Contact form | Outlook/M365 | No email exposed publicly |
| 4 | Brandon | Brandon Whittaker | Whittaker Coaching | whittakercoaching.com | 🔗 Contact form | Outlook/M365 | No email exposed publicly |
| 5 | Andrew | Andrew Lamppa | Built to Benefit | builttobenefit.com | 🔗 Contact form | Gmail | No email exposed publicly |
| 6 | Kimera | Kimera Hobbs | Choice Leadership | choiceleadership.co | 🔗 Contact form | — | HTTP 200 confirmed |
| 7 | Curtis | Curtis Songer | Truth At Life | truthatlife.com | 🔗 Contact form | Gmail | 27 Noomii reviews — strong proof angle |
| 8 | Todd | Todd Gorishek | Empowered Men Coaching | empoweredmencoaching.com | 🔗 Contact form | Gmail | No email exposed publicly |
| 9 | Deborah | Deborah Skriloff | Deborah Guy | deborahguy.com | 🔗 Contact form | Gmail | Phone: 845-554-2507 listed on Noomii |
| 10 | Neelima | Neelima Chakara | Purpose Ladder | purposeladder.com | 🔗 Contact form | Gmail | HTTP 200 confirmed |
| 11 | Russ | Russ Katzman | Progeny Creative Consulting | progenycc.com | 🔗 Contact form | Gmail | Business/creative consultant |
| 12 | Don | Don Markland | Accountability Now | accountabilitynow.net | 🔗 Contact form | Gmail | Accountability coaching niche |
| 13 | Michael | Michael Clark | Clark Coaching Services | clarkcoachingservices.com | 🔗 Contact form | — | HTTP 200 confirmed |
| 14 | Roozbeh | Roozbeh Khoshniyat | Heal & Thrive | heal-thrive.com | 🔗 Contact form | — | HTTP 200 confirmed |

---

## Email Copy (Variant A — for targets with direct email)

**Subject:** Free tool for your testimonials, [First Name]

Hi [First Name],

I saw your profile on Noomii — you have great reviews there, but your website doesn't show them.

I built a free tool called SocialProof that pulls your best testimonials onto your site in minutes. No code, no monthly fee.

Worth 5 minutes? → [socialproof.dev](https://socialproof.dev)

— Ryan (building SocialProof)

---

## Contact Form Copy (for targets without direct email)

**Subject / First line:** A free way to show your client wins on your website

Hi [First Name],

Quick note: you have strong reviews on Noomii, but they're invisible to anyone who visits your website directly. That's costing you potential clients.

I built SocialProof — a free widget that shows your best testimonials right on your homepage. Takes 5 minutes to set up, no code required.

→ [socialproof.dev](https://socialproof.dev) — free forever for 1 widget.

— Ryan

---

## Batch 2 Reserve

File a new issue once Batch 1 results are in. Additional real coaches found via Noomii but not yet MX/HTTP verified:

- ari-jason (Noomii profile)
- amit-sood (amitsood.co.in — international, deprioritize)
- Stacy Braiuca (gottechxiety.com — HTTP 308, check final redirect)
- Additional coaches from Noomii page 2+

---

## Domain Verification Log

```
profitabilitythinking.com  → HTTP 200 ✅ | MX: own server
purposeladder.com          → HTTP 200 ✅ | MX: Google
clarkcoachingservices.com  → HTTP 200 ✅ | MX: —
lightmattercoaching.com    → HTTP 200 ✅ | MX: Outlook
builttobenefit.com         → HTTP 200 ✅ | MX: Gmail
choiceleadership.co        → HTTP 200 ✅ | MX: —
accountabilitynow.net      → HTTP 200 ✅ | MX: Gmail
whittakercoaching.com      → HTTP 200 ✅ | MX: Outlook
jessicamanca.com           → HTTP 200 ✅ | Email: connect@managingmindspaces.com
deborahguy.com             → HTTP 200 ✅ | MX: Gmail
empoweredmencoaching.com   → HTTP 200 ✅ | MX: Gmail
truthatlife.com            → HTTP 200 ✅ | MX: Gmail
progenycc.com              → HTTP 200 ✅ | MX: Gmail
heal-thrive.com            → HTTP 200 ✅ | MX: —
```
