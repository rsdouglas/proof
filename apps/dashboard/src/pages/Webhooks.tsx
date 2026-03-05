import { useState, useEffect } from 'react'
import { useApi } from '../lib/auth'
import { Webhook, Trash2, Plus, CheckCircle, XCircle, Clock } from 'lucide-react'
import { C, spacing, radius, btn, card, input as inputToken, fontSize } from '../design'

interface WebhookItem {
  id: string
  url: string
  events: string[]
  active: boolean
  created_at: string
  last_delivery_status?: 'success' | 'failed' | 'pending' | null
}

const EVENT_OPTIONS = [
  { value: 'testimonial.created', label: 'Testimonial created' },
  { value: 'testimonial.approved', label: 'Testimonial approved' },
  { value: 'testimonial.rejected', label: 'Testimonial rejected' },
  { value: 'widget.created', label: 'Widget created' },
]

export default function Webhooks() {
  const { request } = useApi()
  const [hooks, setHooks] = useState<WebhookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState<string[]>(['testimonial.created'])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    request<{ webhooks: WebhookItem[] }>('/webhooks')
      .then(d => setHooks(d.webhooks || []))
      .catch(() => setMsg({ type: 'err', text: 'Failed to load webhooks.' }))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  async function createWebhook(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || events.length === 0) return
    setSaving(true)
    setMsg(null)
    try {
      const data = await request<{ webhook: WebhookItem }>('/webhooks', {
        method: 'POST',
        body: JSON.stringify({ url: url.trim(), events }),
      })
      setHooks(prev => [data.webhook, ...prev])
      setUrl('')
      setEvents(['testimonial.created'])
      setShowForm(false)
      setMsg({ type: 'ok', text: 'Webhook created.' })
    } catch (e) {
      setMsg({ type: 'err', text: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  async function deleteWebhook(id: string) {
    if (!confirm('Delete this webhook?')) return
    try {
      await request(`/webhooks/${id}`, { method: 'DELETE' })
      setHooks(prev => prev.filter(h => h.id !== id))
    } catch (e) {
      setMsg({ type: 'err', text: (e as Error).message })
    }
  }

  function toggleEvent(ev: string) {
    setEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev])
  }

  function StatusIcon({ status }: { status?: string | null }) {
    if (status === 'success') return <CheckCircle size={14} color={C.success.text} />
    if (status === 'failed') return <XCircle size={14} color={C.danger.text} />
    if (status === 'pending') return <Clock size={14} color={C.gray[400]} />
    return <span style={{ width: 14, display: 'inline-block' }} />
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: `${spacing[6]} ${spacing[4]}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6] }}>
        <div>
          <h1 style={{ margin: 0, fontSize: fontSize.xl, fontWeight: 700, color: C.gray[900] }}>Webhooks</h1>
          <p style={{ margin: `${spacing[1]} 0 0`, fontSize: fontSize.sm, color: C.gray[500] }}>
            Get notified when events happen in your account.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={btn.primary}>
          <Plus size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          Add webhook
        </button>
      </div>

      {msg && (
        <div style={{
          padding: `${spacing[3]} ${spacing[4]}`, borderRadius: radius.md,
          marginBottom: spacing[4],
          background: msg.type === 'ok' ? C.success.bg : C.danger.bg,
          color: msg.type === 'ok' ? C.success.text : C.danger.text,
          border: `1px solid ${msg.type === 'ok' ? C.success.border : C.danger.border}`,
          fontSize: fontSize.sm,
        }}>
          {msg.text}
        </div>
      )}

      {showForm && (
        <div style={{ ...card, marginBottom: spacing[5] }}>
          <h2 style={{ margin: `0 0 ${spacing[4]}`, fontSize: fontSize.base, fontWeight: 600, color: C.gray[900] }}>
            New Webhook
          </h2>
          <form onSubmit={createWebhook}>
            <label style={{ fontSize: fontSize.sm, fontWeight: 600, color: C.gray[700], display: 'block', marginBottom: spacing[1] }}>
              Endpoint URL
            </label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://your-server.com/webhooks/socialproof"
              required
              style={{ ...inputToken, width: '100%', boxSizing: 'border-box', marginBottom: spacing[4] }}
            />

            <label style={{ fontSize: fontSize.sm, fontWeight: 600, color: C.gray[700], display: 'block', marginBottom: spacing[2] }}>
              Events to subscribe
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2], marginBottom: spacing[5] }}>
              {EVENT_OPTIONS.map(opt => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: spacing[2], cursor: 'pointer', fontSize: fontSize.sm, color: C.gray[700] }}>
                  <input
                    type="checkbox"
                    checked={events.includes(opt.value)}
                    onChange={() => toggleEvent(opt.value)}
                  />
                  {opt.label}
                  <code style={{ fontSize: fontSize.xs, color: C.gray[400], marginLeft: 'auto', fontFamily: 'monospace' }}>{opt.value}</code>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: spacing[3] }}>
              <button type="submit" disabled={saving || events.length === 0} style={btn.primary}>
                {saving ? 'Creating…' : 'Create webhook'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={btn.ghost}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: spacing[12], color: C.gray[400], fontSize: fontSize.sm }}>
          Loading webhooks…
        </div>
      ) : hooks.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: spacing[12] }}>
          <Webhook size={32} style={{ color: C.gray[300], marginBottom: spacing[3] }} />
          <p style={{ margin: 0, color: C.gray[500], fontSize: fontSize.sm }}>
            No webhooks yet. Add one to start receiving events.
          </p>
        </div>
      ) : (
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          {hooks.map((hook, i) => (
            <div
              key={hook.id}
              style={{
                padding: `${spacing[4]} ${spacing[5]}`,
                borderBottom: i < hooks.length - 1 ? `1px solid ${C.gray[100]}` : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[3] }}>
                <StatusIcon status={hook.last_delivery_status} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontFamily: 'monospace', fontSize: fontSize.sm,
                    color: C.gray[900], wordBreak: 'break-all',
                  }}>
                    {hook.url}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[1], marginTop: spacing[2] }}>
                    {hook.events.map(ev => (
                      <span key={ev} style={{
                        padding: `1px ${spacing[2]}`,
                        background: C.brand[50],
                        color: C.brand[700],
                        borderRadius: radius.sm,
                        fontSize: fontSize.xs,
                        fontFamily: 'monospace',
                      }}>
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => deleteWebhook(hook.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: spacing[2], color: C.gray[400],
                    borderRadius: radius.sm, display: 'flex', alignItems: 'center',
                  }}
                  onMouseOver={e => (e.currentTarget.style.color = C.danger.text)}
                  onMouseOut={e => (e.currentTarget.style.color = C.gray[400])}
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
