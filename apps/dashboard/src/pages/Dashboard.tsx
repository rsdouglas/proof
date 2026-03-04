import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApi, useAuth } from '../lib/auth'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.socialproof.dev'

interface Stats {
  total_testimonials: number
  approved: number
  pending: number
  total_widgets: number
}

interface ZeroStateBannerProps {
  collectUrl: string
}

function ZeroStateBanner({ collectUrl }: ZeroStateBannerProps) {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(collectUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const steps = [
    { label: 'Share your link', done: false },
    { label: 'Get first testimonial', done: false },
    { label: 'Approve it', done: false },
    { label: 'Embed widget', done: false },
  ]

  return (
    <div style={{
      background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
      border: '1.5px solid #bfdbfe',
      borderRadius: 12,
      padding: '28px 32px',
      marginBottom: 32,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#1e3a8a' }}>
            🚀 You're one link away from your first testimonial
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: '#3b82f6' }}>
            Send this link to your customers — they fill a short form, you approve it, done.
          </p>
        </div>
      </div>

      {/* Collection URL — the main action */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'center',
        background: '#fff',
        border: '1px solid #93c5fd',
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <span style={{
          flex: 1,
          fontSize: 14,
          color: '#1d4ed8',
          fontFamily: 'monospace',
          wordBreak: 'break-all',
          fontWeight: 500,
        }}>
          {collectUrl}
        </span>
        <button
          onClick={copyLink}
          style={{
            padding: '9px 20px',
            background: copied ? '#16a34a' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'background 0.2s',
            letterSpacing: '-0.01em',
          }}
        >
          {copied ? '✓ Copied!' : 'Copy link'}
        </button>
      </div>

      {/* Progress steps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 28, height: 28,
                borderRadius: '50%',
                background: step.done ? '#16a34a' : '#e0e7ff',
                border: `2px solid ${step.done ? '#16a34a' : '#93c5fd'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: step.done ? '#fff' : '#6b7280',
                fontWeight: 700,
                marginBottom: 6,
              }}>
                {step.done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                height: 2,
                width: 32,
                background: '#c7d2fe',
                marginBottom: 22,
                flexShrink: 0,
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Secondary link */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <a
          href={collectUrl}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}
        >
          Preview form ↗
        </a>
        <span style={{ color: '#d1d5db', margin: '0 8px' }}>·</span>
        <Link to="/collect" style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}>
          More options →
        </Link>
      </div>
    </div>
  )
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
      done: false,
      icon: '🌐',
      title: 'Add a widget to your site (optional)',
      desc: 'Display approved testimonials on your website. Create a widget and paste the embed code.',
      action: { to: '/widgets', label: 'Create widget →' },
    },
  ]

  const completedCount = steps.filter(s => s.done).length

  if (completedCount >= 3) return null

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
  const [collectFormId, setCollectFormId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [tData, wData, fData] = await Promise.all([
        request('/testimonials') as Promise<{ testimonials: Array<{ id: string; display_name: string; display_text: string; status: string }> }>,
        request('/widgets') as Promise<{ widgets: unknown[] }>,
        request('/collection-forms') as Promise<{ forms: Array<{ id: string }> }>,
      ])
      const ts = tData.testimonials
      setRecent(ts.slice(0, 5))
      setStats({
        total_testimonials: ts.length,
        approved: ts.filter(t => t.status === 'approved').length,
        pending: ts.filter(t => t.status === 'pending').length,
        total_widgets: wData.widgets.length,
      })
      if (fData.forms?.[0]) {
        setCollectFormId(fData.forms[0].id)
      }
    } catch (e) {
      console.error(e)
      // Show 0s instead of — on error so users don't think it's broken
      setStats({ total_testimonials: 0, approved: 0, pending: 0, total_widgets: 0 })
    }
  }, [])

  useEffect(() => { load() }, [load])

  const statCards = [
    { label: 'Total testimonials', value: stats !== null ? stats.total_testimonials : '—', color: '#2563eb' },
    { label: 'Approved', value: stats !== null ? stats.approved : '—', color: '#10b981' },
    { label: 'Pending review', value: stats !== null ? stats.pending : '—', color: '#f59e0b' },
    { label: 'Widgets deployed', value: stats !== null ? stats.total_widgets : '—', color: '#8b5cf6' },
  ]

  const isZeroState = stats !== null && stats.total_testimonials === 0
  const collectUrl = collectFormId ? `https://socialproof.dev/c/${collectFormId}` : ''

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700 }}>
        {isZeroState ? 'Welcome' : 'Welcome back'}, {account?.name} 👋
      </h1>
      <p style={{ margin: '0 0 32px', color: '#6b7280' }}>
        {isZeroState ? 'Let\'s collect your first testimonial.' : 'Here\'s your social proof at a glance.'}
      </p>

      {/* Zero-state: show big prominent banner with collection URL */}
      {isZeroState && collectUrl && (
        <ZeroStateBanner collectUrl={collectUrl} />
      )}

      {/* Non-zero-state or loading: show getting started checklist */}
      {stats && !isZeroState && <GettingStarted stats={stats} />}

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
            No testimonials yet. <Link to="/collect" style={{ color: '#2563eb' }}>Share your collection link</Link> to get started.
          </p>
        )}
        {recent.map(t => (
          <div key={t.id} style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
            padding: '14px 18px', marginBottom: 8,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{t.display_name}</div>
              <div style={{ fontSize: 13, color: '#6b7280', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.display_text}
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
              background: t.status === 'approved' ? '#dcfce7' : '#fef9c3',
              color: t.status === 'approved' ? '#15803d' : '#a16207',
            }}>
              {t.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
