import { sendEmail, buildTestimonialApprovedEmail } from './email'
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

// CSV export — must be before /:id to avoid route conflict
testimonials.get('/export/csv', async (c) => {
  const accountId = c.get('accountId')
  const widgetId = c.req.query('widget_id')
  const status = c.req.query('status')

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
  query += ' ORDER BY created_at DESC LIMIT 5000'

  const { results } = await c.env.DB.prepare(query).bind(...bindings).all<{
    id: string; display_name: string; display_text: string; rating: number | null;
    company: string | null; title: string | null; submitter_email: string | null;
    source: string; status: string; featured: number; created_at: string;
  }>()

  const headers = ['id', 'display_name', 'display_text', 'rating', 'company', 'title', 'submitter_email', 'source', 'status', 'featured', 'created_at']
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }

  const rows = results.map(r =>
    headers.map(h => escape(r[h as keyof typeof r])).join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="testimonials.csv"',
    },
  })
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
