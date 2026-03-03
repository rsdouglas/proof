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

export interface Env {
  DB: D1Database
  WIDGET_KV: KVNamespace
  JWT_SECRET: string
  ENVIRONMENT?: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  STRIPE_PRO_PRICE_ID: string
  RESEND_API_KEY?: string
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
      'https://app.socialproof.dev',
      'http://localhost:3000',
      'http://localhost:5173',
    ]
    return (allowed.includes(origin) ? origin : allowed[0]) as string
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

// Stripe webhook (no JWT - validated by signature)
app.post('/api/billing/webhook', async (c) => {
  // Route to billing handler directly (bypass JWT)
  return billing.fetch(new Request(new URL('/webhook', 'https://x.x'), {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.raw.body,
  }), c.env, c.executionCtx)
})

// ── JWT middleware for all other /api/* routes ────────────────────────────────
app.use('/api/*', async (c, next) => {
  // Check cookie first, then Authorization Bearer header
  const cookie = getCookie(c, 'proof_token')
  const header = c.req.header('Authorization')?.replace('Bearer ', '')
  const token = cookie || header

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

// Collection forms
app.get('/api/collection-forms', async (c) => {
  const accountId = c.get('accountId')
  const { results } = await c.env.DB.prepare(
    'SELECT id, name, active, created_at FROM collection_forms WHERE account_id = ? ORDER BY created_at DESC'
  ).bind(accountId).all()
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
    testimonials: testimonialCount?.count ?? 0,
    widgets: widgetCount?.count ?? 0,
    pending: pending?.count ?? 0,
    approved: approved?.count ?? 0,
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
