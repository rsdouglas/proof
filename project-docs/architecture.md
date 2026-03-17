# Proof — Architecture Decision Record

*Filed by: proof-ceo | Date: 2026-03-03*

---

## Stack Decision: Cloudflare All The Way

We're going all-in on Cloudflare. Here's why and what each piece does.

### Cloudflare Pages
**What**: Static site hosting + React SPA
**Used for**: 
- `socialproof.dev` — marketing/landing page
- `app.socialproof.dev` — customer dashboard

**Why**: Free tier is generous, deploy from GitHub, global CDN, integrates naturally with Workers.

### Cloudflare Workers
**What**: Edge compute, serverless functions
**Used for**:
- `api.socialproof.dev` — REST API (auth, testimonial CRUD, widget config, billing webhooks)
- `widget.socialproof.dev` — widget script serving (must be fast, cached at edge)
- Stripe webhook handler

**Why**: Sub-10ms cold starts globally. No servers to manage. Pay per request at scale.

### Cloudflare D1
**What**: Serverless SQLite at the edge
**Used for**:
- `accounts` table — users, subscription status, API keys
- `testimonials` table — text, author, rating, status (pending/approved/rejected), media refs
- `widgets` table — config per widget (theme, layout, business name)
- `events` table — popup events (activity notifications)

**Schema sketch**:
```sql
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  plan TEXT DEFAULT 'free',
  created_at INTEGER
);

CREATE TABLE widgets (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  name TEXT,
  config JSON,
  created_at INTEGER,
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE TABLE testimonials (
  id TEXT PRIMARY KEY,
  widget_id TEXT NOT NULL,
  author_name TEXT,
  author_email TEXT,
  author_title TEXT,
  text TEXT NOT NULL,
  rating INTEGER,
  status TEXT DEFAULT 'pending',
  media_url TEXT,
  created_at INTEGER,
  FOREIGN KEY (widget_id) REFERENCES widgets(id)
);
```

### Cloudflare KV
**What**: Key-value store, globally replicated
**Used for**:
- Widget content cache: `widget:{id}` → serialized JSON of approved testimonials
- Session tokens
- Rate limiting counters

**Why KV for widget cache**: The widget script is called on every page view of every customer's site. It must be blazing fast. KV reads at edge are ~1ms. D1 reads are ~5-20ms (still fast, but KV is better for hot paths).

Cache invalidation: when a testimonial is approved/rejected, purge `widget:{id}` from KV.

### Cloudflare R2
**What**: S3-compatible object storage
**Used for**: Photo and video testimonials (Phase 3+)
**Not needed for MVP**

---

## Widget Architecture

The embed script must be:
1. **Tiny** — < 5KB minified+gzipped
2. **Fast** — < 50ms to first content globally
3. **Non-blocking** — async load, doesn't affect host site performance
4. **Self-contained** — no dependencies, works on any site

```html
<!-- Customer puts this on their site: -->
<script async src="https://widget.socialproof.dev/v1.js" data-widget="wgt_abc123"></script>
```

The script:
1. Reads `data-widget` attribute
2. Fetches `https://widget.socialproof.dev/data/{widget_id}` (served from KV edge cache)
3. Renders testimonial carousel inline (custom elements or simple div injection)
4. Tracks impression event (fire-and-forget fetch to analytics endpoint)

**Framework choice**: Vanilla JS. No React/Vue/Svelte. The widget runs on customer websites — we can't control what other scripts are there, and we can't add 40KB of framework overhead.

---

## Auth Strategy

**Choice**: Custom JWT auth in Workers (not Cloudflare Access)

**Why**: Cloudflare Access requires a domain-level setup that's overkill for a SaaS app dashboard. We want:
- Email/password signup (or magic link)
- JWT session token stored in `httpOnly` cookie
- Standard `/api/auth/login`, `/api/auth/signup`, `/api/auth/logout` endpoints

**Session flow**:
1. User signs up → Worker creates account in D1, hashes password (bcrypt-js), sets JWT cookie
2. JWT contains `{ sub: account_id, plan: "free", exp: ... }`
3. All API routes validate JWT from cookie

**For MVP**: password auth is fine. Magic link (email OTP) is nicer UX but adds email sending complexity — defer to v1.1.

---

## Stripe Integration

- Free tier: no Stripe, just create account
- Pro: redirect to Stripe Checkout (hosted, easiest)
- Webhook: `customer.subscription.created/updated/deleted` → update `accounts.plan` in D1
- Portal: Stripe Customer Portal for billing management (zero custom billing UI)

---

## Deployment Flow

```
GitHub push → GitHub Actions → 
  - Run tests
  - Build dashboard (Vite)
  - Deploy Workers (wrangler deploy)
  - Deploy Pages (wrangler pages deploy)
```

Single `wrangler.toml` in the root defines Workers + D1/KV bindings.

---

## What We're NOT Building (Yet)

- Email sending (use Resend or Mailgun when needed, defer for now)
- Admin panel (use D1 console for now)
- Multi-tenancy at infrastructure level (single D1 DB, row-level isolation)
- SOC2 / GDPR tooling (flag when we're close to real revenue)
