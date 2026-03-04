import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApi, useAuth } from '../lib/auth'

interface Stats {
  total_testimonials: number
  approved: number
  pending: number
  total_widgets: number
}

const API_URL = import.meta.env.VITE_API_URL || 'https://api.socialproof.dev'

function ZeroStatePrompt({ collectUrl }: { collectUrl: string }) {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(collectUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
      border: '1px solid #bfdbfe',
      borderRadius: 12,
      padding: 28,
      marginBottom: 32,
    }}>
      <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#111827' }}>
        Share your link. Collect your first testimonial.
      </h2>
      <p style={{ margin: '0 0 20px', color: '#4b5563', fontSize: 14, lineHeight: 1.6 }}>
        Copy the link below and send it to a customer. They fill out a short form — no account needed.
      </p>

      {/* URL block */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center',
        background: '#fff', border: '1px solid #dbeafe',
        borderRadius: 8, padding: '12px 16px',
        marginBottom: copied ? 6 : 20,
      }}>
        <span style={{
          flex: 1, fontSize: 14, color: '#1e40af',
          fontFamily: 'monospace', wordBreak: 'break-all',
        }}>
          {collectUrl}
        </span>
        <button
          onClick={copyLink}
          aria-label="Copy your collection link"
          style={{
            background: copied ? '#10b981' : '#2563eb',
            color: '#fff', border: 'none', borderRadius: 6,
            padding: '8px 16px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            transition: 'background 0.2s ease',
          }}
        >
          {copied ? '✓ Copied!' : 'Copy link'}
        </button>
        <a
          href={collectUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb',
            borderRadius: 6, padding: '8px 12px', fontSize: 13, fontWeight: 500,
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}
        >
          Preview ↗
        </a>
      </div>

      {/* Copy feedback */}
      {copied && (
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#059669', fontWeight: 500 }}>
          ✓ Link copied — now paste it into an email, DM, or text message.
        </p>
      )}

      {/* Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: 'Share your link with a customer', hint: null },
          { label: 'Wait for their response', hint: "We'll email you when it arrives" },
          { label: 'Approve the testimonial', hint: null },
          { label: 'Embed the widget on your site', hint: 'Optional, but powerful' },
        ].map((step, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            fontSize: 13, color: '#374151',
          }}>
            <span style={{ color: '#9ca3af', marginTop: 1 }}>☐</span>
            <span>
              <span style={{ fontWeight: 500 }}>{step.label}</span>
              {step.hint && (
                <span style={{ color: '#9ca3af', marginLeft: 6 }}>— {step.hint}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FirstTestimonialBanner() {
  return (
    <div style={{
      background: '#f0fdf4', border: '1px solid #bbf7d0',
      borderRadius: 10, padding: '16px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 32,
    }}>
      <div>
        <span style={{ fontSize: 20, marginRight: 8 }}>🎉</span>
        <span style={{ fontWeight: 600, color: '#111827', fontSize: 15 }}>
          You have your first testimonial.
        </span>
        <span style={{ color: '#6b7280', fontSize: 14, marginLeft: 8 }}>
          Now embed the widget on your site.
        </span>
      </div>
      <Link to="/widgets" style={{
        background: '#10b981', color: '#fff', textDecoration: 'none',
        borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600,
        whiteSpace: 'nowrap',
      }}>
        View widgets →
      </Link>
    </div>
  )
}

function GettingStarted({ stats, collectUrl }: { stats: Stats; collectUrl: string }) {
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
      action: { to: '/collect', label: 'Manage link →' },
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

  // Zero state: show full activation prompt instead of checklist
  if (stats.total_testimonials === 0 && collectUrl) {
    return <ZeroStatePrompt collectUrl={collectUrl} />
  }

  // Has testimonials but none approved yet: show compact checklist
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
  const [collectUrl, setCollectUrl] = useState<string>('')

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
      const form = fData.forms?.[0]
      if (form) {
        setCollectUrl(`${API_URL}/submit/${form.id}`)
      }
    } catch (e) {
      console.error(e)
    }
  }, [request])

  useEffect(() => { load() }, [load])

  const isZeroState = stats !== null && stats.total_testimonials === 0
  const hasFirstApproved = stats !== null && stats.approved === 1 && stats.total_testimonials === 1

  const statCards = [
    { label: 'Total testimonials', value: stats !== null ? stats.total_testimonials : '—', color: '#2563eb' },
    { label: 'Approved', value: stats !== null ? stats.approved : '—', color: '#10b981' },
    { label: 'Pending review', value: stats !== null ? stats.pending : '—', color: '#f59e0b' },
    { label: 'Widgets deployed', value: stats !== null ? stats.total_widgets : '—', color: '#8b5cf6' },
  ]

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700 }}>
        {isZeroState ? 'Welcome' : 'Welcome back'}, {account?.name} 👋
      </h1>
      <p style={{ margin: '0 0 32px', color: '#6b7280' }}>
        {isZeroState ? 'Let\'s get your first testimonial.' : 'Here\'s your social proof at a glance.'}
      </p>

      {stats && <GettingStarted stats={stats} collectUrl={collectUrl} />}

      {hasFirstApproved && <FirstTestimonialBanner />}

      {/* Hide stat cards in zero state to avoid wall-of-dashes */}
      {!isZeroState && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
          {statCards.map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

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
              <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{t.display_name}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2, maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.display_text}
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 12,
              background: t.status === 'approved' ? '#dcfce7' : '#fef3c7',
              color: t.status === 'approved' ? '#166534' : '#92400e',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {t.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
