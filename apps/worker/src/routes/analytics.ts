/**
 * Analytics routes — track widget events (impressions, views, clicks)
 * and query stats for the dashboard.
 *
 * Public write endpoints: no auth (called from embedded widget)
 * Private read endpoints: JWT auth required (dashboard)
 */

import { Hono } from 'hono'
import type { Env, Variables } from '../index'

export const analytics = new Hono<{ Bindings: Env; Variables: Variables }>()

// ── Public: record an event ──────────────────────────────────────────────────
// POST /api/track/:widgetId  { event_type: 'impression' | 'view' | 'click' }
analytics.post('/track/:widgetId', async (c) => {
  const widgetId = c.req.param('widgetId')
  // sendBeacon sends text/plain; also accept application/json
  let body: { event_type: string } | null = null
  try {
    const ct = c.req.header('content-type') ?? ''
    if (ct.includes('text/plain')) {
      const text = await c.req.text()
      body = JSON.parse(text)
    } else {
      body = await c.req.json<{ event_type: string }>()
    }
  } catch { body = null }

  const validTypes = ['impression', 'view', 'click']
  if (!body || !validTypes.includes(body.event_type)) {
    return c.json({ error: 'Invalid event_type' }, 400)
  }

  // Country from Cloudflare header (no IP storage)
  const country = c.req.header('CF-IPCountry') ?? null

  // Verify widget exists (lightweight check)
  const widget = await c.env.DB.prepare(
    'SELECT id FROM widgets WHERE id = ? AND active = 1'
  ).bind(widgetId).first<{ id: string }>()
  if (!widget) return c.json({ error: 'Widget not found' }, 404)

  const now = Math.floor(Date.now() / 1000)
  await c.env.DB.prepare(
    'INSERT INTO widget_events (widget_id, event_type, country, created_at) VALUES (?, ?, ?, ?)'
  ).bind(widgetId, body.event_type, country, now).run()

  return c.json({ ok: true })
})

// ── Private: get stats for a widget ─────────────────────────────────────────
// GET /api/analytics/:widgetId?days=30
// Auth: JWT required — enforced by middleware in index.ts
analytics.get('/:widgetId', async (c) => {
  const accountId = c.get('accountId')
  const plan = c.get('plan')
  const widgetId = c.req.param('widgetId')

  // Verify ownership
  const widget = await c.env.DB.prepare(
    'SELECT id FROM widgets WHERE id = ? AND account_id = ?'
  ).bind(widgetId, accountId).first<{ id: string }>()
  if (!widget) return c.json({ error: 'Not found' }, 404)

  // Free plan: 30-day limit. Pro: allow up to 365 days.
  const requestedDays = Math.min(parseInt(c.req.query('days') || '30'), plan === 'pro' ? 365 : 30)
  const since = Math.floor(Date.now() / 1000) - (requestedDays * 86400)

  // Aggregate counts by event type
  const { results: totals } = await c.env.DB.prepare(
    `SELECT event_type, COUNT(*) as count
     FROM widget_events
     WHERE widget_id = ? AND created_at >= ?
     GROUP BY event_type`
  ).bind(widgetId, since).all<{ event_type: string; count: number }>()

  const counts = { impression: 0, view: 0, click: 0 }
  for (const row of totals) {
    if (row.event_type in counts) counts[row.event_type as keyof typeof counts] = row.count
  }

  // Daily breakdown for sparkline (last 30 days, or requestedDays if ≤ 30)
  const chartDays = Math.min(requestedDays, 30)
  const chartSince = Math.floor(Date.now() / 1000) - (chartDays * 86400)
  const { results: daily } = await c.env.DB.prepare(
    `SELECT
       strftime('%Y-%m-%d', datetime(created_at, 'unixepoch')) as date,
       event_type,
       COUNT(*) as count
     FROM widget_events
     WHERE widget_id = ? AND created_at >= ?
     GROUP BY date, event_type
     ORDER BY date ASC`
  ).bind(widgetId, chartSince).all<{ date: string; event_type: string; count: number }>()

  // Structure for the chart: array of { date, impression, view, click }
  const dayMap: Record<string, { date: string; impression: number; view: number; click: number }> = {}
  for (const row of daily) {
    if (!dayMap[row.date]) dayMap[row.date] = { date: row.date, impression: 0, view: 0, click: 0 }
    if (row.event_type in dayMap[row.date]) {
      const entry = dayMap[row.date] as unknown as Record<string, unknown>; entry[row.event_type] = row.count
    }
  }

  // Top countries (nice to have)
  const { results: countries } = await c.env.DB.prepare(
    `SELECT country, COUNT(*) as count
     FROM widget_events
     WHERE widget_id = ? AND created_at >= ? AND country IS NOT NULL AND country != 'XX'
     GROUP BY country
     ORDER BY count DESC
     LIMIT 5`
  ).bind(widgetId, since).all<{ country: string; count: number }>()

  return c.json({
    widget_id: widgetId,
    days: requestedDays,
    totals: counts,
    daily: Object.values(dayMap),
    countries,
  })
})

// ── Private: account-level stats (all widgets) ───────────────────────────────
// GET /api/analytics?days=30
analytics.get('/', async (c) => {
  const accountId = c.get('accountId')
  const plan = c.get('plan')
  const requestedDays = Math.min(parseInt(c.req.query('days') || '30'), plan === 'pro' ? 365 : 30)
  const since = Math.floor(Date.now() / 1000) - (requestedDays * 86400)

  const { results } = await c.env.DB.prepare(
    `SELECT we.widget_id, w.name as widget_name, we.event_type, COUNT(*) as count
     FROM widget_events we
     JOIN widgets w ON w.id = we.widget_id
     WHERE w.account_id = ? AND we.created_at >= ?
     GROUP BY we.widget_id, we.event_type`
  ).bind(accountId, since).all<{ widget_id: string; widget_name: string; event_type: string; count: number }>()

  // Group by widget
  const byWidget: Record<string, { widget_id: string; widget_name: string; impression: number; view: number; click: number }> = {}
  for (const row of results) {
    if (!byWidget[row.widget_id]) {
      byWidget[row.widget_id] = { widget_id: row.widget_id, widget_name: row.widget_name, impression: 0, view: 0, click: 0 }
    }
    if (row.event_type in byWidget[row.widget_id]) {
      byWidget[row.widget_id][row.event_type as 'impression' | 'view' | 'click'] = row.count
    }
  }

  return c.json({ days: requestedDays, widgets: Object.values(byWidget) })
})
