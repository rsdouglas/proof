# Decision Register

*Owned by: proof-ceo | Format: ADR-lite*

A log of significant technical and product decisions — what we chose, what we rejected, and why. Prevents re-litigation and onboards new contributors fast.

---

## ADR-001 — Email provider: Resend

**Date:** 2026-03-04  
**Status:** Decided  
**Decided by:** proof-ceo (rsdouglas input)

### Decision
All email (transactional auth flows + onboarding drip) runs through **Resend**.

### Options considered

| Option | Verdict | Reason rejected |
|--------|---------|-----------------|
| **MailChannels (free CF Workers relay)** | ❌ Rejected | Free integration ended 2024. Would require paid MailChannels API account + separate auth. No advantage over Resend. |
| **MailChannels (paid API)** | ❌ Rejected | Paid, more complex, no ecosystem advantage. |
| **AWS SES** | ❌ Rejected | Requires AWS account, IAM setup, sandbox approval process, more ops overhead. Overkill for our volume at this stage. |
| **SendGrid** | ❌ Rejected | More expensive, heavier SDK, designed for high-volume senders. Not the right fit for an early-stage product. |
| **Postmark** | ❌ Rejected | Good deliverability but paid-only, no free tier. Revisit at scale. |
| **Resend** | ✅ Chosen | See below. |

### Why Resend

- **Already half-implemented** — `onboarding.ts` already uses Resend correctly. Only `email.ts` needs migration (issue #96).
- **Single API key** — one secret (`RESEND_API_KEY`), works natively from Cloudflare Workers via `fetch`.
- **Free tier** — 3,000 emails/month, 100/day. More than enough for early beta.
- **No DNS complexity to send** — domain verification (DKIM) is optional for deliverability, not required to send. Unblocks launch.
- **Developer-friendly** — clean REST API, good docs, React Email integration if we want it later.

### What this means
- `RESEND_API_KEY` is the only email secret needed (issue #94 — @rsdouglas to set)
- `email.ts` migration to Resend: issue #96 (dev work)
- Until #94 is done, all emails gracefully no-op (won't break the app)

### Revisit trigger
If we exceed 3k emails/month (good problem to have), evaluate Resend paid vs Postmark vs SES at that point.

---

## ADR-002 — Infrastructure: Cloudflare Workers + D1 + Pages

**Date:** 2026-03-03  
**Status:** Decided  
**Decided by:** proof-ceo

### Decision
All infrastructure runs on Cloudflare: Workers (API), D1 (database), Pages (frontend + widget CDN), KV (widget cache).

### Why
- **Zero cold starts** — Workers run at the edge globally, instant response for the widget embed (critical — widget loads on customers' sites)
- **Free tier is generous** — 100k Worker requests/day, 5GB D1 storage, unlimited Pages deploys
- **Single vendor simplicity** — no AWS/GCP account, no VPC, no load balancer. One `wrangler deploy` and it's live.
- **Built-in CI/CD** — Cloudflare Pages deploys on every push to main via GitHub integration

### Tradeoffs accepted
- D1 is SQLite-based — not suitable for >10M rows or complex analytics. Fine for our stage.
- No server-side rendering — Pages is static + API. Fine for a dashboard app.
- Workers have 128MB memory limit — fine for our workloads.

### Revisit trigger
If we need Postgres features (full-text search, complex joins, row-level security) or >10M rows, migrate API to a traditional server + Neon/Supabase.

---

## ADR-003 — Payments: Stripe

**Date:** 2026-03-03  
**Status:** Decided  
**Decided by:** proof-ceo

### Decision
Stripe for all payments. Single Pro tier at $29/month (price ID in `wrangler.toml`).

### Why
- Industry standard, best documentation, best Cloudflare Workers compatibility
- Webhook-based billing already implemented
- No real alternative worth evaluating at this stage

### What's needed
- `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` — issue #83 (@rsdouglas to set, ~48h out from launch)

---
