import { Hono } from 'hono'
import type { Env } from '../index'

function escapeHtml(s: string): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const submit = new Hono<{ Bindings: Env }>()

submit.get('/submit/:formId', async (c) => {
  const formId = c.req.param('formId')
  const form = await c.env.DB.prepare(
    'SELECT f.id, f.name, a.name as business_name, a.plan, w.config as widget_config FROM collection_forms f JOIN accounts a ON a.id = f.account_id LEFT JOIN widgets w ON w.id = f.widget_id WHERE f.id = ? AND f.active = 1'
  ).bind(formId).first<{ id: string; name: string; business_name: string; plan: string; widget_config?: string }>()

  const isFreePlan = !form || (form.plan ?? 'free') !== 'pro'
  let googleReviewUrl = ''
  if (form?.widget_config) {
    try { googleReviewUrl = JSON.parse(form.widget_config).google_review_url || '' } catch {}
  }

  const poweredByBadge = isFreePlan
    ? `<div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #f3f4f6">
        <a href="https://socialproof.dev" target="_blank" rel="noopener noreferrer"
           style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#9ca3af;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;transition:color 0.2s"
           onmouseover="this.style.color='#6C5CE7'" onmouseout="this.style.color='#9ca3af'">
          <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#6C5CE7;color:#fff;font-size:9px;font-weight:700;line-height:14px;text-align:center;flex-shrink:0">V</span>
          Powered by SocialProof
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
      ${[1,2,3,4,5].map(i => `<span class="star" data-v="${i}" onclick="setRating(${i})">★</span>`).join('')}
    </div>
    <textarea id="text" placeholder="What was it like working with them? What would you tell a friend who was considering them?" required></textarea>
    <div id="error" class="error" style="display:none"></div>
    <button onclick="submit()">Share my experience →</button>
  </div>
  <div class="success" id="success" style="display:none">
    <div style="font-size:48px">🎉</div>
    <h2 id="success-heading">Thank you!</h2>
    <p id="success-sub">${escapeHtml(form.business_name)} will review your testimonial shortly. Your words make a real difference for a small business.</p>
    ${googleReviewUrl ? `<div id="google-cta" style="display:none;margin-top:24px">
      <p style="font-size:14px;color:#374151;margin:0 0 12px">Loving it? A quick Google review would mean the world to them.</p>
      <a href="${escapeHtml(googleReviewUrl)}" target="_blank" rel="noopener noreferrer"
         style="display:inline-block;padding:10px 24px;background:#4285F4;color:#fff;border-radius:6px;font-weight:600;font-size:14px;text-decoration:none">
        ⭐ Leave a Google Review
      </a>
    </div>` : ''}
  </div>
  ${poweredByBadge}
</div>
<script>
  var rating = 0;
  function setRating(v) {
    rating = v;
    document.querySelectorAll('.star').forEach(function(s) {
      s.classList.toggle('active', parseInt(s.dataset.v) <= v);
    });
  }
  async function submit() {
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
      if (rating >= 4) {
        var gcta = document.getElementById('google-cta');
        if (gcta) gcta.style.display = 'block';
      }
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
