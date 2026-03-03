#!/bin/bash
# Proof — Cloudflare Infrastructure Setup
# Run this once to provision all required Cloudflare resources.
# Requires: wrangler CLI authenticated with a Cloudflare account.
#
# After running, update:
#   - apps/worker/wrangler.toml (database_id, kv namespace id)
#   - GitHub Actions secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
#   - GitHub Actions variables (VITE_API_URL)

set -euo pipefail

echo "=== Proof Cloudflare Setup ==="

# 1. Create D1 database
echo ""
echo "Creating D1 database: proof-db"
wrangler d1 create proof-db

echo ""
echo ">>> Copy the database_id above into apps/worker/wrangler.toml"
echo ""

# 2. Create KV namespace
echo "Creating KV namespace: WIDGET_KV"
wrangler kv namespace create WIDGET_KV

echo ""
echo ">>> Copy the KV namespace id above into apps/worker/wrangler.toml"
echo ""

# 3. Create Pages project for dashboard
echo "Creating Cloudflare Pages project: proof-dashboard"
wrangler pages project create proof-dashboard --production-branch=main

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Update apps/worker/wrangler.toml with the database_id and KV id from above"
echo "2. Run migrations: wrangler d1 migrations apply proof-db --remote"
echo "3. Add GitHub Actions secrets:"
echo "   - CLOUDFLARE_API_TOKEN (needs Workers:Edit, D1:Edit, Pages:Edit, KV:Edit)"
echo "   - CLOUDFLARE_ACCOUNT_ID"
echo "4. Add GitHub Actions variable:"
echo "   - VITE_API_URL (e.g., https://proof-worker.YOUR_SUBDOMAIN.workers.dev)"
echo "5. Set JWT_SECRET on the Worker:"
echo "   wrangler secret put JWT_SECRET"
echo "6. Deploy!"
