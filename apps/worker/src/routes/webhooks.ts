import { Hono } from 'hono'
import type { Env, Variables } from '../index'

export const webhooks = new Hono<{ Bindings: Env; Variables: Variables }>()

interface WebhookRow {
  id: string
  account_id: string
  url: string
  events: string
  secret: string | null
  active: number
  created_at: string
}

// List webhooks for account
webhooks.get('/', async (c) => {
  const accountId = c.get('accountId')
  const rows = await c.env.DB.prepare(
    'SELECT id, url, events, active, created_at FROM webhooks WHERE account_id = ? ORDER BY created_at DESC'
  ).bind(accountId).all<Pick<WebhookRow, 'id' | 'url' | 'events' | 'active' | 'created_at'>>()
  return c.json({ webhooks: rows.results })
})

// Create webhook
webhooks.post('/', async (c) => {
  const accountId = c.get('accountId')
  const body = await c.req.json<{ url: string; events?: string[]; secret?: string }>()

  if (!body.url?.startsWith('https://')) {
    return c.json({ error: 'URL must start with https://' }, 400)
  }

  // Check limit: max 5 webhooks per account
  const count = await c.env.DB.prepare(
    'SELECT COUNT(*) as n FROM webhooks WHERE account_id = ?'
  ).bind(accountId).first<{ n: number }>()
  if ((count?.n ?? 0) >= 5) {
    return c.json({ error: 'Maximum 5 webhooks per account' }, 400)
  }

  const events = body.events?.length ? body.events.join(',') : 'testimonial.submitted,testimonial.approved'
  const id = crypto.randomUUID()
  const secret = body.secret || null
  const now = new Date().toISOString()

  await c.env.DB.prepare(
    'INSERT INTO webhooks (id, account_id, url, events, secret, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)'
  ).bind(id, accountId, body.url, events, secret, now, now).run()

  return c.json({ webhook: { id, url: body.url, events, active: 1, created_at: now } }, 201)
})

// Delete webhook
webhooks.delete('/:id', async (c) => {
  const accountId = c.get('accountId')
  const id = c.req.param('id')
  const result = await c.env.DB.prepare(
    'DELETE FROM webhooks WHERE id = ? AND account_id = ?'
  ).bind(id, accountId).run()
  if (!result.meta.changes) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})

// Toggle webhook active/inactive
webhooks.patch('/:id', async (c) => {
  const accountId = c.get('accountId')
  const id = c.req.param('id')
  const body = await c.req.json<{ active?: boolean; url?: string }>()
  const now = new Date().toISOString()

  if (typeof body.active === 'boolean') {
    await c.env.DB.prepare(
      'UPDATE webhooks SET active = ?, updated_at = ? WHERE id = ? AND account_id = ?'
    ).bind(body.active ? 1 : 0, now, id, accountId).run()
  }

  if (body.url) {
    if (!body.url.startsWith('https://')) return c.json({ error: 'URL must start with https://' }, 400)
    await c.env.DB.prepare(
      'UPDATE webhooks SET url = ?, updated_at = ? WHERE id = ? AND account_id = ?'
    ).bind(body.url, now, id, accountId).run()
  }

  return c.json({ ok: true })
})

// Test webhook (sends a sample payload to verify it works)
webhooks.post('/:id/test', async (c) => {
  const accountId = c.get('accountId')
  const id = c.req.param('id')

  const hook = await c.env.DB.prepare(
    'SELECT id, url, secret FROM webhooks WHERE id = ? AND account_id = ? AND active = 1'
  ).bind(id, accountId).first<Pick<WebhookRow, 'id' | 'url' | 'secret'>>()
  if (!hook) return c.json({ error: 'Webhook not found or inactive' }, 404)

  const payload = {
    event: 'test',
    timestamp: new Date().toISOString(),
    data: {
      id: 'test-testimonial-id',
      display_name: 'Jane Smith',
      display_text: 'This is a test testimonial payload from SocialProof.',
      rating: 5,
      company: 'Acme Corp',
      title: 'CEO',
      status: 'approved',
      created_at: new Date().toISOString(),
    },
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'SocialProof-Webhooks/1.0',
      'X-SocialProof-Event': 'test',
    }

    if (hook.secret) {
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw', encoder.encode(hook.secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      )
      const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(JSON.stringify(payload)))
      headers['X-SocialProof-Signature'] = `sha256=${Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')}`
    }

    const resp = await fetch(hook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    return c.json({ ok: resp.ok, status: resp.status, message: resp.ok ? 'Test delivered successfully' : `Server responded with ${resp.status}` })
  } catch (err) {
    return c.json({ ok: false, message: `Delivery failed: ${(err as Error).message}` }, 502)
  }
})

/**
 * Fire webhooks for an event. Call this from other routes when events happen.
 * event: 'testimonial.submitted' | 'testimonial.approved' | 'testimonial.rejected'
 */
export async function fireWebhooks(
  db: Env['DB'],
  accountId: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const rows = await db.prepare(
    "SELECT url, events, secret FROM webhooks WHERE account_id = ? AND active = 1 AND (',' || events || ',') LIKE '%,' || ? || ',%'"
  ).bind(accountId, event).all<Pick<WebhookRow, 'url' | 'events' | 'secret'>>()

  if (!rows.results.length) return

  const payload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  }
  const body = JSON.stringify(payload)
  const encoder = new TextEncoder()

  // Fire all webhooks concurrently, swallow errors (don't block the main flow)
  await Promise.allSettled(
    rows.results.map(async (hook) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'SocialProof-Webhooks/1.0',
        'X-SocialProof-Event': event,
      }

      if (hook.secret) {
        const key = await crypto.subtle.importKey(
          'raw', encoder.encode(hook.secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        )
        const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
        headers['X-SocialProof-Signature'] = `sha256=${Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')}`
      }

      await fetch(hook.url, { method: 'POST', headers, body })
    })
  )
}
