import React, { useState, useEffect } from 'react'
import { useAuth, useApi } from '../lib/auth'


function UpgradeForm({ onSubmit, onCancel, defaultEmail }: { onSubmit: (email: string) => Promise<void>; onCancel: () => void; defaultEmail: string }) {
  const [email, setEmail] = React.useState(defaultEmail)
  const [loading, setLoading] = React.useState(false)
  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Your email"
        style={{ display: 'block', width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 12, fontSize: 14, boxSizing: 'border-box' as const, fontFamily: 'inherit' }}
      />
      <button
        onClick={async () => { setLoading(true); await onSubmit(email); setLoading(false) }}
        disabled={loading || !email}
        style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}
      >
        {loading ? 'Joining…' : 'Notify me when Pro launches →'}
      </button>
      <button onClick={onCancel} style={{ width: '100%', padding: '8px', background: 'transparent', color: '#6b7280', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
        Cancel
      </button>
    </div>
  )
}

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

  // Check for redirect from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === '1') {
      setMsg({ type: 'ok', text: '🎉 Welcome to Vouch Pro! Your plan has been upgraded.' })
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (params.get('canceled') === '1') {
      setMsg({ type: 'err', text: 'Checkout was canceled. No changes were made.' })
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Sync profile fields when account data loads (account may be null on first render)
  useEffect(() => {
    if (account?.name) setName(n => n || account.name)
    if (account?.email) setEmail(e => e || account.email)
  }, [account])

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

  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  async function handleUpgrade() {
    setShowUpgradeModal(true)
  }

  async function handleJoinWaitlist(email: string) {
    try {
      await request('/waitlist', { method: 'POST', body: JSON.stringify({ email }) })
    } catch {
      // best-effort
    }
    setShowUpgradeModal(false)
    setMsg({ type: 'ok', text: "You're on the Pro waitlist! We'll email you when billing goes live." })
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
    display: 'block', width: '100%', padding: '9px 12px',
    border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14,
    boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 12,
  }

  const plan = account?.plan || 'free'
  const isPro = plan === 'pro'

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

      {/* Billing / Plan */}
      <div style={{ background: '#fff', border: isPro ? '1px solid #fbbf24' : '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>
              {isPro ? '✨ Vouch Pro' : 'Free plan'}
            </h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>
              {isPro
                ? 'Unlimited widgets and testimonials. Priority support.'
                : '1 widget, up to 10 approved testimonials. Upgrade for more.'}
            </p>
          </div>
          <span style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: isPro ? '#fef3c7' : '#f3f4f6',
            color: isPro ? '#92400e' : '#6b7280',
            flexShrink: 0, marginLeft: 12,
          }}>
            {isPro ? 'PRO' : 'FREE'}
          </span>
        </div>

        {isPro ? (
          <div>
            <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: 13 }}>
              Manage your subscription, view invoices, or cancel anytime.
            </p>
            <button
              onClick={handleManageBilling}
              disabled={billingLoading}
              style={{
                padding: '8px 16px', background: '#fff', color: '#111827',
                border: '1px solid #d1d5db', borderRadius: 6, fontWeight: 600, fontSize: 13,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {billingLoading ? 'Loading…' : 'Manage billing →'}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 6, padding: '12px 16px', marginBottom: 14 }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 13 }}>Pro plan — $9/month</p>
              <ul style={{ margin: 0, paddingLeft: 16, color: '#374151', fontSize: 13, lineHeight: 1.8 }}>
                <li>Unlimited widgets</li>
                <li>Unlimited testimonials</li>
                <li>Priority support</li>
                <li>All future features</li>
              </ul>
            </div>
            <button
              onClick={handleUpgrade}
              disabled={billingLoading}
              style={{
                padding: '10px 20px', background: '#2563eb', color: '#fff',
                border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 14,
                cursor: 'pointer', fontFamily: 'inherit',
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
          <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />

          <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ ...inputStyle, marginBottom: 16 }} required />

          <button type="submit" disabled={saving} style={{
            padding: '8px 16px', background: '#111827', color: '#fff',
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

      {/* Sign out */}
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

      {/* Upgrade waitlist modal */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setShowUpgradeModal(false)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, maxWidth: 420, width: '90%' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>Upgrade to Pro ✨</h2>
            <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: 14 }}>
              Billing is launching very soon. Join the waitlist and we'll email you the moment it goes live — plus an early-bird discount.
            </p>
            <UpgradeForm onSubmit={handleJoinWaitlist} onCancel={() => setShowUpgradeModal(false)} defaultEmail={account?.email || ''} />
          </div>
        </div>
      )}
    </div>
  )
}
