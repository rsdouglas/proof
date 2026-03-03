import { Hono } from 'hono'
import type { Env } from '../index'

export const wall = new Hono<{ Bindings: Env }>()

wall.get('/:widgetId', async (c) => {
  const widgetId = c.req.param('widgetId')
  const cacheKey = `widget:${widgetId}:json`
  let payload: WidgetPayload | null = null
  const cached = await c.env.WIDGET_KV.get(cacheKey, 'json') as WidgetPayload | null
  if (cached) {
    payload = cached
  } else {
    const widgetRow = await c.env.DB.prepare(
      'SELECT id, account_id, name, type, config FROM widgets WHERE id = ? AND active = 1'
    ).bind(widgetId).first<{ id: string; account_id: string; name: string; type: string; config: string }>()
    if (!widgetRow) return c.html('<h1>Not Found</h1>', 404)
    const { results } = await c.env.DB.prepare(
      `SELECT id, display_name, display_text, rating, company, title, avatar_url, created_at
       FROM testimonials
       WHERE account_id = ? AND status = 'approved'
       ORDER BY featured DESC, created_at DESC
       LIMIT 100`
    ).bind(widgetRow.account_id).all<Testimonial>()
    const widgetConfig = JSON.parse(widgetRow.config || '{}') as Record<string, string>
    payload = {
      testimonials: results,
      config: {
        layout: widgetConfig['layout'] ?? widgetRow.type ?? 'grid',
        theme: widgetConfig['theme'] ?? 'light',
        name: widgetRow.name,
      },
    }
    await c.env.WIDGET_KV.put(cacheKey, JSON.stringify(payload), { expirationTtl: 300 })
  }
  return c.html(renderWallPage(widgetId, payload), 200, { 'Cache-Control': 's-maxage=300, public' })
})

type Testimonial = { id: string; display_name: string; display_text: string; rating: number | null; company: string | null; title: string | null; avatar_url: string | null; created_at: string }
type WidgetPayload = { testimonials: Testimonial[]; config: { layout: string; theme: string; name: string } }

function stars(n: number | null): string {
  if (!n) return ''
  return '\u2605'.repeat(Math.min(5, Math.max(0, Math.round(n)))) + '\u2606'.repeat(5 - Math.min(5, Math.max(0, Math.round(n))))
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function renderWallPage(widgetId: string, payload: WidgetPayload | null): string {
  if (!payload || payload.testimonials.length === 0) {
    return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;text-align:center"><p>No testimonials yet.</p></body></html>`
  }
  const { testimonials, config } = payload
  const cards = testimonials.map(t => `
    <div class="card">
      <div class="card-header">
        <div class="avatar">${t.avatar_url ? `<img src="${escapeHtml(t.avatar_url)}" alt="">` : `<span>${initials(t.display_name)}</span>`}</div>
        <div class="meta">
          <strong>${escapeHtml(t.display_name)}</strong>
          ${t.company ? `<span>${escapeHtml(t.company)}</span>` : ''}
        </div>
      </div>
      ${t.rating ? `<div class="stars">${stars(t.rating)}</div>` : ''}
      <p class="text">${escapeHtml(t.display_text)}</p>
    </div>`).join('\n')
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(config.name)} - Testimonials</title>
  <style>
    *,no-allowed{*}*{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;color:#111827}
    h1{font-size:1.5rem;font-weight:700;margin-bottom:1.5rem;color:#111827}text-align:center;padding:2rem 1rem 1re}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem;padding:1re}
    .card{background:#fff;border-radius:.75rem;box-shadow:0 1px 3px rgba(0,0,0,.1);padding:1.5rem;display:flex;flex-direction:column;gap:.5rem}
    .card-header{display:flex;gap:.75rem;align-items:center}
    .avatar{width:2.5rem;height:2.5rem;border-radius:50%;overflow:hidden;background:#6366f1;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:.8rem}
    .avatar img{width:100%;height:100%;object-fit:cover}
    .meta{display:flex;flex-direction:column;gap:.25rem}
    .meta strong{font-size:.9rem;font-weight:600}
    .meta span{font-size:.8rem;color:#6b7480}
    .stars{color:#fbbf24;font-size:.8rem}
    .text{font-size:.85rem;line-height:1.6;color:#374151;flex:1}
  </style>
</head>
<body>
  <header style="text-align:center;padding:2rem 1rem 1rem">
    <h1>${escapeHtml(config.name)}</h1>
  </header>
  <main class="grid">${cards}</main>
  <footer style="text-align:center;padding:1rem;font-size:.75rem;color:#a5aebe">Powered by <a href="https://vouch.app" style="color:#6366f1">Vouch</a></footer>
</body>
</html>`
}
