import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi, useAuth } from '../lib/auth'
import { Eye, MousePointerClick, BarChart2, Layers, TrendingUp, Zap, type LucideIcon } from 'lucide-react'
import { colors, radius, shadow, font, btn, card, fontSize } from '../design'

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

function StatCard({ label, value, sub, icon: Icon }: {
  label: string
  value: number | string
  sub?: string
  icon?: LucideIcon
}) {
  return (
    <div style={{
      ...card,
      flex: '1 1 140px',
      minWidth: 140,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {Icon && <Icon size={14} color={colors.gray400} />}
        <span style={{ fontSize: 12, color: colors.gray400, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: colors.gray900, lineHeight: 1, letterSpacing: '-1px' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {sub && <div style={{ fontSize: 12, color: colors.gray400, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function ProGate() {
  const navigate = useNavigate()
  const features = [
    { label: 'Widget impressions', icon: Eye },
    { label: 'View-through rate', icon: TrendingUp },
    { label: 'CTA click tracking', icon: MousePointerClick },
    { label: 'Per-widget breakdown', icon: Layers },
  ]
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 16, padding: '80px 20px',
      border: `1.5px dashed ${colors.gray200}`, borderRadius: radius.xl,
      background: colors.gray50, textAlign: 'center',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: radius.xl,
        background: colors.brandLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <BarChart2 size={26} color={colors.brand} />
      </div>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: colors.gray900, letterSpacing: '-0.5px' }}>
        Analytics are available on Pro
      </h2>
      <p style={{ margin: 0, fontSize: 14, color: colors.gray500, maxWidth: 380, lineHeight: 1.6 }}>
        Track impressions, views, and click-through rates across all your widgets.
        See exactly which testimonials drive engagement.
      </p>
      <div style={{
        display: 'flex', gap: 20, marginTop: 8, padding: '16px 24px',
        background: colors.white, border: `1px solid ${colors.gray200}`,
        borderRadius: radius.lg, flexWrap: 'wrap', justifyContent: 'center',
        boxShadow: shadow.sm,
      }}>
        {features.map(({ label, icon: Icon }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: colors.gray700 }}>
            <Icon size={14} color={colors.brand} />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate('/dashboard/settings?upgrade=1')}
        style={{ ...btn.primary, padding: '12px 28px', fontSize: 15, marginTop: 8 }}
      >
        <Zap size={16} /> Upgrade to Pro →
      </button>
      <p style={{ margin: 0, fontSize: 13, color: colors.gray400 }}>$9/mo · cancel anytime</p>
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

  const ctr = totals.view > 0
    ? ((totals.click / totals.view) * 100).toFixed(1)
    : '0.0'

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: colors.gray900, letterSpacing: '-0.5px' }}>
            Analytics
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: colors.gray400 }}>
            Widget performance over the last {days} days
          </p>
        </div>

        {/* Day range picker — only show when pro */}
        {isPro && (
          <div style={{ display: 'flex', gap: 4, background: colors.gray100, borderRadius: radius.md, padding: 3 }}>
            {DAYS_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                style={{
                  padding: '5px 14px',
                  borderRadius: radius.sm,
                  border: 'none',
                  background: days === d ? colors.white : 'transparent',
                  boxShadow: days === d ? shadow.sm : 'none',
                  color: days === d ? colors.gray900 : colors.gray500,
                  cursor: 'pointer',
                  fontFamily: font.sans,
                  fontWeight: days === d ? 600 : 400,
                  fontSize: 13,
                  transition: 'all 0.1s',
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
      {isPro && loading && (
        <div style={{ color: colors.gray400, fontSize: 14 }}>Loading…</div>
      )}
      {isPro && error && (
        <div style={{ color: colors.danger, fontSize: 14 }}>{error}</div>
      )}

      {isPro && !loading && !error && stats && (
        <>
          {/* Zero state */}
          {stats.widgets.length === 0 && totals.impression === 0 && (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              border: `1.5px dashed ${colors.gray200}`, borderRadius: radius.xl,
              color: colors.gray500, background: colors.gray50,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: radius.xl,
                background: colors.brandLight, margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TrendingUp size={24} color={colors.brand} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: colors.gray800, margin: '0 0 8px' }}>
                Your analytics will appear here once you've added SocialProof to your website.
              </p>
              <p style={{ fontSize: 14, margin: '0 0 24px', color: colors.gray500 }}>
                Add the embed snippet to your site to start tracking impressions and clicks.
              </p>
              <button
                onClick={() => navigate('/dashboard/widgets')}
                style={btn.primary}
              >
                <Layers size={14} /> Create a widget →
              </button>
            </div>
          )}

          {/* Summary cards */}
          {totals.impression > 0 && (
            <>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
                <StatCard label="Impressions" value={totals.impression} sub="Widget loaded on page" icon={Eye} />
                <StatCard label="Views" value={totals.view} sub="Widget scrolled into view" icon={TrendingUp} />
                <StatCard label="Clicks" value={totals.click} sub="CTA button clicked" icon={MousePointerClick} />
                <StatCard label="Click-through rate" value={`${ctr}%`} sub={`of ${totals.view.toLocaleString()} views`} icon={BarChart2} />
              </div>

              {/* Per-widget breakdown */}
              <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.gray700, marginBottom: 12 }}>By widget</h2>
              <div style={{ border: `1px solid ${colors.gray200}`, borderRadius: radius.lg, overflow: 'hidden', background: colors.white, boxShadow: shadow.sm }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.gray100}`, background: colors.gray50 }}>
                      <th style={{ textAlign: 'left', padding: '10px 16px', color: colors.gray400, fontWeight: 500, fontSize: 12 }}>Widget</th>
                      <th style={{ textAlign: 'right', padding: '10px 16px', color: colors.gray400, fontWeight: 500, fontSize: 12 }}>Impressions</th>
                      <th style={{ textAlign: 'right', padding: '10px 16px', color: colors.gray400, fontWeight: 500, fontSize: 12 }}>Views</th>
                      <th style={{ textAlign: 'right', padding: '10px 16px', color: colors.gray400, fontWeight: 500, fontSize: 12 }}>Clicks</th>
                      <th style={{ textAlign: 'right', padding: '10px 16px', color: colors.gray400, fontWeight: 500, fontSize: 12 }}>CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.widgets.map((w, i) => {
                      const wCtr = w.view > 0 ? ((w.click / w.view) * 100).toFixed(1) : '0.0'
                      return (
                        <tr key={w.widget_id} style={{ borderBottom: i < stats.widgets.length - 1 ? `1px solid ${colors.gray100}` : 'none' }}>
                          <td style={{ padding: '10px 16px', color: colors.gray900, fontWeight: 500 }}>{w.widget_name || 'Untitled'}</td>
                          <td style={{ padding: '10px 16px', color: colors.gray700, textAlign: 'right' }}>{w.impression.toLocaleString()}</td>
                          <td style={{ padding: '10px 16px', color: colors.gray700, textAlign: 'right' }}>{w.view.toLocaleString()}</td>
                          <td style={{ padding: '10px 16px', color: colors.gray700, textAlign: 'right' }}>{w.click.toLocaleString()}</td>
                          <td style={{ padding: '10px 16px', color: colors.gray700, textAlign: 'right' }}>{wCtr}%</td>
                        </tr>
                      )
                    })}
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
