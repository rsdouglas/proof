import { Hono } from 'hono'
import type { Env } from '../index'

const waitlist = new Hono<{ Bindings: Env }>()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOWED_PLANS = new Set(['free', 'pro'])

type WaitlistRow = {
  email: string
  plan: 'free' | 'pro'
  created_at: string
}

/** POST /api/waitlist — subscribe to waitlist */
waitlist.post('/', async (c) => {
  let email = ''
  let plan: 'free' | 'pro' = 'free'

  try {
    const body = await c.req.json() as Record<string, unknown>
    email = String(body.email ?? '').trim().toLowerCase()
    const rawPlan = String(body.plan ?? 'free').trim().toLowerCase()
    if (ALLOWED_PLANS.has(rawPlan)) {
      plan = rawPlan as 'free' | 'pro'
    }
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  if (!EMAIL_RE.test(email) || email.length > 320) {
    return c.json({ error: 'Invalid email' }, 400)
  }

  await c.env.DB.prepare(
    `INSERT INTO waitlist (email, plan)
     VALUES (?, ?)
     ON CONFLICT(email) DO NOTHING`
  ).bind(email, plan).run()

  return c.json({ success: true })
})

/** GET /api/waitlist/count — public waitlist count */
waitlist.get('/count', async (c) => {
  const row = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM waitlist'
  ).first<{ count: number | string }>()

  return c.json({ count: Number(row?.count ?? 0) })
})

/** GET /api/waitlist/export — CSV export (protected by ADMIN_TOKEN header) */
waitlist.get('/export', async (c) => {
  const token = c.req.header('X-Admin-Token')
  const env = c.env as Env & { ADMIN_TOKEN?: string }
  if (!token || !env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
    return c.json({ ok: false, error: 'Unauthorized' }, 401)
  }

  const result = await c.env.DB.prepare(
    'SELECT email, plan, created_at FROM waitlist ORDER BY created_at DESC LIMIT 1000'
  ).all<WaitlistRow>()

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

export default waitlist
