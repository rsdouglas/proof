import { useEffect, useState } from 'react'
import { useApi } from '../lib/auth'

interface WidgetStats {
  widget_id: string
  widget_name: string
  impression: number
  view: number
  click: number
}

interface AccountStats {
  days: number
  widgets: WidgetStats[]
}

const DAYS_OPTIONS = [7, 30, 90]

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
      padding: '20px 24px', minWidth: 140,
    }}>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value.toLocaleString()}</div>
      {sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export default function Analytics() {
  const { request } = useApi()
  const [days, setDays] = useState(30)
  const [stats, setStats] = useState<AccountStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    request<AccountStats>(`/api/analytics?days=${days}`)
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => { setError('Failed to load analytics'); setLoading(false) })
  }, [days])

  const totals = stats?.widgets.reduce(
    (acc, w) => ({
      impression: acc.impression + w.impression,
      view: acc.view + w.view,
      click: acc.click + w.click,
    }),
    { impression: 0, view: 0, click: 0 }
  ) ?? { impression: 0, view: 0, click: 0 }

  const ctr = totals.view > 0 ? ((totals.click / totals.view) * 100).toFixed(1) : '0.0'

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>Analytics</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {DAYS_OPTIONS.map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: '6px 16px', borderRadius: 20, border: '1px solid #e5e7eb',
                background: days === d ? '#6C5CE7' : '#fff',
                color: days === d ? '#fff' : '#374151',
                cursor: 'pointer', fontWeight: 500, fontSize: 13,
              }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading && <div style={{ color: '#6b7280' }}>Loading…</div>}
      {error && <div style={{ color: '#ef4444' }}>{error}</div>}

      {stats && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 36 }}>
            <StatCard label="Impressions" value={totals.impression} sub="Widget loaded on page" />
            <StatCard label="Views" value={totals.view} sub="Widget scrolled into view" />
            <StatCard label="Clicks" value={totals.click} sub="CTA button clicked" />
            <StatCard label="Click-through rate" value={parseFloat(ctr)} sub={`${ctr}% of views`} />
          </div>

          {/* Per-widget breakdown */}
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 12 }}>By widget</h2>
          {stats.widgets.length === 0 ? (
            <div style={{ color: '#9ca3af', fontSize: 14, padding: '24px 0' }}>
              No events yet. Add the embed snippet to your site to start tracking.
            </div>
          ) : (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '10px 16px', color: '#6b7280', fontWeight: 500 }}>Widget</th>
                    <th style={{ textAlign: 'right', padding: '10px 16px', color: '#6b7280', fontWeight: 500 }}>Impressions</th>
                    <th style={{ textAlign: 'right', padding: '10px 16px', color: '#6b7280', fontWeight: 500 }}>Views</th>
                    <th style={{ textAlign: 'right', padding: '10px 16px', color: '#6b7280', fontWeight: 500 }}>Clicks</th>
                    <th style={{ textAlign: 'right', padding: '10px 16px', color: '#6b7280', fontWeight: 500 }}>CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.widgets.map((w, i) => {
                    const widgetCtr = w.view > 0 ? ((w.click / w.view) * 100).toFixed(1) : '—'
                    return (
                      <tr key={w.widget_id} style={{ borderBottom: i < stats.widgets.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 500, color: '#111827' }}>{w.widget_name}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#374151' }}>{w.impression.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#374151' }}>{w.view.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#374151' }}>{w.click.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#6b7280' }}>{widgetCtr}{widgetCtr !== '—' ? '%' : ''}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Embed reminder */}
          <div style={{
            marginTop: 32, padding: '16px 20px', background: '#f5f3ff',
            border: '1px solid #ede9fe', borderRadius: 12, fontSize: 13, color: '#6C5CE7',
          }}>
            <strong>Tracking is automatic</strong> — the embed snippet reports impressions, views, and clicks.
            No additional setup needed. Events appear here within minutes.
          </div>
        </>
      )}
    </div>
  )
}
