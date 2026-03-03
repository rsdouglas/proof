import { useAuth } from '../lib/auth'
import { API_URL } from '../lib/auth'

export default function DemoBanner() {
  const { isDemo } = useAuth()
  if (!isDemo) return null

  return (
    <div className="demo-banner" style={{
      background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
      color: 'white',
      textAlign: 'center',
      padding: '10px 16px',
      fontSize: '14px',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
    }}>
      <span>🎉 You're viewing a live demo with sample data.</span>
      <a
        href="/login"
        style={{
          background: 'white',
          color: '#7c3aed',
          padding: '4px 14px',
          borderRadius: '20px',
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '13px',
        }}
      >
        Sign up free →
      </a>
    </div>
  )
}
