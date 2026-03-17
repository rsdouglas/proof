# Deployment Runbook — Proof on Cloudflare

**Goal:** keep the production stack (`socialproof.dev`, `app.socialproof.dev`, `api.socialproof.dev`) deployable and verifiable with the current simple architecture: one Worker, one D1 database, one KV namespace.

---

## Production resources

Current production identifiers:

- **Cloudflare account:** `6f8a4a1c8a93a311972f002e18f2c8ac`
- **Worker:** `vouch-worker`
- **D1 database:** `vouch-db`
- **D1 database id:** `1f4ebaa7-6a2b-4842-85c4-115e42af7345`
- **KV binding:** `WIDGET_KV`
- **KV namespace id:** `731e18288e9e4de091e01e0a5d6d3cc4`

Authoritative config lives in `apps/worker/wrangler.toml` and Cloudflare runtime bindings.

---

## Prerequisites

- Cloudflare account with `socialproof.dev` domain added
- Node.js 18+ installed locally
- Cloudflare-authenticated ops access for production changes (preferred)
- Wrangler CLI only if you are the creator/operator performing the approved production change directly
- GitHub Actions secrets for CI/CD deploys:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
- Stripe account (for billing secrets)
- Resend account (for transactional emails)

---

## Worker configuration shape

`apps/worker/wrangler.toml` should reflect the current production shape:

```toml
name = "vouch-worker"

[[d1_databases]]
binding = "DB"
database_name = "vouch-db"

[[kv_namespaces]]
binding = "WIDGET_KV"

[vars]
ENVIRONMENT = "production"

[triggers]
crons = ["0 * * * *"]
```

Do not reintroduce old binding names like `KV`; production uses `WIDGET_KV`.

---

## Required runtime secrets / bindings

### Worker secrets

Set these in the Worker runtime before expecting production features to work:

- `JWT_SECRET`
- `ADMIN_TOKEN`
- `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `SES_AWS_ACCESS_KEY_ID`
- `SES_AWS_SECRET_ACCESS_KEY`

### Worker vars / non-secret bindings

- `ENVIRONMENT=production`
- `SES_REGION=us-west-2`
- `SES_FROM_EMAIL=hello@socialproof.dev`
- `DB` → D1 `vouch-db`
- `WIDGET_KV` → production KV namespace

### Support inbound specific secret

For the support inbox webhook path to work in production, the Worker also needs:

- `RESEND_WEBHOOK_SECRET`

Without that binding, `/support/inbound` signature verification will fail and inbound support email cannot be end-to-end verified, even if code and migrations are already deployed.

---

## Database migrations

Use Wrangler migrations, not ad-hoc one-off SQL file execution, for current deploys:

```bash
cd apps/worker
wrangler d1 migrations apply vouch-db --remote
```

Production already includes the `support_messages` table from migration `0014_support_messages.sql`, but future deploy verification should still use the migration command above.

---

## CI/CD deployment path

> **Current repo note:** the repository currently has multiple workflow files, including `.github/workflows/ci.yml` for general test coverage and `.github/workflows/deploy.yml` for the main deployment pipeline. Treat `deploy.yml` as the canonical deploy automation file; it is not the only workflow file.


The canonical deployment path is GitHub Actions via `.github/workflows/deploy.yml`.

Current behavior:

- tests run on PRs and pushes
- deploy jobs run only on `main`
- worker deploy runs migrations first
- post-deploy smoke checks run from `./scripts/post-deploy-smoke.sh`
- marketing sitemap generation is validated before Pages deploy

Prefer landing infra changes through PRs and letting `main` trigger deploys rather than doing manual prod deploys.

---

## Step 3: Bind Secrets

Use the approved Cloudflare production ops path to bind Worker secrets. Avoid ad-hoc local changes when an authenticated production ops path is available.

Required Worker secrets:

- `JWT_SECRET` — random 32+ character secret
- `RESEND_API_KEY` — Resend API key for transactional email
- `STRIPE_SECRET_KEY` — Stripe API secret
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- `RESEND_WEBHOOK_SECRET` — Resend inbound webhook signing secret for `/api/support/inbound`

If the creator/operator is intentionally performing the binding directly with Wrangler, the equivalent commands are:

```bash
cd apps/worker
wrangler secret put JWT_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put RESEND_WEBHOOK_SECRET
```

---

## Step 4: Stripe Webhook Setup

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. URL: `https://api.socialproof.dev/billing/webhook`
4. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Copy the **Signing secret** → use as `STRIPE_WEBHOOK_SECRET` above

---

## Step 5: Deploy the Worker

```bash
cd apps/worker
wrangler d1 migrations apply vouch-db --remote
wrangler deploy
```

### Dashboard Pages

```bash
cd apps/dashboard
npm install
npm run build
wrangler pages deploy dist --project-name=proof-dashboard
```

### Marketing Pages

Production dogfooding for the marketing homepage widget depends on the Pages build variable `PUBLIC_MARKETING_WIDGET_ID`.
If that variable is unset, the site falls back to the static testimonial cards even though the widget code is present.
When rolling out or verifying dogfooding, confirm the chosen value is bound in the target Pages environment before deploy.
The production smoke script (`scripts/post-deploy-smoke.sh`) now also distinguishes mode at a high level: it emits `WARN [marketing-mode]` when the homepage is still serving the static fallback testimonial cards instead of a live widget-backed marketing section. Treat that warning as evidence that `PUBLIC_MARKETING_WIDGET_ID` is still unset or not taking effect in production.

```bash
cd apps/marketing-site
npm install
npm run build
wrangler pages deploy dist --project-name=socialproof-marketing
```

---

## DNS / domain expectations

Production customer-facing surfaces:

- `https://socialproof.dev` → marketing site / Pages
- `https://app.socialproof.dev` → dashboard / Pages
- `https://api.socialproof.dev` → `vouch-worker`

Do not use `https://widget.socialproof.dev/` root-path 200 checks as a health signal. Widget hosting is asset-based; verify the actual served asset path under `/v1` instead.

---

## Post-deploy verification checklist

After a production deploy, verify from live endpoints:

### Core health

- `https://socialproof.dev` returns `200`
- `https://app.socialproof.dev` returns `200`
- `https://api.socialproof.dev/health` returns `200`
- widget asset endpoint under `/v1` returns `200`

### Marketing / SEO safety checks

Spot-check that key marketing pages still render:

- `/for/plumbers/`
- `/for/gyms/`
- `/for/yoga-studios/`
- `/vs/boast/`
- `/vs/yotpo/`
- a representative blog page such as `/blog/testimonials-for-yoga-studios/`

If deploys touched sitemap generation, fetch `https://socialproof.dev/sitemap-0.xml` and confirm expected routes are present.

### Support inbound verification

Only run this when `RESEND_WEBHOOK_SECRET` is bound in production.

1. Re-check the Worker bindings and confirm `RESEND_WEBHOOK_SECRET` exists.
2. Send one inbound support email through the real route.
3. Verify a row lands in `support_messages` in production D1.

If the secret is absent, stop and treat it as a creator-owned Cloudflare config blocker rather than repeatedly testing the endpoint.

---

## Notes on current known blockers

- Production support inbound remains blocked until `RESEND_WEBHOOK_SECRET` is bound on `vouch-worker`.
- SES sending for the separate `ses-agent` identity is tracked outside repo deploy automation and requires AWS IAM permissions not managed from this environment.

Keep blocked-state updates concise and only refresh them when the underlying config actually changes.
