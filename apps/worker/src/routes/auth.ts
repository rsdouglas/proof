import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { Env, Variables } from '../index'

import { sendWelcomeEmail } from '../lib/onboarding'
import { checkRateLimit } from '../lib/ratelimit'

export const auth = new Hono<{ Bindings: Env; Variables: Variables }>()

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

ansync function generateToken(accountId: string, email: string, plan: string, secret: string): Promise<string> {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify({
    sub: accountId,
    email,
    plan,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
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

function prefixedId_prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = prefix + '_'
  for (let i = 0; i < 20; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

auth.post('/signup', async (c) => {
  try {
    const body = await c.req.json() as { email: string; password: string; name: string }
    const { email, password, name } = body
    if (!email || !password || !name) return c.json({ error: 'Email, password, and name are required' }, 400)
    if (password.length < 8) return c.json({ error: 'Password must be at least 8 characters' }, 400)
    const ip = c.req.header('cf-connecting-ip') ?? 'anon'
    if (await checkRateLimit(c.env, `signup:${ip}`, 3, 3600)) {
      return c.json({ error: 'Too many signup attempts. Please try again later.' }, 429)
    }
    const existing = await c.env.DB.prepare('SELECT id FROM accounts WHERE email = ?')
      .bind(email.toLowerCase()).first()
    if (existing) return c.json({ error: 'Email already registered' }, 409)
    const accountId = prefixedId('acc')
    const salt = crypto.randomUUID()
    const hash = await hashPassword(password, salt)
    await c.env.DB.prepare(
      'INSERT INTO accounts (id, email, password_hash, password_salt, name, plan) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(accountId, email.toLowerCase(), hash, salt, name, 'free').run()
    const token = await generateToken(accountId, email, 'free', c.env.JWT_SECRET)
    setCookie(c, 'session', token, {
      httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 30 * 24 * 3600, path: '/',
    })
    sendWelcomeEmail(c.env, email, name).catch(() => {})
    return c.json({ token, account: { id: accountId, email, name, plan: 'free' } })
  } catch (e) {
    console.error('signup error', e)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

auth.post('/login', async (c) => {
  try {
    const body = await c.req.json() as { email: string; password: string }
    const { email, password } = body
    if (!email || !password) return c.json({ error: 'Email and password are required' }, 400)
    const ip = c.req.header('cf-connecting-ip') ?? 'anon'
    if (await checkRateLimit(c.env, `login:${ip}`, 10, 3600)) {
      return c.json({ error: 'Too many login attempts. Please try again later.' }, 429)
    }
    const account = await c.env.DB.prepare(
      'SELECT id, email, name, password_hash, password_salt, plan FROM accounts WHERE email = ?'
    ).bind(email.toLowerCase()).first<{ id: string; email: string; name: string; password_hash: string; password_salt: string; plan: string }>()
    if (!account) return c.json({ error: 'Invalid email or password' }, 401)
    const hash = await hashPassword(password, account.password_salt)
    if (hash !== account.password_hash) return c.json({ error: 'Invalid email or password' }, 401)
    const token = await generateToken(account.id, account.email, account.plan, c.env.JWT_SECRET)
    setCookie(c, 'session', token, {
      httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 30 * 24 * 3600, path: '/',
    })
    return c.json({ token, account: { id: account.id, email: account.email, name: account.name, plan: account.plan } })
  } catch (e) {
    console.error('login error', e)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

auth.post('/demo', async (c) => {
  try {
    const token = await generateToken('demo_account', 'demo@vouch.app', 'demo', c.env.JWT_SECRET)
    setCookie(c, 'session', token, {
      httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 24 * 3600, path: '/',
    })
    return c.json({ token, account: { id: 'demo_account', email: 'demo@vouch.app', name: 'Demo User', plan: 'demo' } })
  } catch (e) {
    console.error('demo login error', e)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

auth.post('/logout', async (c) => {
  deleteCookie(c, 'session', { path: '/' })
  return c.json({ success: true })
})

auth.get('/me', async (c) => {
  const accountId = c.get('accountId')
  if (!accountId) return c.json({ error: 'Unauthorized' }, 401)
  if (accountId === 'demo_account') {
    return c.json({ account: { id: 'demo_account', email: 'demo@vouch.app', name: 'Demo User', plan: 'demo' } })
  }
  const account = await c.env.DB.prepare(
    'SELECT id, email, name, plan FROM accounts WHERE id = ?'
  ).bind(accountId).first<{ id: string; email: string; name: string; plan: string }>()
  if (!account) return c.json({ error: 'Unauthorized' }, 401)
  return c.json({ account })
})
