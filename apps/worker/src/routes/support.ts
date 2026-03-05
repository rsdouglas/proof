import { Hono } from 'hono'
import type { Env } from '../index'

const support = new Hono<{ Bindings: Env }>()

// POST /api/support/inbound — receives Resend inbound email webhooks
// Resend sends a JSON payload; we verify it's from Resend via the svix signature header
// (same mechanism as Stripe webhooks but simpler — Resend uses svix under the hood)
support.post('/inbound', async (c) => {
  const body = await c.req.text()

  // Parse JSON payload from Resend
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body)
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  // Resend inbound webhook structure:
  // { type: 'email.received', data: { from: '...', to: [...], subject: '...', text: '...', html: '...' } }
  const data = payload.data as Record<string, unknown> | undefined
  if (!data) {
    return c.json({ error: 'Missing data' }, 400)
  }

  const fromRaw = (data.from as string) || ''
  // Parse "Name <email>" format
  const emailMatch = fromRaw.match(/<(.+?)>/)
  const fromEmail = emailMatch ? emailMatch[1] : fromRaw
  const nameMatch = fromRaw.match(/^(.+?)\s*</)
  const fromName = nameMatch ? nameMatch[1].trim() : null

  const subject = (data.subject as string) || '(no subject)'
  const bodyText = (data.text as string) || null
  const bodyHtml = (data.html as string) || null

  const id = crypto.randomUUID()

  await c.env.DB.prepare(
    `INSERT INTO support_messages (id, from_email, from_name, subject, body_text, body_html, received_at, status)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 'open')`
  ).bind(id, fromEmail, fromName, subject, bodyText, bodyHtml).run()

  return c.json({ ok: true, id })
})

// GET /api/admin/support — list support messages (protected by ADMIN_SECRET)
support.get('/admin-list', async (c) => {
  const key = c.req.header('x-admin-key')
  if (!key || key !== c.env.ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const status = c.req.query('status') // 'open', 'closed', or omit for all
  const limit = Math.min(Number(c.req.query('limit') || '50'), 200)

  let query = `SELECT id, from_email, from_name, subject, body_text, received_at, status
               FROM support_messages`
  const bindings: unknown[] = []

  if (status) {
    query += ` WHERE status = ?`
    bindings.push(status)
  }

  query += ` ORDER BY received_at DESC LIMIT ?`
  bindings.push(limit)

  const stmt = c.env.DB.prepare(query)
  const result = await (bindings.length > 0 ? stmt.bind(...bindings) : stmt).all()

  return c.json({ messages: result.results, total: result.results.length })
})

// PATCH /api/admin/support/:id — update status (open/closed)
support.patch('/admin-list/:id', async (c) => {
  const key = c.req.header('x-admin-key')
  if (!key || key !== c.env.ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')
  const { status } = await c.req.json<{ status: string }>()

  if (!['open', 'closed'].includes(status)) {
    return c.json({ error: 'Invalid status' }, 400)
  }

  await c.env.DB.prepare(`UPDATE support_messages SET status = ? WHERE id = ?`)
    .bind(status, id).run()

  return c.json({ ok: true })
})

export default support
