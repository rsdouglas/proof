import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { C, spacing, radius, btn, fontSize } from '../design'

const API = import.meta.env.VITE_API_URL || ''

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: 'Reset failed' }))
        throw new Error(d.error || 'Reset failed')
      }
      navigate('/login?reset=1')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: C.gray[50], padding: spacing[4],
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: C.danger.text, fontSize: fontSize.sm }}>Invalid or expired reset link.</p>
          <Link to="/forgot-password" style={{ color: C.brand[600], fontSize: fontSize.sm }}>Request a new one →</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: C.gray[50], padding: spacing[4],
    }}>
      <div style={{
        width: '100%', maxWidth: 400, background: '#fff', borderRadius: radius.xl,
        padding: `${spacing[8]} ${spacing[7]}`, boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: spacing[7] }}>
          <div style={{
            width: 44, height: 44, background: `linear-gradient(135deg, ${C.brand[500]}, ${C.brand[700]})`,
            borderRadius: radius.lg, margin: `0 auto ${spacing[4]}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>V</span>
          </div>
          <h1 style={{ margin: 0, fontSize: fontSize.lg, fontWeight: 700, color: C.gray[900] }}>Set new password</h1>
          <p style={{ margin: `${spacing[2]} 0 0`, fontSize: fontSize.sm, color: C.gray[500] }}>
            Choose a strong password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: `${spacing[3]} ${spacing[4]}`, background: C.danger.bg,
              border: `1px solid ${C.danger.border}`, borderRadius: radius.md,
              color: C.danger.text, fontSize: fontSize.sm, marginBottom: spacing[4],
            }}>
              {error}
            </div>
          )}
          <label style={{ fontSize: fontSize.sm, fontWeight: 600, color: C.gray[700], display: 'block', marginBottom: spacing[1] }}>
            New password
          </label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Min 8 characters" required
            style={{
              width: '100%', padding: `${spacing[3]} ${spacing[4]}`,
              border: `1px solid ${C.gray[200]}`, borderRadius: radius.md,
              fontSize: fontSize.sm, outline: 'none', boxSizing: 'border-box', marginBottom: spacing[4],
            }}
          />
          <label style={{ fontSize: fontSize.sm, fontWeight: 600, color: C.gray[700], display: 'block', marginBottom: spacing[1] }}>
            Confirm password
          </label>
          <input
            type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat password" required
            style={{
              width: '100%', padding: `${spacing[3]} ${spacing[4]}`,
              border: `1px solid ${C.gray[200]}`, borderRadius: radius.md,
              fontSize: fontSize.sm, outline: 'none', boxSizing: 'border-box', marginBottom: spacing[4],
            }}
          />
          <button type="submit" disabled={loading} style={{ ...btn.primary, width: '100%', justifyContent: 'center' }}>
            {loading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  )
}
