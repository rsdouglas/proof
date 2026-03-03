# Proof — Cloudflare Infrastructure

## Architecture

```
[Customer Sites]
     │
     │  <script src="https://proof-widget.*.workers.dev/v1/proof.js">
     ▼
[proof-widget Worker]  ←→  [WIDGET_KV namespace]
     │                         (5-min cache)
     │  GET /w/:widgetId
     ▼
[proof-worker Worker]  ←→  [proof-db D1 database]
     ▲
     │  authenticated API
     │
[proof-dashboard Pages]  (React SPA — app.proof.app)
[proof-landing Pages]    (Static HTML — proof.app)
```

## Cloudflare Resources

| Resource | Name | Type | Free Tier Limit |
|---|---|---|---|
| Worker | `proof-worker` | Worker | 100k req/day |
| Worker | `proof-widget` | Worker | 100k req/day |
| Database | `proof-db` | D1 | 5GB storage, 25M reads/day |
| Cache | `WIDGET_KV` | KV | 100k reads/day, 1k writes/day |
| Dashboard | `proof-dashboard` | Pages | Unlimited req |
| Landing | `proof-landing` | Pages | Unlimited req |

**Both workers share one KV namespace.** `proof-worker` writes widget cache; `proof-widget` reads it.

## Provisioning

```bash
# One-time setup (requires wrangler login)
bash infra/setup.sh
```

Then update both `wrangler.toml` files with the real IDs the script outputs.

## GitHub Secrets & Variables

Set these in the repo settings before CI/CD workflows run:

### Secrets
| Name | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | CF API token with Workers:Edit, D1:Edit, Pages:Edit, KV:Edit |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |

### Variables
| Name | Example | Description |
|---|---|---|
| `VITE_API_URL` | `https://proof-worker.abc.workers.dev` | Dashboard → Worker API URL |

## CI/CD Workflows

See `.github/workflows/` (on branch `ops/ci-cd-cloudflare` — pending `workflows` permission grant):

- **`ci.yml`** — runs on every PR: typecheck worker, widget, dashboard; preview deploys
- **`deploy.yml`** — runs on merge to main: deploy worker, widget, dashboard, landing
- **`migrate.yml`** — manual trigger: run D1 migrations against production

## Cost Estimate

At 0 customers: **$0/month** (all within free tier)

At 1,000 customers, 100 widget impressions/day each = 100k widget requests/day: **still $0** (Workers free tier is 100k/day)

Paid Workers plan ($5/month) needed at ~10k+ customers or heavy widget traffic.

## Deployment Order (first deploy)

1. `bash infra/setup.sh` — provision all resources
2. Update `apps/worker/wrangler.toml` with real DB + KV IDs
3. Update `apps/widget/wrangler.toml` with real KV ID
4. `cd apps/worker && wrangler secret put JWT_SECRET`
5. Set GitHub secrets + variables
6. Push to main → CI/CD deploys everything

## Resource Checklist

- [ ] D1 database `proof-db` created
- [ ] KV namespace `WIDGET_KV` created  
- [ ] Pages project `proof-dashboard` created
- [ ] Pages project `proof-landing` created
- [ ] `apps/worker/wrangler.toml` updated with real IDs
- [ ] `apps/widget/wrangler.toml` updated with real KV ID
- [ ] JWT_SECRET set as Worker secret
- [ ] GitHub secrets set: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
- [ ] GitHub variable set: VITE_API_URL
- [ ] CI/CD workflows committed (needs `workflows` permission)

## DNS Configuration (when going to production)

These DNS records need to be set in Cloudflare (or wherever `useproof.com` is managed):

| Record | Type | Target |
|---|---|---|
| `app.useproof.com` | CNAME | `proof-dashboard.pages.dev` (or custom domain on Pages) |
| `useproof.com` | CNAME | `proof-landing.pages.dev` (or custom domain on Pages) |
| `api.useproof.com` | Worker Route | Route `api.useproof.com/*` → `proof-worker` |

**To set up Worker route for `api.useproof.com`:**
1. Add the domain to your Cloudflare zone
2. In Workers & Pages → proof-worker → Settings → Triggers, add custom domain `api.useproof.com`
3. Or add to `apps/worker/wrangler.toml`:
   ```toml
   routes = [
     { pattern = "api.useproof.com/*", zone_name = "useproof.com" }
   ]
   ```

Add to resource checklist:
- [ ] DNS zone for `useproof.com` in Cloudflare
- [ ] Worker route: `api.useproof.com` → proof-worker
- [ ] Custom domain: `app.useproof.com` → proof-dashboard Pages
- [ ] Custom domain: `useproof.com` → proof-landing Pages
- [ ] Worker route: `widget.useproof.com` → proof-widget (added by PR #29)
- [ ] DNS verification for `useproof.com` in Resend (for email notifications, PR #30)

## Email (Resend)

PR #30 adds email notifications from `notifications@useproof.com`.

**Resend domain verification DNS records** (add in Cloudflare for `useproof.com`):

| Record | Type | Value |
|---|---|---|
| `useproof.com` | TXT | Resend SPF record (get from Resend dashboard) |
| `resend._domainkey.useproof.com` | TXT | Resend DKIM key (get from Resend dashboard) |

**Steps:**
1. Sign up at [resend.com](https://resend.com)
2. Add domain `useproof.com`, copy the DNS records they provide
3. Add those DNS records in Cloudflare
4. Click "Verify" in Resend dashboard
5. Set Worker secret: `wrangler secret put RESEND_API_KEY`

**Limits:** Free tier = 100 emails/day, 3,000/month. Sufficient for MVP.

## Widget subdomain (widget.useproof.com)

PR #29 sets embed scripts to reference `widget.useproof.com`. Add Worker route:

```toml
# apps/widget/wrangler.toml
routes = [
  { pattern = "widget.useproof.com/*", zone_name = "useproof.com" }
]
```

Or set as custom domain in Workers & Pages → proof-widget → Settings → Triggers.

## Secrets Checklist

All secrets required before production deploy:

| Secret | Command | Notes |
|---|---|---|
| `JWT_SECRET` | `wrangler secret put JWT_SECRET` (proof-worker) | `openssl rand -hex 32` |
| `RESEND_API_KEY` | `wrangler secret put RESEND_API_KEY` (proof-worker) | Set AFTER domain verified |
| `STRIPE_SECRET_KEY` | `wrangler secret put STRIPE_SECRET_KEY` (proof-worker) | When billing goes live |
| `CLOUDFLARE_API_TOKEN` | GitHub repo secret | CI/CD deploys |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub repo secret | CI/CD deploys |
| `VITE_API_URL` | GitHub repo variable | e.g. `https://api.useproof.com` |
