import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { login, register, token } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
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
        if (password.length < 8) throw new Error('Password must be at least 8 characters')
        await register(email, password, name)
      }
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
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Proof</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>Social proof for your business</p>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required
              style={{ display: 'block', width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 12, fontSize: 14, boxSizing: 'border-box' }} />
          )}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required
            style={{ display: 'block', width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 12, fontSize: 14, boxSizing: 'border-box' }} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required
            style={{ display: 'block', width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 16, fontSize: 14, boxSizing: 'border-box' }} />

          {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}

          <button type="submit" disabled={loading} style={{
            display: 'block', width: '100%', padding: '10px', background: '#2563eb', color: '#fff',
            border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6b7280' }}>
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 14 }}>
            {mode === 'login' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
