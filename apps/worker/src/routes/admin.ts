import { Hono } from 'hono';

import type { Env } from '../index';
import { getEmailContent } from '../lib/outreach-templates';
import { requireAdmin } from '../middleware/auth';
import { sendEmail } from './email';

const admin = new Hono<{ Bindings: Env }>()

admin.use('*', requireAdmin)

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
): Promise<{ ok: boolean; status: number; detail: string; quota?: { max24h?: number; sent24h?: number; maxPerSecond?: number } }> {
  const service = 'ses'
  const host = `email.${region}.amazonaws.com`
  const query = 'Action=GetSendQuota&Version=2010-12-01'

  const now = new Date()
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
  if (!res.ok) {
    return {
      ok: false, status: res.status,
      detail: body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200),
    }
  }
  const tag = (name: string) => body.match(new RegExp(`<${name}>(.+?)</${name}>`))?.[1]
  return {
    ok: true, status: res.status, detail: 'credentials valid',
    quota: {
      max24h: Number(tag('Max24HourSend')) || undefined,
      sent24h: Number(tag('SentLast24Hours')) || undefined,
      maxPerSecond: Number(tag('MaxSendRate')) || undefined,
    },
  }
}

function isNonCriticalEmailPaused(env: Env): boolean {
  const value = env.PAUSE_NONCRITICAL_EMAIL
  return value === '1' || value === 'true' || value === 'yes' || value === 'on'
}

// ── GET /stats — platform metrics ──────────────────────────────────────────────

admin.get('/stats', async (c) => {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

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

// ── GET /status — deep health check for all integrations ───────────────────────

type CheckResult = { ok: boolean; latency_ms: number; error?: string; [k: string]: unknown }
type CheckInput = { ok: boolean; error?: string; [k: string]: unknown }

async function timed(fn: () => Promise<CheckInput>): Promise<CheckResult> {
  const t0 = Date.now()
  try {
    return { ...await fn(), latency_ms: Date.now() - t0 }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'unknown', latency_ms: Date.now() - t0 }
  }
}

admin.get('/status', async (c) => {
  const env = c.env

  const [d1, kv, resend, stripe, ses] = await Promise.all([
    timed(async () => {
      await env.DB.prepare('SELECT 1').first()
      return { ok: true }
    }),
    timed(async () => {
      await env.WIDGET_KV.get('__healthcheck')
      return { ok: true }
    }),
    timed(async () => {
      if (!env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY not set' }
      const res = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
      })
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
      const quota: Record<string, string | undefined> = {
        daily: res.headers.get('x-resend-daily-quota') ?? undefined,
        monthly: res.headers.get('x-resend-monthly-quota') ?? undefined,
        ratelimit_remaining: res.headers.get('ratelimit-remaining') ?? undefined,
      }
      return { ok: true, quota }
    }),
    timed(async () => {
      if (!env.STRIPE_SECRET_KEY) return { ok: false, error: 'STRIPE_SECRET_KEY not set' }
      const res = await fetch('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
      })
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
      return { ok: true }
    }),
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
        quota: result.quota,
      }
    }),
  ])

  const checks: Record<string, CheckResult> = { d1, kv, resend, stripe, ses }
  const allOk = Object.values(checks).every((ch) => ch.ok)

  return c.json({
    ok: allOk,
    checks,
    env: env.ENVIRONMENT ?? 'unknown',
    ts: new Date().toISOString(),
  }, allOk ? 200 : 502)
})

// ── Outreach: POST /outreach/targets — bulk insert ─────────────────────────────

const NONCRITICAL_EMAIL_PAUSE_HINT = 'Set PAUSE_NONCRITICAL_EMAIL=1 to preserve provider quota for user-facing mail during incidents.'

admin.post('/outreach/targets', async (c) => {
  let targets: Array<{
    name?: string
    email: string
    business_name?: string
    vertical?: string
    variant?: string
  }>

  try {
    const body = await c.req.json()
    targets = Array.isArray(body) ? body : body.targets
    if (!Array.isArray(targets) || targets.length === 0) {
      return c.json({ error: 'targets must be a non-empty array' }, 400)
    }
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  let inserted = 0
  let skipped = 0
  const errors: string[] = []

  for (const t of targets) {
    if (!t.email || !t.email.includes('@')) {
      errors.push(`Invalid email: ${t.email}`)
      skipped++
      continue
    }
    const id = crypto.randomUUID()
    try {
      await c.env.DB.prepare(
        `INSERT INTO outreach_targets (id, name, email, business_name, vertical, variant)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(email) DO NOTHING`
      )
        .bind(id, t.name ?? null, t.email.trim().toLowerCase(), t.business_name ?? null, t.vertical ?? null, t.variant ?? 'A')
        .run()
      inserted++
    } catch (err: any) {
      errors.push(`${t.email}: ${err?.message ?? 'unknown error'}`)
      skipped++
    }
  }

  return c.json({ inserted, skipped, errors })
})

// ── Outreach: POST /outreach/send — fire pending emails ────────────────────────

admin.post('/outreach/send', async (c) => {
  if (isNonCriticalEmailPaused(c.env)) {
    return c.json({ error: 'non-critical email paused', hint: NONCRITICAL_EMAIL_PAUSE_HINT }, 503)
  }

  let limit = 25
  let dryRun = false
  try {
    const body = await c.req.json().catch(() => ({}))
    if (body.limit && Number.isInteger(body.limit)) limit = Math.min(body.limit, 100)
    if (body.dry_run === true) dryRun = true
  } catch { /* ignore */ }

  const rows = await c.env.DB.prepare(
    `SELECT * FROM outreach_targets WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?`
  ).bind(limit).all<{
    id: string
    name: string | null
    email: string
    business_name: string | null
    vertical: string | null
    variant: string | null
  }>()

  const targets = rows.results ?? []
  if (targets.length === 0) return c.json({ sent: 0, dry_run: dryRun, message: 'No pending targets' })

  let sent = 0
  const sendErrors: string[] = []

  for (const t of targets) {
    const variant = t.variant ?? 'A'
    const { subject, html, text } = getEmailContent(variant, t)

    if (!dryRun) {
      try {
        await sendEmail({ to: t.email, toName: t.name ?? undefined, subject, html, text }, c.env)
        await c.env.DB.prepare(
          `UPDATE outreach_targets SET status = 'sent', sent_at = ? WHERE id = ?`
        ).bind(new Date().toISOString(), t.id).run()
        sent++
      } catch (err: any) {
        sendErrors.push(`${t.email}: ${err?.message ?? 'send failed'}`)
      }
    } else {
      sent++
    }
  }

  return c.json({
    sent,
    dry_run: dryRun,
    errors: sendErrors,
    preview: dryRun ? targets.slice(0, 3).map(t => ({
      to: t.email,
      ...getEmailContent(t.variant ?? 'A', t),
    })) : undefined,
  })
})

// ── Outreach: GET /outreach/stats — counts by status ───────────────────────────

admin.get('/outreach/stats', async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT status, COUNT(*) as n FROM outreach_targets GROUP BY status`
  ).all<{ status: string; n: number }>()

  const stats: Record<string, number> = {
    pending: 0, sent: 0, replied: 0, bounced: 0, total: 0,
  }
  for (const row of rows.results ?? []) {
    stats[row.status] = row.n
    stats.total += row.n
  }

  const verticals = await c.env.DB.prepare(
    `SELECT vertical, COUNT(*) as n FROM outreach_targets GROUP BY vertical ORDER BY n DESC`
  ).all<{ vertical: string; n: number }>()

  return c.json({ stats, verticals: verticals.results ?? [] })
})

// ── Outreach: GET /outreach/targets — list targets ─────────────────────────────

admin.get('/outreach/targets', async (c) => {
  const status = c.req.query('status') ?? null
  const vertical = c.req.query('vertical') ?? null
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50'), 200)
  const offset = parseInt(c.req.query('offset') ?? '0')

  let query = `SELECT * FROM outreach_targets`
  const conditions: string[] = []
  const bindings: (string | number)[] = []

  if (status) { conditions.push('status = ?'); bindings.push(status) }
  if (vertical) { conditions.push('vertical = ?'); bindings.push(vertical) }
  if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
  bindings.push(limit, offset)

  const stmt = c.env.DB.prepare(query)
  const rows = await (stmt.bind as any)(...bindings).all()

  const countQuery = `SELECT COUNT(*) as n FROM outreach_targets` +
    (conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '')
  const countBindings = bindings.slice(0, -2)
  const countStmt = c.env.DB.prepare(countQuery)
  const total = countBindings.length
    ? await (countStmt.bind as any)(...countBindings).first() as { n: number } | null
    : await countStmt.first() as { n: number } | null

  return c.json({
    targets: rows.results ?? [],
    total: total?.n ?? 0,
    limit,
    offset,
  })
})

// ── Support: GET /support — list support messages ──────────────────────────────

admin.get('/support', async (c) => {
  const status = c.req.query('status')
  const limit = Math.min(Number(c.req.query('limit') || '50'), 200)

  let query = `SELECT id, from_email, from_name, subject, body_text, received_at, status
               FROM support_messages`
  const bindings: unknown[] = []

  if (status) {
    query += ` WHERE status = ?`
    bindings.push(status)
  }

  query += ` ORDER BY received_at DESC LIMIT ?`
  bindings.push(limit)

  const stmt = c.env.DB.prepare(query)
  const result = await (bindings.length > 0 ? stmt.bind(...bindings) : stmt).all()

  return c.json({ messages: result.results, total: result.results.length })
})

// ── Support: PATCH /support/:id — update support message status ────────────────

admin.patch('/support/:id', async (c) => {
  const id = c.req.param('id')
  const { status } = await c.req.json<{ status: string }>()

  if (!['open', 'closed'].includes(status)) {
    return c.json({ error: 'Invalid status' }, 400)
  }

  await c.env.DB.prepare(`UPDATE support_messages SET status = ? WHERE id = ?`)
    .bind(status, id).run()

  return c.json({ ok: true })
})

// ── Waitlist: GET /waitlist/export — CSV export ────────────────────────────────

admin.get('/waitlist/export', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT email, plan, created_at FROM waitlist ORDER BY created_at DESC LIMIT 1000'
  ).all<{ email: string; plan: string; created_at: string }>()

  const rows = (result.results ?? []).map((entry) => (
    `${entry.email},${entry.plan},${entry.created_at}`
  ))

  const csv = ['email,plan,created_at', ...rows].join('\n')
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="waitlist.csv"',
    },
  })
})

export { admin };
