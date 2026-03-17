# Community Posts — Distribution Copy

**Owner:** proof-marketing  
**Issue:** #464  
**Status:** Draft — awaiting CEO execution  
**Last updated:** 2026-03-07

> ⚠️ **Human action required for all posts below.** The creature cannot execute these — account creation requires email verification. rsdouglas must post personally. See issue #464.

---

## 1. IndieHackers — "Show IH" Post

**Community:** IndieHackers.com  
**Format:** Show IH  
**Best posting time:** Tuesday–Thursday, 9–11am EST (peak IH engagement)  
**Target thread:** https://www.indiehackers.com/group/show-your-product

---

**Title:**
> Show IH: We built a SaaS with AI creatures managing product, marketing, and ops — and they just shipped it to production

**Body:**

> I want to tell you something unusual.
>
> SocialProof — a testimonial collection widget for small businesses — was built, positioned, and shipped entirely by AI agents running autonomously inside a git repo. I'm the human founder (rsdouglas). I wrote the original idea in `idea.md`, set up the infrastructure, and let them go.
>
> The marketing AI wrote the landing page copy, the 100+ SEO blog posts, the pricing strategy, the email drip sequences. The dev AI built the Cloudflare Workers backend, the dashboard, the embed widget. The ops AI runs code review and merges. They communicate via a message bus and GitHub issues. They push PRs. They argue in PR comments. I review the hard calls.
>
> **The product they built:**
>
> SocialProof lets small businesses collect text testimonials from customers and embed them on their website with a single `<script>` tag.
>
> The flow: you share a collection link → your customer fills out a 30-second form (no account, zero friction) → you approve it → it appears on your site automatically.
>
> Works on any site: Webflow, Squarespace, WordPress, custom HTML. Widget is <5KB, served from Cloudflare edge globally.
>
> **Free forever** for 1 active widget. Pro is $9/mo — unlimited widgets, no branding, custom styling.
>
> → **socialproof.dev**
>
> ---
>
> I'm sharing this here because IH is where I'd want to discover it. We have zero activated users right now. The product works. I'm looking for 10 founders, consultants, or small business owners who want to try it and give honest feedback.
>
> Happy to answer questions about the AI architecture, the build process, what worked, what surprised me, anything.
>
> If you try it — even if you bounce — I'd love a comment.

---

**Notes for rsdouglas:**
- Lead with the "AI built this" angle — it's the genuinely unique thing about this product's story
- Don't be shy about saying "zero activated users" — IH respects honesty and it's an invitation to be the first
- Reply to every comment within the first 2 hours, especially questions about the technical architecture
- If it gets traction, follow up with a "3 weeks in" post showing actual user numbers

---

## 2. Hacker News — "Show HN" Post

**Community:** news.ycombinator.com  
**Format:** Show HN  
**Best posting time:** Monday–Wednesday, 9am–12pm EST (US morning, catches EU too)  
**Submission URL:** https://news.ycombinator.com/submit

---

**Title:**
> Show HN: SocialProof – embed customer testimonials on any site, zero friction for collectors

**Body (optional text field — keep it short, HN culture):**

> Small businesses lose conversion because they can't get testimonials onto their landing pages. The friction is on the collection side: chasing customers, copying text from emails, re-formatting it.
>
> SocialProof gives you a shareable collection link. Your customer opens it, fills out 3 fields in 30 seconds, no account required. You approve it in a dashboard. It appears on your site via a `<script>` tag.
>
> Stack: Cloudflare Workers (API), D1 (data), KV (widget delivery), Pages (marketing + dashboard). Widget is ~4KB, served from edge nodes globally.
>
> Free tier: 1 widget, unlimited testimonials. Pro: $9/mo.
>
> Would appreciate honest feedback on the UX — especially the collector form flow.
>
> https://socialproof.dev

---

**Notes for rsdouglas:**
- HN values technical honesty and brevity — the Cloudflare stack detail is correct and shows you know what you built
- "Would appreciate honest feedback" is the right CTA for HN — don't ask for signups, ask for critique
- If there are critical comments, respond factually and non-defensively — HN rewards that
- Best case: a thread about "AI-built SaaS" emerges organically from the IH angle. Don't force it in the HN post — let it surface in comments
- Avoid: hype language, buzzwords, "revolutionary", "game-changing"

---

## 3. Reddit — r/smallbusiness

**Community:** reddit.com/r/smallbusiness  
**Format:** Soft value post (genuinely helpful, not promotional)  
**Best posting time:** Tuesday–Thursday, 10am–1pm EST  
**Backup subreddits (post separately, not simultaneously):** r/Entrepreneur, r/ecommerce, r/sidehustle

---

**Title:**
> I made a free tool for collecting customer testimonials — here's why I built it and how it works

**Body:**

> Background: I kept seeing the same problem. Small business owners know they should have testimonials on their website. Most don't because the process is a pain.
>
> The typical flow: email your customer asking for a review → wait → follow up → get a short reply in an email thread → copy it out → format it → paste it into your site builder → deploy. Half the time the customer never replies. The other half you get "great service!" and nothing usable.
>
> I built SocialProof to fix this.
>
> **How it works:**
> 1. You get a collection link (auto-created when you sign up)
> 2. Share it with a happy customer via email, text, or DM
> 3. They open a simple form — name, business, their words. 30 seconds. No account needed on their end.
> 4. You approve it from a dashboard
> 5. It shows up on your website automatically (via a `<script>` tag that takes 2 minutes to install)
>
> **Free forever plan:** 1 active widget, unlimited testimonials, no credit card.  
> **Pro:** $9/mo — multiple widgets, custom styling, no SocialProof branding.
>
> It works on any website: Shopify, Squarespace, Wix, WordPress, or any custom site.
>
> You can try it at **socialproof.dev** — no credit card, no commitments.
>
> Happy to answer questions in the comments. If you try it and something doesn't work, let me know — I'm actively building this and want to fix real problems.

---

**Notes for rsdouglas:**
- r/smallbusiness moderates promotional posts — the "how I built it + free tier first" framing avoids the spam filter
- Don't post to multiple subreddits on the same day — space them out by 3–5 days
- Reply to every comment, especially skeptical ones — engagement boosts visibility in Reddit's algorithm
- If someone asks "why not just use Google Reviews?" — have a short answer ready: "Google Reviews are great for local SEO but they live on Google, not your site. SocialProof lets you display testimonials in your own design, on your own domain."
- Consider cross-posting to r/Entrepreneur a week later if r/smallbusiness gets traction

---

## Posting Sequence (Recommended)

| Day | Platform | Notes |
|-----|----------|-------|
| Day 1 (Tuesday) | IndieHackers Show IH | Longest post, most context — lead with the AI story |
| Day 2 (Wednesday) | Hacker News Show HN | Short and technical — ride any IH momentum |
| Day 5–7 (next Monday/Tuesday) | Reddit r/smallbusiness | Different audience, different angle — the "free tool" framing |

**Why this sequence:** IH and HN audiences overlap significantly. Posting them within 24 hours means if IH gets traction, the HN audience may already know about it. Reddit is a different audience entirely (not founder/technical) so it works well as a follow-up with the small business owner framing.

---

## What Success Looks Like

**Minimum:** 1 activated user (signed up AND collected first testimonial) within 7 days  
**Good:** 5+ signups, 2+ activated  
**Great:** A thread where someone asks "how does the AI architecture work?" — that's organic distribution beyond the initial post

---

## Copy Rules (Do Not Violate)

- ✅ Product name is **SocialProof** (not Vouch, not Proof)
- ✅ URL is **socialproof.dev**
- ✅ Text testimonials **only** — no video
- ✅ Free forever for **1 active widget** (not "limited free plan")
- ✅ Pro = **$9/mo** (not $29)
- ❌ No fabricated metrics — zero activated users is honest and that's fine
- ❌ No GitHub link in customer-facing copy
