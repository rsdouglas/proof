import { useState, useEffect } from 'react'
import { useAuth, useApi } from '../lib/auth'

export default function Settings() {
  const { account, setAccount, logout } = useAuth()
  const { request } = useApi()
  const [name, setName] = useState(account?.name || '')
  const [email, setEmail] = useState(account?.email || '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [plan, setPlan] = useState<string>(account?.plan || 'free')

  // On mount: fetch fresh account + billing status from server
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const upgraded = params.get('upgraded') === '1'
    const canceled = params.get('canceled') === '1'

    if (upgraded || canceled) {
      window.history.replaceState({}, '', window.location.pathname)
    }

    // Always refresh account from server to get latest plan
    request<{ account: { id: string; email: string; name: string; plan: string } }>('/accounts/me')
      .then(data => {
        setAccount(data.account)
        setPlan(data.account.plan)
        setName(data.account.name || '')
        setEmail(data.account.email || '')
        if (upgraded) {
          setMsg({ type: 'ok', text: '🎉 Welcome to Vouch Pro! Your plan has been upgraded.' })
        } else if (canceled) {
          setMsg({ type: 'err', text: 'Checkout was canceled. No changes were made.' })
        }
      })
      .catch(() => {
        // Fall back to cached values
        if (upgraded) {
          setMsg({ type: 'ok', text: '🎉 Welcome to Vouch Pro! Your plan has been upgraded.' })
        } else if (canceled) {
          setMsg({ type: 'err', text: 'Checkout was canceled. No changes were made.' })
        }
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isPro = plan === 'pro'

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
      setPlan(data.account.plan)
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

  async function handleUpgrade() {
    setBillingLoading(true)
    setMsg(null)
    try {
      const data = await request<{ url: string }>('/billing/checkout', { method: 'POST' })
      if (data.url) {
        window.location.href = data.url
      } else {
        setMsg({ type: 'err', text: 'Failed to start checkout. Please try again.' })
        setBillingLoading(false)
      }
    } catch (e: unknown) {
      setMsg({ type: 'err', text: (e as Error).message || 'Failed to start checkout. Please try again.' })
      setBillingLoading(false)
    }
  }

  async function handleManageBilling() {
    setBillingLoading(true)
    setMsg(null)
    try {
      const data = await request<{ url: string }>('/billing/portal')
      window.location.href = data.url
    } catch (e) {
      setMsg({ type: 'err', text: (e as Error).message })
      setBillingLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    display: 'block', width: '100%', padding: '8px 10px',
    border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 12,
    fontSize: 13, boxSizing: 'border-box',
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700 }}>Settings</h1>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 6, marginBottom: 16,
          background: msg.type === 'ok' ? '#f0fdf4' : '#fef2f2',
          color: msg.type === 'ok' ? '#166534' : '#991b1b',
          border: `1px solid ${msg.type === 'ok' ? '#bbf7d0' : '#fecaca'}`,
          fontSize: 13,
        }}>
          {msg.text}
        </div>
      )}

      {/* Billing */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Plan</h2>
          <span style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
            background: isPro ? '#fef3c7' : '#f3f4f6',
            color: isPro ? '#92400e' : '#6b7280',
          }}>
            {isPro ? 'PRO' : 'FREE'}
          </span>
        </div>
        {isPro ? (
          <div>
            <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: 13 }}>
              You're on the Pro plan. Manage your subscription below.
            </p>
            <button
              onClick={handleManageBilling}
              disabled={billingLoading}
              style={{
                padding: '8px 16px', background: '#fff',
                border: '1px solid #d1d5db', borderRadius: 6,
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}
            >
              {billingLoading ? 'Loading…' : 'Manage billing →'}
            </button>
          </div>
        ) : (
          <div>
            <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 13 }}>Pro plan — $9/month</p>
            <ul style={{ margin: '0 0 14px', paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
              <li>Unlimited testimonials</li>
              <li>Remove Vouch branding</li>
              <li>Email notifications</li>
              <li>Advanced widget themes</li>
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={billingLoading}
              style={{
                padding: '9px 18px', background: '#2563eb', color: '#fff',
                border: 'none', borderRadius: 6,
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              {billingLoading ? 'Loading…' : '⚡ Upgrade to Pro — $9/mo'}
            </button>
          </div>
        )}
      </div>

      {/* Profile */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Profile</h2>
        <form onSubmit={saveProfile}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Name</label>
          <input
            style={inputStyle}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
          />
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Email</label>
          <input
            style={inputStyle}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <button
            type="submit"
            disabled={saving}
            style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Change password</h2>
        <form onSubmit={changePassword}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Current password</label>
          <input
            style={inputStyle}
            type="password"
            value={currentPw}
            onChange={e => setCurrentPw(e.target.value)}
            placeholder="Current password"
          />
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>New password</label>
          <input
            style={inputStyle}
            type="password"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            placeholder="New password (8+ chars)"
          />
          <button
            type="submit"
            disabled={saving}
            style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            {saving ? 'Saving…' : 'Change password'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div style={{ background: '#fff', border: '1px solid #fca5a5', borderRadius: 8, padding: 20 }}>
        <h2 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 600, color: '#991b1b' }}>Danger zone</h2>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280' }}>
          Sign out of your account on this device.
        </p>
        <button
          onClick={logout}
          style={{
            padding: '8px 16px', background: '#fff', color: '#dc2626',
            border: '1px solid #dc2626', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
