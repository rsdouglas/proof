import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi, useAuth } from '../lib/auth'

interface Stats {
  total_testimonials: number
  approved: number
  pending: number
  total_widgets: number
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
        <Link to="/widgets" style={{ display: 'block', background: '#8b5cf6', color: '#fff', borderRadius: 8, padding: 20, textDecoration: 'none' }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>🧩</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Embed a Widget</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>Add testimonials to your website</div>
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
            No testimonials yet. <Link to="/collect">Create a collection form</Link> to get started.
          </p>
        )}
        {recent.map(t => (
          <div key={t.id} style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 8,
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
          }}>
            <div>
              <strong>{t.display_name}</strong>
              <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>{t.display_text.slice(0, 100)}{t.display_text.length > 100 ? '…' : ''}</p>
            </div>
            <span style={{
              padding: '2px 8px', borderRadius: 4, fontSize: 12, marginLeft: 12, flexShrink: 0,
              background: t.status === 'approved' ? '#d1fae5' : t.status === 'rejected' ? '#fee2e2' : '#fef3c7',
              color: t.status === 'approved' ? '#065f46' : t.status === 'rejected' ? '#991b1b' : '#92400e'
            }}>
              {t.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
