import { Hono } from 'hono'
import type { Env } from '../index'

const waitlist = new Hono<{ Bindings: Env }>()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOWED_PLANS = new Set(['free', 'pro'])

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

export default waitlist
