import { Hono } from 'hono'
import type { Env } from '../index'

const waitlist = new Hono<{ Bindings: Env }>()

/** POST /api/waitlist — subscribe to launch waitlist */
waitlist.post('/', async (c) => {
  let email = ''
  let source = 'landing'
  try {
    const body = await c.req.json() as Record<string, unknown>
    email = String(body.email ?? '').trim().toLowerCase()
    source = String(body.source ?? 'landing').slice(0, 50)
  } catch {
    return c.json({ ok: false, error: 'Invalid JSON' }, 400)
  }

  if (!email || !email.includes('@') || email.length > 320) {
    return c.json({ ok: false, error: 'Valid email required' }, 400)
  }

  const key = `waitlist:${email}`
  const existing = await c.env.WIDGET_KV.get(key)

  if (existing) {
    return c.json({ ok: true, already: true })
  }

  await c.env.WIDGET_KV.put(key, JSON.stringify({
    email,
    source,
    created_at: new Date().toISOString(),
  }))

  const countKey = 'waitlist:__count'
  const count = parseInt(await c.env.WIDGET_KV.get(countKey) ?? '0', 10)
  await c.env.WIDGET_KV.put(countKey, String(count + 1))

  return c.json({ ok: true, already: false })
})

/** GET /api/waitlist/count — public waitlist count */
waitlist.get('/count', async (c) => {
  const count = parseInt(await c.env.WIDGET_KV.get('waitlist:__count') ?? '0', 10)
  return c.json({ count })
})

/** GET /api/waitlist/export — CSV export (protected by ADMIN_TOKEN header) */
waitlist.get('/export', async (c) => {
  const token = c.req.header('X-Admin-Token')
  const env = c.env as Env & { ADMIN_TOKEN?: string }
  if (!token || !env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
    return c.json({ ok: false, error: 'Unauthorized' }, 401)
  }

  const list = await c.env.WIDGET_KV.list({ prefix: 'waitlist:', limit: 1000 })
  const rows: string[] = []

  for (const k of list.keys) {
    if (k.name === 'waitlist:__count') continue
    const val = await c.env.WIDGET_KV.get(k.name)
    if (val) {
      try {
        const entry = JSON.parse(val) as { email: string; source: string; created_at: string }
        rows.push(`${entry.email},${entry.source},${entry.created_at}`)
      } catch { /* skip corrupt entries */ }
    }
  }

  const csv = ['email,source,created_at', ...rows].join('\n')
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="waitlist.csv"',
    },
  })
})

export default waitlist
