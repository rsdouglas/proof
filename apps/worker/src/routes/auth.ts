import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { Env, Variables } from '../index'

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

/** Rate limit via KV: returns true if request is allowed, false if rate limited */
async function checkRateLimit(kv: KVNamespace, key: string, limit: number, windowSecs: number): Promise<boolean> {
  const raw = await kv.get(key)
  const count = raw ? parseInt(raw, 10) : 0
  if (count >= limit) return false
  await kv.put(key, String(count + 1), { expirationTtl: windowSecs })
  return true
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
