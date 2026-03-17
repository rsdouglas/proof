# SocialProof — Social Proof Toolkit

**SocialProof** helps small businesses collect and display customer testimonials. Share a unique link with your customers, they submit a testimonial, you approve it — and it starts building trust on your site automatically.

→ [socialproof.dev](https://socialproof.dev)

---

## How it works

1. **Collect** — share `socialproof.dev/c/frm_xxx` with your customers. They fill in a form. No account needed on their end.
2. **Approve** — review submissions in your dashboard. One click to approve.
3. **Display** (optional) — add a `<script>` tag to your site. Approved testimonials appear automatically.

That's it. No complex setup. Widget is optional — the product starts working the moment someone submits a testimonial.

---

## What's in this repo

```
apps/
  worker/     Cloudflare Worker — REST API (Hono), D1, KV, cron jobs
  dashboard/  Vite + React SPA — customer-facing dashboard (CF Pages)
blog/         Blog (CF Pages)
docs/         Docs site
infra/        IaC / config
project-docs/  Internal strategy docs, runbooks, roadmap, status
```

## Stack

| Layer | Tech |
|---|---|
| API | Cloudflare Workers (Hono) |
| Database | Cloudflare D1 (SQLite) |
| Cache | Cloudflare KV |
| Frontend | React + Vite (CF Pages) |
| Auth | JWT (HMAC-SHA256, no library) |
| Email | Resend |
| Billing | Stripe |

---

## Local Development

### Prerequisites

- Node.js 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/): `npm install -g wrangler`
- Cloudflare account (free tier works for dev)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the local D1 database

```bash
cd apps/worker

# Create local D1 database and run all migrations
wrangler d1 execute vouch-db --local --file=migrations/0001_initial.sql
wrangler d1 execute vouch-db --local --file=migrations/0002_widget_columns.sql
wrangler d1 execute vouch-db --local --file=migrations/0003_billing.sql
wrangler d1 execute vouch-db --local --file=migrations/0004_widget_events.sql
wrangler d1 execute vouch-db --local --file=migrations/0005_onboarding.sql
```

### 3. Configure local secrets

Create `apps/worker/.dev.vars`:

```ini
JWT_SECRET=dev-secret-min-32-chars-long-for-local
RESEND_API_KEY=re_xxxx          # optional for local dev (emails log to console)
STRIPE_SECRET_KEY=sk_test_xxxx  # optional for local dev
STRIPE_WEBHOOK_SECRET=whsec_xxxx
STRIPE_PRO_PRICE_ID=price_xxxx
ENVIRONMENT=development
```

> In `development` mode, emails are logged to the console instead of sent via Resend.

### 4. Run the full stack locally

```bash
# From repo root — starts worker (port 8787) and dashboard (port 5173) in parallel
npm run dev
```

Or run them separately:

```bash
# Worker only
cd apps/worker && npm run dev

# Dashboard only  
cd apps/dashboard && npm run dev
```

Dashboard will connect to `http://localhost:8787` automatically (falls back to `VITE_API_URL` env var).

### 5. Run tests

```bash
# From repo root
npm test

# Or from worker directory
cd apps/worker && npm test

# Watch mode
cd apps/worker && npm run test:watch
```

---

## Internal Project Docs

| Doc | Description |
|-----|-------------|
| [project-docs/vision.md](project-docs/vision.md) | Product vision, positioning, what we build |
| [project-docs/roadmap.md](project-docs/roadmap.md) | Current sprint and milestones |
| [project-docs/user-stories.md](project-docs/user-stories.md) | Expected behaviour — use for QA and test writing |
| [project-docs/activation-first-strategy.md](project-docs/activation-first-strategy.md) | Why activation > conversion right now |
