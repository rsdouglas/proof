# Proof — Infrastructure

## Architecture

```
Customer Site
    └── <script> embed
         └── Cloudflare Worker (proof-worker.*.workers.dev)
              ├── Hono REST API
              ├── D1 database (proof-db) — accounts, testimonials, widgets, forms
              └── KV namespace (WIDGET_KV) — cached widget JSON for fast reads

Dashboard
    └── Cloudflare Pages (proof-dashboard.pages.dev)
         └── React SPA → calls Worker API
```

## One-time Setup

```bash
# 1. Install wrangler and authenticate
npm install -g wrangler
wrangler login

# 2. Run setup script
bash infra/setup.sh

# 3. Update wrangler.toml with IDs from step 2, then commit

# 4. Run initial migration
cd apps/worker
wrangler d1 migrations apply proof-db --remote

# 5. Set Worker secrets
wrangler secret put JWT_SECRET   # generate: openssl rand -base64 32
```

## GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | API token with Workers, D1, Pages, KV edit permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |

## GitHub Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Worker URL for dashboard | `https://proof-worker.acme.workers.dev` |

## CI/CD Workflows

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `ci.yml` | PR / push to main | Typecheck, preview deploy |
| `deploy.yml` | Push to main | Deploy worker + dashboard |
| `migrate.yml` | Manual | Run D1 migrations |

## Cloudflare API Token Permissions

Create a token at https://dash.cloudflare.com/profile/api-tokens with:
- **Workers Scripts**: Edit
- **Workers D1**: Edit  
- **Cloudflare Pages**: Edit
- **Workers KV Storage**: Edit
- **Account**: Read (for account ID lookup)

## Costs (Free Tier)

| Resource | Free Tier Limit | Expected Usage |
|----------|----------------|----------------|
| Workers | 100k req/day | Fine until ~1k customers |
| D1 | 5GB storage, 25M row reads/day | Fine until scale |
| KV | 100k reads/day, 1GB | Abundant |
| Pages | Unlimited sites, 500 builds/month | Fine |

All free until meaningful scale. Review when DAU > 1k.
