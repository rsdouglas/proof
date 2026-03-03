import { Hono } from 'hono'
import type { Env, Variables } from '../index'

export const accounts = new Hono<{ Bindings: Env; Variables: Variables }>()

accounts.get('/me', async (c) => {
  const accountId = c.get('accountId')
  const account = await c.env.DB.prepare(
    'SELECT id, email, name, plan, created_at FROM accounts WHERE id = ?'
  ).bind(accountId).first()
  if (!account) return c.json({ error: 'Not found' }, 404)
  return c.json({ account })
})

accounts.patch('/me', async (c) => {
  const accountId = c.get('accountId')
  const body = await c.req.json<{ name?: string; email?: string }>()
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: unknown[] = []
  if (body.name) { fields.push('name = ?'); values.push(body.name) }
  if (body.email) { fields.push('email = ?'); values.push(body.email.toLowerCase()) }
  if (!fields.length) return c.json({ error: 'Nothing to update' }, 400)
  fields.push('updated_at = ?')
  values.push(now, accountId)
  await c.env.DB.prepare(
    `UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`
  ).bind(...values).run()
  return c.json({ ok: true })
})
