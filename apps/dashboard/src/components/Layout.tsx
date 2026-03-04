import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import DemoBanner from './DemoBanner'

const navItems = [
  { to: '/', label: '🏠 Dashboard', end: true },
  { to: '/widgets', label: '🧩 Widgets' },
  { to: '/testimonials', label: '💬 Testimonials' },
  { to: '/collect', label: '📝 Collect' },
  { to: '/analytics', label: '📊 Analytics' },
  { to: '/settings', label: '⚙️ Settings' },
  { to: '/webhooks', label: '🔗 Webhooks' },
  { to: '/api-keys', label: '🔑 API Keys' },
]

export default function Layout() {
  const { account, logout } = useAuth()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', background: '#f9fafb' }}>
      <DemoBanner />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <aside style={{ width: 220, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          {/* Logo */}
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#111827', letterSpacing: '-0.5px' }}>
              ✓ Vouch
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: '12px 0', flex: 1 }}>
            {navItems.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '9px 20px',
                  textDecoration: 'none',
                  fontSize: 14,
                  color: isActive ? '#2563eb' : '#374151',
                  background: isActive ? '#eff6ff' : 'transparent',
                  borderLeft: isActive ? '2px solid #2563eb' : '2px solid transparent',
                  fontWeight: isActive ? 500 : 400,
                })}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Account footer */}
          <div style={{ borderTop: '1px solid #f3f4f6', padding: '14px 20px' }}>
            <div style={{ fontSize: 13, color: '#111827', fontWeight: 500, marginBottom: 2 }}>
              {account?.name || 'Account'}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {account?.email}
            </div>
            <button
              onClick={logout}
              style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
            >
              Sign out →
            </button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: 32, overflowY: 'auto', minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
