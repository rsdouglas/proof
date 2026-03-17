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

export { verifyResendWebhook }
export default support
