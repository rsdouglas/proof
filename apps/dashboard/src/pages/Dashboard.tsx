import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApi, useAuth } from '../lib/auth'
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Layers,
  Share2,
  ArrowRight,
  Copy,
  Check,
  AlertTriangle,
  Bell,
  PartyPopper,
  Code2,
} from 'lucide-react'
import { colors, font, shadow, radius, card } from '../design'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.socialproof.dev'

interface Stats {
  total_testimonials: number
  approved: number
  pending: number
  total_widgets: number
}


function EmbedNudgeBanner({ approvedCount }: { approvedCount: number }) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('embed_nudge_dismissed') === '1'
  )
  if (dismissed) return null

  function dismiss() {
    localStorage.setItem('embed_nudge_dismissed', '1')
    setDismissed(true)
  }

  return (
    <div style={{
      background: '#f0f9ff',
      border: '1.5px solid #7dd3fc',
      borderRadius: radius.lg,
      padding: '20px 24px',
      marginBottom: 28,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
    }}>
      <Code2 size={20} color="#0369a1" style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0c4a6e', marginBottom: 4 }}>
          Your testimonials aren't on your site yet
        </div>
        <div style={{ fontSize: 13, color: '#0369a1', lineHeight: 1.5, marginBottom: 14 }}>
          You have {approvedCount} approved testimonial{approvedCount > 1 ? 's' : ''}.
          Add them to your site in 2 minutes.
        </div>
        <Link
          to="/widgets"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: '#0369a1',
            color: '#fff',
            borderRadius: radius.md,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            fontFamily: font.sans,
          }}
        >
          Get embed code →
        </Link>
      </div>
      <button
        onClick={dismiss}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 18, color: '#7dd3fc', flexShrink: 0,
          lineHeight: 1, padding: 0,
        }}
        aria-label="Dismiss"
      >×</button>
    </div>
  )
}

function ZeroStateBanner({ collectUrl }: { collectUrl: string }) {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(collectUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const steps = [
    'Share your link',
    'Get first testimonial',
    'Approve it',
    'Embed widget',
  ]

  return (
    <div style={{
      background: `linear-gradient(135deg, ${colors.brandLight} 0%, #f0fdf4 100%)`,
      border: `1.5px solid ${colors.brandBorder}`,
      borderRadius: radius.lg,
      padding: '28px 32px',
      marginBottom: 32,
    }}>
      <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#1e3a8a' }}>
        You're one link away from your first testimonial
      </h2>
      <p style={{ margin: '0 0 20px', fontSize: 14, color: colors.brand }}>
        Send this link to customers — they fill a short form, you approve it, done.
      </p>

      {/* Collection URL */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'center',
        background: colors.white,
        border: `1px solid ${colors.brandBorder}`,
        borderRadius: radius.md,
        padding: '10px 16px',
        marginBottom: 20,
        boxShadow: shadow.sm,
      }}>
        <span style={{
          flex: 1, fontSize: 14, color: '#1d4ed8',
          fontFamily: font.mono, wordBreak: 'break-all', fontWeight: 500,
        }}>
          {collectUrl}
        </span>
        <button
          onClick={copyLink}
          style={{
            padding: '8px 16px',
            background: copied ? colors.success : colors.brand,
            color: colors.white,
            border: 'none',
            borderRadius: radius.md,
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: font.sans,
          }}
        >
          {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy link</>}
        </button>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: colors.brandLight,
                border: `2px solid ${colors.brandBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: colors.brand, fontWeight: 700, marginBottom: 6,
              }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 11, color: colors.gray500, fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 24, height: 2, background: colors.brandBorder, flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${colors.brandBorder}`, display: 'flex', gap: 20 }}>
        <Link to="/collect" style={{ fontSize: 13, color: colors.brand, textDecoration: 'none', fontWeight: 500 }}>
          View collect page →
        </Link>
        <Link to="/widgets" style={{ fontSize: 13, color: colors.gray500, textDecoration: 'none' }}>
          Create a widget
        </Link>
      </div>
    </div>
  )
}


function NudgeBanner({ collectUrl }: { collectUrl: string }) {
  const [dismissed, setDismissed] = useState(false)
  const [copied, setCopied] = useState(false)

  if (dismissed) return null

  function copyLink() {
    navigator.clipboard.writeText(collectUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div style={{
      background: '#fffbeb',
      border: '1.5px solid #fbbf24',
      borderRadius: radius.lg,
      padding: '20px 24px',
      marginBottom: 28,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
    }}>
      <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#92400e', marginBottom: 4 }}>
          Still waiting for your first testimonial
        </div>
        <div style={{ fontSize: 13, color: '#b45309', lineHeight: 1.5, marginBottom: 14 }}>
          You signed up over 24 hours ago but haven't received a testimonial yet.
          The most common reason? The link never got sent.{' '}
          <strong>Right now, think of 3 happy customers</strong> and send them this link:
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            flex: 1, fontSize: 13, color: '#1d4ed8',
            fontFamily: 'monospace', background: '#fff',
            border: '1px solid #fbbf24', borderRadius: radius.md,
            padding: '8px 12px', fontWeight: 500,
          }}>
            {collectUrl}
          </span>
          <button
            onClick={copyLink}
            style={{
              padding: '8px 16px',
              background: copied ? '#16a34a' : '#d97706',
              color: '#fff',
              border: 'none',
              borderRadius: radius.md,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: font.sans,
            }}
          >
            {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy link</>}
          </button>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 18, color: '#d97706', flexShrink: 0,
          lineHeight: 1, padding: 0,
        }}
        aria-label="Dismiss"
      >×</button>
    </div>
  )
}


function PendingApprovalBanner({ count, firstTime }: { count: number; firstTime: boolean }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const isFirst = firstTime // no approved yet — this is their first

  return (
    <div style={{
      background: isFirst ? '#f0fdf4' : '#eff6ff',
      border: `1.5px solid ${isFirst ? '#86efac' : '#bfdbfe'}`,
      borderRadius: radius.lg,
      padding: '20px 24px',
      marginBottom: 28,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
    }}>
      {isFirst
        ? <PartyPopper size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
        : <Bell size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
      }
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: isFirst ? '#14532d' : '#1e3a8a', marginBottom: 4 }}>
          {isFirst
            ? '🎉 Your first testimonial is waiting!'
            : `${count} testimonial${count > 1 ? 's' : ''} waiting for review`
          }
        </div>
        <div style={{ fontSize: 13, color: isFirst ? '#166534' : '#1d4ed8', lineHeight: 1.5, marginBottom: 12 }}>
          {isFirst
            ? 'A customer submitted a testimonial — approve it to make it public and start building social proof.'
            : `You have ${count} pending testimonial${count > 1 ? 's' : ''} to review. Approve the ones you love to display them.`
          }
        </div>
        <Link
          to="/testimonials"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px',
            background: isFirst ? '#16a34a' : '#2563eb',
            color: '#fff',
            borderRadius: radius.md,
            fontWeight: 600,
            fontSize: 13,
            textDecoration: 'none',
            fontFamily: font.sans,
          }}
        >
          {isFirst ? 'Approve now' : 'Review testimonials'}
          <ArrowRight size={13} />
        </Link>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 18, color: isFirst ? '#16a34a' : '#2563eb', flexShrink: 0,
          lineHeight: 1, padding: 0,
        }}
        aria-label="Dismiss"
      >×</button>
    </div>
  )
}

function OnboardingChecklist({ stats }: { stats: Stats }) {
  const steps = [
    {
      done: true,
      title: 'Create your SocialProof account',
      desc: "You're in! Welcome to SocialProof.",
      action: null,
    },
    {
      done: stats.total_testimonials > 0,
      title: 'Share your collection link',
      desc: 'Your link is ready — send it to customers right now. No setup needed.',
      action: { to: '/collect', label: 'Copy link' },
    },
    {
      done: stats.approved > 0,
      title: 'Approve your first testimonial',
      desc: 'When testimonials arrive, approve the ones you love to make them public.',
      action: stats.total_testimonials > 0 ? { to: '/testimonials', label: 'Review testimonials' } : null,
    },
    {
      done: false,
      title: 'Add a widget to your site',
      desc: 'Display approved testimonials on your website. Create a widget and paste the embed code.',
      action: { to: '/widgets', label: 'Create widget' },
    },
  ]

  const completedCount = steps.filter(s => s.done).length
  if (completedCount >= 3) return null

  return (
    <div style={{ ...card, marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: colors.gray900 }}>
            Get started with SocialProof
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: colors.gray400 }}>
            {completedCount} of {steps.length} steps complete
          </p>
        </div>
        <div style={{ width: 100, height: 5, background: colors.gray100, borderRadius: radius.full, overflow: 'hidden' }}>
          <div style={{
            width: `${(completedCount / steps.length) * 100}%`,
            height: '100%',
            background: colors.brand,
            borderRadius: radius.full,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((step, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 14px',
            background: step.done ? colors.successLight : colors.gray50,
            borderRadius: radius.md,
            border: `1px solid ${step.done ? colors.successBorder : colors.gray100}`,
          }}>
            <div style={{ flexShrink: 0 }}>
              {step.done
                ? <CheckCircle2 size={18} color={colors.success} />
                : <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: `2px solid ${colors.gray300}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: colors.gray400, fontWeight: 700,
                  }}>{i + 1}</div>
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: 600, fontSize: 14,
                color: step.done ? colors.gray400 : colors.gray900,
                textDecoration: step.done ? 'line-through' : 'none',
                marginBottom: 2,
              }}>
                {step.title}
              </div>
              <div style={{ fontSize: 13, color: colors.gray400 }}>{step.desc}</div>
            </div>
            {!step.done && step.action && (
              <Link to={step.action.to} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 13, fontWeight: 600, color: colors.brand,
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                {step.action.label}
                <ArrowRight size={13} />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const statCards = (stats: Stats) => [
  {
    label: 'Total testimonials',
    value: stats.total_testimonials,
    icon: MessageSquare,
  },
  {
    label: 'Approved',
    value: stats.approved,
    icon: CheckCircle2,
  },
  {
    label: 'Pending review',
    value: stats.pending,
    icon: Clock,
  },
  {
    label: 'Widgets deployed',
    value: stats.total_widgets,
    icon: Layers,
  },
]

export default function Dashboard() {
  const { account } = useAuth()
  const { request } = useApi()
  const [stats, setStats] = useState<Stats>({ total_testimonials: 0, approved: 0, pending: 0, total_widgets: 0 })
  const [recent, setRecent] = useState<Array<{ id: string; display_name: string; display_text: string; status: string }>>([])
  const [collectFormId, setCollectFormId] = useState<string | null>(null)
  const [accountCreatedAt, setAccountCreatedAt] = useState<string | null>(null)
  const [widgets, setWidgets] = useState<Array<{ id: string; created_at: string; embed_verified_at?: string | null }> | null>(null)

  const load = useCallback(async () => {
    const [statsRes, tRes, wRes, fRes, meRes] = await Promise.allSettled([
      request('/stats') as Promise<{ testimonials: number; widgets: number; pending: number; approved: number }>,
      request('/testimonials?limit=5') as Promise<{ testimonials: Array<{ id: string; display_name: string; display_text: string; status: string }> }>,
      request('/widgets') as Promise<{ widgets: Array<{ id: string; created_at: string; embed_verified_at?: string | null }> }>,
      request('/collection-forms') as Promise<{ forms: Array<{ id: string }> }>,
      request('/accounts/me') as Promise<{ account: { created_at: string } }>,
    ])
    const st = statsRes.status === 'fulfilled' ? statsRes.value : null
    const ts = tRes.status === 'fulfilled' ? (tRes.value.testimonials || []) : []
    const ws = wRes.status === 'fulfilled' ? (wRes.value.widgets || []) : []
    const fs = fRes.status === 'fulfilled' ? (fRes.value.forms || []) : []
    const me = meRes.status === 'fulfilled' ? meRes.value : null
    setRecent(ts.slice(0, 5))
    setStats({
      total_testimonials: st?.testimonials ?? ts.length ?? 0,
      approved: st?.approved ?? ts.filter((t) => t.status === 'approved').length ?? 0,
      pending: st?.pending ?? ts.filter((t) => t.status === 'pending').length ?? 0,
      total_widgets: st?.widgets ?? ws.length ?? 0,
    })
    setWidgets(ws)
    if (fs.length > 0) setCollectFormId(fs[0].id)
    if (me?.account?.created_at) setAccountCreatedAt(me.account.created_at)
  }, [])

  useEffect(() => { load() }, [load])

  const collectUrl = collectFormId
    ? `https://socialproof.dev/c/${collectFormId}`
    : ''

  const isZeroState = stats.total_testimonials === 0 && !!collectFormId
  const is24hNudge = isZeroState && accountCreatedAt !== null &&
    (Date.now() - new Date(accountCreatedAt).getTime() > 24 * 60 * 60 * 1000)
  const hasPending = stats.pending > 0
  const isFirstPending = hasPending && stats!.approved === 0

  // Embed nudge: has approved testimonials, has widgets, but none are embed-verified, and it's been 48h since account creation
  const hasApproved = stats.approved > 0
  const hasWidgets = widgets !== null && widgets.length > 0
  const allWidgetsUnverified = hasWidgets && widgets!.every(w => !w.embed_verified_at)
  const isOldEnough = accountCreatedAt !== null &&
    (Date.now() - new Date(accountCreatedAt).getTime() > 48 * 60 * 60 * 1000)
  const isEmbedNudge = hasApproved && hasWidgets && allWidgetsUnverified && isOldEnough && !isZeroState

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: colors.gray900, letterSpacing: '-0.5px' }}>
          Dashboard
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: colors.gray400 }}>
          Welcome back{account?.name ? `, ${account.name}` : ''}.
        </p>
      </div>

      {/* Zero state / 24h nudge banner */}
      {is24hNudge && <NudgeBanner collectUrl={collectUrl} />}
      {isZeroState && !is24hNudge && <ZeroStateBanner collectUrl={collectUrl} />}
      {hasPending && <PendingApprovalBanner count={stats!.pending} firstTime={isFirstPending} />}
      {isEmbedNudge && <EmbedNudgeBanner approvedCount={stats!.approved} />}

      {/* Stat cards — all use same design language */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {statCards(stats).map(({ label, value, icon: Icon }) => (
          <div key={label} style={{
            background: colors.white,
            border: `1px solid ${colors.gray200}`,
            borderRadius: radius.lg,
            padding: '20px 20px 18px',
            boxShadow: shadow.sm,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Icon size={16} color={colors.gray400} />
              <span style={{ fontSize: 12, color: colors.gray400, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
              </span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: colors.gray900, letterSpacing: '-1px', lineHeight: 1 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Onboarding checklist */}
      {<OnboardingChecklist stats={stats} />}

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <Link to="/collect" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: colors.brand,
          color: colors.white,
          borderRadius: radius.lg,
          padding: '20px 24px',
          textDecoration: 'none',
          boxShadow: shadow.md,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Collect Testimonials</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Share your collection link</div>
          </div>
          <Share2 size={24} style={{ opacity: 0.7 }} />
        </Link>

        <Link to="/widgets" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: colors.white,
          color: colors.gray900,
          border: `1px solid ${colors.gray200}`,
          borderRadius: radius.lg,
          padding: '20px 24px',
          textDecoration: 'none',
          boxShadow: shadow.sm,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: colors.gray900 }}>Embed Widgets</div>
            <div style={{ fontSize: 13, color: colors.gray400 }}>Add social proof to your site</div>
          </div>
          <Layers size={24} color={colors.gray300} />
        </Link>
      </div>

      {/* Recent testimonials */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.gray900 }}>Recent Testimonials</h2>
          <Link to="/testimonials" style={{ color: colors.brand, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
            View all →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '32px 0',
            color: colors.gray400, fontSize: 14,
          }}>
            No testimonials yet.{' '}
            <Link to="/collect" style={{ color: colors.brand, textDecoration: 'none', fontWeight: 500 }}>
              Share your collection link
            </Link>{' '}
            to get started.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recent.map((t, i) => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '14px 0',
                borderTop: i > 0 ? `1px solid ${colors.gray100}` : 'none',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: colors.brandLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: colors.brand,
                  flexShrink: 0,
                }}>
                  {t.display_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: colors.gray900, marginBottom: 3 }}>
                    {t.display_name}
                  </div>
                  <div style={{
                    fontSize: 13, color: colors.gray500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {t.display_text}
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: radius.full,
                  background: t.status === 'approved' ? colors.successLight : t.status === 'rejected' ? colors.dangerLight : colors.gray100,
                  color: t.status === 'approved' ? colors.success : t.status === 'rejected' ? colors.danger : colors.gray500,
                  flexShrink: 0,
                }}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
