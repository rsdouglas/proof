import { Hono } from 'hono'
import type { Env } from '../index'

export const collect = new Hono<{ Bindings: Env }>()

// Public: Get form info for display
collect.get('/form/:formId', async (c) => {
  const form = await c.env.DB.prepare(
    'SELECT f.id, f.name, a.name as business_name FROM collection_forms f JOIN accounts a ON a.id = f.account_id WHERE f.id = ? AND f.active = 1'
  ).bind(c.req.param('formId')).first<{ id: string; name: string; business_name: string }>()
  if (!form) return c.json({ error: 'Form not found' }, 404)
  return c.json({ form })
})

// Public: Submit a testimonial via collection form
collect.post('/submit/:formId', async (c) => {
  const form = await c.env.DB.prepare(
    'SELECT f.id, f.account_id FROM collection_forms f WHERE f.id = ? AND f.active = 1'
  ).bind(c.req.param('formId')).first<{ id: string; account_id: string }>()
  if (!form) return c.json({ error: 'Form not found' }, 404)

  const body = await c.req.json<{
    display_name: string; display_text: string; rating?: number;
    company?: string; title?: string; submitter_email?: string
  }>()

  if (!body.display_name?.trim() || !body.display_text?.trim()) {
    return c.json({ error: 'Name and testimonial text required' }, 400)
  }

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await c.env.DB.prepare(
    `INSERT INTO testimonials (id, account_id, display_name, display_text, rating, company, title, submitter_email, source, status, featured, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
  ).bind(id, form.account_id, body.display_name.trim(), body.display_text.trim(),
    body.rating ?? null, body.company ?? null, body.title ?? null,
    body.submitter_email ?? null, 'form', 'pending', now, now).run()

  return c.json({ ok: true, message: 'Thank you! Your testimonial has been submitted for review.' }, 201)
})
