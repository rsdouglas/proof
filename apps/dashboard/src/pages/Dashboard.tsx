import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi, useAuth } from '../lib/auth'

interface Stats {
  total_testimonials: number
  approved: number
  pending: number
  total_widgets: number
}

function GettingStarted({ stats }: { stats: Stats }) {
  const steps = [
    {
      done: true,
      icon: '✅',
      title: 'Create your Vouch account',
      desc: "You're in! Welcome to Vouch.",
      action: null,
    },
    {
      done: stats.total_testimonials > 0,
      icon: stats.total_testimonials > 0 ? '✅' : '🔗',
      title: 'Share your collection link',
      desc: 'Your link is ready — send it to customers right now. No setup needed.',
      action: { to: '/collect', label: 'Copy link →' },
    },
    {
      done: stats.approved > 0,
      icon: stats.approved > 0 ? '✅' : '👍',
      title: 'Approve your first testimonial',
      desc: 'When testimonials arrive, approve the ones you love to make them public.',
      action: stats.total_testimonials > 0 ? { to: '/testimonials', label: 'Review testimonials →' } : null,
    },
    {
      done: false, // Can't check embed status client-side
      icon: '🌐',
      title: 'Add a widget to your site (optional)',
      desc: 'Display approved testimonials on your website. Create a widget and paste the embed code.',
      action: { to: '/widgets', label: 'Create widget →' },
    },
  ]

  const completedCount = steps.filter(s => s.done).length

  if (completedCount >= 3) return null // Hide once most steps done

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 24, marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>🚀 Get started with Vouch</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            {completedCount} of {steps.length} steps complete
          </p>
        </div>
        <div style={{ width: 80, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${(completedCount / steps.length) * 100}%`, height: '100%', background: '#2563eb', borderRadius: 3, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {steps.map((step, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '12px 14px',
            background: step.done ? '#f0fdf4' : '#f9fafb',
            borderRadius: 8,
            border: `1px solid ${step.done ? '#bbf7d0' : '#e5e7eb'}`,
            opacity: step.done ? 0.75 : 1,
          }}>
            <span style={{ fontSize: 20, lineHeight: 1, marginTop: 2 }}>{step.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 2, textDecoration: step.done ? 'line-through' : 'none' }}>
                {step.title}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{step.desc}</div>
            </div>
            {!step.done && step.action && (
              <Link to={step.action.to} style={{
                fontSize: 13, fontWeight: 600, color: '#2563eb',
                textDecoration: 'none', whiteSpace: 'nowrap', marginTop: 2,
              }}>
                {step.action.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { account } = useAuth()
  const { request } = useApi()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<Array<{ id: string; display_name: string; display_text: string; status: string }>>([])

  useEffect(() => {
    async function load() {
      try {
        const [tData, wData] = await Promise.all([
          request('/testimonials') as Promise<{ testimonials: Array<{ id: string; display_name: string; display_text: string; status: string }> }>,
          request('/widgets') as Promise<{ widgets: unknown[] }>,
        ])
        const ts = tData.testimonials
        setRecent(ts.slice(0, 5))
        setStats({
          total_testimonials: ts.length,
          approved: ts.filter(t => t.status === 'approved').length,
          pending: ts.filter(t => t.status === 'pending').length,
          total_widgets: wData.widgets.length,
        })
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [])

  const statCards = [
    { label: 'Total testimonials', value: stats?.total_testimonials ?? '—', color: '#2563eb' },
    { label: 'Approved', value: stats?.approved ?? '—', color: '#10b981' },
    { label: 'Pending review', value: stats?.pending ?? '—', color: '#f59e0b' },
    { label: 'Widgets deployed', value: stats?.total_widgets ?? '—', color: '#8b5cf6' },
  ]

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700 }}>Welcome back, {account?.name?.split(' ')[0]} 👋</h1>
      <p style={{ margin: '0 0 32px', color: '#6b7280' }}>Here's your social proof at a glance.</p>

      {stats && <GettingStarted stats={stats} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
        <Link to="/collect" style={{ display: 'block', background: '#2563eb', color: '#fff', borderRadius: 8, padding: 20, textDecoration: 'none' }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>📝</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Collect Testimonials</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>Share a form link with your customers</div>
        </Link>
        <Link to="/widgets" style={{ display: 'block', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 8, padding: 20, textDecoration: 'none' }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>🧩</div>
          <div style={{ fontWeight: 600, marginBottom: 4, color: '#111827' }}>Embed Widgets</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Add social proof to your site</div>
        </Link>
      </div>

      {/* Recent submissions */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Recent submissions</h2>
          <Link to="/testimonials" style={{ color: '#2563eb', fontSize: 14 }}>View all →</Link>
        </div>
        {recent.length === 0 && (
          <p style={{ color: '#9ca3af', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24, textAlign: 'center' }}>
            No testimonials yet. <Link to="/collect" style={{ color: '#2563eb' }}>Share your collection form</Link> to get started.
          </p>
        )}
        {recent.map(t => (
          <div key={t.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{t.display_name}</div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>"{t.display_text}"</div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4, marginLeft: 12, whiteSpace: 'nowrap',
              background: t.status === 'approved' ? '#dcfce7' : t.status === 'rejected' ? '#fee2e2' : '#fef3c7',
              color: t.status === 'approved' ? '#166534' : t.status === 'rejected' ? '#991b1b' : '#92400e',
            }}>
              {t.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
