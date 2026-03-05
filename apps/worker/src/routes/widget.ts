import { Hono } from 'hono'
import type { Env } from '../index'

export const widget = new Hono<{ Bindings: Env }>()

// Public: serve widget data as JSON for the embeddable widget
// GET /w/:widgetId — returns { testimonials: [...], config: { layout, theme, name } }
widget.get('/:widgetId', async (c) => {
  const widgetId = c.req.param('widgetId')

  // Try KV cache first
  const cacheKey = `widget:${widgetId}:json`
  const cached = await c.env.WIDGET_KV.get(cacheKey, 'json')
  if (cached) {
    return c.json(cached, 200, {
      'Cache-Control': 's-maxage=300, public',
      'X-Cache': 'HIT',
    })
  }

  // Fetch widget row
  const widgetRow = await c.env.DB.prepare(
    'SELECT id, account_id, name, slug, type, config FROM widgets WHERE (id = ? OR slug = ?) AND active = 1'
  ).bind(widgetId, widgetId).first<{ id: string; account_id: string; name: string; slug: string | null; type: string; config: string }>()

  if (!widgetRow) {
    return c.json({ error: 'Widget not found' }, 404)
  }

  // Fetch approved testimonials
  const { results } = await c.env.DB.prepare(
    `SELECT id, display_name, display_text, rating, company, title, avatar_url, created_at
     FROM testimonials
     WHERE account_id = ? AND status = 'approved'
     ORDER BY featured DESC, created_at DESC
     LIMIT 50`
  ).bind(widgetRow.account_id).all<{
    id: string
    display_name: string
    display_text: string
    rating: number | null
    company: string | null
    title: string | null
    avatar_url: string | null
    created_at: string
  }>()

  const widgetConfig = JSON.parse(widgetRow.config || '{}') as Record<string, string>

  const payload = {
    testimonials: results,
    config: {
      layout: widgetConfig['layout'] ?? widgetRow.type ?? 'grid',
      theme: widgetConfig['theme'] ?? 'light',
      name: widgetRow.name,
    },
  }

  // Cache for 5 minutes
  await c.env.WIDGET_KV.put(cacheKey, JSON.stringify(payload), { expirationTtl: 300 })

  return c.json(payload, 200, {
    'Cache-Control': 's-maxage=300, public',
    'X-Cache': 'MISS',
  })
})

// Public: serve popup data — recent testimonials for the notification popup
// GET /w/:widgetId/popup — returns { testimonials: [...], config: {...} }
widget.get('/:widgetId/popup', async (c) => {
  const widgetId = c.req.param('widgetId')

  const cacheKey = `widget:${widgetId}:popup`
  const cached = await c.env.WIDGET_KV.get(cacheKey, 'json')
  if (cached) {
    return c.json(cached, 200, { 'Cache-Control': 's-maxage=120, public', 'X-Cache': 'HIT' })
  }

  const widgetRow = await c.env.DB.prepare(
    'SELECT id, account_id, name, slug, type, config FROM widgets WHERE (id = ? OR slug = ?) AND active = 1'
  ).bind(widgetId, widgetId).first<{ id: string; account_id: string; name: string; slug: string | null; type: string; config: string }>()

  if (!widgetRow) {
    return c.json({ error: 'Widget not found' }, 404)
  }

  // Only allow popup-type widgets
  const widgetConfig = JSON.parse(widgetRow.config || '{}') as Record<string, string>
  if (widgetRow.type !== 'popup' && widgetConfig['layout'] !== 'popup') {
    return c.json({ error: 'Not a popup widget' }, 400)
  }

  // Fetch recent approved testimonials (limit 10 for rotation)
  const { results } = await c.env.DB.prepare(
    `SELECT id, display_name, display_text, rating, company, title, created_at
     FROM testimonials
     WHERE account_id = ? AND status = 'approved'
     ORDER BY created_at DESC
     LIMIT 10`
  ).bind(widgetRow.account_id).all<{
    id: string
    display_name: string
    display_text: string
    rating: number | null
    company: string | null
    title: string | null
    created_at: string
  }>()

  const payload = {
    testimonials: results,
    config: {
      theme: widgetConfig['theme'] ?? 'light',
      position: widgetConfig['position'] ?? 'bottom-left',
      name: widgetRow.name,
    },
  }

  await c.env.WIDGET_KV.put(cacheKey, JSON.stringify(payload), { expirationTtl: 120 })

  return c.json(payload, 200, {
    'Cache-Control': 's-maxage=120, public',
    'X-Cache': 'MISS',
  })
})
