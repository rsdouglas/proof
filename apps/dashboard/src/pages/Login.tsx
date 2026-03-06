import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { colors, font, radius, shadow } from '../design'

export default function Login() {
  const { login, signup, token } = useAuth()
  const [params] = useSearchParams()
  const [mode, setMode] = useState<'login' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (token) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        if (!name.trim()) throw new Error('Name is required')
        if (password.length < 8) throw new Error('Password must be at least 8 characters')
        await signup(email, password, name)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    display: 'block', width: '100%', padding: '10px 14px',
    border: `1px solid ${colors.gray200}`, borderRadius: radius.md, marginBottom: 12,
    fontSize: 14, boxSizing: 'border-box', outline: 'none',
    fontFamily: font.sans, color: colors.gray900,
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: colors.gray50,
      fontFamily: font.sans,
    }}>
      <div style={{
        background: colors.white,
        border: `1px solid ${colors.gray200}`,
        borderRadius: radius.xl,
        padding: 40,
        width: '100%', maxWidth: 380,
        boxShadow: shadow.lg,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, borderRadius: radius.md,
            background: colors.brand,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: colors.gray900, letterSpacing: '-0.3px' }}>
            SocialProof
          </h1>
          <p style={{ margin: 0, color: colors.gray500, fontSize: 14 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your free account'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Your name" required style={inputStyle}
            />
          )}
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email address" required style={inputStyle}
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" required style={{ ...inputStyle, marginBottom: error ? 12 : 20 }}
          />

          {error && (
            <p style={{
              color: colors.danger, fontSize: 13, margin: '0 0 16px',
              background: colors.dangerLight, border: `1px solid ${colors.dangerBorder}`,
              borderRadius: radius.md, padding: '8px 12px',
            }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 11,
            background: loading ? colors.gray400 : colors.brand,
            color: colors.white, border: 'none',
            borderRadius: radius.md, fontSize: 15,
            fontWeight: 600, cursor: loading ? 'default' : 'pointer',
            fontFamily: font.sans, transition: 'background 0.15s',
          }}>
            {loading ? 'Loading…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {mode === 'login' && (
          <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: colors.gray500 }}>
            <Link to="/forgot-password" style={{ color: colors.gray500, textDecoration: 'none' }}>
              Forgot your password?
            </Link>
          </p>
        )}
        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: colors.gray500 }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError('') }}
            style={{ background: 'none', border: 'none', color: colors.brand, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: font.sans, padding: 0 }}
          >
            {mode === 'login' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
