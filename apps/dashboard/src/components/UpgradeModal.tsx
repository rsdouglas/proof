import { useNavigate } from 'react-router-dom'
import type { PlanLimitError } from '../lib/auth'

interface Props {
  error: PlanLimitError
  onClose: () => void
}

const LIMIT_LABELS: Record<string, string> = {
  testimonials: 'testimonials',
  widgets: 'widgets',
}

export default function UpgradeModal({ error, onClose }: Props) {
  const navigate = useNavigate()
  const label = LIMIT_LABELS[error.limit] || error.limit

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, padding: '40px 36px',
          maxWidth: 420, width: '90%', textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>
          You've hit the limit
        </h2>
        <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.6, margin: '0 0 8px' }}>
          Your Free plan supports {error.max} {label}.
        </p>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 28px' }}>
          {error.current} / {error.max} {label} used
        </p>
        <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.6, margin: '0 0 28px' }}>
          Go Pro for <strong>$9/mo</strong> and get unlimited {label}, analytics,
          custom branding, and Google star ratings.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px', borderRadius: 8, border: '1px solid #e5e7eb',
              background: '#fff', color: '#374151', cursor: 'pointer', fontSize: 14,
            }}
          >
            Maybe later
          </button>
          <button
            onClick={() => { onClose(); navigate('/dashboard/settings?upgrade=1') }}
            style={{
              padding: '10px 24px', borderRadius: 8, border: 'none',
              background: '#6366f1', color: '#fff', cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
            }}
          >
            Upgrade to Pro — $9/mo →
          </button>
        </div>
      </div>
    </div>
  )
}
