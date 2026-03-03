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
        <Link to="/widgets" style={{ display: 'block', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 8, padding: 20, textDecoration: 'none' }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>🧩</div>
          <div style={{ fontWeight: 600, marginBottom: 4, color: '#111827' }}>Embed Widgets</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Add social proof to your site</div>
        </Link>
      </div>

      {recent.length > 0 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Recent testimonials</h2>
          {recent.map(t => (
            <div key={t.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{t.display_name}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{t.display_text}"</div>
              </div>
              <span style={{
                background: t.status === 'approved' ? '#dcfce7' : '#fef3c0',
                color: t.status === 'approved' ? '#166534' : '#92400e',
                padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500
              }}>{t.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
