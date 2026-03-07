import { fireWebhooks } from './webhooks'
import { sendEmail, buildTestimonialApprovedEmail } from './email'
import { Hono } from 'hono'
import type { Env, Variables } from '../index'
import { checkPlanLimit } from '../lib/planLimits'

export const testimonials = new Hono<{ Bindings: Env; Variables: Variables }>()

// Strip HTML tags to prevent XSS stored in DB
function sanitizeField(s: string | undefined | null, maxLen: number): string | null {
  if (s == null) return null
  return s.replace(/<[^>]*>/g, '').trim().slice(0, maxLen) || null
}


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
    company: string | null; title: string | null; author_email: string | null;
    source: string; status: string; featured: number; created_at: string;
  }>()

  const headers = ['id', 'display_name', 'display_text', 'rating', 'company', 'title', 'author_email', 'source', 'status', 'featured', 'created_at']
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
  const body = await c.req.json<{ status?: string; featured?: boolean }>()
  const now = new Date().toISOString()

  const fields: string[] = []
  const values: unknown[] = []

  if (body.status !== undefined) { fields.push('status = ?'); values.push(body.status) }
  if (body.featured !== undefined) { fields.push('featured = ?'); values.push(body.featured ? 1 : 0) }

  if (fields.length === 0) return c.json({ error: 'Nothing to update' }, 400)

  fields.push('updated_at = ?')
  values.push(now, id, accountId)

  const result = await c.env.DB.prepare(
    `UPDATE testimonials SET ${fields.join(', ')} WHERE id = ? AND account_id = ?`
  ).bind(...values).run()

  if (result.meta.changes === 0) {
    return c.json({ error: 'Not found' }, 404)
  }

  // If status just changed to 'approved' and the submitter has an email, notify them
  if (body.status === 'approved') {
    const t = await c.env.DB.prepare(
      'SELECT t.author_email, t.display_name, t.display_text, w.name as widget_name, w.id as widget_id, w.slug FROM testimonials t LEFT JOIN widgets w ON w.id = t.widget_id WHERE t.id = ? LIMIT 1'
    ).bind(id).first<{ author_email: string | null; display_name: string; display_text: string; widget_name: string | null; widget_id: string | null; slug: string | null }>()

    if (t?.author_email) {
      const wallUrl = `https://api.socialproof.dev/wall/${t.slug || t.widget_id || ""}` 
      await sendEmail(
        buildTestimonialApprovedEmail({
          customerEmail: t.author_email,
          customerName: t.display_name,
          widgetName: t.widget_name ?? 'your widget',
          text: t.display_text,
          wallUrl,
        }),
        c.env
      )
    }
  }

  // Fire webhook for status changes
  if (body.status === 'approved' || body.status === 'rejected') {
    const accountId = c.get('accountId')
    await fireWebhooks(c.env.DB, accountId, `testimonial.${body.status}`, { id, status: body.status })
  }

  return c.json({ ok: true })
})

// Bulk update testimonials
testimonials.patch('/bulk', async (c) => {
  const accountId = c.get('accountId')
  const body = await c.req.json<{ ids: string[]; status?: string; featured?: boolean }>()

  if (!body.ids || body.ids.length === 0) return c.json({ error: 'No ids provided' }, 400)
  if (body.ids.length > 100) return c.json({ error: 'Max 100 ids at a time' }, 400)

  const now = new Date().toISOString()
  const fields: string[] = []
  const fieldValues: unknown[] = []

  if (body.status !== undefined) { fields.push('status = ?'); fieldValues.push(body.status) }
  if (body.featured !== undefined) { fields.push('featured = ?'); fieldValues.push(body.featured ? 1 : 0) }

  if (fields.length === 0) return c.json({ error: 'Nothing to update' }, 400)

  fields.push('updated_at = ?')
  fieldValues.push(now)

  const placeholders = body.ids.map(() => '?').join(', ')
  await c.env.DB.prepare(
    `UPDATE testimonials SET ${fields.join(', ')} WHERE id IN (${placeholders}) AND account_id = ?`
  ).bind(...fieldValues, ...body.ids, accountId).run()

  return c.json({ ok: true, updated: body.ids.length })
})

// Bulk delete testimonials
testimonials.delete('/bulk', async (c) => {
  const accountId = c.get('accountId')
  const body = await c.req.json<{ ids: string[] }>()

  if (!body.ids || body.ids.length === 0) return c.json({ error: 'No ids provided' }, 400)
  if (body.ids.length > 100) return c.json({ error: 'Max 100 ids at a time' }, 400)

  const placeholders = body.ids.map(() => '?').join(', ')
  await c.env.DB.prepare(
    `DELETE FROM testimonials WHERE id IN (${placeholders}) AND account_id = ?`
  ).bind(...body.ids, accountId).run()

  return c.json({ ok: true, deleted: body.ids.length })
})


testimonials.delete('/:id', async (c) => {
  const accountId = c.get('accountId')
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM testimonials WHERE id = ? AND account_id = ?').bind(id, accountId).run()
  return c.json({ ok: true })
})

// Manual add testimonial (from dashboard)
testimonials.post('/', async (c) => {
  const accountId = c.get('accountId')
  const body = await c.req.json<{
    display_name: string; display_text: string; rating?: number;
    company?: string; title?: string; author_email?: string;
    status?: string; source?: string; widget_id?: string;
  }>()

  if (!body.display_name || !body.display_text) {
    return c.json({ error: 'display_name and display_text are required' }, 400)
  }

  // Plan enforcement: Free plan limited to 25 testimonials
  const limitErr = await checkPlanLimit(c.env, accountId, 'add_testimonial')
  if (limitErr) return c.json(limitErr, 402)

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const status = body.status || 'approved'
  const source = body.source || 'manual'

  const cleanName = (body.display_name.replace(/<[^>]*>/g, '').trim()).slice(0, 120)
  const cleanText = (body.display_text.replace(/<[^>]*>/g, '').trim()).slice(0, 2000)

  await c.env.DB.prepare(
    `INSERT INTO testimonials (id, account_id, widget_id, display_name, display_text, rating, company, title, author_email, source, status, featured, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
  ).bind(
    id, accountId, body.widget_id ?? null,
    cleanName, cleanText,
    body.rating ?? null,
    sanitizeField(body.company, 120),
    sanitizeField(body.title, 120),
    body.author_email ? body.author_email.trim().slice(0, 254) : null,
    source, status, now, now
  ).run()

  return c.json({ testimonial: { id, status } }, 201)
})

testimonials.post('/request', (c) => c.json({ error: 'This feature has been removed. Copy your collect link and share it directly with customers.' }, 410))


// POST /api/testimonials/import-csv
// Body: multipart/form-data with field "csv" (text file)
// CSV columns (first row header, case-insensitive):
//   name*, text*, rating, company, title, email, status
testimonials.post('/import-csv', async (c) => {
  const accountId = c.get('accountId')

  let csvText: string
  try {
    const formData = await c.req.formData()
    const file = formData.get('csv')
    if (!file || typeof file === 'string') {
      return c.json({ error: 'csv file required' }, 400)
    }
    csvText = await (file as File).text()
  } catch {
    return c.json({ error: 'invalid multipart body' }, 400)
  }

  // Parse CSV (simple — handles quoted fields with commas)
  function parseCsvLine(line: string): string[] {
    const result: string[] = []
    let field = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { field += '"'; i++ }
        else { inQuotes = !inQuotes }
      } else if (ch === ',' && !inQuotes) {
        result.push(field); field = ''
      } else {
        field += ch
      }
    }
    result.push(field)
    return result
  }

  const lines = csvText.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return c.json({ error: 'CSV must have header + at least one row' }, 400)
  if (lines.length > 501) return c.json({ error: 'max 500 rows per import' }, 400)

  const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase())
  const nameIdx = headers.indexOf('name')
  const textIdx = headers.indexOf('text')
  const ratingIdx = headers.indexOf('rating')
  const companyIdx = headers.indexOf('company')
  const titleIdx = headers.indexOf('title')
  const emailIdx = headers.indexOf('email')
  const statusIdx = headers.indexOf('status')

  if (nameIdx === -1 || textIdx === -1) {
    return c.json({ error: 'CSV must have "name" and "text" columns' }, 400)
  }

  const now = new Date().toISOString()
  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    const rawName = (cols[nameIdx] ?? '').trim()
    const rawText = (cols[textIdx] ?? '').trim()

    if (!rawName || !rawText) { skipped++; continue }

    const cleanName = rawName.replace(/<[^>]*>/g, '').slice(0, 120)
    const cleanText = rawText.replace(/<[^>]*>/g, '').slice(0, 2000)
    const rating = ratingIdx !== -1 ? Number(cols[ratingIdx]) || null : null
    const company = companyIdx !== -1 ? (cols[companyIdx] ?? '').trim().slice(0, 120) || null : null
    const jobTitle = titleIdx !== -1 ? (cols[titleIdx] ?? '').trim().slice(0, 120) || null : null
    const email = emailIdx !== -1 ? (cols[emailIdx] ?? '').trim().slice(0, 254) || null : null
    const status = statusIdx !== -1 && ['approved', 'pending', 'rejected'].includes((cols[statusIdx] ?? '').trim().toLowerCase())
      ? (cols[statusIdx] ?? '').trim().toLowerCase()
      : 'approved'

    try {
      const id = crypto.randomUUID()
      await c.env.DB.prepare(
        `INSERT INTO testimonials (id, account_id, widget_id, display_name, display_text, rating, company, title, author_email, source, status, featured, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'csv_import', ?, 0, ?, ?)`
      ).bind(
        id, accountId, null,
        cleanName, cleanText,
        rating, company, jobTitle, email,
        status, now, now
      ).run()
      imported++
    } catch (e) {
      errors.push(`Row ${i}: ${(e as Error).message}`)
      skipped++
    }
  }

  return c.json({ imported, skipped, errors: errors.slice(0, 10) })
})


testimonials.post('/request-bulk', (c) => c.json({ error: 'This feature has been removed. Copy your collect link and share it directly with customers.' }, 410))
