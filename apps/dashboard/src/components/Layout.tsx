import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import DemoBanner from './DemoBanner'
import {
  LayoutDashboard,
  Layers,
  MessageSquare,
  Share2,
  BarChart2,
  Settings,
  Webhook,
  KeyRound,
  CheckCircle2,
  LogOut,
} from 'lucide-react'
import { colors, font, shadow } from '../design'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/widgets', label: 'Widgets', icon: Layers },
  { to: '/testimonials', label: 'Testimonials', icon: MessageSquare },
  { to: '/collect', label: 'Collect', icon: Share2 },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/webhooks', label: 'Webhooks', icon: Webhook },
  { to: '/api-keys', label: 'API Keys', icon: KeyRound },
]

export default function Layout() {
  const { account, logout } = useAuth()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      fontFamily: font.sans,
      background: colors.gray50,
    }}>
      <DemoBanner />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <aside style={{
          width: 232,
          background: colors.white,
          borderRight: `1px solid ${colors.gray200}`,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          boxShadow: shadow.sm,
        }}>
          {/* Logo */}
          <div style={{
            padding: '20px 20px 18px',
            borderBottom: `1px solid ${colors.gray100}`,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 800,
              fontSize: 17,
              color: colors.gray900,
              letterSpacing: '-0.5px',
            }}>
              <CheckCircle2 size={20} color={colors.brand} strokeWidth={2.5} />
              SocialProof
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: '8px 0', flex: 1 }}>
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 16px',
                  margin: '1px 8px',
                  textDecoration: 'none',
                  fontSize: 14,
                  color: isActive ? colors.brand : colors.gray600,
                  background: isActive ? colors.brandLight : 'transparent',
                  borderRadius: '8px',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'background 0.1s, color 0.1s',
                })}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      color={isActive ? colors.brand : colors.gray400}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Account footer */}
          <div style={{
            borderTop: `1px solid ${colors.gray100}`,
            padding: '14px 16px',
          }}>
            <div style={{
              fontSize: 13,
              color: colors.gray900,
              fontWeight: 600,
              marginBottom: 2,
            }}>
              {account?.name || 'Account'}
            </div>
            <div style={{
              fontSize: 12,
              color: colors.gray400,
              marginBottom: 12,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {account?.email}
            </div>
            <button
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: colors.gray400,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontFamily: font.sans,
              }}
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main style={{
          flex: 1,
          padding: '36px 40px',
          overflowY: 'auto',
          minWidth: 0,
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
