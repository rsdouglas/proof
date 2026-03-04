import { useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../lib/auth'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const inputStyle: React.CSSProperties = {
    display: 'block', width: '100%', padding: '10px 12px',
    border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 12,
    fontSize: 14, boxSizing: 'border-box', outline: 'none',
    fontFamily: 'inherit',
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setSent(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 40, width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Vouch</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>Reset your password</p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
            <p style={{ color: '#374151', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
              Check your inbox — if that email is in our system, we sent you a reset link. It expires in 1 hour.
            </p>
            <Link to="/login" style={{ color: '#2563eb', fontSize: 14, textDecoration: 'none' }}>
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
              Enter your email and we'll send you a link to reset your password.
            </p>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email address" required style={inputStyle}
            />

            {error && (
              <p style={{ color: '#ef4444', fontSize: 13, margin: '-4px 0 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, padding: '8px 10px' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} style={{
              display: 'block', width: '100%', padding: '11px', background: '#2563eb', color: '#fff',
              border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, fontFamily: 'inherit',
            }}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6b7280' }}>
              Remember it? <Link to="/login" style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
