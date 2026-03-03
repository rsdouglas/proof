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

function renderCard(t: Testimonial, dark: boolean): string {
  const avatar = t.avatar_url
    ? `<img class="avatar" src="${escapeHtml(t.avatar_url)}" alt="" loading="lazy">`
    : `<div class="avatar-placeholder">${escapeHtml(initials(t.display_name))}</div>`

  const ratingHtml = t.rating
    ? `<div class="stars">${stars(t.rating)}</div>`
    : ''

  const meta = [t.title, t.company]
    .filter((v): v is string => Boolean(v))
    .map(escapeHtml)
    .join(' · ')

  return `
    <article class="card${dark ? ' card-dark' : ''}">
      ${ratingHtml}
      <p class="quote">"${escapeHtml(t.display_text)}"</p>
      <footer class="author">
        ${avatar}
        <div class="author-info">
          <span class="author-name">${escapeHtml(t.display_name)}</span>
          ${meta ? `<span class="author-meta">${meta}</span>` : ''}
        </div>
      </footer>
    </article>`
}

function renderWallPage(widgetId: string, payload: WidgetPayload): string {
  const { testimonials, config } = payload
  const dark = config.theme === 'dark'
  const name = config.name || 'Testimonials'
  const count = testimonials.length

  const ogTitle = `${name} — Customer Testimonials`
  const ogDesc = count > 0
    ? `${count} customer review${count !== 1 ? 's' : ''} for ${name}`
    : `Customer testimonials for ${name}`

  const cards = testimonials.map((t) => renderCard(t, dark)).join('\n')

  const emptyState = count === 0
    ? `<div class="empty"><p>No testimonials yet.</p></div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(ogTitle)}</title>
  <meta name="description" content="${escapeHtml(ogDesc)}">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(ogTitle)}">
  <meta property="og:description" content="${escapeHtml(ogDesc)}">
  <meta property="og:url" content="https://api.socialproof.dev/wall/${escapeHtml(widgetId)}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
  <meta name="twitter:description" content="${escapeHtml(ogDesc)}">

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: ${dark ? '#0f0f1a' : '#f8f9fa'};
      --surface: ${dark ? '#1a1a2e' : '#ffffff'};
      --border: ${dark ? '#2d3748' : '#e2e8f0'};
      --text: ${dark ? '#e2e8f0' : '#1a202c'};
      --text-muted: ${dark ? '#a0aec0' : '#718096'};
      --accent: #6C5CE7;
      --stars: #f6c90e;
      --radius: 14px;
      --shadow: ${dark ? 'none' : '0 2px 8px rgba(0,0,0,0.07)'};
    }

    html { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; }

    body {
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 0 0 64px;
    }

    /* Header */
    .header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 28px 24px 24px;
      text-align: center;
    }

    .header-badge {
      display: inline-block;
      background: var(--accent);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .08em;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 12px;
    }

    .header h1 {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -.02em;
      margin-bottom: 6px;
    }

    .header .subtitle {
      color: var(--text-muted);
      font-size: 15px;
    }

    /* Grid */
    .wall {
      max-width: 1080px;
      margin: 40px auto 0;
      padding: 0 20px;
      columns: 3 320px;
      column-gap: 20px;
    }

    /* Card */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 22px 24px;
      margin-bottom: 20px;
      break-inside: avoid;
      display: inline-block;
      width: 100%;
    }

    .stars {
      font-size: 16px;
      color: var(--stars);
      margin-bottom: 12px;
      letter-spacing: 1px;
    }

    .quote {
      font-size: 15px;
      line-height: 1.65;
      color: var(--text);
      margin-bottom: 18px;
    }

    .author {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .avatar-placeholder {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #ede9fe;
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      flex-shrink: 0;
    }

    .card-dark .avatar-placeholder {
      background: #312e81;
      color: #a78bfa;
    }

    .author-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .author-name {
      font-weight: 700;
      font-size: 14px;
    }

    .author-meta {
      font-size: 12px;
      color: var(--text-muted);
    }

    /* Empty state */
    .empty {
      text-align: center;
      padding: 80px 20px;
      color: var(--text-muted);
      font-size: 16px;
    }

    /* Footer */
    .footer {
      text-align: center;
      margin-top: 48px;
      padding: 0 24px;
    }

    .footer a {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 13px;
      transition: color .2s;
    }

    .footer a:hover { color: var(--accent); }

    .footer-logo {
      font-weight: 700;
      color: var(--accent);
    }

    @media (max-width: 600px) {
      .header h1 { font-size: 22px; }
      .wall { padding: 0 12px; columns: 1; }
    }
  </style>
</head>
<body>

<header class="header">
  <div class="header-badge">Wall of Love</div>
  <h1>${escapeHtml(name)}</h1>
  <p class="subtitle">${count > 0 ? `${count} verified customer review${count !== 1 ? 's' : ''}` : 'Customer testimonials'}</p>
</header>

<main class="wall">
  ${cards}
  ${emptyState}
</main>

<div class="footer">
  <a href="https://socialproof.dev" target="_blank" rel="noopener">
    Powered by <span class="footer-logo">Vouch</span>
  </a>
</div>

</body>
</html>`
}

function notFoundHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Widget not found — Vouch</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8f9fa; }
    .box { text-align: center; }
    h1 { font-size: 24px; color: #1a202c; }
    p { color: #718096; margin-top: 8px; }
    a { color: #6C5CE7; }
  </style>
</head>
<body>
  <div class="box">
    <h1>Widget not found</h1>
    <p>This testimonial wall doesn't exist. <a href="https://socialproof.dev">Get started with Vouch →</a></p>
  </div>
</body>
</html>`
}
