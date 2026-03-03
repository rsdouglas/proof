import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const NAV = [
  { to: '/', label: '🏠 Dashboard' },
  { to: '/testimonials', label: '💬 Testimonials' },
  { to: '/widgets', label: '🧩 Widgets' },
  { to: '/collect', label: '📝 Collect' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { account, logout } = useAuth()
  const { pathname } = useLocation()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: '#1e293b', color: '#e2e8f0', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #334155' }}>
          <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>✓ Proof</Link>
        </div>
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV.map(n => (
            <Link key={n.to} to={n.to} style={{
              display: 'block', padding: '10px 20px', color: '#e2e8f0', textDecoration: 'none',
              background: pathname === n.to ? '#334155' : 'transparent',
              borderLeft: pathname === n.to ? '3px solid #3b82f6' : '3px solid transparent',
              fontSize: 14,
            }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #334155' }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{account?.email}</div>
          <button onClick={logout} style={{
            background: 'none', border: '1px solid #475569', color: '#94a3b8',
            padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12
          }}>Sign out</button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '32px', background: '#f9fafb', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
