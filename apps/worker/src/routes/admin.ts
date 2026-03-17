import { Hono } from 'hono';

import type { Env } from '../index';

const admin = new Hono<{ Bindings: Env }>()

// ── SES credential validator ───────────────────────────────────────────────────

async function hmac(key: ArrayBuffer, msg: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(msg))
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function sha256hex(msg: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg)))
}

async function sesCheckCredentials(
  accessKeyId: string,
  secretKey: string,
  region: string,
): Promise<{ ok: boolean; status: number; detail: string }> {
  const service = 'ses'
  const host = `email.${region}.amazonaws.com`
  const query = 'Action=GetSendQuota&Version=2010-12-01'

  const now = new Date()
  // e.g. "20260317T120000Z"
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z'
  const dateStamp = amzDate.slice(0, 8)

  const payloadHash = await sha256hex('')
  const canonicalHeaders = `host:${host}\nx-amz-date:${amzDate}\n`
  const signedHeaders = 'host;x-amz-date'
  const canonicalRequest = `GET\n/\n${query}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

  const credScope = `${dateStamp}/${region}/${service}/aws4_request`
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credScope}\n${await sha256hex(canonicalRequest)}`

  const enc = new TextEncoder()
  const kDate    = await hmac(enc.encode('AWS4' + secretKey).buffer as ArrayBuffer, dateStamp)
  const kRegion  = await hmac(kDate, region)
  const kService = await hmac(kRegion, service)
  const kSigning = await hmac(kService, 'aws4_request')
  const sig      = toHex(await hmac(kSigning, stringToSign))

  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${sig}`

  const res = await fetch(`https://${host}/?${query}`, {
    method: 'GET',
    headers: {
      Host: host,
      'X-Amz-Date': amzDate,
      Authorization: authHeader,
    },
  })

  const body = await res.text()
  return {
    ok: res.ok,
    status: res.status,
    // Trim the XML error message to something readable
    detail: res.ok ? 'credentials valid' : body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200),
  }
}

admin.get('/metrics', async (c) => {
  const authHeader = c.req.header('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token || token !== c.env.ADMIN_TOKEN) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Exclude test/audit accounts
  const testFilter = `email NOT LIKE '%sp-test%' AND email NOT LIKE '%audit%' AND email NOT LIKE '%test%'`

  const [
    usersTotal,
    usersLast7d,
    usersLast30d,
    usersWithTestimonials,
    usersWithWidgets,
    testsTotal,
    testsApproved,
    testsPending,
    widgetsTotal,
  ] = await Promise.all([
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM accounts WHERE ${testFilter}`).first<{n:number}>(),
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM accounts WHERE ${testFilter} AND created_at >= ?`).bind(sevenDaysAgo).first<{n:number}>(),
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM accounts WHERE ${testFilter} AND created_at >= ?`).bind(thirtyDaysAgo).first<{n:number}>(),
    c.env.DB.prepare(`SELECT COUNT(DISTINCT account_id) as n FROM testimonials WHERE account_id IN (SELECT id FROM accounts WHERE ${testFilter})`).first<{n:number}>(),
    c.env.DB.prepare(`SELECT COUNT(DISTINCT account_id) as n FROM widgets WHERE account_id IN (SELECT id FROM accounts WHERE ${testFilter})`).first<{n:number}>(),
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM testimonials WHERE account_id IN (SELECT id FROM accounts WHERE ${testFilter})`).first<{n:number}>(),
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM testimonials WHERE status = 'approved' AND account_id IN (SELECT id FROM accounts WHERE ${testFilter})`).first<{n:number}>(),
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM testimonials WHERE status = 'pending' AND account_id IN (SELECT id FROM accounts WHERE ${testFilter})`).first<{n:number}>(),
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM widgets WHERE account_id IN (SELECT id FROM accounts WHERE ${testFilter})`).first<{n:number}>(),
  ])

  const total = usersTotal?.n ?? 0
  const activated = usersWithTestimonials?.n ?? 0

  return c.json({
    users: {
      total,
      last_7d: usersLast7d?.n ?? 0,
      last_30d: usersLast30d?.n ?? 0,
      with_testimonials: activated,
      with_widgets: usersWithWidgets?.n ?? 0,
      activation_rate: total > 0 ? Math.round((activated / total) * 100) : 0,
    },
    testimonials: {
      total: testsTotal?.n ?? 0,
      approved: testsApproved?.n ?? 0,
      pending: testsPending?.n ?? 0,
    },
    widgets: {
      total: widgetsTotal?.n ?? 0,
    },
    generated_at: now.toISOString(),
  })
})


admin.get('/stats', async (c) => {
  const authHeader = c.req.header('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token || token !== c.env.ADMIN_TOKEN) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Exclude test/audit accounts
  const testFilter = `email NOT LIKE '%sp-test%' AND email NOT LIKE '%audit%' AND email NOT LIKE '%test%'`

  const [
    usersTotal,
    usersActivated,
    testimonialsTotalRow,
    testimonialsPendingRow,
    widgetsTotalRow,
    signupsLast7d,
    activatedLast7d,
  ] = await Promise.all([
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM accounts WHERE ${testFilter}`).first<{n:number}>(),
    c.env.DB.prepare(`SELECT COUNT(DISTINCT account_id) as n FROM testimonials WHERE account_id IN (SELECT id FROM accounts WHERE ${testFilter})`).first<{n:number}>(),
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM testimonials WHERE account_id IN (SELECT id FROM accounts WHERE ${testFilter})`).first<{n:number}>(),
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM testimonials WHERE status = 'pending' AND account_id IN (SELECT id FROM accounts WHERE ${testFilter})`).first<{n:number}>(),
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM widgets WHERE account_id IN (SELECT id FROM accounts WHERE ${testFilter})`).first<{n:number}>(),
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM accounts WHERE ${testFilter} AND created_at >= ?`).bind(sevenDaysAgo).first<{n:number}>(),
    c.env.DB.prepare(`SELECT COUNT(DISTINCT account_id) as n FROM testimonials WHERE account_id IN (SELECT id FROM accounts WHERE ${testFilter} AND created_at >= ?)`).bind(sevenDaysAgo).first<{n:number}>(),
  ])

  return c.json({
    users_total: usersTotal?.n ?? 0,
    users_activated: usersActivated?.n ?? 0,
    testimonials_total: testimonialsTotalRow?.n ?? 0,
    testimonials_pending: testimonialsPendingRow?.n ?? 0,
    widgets_total: widgetsTotalRow?.n ?? 0,
    signups_last_7d: signupsLast7d?.n ?? 0,
    activated_last_7d: activatedLast7d?.n ?? 0,
    generated_at: now.toISOString(),
  })
})

// ── GET /status — deep health check for all integrations ───────────────────────

type CheckResult = { ok: boolean; latency_ms: number; error?: string; [k: string]: unknown }

async function timed<T extends Record<string, unknown>>(
  fn: () => Promise<T>,
): Promise<T & { latency_ms: number }> {
  const t0 = Date.now()
  try {
    const result = await fn()
    return { ...result, latency_ms: Date.now() - t0 }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'unknown', latency_ms: Date.now() - t0 } as T & { latency_ms: number }
  }
}

admin.get('/status', async (c) => {
  const authHeader = c.req.header('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token || token !== c.env.ADMIN_TOKEN) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const env = c.env

  const [d1, kv, resend, stripe, ses] = await Promise.all([
    // D1
    timed(async () => {
      await env.DB.prepare('SELECT 1').first()
      return { ok: true } as Record<string, unknown>
    }),
    // KV
    timed(async () => {
      await env.WIDGET_KV.get('__healthcheck')
      return { ok: true } as Record<string, unknown>
    }),
    // Resend
    timed(async () => {
      if (!env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY not set' }
      const res = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
      })
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
      return { ok: true } as Record<string, unknown>
    }),
    // Stripe
    timed(async () => {
      if (!env.STRIPE_SECRET_KEY) return { ok: false, error: 'STRIPE_SECRET_KEY not set' }
      const res = await fetch('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
      })
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
      return { ok: true } as Record<string, unknown>
    }),
    // SES
    timed(async () => {
      if (!env.SES_AWS_ACCESS_KEY_ID || !env.SES_AWS_SECRET_ACCESS_KEY) {
        return { ok: false, error: 'SES credentials not set' }
      }
      const result = await sesCheckCredentials(
        env.SES_AWS_ACCESS_KEY_ID,
        env.SES_AWS_SECRET_ACCESS_KEY,
        env.SES_REGION ?? 'us-east-1',
      )
      if (!result.ok) return { ok: false, error: result.detail }
      return {
        ok: true,
        region: env.SES_REGION ?? 'us-east-1',
        from: env.SES_FROM_EMAIL ?? '(not set)',
      } as Record<string, unknown>
    }),
  ])

  const checks: Record<string, CheckResult> = { d1, kv, resend, stripe, ses }
  const allOk = Object.values(checks).every((ch) => ch.ok)

  const secretNames: [string, unknown][] = [
    ['JWT_SECRET', env.JWT_SECRET],
    ['STRIPE_SECRET_KEY', env.STRIPE_SECRET_KEY],
    ['STRIPE_WEBHOOK_SECRET', env.STRIPE_WEBHOOK_SECRET],
    ['STRIPE_PRO_PRICE_ID', env.STRIPE_PRO_PRICE_ID],
    ['RESEND_API_KEY', env.RESEND_API_KEY],
    ['SES_AWS_ACCESS_KEY_ID', env.SES_AWS_ACCESS_KEY_ID],
    ['SES_AWS_SECRET_ACCESS_KEY', env.SES_AWS_SECRET_ACCESS_KEY],
    ['SES_REGION', env.SES_REGION],
    ['SES_FROM_EMAIL', env.SES_FROM_EMAIL],
    ['ADMIN_TOKEN', env.ADMIN_TOKEN],
  ]
  const set = secretNames.filter(([, v]) => !!v).map(([k]) => k)
  const missing = secretNames.filter(([, v]) => !v).map(([k]) => k)

  return c.json({
    ok: allOk,
    checks,
    secrets: { set, missing },
    env: env.ENVIRONMENT ?? 'unknown',
    ts: new Date().toISOString(),
  }, allOk ? 200 : 502)
})

export { admin };
