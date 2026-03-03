#!/usr/bin/env bash
# Proof — Cloudflare Infrastructure Setup
# Run once to provision all required Cloudflare resources.
# Prerequisites: wrangler installed, logged in (`wrangler login`)

set -e

echo "=== Proof Cloudflare Infrastructure Setup ==="
echo ""

# ── D1 Database ─────────────────────────────────────────────────────────────
echo "Creating D1 database: proof-db"
DB_OUTPUT=$(wrangler d1 create proof-db 2>&1)
echo "$DB_OUTPUT"
DB_ID=$(echo "$DB_OUTPUT" | grep -o 'database_id = "[^"]*"' | cut -d'"' -f2)
echo "→ Database ID: $DB_ID"
echo ""

# ── KV Namespace ─────────────────────────────────────────────────────────────
echo "Creating KV namespace: WIDGET_KV"
KV_OUTPUT=$(wrangler kv:namespace create WIDGET_KV 2>&1)
echo "$KV_OUTPUT"
KV_ID=$(echo "$KV_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
echo "→ KV ID: $KV_ID"
echo ""

# ── Cloudflare Pages ──────────────────────────────────────────────────────────
echo "Creating Pages project: proof-dashboard"
wrangler pages project create proof-dashboard --production-branch=main 2>&1 || echo "(project may already exist)"
echo ""

# ── Run D1 Migration ──────────────────────────────────────────────────────────
echo "Running D1 migration (initial schema)..."
wrangler d1 execute proof-db --file=apps/worker/migrations/0001_initial.sql 2>&1
echo "✓ Migration applied"
echo ""

# ── Update wrangler.toml files ────────────────────────────────────────────────
echo "=== UPDATE THESE FILES MANUALLY ==="
echo ""
echo "apps/worker/wrangler.toml — replace placeholder values:"
echo "  [[d1_databases]] database_id = \"$DB_ID\""
echo "  [[kv_namespaces]] id = \"$KV_ID\""
echo ""
echo "apps/widget/wrangler.toml — replace placeholder value:"
echo "  [[kv_namespaces]] id = \"$KV_ID\""
echo ""

# ── Set JWT secret ────────────────────────────────────────────────────────────
echo "=== SET JWT SECRET ==="
echo "Run the following to set the JWT secret (generate a strong random value):"
echo "  cd apps/worker && wrangler secret put JWT_SECRET"
echo "  # Use: openssl rand -hex 32"
echo ""

# ── GitHub Secrets ────────────────────────────────────────────────────────────
echo "=== GITHUB SECRETS TO SET ==="
echo "  gh secret set CLOUDFLARE_API_TOKEN   # needs Workers:Edit, D1:Edit, Pages:Edit, KV:Edit"
echo "  gh secret set CLOUDFLARE_ACCOUNT_ID  # your Cloudflare account ID"
echo ""
echo "=== GITHUB VARIABLES TO SET ==="
echo "  gh variable set VITE_API_URL --body 'https://proof-worker.<YOUR_ACCOUNT>.workers.dev'"
echo ""

echo "=== DONE ==="
echo "Resources created:"
echo "  D1 database:    proof-db ($DB_ID)"
echo "  KV namespace:   WIDGET_KV ($KV_ID)"
echo "  Pages project:  proof-dashboard"
echo "  Workers to deploy: proof-worker, proof-widget (via CI/CD or wrangler deploy)"
