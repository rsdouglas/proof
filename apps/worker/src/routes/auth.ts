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


// ── Password Reset ─────────────────────────────────────────────────────────

/** POST /api/auth/forgot-password */
auth.post('/forgot-password', async (c) => {
  let body: { email?: string }
  try { body = await c.req.json() } catch { return c.json({ error: 'Invalid JSON' }, 400) }
  const email = (body.email || '').trim().toLowerCase()
  if (!email) return c.json({ error: 'Email required' }, 400)

  // Always return success to prevent email enumeration
  const account = await c.env.DB.prepare(
    'SELECT id, name FROM accounts WHERE email = ?'
  ).bind(email).first<{ id: string; name: string }>()

  if (account && c.env.RESEND_API_KEY) {
    // Generate a secure reset token
    const tokenBytes = crypto.getRandomValues(new Uint8Array(32))
    const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('')

    // Store in KV with 1-hour TTL
    await c.env.WIDGET_KV.put(
      `pwd_reset:${token}`,
      JSON.stringify({ accountId: account.id, email }),
      { expirationTtl: 3600 }
    )

    // Send email
    const resetUrl = `https://app.socialproof.dev/reset-password?token=${token}`
    const first = (account.name || 'there').split(' ')[0]
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:560px;margin:40px auto;padding:0 16px">
  <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="background:#6C5CE7;padding:24px 32px">
      <span style="color:#fff;font-weight:700;font-size:18px;letter-spacing:-0.3px">✦ Vouch</span>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827">Reset your password</h2>
      <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6">
        Hey ${first} — someone (hopefully you) requested a password reset for your Vouch account.
        Click the button below to choose a new password. This link expires in 1 hour.
      </p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#6C5CE7;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">
        Reset password →
      </a>
      <p style="margin:24px 0 0;color:#6b7280;font-size:13px">
        If you didn't request this, you can safely ignore this email. Your password won't change.
      </p>
    </div>
  </div>
</div>
</body></html>`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vouch <team@socialproof.dev>',
        to: email,
        subject: 'Reset your Vouch password',
        html,
      }),
    })
  }

  return c.json({ ok: true, message: 'If that email exists, a reset link is on its way.' })
})

/** POST /api/auth/reset-password */
auth.post('/reset-password', async (c) => {
  let body: { token?: string; password?: string }
  try { body = await c.req.json() } catch { return c.json({ error: 'Invalid JSON' }, 400) }
  const { token, password } = body

  if (!token || !password) return c.json({ error: 'Token and password required' }, 400)
  if (password.length < 8) return c.json({ error: 'Password must be at least 8 characters' }, 400)

  const stored = await c.env.WIDGET_KV.get(`pwd_reset:${token}`)
  if (!stored) return c.json({ error: 'Reset link is invalid or expired' }, 400)

  const { accountId } = JSON.parse(stored) as { accountId: string; email: string }

  // Hash new password
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('')
  const hash = await hashPassword(password, salt)

  await c.env.DB.prepare(
    'UPDATE accounts SET password_hash = ?, password_salt = ? WHERE id = ?'
  ).bind(hash, salt, accountId).run()

  // Invalidate the token
  await c.env.WIDGET_KV.delete(`pwd_reset:${token}`)

  // Issue new session token so they're logged in immediately
  const account = await c.env.DB.prepare(
    'SELECT id, email, plan FROM accounts WHERE id = ?'
  ).bind(accountId).first<{ id: string; email: string; plan: string }>()

  if (!account || !c.env.JWT_SECRET) {
    return c.json({ ok: true, message: 'Password updated. Please log in.' })
  }

  const jwt = await generateToken(account.id, account.email, account.plan, c.env.JWT_SECRET)
  setAuthCookie(c, jwt)
  return c.json({ ok: true, token: jwt })
})
