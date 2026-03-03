import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { API_URL, useAuth } from '../lib/auth'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()
  const { setAccount } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const inputStyle: React.CSSProperties = {
    display: 'block', width: '100%', padding: '10px 12px',
    border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 12,
    fontSize: 14, boxSizing: 'border-box', outline: 'none',
    fontFamily: 'inherit',
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json() as { ok?: boolean; token?: string; error?: string }
      if (!res.ok) throw new Error(data.error || 'Reset failed')
      if (data.token) {
        // Store token and redirect to dashboard
        localStorage.setItem('proof_token', data.token)
        // Fetch account info
        const meRes = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${data.token}` },
          credentials: 'include',
        })
        if (meRes.ok) {
          const me = await meRes.json() as { account: Parameters<typeof setAccount>[0] }
          setAccount(me.account)
          localStorage.setItem('proof_account', JSON.stringify(me.account))
        }
        navigate('/', { replace: true })
      } else {
        setDone(true)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#ef4444', marginBottom: 16 }}>Invalid reset link.</p>
          <Link to="/forgot-password" style={{ color: '#2563eb' }}>Request a new one →</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 40, width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Vouch</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>Choose a new password</p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <p style={{ color: '#374151', fontSize: 15, marginBottom: 24 }}>Password updated! You can now sign in.</p>
            <Link to="/login" style={{ color: '#2563eb', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>
              Sign in →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="New password (8+ chars)" required minLength={8} style={inputStyle}
            />
            <input
              type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Confirm new password" required style={{ ...inputStyle, marginBottom: 20 }}
            />

            {error && (
              <p style={{ color: '#ef4444', fontSize: 13, margin: '-8px 0 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, padding: '8px 10px' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} style={{
              display: 'block', width: '100%', padding: '11px', background: '#2563eb', color: '#fff',
              border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, fontFamily: 'inherit',
            }}>
              {loading ? 'Updating…' : 'Set new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
