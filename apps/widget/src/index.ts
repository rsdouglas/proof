import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Env = {
  WIDGET_KV: KVNamespace
  WORKER_API_URL: string
  ENVIRONMENT: string
}

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

type WidgetData = {
  testimonials: Testimonial[]
  config: {
    layout: string
    theme: string
    name: string
  }
}

const app = new Hono<{ Bindings: Env }>()

// CORS: allow all origins (embeddable everywhere)
app.use('*', cors({ origin: '*' }))

// Serve the widget JS
app.get('/v1/proof.js', async (c) => {
  const widgetJs = getWidgetScript()
  return c.text(widgetJs, 200, {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  })
})

// Serve widget data as JSON
app.get('/v1/:widgetId', async (c) => {
  const widgetId = c.req.param('widgetId')

  // Check KV cache first
  const cacheKey = `widget:${widgetId}`
  const cached = await c.env.WIDGET_KV.get(cacheKey, 'json')
  if (cached) {
    return c.json(cached, 200, {
      'Cache-Control': 's-maxage=300, public',
      'X-Cache': 'HIT',
    })
  }

  // Fetch from worker API
  try {
    const apiUrl = `${c.env.WORKER_API_URL}/w/${widgetId}`
    const res = await fetch(apiUrl)
    if (!res.ok) {
      return c.json({ error: 'Widget not found' }, 404)
    }
    const data = await res.json() as WidgetData

    // Cache for 5 minutes
    await c.env.WIDGET_KV.put(cacheKey, JSON.stringify(data), { expirationTtl: 300 })

    return c.json(data, 200, {
      'Cache-Control': 's-maxage=300, public',
      'X-Cache': 'MISS',
    })
  } catch (err) {
    return c.json({ error: 'Failed to load widget' }, 500)
  }
})

function getWidgetScript(): string {
  return `/* Vouch Widget v1 — https://socialproof.dev */
(function() {
  'use strict';

  var WIDGET_URL = 'https://widget.socialproof.dev/v1/';

  function injectStyles(theme, layout) {
    var styleId = 'proof-styles';
    if (document.getElementById(styleId)) return;
    var dark = theme === 'dark';
    var css = [
      '.proof-widget { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; box-sizing: border-box; }',
      '.proof-widget *, .proof-widget *::before, .proof-widget *::after { box-sizing: border-box; }',
      '.proof-card { border-radius: 12px; padding: 20px 24px; margin: 8px; position: relative; }',
      dark ? '.proof-card { background: #1a1a2e; color: #e2e8f0; border: 1px solid #2d3748; }' : '.proof-card { background: #fff; color: #1a202c; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }',
      '.proof-text { font-size: 15px; line-height: 1.6; margin: 0 0 16px; }',
      '.proof-author { display: flex; align-items: center; gap: 10px; }',
      '.proof-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }',
      '.proof-avatar-placeholder { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }',
      dark ? '.proof-avatar-placeholder { background: #6366f1; color: #fff; }' : '.proof-avatar-placeholder { background: #ede9fe; color: #6366f1; }',
      '.proof-name { font-weight: 600; font-size: 14px; }',
      dark ? '.proof-name { color: #f7fafc; }' : '.proof-name { color: #1a202c; }',
      '.proof-meta { font-size: 12px; }',
      dark ? '.proof-meta { color: #a0aec0; }' : '.proof-meta { color: #718096; }',
      '.proof-stars { color: #f59e0b; font-size: 13px; margin-bottom: 12px; letter-spacing: 1px; }',
      /* Grid layout */
      '.proof-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0; }',
      /* Carousel */
      '.proof-carousel-wrap { overflow: hidden; position: relative; }',
      '.proof-carousel-track { display: flex; transition: transform 0.5s ease; }',
      '.proof-carousel-track .proof-card { min-width: 300px; flex-shrink: 0; }',
      '.proof-carousel-dots { text-align: center; margin-top: 12px; }',
      '.proof-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin: 0 3px; cursor: pointer; }',
      dark ? '.proof-dot { background: #4a5568; } .proof-dot.active { background: #6366f1; }' : '.proof-dot { background: #e2e8f0; } .proof-dot.active { background: #6366f1; }',
      /* Badge */
      '.proof-badge { max-width: 420px; }',
      /* Attribution */
      '.proof-attribution { text-align: center; margin-top: 8px; font-size: 11px; }',
      dark ? '.proof-attribution { color: #4a5568; }' : '.proof-attribution { color: #cbd5e0; }',
      '.proof-attribution a { color: inherit; text-decoration: none; }',
    ].join('\\n');
    var el = document.createElement('style');
    el.id = styleId;
    el.textContent = css;
    document.head.appendChild(el);
  }

  function stars(n) {
    if (!n) return '';
    return '<div class="proof-stars">' + '★'.repeat(n) + '☆'.repeat(5 - n) + '</div>';
  }

  function avatarEl(t) {
    if (t.avatar_url) {
      return '<img class="proof-avatar" src="' + t.avatar_url + '" alt="' + t.display_name + '" loading="lazy">';
    }
    var initial = (t.display_name || '?')[0].toUpperCase();
    return '<div class="proof-avatar-placeholder">' + initial + '</div>';
  }

  function metaLine(t) {
    var parts = [];
    if (t.title) parts.push(t.title);
    if (t.company) parts.push(t.company);
    return parts.length ? '<div class="proof-meta">' + parts.join(' · ') + '</div>' : '';
  }

  function renderCard(t) {
    return [
      '<div class="proof-card">',
      stars(t.rating),
      '<p class="proof-text">\u201c' + escHtml(t.display_text) + '\u201d</p>',
      '<div class="proof-author">',
      avatarEl(t),
      '<div>',
      '<div class="proof-name">' + escHtml(t.display_name) + '</div>',
      metaLine(t),
      '</div>',
      '</div>',
      '</div>',
    ].join('');
  }

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, function(c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function renderGrid(data, el) {
    el.innerHTML = '<div class="proof-grid">' + data.testimonials.map(renderCard).join('') + '</div>' + attribution();
  }

  function renderBadge(data, el) {
    var t = data.testimonials[0];
    if (!t) { el.innerHTML = ''; return; }
    el.innerHTML = '<div class="proof-badge">' + renderCard(t) + '</div>' + attribution();
  }

  function renderCarousel(data, el) {
    var items = data.testimonials;
    var current = 0;
    var track = '<div class="proof-carousel-wrap"><div class="proof-carousel-track" id="proof-track-' + el.id + '">' + items.map(renderCard).join('') + '</div></div>';
    var dots = '<div class="proof-carousel-dots">' + items.map(function(_, i) {
      return '<span class="proof-dot' + (i === 0 ? ' active' : '') + '" data-i="' + i + '"></span>';
    }).join('') + '</div>';
    el.innerHTML = track + dots + attribution();

    var trackEl = el.querySelector('.proof-carousel-track');
    var dotEls = el.querySelectorAll('.proof-dot');
    
    function goTo(i) {
      current = (i + items.length) % items.length;
      trackEl.style.transform = 'translateX(-' + (current * 300) + 'px)';
      dotEls.forEach(function(d, j) { d.classList.toggle('active', j === current); });
    }

    dotEls.forEach(function(d) {
      d.addEventListener('click', function() { goTo(parseInt(d.dataset.i)); });
    });

    // Auto-advance every 4s
    setInterval(function() { goTo(current + 1); }, 4000);
  }

  function attribution() {
    return '<div class="proof-attribution"><a href="https://socialproof.dev" target="_blank" rel="noopener">Powered by Vouch</a></div>';
  }

  function init() {
    var divs = document.querySelectorAll('[data-widget-id]');
    divs.forEach(function(el, idx) {
      var widgetId = el.getAttribute('data-widget-id');
      var layout = el.getAttribute('data-layout') || null;
      var theme = el.getAttribute('data-theme') || null;
      if (!el.id) el.id = 'proof-widget-' + idx;
      el.classList.add('proof-widget');

      fetch(WIDGET_URL + widgetId)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var resolvedLayout = layout || (data.config && data.config.layout) || 'grid';
          var resolvedTheme = theme || (data.config && data.config.theme) || 'light';
          if (resolvedTheme === 'dark') el.setAttribute('data-theme', 'dark');
          injectStyles(resolvedTheme, resolvedLayout);

          if (!data.testimonials || data.testimonials.length === 0) {
            el.innerHTML = '';
            return;
          }

          if (resolvedLayout === 'carousel') renderCarousel(data, el);
          else if (resolvedLayout === 'badge') renderBadge(data, el);
          else renderGrid(data, el);
        })
        .catch(function() { el.innerHTML = ''; });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`
}

export default app
