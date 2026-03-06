import { Hono } from 'hono'
import type { Env } from '../index'
import { sendEmail, buildTestimonialReceivedEmail } from './email'

export const collectWidget = new Hono<{ Bindings: Env }>()

// Serve collection form for a widget directly
collectWidget.get('/:widgetId', async (c) => {
  const widgetId = c.req.param('widgetId')
  const widget = await c.env.DB.prepare(
    'SELECT w.id, w.name, a.name as business_name FROM widgets w JOIN accounts a ON a.id = w.account_id WHERE w.id = ? AND w.active = 1'
  ).bind(widgetId).first<{ id: string; name: string; business_name: string }>()

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${widget ? `How was your experience with ${widget.business_name}?` : 'Not Found'} — Vouch</title>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:40px 16px;min-height:100vh}
  .card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:40px;max-width:480px;margin:0 auto;box-shadow:0 1px 3px rgba(0,0,0,.07)}
  h1{margin:0 0 6px;font-size:22px;color:#111}
  .sub{margin:0 0 28px;color:#6b7280;font-size:15px}
  label{display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:5px}
  input,textarea{display:block;width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;margin-bottom:16px;font-family:inherit;font-size:14px;outline:none;transition:border-color .15s}
  input:focus,textarea:focus{border-color:#2563eb}
  textarea{min-height:120px;resize:vertical}
  .stars{display:flex;gap:6px;margin-bottom:20px}
  .star{font-size:30px;cursor:pointer;color:#d1d5db;transition:color .1s;user-select:none}
  .star.on{color:#f59e0b}
  button{width:100%;padding:12px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-weight:600;font-size:15px;cursor:pointer;transition:background .15s}
  button:hover{background:#1d4ed8}
  button:disabled{background:#93c5fd;cursor:not-allowed}
  .success{text-align:center;padding:20px 0}
  .err{color:#ef4444;font-size:13px;margin-bottom:12px;padding:10px;background:#fef2f2;border-radius:6px;border:1px solid #fecaca}
  .brand{text-align:center;margin-top:20px;font-size:12px;color:#9ca3af}
  .brand a{color:#9ca3af;text-decoration:none}
  .required{color:#ef4444}
</style>
</head>
<body>
${!widget ? '<div class="card"><h1>Form not found</h1><p style="color:#6b7280">This collection link is no longer active.</p></div>' : `
<div class="card">
  <h1>How was your experience with ${widget.business_name}?</h1>
  <p class="sub">Your honest words help others find them — and mean the world to a small business.</p>
  <div id="form">
    <label>Your name <span class="required">*</span></label>
    <input id="name" placeholder="Jane Smith" autocomplete="name" />
    <label>Email <span style="color:#9ca3af;font-weight:400">(optional)</span></label>
    <input id="email" type="email" placeholder="jane@example.com" autocomplete="email" />
    <label>Company <span style="color:#9ca3af;font-weight:400">(optional)</span></label>
    <input id="company" placeholder="Acme Corp" />
    <label>Job title <span style="color:#9ca3af;font-weight:400">(optional)</span></label>
    <input id="title" placeholder="Marketing Manager" />
    <label>Rating <span style="color:#9ca3af;font-weight:400">(optional)</span></label>
    <div class="stars" id="stars">
      ${[1,2,3,4,5].map(i => `<span class="star" data-v="${i}">★</span>`).join('')}
    </div>
    <label>Your experience <span class="required">*</span></label>
    <textarea id="text" placeholder="What was it like working with them? What would you tell a friend who was considering them?"></textarea>
    <div id="error" class="err" style="display:none"></div>
    <button id="btn" onclick="doSubmit()">Share my experience →</button>
  </div>
  <div class="success" id="success" style="display:none">
    <div style="font-size:52px;margin-bottom:12px">🎉</div>
    <h2 style="margin:0 0 8px" id="success-heading">Thank you!</h2>
    <p style="color:#6b7280;margin:0">${widget.business_name} will review your testimonial shortly. Your words make a real difference for a small business.</p>
  </div>
</div>
<script>
  var rating = 0;
  document.querySelectorAll('.star').forEach(function(s) {
    s.addEventListener('click', function() {
      rating = parseInt(s.dataset.v);
      document.querySelectorAll('.star').forEach(function(x) {
        x.classList.toggle('on', parseInt(x.dataset.v) <= rating);
      });
    });
    s.addEventListener('mouseover', function() {
      document.querySelectorAll('.star').forEach(function(x) {
        x.classList.toggle('on', parseInt(x.dataset.v) <= parseInt(s.dataset.v));
      });
    });
    s.addEventListener('mouseout', function() {
      document.querySelectorAll('.star').forEach(function(x) {
        x.classList.toggle('on', parseInt(x.dataset.v) <= rating);
      });
    });
  });
  async function doSubmit() {
    var name = document.getElementById('name').value.trim();
    var text = document.getElementById('text').value.trim();
    var errEl = document.getElementById('error');
    if (!name || !text) {
      errEl.textContent = 'Name and testimonial are required.';
      errEl.style.display = 'block';
      return;
    }
    errEl.style.display = 'none';
    var btn = document.getElementById('btn');
    btn.disabled = true; btn.textContent = 'Submitting…';
    var body = { display_name: name, display_text: text };
    var email = document.getElementById('email').value.trim();
    var company = document.getElementById('company').value.trim();
    var title = document.getElementById('title').value.trim();
    if (email) body.author_email = email;
    if (company) body.company = company;
    if (title) body.title = title;
    if (rating) body.rating = rating;
    try {
      var res = await fetch('/api/collect/${widgetId}', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (res.ok) {
        var firstName = document.getElementById('name').value.trim().split(' ')[0];
        document.getElementById('success-heading').textContent = 'Thank you, ' + firstName + '!';
        document.getElementById('form').style.display = 'none';
        document.getElementById('success').style.display = 'block';
      } else {
        var data = await res.json();
        errEl.textContent = data.error || 'Something went wrong. Please try again.';
        errEl.style.display = 'block';
        btn.disabled = false; btn.textContent = 'Share my experience →';
      }
    } catch(e) {
      errEl.textContent = 'Network error. Please try again.';
      errEl.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Share my experience →';
    }
  }
</script>`}
<div class="brand">Powered by <a href="https://vouch.run">Vouch</a></div>
</body>
</html>`

  return c.html(html)
})

// Public: Submit testimonial to a widget
collectWidget.post('/:widgetId', async (c) => {
  const widgetId = c.req.param('widgetId')
  const widget = await c.env.DB.prepare(
    'SELECT w.id, w.account_id, w.name as widget_name, a.plan, a.email as owner_email, a.name as owner_name FROM widgets w JOIN accounts a ON a.id = w.account_id WHERE w.id = ? AND w.active = 1'
  ).bind(widgetId).first<{ id: string; account_id: string; widget_name: string; plan: string; owner_email: string; owner_name: string }>()
  if (!widget) return c.json({ error: 'Widget not found' }, 404)

  // Plan enforcement: Free plan limited to 20 approved testimonials per widget
  if (widget.plan !== 'pro') {
    const countRow = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM testimonials WHERE widget_id = ? AND status = 'approved'"
    ).bind(widgetId).first<{ count: number }>()
    if ((countRow?.count ?? 0) >= 20) {
      return c.json({ error: 'This widget has reached its testimonial limit.' }, 402)
    }
  }

  const body = await c.req.json<{
    display_name: string
    display_text: string
    rating?: number
    company?: string
    title?: string
    author_email?: string
  }>()

  if (!body.display_name?.trim() || !body.display_text?.trim()) {
    return c.json({ error: 'Name and testimonial text are required' }, 400)
  }

  if (body.rating !== undefined && (body.rating < 1 || body.rating > 5)) {
    return c.json({ error: 'Rating must be between 1 and 5' }, 400)
  }

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await c.env.DB.prepare(
    `INSERT INTO testimonials (id, account_id, widget_id, display_name, display_text, rating, company, title, author_email, source, status, featured, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'form', 'pending', 0, ?, ?)`
  ).bind(
    id, widget.account_id, widget.id,
    body.display_name.trim(), body.display_text.trim(),
    body.rating ?? null, body.company ?? null, body.title ?? null,
    body.author_email ?? null,
    now, now
  ).run()

  // Send notification email to widget owner
  if (widget.owner_email) {
    const reviewUrl = `https://app.socialproof.dev/widgets/${widget.id}`
    sendEmail(
      buildTestimonialReceivedEmail({
        ownerEmail: widget.owner_email,
        ownerName: widget.owner_name,
        widgetName: widget.widget_name,
        customerName: body.display_name.trim(),
        rating: body.rating ?? 5,
        text: body.display_text.trim(),
        reviewUrl,
      }),
      c.env
    ).catch(err => console.error('[collect_widget] notification email failed:', err))
  }

  return c.json({ ok: true, message: 'Thank you! Your testimonial has been submitted for review.' }, 201)
})
