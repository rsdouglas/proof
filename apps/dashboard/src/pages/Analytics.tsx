import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi, useAuth } from '../lib/auth'

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

function StatCard({ label, value, sub, blurred }: { label: string; value: number; sub?: string; blurred?: boolean }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
      padding: '20px 24px', minWidth: 140,
      filter: blurred ? 'blur(6px)' : 'none',
      userSelect: blurred ? 'none' : 'auto',
      pointerEvents: blurred ? 'none' : 'auto',
    }}>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value.toLocaleString()}</div>
      {sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function ProGate() {
  const navigate = useNavigate()
  return (
    <div style={{ position: 'relative' }}>
      {/* Blurred placeholder content */}
      <div style={{ filter: 'blur(8px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.7 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 36 }}>
          {[['Impressions', 1240], ['Views', 847], ['Clicks', 312], ['Click-through rate', 37]].map(([label, val]) => (
            <StatCard key={label as string} label={label as string} value={val as number} blurred />
          ))}
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff', height: 120 }} />
      </div>

      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <div style={{ fontSize: 32 }}>📊</div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Analytics are available on Pro</h2>
        <p style={{ margin: 0, fontSize: 15, color: '#6b7280', textAlign: 'center', maxWidth: 340 }}>
          Track impressions, views, and clicks across all your widgets.
        </p>
        <button
          onClick={() => navigate('/dashboard/settings?upgrade=1')}
          style={{
            padding: '12px 28px', borderRadius: 8, border: 'none',
            background: '#6366f1', color: '#fff', cursor: 'pointer',
            fontSize: 15, fontWeight: 600, marginTop: 8,
          }}
        >
          Upgrade to Pro →
        </button>
      </div>
    </div>
  )
}

export default function Analytics() {
  const { request } = useApi()
  const { account } = useAuth()
  const navigate = useNavigate()
  const [days, setDays] = useState(30)
  const [stats, setStats] = useState<AccountStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isPro = account?.plan === 'pro'

  useEffect(() => {
    if (!isPro) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    request<AccountStats>(`/api/analytics?days=${days}`)
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => { setError('Failed to load analytics'); setLoading(false) })
  }, [days, isPro])

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
        {isPro && (
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
        )}
      </div>

      {/* Free plan gate */}
      {!isPro && <ProGate />}

      {/* Pro content */}
      {isPro && loading && <div style={{ color: '#6b7280' }}>Loading…</div>}
      {isPro && error && <div style={{ color: '#ef4444' }}>{error}</div>}

      {isPro && !loading && !error && stats && (
        <>
          {/* Zero state */}
          {stats.widgets.length === 0 && totals.impression === 0 && (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              border: '1px dashed #e5e7eb', borderRadius: 12, color: '#6b7280',
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📈</div>
              <p style={{ fontSize: 16, fontWeight: 500, color: '#374151', margin: '0 0 8px' }}>
                Your analytics will appear here once you've added Vouch to your website.
              </p>
              <p style={{ fontSize: 14, margin: '0 0 24px' }}>
                Add the embed snippet to your site to start tracking impressions and clicks.
              </p>
              <button
                onClick={() => navigate('/dashboard/widgets')}
                style={{
                  padding: '10px 24px', borderRadius: 8, border: 'none',
                  background: '#6366f1', color: '#fff', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600,
                }}
              >
                Create a widget →
              </button>
            </div>
          )}

          {/* Summary cards */}
          {totals.impression > 0 && (
            <>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 36 }}>
                <StatCard label="Impressions" value={totals.impression} sub="Widget loaded on page" />
                <StatCard label="Views" value={totals.view} sub="Widget scrolled into view" />
                <StatCard label="Clicks" value={totals.click} sub="CTA button clicked" />
                <StatCard label="Click-through rate" value={parseFloat(ctr)} sub={`${ctr}% of views`} />
              </div>

              {/* Per-widget breakdown */}
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 12 }}>By widget</h2>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
                      <th style={{ textAlign: 'left', padding: '10px 16px', color: '#6b7280', fontWeight: 500 }}>Widget</th>
                      <th style={{ textAlign: 'right', padding: '10px 16px', color: '#6b7280', fontWeight: 500 }}>Impressions</th>
                      <th style={{ textAlign: 'right', padding: '10px 16px', color: '#6b7280', fontWeight: 500 }}>Views</th>
                      <th style={{ textAlign: 'right', padding: '10px 16px', color: '#6b7280', fontWeight: 500 }}>Clicks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.widgets.map((w, i) => (
                      <tr key={w.widget_id} style={{ borderBottom: i < stats.widgets.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                        <td style={{ padding: '12px 16px', color: '#111827', fontWeight: 500 }}>{w.widget_name}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#374151' }}>{w.impression.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#374151' }}>{w.view.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#374151' }}>{w.click.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
