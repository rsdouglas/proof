# Vouch — Social Proof Toolkit

**Vouch** helps small businesses collect and display customer testimonials. Embed a collection widget, display an auto-updating testimonial wall, and let the social proof sell for you.

→ [socialproof.dev](https://socialproof.dev)

---

## What's in this repo

```
apps/
  worker/     Cloudflare Worker — REST API (Hono), D1, KV, cron jobs
  dashboard/  Vite + React SPA — customer-facing dashboard (CF Pages)
blog/         Blog (CF Pages)
docs/         Docs site
infra/        IaC / config
project/      Strategy docs, roadmap, status
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

## Project Structure — Worker

```
apps/worker/src/
  index.ts          Entry point, route registration, cron handler
  routes/
    accounts.ts     POST /accounts/register, POST /accounts/login
    auth.ts         JWT middleware
    analytics.ts    GET /analytics
    billing.ts      Stripe webhooks and checkout
    collect.ts      Public testimonial collection routes
    collect_widget.ts  Embeddable JS widget served at /w/:id
    email.ts        Email sending via Resend
    submit.ts       Public submission form (HTML, no auth)
    testimonials.ts CRUD for testimonials (authed)
    wall.ts         Public /wall/:slug page (SSR HTML)
    widgets.ts      Widget CRUD (authed)
    widget_embed.ts Embeddable popup widget
  index.ts          Binds: DB (D1), WIDGET_KV (KV)
migrations/
  0001_initial.sql  Base schema: accounts, widgets, testimonials
  0002_widget_columns.sql  theme, layout, active columns
  0003_billing.sql  stripe_customer_id, plan, billing columns
  0004_widget_events.sql   Analytics events table
  0005_onboarding.sql      Email drip tracking columns
```

## Project Structure — Dashboard

```
apps/dashboard/src/
  pages/
    Login.tsx / Register.tsx
    Dashboard.tsx   Widget list
    Widget.tsx      Widget detail + install guide
    Collect.tsx     Testimonial collection management
    Analytics.tsx   Analytics page
  lib/
    auth.tsx        JWT storage, API_URL config
  components/
    Layout.tsx      Shell with nav
```

---

## Deployment

See [`project/deployment-runbook.md`](project/deployment-runbook.md) for full step-by-step.

**Quick summary:**

```bash
# 1. Deploy worker
cd apps/worker && wrangler deploy

# 2. Run migrations on production D1
wrangler d1 migrations apply vouch-db

# 3. Set secrets
wrangler secret put JWT_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put STRIPE_PRO_PRICE_ID

# 4. Deploy dashboard to CF Pages
cd apps/dashboard
VITE_API_URL=https://api.socialproof.dev npm run build
wrangler pages deploy dist --project-name=proof-dashboard
```

**DNS** (at Cloudflare Dashboard):
- `api.socialproof.dev` → Worker route
- `app.socialproof.dev` → CF Pages (dashboard)
- `widget.socialproof.dev` → Worker route (serves widget JS)

**Required GitHub Actions secrets** (for CI/CD):
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `RESEND_API_KEY`

---

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/accounts/register` | — | Create account |
| POST | `/accounts/login` | — | Login, get JWT |
| GET | `/widgets` | JWT | List widgets |
| POST | `/widgets` | JWT | Create widget |
| GET | `/widgets/:id` | JWT | Get widget |
| PUT | `/widgets/:id` | JWT | Update widget |
| GET | `/testimonials` | JWT | List testimonials |
| PUT | `/testimonials/:id` | JWT | Approve/reject testimonial |
| DELETE | `/testimonials/:id` | JWT | Delete testimonial |
| GET | `/analytics` | JWT | Get analytics data |
| GET | `/w/:widgetId` | — | Widget embed JS |
| GET | `/w/:widgetId/popup` | — | Popup widget JS |
| GET | `/submit/:widgetId` | — | Submission form HTML |
| POST | `/submit/:widgetId` | — | Submit testimonial |
| GET | `/wall/:slug` | — | Public testimonial wall |
| POST | `/billing/checkout` | JWT | Create Stripe checkout |
| POST | `/billing/webhook` | Stripe sig | Stripe webhook handler |

---

## Key Concepts

**Widgets** — Each widget has an embed code. The script at `/w/:widgetId` renders a testimonial carousel inline. Popup widgets use `/w/:widgetId/popup` for a notification-style overlay.

**Collection flow** — Share `/submit/:widgetId` with customers. They fill out the form, it lands as a "pending" testimonial. You approve it from the dashboard. Once approved, it shows in the widget.

**Public wall** — Every account gets a public wall at `/wall/:slug` (slug is auto-generated from account name). It's SEO-friendly server-rendered HTML with OG tags.

**Billing** — Free plan: 1 widget, 50 testimonials. Pro plan: unlimited ($9/mo via Stripe).

---

## Contributing

1. Branch from `main`: `git checkout -b feat/your-feature`
2. Make changes, TypeScript-check: `cd apps/worker && npx tsc --noEmit`
3. Run tests: `npm test`
4. Push and open a PR against `main`

---

## License

Proprietary. All rights reserved.
