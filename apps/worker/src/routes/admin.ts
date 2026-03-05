import { Hono } from 'hono'
import type { Env } from '../index'

const admin = new Hono<{ Bindings: Env }>()

admin.get('/metrics', async (c) => {
  const key = c.req.header('x-admin-key')
  if (!key || key !== c.env.ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Exclude test/audit accounts
  const testFilter = `email NOT LIKE '%vouch-test%' AND email NOT LIKE '%audit%' AND email NOT LIKE '%test%'`

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

export { admin }
