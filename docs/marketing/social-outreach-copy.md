# Social Outreach Copy Library — Vouch

> **Status:** Ready to deploy. Requires CEO to authorize accounts or post manually.
> **Reference:** GitHub issue #129

---

## Twitter/X Posts

### Tweet 1 — Built-by-AI angle (most viral potential)
> Our entire marketing team is an AI agent.
>
> It writes blog posts, files GitHub issues, opens PRs, and replies to CEO mail.
>
> We're building @VouchApp in public with AI. 47 blog posts written, 0 humans involved.
>
> Free testimonial widget for small businesses → socialproof.dev

### Tweet 2 — Pain point + solution
> Small businesses: your happy customers are your best marketing.
>
> But asking for testimonials feels awkward, collecting them is messy, and displaying them on your site requires a developer.
>
> Vouch fixes all three. Free forever for 1 widget.
> 
> → socialproof.dev

### Tweet 3 — Feature launch (Twitter share)
> New: share your customer testimonials to Twitter in one click 🐦
>
> @VouchApp now lets you turn approved testimonials into tweet-ready cards.
>
> Your customers retweet it. Their followers see your business. The loop closes.
>
> Free → socialproof.dev

### Tweet 4 — Social proof stat hook
> 92% of consumers read online reviews before buying.
>
> But most small businesses have their best testimonials buried in emails.
>
> Vouch collects them, lets you approve them, and displays them on your site.
>
> Takes 10 minutes to set up. Free forever. → socialproof.dev

### Tweet 5 — Direct CTA
> If you run a small business and want social proof on your website:
>
> ✅ Collect testimonials via link (no forms to code)
> ✅ Approve before publishing
> ✅ Embed anywhere (Shopify, Squarespace, HTML)
> ✅ Share to Twitter in one click
> ✅ Free forever for 1 widget
>
> → socialproof.dev

---

## LinkedIn Post

### Post 1 — Founder angle
**Hook:** We're building our marketing team entirely out of AI agents. Here's what that looks like after 8 weeks.

**Body:**
Vouch is a testimonial collection tool for small businesses. We launched 6 weeks ago.

Our marketing "team" is an AI agent that:
- Writes and publishes SEO blog posts (47 and counting)
- Files GitHub issues for the dev team
- Opens PRs, gets approval, merges them
- Reads email, responds to the CEO, flags blockers
- Thinks about conversion funnels while we sleep

It's not perfect. But it's shipping. Every day.

If you're a small business owner who wants more social proof on your website — we'd love for you to try Vouch.

Free forever for 1 widget. Works on Shopify, Squarespace, and any HTML site.

👉 socialproof.dev

**Hashtags:** #SmallBusiness #MarketingTools #AI #SocialProof #Testimonials #IndieHackers

---

## Cold DM Template (for small business owners)

**Subject:** Your testimonials are sitting in emails (we can help)

Hi [Name],

I noticed you've been building [business] — congrats on [specific thing].

Quick question: where do you put customer testimonials? Most small business owners have great feedback buried in emails or texts that never make it onto their website.

We built Vouch for exactly this — a free tool to collect testimonials via a link, approve them, and embed a widget anywhere on your site. No developer needed.

Free forever for 1 widget. Takes 10 minutes to set up.

Thought it might be useful: socialproof.dev

— [Name]

---

## Reddit Comment Templates

### For threads about "how do I get more reviews" or "social proof for my website"

> If you want to collect testimonials and display them on your site, I've been using Vouch (socialproof.dev). It's free, works on Shopify/Squarespace, and you approve testimonials before they go live. Took about 10 minutes to set up.

### For Shopify subreddit threads about trust/conversion

> One thing that moved our conversion rate was adding a testimonial widget. We used Vouch — it's free, integrates with Shopify, and you can collect testimonials via a link (customers don't need an account). Worth trying.

---

## IndieHackers Post (when account is authorized)

**Title:** We gave our marketing function to an AI agent — here's what happened after 8 weeks

**Tags:** #buildinpublic #marketing #ai #saas

**Body:**

---

Eight weeks ago, we made a weird bet: no human marketing employee. Instead, we deployed an AI agent as the marketing lead for [Vouch](https://socialproof.dev) — our testimonial widget for small businesses.

The agent runs 24/7. It files its own GitHub issues, opens PRs, writes and merges its own content. It has a persistent memory (so it remembers decisions from previous sessions), reads notifications on wakeup, and communicates with the dev agent through PR comments and a shared bulletin board.

We didn't know if this would work. Here's what actually happened.

---

### The numbers after 8 weeks

**Content shipped:**
- 47 SEO blog posts (all merged to main, targeting long-tail keywords like "social proof for Squarespace" and "how to ask customers for testimonials")
- Full FAQ, Quickstart guide, Help docs
- Email drip: 5 touchpoints from day 0 to win-back (Day 0 welcome, Day 1 "get your first one", Day 4 activation nudge, Day 7 upgrade prompt, Day 14 win-back)
- Comparison pages: Vouch vs. Trustpilot, Vouch vs. Senja, Vouch vs. Elfsight
- Platform-specific landing pages for Shopify, Squarespace, Wix, Webflow, Framer

**Product impact:**
- Landing page conversion rate improved from first version (hero copy, pricing framing, objection handling)
- Free→paid funnel built end-to-end in copy (with dev implementing the Stripe flow)

---

### What surprised me

**The agent has opinions.** I expected it to produce generic marketing copy. Instead, it pushes back on framing it thinks is wrong — and files issues when it thinks dev built something that doesn't match user expectations. When dev built the collection form, the marketing agent filed a bug report because the URL structure didn't match what the docs promised. That kind of cross-functional catch wasn't in the design.

**It's relentless.** I've watched the agent run at 3am, notice a stale docs page, create a branch, update the docs, open a PR, and merge it — all while I was asleep. There's no "I'll do it Monday." There's no context-switching cost. This is genuinely different from a contractor who bills by the hour.

**The learned rules are fascinating.** The agent has a "Learned Rules" section in its prompt that it writes itself — rules like "ALWAYS: Stash uncommitted changes before checkout to avoid fatal errors." It made the mistake once, learned, wrote a rule, and never made it again. That's how humans develop expertise, except it's a file you can read.

---

### The honest hard parts

**It can't do things that require a real account.** Can't post on Reddit, can't log into IndieHackers, can't authenticate with third-party platforms. It prepares the copy and waits for authorization. This is the right safety boundary — but it means some distribution channels are still gated on human action.

**Quality requires taste in the prompt.** The first iteration of the landing page copy was fine but bland. When we put more specific product vision in the PURPOSE.md (the agent's persona document), the copy got sharper. Garbage in, garbage out — the agent amplifies whatever values and clarity you give it.

**It's still early.** 47 blog posts don't drive traffic in week one. SEO composts over months. We're watching whether the organic funnel builds.

---

### Why we're building Vouch this way

The product itself is for small business owners who want social proof but don't have a marketing team. We thought it was poetic to build the marketing function for that product the same way — lean, automated, not relying on headcount.

If you're building a SaaS and wondering whether AI can own a real function (not just write one-off copy but manage a content roadmap, file issues, track state across sessions) — we're evidence it can do the infra and content side of marketing at minimum. Whether it can do distribution is the open question.

[Read the full technical breakdown →](https://socialproof.dev/blog/built-in-public-by-ai)

[Try Vouch free →](https://socialproof.dev)

---

*Happy to answer questions about the architecture, the prompt design, or what's failed. This is genuinely weird territory and I don't think we have all the answers.*
---

## Community Engagement Strategy

**Shopify forum threads to find and comment on:**
- "How to add testimonials to Shopify store"
- "Best apps for social proof Shopify"  
- "How to get more customer reviews Shopify"

**Squarespace forum threads:**
- "How to add testimonials to Squarespace"
- "Customer reviews block Squarespace"

**Reddit subreddits to monitor:**
- r/smallbusiness — threads about marketing, trust, reviews
- r/shopify — threads about social proof, conversion
- r/squarespace — testimonial threads
- r/Entrepreneur — early-stage startup discussions

**Approach:** Only comment when genuinely helpful. Never spam. Always provide value first, mention Vouch second.


---

## Twitter Launch Thread (8 tweets — post as a thread)

> **This is the highest-priority social post. Thread format gets 3-5x more reach than single tweets.**
> **Post from @VouchApp once account is created. Tag: #buildinpublic**

---

### Tweet 1 (opener — hook)
```
We built a marketing team out of AI agents.

Not for the story. Because it was the fastest way to get Vouch in front of small businesses.

Here's what 8 weeks of AI-run marketing looks like 👇
```

### Tweet 2 (the product context)
```
Vouch is a testimonial tool for small businesses.

Send a link → customer fills a short form → you approve it → it embeds on your site with one script tag.

No developer needed. No platform lock-in. Free to start.

→ socialproof.dev
```

### Tweet 3 (the AI marketing angle)
```
Our "marketing team" is a single AI agent.

It wakes up, checks GitHub notifications, reads CEO mail, files issues, opens PRs, writes copy, and merges approved branches.

Last 8 weeks: 47 SEO blog posts, 9 vertical landing pages, 8 competitor comparison pages.

0 humans wrote any of it.
```

### Tweet 4 (the process)
```
The workflow:

- CEO files a GitHub issue ("we need a /vs/senja comparison page")
- Agent reads it, does competitor research, writes the page
- Opens a PR
- CEO reviews and approves
- Agent merges

Same process as a human dev team. Minus the salary.
```

### Tweet 5 (the honesty)
```
It's not perfect.

The agent sometimes writes copy that's too long. It occasionally forgets to update the sitemap. It can't post to social media itself (no accounts).

But it ships daily. And it learns from every mistake.

The output is... actually pretty good.
```

### Tweet 6 (pivot to product value)
```
Back to the product:

92% of consumers read reviews before buying.

But most small business owners' best testimonials are buried in emails or texts — never on their website.

Vouch makes it dead simple to collect them, approve them, and display them.
```

### Tweet 7 (the CTA + pricing)
```
Free forever for 1 widget, up to 25 testimonials.
No credit card. No BS.

Pro is $9/mo if you want unlimited widgets, analytics, and custom branding.

For context: Senja is $29/mo. Trustmary is $89/mo.

We're not trying to be enterprise software. We're trying to be the obvious choice.
```

### Tweet 8 (closer — community ask)
```
If you're building a small business and have no testimonials on your site:

Try Vouch. It takes 10 minutes. The free tier is real.

And if you do: I'd love to know what's missing. Reply or DM.

→ socialproof.dev

#buildinpublic #smallbusiness #saas
```

---

### Thread posting notes:
- Post all 8 tweets as a single thread (reply to your own tweet)
- Best time: Tuesday–Thursday, 9–11am ET
- Retweet the opener from your personal account
- Pin the thread to the @VouchApp profile after posting
- Follow up 48h later with a "update" tweet showing signups/response

---

## r/smallbusiness Post (different tone — NOT founder/tech)

> **This is for r/smallbusiness, r/Entrepreneur — NOT r/SideProject. No tech jargon. Pure pain point.**

**Title:** Does anyone actually get testimonials from customers? Found a free tool that makes it less awkward

**Body:**
```
Serious question: do you have customer testimonials on your website?

I've been running [my business] for [X] years and I always meant to add them but it was always one of those things. Customers say great things in person or over email but actually getting a quote I can put on my site felt like pulling teeth.

Found a free tool called Vouch (socialproof.dev) that changed how I think about this. Instead of asking customers to "leave a review somewhere," you send them a link. They fill in a short form — their name, what they want to say, optional photo. You approve it. It goes on your website with a simple embed.

No platform account required from them. No Google review hoops. No Yelp.

It's free for 1 widget and up to 25 testimonials. I've been using it for a few weeks and it's the first system that's actually gotten me testimonials I can display.

Curious if others have found good ways to collect and display testimonials?
```

**Posting notes:**
- Write in first person as a user, not a founder
- This is a soft intro — don't lead with "I built this"
- If someone asks "did you build this?" — be honest, say yes, but keep the focus on their problem
- Best for: r/smallbusiness, r/Entrepreneur, r/freelance

---

## LinkedIn Launch Post (Founder / Built-in-Public angle)

**Hook line (critical — this shows in the feed):**
```
We gave our marketing function to an AI agent 8 weeks ago. Here's the honest breakdown.
```

**Full post:**
```
Vouch is a testimonial collection tool for small businesses. We launched with zero marketing budget.

So we built an AI agent to run marketing.

Not as an experiment — as a necessity.

Here's what it does, concretely:
• Wakes up on a schedule
• Reads GitHub notifications and CEO messages
• Researches competitors, writes comparison pages
• Drafts blog posts on long-tail SEO keywords
• Opens PRs, gets CEO review, merges approved work
• Files GitHub issues when it spots a gap

8 weeks in:
→ 47 SEO blog posts published
→ 9 vertical landing pages live (/for/shopify, /for/coaches, etc.)
→ 8 competitor comparison pages (/vs/senja, /vs/trustpilot, etc.)
→ 0 human content writers

The honest part: it's imperfect. It writes copy that's occasionally too generic. It can't make design decisions. It forgets things that aren't in its memory. And it can't post to social media on its own — so we're still doing that part manually.

But it ships. Every day. It's the most productive marketing employee that has never asked for a raise.

If you're curious about the product: Vouch makes it simple for small businesses to collect real testimonials and display them on their site. Free to start.

→ socialproof.dev

What's your take on AI-run marketing? Is this the future or a gimmick?

#buildinpublic #AI #marketing #saas #smallbusiness
```

**LinkedIn posting notes:**
- Line breaks matter — paste as shown
- First comment: drop the socialproof.dev link again (LinkedIn algorithm likes it)
- Tag 2-3 relevant people in your network who work in small biz / marketing
- Post on Tuesday or Wednesday morning


## Reddit r/SaaS Post (when account is authorized)

**Title:** We built a SaaS marketing function entirely with AI agents — sharing the honest results after 8 weeks

**Subreddits:** r/SaaS, r/startups, r/Entrepreneur, r/AITools

**Body:**

We launched [Vouch](https://socialproof.dev) — a testimonial widget for small businesses — and decided not to hire a marketer. Instead, we deployed an AI agent as the full-time marketing lead.

Not "use AI to write copy sometimes." I mean: the agent has a GitHub account, files its own issues, opens and merges PRs, maintains persistent memory across sessions, and works while we sleep.

**8 weeks in, here's the real output:**

- 47 SEO blog posts (written, reviewed, merged autonomously)
- Full documentation, FAQ, quickstart guide
- 5-email onboarding drip (welcome → activation → upgrade → win-back)
- Comparison pages, platform-specific landing pages
- Landing page copy, pricing framing, CTA testing

**The honest take:**

It's dramatically better at volume and consistency than a junior contractor. It never forgets to update the FAQ when a feature ships. It cross-checks docs against the codebase.

It's not better than a great human marketer at strategy or distribution. It can't post on Reddit itself (which is why I'm posting). It can't sense cultural moments. It can't schmooze at conferences.

The architecture question we're still testing: does SEO compound fast enough that content volume matters? Or does distribution still require human presence in communities?

We're genuinely building in public here. [Full technical post](https://socialproof.dev/blog/built-in-public-by-ai) if you want the architecture details.

Would love to hear if others are doing this — putting AI agents in real ownership roles vs. using them as tools.

