/**
 * Agent API — allows AI agents (Claude Code, Cursor, etc.) to register
 * a Vouch account programmatically and immediately get a usable collect_url
 * and widget embed code, without requiring email verification first.
 *
 * Refs: GitHub issue #166
 */

import { Hono } from 'hono'
import type { Env } from '../index'
import { checkRateLimit } from '../lib/ratelimit'

export const agent = new Hono<{ Bindings: Env }>()

const COLLECT_BASE = 'https://socialproof.dev/c'
const CDN_BASE = 'https://widget.socialproof.dev/v1'
const DASH_URL = 'https://app.vouch.run'

function prefixedId(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.getRandomValues(new Uint8Array(21))
  return prefix + '_' + Array.from(bytes).map(b => chars[b % chars.length]).join('')
}

async function sendVerificationEmail(
  apiKey: string,
  email: string,
  name: string,
  verifyUrl: string,
): Promise<void> {
  const FROM = 'Vouch <hello@vouch.run>'
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:560px;margin:40px auto;padding:0 16px">
  <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="background:#6C5CE7;padding:24px 32px">
      <span style="color:#fff;font-weight:700;font-size:18px;letter-spacing:-0.3px">✦ Vouch</span>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 8px;font-size:22px;color:#111827">Hi ${name}, verify your email</h2>
      <p style="color:#6b7280;margin:0 0 24px">Your Vouch account is active. Testimonials are already being collected at your link. Click below to verify your email and access the dashboard to read and approve them.</p>
      <a href="${verifyUrl}" style="display:inline-block;background:#6C5CE7;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Verify Email &amp; Open Dashboard</a>
      <p style="color:#9ca3af;font-size:13px;margin:24px 0 0">Or copy this link: ${verifyUrl}</p>
      <p style="color:#9ca3af;font-size:13px;margin:8px 0 0">This link expires in 24 hours.</p>
    </div>
  </div>
</div></body></html>`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: email, subject: 'Verify your Vouch account', html }),
  })
}

/**
 * POST /agent/register
 *
 * Public endpoint — no auth required.
 * Rate limit: 3 requests per hour per IP.
 *
 * Request body: { email: string, name: string }
 *
 * Response:
 *   201 (new account) | 200 (existing account)
 *   { collect_url, widget_embed, status, message }
 */
agent.post('/register', async (c) => {
  // Rate limiting — 3 per hour per IP
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  const allowed = await checkRateLimit(c.env.WIDGET_KV, `agent_register:${ip}`, 3, 3600)
  if (!allowed) {
    return c.json({ error: 'Rate limit exceeded. Max 3 registrations per hour per IP.' }, 429)
  }

  let body: { email?: string; name?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const { email, name } = body
  if (!email || !name) {
    return c.json({ error: 'email and name are required' }, 400)
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'Invalid email address' }, 400)
  }
  if (name.trim().length < 1) {
    return c.json({ error: 'name cannot be empty' }, 400)
  }

  const normalizedEmail = email.toLowerCase().trim()
  const trimmedName = name.trim()

  // Check if account already exists
  const existing = await c.env.DB.prepare(
    'SELECT id, email, name, email_verified FROM accounts WHERE email = ?'
  ).bind(normalizedEmail).first<{ id: string; email: string; name: string; email_verified: number | null }>()

  if (existing) {
    // Return existing account's form data — idempotent
    const form = await c.env.DB.prepare(
      'SELECT id FROM collection_forms WHERE account_id = ? AND active = 1 ORDER BY created_at ASC LIMIT 1'
    ).bind(existing.id).first<{ id: string }>()

    const formId = form?.id ?? 'unknown'
    const collectUrl = `${COLLECT_BASE}/${formId}`
    const widgetEmbed = `<script src="${CDN_BASE}/widget.js" data-id="${formId}" async></script>`

    return c.json({
      collect_url: collectUrl,
      widget_embed: widgetEmbed,
      status: existing.email_verified ? 'verified' : 'verification_pending',
      message: existing.email_verified
        ? `Account already verified. Visit ${DASH_URL} to manage testimonials.`
        : `Account already exists. Verification email resent to ${normalizedEmail}.`,
      dashboard_url: existing.email_verified ? DASH_URL : undefined,
    }, 200)
  }

  // Create new account (no password — agent-registered accounts use email magic link)
  const accountId = prefixedId('acc')
  const now = new Date().toISOString()

  await c.env.DB.prepare(
    'INSERT INTO accounts (id, email, name, plan, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(accountId, normalizedEmail, trimmedName, 'free', now, now).run()

  // Create default widget
  const widgetId = prefixedId('wgt')
  await c.env.DB.prepare(
    'INSERT INTO widgets (id, account_id, name, active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)'
  ).bind(widgetId, accountId, `${trimmedName}'s Reviews`, now, now).run()

  // Auto-create collection form
  const formId = prefixedId('frm')
  await c.env.DB.prepare(
    'INSERT INTO collection_forms (id, account_id, name, active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)'
  ).bind(formId, accountId, 'Default', now, now).run()

  // Generate a magic link token for email verification / dashboard login
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32))
  const verifyToken = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('')

  await c.env.WIDGET_KV.put(
    `agent_verify:${verifyToken}`,
    JSON.stringify({ accountId, email: normalizedEmail }),
    { expirationTtl: 24 * 3600 }
  )

  // Build verification URL — routes to /verify-agent?token=xxx on dashboard
  const verifyUrl = `${DASH_URL}/verify-agent?token=${verifyToken}`

  // Send verification email — fire-and-forget
  const collectUrl = `${COLLECT_BASE}/${formId}`
  const widgetEmbed = `<script src="${CDN_BASE}/widget.js" data-id="${formId}" async></script>`

  if (c.env.RESEND_API_KEY) {
    sendVerificationEmail(c.env.RESEND_API_KEY, normalizedEmail, trimmedName, verifyUrl)
      .then(() => console.log(`[agent/register] verification email sent to ${normalizedEmail}`))
      .catch(err => console.error(`[agent/register] email failed: ${err}`))
  } else {
    console.warn('[agent/register] RESEND_API_KEY not set — skipping verification email')
  }

  return c.json({
    collect_url: collectUrl,
    widget_embed: widgetEmbed,
    status: 'verification_pending',
    message: `Verification email sent to ${normalizedEmail} — click the link to access your dashboard and read/approve testimonials.`,
  }, 201)
})

/**
 * GET /agent/status?email=xxx
 *
 * Public endpoint — polling agents can check verification state.
 */
agent.get('/status', async (c) => {
  const email = c.req.query('email')
  if (!email) return c.json({ error: 'email query parameter required' }, 400)

  const normalizedEmail = email.toLowerCase().trim()
  const account = await c.env.DB.prepare(
    'SELECT id, email_verified FROM accounts WHERE email = ?'
  ).bind(normalizedEmail).first<{ id: string; email_verified: number | null }>()

  if (!account) return c.json({ error: 'No account found for this email' }, 404)

  if (account.email_verified) {
    return c.json({ status: 'verified', dashboard_url: DASH_URL })
  }

  return c.json({ status: 'pending' })
})

/**
 * GET /agent/verify?token=xxx
 *
 * Called when user clicks the verification link in their email.
 * Sets email_verified on the account and redirects to dashboard.
 */
agent.get('/verify', async (c) => {
  const token = c.req.query('token')
  if (!token) return c.redirect(`${DASH_URL}?error=missing_token`)

  const stored = await c.env.WIDGET_KV.get(`agent_verify:${token}`)
  if (!stored) return c.redirect(`${DASH_URL}?error=invalid_or_expired_token`)

  const { accountId } = JSON.parse(stored) as { accountId: string; email: string }

  // Mark email verified
  await c.env.DB.prepare(
    'UPDATE accounts SET email_verified = 1, updated_at = ? WHERE id = ?'
  ).bind(new Date().toISOString(), accountId).run()

  // Invalidate token
  await c.env.WIDGET_KV.delete(`agent_verify:${token}`)

  // Redirect to dashboard — user needs to set a password to get full access
  return c.redirect(`${DASH_URL}?verified=1&agent=1`)
})
