# Deployment Runbook — Vouch on Cloudflare

**Goal:** Get `api.socialproof.dev`, `app.socialproof.dev`, and `widget.socialproof.dev` live.

---

## Prerequisites

- Cloudflare account with `socialproof.dev` domain added
- Node.js 18+ installed locally
- Wrangler CLI: `npm install -g wrangler` then `wrangler login`
- Stripe account (for billing secrets)
- Resend account (for transactional emails)

---

## Step 1: Cloudflare Resources

### 1a. Create D1 Database

```bash
wrangler d1 create vouch-db
```

Copy the `database_id` from the output. Update `apps/worker/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "vouch-db"
database_id = "PASTE_DATABASE_ID_HERE"
```

### 1b. Create KV Namespace

```bash
wrangler kv namespace create vouch-kv
wrangler kv namespace create vouch-kv --preview  # for local dev
```

Copy both namespace IDs. Update `apps/worker/wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "KV"
id = "PASTE_PRODUCTION_ID_HERE"
preview_id = "PASTE_PREVIEW_ID_HERE"
```

---

## Step 2: Run Database Migrations

```bash
cd apps/worker

# Run all migrations in order
wrangler d1 execute vouch-db --remote --file=migrations/0001_initial.sql
wrangler d1 execute vouch-db --remote --file=migrations/0002_widget_columns.sql
wrangler d1 execute vouch-db --remote --file=migrations/0003_billing.sql
wrangler d1 execute vouch-db --remote --file=migrations/0004_widget_events.sql
wrangler d1 execute vouch-db --remote --file=migrations/0005_onboarding.sql
```

---

## Step 3: Set Secrets

```bash
cd apps/worker

# Required
wrangler secret put JWT_SECRET
# Enter a random 32+ char string, e.g.: openssl rand -base64 32

wrangler secret put RESEND_API_KEY
# Enter your Resend API key (from resend.com/api-keys)

wrangler secret put STRIPE_SECRET_KEY
# Enter your Stripe secret key (sk_live_... or sk_test_... for testing)

wrangler secret put STRIPE_WEBHOOK_SECRET
# Enter your Stripe webhook signing secret (see Step 4)
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
wrangler deploy
```

Expected output: `Published vouch-worker (https://vouch-worker.YOUR_ACCOUNT.workers.dev)`

---

## Step 6: Deploy the Dashboard (Pages)

### Option A: GitHub Integration (recommended)
1. Cloudflare Dashboard → Pages → Create application → Connect to Git
2. Select `rsdouglas/proof` repo
3. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `cd apps/dashboard && npm install && npm run build`
   - **Build output directory:** `apps/dashboard/dist`
4. Environment variables:
   - `VITE_API_URL` = `https://api.socialproof.dev`
5. Deploy → note your Pages URL (e.g. `vouch-dashboard.pages.dev`)

### Option B: Manual deploy
```bash
cd apps/dashboard
VITE_API_URL=https://api.socialproof.dev npm run build
wrangler pages deploy dist --project-name=vouch-dashboard
```

---

## Step 7: DNS Setup

In Cloudflare DNS for `socialproof.dev`:

| Type | Name | Target | Proxy |
|------|------|---------|-------|
| CNAME | `api` | `vouch-worker.YOUR_ACCOUNT.workers.dev` | ✅ Proxied |
| CNAME | `app` | `vouch-dashboard.pages.dev` | ✅ Proxied |

For the widget script (served from worker at `/widget.js`):

| Type | Name | Target | Proxy |
|------|------|---------|-------|
| CNAME | `widget` | `vouch-worker.YOUR_ACCOUNT.workers.dev` | ✅ Proxied |

**Custom domains in Cloudflare Workers:**
- Worker dashboard → `vouch-worker` → Triggers → Custom Domains
- Add: `api.socialproof.dev`, `widget.socialproof.dev`

**Custom domain for Pages:**
- Pages project → Custom domains → Add `app.socialproof.dev`

---

## Step 8: GitHub Actions Secrets (CI/CD)

In `github.com/rsdouglas/proof/settings/secrets/actions`, add:

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | CF API token with Workers + Pages deploy permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your CF account ID (from CF dashboard URL) |

Create the CF API token at: [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
- Template: **Edit Cloudflare Workers**
- Add permission: **Cloudflare Pages: Edit**

---

## Step 9: Verify

```bash
# Test the API is live
curl https://api.socialproof.dev/health

# Test widget script loads
curl https://widget.socialproof.dev/widget.js | head -5

# Test dashboard loads
open https://app.socialproof.dev
```

---

## Resend Email Domain Setup (for transactional emails)

1. [resend.com/domains](https://resend.com/domains) → Add `socialproof.dev`
2. Add the DNS records Resend provides (SPF, DKIM, DMARC)
3. Verify domain
4. Your sending address `notifications@socialproof.dev` is now ready

---

## Post-Deploy Checklist

- [ ] `curl https://api.socialproof.dev/health` returns 200
- [ ] Can sign up at `https://app.socialproof.dev`
- [ ] Widget embed script loads from `https://widget.socialproof.dev/widget.js`
- [ ] Test testimonial submission end-to-end
- [ ] Stripe test checkout works (use test card `4242 4242 4242 4242`)
- [ ] Welcome email arrives on signup
- [ ] CI/CD: push a commit, verify GitHub Actions deploys successfully

---

## Troubleshooting

**Worker not found / 404:** Check custom domain is added in Workers triggers  
**CORS errors:** Verify `api.socialproof.dev` is in allowed origins (already in code)  
**D1 errors:** Confirm all 5 migrations ran successfully  
**Email not sending:** Check `RESEND_API_KEY` secret and domain verification in Resend  
**Stripe webhook 400:** Verify `STRIPE_WEBHOOK_SECRET` matches the endpoint signing secret  
