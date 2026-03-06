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
      'SELECT id, account_id, name, slug, type, config FROM widgets WHERE (id = ? OR slug = ?) AND active = 1'
    ).bind(widgetId, widgetId).first<{ id: string; account_id: string; name: string; slug: string | null; type: string; config: string }>()

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

  const reviews = testimonials.slice(0, 20).map(t => ({
    '@type': 'Review',
    author: { '@type': 'Person', name: t.display_name },
    datePublished: t.created_at.split('T')[0],
    reviewBody: t.display_text,
    ...(t.rating ? { reviewRating: { '@type': 'Rating', ratingValue: t.rating, bestRating: 5, worstRating: 1 } } : {}),
  }))

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url: `https://socialproof.dev/wall/${widgetId}`,
    review: reviews,
    ...(avgRating ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating,
        reviewCount: rated.length,
        bestRating: 5,
        worstRating: 1,
      }
    } : {}),
  }

  return JSON.stringify(ld)
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
  const minimal = config.theme === 'minimal'
  const layout = config.layout || 'masonry'
  const name = config.name || 'Testimonials'
  const count = testimonials.length

  const ogTitle = `${name} — Customer Testimonials`
  const ogDesc = count > 0
    ? `${count} customer review${count !== 1 ? 's' : ''} for ${name}`
    : `Customer testimonials for ${name}`

  const cards = testimonials.map((t) => renderCard(t, dark || minimal)).join('\n')

  const emptyState = count === 0
    ? `<div class="empty"><p>No testimonials yet.</p></div>`
    : ''

  // Layout-specific wrapper class and CSS
  const isListLayout = layout === 'list'
  const isGridLayout = layout === 'grid'
  // carousel/popup fall back to masonry layout on the wall page

  const wallClass = isListLayout ? 'wall wall-list' : isGridLayout ? 'wall wall-grid' : 'wall wall-masonry'

  const layoutCss = isListLayout
    ? `.wall-list { max-width: 720px; display: flex; flex-direction: column; gap: 20px; }
    .wall-list .card { margin-bottom: 0; break-inside: unset; display: block; }`
    : isGridLayout
    ? `.wall-grid { max-width: 1080px; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .wall-grid .card { margin-bottom: 0; break-inside: unset; display: block; }
    @media (max-width: 600px) { .wall-grid { grid-template-columns: 1fr; } }`
    : `.wall-masonry { max-width: 1080px; columns: 3 320px; column-gap: 20px; }
    @media (max-width: 600px) { .wall-masonry { columns: 1; } }`

  // Theme-specific CSS vars
  const themeVars = minimal
    ? `--bg: #fff; --surface: #fff; --border: #e8e8e8; --text: #222; --text-muted: #888; --accent: #6C5CE7; --stars: #f6c90e; --radius: 6px; --shadow: none;`
    : dark
    ? `--bg: #0f0f1a; --surface: #1a1a2e; --border: #2d3748; --text: #e2e8f0; --text-muted: #a0aec0; --accent: #6C5CE7; --stars: #f6c90e; --radius: 14px; --shadow: none;`
    : `--bg: #f8f9fa; --surface: #ffffff; --border: #e2e8f0; --text: #1a202c; --text-muted: #718096; --accent: #6C5CE7; --stars: #f6c90e; --radius: 14px; --shadow: 0 2px 8px rgba(0,0,0,0.07);`

  const minimalCardCss = minimal ? `
    .card { border: none; border-bottom: 1px solid var(--border); border-radius: 0; box-shadow: none; padding: 28px 0; }
    .quote { font-style: italic; }
  ` : ''

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

  <!-- JSON-LD Structured Data (Google rich results) -->
  <script type="application/ld+json">${buildJsonLd(name, widgetId, testimonials)}</script>

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root { ${themeVars} }

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

    /* Wall container */
    .wall {
      margin: 40px auto 0;
      padding: 0 20px;
    }

    /* Layout-specific */
    ${layoutCss}

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

    /* Minimal theme overrides */
    ${minimalCardCss}

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
      .wall { padding: 0 12px; }
    }
  </style>
</head>
<body>

<header class="header">
  <div class="header-badge">Wall of Love</div>
  <h1>${escapeHtml(name)}</h1>
  <p class="subtitle">${count > 0 ? `${count} verified customer review${count !== 1 ? 's' : ''}` : 'Customer testimonials'}</p>
</header>

<main class="${wallClass}">
  ${cards}
  ${emptyState}
</main>

<div class="footer">
  <a href="https://socialproof.dev" target="_blank" rel="noopener">
    Powered by <span class="footer-logo">SocialProof</span>
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
  <title>Widget not found — SocialProof</title>
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
    <p>This testimonial wall doesn't exist. <a href="https://socialproof.dev">Get started with SocialProof →</a></p>
  </div>
</body>
</html>`
}

// GET /wall/:widgetId/badge — embeddable SVG badge with aggregate rating
wall.get('/:widgetId/badge', async (c) => {
  const widgetId = c.req.param('widgetId')

  const cacheKey = `widget:${widgetId}:json`
  let payload: WidgetPayload | null = null

  const cached = await c.env.WIDGET_KV.get(cacheKey, 'json') as WidgetPayload | null
  if (cached) {
    payload = cached
  } else {
    const widgetRow = await c.env.DB.prepare(
      'SELECT id, account_id, name, slug, type, config FROM widgets WHERE (id = ? OR slug = ?) AND active = 1'
    ).bind(widgetId, widgetId).first<{ id: string; account_id: string; name: string; slug: string | null; type: string; config: string }>()

    if (!widgetRow) {
      return c.body('Not found', 404)
    }

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

  const { testimonials, config } = payload
  const rated = testimonials.filter(t => t.rating !== null)
  const count = testimonials.length
  const avg = rated.length > 0
    ? (rated.reduce((sum, t) => sum + (t.rating ?? 0), 0) / rated.length)
    : null

  const starsText = avg !== null ? '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg)) : '★★★★★'
  const ratingText = avg !== null ? avg.toFixed(1) : '–'
  const reviewText = `${count} review${count !== 1 ? 's' : ''}`
  const businessName = config.name || 'SocialProof'

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="56" role="img" aria-label="${businessName}: ${ratingText} stars, ${reviewText}">
  <title>${businessName}: ${ratingText} stars, ${reviewText}</title>
  <rect width="200" height="56" rx="8" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
  <text x="12" y="20" font-family="-apple-system,sans-serif" font-size="11" fill="#6b7280">${businessName}</text>
  <text x="12" y="38" font-family="-apple-system,sans-serif" font-size="16" fill="#f59e0b">${starsText}</text>
  <text x="12" y="50" font-family="-apple-system,sans-serif" font-size="10" fill="#6b7280">${ratingText} · ${reviewText}</text>
  <text x="150" y="38" font-family="-apple-system,sans-serif" font-size="9" fill="#9ca3af">SocialProof</text>
</svg>`

  return c.body(svg, 200, {
    'Content-Type': 'image/svg+xml',
    'Cache-Control': 's-maxage=300, public',
  })
})

// ── Widget Embed Preview ──────────────────────────────────────────────────────
// GET /wall/:widgetId/preview
// Returns a minimal HTML page that loads the actual widget embed script.
// Used by the dashboard iframe to show a live preview of the embed.
wall.get('/:widgetId/preview', async (c) => {
  const widgetId = c.req.param('widgetId')

  // Fetch widget config to know layout/theme
  const widgetRow = await c.env.DB.prepare(
    'SELECT id, name, slug, type, config FROM widgets WHERE (id = ? OR slug = ?) AND active = 1'
  ).bind(widgetId, widgetId).first<{ id: string; name: string; slug: string | null; type: string; config: string }>()

  if (!widgetRow) {
    return c.html(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;color:#666">Widget not found.</body></html>`, 404)
  }

  const cfg = JSON.parse(widgetRow.config || '{}') as Record<string, string>
  const layout = cfg['layout'] ?? widgetRow.type ?? 'grid'
  const isPopup = layout === 'popup'
  const WIDGET_URL = 'https://widget.socialproof.dev/v1'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Widget Preview — ${escapeHtml(widgetRow.name)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; min-height: 100vh; }
  </style>
</head>
<body>
  ${isPopup
    ? `<div data-widget-popup="${escapeHtml(widgetRow.id)}" data-popup-position="bottom-left"></div>`
    : `<div id="socialproof-widget" data-widget-id="${escapeHtml(widgetRow.id)}" data-layout="${escapeHtml(layout)}"></div>`
  }
  <script src="${WIDGET_URL}/widget.js" async></script>
</body>
</html>`

  return c.html(html, 200, {
    // Allow the dashboard to embed the preview in an iframe.
    // SAMEORIGIN would block cross-subdomain embeds (app. vs api.).
    'Content-Security-Policy': "frame-ancestors 'self' https://app.socialproof.dev",
    'Cache-Control': 'no-store',
  })
})
