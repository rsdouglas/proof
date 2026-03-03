import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { Env, Variables } from '../index'

import { sendWelcomeEmail } from '../lib/onboarding'
import { checkRateLimit } from '../lib/ratelimit'

export const auth = new Hono<{ Bindings: Env; Variables: Variables }>()

// ── helpers ──────────────────────────────────────────────────────────────────

/** PBKDF2-based password hash using WebCrypto (Workers-compatible, no bcrypt needed) */
async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100_000, hash: 'SHA-256' },
    keyMaterial, 256
  )
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function generateToken(accountId: string, email: string, plan: string, secret: string): Promise<string> {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify({
    sub: accountId,
    email,
    plan,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600, // 30 days
  }))
  const data = `${header}.${payload}`
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return `${data}.${b64url(sig)}`
}

function b64url(data: string | ArrayBuffer): string {
  const str = typeof data === 'string' ? data : String.fromCharCode(...new Uint8Array(data))
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

async function verifyToken(token: string, secret: string): Promise<{ sub: string; email: string; plan: string } | null> {
  try {
    const [header, payload, sig] = token.split('.')
    if (!header || !payload || !sig) return null
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    )
    const sigBytes = Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(`${header}.${payload}`))
    if (!valid) return null
    const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    if (claims.exp < Math.floor(Date.now() / 1000)) return null
    return { sub: claims.sub, email: claims.email, plan: claims.plan }
  } catch {
    return null
  }
}

function prefixedId(prefix: string): string {
  // acc_<nanoid-style 21 chars>
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.getRandomValues(new Uint8Array(21))
  return prefix + '_' + Array.from(bytes).map(b => chars[b % chars.length]).join('')
}

function setAuthCookie(c: any, token: string) {
  setCookie(c, 'proof_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: 30 * 24 * 3600,
  })
}

// ── routes ───────────────────────────────────────────────────────────────────

/** POST /api/auth/signup */
auth.post('/signup', async (c) => {
  let body: { email?: string; password?: string; name?: string }
  try { body = await c.req.json() } catch { return c.json({ error: 'Invalid JSON' }, 400) }

  const { email, password, name } = body
  if (!email || !password || !name) return c.json({ error: 'email, password, and name are required' }, 400)
  if (password.length < 8) return c.json({ error: 'Password must be at least 8 characters' }, 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ error: 'Invalid email' }, 400)

  const normalizedEmail = email.toLowerCase().trim()

  // Rate limit signups per IP (10/hour)
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  const allowed = await checkRateLimit(c.env.WIDGET_KV, `signup:${ip}`, 10, 3600)
  if (!allowed) return c.json({ error: 'Too many signup attempts. Try again later.' }, 429)

  const exists = await c.env.DB.prepare('SELECT id FROM accounts WHERE email = ?').bind(normalizedEmail).first()
  if (exists) return c.json({ error: 'Email already registered' }, 409)

  const id = prefixedId('acc')
  const now = new Date().toISOString()
  const passwordHash = await hashPassword(password, id)

  await c.env.DB.prepare(
    'INSERT INTO accounts (id, email, name, plan, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, normalizedEmail, name.trim(), 'free', passwordHash, now, now).run()

  // Create a default widget for new accounts
  const widgetId = prefixedId('wgt')
  await c.env.DB.prepare(
    'INSERT INTO widgets (id, account_id, name, active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)'
  ).bind(widgetId, id, `${name.trim()}'s Reviews`, now, now).run()

  // Send welcome email — fire-and-forget (don't block signup if email fails)
  if (c.env.RESEND_API_KEY) {
    sendWelcomeEmail(c.env.RESEND_API_KEY, {
      email: normalizedEmail,
      name: name.trim(),
      widgetId,
    }).catch((err) => console.error('[signup] welcome email failed:', err))
    // Record send timestamp
    c.env.DB.prepare('UPDATE accounts SET drip_welcome_sent_at = ? WHERE id = ?')
      .bind(now, id).run().catch(() => {})
  }

  const token = await generateToken(id, normalizedEmail, 'free', c.env.JWT_SECRET)
  setAuthCookie(c, token)

  return c.json({
    token,
    account: { id, email: normalizedEmail, name: name.trim(), plan: 'free' },
  }, 201)
})

/** POST /api/auth/login */
auth.post('/login', async (c) => {
  let body: { email?: string; password?: string }
  try { body = await c.req.json() } catch { return c.json({ error: 'Invalid JSON' }, 400) }

  const { email, password } = body
  if (!email || !password) return c.json({ error: 'email and password are required' }, 400)

  const normalizedEmail = email.toLowerCase().trim()

  // Rate limit: 5 failed attempts per 15 minutes per IP+email combo
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  const rateLimitKey = `login:${ip}:${normalizedEmail}`
  const allowed = await checkRateLimit(c.env.WIDGET_KV, rateLimitKey, 5, 900)
  if (!allowed) return c.json({ error: 'Too many login attempts. Try again in 15 minutes.' }, 429)

  const account = await c.env.DB.prepare(
    'SELECT id, email, name, plan, password_hash FROM accounts WHERE email = ?'
  ).bind(normalizedEmail).first<{ id: string; email: string; name: string; plan: string; password_hash: string }>()

  // Compute hash even if account not found (timing attack mitigation)
  const sentHash = await hashPassword(password, account?.id ?? 'dummy-salt-000')
  if (!account || sentHash !== account.password_hash) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  const token = await generateToken(account.id, account.email, account.plan, c.env.JWT_SECRET)
  setAuthCookie(c, token)

  return c.json({
    token,
    account: { id: account.id, email: account.email, name: account.name, plan: account.plan },
  })
})

/** POST /api/auth/logout */
auth.post('/logout', async (c) => {
  deleteCookie(c, 'proof_token', { path: '/' })
  return c.json({ ok: true })
})

/** GET /api/auth/me — validate token, return account info */
auth.get('/me', async (c) => {
  // Check cookie first, then Authorization header
  const cookie = getCookie(c, 'proof_token')
  const header = c.req.header('Authorization')?.replace('Bearer ', '')
  const token = cookie || header

  if (!token) return c.json({ error: 'Not authenticated' }, 401)

  const claims = await verifyToken(token, c.env.JWT_SECRET)
  if (!claims) return c.json({ error: 'Invalid or expired token' }, 401)

  const account = await c.env.DB.prepare(
    'SELECT id, email, name, plan, created_at FROM accounts WHERE id = ?'
  ).bind(claims.sub).first<{ id: string; email: string; name: string; plan: string; created_at: string }>()

  if (!account) return c.json({ error: 'Account not found' }, 404)

  return c.json({ account })
})

export { verifyToken }

/** GET /api/auth/demo — returns a read-only demo JWT and seeds demo data if needed */
auth.get('/demo', async (c) => {
  const DEMO_ACCOUNT_ID = 'demo-account-vouch'
  const DEMO_EMAIL = 'demo@vouch.example'
  const DEMO_WIDGET_ID = 'demo-widget-001'

  // Ensure demo account exists
  const existing = await c.env.DB.prepare(
    'SELECT id FROM accounts WHERE id = ?'
  ).bind(DEMO_ACCOUNT_ID).first()

  if (!existing) {
    // Seed demo account
    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO accounts (id, email, name, plan, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      DEMO_ACCOUNT_ID,
      DEMO_EMAIL,
      'Acme Store (Demo)',
      'pro',
      'demo-no-login',
      new Date(Date.now() - 30 * 86400 * 1000).toISOString()
    ).run()

    // Seed demo widget
    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO widgets (id, account_id, name, slug, settings, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      DEMO_WIDGET_ID,
      DEMO_ACCOUNT_ID,
      'Product Reviews',
      'acme-store-demo',
      JSON.stringify({ theme: 'light', position: 'bottom-right', delay: 3000 }),
      new Date(Date.now() - 25 * 86400 * 1000).toISOString()
    ).run()

    // Seed 10 realistic demo testimonials
    const demoTestimonials = [
      { name: 'Sarah K.', email: 'sarah@example.com', text: 'This product completely transformed how I work. I save at least 2 hours every day. Absolutely worth every penny!', rating: 5, company: 'TechStart Inc', status: 'approved' },
      { name: 'Marcus Chen', email: 'marcus@example.com', text: 'Best investment we made this quarter. Our conversion rate jumped 34% after adding social proof to our checkout page.', rating: 5, company: 'GrowthLab', status: 'approved' },
      { name: 'Priya Sharma', email: 'priya@example.com', text: "Setup took 5 minutes. The widget looks great and matches our brand perfectly. Customer support is also incredible.", rating: 5, company: 'Bloom Beauty', status: 'approved' },
      { name: 'Alex Rivera', email: 'alex@example.com', text: 'We went from 0 to 50 reviews in two weeks using the automated request emails. Game changer for building trust.', rating: 5, company: 'Coastal Apparel', status: 'approved' },
      { name: 'Jordan Lee', email: 'jordan@example.com', text: 'Love the popup widget. Visitors see real-time social proof and it has noticeably reduced our bounce rate.', rating: 4, company: 'Nimbus SaaS', status: 'approved' },
      { name: 'Taylor Wong', email: 'taylor@example.com', text: 'Really solid product. Would love more customization options for the widget colors but overall very happy.', rating: 4, company: 'Pixel Studios', status: 'approved' },
      { name: 'Sam Patel', email: 'sam@example.com', text: 'Does exactly what it says on the tin. Simple, fast, and the CSV export is super useful for our reporting.', rating: 5, company: 'DataPoint Analytics', status: 'approved' },
      { name: 'Chris Morgan', email: 'chris@example.com', text: 'Great tool! One suggestion: it would be nice to have Slack notifications when new testimonials come in.', rating: 4, company: 'Remote First Co', status: 'pending' },
      { name: 'Dana Foster', email: 'dana@example.com', text: 'The wall of love page looks amazing. We linked it from our pricing page and it definitely helps close deals.', rating: 5, company: 'Venture Labs', status: 'approved' },
      { name: 'Riley Adams', email: 'riley@example.com', text: "Excellent product. I've tried three other social proof tools and this is by far the easiest to set up and maintain.", rating: 5, company: 'Solo Founder', status: 'approved' },
    ]

    const nowMs = Date.now()
    for (let i = 0; i < demoTestimonials.length; i++) {
      const t = demoTestimonials[i]
      const id = `demo-t-${String(i + 1).padStart(3, '0')}`
      const daysAgo = (demoTestimonials.length - i) * 2.5
      await c.env.DB.prepare(
        `INSERT OR IGNORE INTO testimonials (id, account_id, widget_id, name, email, company, text, rating, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id, DEMO_ACCOUNT_ID, DEMO_WIDGET_ID,
        t.name, t.email, t.company, t.text, t.rating, t.status,
        new Date(nowMs - daysAgo * 86400 * 1000).toISOString()
      ).run()
    }
  }

  // Issue demo JWT
  const token = await generateToken(DEMO_ACCOUNT_ID, DEMO_EMAIL, 'pro', c.env.JWT_SECRET)
  setAuthCookie(c, token)

  return c.json({
    token,
    demo: true,
    account: { id: DEMO_ACCOUNT_ID, email: DEMO_EMAIL, name: 'Acme Store (Demo)', plan: 'pro' },
  })
})
