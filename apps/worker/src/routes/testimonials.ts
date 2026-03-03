import { sendEmail, buildTestimonialApprovedEmail, buildTestimonialRequestEmail } from './email'
import { Hono } from 'hono'
import type { Env, Variables } from '../index'

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

  // If status just changed to 'approved' and the submitter has an email, notify them
  if (body.status === 'approved') {
    const t = await c.env.DB.prepare(
      'SELECT t.submitter_email, t.display_name, t.display_text, w.name as widget_name, w.id as widget_id, w.slug FROM testimonials t JOIN widgets w ON w.account_id = t.account_id WHERE t.id = ? LIMIT 1'
    ).bind(id).first<{ submitter_email: string | null; display_name: string; display_text: string; widget_name: string; widget_id: string; slug: string | null }>()

    if (t?.submitter_email) {
      const wallUrl = `https://api.socialproof.dev/wall/${t.slug || t.widget_id}`
      await sendEmail(
        buildTestimonialApprovedEmail({
          customerEmail: t.submitter_email,
          customerName: t.display_name,
          widgetName: t.widget_name,
          text: t.display_text,
          wallUrl,
        }),
        c.env
      )
    }
  }

  return c.json({ ok: true })
})

testimonials.delete('/:id', async (c) => {
  const accountId = c.get('accountId')
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM testimonials WHERE id = ? AND account_id = ?').bind(id, accountId).run()
  return c.json({ ok: true })
})

testimonials.post('/request', async (c) => {
  const accountId = c.get('accountId')
  const body = await c.req.json<{
    email: string
    name?: string
    widget_id: string
    personal_note?: string
  }>()

  if (!body.email?.trim()) return c.json({ error: 'email required' }, 400)
  if (!body.widget_id?.trim()) return c.json({ error: 'widget_id required' }, 400)

  // Validate email format
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(body.email.trim())) return c.json({ error: 'invalid email' }, 400)

  // Fetch widget + account info
  const row = await c.env.DB.prepare(
    `SELECT w.id, w.name as widget_name, w.slug, a.name as business_name, a.email as owner_email, a.name as owner_name
     FROM widgets w
     JOIN accounts a ON a.id = w.account_id
     WHERE w.id = ? AND w.account_id = ?`
  ).bind(body.widget_id, accountId).first<{
    id: string; widget_name: string; slug: string | null;
    business_name: string; owner_email: string; owner_name: string
  }>()

  if (!row) return c.json({ error: 'widget not found' }, 404)

  // Find the collection form for this widget
  const form = await c.env.DB.prepare(
    'SELECT id FROM collection_forms WHERE account_id = ? AND active = 1 ORDER BY created_at ASC LIMIT 1'
  ).bind(accountId).first<{ id: string }>()

  const collectPath = form
    ? `https://api.socialproof.dev/c/form/${form.id}`
    : `https://api.socialproof.dev/wall/${row.slug || row.id}`

  await sendEmail(
    buildTestimonialRequestEmail({
      customerEmail: body.email.trim(),
      customerName: body.name?.trim(),
      businessName: row.business_name,
      ownerName: row.owner_name,
      personalNote: body.personal_note?.trim(),
      collectUrl: collectPath,
    }),
    c.env
  )

  // Log the request for dedup / audit (we can add a table later; for now just return ok)
  return c.json({ ok: true, sent_to: body.email.trim() }, 200)
})
