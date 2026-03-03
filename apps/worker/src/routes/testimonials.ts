import { Hono } from 'hono'
import type { Env, Variables } from '../index'
import { sendApprovalConfirmationEmail } from '../lib/email'

export const testimonials = new Hono<{ Bindings: Env; Variables: Variables }>()

testimonials.get('/', async (c) => {
  const accountId = c.get('accountId')
  const status = c.req.query('status')
  const widgetId = c.req.query('widget_id')
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 200)
  const offset = parseInt(c.req.query('offset') || '0')

  let query = 'SELECT * FROM testimonials WHERE account_id = ?'
  const bindings: unknown[] = [accountId]

  if (widgetId) {
    query += ' AND widget_id = ?'
    bindings.push(widgetId)
  }
  if (status) {
    query += ' AND status = ?'
    bindings.push(status)
  }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  bindings.push(limit, offset)

  const { results } = await c.env.DB.prepare(query).bind(...bindings).all()
  return c.json({ testimonials: results })
})

testimonials.get('/:id', async (c) => {
  const accountId = c.get('accountId')
  const id = c.req.param('id')
  const row = await c.env.DB.prepare(
    'SELECT * FROM testimonials WHERE id = ? AND account_id = ?'
  ).bind(id, accountId).first()
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json({ testimonial: row })
})

testimonials.patch('/:id', async (c) => {
  const accountId = c.get('accountId')
  const id = c.req.param('id')
  const body = await c.req.json<{ status?: string; featured?: boolean; response?: string }>()
  const now = new Date().toISOString()

  // Fetch current testimonial before update (needed for approval email)
  const existing = await c.env.DB.prepare(
    'SELECT * FROM testimonials WHERE id = ? AND account_id = ?'
  ).bind(id, accountId).first<{
    id: string; display_name: string; submitter_email: string | null;
    status: string; account_id: string
  }>()
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const fields: string[] = []
  const values: unknown[] = []

  if (body.status !== undefined) { fields.push('status = ?'); values.push(body.status) }
  if (body.featured !== undefined) { fields.push('featured = ?'); values.push(body.featured ? 1 : 0) }
  if (body.response !== undefined) { fields.push('response = ?'); values.push(body.response) }

  if (fields.length === 0) return c.json({ error: 'Nothing to update' }, 400)

  fields.push('updated_at = ?')
  values.push(now, id, accountId)

  await c.env.DB.prepare(
    `UPDATE testimonials SET ${fields.join(', ')} WHERE id = ? AND account_id = ?`
  ).bind(...values).run()

  // Send approval confirmation email to submitter (fire-and-forget)
  const approving = body.status === 'approved' && existing.status !== 'approved'
  if (approving && existing.submitter_email && c.env.RESEND_API_KEY) {
    // Look up the business name from accounts
    const account = await c.env.DB.prepare(
      'SELECT name FROM accounts WHERE id = ?'
    ).bind(accountId).first<{ name: string }>()

    c.executionCtx.waitUntil(
      sendApprovalConfirmationEmail(c.env.RESEND_API_KEY, {
        customerEmail: existing.submitter_email,
        customerName: existing.display_name,
        businessName: account?.name ?? 'the business',
      })
    )
  }

  return c.json({ ok: true })
})

testimonials.delete('/:id', async (c) => {
  const accountId = c.get('accountId')
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM testimonials WHERE id = ? AND account_id = ?').bind(id, accountId).run()
  return c.json({ ok: true })
})
