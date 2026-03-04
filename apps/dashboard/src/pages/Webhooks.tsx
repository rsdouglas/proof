import { useState, useEffect } from 'react'
import { useApi } from '../lib/auth'

interface Webhook {
  id: string
  url: string
  events: string[]
  active: boolean
  created_at: string
}

interface WebhooksResponse {
  webhooks: Webhook[]
}

interface WebhookResponse {
  webhook: Webhook
}

const ALL_EVENTS = [
  { value: 'testimonial.submitted', label: 'Testimonial submitted' },
  { value: 'testimonial.approved', label: 'Testimonial approved' },
  { value: 'testimonial.rejected', label: 'Testimonial rejected' },
]

export default function Webhooks() {
  const { request } = useApi()
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ url: '', secret: '', events: ['testimonial.submitted', 'testimonial.approved'] })
  const [formError, setFormError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await request<WebhooksResponse>('/webhooks')
      setWebhooks(data.webhooks || [])
    } catch (err) {
      setError('Failed to load webhooks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const toggleEvent = (event: string) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(event)
        ? f.events.filter(e => e !== event)
        : [...f.events, event]
    }))
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.url.startsWith('https://')) {
      setFormError('URL must use HTTPS')
      return
    }
    if (form.events.length === 0) {
      setFormError('Select at least one event')
      return
    }
    setSubmitting(true)
    try {
      await request<WebhookResponse>('/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          url: form.url,
          secret: form.secret || undefined,
          events: form.events,
        }),
      })
      setForm({ url: '', secret: '', events: ['testimonial.submitted', 'testimonial.approved'] })
      setShowForm(false)
      load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create webhook')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this webhook?')) return
    try {
      await request(`/webhooks/${id}`, { method: 'DELETE' })
      setWebhooks(wh => wh.filter(w => w.id !== id))
    } catch {
      // silently fail for now
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Webhooks</h1>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14, marginBottom: 0 }}>
            Get HTTP notifications when testimonial events happen. Connect to Zapier, Make, or your own backend.
          </p>
        </div>
        {webhooks.length < 5 && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 14, flexShrink: 0, marginLeft: 16 }}
          >
            + Add Webhook
          </button>
        )}
      </div>

      {error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>}

      {/* Create form */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16, color: '#111827' }}>New Webhook</h3>
          <form onSubmit={create}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Endpoint URL <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="url"
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://hooks.zapier.com/..."
                required
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Signing Secret <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={form.secret}
                onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
                placeholder="Any string — used to sign payloads with HMAC-SHA256"
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
              />
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, marginBottom: 0 }}>
                If set, we include an <code>X-Vouch-Signature</code> header on every delivery.
              </p>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                Events <span style={{ color: '#dc2626' }}>*</span>
              </label>
              {ALL_EVENTS.map(ev => (
                <label key={ev.value} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', fontSize: 14, color: '#374151' }}>
                  <input
                    type="checkbox"
                    checked={form.events.includes(ev.value)}
                    onChange={() => toggleEvent(ev.value)}
                  />
                  {ev.label}
                  <code style={{ fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>{ev.value}</code>
                </label>
              ))}
            </div>
            {formError && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{formError}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14, opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Creating...' : 'Create Webhook'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Webhooks list */}
      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading...</p>
      ) : webhooks.length === 0 ? (
        <div style={{ background: '#fff', border: '2px dashed #e5e7eb', borderRadius: 12, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔗</div>
          <p style={{ color: '#374151', fontSize: 15, margin: 0, fontWeight: 500 }}>No webhooks yet</p>
          <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 4, marginBottom: 16 }}>
            Add a webhook to automate workflows when testimonials come in.
          </p>
          <button
            onClick={() => setShowForm(true)}
            style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
          >
            + Add Webhook
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {webhooks.map(wh => (
            <div key={wh.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{
                      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                      background: wh.active ? '#22c55e' : '#d1d5db', flexShrink: 0
                    }} />
                    <code style={{ fontSize: 13, color: '#111827', fontFamily: 'monospace', wordBreak: 'break-all' }}>{wh.url}</code>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {(Array.isArray(wh.events) ? wh.events : JSON.parse(wh.events as unknown as string)).map((ev: string) => (
                      <span key={ev} style={{ fontSize: 11, background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>
                        {ev}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                    Created {new Date(wh.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => remove(wh.id)}
                  style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 6, padding: '6px 12px', color: '#dc2626', cursor: 'pointer', fontSize: 13, marginLeft: 16, flexShrink: 0 }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {webhooks.length >= 5 && (
            <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center' }}>Maximum of 5 webhooks reached.</p>
          )}
        </div>
      )}

      {/* Docs */}
      <div style={{ marginTop: 32, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginTop: 0, marginBottom: 8 }}>Payload format</h4>
        <pre style={{ fontSize: 12, color: '#475569', background: '#f1f5f9', padding: 12, borderRadius: 8, overflow: 'auto', margin: 0 }}>{`{
  "event": "testimonial.submitted",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "id": "uuid",
    "display_name": "Jane Doe",
    "rating": 5,
    "display_text": "Amazing product!",
    "status": "pending"
  }
}`}</pre>
        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 0, marginTop: 8 }}>
          Verify the <code>X-Vouch-Signature</code> header: <code>sha256=HMAC(secret, raw_body)</code>
        </p>
      </div>
    </div>
  )
}
