import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getCookie } from 'hono/cookie'
import { testimonials } from './routes/testimonials'
import { widgets } from './routes/widgets'
import { widget } from './routes/widget'
import { collect } from './routes/collect'
import { submit } from './routes/submit'
import { auth, verifyToken } from './routes/auth'
import { accounts } from './routes/accounts'
import { collectWidget } from './routes/collect_widget'
import { billing } from './routes/billing'
import { analytics } from './routes/analytics'
import { wall } from './routes/wall'
import { webhooks } from './routes/webhooks'
import { apiKeys, resolveApiKey } from './routes/api_keys'
import waitlist from './routes/waitlist'
import { agent } from './routes/agent'
import { admin } from './routes/admin'
import { outreach } from './routes/outreach'
import support from './routes/support'
export interface Env {
  DB: D1Database
  WIDGET_KV: KVNamespace
  JWT_SECRET: string
  ENVIRONMENT?: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  STRIPE_PRO_PRICE_ID: string
  RESEND_API_KEY?: string
  ADMIN_SECRET?: string
  ADMIN_TOKEN?: string
}

export type Variables = {
  accountId: string
  plan: string
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use('*', cors({
  origin: (origin) => {
    const allowed = [
      'https://socialproof.dev',
      'https://www.socialproof.dev',
      'https://socialproof.dev',
      'https://app.socialproof.dev',
      'http://localhost:3000',
      'http://localhost:5173',
    ]
    // Return the origin if it's in the allowlist, null otherwise.
    // Returning null tells hono/cors to omit the header, blocking the request.
    return allowed.includes(origin) ? origin : null
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

// ── Public routes ─────────────────────────────────────────────────────────────
// Embeddable widget JSON (served by widget worker too, this is a fallback)
app.route('/w', widget)
// Public testimonial wall (server-rendered HTML)
app.route('/wall', wall)
// Hosted collection form
app.route('/c', collect)
// Collection form submission (public)
app.route('/', submit)
// Widget-based collection form
app.route('/collect', collectWidget)
app.route('/api/collect', collectWidget)

// Public analytics track endpoint (no auth - widget embeds call this)
app.post('/api/track/:widgetId', async (c) => {
  return analytics.fetch(new Request(new URL('/track/' + c.req.param('widgetId'), 'https://x.x'), {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.raw.body,
  }), c.env, c.executionCtx)
})

// ── Auth routes (no JWT required) ────────────────────────────────────────────
app.route('/api/auth', auth)

// Waitlist (public, no auth required)
app.route('/api/waitlist', waitlist)

// Agent registration (public, no auth required)
app.route('/agent', agent)

// Admin metrics (protected by ADMIN_SECRET header)
app.route('/api/admin', admin)
app.route('/api/admin/outreach', outreach)
// Support inbox (inbound email via Resend + admin list)
// POST /api/support/inbound — Resend webhook
// GET  /api/support/admin-list — admin view (x-admin-key required)
app.route('/api/support', support)

// Stripe webhook (no JWT - validated by signature)
app.post('/api/billing/webhook', async (c) => {
  // Route to billing handler directly (bypass JWT)
  return billing.fetch(new Request(new URL('/webhook', 'https://x.x'), {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.raw.body,
  }), c.env, c.executionCtx)
})

// Public widget beacon (no auth — called by embedded widget scripts)
app.post('/api/widgets/:id/beacon', async (c) => {
  const id = c.req.param('id')
  const origin = c.req.header('origin') || c.req.header('referer') || ''
  let domain = ''
  try { domain = origin ? new URL(origin).hostname : '' } catch { domain = '' }

  const row = await c.env.DB.prepare('SELECT id, embed_verified_at FROM widgets WHERE id = ?').bind(id).first<{ id: string; embed_verified_at: string | null }>()
  if (!row) return c.json({ ok: false }, 404)

  const now = new Date().toISOString()
  const shouldUpdate = !row.embed_verified_at ||
    (Date.now() - new Date(row.embed_verified_at).getTime()) > 3_600_000

  if (shouldUpdate) {
    await c.env.DB.prepare('UPDATE widgets SET embed_verified_at = ?, embed_domain = ? WHERE id = ?')
      .bind(now, domain || null, id).run()
  }
  return c.json({ ok: true })
})

app.options('/api/widgets/:id/beacon', async (c) => {
  return c.newResponse(null, { status: 204, headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }})
})

// ── JWT middleware for all other /api/* routes ────────────────────────────────
app.use('/api/*', async (c, next) => {
  // Check cookie first, then Authorization Bearer/Token header
  const cookie = getCookie(c, 'proof_token')
  const authHeader = c.req.header('Authorization') ?? ''
  let token = cookie

  if (!token) {
    if (authHeader.startsWith('Bearer sk_live_')) {
      // API key auth: sk_live_... keys bypass JWT
      const rawKey = authHeader.replace('Bearer ', '')
      const resolved = await resolveApiKey(rawKey, c.env.DB)
      if (!resolved) return c.json({ error: 'Invalid API key' }, 401)
      // Look up plan for this account
      const acct = await c.env.DB.prepare(
        'SELECT plan FROM accounts WHERE id = ?'
      ).bind(resolved.accountId).first<{ plan: string }>()
      c.set('accountId', resolved.accountId)
      c.set('plan', acct?.plan ?? 'free')
      return next()
    }
    token = authHeader.replace('Bearer ', '') || undefined
  }

  if (!token) return c.json({ error: 'Authentication required' }, 401)

  const claims = await verifyToken(token, c.env.JWT_SECRET)
  if (!claims) return c.json({ error: 'Invalid or expired token' }, 401)

  c.set('accountId', claims.sub)
  c.set('plan', claims.plan)
  return next()
})

// ── Protected API routes ──────────────────────────────────────────────────────
app.route('/api/testimonials', testimonials)
app.route('/api/widgets', widgets)
app.route('/api/accounts', accounts)
app.route('/api/billing', billing)
app.route('/api/analytics', analytics)
app.route('/api/webhooks', webhooks)
app.route('/api/api-keys', apiKeys)
// Collection forms
app.get('/api/collection-forms', async (c) => {
  const accountId = c.get('accountId')
  let { results } = await c.env.DB.prepare(
    'SELECT id, name, active, created_at FROM collection_forms WHERE account_id = ? ORDER BY created_at DESC'
  ).bind(accountId).all()

  // Lazy-init: create a default form for accounts that predate auto-creation on signup
  if (results.length === 0) {
    const id = 'frm_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12)
    const now = new Date().toISOString()
    await c.env.DB.prepare(
      'INSERT INTO collection_forms (id, account_id, name, active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)'
    ).bind(id, accountId, 'Default', now, now).run()
    results = [{ id, name: 'Default', active: 1, created_at: now }]
  }

  return c.json({ forms: results })
})

app.post('/api/collection-forms', async (c) => {
  const accountId = c.get('accountId')
  let body: { name?: string }
  try { body = await c.req.json() } catch { return c.json({ error: 'Invalid JSON' }, 400) }
  if (!body.name?.trim()) return c.json({ error: 'Name required' }, 400)
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    'INSERT INTO collection_forms (id, account_id, name, active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)'
  ).bind(id, accountId, body.name.trim(), now, now).run()
  return c.json({ id, name: body.name.trim(), active: 1, created_at: now }, 201)
})

app.delete('/api/collection-forms/:id', async (c) => {
  const accountId = c.get('accountId')
  const id = c.req.param('id')
  await c.env.DB.prepare(
    'DELETE FROM collection_forms WHERE id = ? AND account_id = ?'
  ).bind(id, accountId).run()
  return c.json({ ok: true })
})

// Dashboard stats
app.get('/api/stats', async (c) => {
  const accountId = c.get('accountId')
  const [testimonialCount, widgetCount, pending, approved] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as count FROM testimonials WHERE account_id = ?').bind(accountId).first<{ count: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as count FROM widgets WHERE account_id = ?').bind(accountId).first<{ count: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) as count FROM testimonials WHERE account_id = ? AND status = 'pending'").bind(accountId).first<{ count: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) as count FROM testimonials WHERE account_id = ? AND status = 'approved'").bind(accountId).first<{ count: number }>(),
  ])
  return c.json({
    testimonials: Number(testimonialCount?.count ?? 0),
    widgets: Number(widgetCount?.count ?? 0),
    pending: Number(pending?.count ?? 0),
    approved: Number(approved?.count ?? 0),
  })
})

// Health check
app.get('/health', (c) => c.json({ ok: true, ts: new Date().toISOString() }))

// 404 fallback
app.notFound((c) => c.json({ error: 'Not found' }, 404))

export default app

// Cloudflare Scheduled handler for drip email cron
import { handleCron } from './cron'

export const scheduled: ExportedHandlerScheduledHandler<Env> = (ctrl, env, ctx) => {
  ctx.waitUntil(handleCron(ctrl, env))
}
