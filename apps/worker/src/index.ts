import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'
import { testimonials } from './routes/testimonials'
import { widgets } from './routes/widgets'
import { accounts } from './routes/accounts'
import { widget } from './routes/widget'
import { collect } from './routes/collect'
import { submit } from './routes/submit'

export interface Env {
  DB: D1Database
  WIDGET_KV: KVNamespace
  JWT_SECRET: string
}

export type Variables = {
  accountId: string
  plan: string
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// CORS
app.use('*', cors({
  origin: ['https://useproof.com', 'https://app.useproof.com', 'http://localhost:3000'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

// Public: widget serving & testimonial collection
app.route('/w', widget)
app.route('/c', collect)
app.route('/', submit)

// Auth endpoints (no JWT required)
app.post('/api/auth/register', async (c) => {
  const { email, password, name } = await c.req.json<{ email: string; password: string; name: string }>()
  if (!email || !password || !name) return c.json({ error: 'Missing fields' }, 400)
  if (password.length < 8) return c.json({ error: 'Password too short' }, 400)

  const exists = await c.env.DB.prepare('SELECT id FROM accounts WHERE email = ?').bind(email).first()
  if (exists) return c.json({ error: 'Email already registered' }, 409)

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password + id))
  const hash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('')

  await c.env.DB.prepare(
    'INSERT INTO accounts (id, email, name, plan, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, email.toLowerCase(), name, 'free', hash, now, now).run()

  // Create default collection form
  const formId = crypto.randomUUID()
  await c.env.DB.prepare(
    'INSERT INTO collection_forms (id, account_id, name, active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)'
  ).bind(formId, id, 'Testimonial Request', now, now).run()

  const token = await generateToken(id, c.env.JWT_SECRET)
  return c.json({ token, account: { id, email, name, plan: 'free' } })
})

app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>()
  if (!email || !password) return c.json({ error: 'Missing fields' }, 400)

  const account = await c.env.DB.prepare(
    'SELECT id, email, name, plan, password_hash FROM accounts WHERE email = ?'
  ).bind(email.toLowerCase()).first<{ id: string; email: string; name: string; plan: string; password_hash: string }>()

  if (!account) return c.json({ error: 'Invalid credentials' }, 401)

  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password + account.id))
  const hash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('')

  if (hash !== account.password_hash) return c.json({ error: 'Invalid credentials' }, 401)

  const token = await generateToken(account.id, c.env.JWT_SECRET)
  return c.json({ token, account: { id: account.id, email: account.email, name: account.name, plan: account.plan } })
})

// JWT middleware for /api routes (after auth endpoints)
app.use('/api/*', async (c, next) => {
  // Skip auth/login and auth/register
  const path = c.req.path
  if (path === '/api/auth/login' || path === '/api/auth/register') {
    return next()
  }
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' })
  return jwtMiddleware(c, next)
})

// Set accountId in context from JWT payload
app.use('/api/*', async (c, next) => {
  const path = c.req.path
  if (path === '/api/auth/login' || path === '/api/auth/register') {
    return next()
  }
  const payload = c.get('jwtPayload') as { sub: string; plan?: string }
  c.set('accountId', payload.sub)
  c.set('plan', payload.plan || 'free')
  await next()
})

// Protected API routes
app.route('/api/testimonials', testimonials)
app.route('/api/widgets', widgets)
app.route('/api/accounts', accounts)

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
  const { name } = await c.req.json<{ name: string }>()
  if (!name?.trim()) return c.json({ error: 'Name required' }, 400)
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    'INSERT INTO collection_forms (id, account_id, name, active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)'
  ).bind(id, accountId, name.trim(), now, now).run()
  return c.json({ id, name: name.trim(), active: 1, created_at: now }, 201)
})

app.delete('/api/collection-forms/:id', async (c) => {
  const accountId = c.get('accountId')
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM collection_forms WHERE id = ? AND account_id = ?').bind(id, accountId).run()
  return c.json({ ok: true })
})

// Dashboard stats
app.get('/api/stats', async (c) => {
  const accountId = c.get('accountId')
  const testimonialCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM testimonials WHERE account_id = ?'
  ).bind(accountId).first<{ count: number }>()
  const widgetCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM widgets WHERE account_id = ?'
  ).bind(accountId).first<{ count: number }>()
  const pending = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM testimonials WHERE account_id = ? AND status = ?'
  ).bind(accountId, 'pending').first<{ count: number }>()
  return c.json({
    testimonials: testimonialCount?.count ?? 0,
    widgets: widgetCount?.count ?? 0,
    pending: pending?.count ?? 0,
  })
})

// Health check
app.get('/health', (c) => c.json({ ok: true }))

export default app

async function generateToken(accountId: string, secret: string): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payload = btoa(JSON.stringify({ sub: accountId, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const data = `${header}.${payload}`
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${data}.${sigB64}`
}
