import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'

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
    display: 'block', width: '100%', padding: '10px 12px',
    border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 12,
    fontSize: 14, boxSizing: 'border-box', outline: 'none',
    fontFamily: 'inherit',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 40, width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Vouch</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
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
            placeholder="Password" required style={{ ...inputStyle, marginBottom: 20 }}
          />

          {error && (
            <p style={{ color: '#ef4444', fontSize: 13, margin: '-8px 0 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, padding: '8px 12px' }}>
             {error}
            </p>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '11px', background: '#2563eb',
            color: '#fff', border: 'none', borderRadius: 6, fontSize: 15,
            fontWeight: 600, cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.7 : 1, fontFamily: 'inherit',
          }}>
            {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>


        {mode === 'login' && (
          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#6b7280' }}>
            <Link to="/forgot-password" style={{ color: '#6b7280', textDecoration: 'none' }}>
              Forgot your password?
            </Link>
          </p>
        )}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6b7280' }}>
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', padding: 0 }}
          >
            {mode === 'login' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>
        {/* Forgot password */}
        {mode === 'login' && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <a href="/forgot-password" style={{ fontSize: 13, color: '#6374af', textDecoration: 'none' }}>
              Forgot password?
            </a>
          </div>
        )}

        {/* Demo link */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <a href="/demo" style={{
            fontSize: 13, color: '#763aed', textDecoration: 'none',
            fontWeight: 500,
          }}>
            ✓ Try live demo →
          </a>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13 }}>
          {mode === 'login' ? (
            <>
              <span style={{ color: '#6b7280' }}>Don't have an account? </span>
              <a href="#" onClick={e => { e.preventDefault(); setMode('signup') }}
style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Sign up</a>
            </>
          ) : (
            <>
              <span style={{ color: '#6b7280' }}>Already have an account? </span>
              <a href="#" onClick={e => { e.preventDefault(); setMode('login') }}
style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Sign in</a>
            </>
          )}
        </div>      </div>
    </div>
  )
}
