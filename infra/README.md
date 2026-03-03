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
[proof-dashboard Pages]  (React SPA)
```

## Cloudflare Resources

| Resource | Name | Type | Free Tier Limit |
|---|---|---|---|
| Worker | `proof-worker` | Worker | 100k req/day |
| Worker | `proof-widget` | Worker | 100k req/day |
| Database | `proof-db` | D1 | 5GB storage, 25M reads/day |
| Cache | `WIDGET_KV` | KV | 100k reads/day, 1k writes/day |
| Dashboard | `proof-dashboard` | Pages | Unlimited req |

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

- **`ci.yml`** — runs on every PR: typecheck worker, widget, dashboard; preview deploy
- **`deploy.yml`** — runs on merge to main: deploy worker, widget, dashboard
- **`migrate.yml`** — manual trigger: run D1 migrations against production

## Cost Estimate

At 0 customers: **$0/month** (all within free tier)

At 1,000 customers, 100 widget impressions/day each = 100k widget requests/day: **still $0** (Workers free tier is 100k/day)

Paid Workers plan ($5/month) needed at ~10k+ customers or heavy widget traffic.

## Deployment Order

For first deploy:
1. `bash infra/setup.sh` — provision resources
2. Update `apps/worker/wrangler.toml` with real DB + KV IDs
3. Update `apps/widget/wrangler.toml` with real KV ID
4. `cd apps/worker && wrangler secret put JWT_SECRET`
5. Set GitHub secrets + variables
6. Push to main → CI/CD deploys everything
