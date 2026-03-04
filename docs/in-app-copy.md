# Vouch — In-App Copy Spec

**Owner:** proof-marketing  
**Last updated:** 2026-03-04  
**Purpose:** Canonical copy for all in-product moments. Dev should use this as the source of truth for UI text.

---

## Philosophy

Every string in the product is a marketing moment. Good copy:
- Tells the user what to do, not just what the product does
- Uses the language small business owners use ("customers," "reviews," "testimonials" — not "entities," "records," "forms")
- Creates forward momentum — each screen nudges to the next step
- Never makes users feel stuck or broken

---

## Onboarding — Getting Started Checklist

Based on the corrected UX model (account-level collection link → testimonials pool → widgets for display):

### Step 1: Share your collection link
**Heading:** Share your collection link  
**Body:** Send this link to a happy customer. They'll submit a testimonial in under 2 minutes.  
**CTA:** Copy your link  
**Sub-text:** You can also put this link in your email signature, post-purchase emails, or anywhere you talk to customers.

### Step 2: Approve your first testimonial
**Heading:** Review your first testimonial  
**Body:** Once a customer submits, you'll get to approve it before it goes anywhere.  
**CTA:** Go to Testimonials →  
**Empty state (pre-submission):** Waiting for your first submission. Check back here after you share your link.

### Step 3 (Optional): Add Vouch to your site
**Heading:** Display testimonials on your website  
**Body:** Paste one line of code. Your approved testimonials show up automatically.  
**CTA:** Create a widget →  
**Badge:** Optional

---

## Empty States

### Testimonials page — zero testimonials
**Heading:** No testimonials yet  
**Body:** Share your collection link with a happy customer to get your first one.  
**CTA button:** Copy your collection link  
**Secondary link:** How do I ask for testimonials? (links to docs/collecting.md)

### Testimonials page — zero approved (some pending)
**Heading:** You have [N] testimonial(s) waiting for your review  
**Body:** Check the Pending tab to approve or reject.  
**CTA button:** Review pending testimonials

### Widgets page — zero widgets
**Heading:** No widgets yet  
**Body:** Create a widget to display your approved testimonials on your website. Paste one line of code — done.  
**CTA button:** Create your first widget  
**Below CTA (small text):** Don't have testimonials yet? [Collect some first →]

### Analytics page — zero events
**Heading:** Your analytics will appear here  
**Body:** Once you add a Vouch widget to your website, you'll see views and interactions here.  
**CTA button:** Create a widget →  
**Sub-text:** Analytics tracks how visitors engage with your embedded testimonials.

### Widget detail — zero approved testimonials
**Heading:** No testimonials to display yet  
**Body:** This widget will automatically show your approved testimonials once you have some. Go collect your first one.  
**CTA button:** Copy your collection link

### Collect page (post-UX fix — just shows the link)
**Heading:** Your collection link  
**Body:** Share this with customers to collect testimonials. It works on mobile, takes under 2 minutes, and lands directly in your approval queue.  
**Link display:** [your-link] [Copy]  
**Tips section:**
- **After a project:** "It was great working with you — I'd love your feedback: [link]"
- **Post-purchase email:** "Thanks for your order! A quick review would mean a lot: [link]"
- **Email signature:** Add "Share a testimonial →" as a footer link

---

## Pro Upgrade — Waitlist Modal

*(Interim until Stripe is live — per issue #91)*

**Modal title:** You've hit the Free plan limit  
**Body:** You're on Vouch Free — 1 active widget, unlimited testimonials. Pro gives you unlimited widgets, custom branding, and Google rich results schema.  
**Join waitlist CTA:** Join the Pro waitlist  
**Dismiss:** Stay on Free  
**Below CTA (small):** You'll be first to know when Pro launches. No credit card required.

**Waitlist confirmation (inline):**  
✓ You're on the list. We'll email you at [email] when Pro is ready.

---

## Pro Upgrade — Full Upgrade Page

*(For when Stripe is live)*

### Plan comparison table copy

| | Free | Pro |
|--|------|-----|
| Widgets | 1 active | Unlimited |
| Testimonials | Unlimited | Unlimited |
| Collection links | 1 | Unlimited |
| Custom branding | ✗ | ✓ |
| Google rich results | ✗ | ✓ |
| Priority support | ✗ | ✓ |
| Price | Free forever | $9/month |

**Free plan description:** Perfect for getting started. One widget, all the testimonials you can collect.  
**Pro plan description:** For businesses serious about social proof. Unlimited everything, custom branding, and SEO superpowers.

**Upgrade CTA:** Upgrade to Pro — $9/month  
**Below CTA:** Cancel anytime. No lock-in.

---

## Email — Testimonial Request (sent via dashboard)

**Subject:** [First name], I'd love your feedback  
**Preview text:** Takes 2 minutes — here's a direct link

**Body:**
> Hi [Name],
>
> It was great working with you on [context if provided]. I'm collecting feedback from customers to help others know what to expect — your testimonial would mean a lot.
>
> It takes under 2 minutes:
> **[Share your thoughts →]** (big CTA button)
>
> Thank you,  
> [Business name]

**Footer (small):** You received this because [Business name] uses Vouch to collect testimonials. Don't want emails like this? [Unsubscribe]

---

## Collector Form — Customer-Facing

*(What customers see at the collection link)*

**Page title:** Share your experience with [Business name]  
**Intro:** [Business name] would love to hear what you think. It takes about 2 minutes.

**Fields:**
- Your name * (placeholder: "Jane Smith")
- Your title or company (placeholder: "Freelance designer / Acme Co." — optional)
- Star rating (optional — 1 to 5 stars)
- Your testimonial * (placeholder: "What was your experience like? What would you tell someone considering working with [Business name]?")

**Submit button:** Submit my testimonial

**Confirmation:**  
✓ **Thank you!** Your testimonial has been submitted. [Business name] will review it shortly.

---

## Notifications & Success Messages

### Testimonial submitted (notification to business owner)
**Subject:** New testimonial from [Customer name]  
**Body:** [Customer name] just submitted a testimonial. [Review it →]

### Testimonial approved
*(In-dashboard toast)* ✓ Testimonial approved. It's now showing in your widgets.

### Testimonial rejected
*(In-dashboard toast)* Testimonial rejected and removed from your queue.

### Widget created
*(In-dashboard toast)* ✓ Widget created. Here's your embed code:

### Collection link copied
*(In-dashboard toast)* ✓ Link copied. Share it with a customer!

---

## Error States

### Generic error
**Heading:** Something went wrong  
**Body:** We couldn't complete that action. Try again, or [contact support] if it keeps happening.

### Rate limit (testimonial submission)
**Body:** We've received this submission. If you meant to submit from a different account, please wait a few minutes and try again.

### Invalid collection link
**Heading:** This link isn't active  
**Body:** The collection link you followed may have expired or been deactivated. Contact [business name] for a new link.

---

## Dashboard Navigation Labels

- **Home** (not "Dashboard") — feels warmer
- **Testimonials** — the single pool
- **Collect** — your collection link (simplified per UX fix)
- **Widgets** — display on your site
- **Analytics** — views and engagement
- **Settings** — account, billing, integrations

---

## Settings Page — Billing Section

**Free plan badge:** Free forever  
**Pro plan badge:** Pro  

**Free plan text:** You're on the Free plan — 1 active widget, unlimited testimonials collected.  
**Upgrade link:** Upgrade to Pro →

**Pro plan text:** You're on Vouch Pro. Thank you for supporting us.  
**Manage billing link:** Manage billing →

---

## Microcopy Glossary

Use these terms consistently. Never use the alternatives.

| Use this | Not this |
|----------|----------|
| Testimonial | Review, feedback, response |
| Collection link | Form, collector, survey |
| Widget | Embed, plugin, snippet |
| Approve | Accept, publish, activate |
| Business name | Store, company, account |
| Customers | Users, respondents, people |
| Display | Show, render, embed |
