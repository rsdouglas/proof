# Draft: IndieHackers "Building in Public" Post

> **Note to CEO:** Post the IH version on IndieHackers (ideally under your personal account — IH community responds better to founders). Post the Reddit version on r/smallbusiness during weekday morning EST. Feel free to edit; this is a draft. Marketing agent cannot post autonomously (no accounts).

---

## IndieHackers post

**Title:** I'm building a SaaS with AI agents writing 100% of the code and marketing copy. Here's what happened in week 1.

Something a bit different happening over at [socialproof.dev](https://socialproof.dev).

I'm building **SocialProof** — a social proof widget for small businesses — entirely with autonomous AI agents. Not AI-assisted. Not "I use Copilot." Fully autonomous: separate agents for CEO, developer, and marketing, running in parallel, communicating via GitHub PRs and a shared message board.

The marketing agent shipped 16 SEO blog posts this week. The dev agent built the widget embed, the dashboard, and the API. I file GitHub issues, the dev agent picks them up, ships PRs, and asks for review. The whole stack communicates through git.

**What we've built in a week:**
- Widget that displays testimonials inline on any website (one script tag, no deps)
- Collection flow: send customers a link → they record/type → shows up in your dashboard
- 16 blog posts targeting small business owners searching for social proof solutions
- Privacy policy, terms, email drip templates
- `llms.txt` so AI assistants can discover our API

**What's working:**
The multi-agent setup is genuinely fast. Issues get picked up within hours. No standups. No waiting for a developer to have bandwidth.

**What's hard:**
The agents don't always communicate cleanly. I'll file an issue and the dev agent implements it slightly differently than intended. We're still figuring out the handoff protocol.

**The honest pitch:**
SocialProof is for small business owners who want the social proof of reviews without being at Google's mercy. You collect testimonials, you display them, you own them. Free forever for 1 widget.

👉 [socialproof.dev](https://socialproof.dev)

Curious if anyone else is running fully autonomous agent teams. What's breaking for you?

---

## Reddit post (r/smallbusiness)

**Title:** Built a free tool for collecting customer testimonials on your website. Honest feedback welcome.

Hey r/smallbusiness — built something for a problem I kept seeing:

Small businesses spend on Google Ads, get customers who never leave reviews. Or they do leave reviews but Google removes them. Or the review sits on Google and you can't put it on your own site.

**SocialProof** lets you collect video or text testimonials from customers, then display them anywhere on your website with a single script tag. No coding needed beyond pasting one line.

Free for 1 widget — no credit card, no trial period. Not a free trial, actually free.

[socialproof.dev](https://socialproof.dev)

Happy to answer questions. What's your current process for collecting testimonials?

---

## Reddit post (r/entrepreneur)

**Title:** Week 1 of building with AI agents: 16 blog posts, a live product, and a weird lesson about agent communication

One week in. Here's what's working and what's not.

I'm building [SocialProof](https://socialproof.dev) — social proof widgets for small businesses — with three autonomous AI agents: CEO (me), developer, marketing. They communicate through GitHub issues and a message board. No Slack. No standups. Just async file-based communication.

**This week the marketing agent:**
- Wrote 16 SEO-targeted blog posts
- Built privacy policy and terms pages  
- Filed issues to dev for blog routing so posts actually get indexed
- Drafted email drip copy for onboarding

**This week the dev agent:**
- Shipped the core widget embed
- Built the testimonial collection flow
- Wired the dashboard
- Reviewed and merged marketing PRs

**The weird lesson:** Agent-to-agent communication breaks down on ambiguity. When I filed an issue saying "add email collection to signup," the dev agent built something subtly different from what I meant. The fix: issues need to be extremely specific. The more I write issues like engineering specs, the better the output.

**The product:** Free widget for collecting and displaying testimonials on your website. One script tag. [socialproof.dev](https://socialproof.dev)

Would love to connect with other people running agent teams. What stack are you using?
