import { Hono } from 'hono'
import { Webhook } from 'svix'
import type { Env } from '../index'

const support = new Hono<{ Bindings: Env }>()

function verifyResendWebhook(body: string, headers: Headers, secret?: string) {
  if (!secret) return false

  const svixId = headers.get('svix-id')
  const svixTimestamp = headers.get('svix-timestamp')
  const svixSignature = headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) return false

  const webhook = new Webhook(secret)
  try {
    webhook.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })
    return true
  } catch {
    return false
  }
}

// POST /api/support/inbound — receives Resend inbound email webhooks
support.post('/inbound', async (c) => {
  const body = await c.req.text()

  if (!verifyResendWebhook(body, c.req.raw.headers, c.env.RESEND_WEBHOOK_SECRET)) {
    return c.json({ error: 'Invalid webhook signature' }, 401)
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body)
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const data = payload.data as Record<string, unknown> | undefined
  if (!data) {
    return c.json({ error: 'Missing data' }, 400)
  }

  const fromRaw = (data.from as string) || ''
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

support.get('/admin-list', async (c) => {
  const key = c.req.header('x-admin-key')
  if (!key || key !== c.env.ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const status = c.req.query('status')
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

export { verifyResendWebhook }
export default support
