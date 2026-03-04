import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Demo() {
  const { loginDemo } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loginDemo()
      .then(() => navigate('/'))
      .catch((e) => setError(e.message))
  }, [])

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: '-apple-system,sans-serif' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '16px 24px', color: '#b91c1c', maxWidth: 400, textAlign: 'center' }}>
          <strong>Demo unavailable</strong>
          <p style={{ margin: '8px 0 0', fontSize: 14 }}>{error}</p>
          <a href="/" style={{ marginTop: 12, display: 'inline-block', color: '#2563eb' }}>← Go home</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: '-apple-system,sans-serif', background: '#f9fafb' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Loading demo…</div>
        <div style={{ fontSize: 14, color: '#6b7280' }}>Filling in sample data for you</div>
      </div>
    </div>
  )
}
