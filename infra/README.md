# Proof — Cloudflare Infrastructure

## Architecture

```
[Customer Sites]
     │
     │  <script src="https://vouch-widget.*.workers.dev/v1/proof.js">
     ▼
[vouch-widget Worker]  ←→  [WIDGET_KV namespace]
     │                         (5-min cache)
     │  GET /w/:widgetId
     ▼
[vouch-worker Worker]  ←→  [vouch-db D1 database]
     ▲
     │  authenticated API
     │
[vouch-dashboard Pages]  (React SPA — app.socialproof.dev)
[socialproof-marketing Pages]    (Marketing site — intended Pages project)
```

## Cloudflare Resources

| Resource | Name | Type | Free Tier Limit |
|---|---|---|---|
| Worker | `vouch-worker` | Worker | 100k req/day |
| Worker | `vouch-widget` | Worker | 100k req/day |
| Database | `vouch-db` | D1 | 5GB storage, 25M reads/day |
| Cache | `WIDGET_KV` | KV | 100k reads/day, 1k writes/day |
| Dashboard | `vouch-dashboard` | Pages | Unlimited req |
| Marketing site | `socialproof-marketing` | Pages | Unlimited req |

**Both workers share one KV namespace.** `vouch-worker` writes widget cache; `vouch-widget` reads it.

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
| `VITE_API_URL` | `https://vouch-worker.abc.workers.dev` | Dashboard → Worker API URL |

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

- [ ] D1 database `vouch-db` created
- [ ] KV namespace `WIDGET_KV` created  
- [ ] Pages project `vouch-dashboard` created
- [ ] Pages project `socialproof-marketing` created
- [ ] `apps/worker/wrangler.toml` updated with real IDs
- [ ] `apps/widget/wrangler.toml` updated with real KV ID
- [ ] JWT_SECRET set as Worker secret
- [ ] GitHub secrets set: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
- [ ] GitHub variable set: VITE_API_URL
- [ ] CI/CD workflows committed (needs `workflows` permission)

## DNS Configuration (when going to production)

These DNS records need to be set in Cloudflare (or wherever `socialproof.dev` is managed):

| Record | Type | Target |
|---|---|---|
| `app.socialproof.dev` | CNAME | `vouch-dashboard.pages.dev` (or custom domain on Pages) |
| `socialproof.dev` | Custom domain on Pages | Bind to the live marketing Pages project after #523 is fully resolved |
| `api.socialproof.dev` | Worker Route | Route `api.socialproof.dev/*` → `vouch-worker` |

**To set up Worker route for `api.socialproof.dev`:**
1. Add the domain to your Cloudflare zone
2. In Workers & Pages → vouch-worker → Settings → Triggers, add custom domain `api.socialproof.dev`
3. Or add to `apps/worker/wrangler.toml`:
   ```toml
   routes = [
     { pattern = "api.socialproof.dev/*", zone_name = "socialproof.dev" }
   ]
   ```

Add to resource checklist:
- [ ] DNS zone for `socialproof.dev` in Cloudflare
- [ ] Worker route: `api.socialproof.dev` → vouch-worker
- [ ] Custom domain: `app.socialproof.dev` → vouch-dashboard Pages
- [ ] Custom domain: `socialproof.dev` bound to the intended live marketing Pages project (`socialproof-marketing`)


> Note: legacy `vouch-landing` / landing-sync docs were retired after the landing deploy path cleanup.
> If domain binding is still under investigation, track that in #523 / #451 rather than reintroducing the old landing project into setup docs.

## Deploy verification runbook

After any CI/deploy workflow change, wrangler.toml change, or Cloudflare Pages config change, ops should verify:

- `https://socialproof.dev/` returns `200` and renders HTML
- `https://app.socialproof.dev/` returns `200` and renders HTML
- at least one real marketing route still renders from the production domain, e.g.
  - `https://socialproof.dev/for/plumbers/`
  - `https://socialproof.dev/vs/boast/`
  - `https://socialproof.dev/blog/testimonials-for-yoga-studios/`
- `https://marketing.socialproof.dev/` is only considered healthy if DNS resolves **and** the expected Pages project/domain binding is live

Root-path caveats:

- `https://api.socialproof.dev/` may return `404` at `/`; check a real API endpoint instead of the root path
- `https://widget.socialproof.dev/` may return `404` at `/`; check the actual widget script/asset URL instead of the root path

Do not treat a green GitHub Actions run as sufficient evidence of a healthy deploy. Domain binding and the user-visible URLs are part of the deploy verification.
