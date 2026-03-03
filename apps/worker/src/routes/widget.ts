import { Hono } from 'hono'
import type { Env } from '../index'

export const widget = new Hono<{ Bindings: Env }>()

// Serve the widget bundle JS - route: /w/:widgetId.js
widget.get('/:widgetId', async (c) => {
  const widgetId = c.req.param('widgetId').replace(/\.js$/, '')

  // Check KV cache first
  const cached = await c.env.WIDGET_KV.get(`widget:${widgetId}:js`, 'text')
  if (cached) {
    return c.text(cached, 200, {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=60',
    })
  }

  // Fetch widget config
  const widgetRow = await c.env.DB.prepare(
    'SELECT w.id, w.type, w.config, w.account_id FROM widgets w WHERE w.id = ? AND w.active = 1'
  ).bind(widgetId).first<{ id: string; type: string; config: string; account_id: string }>()

  if (!widgetRow) return c.text('// Widget not found', 404, { 'Content-Type': 'application/javascript' })

  // Fetch approved testimonials for this account
  const { results } = await c.env.DB.prepare(
    'SELECT display_name, display_text, rating, company, title FROM testimonials WHERE account_id = ? AND status = ? ORDER BY featured DESC, created_at DESC LIMIT 20'
  ).bind(widgetRow.account_id, 'approved').all<{ display_name: string; display_text: string; rating: number | null; company: string | null; title: string | null }>()

  const config = JSON.parse(widgetRow.config || '{}') as Record<string, unknown>
  const js = buildWidgetJS(widgetId, widgetRow.type, results, config)

  // Cache for 60 seconds
  await c.env.WIDGET_KV.put(`widget:${widgetId}:js`, js, { expirationTtl: 60 })

  return c.text(js, 200, {
    'Content-Type': 'application/javascript',
    'Cache-Control': 'public, max-age=60',
  })
})

function buildWidgetJS(
  widgetId: string,
  type: string,
  testimonials: Array<{ display_name: string; display_text: string; rating: number | null; company: string | null; title: string | null }>,
  _config: Record<string, unknown>
): string {
  return `(function() {
  var widgetId = ${JSON.stringify(widgetId)};
  var type = ${JSON.stringify(type)};
  var testimonials = ${JSON.stringify(testimonials)};

  function stars(n) {
    if (!n) return '';
    return '<span style="color:#f59e0b">' + '\u2605'.repeat(n) + '\u2606'.repeat(5-n) + '</span>';
  }

  function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function card(t) {
    return '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;break-inside:avoid">' +
      (t.rating ? '<div style="margin-bottom:8px">' + stars(t.rating) + '</div>' : '') +
      '<p style="margin:0 0 12px;color:#374151;line-height:1.5">"' + escapeHtml(t.display_text) + '"</p>' +
      '<div style="font-weight:600;font-size:14px">' + escapeHtml(t.display_name) + '</div>' +
      (t.title || t.company ? '<div style="color:#6b7280;font-size:13px">' + escapeHtml([t.title, t.company].filter(Boolean).join(' \xb7 ')) + '</div>' : '') +
      '</div>';
  }

  var containers = document.querySelectorAll('[data-proof-widget="' + widgetId + '"]');
  containers.forEach(function(el) {
    if (testimonials.length === 0) { el.style.display = 'none'; return; }
    if (type === 'grid') {
      el.innerHTML = '<div style="columns:2;gap:16px;font-family:sans-serif">' +
        testimonials.map(card).join('') + '</div>';
    } else {
      // Default: wall/list
      el.innerHTML = '<div style="display:flex;flex-direction:column;gap:12px;font-family:sans-serif">' +
        testimonials.map(card).join('') + '</div>';
    }
  });
})();`
}
