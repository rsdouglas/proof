import { useState, useEffect } from 'react'
import { useAuth, useApi } from '../lib/auth'
import { C, spacing, radius, shadow, btn, card, input as inputToken, fontSize } from '../design'

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const upgraded = params.get('upgraded') === '1'
    const canceled = params.get('canceled') === '1'

    if (upgraded || canceled) {
      window.history.replaceState({}, '', window.location.pathname)
    }

    request<{ account: { id: string; email: string; name: string; plan: string } }>('/accounts/me')
      .then(data => {
        setAccount(data.account)
        setPlan(data.account.plan)
        setName(data.account.name || '')
        setEmail(data.account.email || '')
        if (upgraded) setMsg({ type: 'ok', text: '🎉 Welcome to Vouch Pro! Your plan has been upgraded.' })
        else if (canceled) setMsg({ type: 'err', text: 'Checkout was canceled. No changes were made.' })
      })
      .catch(() => {
        if (upgraded) setMsg({ type: 'ok', text: '🎉 Welcome to Vouch Pro! Your plan has been upgraded.' })
        else if (canceled) setMsg({ type: 'err', text: 'Checkout was canceled. No changes were made.' })
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
      const data = await request<{ url?: string; stripe_unavailable?: boolean; message?: string }>('/billing/checkout', { method: 'POST' })
      if (data.url) {
        window.location.href = data.url
      } else if (data.stripe_unavailable) {
        // Stripe not yet configured — billing coming soon
        setMsg({ type: 'ok', text: "⚡ Billing setup in progress — check back soon!" })
        setBillingLoading(false)
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
      const data = await request<{ url: string }>('/billing/portal', { method: 'POST' })
      if (data.url) window.location.href = data.url
      else setMsg({ type: 'err', text: 'Could not open billing portal.' })
    } catch (e) {
      setMsg({ type: 'err', text: (e as Error).message })
    } finally {
      setBillingLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    ...inputToken,
    width: '100%',
    marginBottom: spacing[3],
    display: 'block',
  }

  const sectionStyle: React.CSSProperties = {
    ...card,
    marginBottom: spacing[5],
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: `${spacing[6]} ${spacing[4]}` }}>
      <h1 style={{ margin: `0 0 ${spacing[6]}`, fontSize: fontSize.xl, fontWeight: 700, color: C.gray[900] }}>Settings</h1>

      {msg && (
        <div style={{
          padding: `${spacing[3]} ${spacing[4]}`,
          borderRadius: radius.md,
          marginBottom: spacing[4],
          background: msg.type === 'ok' ? C.success.bg : C.danger.bg,
          color: msg.type === 'ok' ? C.success.text : C.danger.text,
          border: `1px solid ${msg.type === 'ok' ? C.success.border : C.danger.border}`,
          fontSize: fontSize.sm,
        }}>
          {msg.text}
        </div>
      )}

      {/* Billing */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
          <h2 style={{ margin: 0, fontSize: fontSize.base, fontWeight: 600, color: C.gray[900] }}>Plan</h2>
          <span style={{
            padding: `2px ${spacing[2]}`,
            borderRadius: radius.sm,
            fontSize: fontSize.xs,
            fontWeight: 700,
            background: isPro ? '#fef3c7' : C.gray[100],
            color: isPro ? '#92400e' : C.gray[500],
          }}>
            {isPro ? 'PRO' : 'FREE'}
          </span>
        </div>
        {isPro ? (
          <div>
            <p style={{ margin: `0 0 ${spacing[3]}`, color: C.gray[500], fontSize: fontSize.sm }}>
              You're on the Pro plan. Manage your subscription below.
            </p>
            <button onClick={handleManageBilling} disabled={billingLoading} style={btn.outline}>
              {billingLoading ? 'Loading…' : 'Manage billing →'}
            </button>
          </div>
        ) : (
          <div>
            <p style={{ margin: `0 0 ${spacing[2]}`, fontWeight: 600, fontSize: fontSize.sm, color: C.gray[800] }}>Pro plan — $9/month</p>
            <ul style={{ margin: `0 0 ${spacing[4]}`, paddingLeft: 18, fontSize: fontSize.sm, color: C.gray[700], lineHeight: 1.8 }}>
              <li>Unlimited testimonials &amp; widgets</li>
              <li>Remove Vouch branding</li>
              <li>Email notifications</li>
              <li>Advanced widget themes</li>
              <li>Analytics dashboard</li>
            </ul>
            <button onClick={handleUpgrade} disabled={billingLoading} style={btn.primary}>
              {billingLoading ? 'Loading…' : '⚡ Upgrade to Pro — $9/mo'}
            </button>
          </div>
        )}
      </div>

      {/* Profile */}
      <div style={sectionStyle}>
        <h2 style={{ margin: `0 0 ${spacing[4]}`, fontSize: fontSize.base, fontWeight: 600, color: C.gray[900] }}>Profile</h2>
        <form onSubmit={saveProfile}>
          <label style={{ fontSize: fontSize.sm, fontWeight: 600, color: C.gray[700], display: 'block', marginBottom: spacing[1] }}>Name</label>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          <label style={{ fontSize: fontSize.sm, fontWeight: 600, color: C.gray[700], display: 'block', marginBottom: spacing[1] }}>Email</label>
          <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          <button type="submit" disabled={saving} style={btn.primary}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div style={sectionStyle}>
        <h2 style={{ margin: `0 0 ${spacing[4]}`, fontSize: fontSize.base, fontWeight: 600, color: C.gray[900] }}>Change Password</h2>
        <form onSubmit={changePassword}>
          <label style={{ fontSize: fontSize.sm, fontWeight: 600, color: C.gray[700], display: 'block', marginBottom: spacing[1] }}>Current password</label>
          <input style={inputStyle} type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
          <label style={{ fontSize: fontSize.sm, fontWeight: 600, color: C.gray[700], display: 'block', marginBottom: spacing[1] }}>New password</label>
          <input style={inputStyle} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 8 characters" />
          <button type="submit" disabled={saving} style={btn.outline}>
            {saving ? 'Changing…' : 'Change password'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div style={{ ...sectionStyle, border: `1px solid ${C.danger.border}` }}>
        <h2 style={{ margin: `0 0 ${spacing[3]}`, fontSize: fontSize.base, fontWeight: 600, color: C.danger.text }}>Danger Zone</h2>
        <p style={{ margin: `0 0 ${spacing[3]}`, fontSize: fontSize.sm, color: C.gray[500] }}>
          Signing out will clear your session from this device.
        </p>
        <button onClick={logout} style={btn.danger}>Sign out</button>
      </div>
    </div>
  )
}
