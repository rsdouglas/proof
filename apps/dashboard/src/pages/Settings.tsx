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

  // Pro waitlist modal
  const [showWaitlistModal, setShowWaitlistModal] = useState(false)
  const [waitlistEmail, setWaitlistEmail] = useState(account?.email || '')
  const [waitlistDone, setWaitlistDone] = useState(false)
  const [waitlistLoading, setWaitlistLoading] = useState(false)

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

  async function handleUpgrade() {
    setBillingLoading(true)
    setMsg(null)
    try {
      const data = await request<{ url?: string; pro_waitlist?: boolean }>('/billing/checkout', { method: 'POST' })
      if (data.pro_waitlist) {
        // Stripe not yet configured — show Pro waitlist modal
        setShowWaitlistModal(true)
        setBillingLoading(false)
        return
      }
      if (data.url) window.location.href = data.url
    } catch (e: unknown) {
      // 402 means pro_waitlist mode
      const err = e as { status?: number; body?: { pro_waitlist?: boolean } }
      if (err.status === 402 || err.body?.pro_waitlist) {
        setShowWaitlistModal(true)
        setBillingLoading(false)
        return
      }
      setMsg({ type: 'err', text: (e as Error).message })
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

  async function submitWaitlist(e: React.FormEvent) {
    e.preventDefault()
    setWaitlistLoading(true)
    try {
      await request('/billing/pro-waitlist', {
        method: 'POST',
        body: JSON.stringify({ email: waitlistEmail }),
      })
      setWaitlistDone(true)
    } catch {
      // still show success to user
      setWaitlistDone(true)
    } finally {
      setWaitlistLoading(false)
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
            {isPro ? '✨ Vouch Pro' : 'Free plan'}
          </h2>
          <span style={{
            padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700,
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
            placeholder="New password (8+ characters)"
          />
          <button
            type="submit"
            disabled={saving}
            style={{ padding: '8px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            {saving ? 'Saving…' : 'Change password'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: '#dc2626' }}>Danger zone</h2>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280' }}>Sign out of your account.</p>
        <button
          onClick={logout}
          style={{ padding: '8px 16px', background: '#fff', border: '1px solid #dc2626', color: '#dc2626', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
        >
          Sign out
        </button>
      </div>

      {/* Pro Waitlist Modal */}
      {showWaitlistModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowWaitlistModal(false) }}>
          <div style={{
            background: '#fff', borderRadius: 14, padding: 36, maxWidth: 420, width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            {waitlistDone ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>You're on the list!</h2>
                <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>
                  We'll email you at <strong>{waitlistEmail}</strong> as soon as Pro is available. You'll be first in line.
                </p>
                <button
                  onClick={() => { setShowWaitlistModal(false); setWaitlistDone(false) }}
                  style={{ padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  Got it ✓
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
                <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Join the Pro waitlist</h2>
                <p style={{ margin: '0 0 6px', color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>
                  Pro billing is launching very soon. Join the waitlist and you'll be first to know — plus an early-bird discount.
                </p>
                <ul style={{ margin: '0 0 20px', paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
                  <li>Unlimited testimonials</li>
                  <li>Remove Vouch branding</li>
                  <li>Email notifications</li>
                  <li>Advanced widget themes</li>
                </ul>
                <form onSubmit={submitWaitlist}>
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={e => setWaitlistEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    style={{
                      display: 'block', width: '100%', padding: '10px 14px',
                      border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14,
                      boxSizing: 'border-box', marginBottom: 12, fontFamily: 'inherit',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={waitlistLoading}
                    style={{
                      width: '100%', padding: '11px 0', background: '#2563eb', color: '#fff',
                      border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer',
                      marginBottom: 10,
                    }}
                  >
                    {waitlistLoading ? 'Joining…' : 'Notify me when Pro launches →'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWaitlistModal(false)}
                    style={{
                      width: '100%', padding: '9px 0', background: '#f9fafb',
                      border: '1px solid #e5e7eb', borderRadius: 8,
                      color: '#6b7280', fontWeight: 500, fontSize: 14, cursor: 'pointer',
                    }}
                  >
                    Maybe later
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
