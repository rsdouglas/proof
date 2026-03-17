/**
 * Outreach pipeline admin endpoints.
 *
 * Replaces flat markdown files in the repo with a proper D1-backed
 * table + Resend integration. See GitHub issue #327.
 *
 * Auth: Bearer token via ADMIN_TOKEN env var.
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

const NONCRITICAL_EMAIL_PAUSE_HINT = 'Set PAUSE_NONCRITICAL_EMAIL=1 to preserve provider quota for user-facing mail during incidents.'

// ── Auth helper ────────────────────────────────────────────────────────────────
function checkAuth(c: any): boolean {
  const authHeader = c.req.header('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  const adminToken = c.env.ADMIN_TOKEN
  return !!token && token === adminToken
}

function isNonCriticalEmailPaused(env: Env): boolean {
  const value = env.PAUSE_NONCRITICAL_EMAIL
  return value === '1' || value === 'true' || value === 'yes' || value === 'on'
}

// ── Email templates ────────────────────────────────────────────────────────────
type TemplateResult = { subject: string; html: string; text: string }

/**
 * Returns vertical-specific email copy when the target's vertical is recognised.
 * Each vertical gets a tailored subject + body referencing the matching /for/ page.
 * Returns null for unknown verticals → falls back to A/B/C generic variants.
 */
function getVerticalContent(target: {
  name: string | null
  business_name: string | null
  vertical: string | null
  variant?: string | null
}): TemplateResult | null {
  const firstName = target.name?.split(' ')[0] ?? 'there'
  const biz = target.business_name ?? 'your business'
  const v = (target.vertical ?? '').toLowerCase().replace(/[\s_]/g, '-')

  const footer = `<p style="color:#999;font-size:12px;">You received this because we thought SocialProof might be useful for ${biz}. <a href="mailto:hello@socialproof.dev?subject=unsubscribe">Unsubscribe</a></p>`
  const footerText = `\n\n---\nYou received this because we thought SocialProof might be useful for ${biz}. Reply "unsubscribe" to opt out.`

  if (v === 'bakery' || v === 'bakeries') {
    const forPage = 'https://socialproof.dev/for/bakeries'
    const subject = `Your best reviews aren't on your website (yet)`
    const text = `Hi ${firstName},\n\nI spent time on your site and it's clear you put serious craft into what you make.\n\nOne thing I noticed: your Google reviews are great, but they're stuck on Google. The people visiting your site right now can't see them.\n\nI built SocialProof — a free tool that lets bakeries embed a live testimonial widget on their site in about 2 minutes. Customers submit feedback, you approve it, it shows up on your site automatically.\n\nFree forever for one widget. No credit card.\n\nWorth a look: ${forPage}\n\n— Mark${footerText}`
    const html = `<p>Hi ${firstName},</p>
<p>I spent time on your site and it's clear you put serious craft into what you make.</p>
<p>One thing I noticed: your Google reviews are great, but they're stuck on Google. The people visiting your site right now can't see them.</p>
<p>I built <strong>SocialProof</strong> — a free tool that lets bakeries embed a live testimonial widget on their site in about 2 minutes. Customers submit feedback, you approve it, it shows up on your site automatically.</p>
<p>Free forever for one widget. No credit card.</p>
<p><a href="${forPage}">Worth a look: socialproof.dev/for/bakeries</a></p>
<p>— Mark</p>
${footer}`
    return { subject, html, text }
  }

  if (v === 'fitness' || v === 'fitness-studio' || v === 'fitness-studios') {
    const forPage = 'https://socialproof.dev/for/fitness-studios'
    const subject = `A free way to show off what your members say`
    const text = `Hi ${firstName},\n\nWord-of-mouth is how most fitness studios grow — but most of that word-of-mouth disappears into Instagram comments or Google, where new prospects might not find it.\n\nI built SocialProof to fix that. It's a free tool that lets you collect testimonials from members and display them on your site automatically. Takes about 2 minutes to set up.\n\nFree forever for one widget. No credit card.\n\nI made a page specifically for fitness studios: ${forPage}\n\n— Mark from SocialProof${footerText}`
    const html = `<p>Hi ${firstName},</p>
<p>Word-of-mouth is how most fitness studios grow — but most of that word-of-mouth disappears into Instagram comments or Google, where new prospects might not find it.</p>
<p>I built SocialProof to fix that. It's a free tool that lets you collect testimonials from members and display them on your site automatically. Takes about 2 minutes to set up.</p>
<p>Free forever for one widget. No credit card.</p>
<p><a href="${forPage}">I made a page specifically for fitness studios</a></p>
<p>— Mark from SocialProof</p>
${footer}`
    return { subject, html, text }
  }

  if (v === 'salon' || v === 'salons' || v === 'hair-salon') {
    const forPage = 'https://socialproof.dev/for/salons'
    const subject = `${firstName}, your 5-star reviews deserve more than Yelp`
    const text = `Hi ${firstName},\n\nSalons live and die by referrals. But when someone Googles "${biz}" for the first time, all they see is a Yelp page — not your voice, not your vibe.\n\nSocialProof lets you collect testimonials from happy clients and show them directly on your own site. One widget, 2 minutes to set up, free forever.\n\nBuilt for salons: ${forPage}\n\n— Mark${footerText}`
    const html = `<p>Hi ${firstName},</p>
<p>Salons live and die by referrals. But when someone Googles "${biz}" for the first time, all they see is a Yelp page — not your voice, not your vibe.</p>
<p>SocialProof lets you collect testimonials from happy clients and show them directly on your own site. One widget, 2 minutes to set up, free forever.</p>
<p><a href="${forPage}">Built for salons: socialproof.dev/for/salons</a></p>
<p>— Mark</p>
${footer}`
    return { subject, html, text }
  }

  if (v === 'restaurant' || v === 'restaurants') {
    const forPage = 'https://socialproof.dev/for/restaurants'
    const subject = `${biz}'s best reviews deserve to be on your website`
    const text = `Hi ${firstName},\n\nRestaurant guests trust what other diners say — but most of that trust lives on Google or Yelp, not on your own site where you control the experience.\n\nSocialProof lets you collect testimonials from your guests and display them on your site automatically. Two minutes to set up, free forever for one widget.\n\nDesigned for restaurants: ${forPage}\n\n— Mark from SocialProof${footerText}`
    const html = `<p>Hi ${firstName},</p>
<p>Restaurant guests trust what other diners say — but most of that trust lives on Google or Yelp, not on your own site where you control the experience.</p>
<p>SocialProof lets you collect testimonials from your guests and display them on your site automatically. Two minutes to set up, free forever for one widget.</p>
<p><a href="${forPage}">Designed for restaurants: socialproof.dev/for/restaurants</a></p>
<p>— Mark from SocialProof</p>
${footer}`
    return { subject, html, text }
  }

  if (v === 'photographer' || v === 'photographers') {
    const forPage = 'https://socialproof.dev/for/photographers'
    const subject = `${firstName} — what do your clients say after the shoot?`
    const text = `Hi ${firstName},\n\nYour portfolio shows what you can do. But testimonials show what it's like to work with you — and that's often what closes the booking.\n\nSocialProof lets you collect client feedback after every shoot and display it on your site automatically. Free forever for one widget.\n\nBuilt for photographers: ${forPage}\n\n— Mark${footerText}`
    const html = `<p>Hi ${firstName},</p>
<p>Your portfolio shows what you can do. But testimonials show what it's like to work with you — and that's often what closes the booking.</p>
<p>SocialProof lets you collect client feedback after every shoot and display it on your site automatically. Free forever for one widget.</p>
<p><a href="${forPage}">Built for photographers: socialproof.dev/for/photographers</a></p>
<p>— Mark</p>
${footer}`
    return { subject, html, text }
  }

  if (v === 'real-estate' || v === 'real-estate-agent' || v === 'real-estate-agents' || v === 'realtor') {
    const forPage = 'https://socialproof.dev/for/real-estate'
    const subject = `${firstName} — your past clients are your best salespeople`
    const text = `Hi ${firstName},\n\nBuyers and sellers pick agents based on trust. Zillow and Realtor.com help — but they don't let you control the story.\n\nSocialProof lets you collect client testimonials and display them on your own site, exactly where prospects are deciding whether to call you. Free forever for one widget.\n\nBuilt for real estate agents: ${forPage}\n\n— Mark from SocialProof${footerText}`
    const html = `<p>Hi ${firstName},</p>
<p>Buyers and sellers pick agents based on trust. Zillow and Realtor.com help — but they don't let you control the story.</p>
<p>SocialProof lets you collect client testimonials and display them on your own site, exactly where prospects are deciding whether to call you. Free forever for one widget.</p>
<p><a href="${forPage}">Built for real estate agents: socialproof.dev/for/real-estate</a></p>
<p>— Mark from SocialProof</p>
${footer}`
    return { subject, html, text }
  }

  if (v === 'coach' || v === 'coaches' || v === 'life-coach' || v === 'consultant' || v === 'consultants') {
    const forPage = 'https://socialproof.dev/for/coaches'
    const subject = `${firstName}, your clients' words sell better than your own`
    const text = `Hi ${firstName},\n\nCoaching and consulting is built on trust. The problem: by the time someone finds your site, they've already decided whether to believe you.\n\nSocialProof lets you surface what past clients actually say — automatically, on your own site. Free forever for one widget.\n\n${forPage}\n\n— Mark${footerText}`
    const html = `<p>Hi ${firstName},</p>
<p>Coaching and consulting is built on trust. The problem: by the time someone finds your site, they've already decided whether to believe you.</p>
<p>SocialProof lets you surface what past clients actually say — automatically, on your own site. Free forever for one widget.</p>
<p><a href="${forPage}">socialproof.dev/for/coaches</a></p>
<p>— Mark</p>
${footer}`
    return { subject, html, text }
  }

  // Unknown vertical
  return null
}

function getEmailContent(variant: string, target: {
  name: string | null
  business_name: string | null
  vertical: string | null
}): TemplateResult {
  // Vertical-specific copy takes precedence over A/B/C variants
  const verticalContent = getVerticalContent(target)
  if (verticalContent) return verticalContent

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
