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
  const body = await c.req.json<{ name: string; type: string; config?: Record<string, unknown> }>()
  if (!body.name?.trim() || !body.type) return c.json({ error: 'name and type required' }, 400)
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    'INSERT INTO widgets (id, account_id, name, type, config, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)'
  ).bind(id, accountId, body.name.trim(), body.type, JSON.stringify(body.config || {}), now, now).run()
  // Invalidate KV cache
  await c.env.WIDGET_KV.delete(`widget:${id}`)
  return c.json({ id, name: body.name.trim(), type: body.type, active: 1 }, 201)
})

widgets.patch('/:id', async (c) => {
  const accountId = c.get('accountId')
  const id = c.req.param('id')
  const body = await c.req.json<{ name?: string; active?: boolean; config?: Record<string, unknown> }>()
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: unknown[] = []
  if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name) }
  if (body.active !== undefined) { fields.push('active = ?'); values.push(body.active ? 1 : 0) }
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
