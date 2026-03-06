import { fireWebhooks } from './webhooks'
import { sendCelebrationEmail } from '../lib/onboarding'
import { sendEmail, buildTestimonialReceivedEmail } from './email'
import { Hono } from 'hono'
import type { Env } from '../index'
import { checkRateLimit } from '../lib/ratelimit'

function escapeHtml(s: string): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Strip HTML tags and limit field lengths to prevent XSS stored in DB
function sanitizeText(s: string | undefined | null, maxLen: number): string | null {
  if (!s) return null
  // Remove HTML tags, then trim whitespace
  return s.replace(/<[^>]*>/g, '').trim().slice(0, maxLen)
}
function requireSanitized(s: string, maxLen: number): string {
  return s.replace(/<[^>]*>/g, '').trim().slice(0, maxLen)
}


export const collect = new Hono<{ Bindings: Env }>()

// Public: Get form info for display
collect.get('/form/:formId', async (c) => {
  const form = await c.env.DB.prepare(
    'SELECT f.id, f.name, a.name as business_name FROM collection_forms f JOIN accounts a ON a.id = f.account_id WHERE f.id = ? AND f.active = 1'
  ).bind(c.req.param('formId')).first<{ id: string; name: string; business_name: string }>()
  if (!form) return c.json({ error: 'Form not found' }, 404)
  return c.json({ form })
})


// Public: Serve the testimonial collection form HTML at /c/:formId
collect.get('/:formId', async (c) => {
  const formId = c.req.param('formId')
  const form = await c.env.DB.prepare(
    'SELECT f.id, f.name, a.name as business_name, a.plan FROM collection_forms f JOIN accounts a ON a.id = f.account_id WHERE f.id = ? AND f.active = 1'
  ).bind(formId).first<{ id: string; name: string; business_name: string; plan: string }>()

  const isFreePlan = !form || (form.plan ?? 'free') !== 'pro'

  const poweredByBadge = isFreePlan
    ? `<div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #f3f4f6">
        <a href="https://vouch.run" target="_blank" rel="noopener noreferrer"
           style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#9ca3af;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;transition:color 0.2s"
           onmouseover="this.style.color='#6C5CE7'" onmouseout="this.style.color='#9ca3af'">
          <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#6C5CE7;color:#fff;font-size:9px;font-weight:700;line-height:14px;text-align:center;flex-shrink:0">V</span>
          Powered by Social Proof
        </a>
      </div>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${form ? `How was your experience with ${escapeHtml(form.business_name)}?` : 'Not Found'}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:40px 16px}
  .card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:40px;max-width:480px;margin:0 auto}
  h1{margin:0 0 8px;font-size:22px}p{margin:0 0 24px;color:#6b7280}
  input,textarea{display:block;width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;margin-bottom:12px;font-family:inherit;font-size:14px;box-sizing:border-box}
  textarea{min-height:120px;resize:vertical}
  .stars{display:flex;gap:4px;margin-bottom:12px}
  .star{font-size:28px;cursor:pointer;color:#d1d5db;transition:color 0.1s}
  .star.active{color:#f59e0b}
  button{width:100%;padding:10px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-weight:600;font-size:15px;cursor:pointer}
  .success{text-align:center;padding:40px 0}
  .error{color:#ef4444;font-size:13px;margin-bottom:12px}
</style>
</head>
<body>
${!form ? '<div class="card"><h1>Form not found</h1></div>' : `
<div class="card">
  <h1>How was your experience with ${escapeHtml(form.business_name)}?</h1>
  <p>Your honest words help others find them — and mean the world to a small business.</p>
  <div id="form">
    <input id="name" placeholder="Your name" required />
    <input id="email" type="email" placeholder="Email (optional)" />
    <input id="company" placeholder="Company (optional)" />
    <input id="title" placeholder="Job title (optional)" />
    <div class="stars" id="stars">
      ${[1,2,3,4,5].map(i => `<span class="star active" data-v="${i}" onclick="setRating(${i})">★</span>`).join('')}
    </div>
    <textarea id="text" placeholder="What was it like working with them? What would you tell a friend who was considering them?" required></textarea>
    <div id="error" class="error" style="display:none"></div>
    <button onclick="submitForm()">Share my experience →</button>
  </div>
  <div class="success" id="success" style="display:none">
    <div style="font-size:48px">🎉</div>
    <h2 id="success-heading">Thank you!</h2>
    <p>${escapeHtml(form.business_name)} will review your testimonial shortly. Your words make a real difference for a small business.</p>
  </div>
  ${poweredByBadge}
</div>
<script>
  var rating = 5;
  function setRating(v) {
    rating = v;
    document.querySelectorAll('.star').forEach(function(s) {
      s.classList.toggle('active', parseInt(s.dataset.v) <= v);
    });
  }
  async function submitForm() {
    var name = document.getElementById('name').value.trim();
    var text = document.getElementById('text').value.trim();
    var error = document.getElementById('error');
    if (!name || !text) { error.textContent = 'Name and testimonial are required.'; error.style.display='block'; return; }
    error.style.display = 'none';
    var body = { display_name: name, display_text: text };
    var email = document.getElementById('email').value.trim();
    var company = document.getElementById('company').value.trim();
    var title = document.getElementById('title').value.trim();
    if (email) body.submitter_email = email;
    if (company) body.company = company;
    if (title) body.title = title;
    if (rating) body.rating = rating;
    var res = await fetch('/c/submit/${formId}', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (res.ok) {
      var firstName = document.getElementById('name').value.trim().split(' ')[0];
      document.getElementById('success-heading').textContent = 'Thank you, ' + firstName + '!';
      document.getElementById('form').style.display = 'none';
      document.getElementById('success').style.display = 'block';
    } else {
      var d = await res.json();
      error.textContent = d.error || 'Something went wrong';
      error.style.display = 'block';
    }
  }
</script>
`}
</body>
</html>`

  return c.html(html, form ? 200 : 404)
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
    company?: string; title?: string; author_email?: string
  }>()

  if (!body.display_name?.trim() || !body.display_text?.trim()) {
    return c.json({ error: 'Name and testimonial text required' }, 400)
  }

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const cleanName = requireSanitized(body.display_name, 120)
  const cleanText = requireSanitized(body.display_text, 2000)
  const cleanCompany = sanitizeText(body.company, 120)
  const cleanTitle = sanitizeText(body.title, 120)
  const cleanEmail = body.author_email ? body.author_email.trim().slice(0, 254) : null

  await c.env.DB.prepare(
    `INSERT INTO testimonials (id, account_id, display_name, display_text, rating, company, title, author_email, source, status, featured, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
  ).bind(id, form.account_id, cleanName, cleanText,
    body.rating ?? null, cleanCompany, cleanTitle,
    cleanEmail, 'form', 'pending', now, now).run()

  // First testimonial celebration email — check if this is the account's first ever
  const prevCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM testimonials WHERE account_id = ? AND id != ?'
  ).bind(form.account_id, id).first<{ cnt: number }>()

  if (c.env.RESEND_API_KEY && prevCount?.cnt === 0) {
    // This is the first testimonial — fire celebration email async
    const celebAccount = await c.env.DB.prepare(
      'SELECT a.email, a.name, a.drip_celebration_sent_at FROM accounts a WHERE a.id = ?'
    ).bind(form.account_id).first<{ email: string; name: string; drip_celebration_sent_at: string | null }>()
    if (celebAccount?.email && !celebAccount.drip_celebration_sent_at) {
      // Get the first widget for embed snippet
      const firstWidget = await c.env.DB.prepare(
        'SELECT id FROM widgets WHERE account_id = ? ORDER BY created_at ASC LIMIT 1'
      ).bind(form.account_id).first<{ id: string }>()
      await sendCelebrationEmail(c.env.RESEND_API_KEY, {
        email: celebAccount.email,
        name: celebAccount.name ?? celebAccount.email,
        widgetId: firstWidget?.id ?? '',
        testimonialAuthor: body.display_name?.trim() ?? 'A customer',
        testimonialText: body.display_text?.trim() ?? '',
      })
      await c.env.DB.prepare(
        'UPDATE accounts SET drip_celebration_sent_at = ? WHERE id = ?'
      ).bind(now, form.account_id).run()
    }
  }

  // Send email notification to the widget owner
  // NOTE: collection_forms.widget_id may be NULL (for auto-created forms), so we join via account_id
  const owner = await c.env.DB.prepare(
    'SELECT a.email, a.name, w.name as widget_name, w.id as widget_id FROM accounts a JOIN widgets w ON w.account_id = a.id WHERE a.id = ? ORDER BY w.created_at ASC LIMIT 1'
  ).bind(form.account_id).first<{ email: string; name: string; widget_name: string; widget_id: string }>()

  if (owner?.email) {
    const reviewUrl = `https://app.vouch.run/widgets/${owner.widget_id}`
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
    submitter_email: body.author_email ?? null,
    source: 'form',
    status: 'pending',
    created_at: now,
  })

  return c.json({ ok: true, message: 'Thank you! Your testimonial has been submitted for review.' }, 201)
})
