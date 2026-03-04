import { Hono } from 'hono'
import type { Env, Variables } from '../index'
import { checkPlanLimit } from '../lib/planLimits'

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
  const limitErr = await checkPlanLimit(c.env, accountId, 'create_widget')
  if (limitErr) return c.json(limitErr, 402)

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

  const existing = await c.env.DB.prepare(
    'SELECT id FROM widgets WHERE id = ? AND account_id = ?'
  ).bind(id, accountId).first()
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const updates: string[] = []
  const values: unknown[] = []
  if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name) }
  if (body.active !== undefined) { updates.push('active = ?'); values.push(body.active ? 1 : 0) }
  if (body.theme !== undefined) { updates.push('theme = ?'); values.push(body.theme) }
  if (body.layout !== undefined) { updates.push('layout = ?'); values.push(body.layout) }
  if (body.config !== undefined) { updates.push('config = ?'); values.push(JSON.stringify(body.config)) }
  if (updates.length === 0) return c.json({ error: 'Nothing to update' }, 400)

  updates.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(id)
  values.push(accountId)

  await c.env.DB.prepare(
    `UPDATE widgets SET ${updates.join(', ')} WHERE id = ? AND account_id = ?`
  ).bind(...values).run()

  const updated = await c.env.DB.prepare(
    'SELECT * FROM widgets WHERE id = ?'
  ).bind(id).first()
  return c.json({ widget: updated })
})

widgets.delete('/:id', async (c) => {
  const accountId = c.get('accountId')
  const id = c.req.param('id')
  const existing = await c.env.DB.prepare(
    'SELECT id FROM widgets WHERE id = ? AND account_id = ?'
  ).bind(id, accountId).first()
  if (!existing) return c.json({ error: 'Not found' }, 404)
  await c.env.DB.prepare('DELETE FROM widgets WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})
