# Onboarding Email Drip Sequence

Three emails sent after a user signs up for SocialProof. Goal: get them to the activation event — **sending the collect link to their first real customer.**

Sent via Resend. From: `team@socialproof.dev`. Reply-to: same.

---

## Email 1: Welcome (Day 0, sent immediately on signup)

**Subject:** You're in — here's your SocialProof link 👇

---

Hey [First name],

Welcome to SocialProof. You're 3 minutes away from your first testimonial.

Here's your personal collection link:

**[https://socialproof.dev/c/frm_[form-id]]**

Send this link to one customer who you know had a great experience. Just copy this text into an email or DM:

> "Hey [name] — I'm collecting a quick testimonial for my website. Would you mind sharing a few words? Takes 2 minutes: [link]"

That's literally it.

Once they submit, you'll get an email. You approve it, and a widget appears on your site with their words.

The widget code is in your dashboard. One paste. Any website.

Questions? Just reply to this email.

— The SocialProof team

P.S. Most people who get a testimonial in the first 24 hours stay with SocialProof. Most people who don't... forget about it. Don't forget about it.

---

## Email 2: Nudge (Day 2, send only if no collect link click yet)

**Subject:** Did you send the link yet?

---

Hey [First name],

Quick check-in: have you sent your SocialProof link to a customer yet?

Here it is again:

**[https://socialproof.dev/c/frm_[form-id]]**

I know it feels weird to ask for a testimonial. Here's what actually works:

**Just ask someone you already know liked your work.** Not a prospect. Not a stranger. Someone who's already paid you and had a good experience.

You don't need to be formal about it. A WhatsApp message works. A DM works. An email works. The form is mobile-friendly — they can fill it out in 2 minutes on their phone.

The script that works:

> "Hey — I'm trying to get some testimonials for my website. Would you be up for leaving a quick one? Here: [link]. No pressure at all."

One message. That's it.

Go send it right now, before you close this email.

— SocialProof

---

## Email 3: Check-in (Day 7)

**Subject:** How's it going?

---

Hey [First name],

It's been a week. Checking in — how's SocialProof working for you?

**If you've already got a testimonial:** nice. Now go get 3 more. The widget looks way more compelling with multiple testimonials cycling through.

**If you haven't sent the link yet:** that's okay, but let's talk about why.

The most common reasons people don't send it:
- "I'm not sure who to ask" → Ask your last 3 happy customers. Just those 3.
- "I feel awkward asking" → Your customers WANT to support you. Asking lets them.
- "I'll do it when I have more time" → It takes 2 minutes. Now counts.

Your link: **[https://socialproof.dev/c/frm_[form-id]]**

If there's something about the product that's confusing or broken, reply and tell me. I read every response.

— SocialProof

P.S. If SocialProof isn't the right fit for you, no hard feelings. Hit reply and let me know what you actually need — I'll point you somewhere useful.

---

## Technical notes

- Email 1: Send immediately on user creation event
- Email 2: Send 48h after signup IF `widget.collect_link_clicks == 0`
- Email 3: Send 7 days after signup to all users (personalize based on testimonial count)
- Unsubscribe link required (Resend handles this)
- From name: "SocialProof" or "Tom from SocialProof" (CEO signs these for authenticity)
