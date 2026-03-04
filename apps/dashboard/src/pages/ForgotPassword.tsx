import { useState } from 'react'
import { Link } from 'react-router-dom'
import { C, spacing, radius, btn, fontSize } from '../design'

const API = import.meta.env.VITE_API_URL || ''

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(d.error || 'Request failed')
      }
      setSent(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: C.gray[50],
      padding: spacing[4],
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: '#fff',
        borderRadius: radius.xl,
        padding: `${spacing[8]} ${spacing[7]}`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: spacing[7] }}>
          <div style={{
            width: 44, height: 44,
            background: `linear-gradient(135deg, ${C.brand[500]}, ${C.brand[700]})`,
            borderRadius: radius.lg,
            margin: `0 auto ${spacing[4]}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>V</span>
          </div>
          <h1 style={{ margin: 0, fontSize: fontSize.lg, fontWeight: 700, color: C.gray[900] }}>Reset your password</h1>
          <p style={{ margin: `${spacing[2]} 0 0`, fontSize: fontSize.sm, color: C.gray[500] }}>
            Enter your email and we'll send a reset link.
          </p>
        </div>

        {sent ? (
          <div style={{
            padding: `${spacing[4]} ${spacing[5]}`,
            background: C.success.bg,
            border: `1px solid ${C.success.border}`,
            borderRadius: radius.md,
            color: C.success.text,
            fontSize: fontSize.sm,
            textAlign: 'center',
          }}>
            ✓ If that email is in our system, you'll receive a reset link shortly.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                padding: `${spacing[3]} ${spacing[4]}`,
                background: C.danger.bg,
                border: `1px solid ${C.danger.border}`,
                borderRadius: radius.md,
                color: C.danger.text,
                fontSize: fontSize.sm,
                marginBottom: spacing[4],
              }}>
                {error}
              </div>
            )}
            <label style={{ fontSize: fontSize.sm, fontWeight: 600, color: C.gray[700], display: 'block', marginBottom: spacing[1] }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%',
                padding: `${spacing[3]} ${spacing[4]}`,
                border: `1px solid ${C.gray[200]}`,
                borderRadius: radius.md,
                fontSize: fontSize.sm,
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: spacing[4],
              }}
            />
            <button type="submit" disabled={loading} style={{ ...btn.primary, width: '100%', justifyContent: 'center' }}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: spacing[5], fontSize: fontSize.sm, color: C.gray[500] }}>
          <Link to="/login" style={{ color: C.brand[600], textDecoration: 'none', fontWeight: 600 }}>← Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
