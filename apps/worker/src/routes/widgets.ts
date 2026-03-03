import { Hono } from 'hono'
import type { Env, Variables } from '../index'

export const widgets = new Hono<{ Bindings: Env; Variables: Variables }>()

widgets.get('/', async (c) => {
  const accountId = c.get('accountId')
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM widgets WHERE account_id = ? ORDER BY created_at DESC'
  ).bind(accountId).all()
  return c.json({ widgets: results })
})

widgets.post('/', async (c) => {
  const accountId = c.get('accountId')
  const body = await c.req.json<{ name: string; type?: string; theme?: string; layout?: string; config?: Record<string, unknown> }>()
  if (!body.name?.trim()) return c.json({ error: 'name required' }, 400)

  // Plan enforcement: Free plan limited to 1 widget
  const account = await c.env.DB.prepare(
    'SELECT plan FROM accounts WHERE id = ?'
  ).bind(accountId).first<{ plan: string }>()
  if (account?.plan !== 'pro') {
    const { results } = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM widgets WHERE account_id = ?'
    ).bind(accountId).all<{ count: number }>()
    const count = results[0]?.count ?? 0
    if (count >= 1) {
      return c.json({
        error: 'Free plan limited to 1 widget. Upgrade to Pro for unlimited widgets.',
        upgrade: true,
      }, 402)
    }
  }
  const id = crypto.randomUUID()
  const slug = body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + id.slice(0, 6)
  const now = new Date().toISOString()
  const type = body.type || 'testimonial'
  const theme = body.theme || 'light'
  const layout = body.layout || 'grid'
  await c.env.DB.prepare(
    'INSERT INTO widgets (id, account_id, name, slug, type, theme, layout, config, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)'
  ).bind(id, accountId, body.name.trim(), slug, type, theme, layout, JSON.stringify(body.config || {}), now, now).run()
  return c.json({ widget: { id, name: body.name.trim(), slug, type, theme, layout, active: 1, created_at: now } }, 201)
})

widgets.get('/:id', async (c) => {
  const accountId = c.get('accountId')
  const id = c.req.param('id')
  const row = await c.env.DB.prepare(
    'SELECT * FROM widgets WHERE id = ? AND account_id = ?'
  ).bind(id, accountId).first()
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json({ widget: row })
})

widgets.patch('/:id', async (c) => {
  const accountId = c.get('accountId')
  const id = c.req.param('id')
  const body = await c.req.json<{ name?: string; active?: boolean; theme?: string; layout?: string; config?: Record<string, unknown> }>()
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: unknown[] = []
  if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name) }
  if (body.active !== undefined) { fields.push('active = ?'); values.push(body.active ? 1 : 0) }
  if (body.theme !== undefined) { fields.push('theme = ?'); values.push(body.theme) }
  if (body.layout !== undefined) { fields.push('layout = ?'); values.push(body.layout) }
  if (body.config !== undefined) { fields.push('config = ?'); values.push(JSON.stringify(body.config)) }
  if (!fields.length) return c.json({ error: 'Nothing to update' }, 400)
  fields.push('updated_at = ?')
  values.push(now, id, accountId)
  await c.env.DB.prepare(
    `UPDATE widgets SET ${fields.join(', ')} WHERE id = ? AND account_id = ?`
  ).bind(...values).run()
  await c.env.WIDGET_KV.delete(`widget:${id}`)
  return c.json({ ok: true })
})

widgets.delete('/:id', async (c) => {
  const accountId = c.get('accountId')
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM widgets WHERE id = ? AND account_id = ?').bind(id, accountId).run()
  await c.env.WIDGET_KV.delete(`widget:${id}`)
  return c.json({ ok: true })
})
