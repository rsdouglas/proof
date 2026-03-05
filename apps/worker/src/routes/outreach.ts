/**
 * Outreach pipeline admin endpoints.
 *
 * Replaces flat markdown files in the repo with a proper D1-backed
 * table + Resend integration. See GitHub issue #327.
 *
 * Auth: Bearer token via ADMIN_TOKEN env var (falls back to ADMIN_SECRET).
 *
 * Endpoints:
 *   POST /api/admin/outreach/targets  — bulk insert targets from JSON array
 *   POST /api/admin/outreach/send     — pull pending targets, send via Resend, mark sent
 *   GET  /api/admin/outreach/stats    — sent/pending/replied/bounced counts
 *   GET  /api/admin/outreach/targets  — list targets (paginated, filterable by status)
 */

import { Hono } from 'hono'
import type { Env } from '../index'
import { sendEmail } from './email'

const outreach = new Hono<{ Bindings: Env }>()

// ── Auth helper ────────────────────────────────────────────────────────────────
function checkAuth(c: any): boolean {
  const authHeader = c.req.header('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  const adminToken = c.env.ADMIN_TOKEN ?? c.env.ADMIN_SECRET
  return !!token && token === adminToken
}

// ── Email templates ────────────────────────────────────────────────────────────
function getEmailContent(variant: string, target: {
  name: string | null
  business_name: string | null
  vertical: string | null
}): { subject: string; html: string; text: string } {
  const firstName = target.name?.split(' ')[0] ?? 'there'
  const biz = target.business_name ?? 'your business'

  if (variant === 'B') {
    const subject = `Quick question about ${biz}'s reviews`
    const text = `Hi ${firstName},\n\nDo you ever wish your best customer reviews showed up on your website automatically — not just on Google?\n\nSocialProof does exactly that. You collect once, it shows everywhere.\n\nFree to try: https://socialproof.dev\n\nMark\nSocialProof`
    const html = `<p>Hi ${firstName},</p>
<p>Do you ever wish your best customer reviews showed up on your website automatically — not just on Google?</p>
<p>SocialProof does exactly that. You collect once, it shows everywhere.</p>
<p><a href="https://socialproof.dev">Free to try: socialproof.dev</a></p>
<p>Mark<br>SocialProof</p>
<p style="color:#999;font-size:12px;">You received this because we thought SocialProof might be useful for ${biz}. <a href="mailto:hello@socialproof.dev?subject=unsubscribe">Unsubscribe</a></p>`
    return { subject, html, text }
  }

  if (variant === 'C') {
    const subject = `${firstName} — testimonials on autopilot for ${biz}?`
    const text = `Hi ${firstName},\n\nMost small business owners know testimonials matter but collecting them is a pain.\n\nSocialProof automates the whole thing — collect, display, done.\n\nWorth 60 seconds: https://socialproof.dev\n\nMark\nSocialProof`
    const html = `<p>Hi ${firstName},</p>
<p>Most small business owners know testimonials matter but collecting them is a pain.</p>
<p>SocialProof automates the whole thing — collect, display, done.</p>
<p><a href="https://socialproof.dev">Worth 60 seconds: socialproof.dev</a></p>
<p>Mark<br>SocialProof</p>
<p style="color:#999;font-size:12px;">You received this because we thought SocialProof might be useful for ${biz}. <a href="mailto:hello@socialproof.dev?subject=unsubscribe">Unsubscribe</a></p>`
    return { subject, html, text }
  }

  // Variant A (default)
  const subject = `Testimonials for ${biz}`
  const text = `Hi ${firstName},\n\nI'm Mark from SocialProof — we help small businesses collect and display customer testimonials on their websites.\n\nMost of our users are coaches, fitness studios, and service businesses who want social proof but don't have time to chase it.\n\nIf that sounds like ${biz}, it's free to start: https://socialproof.dev\n\nMark\nSocialProof`
  const html = `<p>Hi ${firstName},</p>
<p>I'm Mark from SocialProof — we help small businesses collect and display customer testimonials on their websites.</p>
<p>Most of our users are coaches, fitness studios, and service businesses who want social proof but don't have time to chase it.</p>
<p>If that sounds like ${biz}, it's free to start: <a href="https://socialproof.dev">socialproof.dev</a></p>
<p>Mark<br>SocialProof</p>
<p style="color:#999;font-size:12px;">You received this because we thought SocialProof might be useful for ${biz}. <a href="mailto:hello@socialproof.dev?subject=unsubscribe">Unsubscribe</a></p>`
  return { subject, html, text }
}

// ── POST /targets — bulk insert ────────────────────────────────────────────────
outreach.post('/targets', async (c) => {
  if (!checkAuth(c)) return c.json({ error: 'Unauthorized' }, 401)

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

// ── POST /send — fire pending emails ──────────────────────────────────────────
outreach.post('/send', async (c) => {
  if (!checkAuth(c)) return c.json({ error: 'Unauthorized' }, 401)

  let limit = 25
  let dryRun = false
  try {
    const body = await c.req.json().catch(() => ({}))
    if (body.limit && Number.isInteger(body.limit)) limit = Math.min(body.limit, 100)
    if (body.dry_run === true) dryRun = true
  } catch { /* ignore */ }

  // Pull pending targets
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
      // Dry run — just count
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

// ── GET /stats — counts by status ─────────────────────────────────────────────
outreach.get('/stats', async (c) => {
  if (!checkAuth(c)) return c.json({ error: 'Unauthorized' }, 401)

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

// ── GET /targets — list targets ────────────────────────────────────────────────
outreach.get('/targets', async (c) => {
  if (!checkAuth(c)) return c.json({ error: 'Unauthorized' }, 401)

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
  // D1 bind doesn't support spread directly for mixed types
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

export { outreach }
