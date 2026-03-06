import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function WelcomePro() {
  const navigate = useNavigate()
  const { account } = useAuth()

  useEffect(() => {
    // Auto-redirect to widgets after 8 seconds if user doesn't click
    const timer = setTimeout(() => navigate('/dashboard/widgets'), 8000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f0ff 0%, #fafafa 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '40px 20px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 24,
        padding: '56px 48px',
        maxWidth: 520,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 4px 40px rgba(0,0,0,0.08)',
      }}>
        {/* Celebration icon */}
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>

        {/* Headline */}
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          color: '#111827',
          margin: '0 0 12px',
          letterSpacing: '-0.5px',
        }}>
          You're on Pro.
        </h1>

        {/* Subhead */}
        <p style={{
          fontSize: 17,
          color: '#6b7280',
          lineHeight: 1.6,
          margin: '0 0 36px',
        }}>
          {account?.name ? `Welcome, ${account.name.split(' ')[0]}. ` : ''}
          Your account has been upgraded. Everything is ready to go.
        </p>

        {/* What unlocked */}
        <div style={{
          background: '#f9fafb',
          borderRadius: 16,
          padding: '24px 28px',
          marginBottom: 36,
          textAlign: 'left',
        }}>
          <p style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: '0 0 16px',
          }}>
            What's now unlocked
          </p>
          {[
            ['✦', 'Unlimited widgets', 'Create as many widgets as you need'],
            ['✦', 'Unlimited testimonials', 'No cap on how many you collect'],
            ['✦', 'Analytics', 'See which testimonials drive the most clicks'],
            ['✦', 'Custom branding', 'Remove the "Powered by SocialProof" badge'],
            ['✦', 'Google rich results', 'Star ratings in your search listings'],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{
              display: 'flex',
              gap: 14,
              marginBottom: 14,
              alignItems: 'flex-start',
            }}>
              <span style={{ color: '#6366f1', fontSize: 14, marginTop: 2, flexShrink: 0 }}>{icon}</span>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{title}</span>
                <span style={{ fontSize: 13, color: '#9ca3af' }}> — {desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => navigate('/dashboard/widgets/new')}
          style={{
            display: 'block',
            width: '100%',
            padding: '14px 24px',
            borderRadius: 12,
            border: 'none',
            background: '#111827',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 12,
            letterSpacing: '-0.2px',
          }}
        >
          Create your next widget →
        </button>

        {/* Secondary CTA */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'block',
            width: '100%',
            padding: '12px 24px',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            background: '#fff',
            color: '#374151',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Go to dashboard
        </button>

        <p style={{
          fontSize: 12,
          color: '#d1d5db',
          marginTop: 24,
          marginBottom: 0,
        }}>
          Questions? Reply to your confirmation email or reach us at team@vouch.run
        </p>
      </div>
    </div>
  )
}
