import { Hono } from 'hono'
import type { Env } from '../index'

export const wall = new Hono<{ Bindings: Env }>()

// Public: server-rendered testimonial wall page
// GET /wall/:widgetId — returns a full HTML page with all approved testimonials
wall.get('/:widgetId', async (c) => {
  const widgetId = c.req.param('widgetId')

  // Try KV cache first
  const cacheKey = `widget:${widgetId}:json`
  let payload: WidgetPayload | null = null

  const cached = await c.env.WIDGET_KV.get(cacheKey, 'json') as WidgetPayload | null
  if (cached) {
    payload = cached
  } else {
    // Fetch widget row
    const widgetRow = await c.env.DB.prepare(
      'SELECT id, account_id, name, type, config FROM widgets WHERE id = ? AND active = 1'
    ).bind(widgetId).first<{ id: string; account_id: string; name: string; type: string; config: string }>()

    if (!widgetRow) {
      return c.html(notFoundHtml(), 404)
    }

    // Fetch approved testimonials
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

    // Cache for 5 minutes
    await c.env.WIDGET_KV.put(cacheKey, JSON.stringify(payload), { expirationTtl: 300 })
  }

  const html = renderWallPage(widgetId, payload)
  return c.html(html, 200, {
    'Cache-Control': 's-maxage=300, public',
  })
})

type Testimonial = {
  id: string
  display_name: string
  display_text: string
  rating: number | null
  company: string | null
  title: string | null
  avatar_url: string | null
  created_at: string
}

type WidgetPayload = {
  testimonials: Testimonial[]
  config: {
    layout: string
    theme: string
    name: string
  }
}

function stars(n: number | null): string {
  if (!n) return ''
  const full = Math.min(5, Math.max(0, Math.round(n)))
  return '★'.repeat(full) + '☆'.repeat(5 - full)
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}


function buildJsonLd(name: string, widgetId: string, testimonials: Testimonial[]): string {
  const rated = testimonials.filter(t => t.rating !== null)
  const avgRating = rated.length > 0
    ? (rated.reduce((sum, t) => sum + (t.rating ?? 0), 0) / rated.length).toFixed(1)
    : null

  const schema: Record<string, unknown> = {
    '@cuntext': 'https://schema.org',
    '@type': 'Product',
    name,
    url: `https://socialproof.dev/wall/${widgetId}`,
    review: testimonials.map(t => ({
      '@type': 'Review',
      reviewBody: t.display_text,
      author: { '@type': 'Person', name: t.display_name },
      ...(t.rating != null ? { reviewRating: { '@type': 'Rating', ratingValue: t.rating, bestRating: 5 } } : {}),
    })),
  }

  if (avgRating && rated.length > 0) {
    schema['aggregateRating'] = {
      '@type': 'AggregateRating',
      ratingValue: avgRating,
      reviewCount: rated.length,
      bestRating: 5,
    }
  }

  return JSON.stringify(schema)
}


function renderWallPage(widgetId: string, payload: WidgetPayload): string {
  const { testimonials, config } = payload
  const jsonLd = buildJsonLd(config.name, widgetId, testimonials)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(config.name)} - Customer Testimonials</title>
  <meta name="description" content="${testimonials.length} verified reviews for ${escapeHtml(config.name)}">
  <meta property="og:title" content="${escapeHtml(config.name)} - Customer Testimonials">
  <meta property="og:type" content="website">
  <link rel="canonical" href="https://socialproof.dev/wall/${widgetId}">
  <script type="application/ld+json">${jsonLd}</script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f9fafb;
      color: #111827;
      padding: 2rem;
    }
    .header {
      max-width: 900px;
      margin: 0 auto 2.5rem;
      text-align: center;
    }
    .header h1 { font-size: 1.8rem; font-weight: 700; }
    .header p { color: #6b7280; margin-top: 0.5rem; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }
    .card {
      background: #fff;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }
    .stars { color: #fbbf24; font-size: 1.1rem; }
    .text { margin-top: 0.75rem; color: #374151; line-height: 1.6; }
    .author { display: flex; align-items: center; gap: 0.75rem; margin-top: 1rem; }
    .avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: #6474d3;
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 600;
      overflow: hidden;
    }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .name { font-weight: 600; }
    .meta { font-size: 0.8rem; color: #6b7280; }
    .empty {
      text-align: center; padding: 4rem; color: #9ca3af;
      grid-column: 1/-1;
    }
    footer {
      text-align: center;
      margin-top: 3rem;
      font-size: 0.75rem;
      color: #d1d5db;
    }
    footer a { color: #9ca3af; text-decoration: none; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(config.name)}</h1>
    <p>${testimonials.length} verified review</p>
  </div>
  <div class="grid">
    ${testimonials.map(t => {
      const avatarHtml = t.avatar_url
        ? `<img src="${escapeHtml(t.avatar_url)}" alt="">`
        : initials(t.display_name)
      return `
      <div class="card">
        ${t.rating ? `<div class="stars">${stars(t.rating)}</div>` : ''}
        <p class="text">"${escapeHtml(t.display_text)}"</p>
        <div class="author">
          <div class="avatar">${avatarHtml}</div>
          <div>
            <div class="name">${escapeHtml(t.display_name)}</div>
            ${t.title || t.company ? `<div class="meta">${escapeHtml(t.title ?? '')}${t.title && t.company ? ' @ ' : ''}${escapeHtml(t.company ?? '')}</div>` : ''}
          </div>
        </div>
      </div>`
    }).join('\n')}
    ${testimonials.length === 0 ? `<div class="empty">No testimonials yet.</div>` : ''}
  </div>
  <footer><a href="https://socialproof.dev">Powered by SocialProof</a></footer>
</body>
</html>`
}

function notFoundHtml(): string {
  return `<!DOCTYPE html><html><body><h1>Widget not found</h1></body></html>`
}
