import { fireWebhooks } from './webhooks'
import { sendEmail, buildTestimonialReceivedEmail } from './email'
import { Hono } from 'hono'
import type { Env } from '../index'
import { checkRateLimit } from '../lib/ratelimit'

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

  // Rate limit: 10 submissions per IP per hour per form
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'
  const rateLimitKey = `submit:${c.req.param('formId')}:${ip}`
  const allowed = await checkRateLimit(c.env.WIDGET_KV, rateLimitKey, 10, 3600)
  if (!allowed) return c.json({ error: 'Too many submissions. Try again later.' }, 429)

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

  // Send email notification to the widget owner
  const owner = await c.env.DB.prepare(
    'SELECT a.email, a.name, w.name as widget_name, w.id as widget_id, w.slug FROM accounts a JOIN widgets w ON w.account_id = a.id JOIN collection_forms f ON f.widget_id = w.id WHERE f.id = ? LIMIT 1'
  ).bind(c.req.param('formId')).first<{ email: string; name: string; widget_name: string; widget_id: string; slug: string | null }>()

  if (owner?.email) {
    const reviewUrl = `https://app.socialproof.dev/widgets/${owner.widget_id}`
    await sendEmail(
      buildTestimonialReceivedEmail({
        ownerEmail: owner.email,
        ownerName: owner.name,
        widgetName: owner.widget_name,
        customerName: body.display_name.trim(),
        rating: body.rating ?? 5,
        text: body.display_text.trim(),
        reviewUrl,
      }),
      c.env
    )
  }

  // Fire webhooks for this account
  await fireWebhooks(c.env.DB, form.account_id, 'testimonial.submitted', {
    id,
    display_name: body.display_name.trim(),
    display_text: body.display_text.trim(),
    rating: body.rating ?? null,
    company: body.company ?? null,
    title: body.title ?? null,
    submitter_email: body.submitter_email ?? null,
    source: 'form',
    status: 'pending',
    created_at: now,
  })

  return c.json({ ok: true, message: 'Thank you! Your testimonial has been submitted for review.' }, 201)
})
