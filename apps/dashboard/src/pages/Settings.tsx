import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useApi } from '../lib/auth'

export default function Settings() {
  const { account, setAccount, logout } = useAuth()
  const { request } = useApi()
  const [name, setName] = useState(account?.name || '')
  const [email, setEmail] = useState(account?.email || '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      const data = await request<{ account: { id: string; email: string; name: string; plan: string } }>('/accounts/me', {
        method: 'PATCH',
        body: JSON.stringify({ name, email }),
      })
      setAccount(data.account)
      setMsg({ type: 'ok', text: 'Profile updated.' })
    } catch (e) {
      setMsg({ type: 'err', text: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPw.length < 8) { setMsg({ type: 'err', text: 'New password must be 8+ characters' }); return }
    setSaving(true)
    setMsg(null)
    try {
      await request('/accounts/me/password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      })
      setCurrentPw('')
      setNewPw('')
      setMsg({ type: 'ok', text: 'Password changed.' })
    } catch (e) {
      setMsg({ type: 'err', text: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    display: 'block', width: '100%', padding: '9px 12px',
    border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14,
    boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 12,
  }

  const plan = account?.plan || 'free'

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>Account settings</h1>
      <p style={{ margin: '0 0 32px', color: '#6b7280' }}>Manage your profile and billing</p>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 6, marginBottom: 20,
          background: msg.type === 'ok' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${msg.type === 'ok' ? '#bbf7d0' : '#fecaca'}`,
          color: msg.type === 'ok' ? '#15803d' : '#dc2626', fontSize: 14,
        }}>
          {msg.text}
        </div>
      )}

      {/* Plan badge */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>Current plan</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>
              {plan === 'pro' ? 'Unlimited widgets, priority support' : '1 widget, up to 50 testimonials'}
            </p>
          </div>
          <span style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: plan === 'pro' ? '#fef3c7' : '#f3f4f6',
            color: plan === 'pro' ? '#92400e' : '#374151',
          }}>
            {plan.toUpperCase()}
          </span>
        </div>
        {plan === 'free' && (
          <button style={{
            marginTop: 14, padding: '8px 16px', background: '#2563eb', color: '#fff',
            border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Upgrade to Pro — $19/mo
          </button>
        )}
      </div>

      {/* Profile */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Profile</h2>
        <form onSubmit={saveProfile}>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Full name</label>
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />

          <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />

          <button type="submit" disabled={saving} style={{
            padding: '8px 16px', background: '#2563eb', color: '#fff',
            border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Password */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Change password</h2>
        <form onSubmit={changePassword}>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Current password</label>
          <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} style={inputStyle} required />

          <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>New password</label>
          <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} style={{ ...inputStyle, marginBottom: 16 }} required />

          <button type="submit" disabled={saving} style={{
            padding: '8px 16px', background: '#111827', color: '#fff',
            border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Update password
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div style={{ background: '#fff', border: '1px solid #fee2e2', borderRadius: 8, padding: 20 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: '#dc2626' }}>Sign out</h2>
        <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: 13 }}>You'll need to log back in.</p>
        <button onClick={logout} style={{
          padding: '8px 16px', background: '#fff', color: '#dc2626',
          border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
        }}>
          Sign out
        </button>
      </div>
    </div>
  )
}
