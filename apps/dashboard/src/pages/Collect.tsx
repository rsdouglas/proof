import { useEffect, useState, useCallback } from 'react'
import { useApi } from '../lib/auth'
import { Link2, Copy, Check, Lightbulb, Mail, AlertTriangle, RefreshCw, Send, CheckCircle2 } from 'lucide-react'
import { colors, radius, shadow, font, btn, card } from '../design'

interface CollectionForm {
  id: string
  name: string
  active: number
  created_at: string
}

interface Widget {
  id: string
  name: string
}

export default function Collect() {
  const { request } = useApi()
  const [form, setForm] = useState<CollectionForm | null>(null)
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await request('/collection-forms') as { forms: CollectionForm[] }
      setForm(data.forms?.[0] ?? null)
      const wdata = await request('/widgets') as { widgets: Widget[] }
      setWidgets(wdata.widgets ?? [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function copyLink() {
    if (!form) return
    const url = `https://socialproof.dev/c/${form.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const collectionUrl = form ? `https://socialproof.dev/c/${form.id}` : ''

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: colors.gray900, letterSpacing: '-0.5px' }}>
          Collect Testimonials
        </h1>
        <p style={{ margin: 0, color: colors.gray400, fontSize: 14 }}>
          Share your collection link with customers to gather testimonials.
        </p>
      </div>

      {loading && (
        <div style={{ ...card, textAlign: 'center', padding: 48 }}>
          <p style={{ color: colors.gray400, margin: 0 }}>Loading…</p>
        </div>
      )}

      {!loading && form && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Main link card */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: radius.md,
                background: colors.brandLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Link2 size={18} color={colors.brand} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.gray900 }}>
                  Your collection link
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: colors.gray400 }}>
                  Send this to customers — they fill a short form, you approve
                </p>
              </div>
            </div>

            {/* URL display + copy */}
            <div style={{
              display: 'flex', gap: 8, alignItems: 'center',
              background: colors.gray50, border: `1px solid ${colors.gray200}`,
              borderRadius: radius.md, padding: '10px 14px',
              marginBottom: 14,
            }}>
              <span style={{
                flex: 1, fontSize: 13, color: colors.gray700,
                fontFamily: font.mono, wordBreak: 'break-all',
              }}>
                {collectionUrl}
              </span>
              <button
                onClick={copyLink}
                style={{
                  ...btn.primary,
                  background: copied ? colors.success : colors.brand,
                  gap: 6,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>

            <a
              href={collectionUrl}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 13, color: colors.gray400, textDecoration: 'none' }}
            >
              Preview form ↗
            </a>
          </div>

          {/* Send request by email */}
          <SendRequestCard widgets={widgets} request={request} />

          {/* How to use */}
          <div style={{
            background: colors.brandLight,
            border: `1px solid ${colors.brandBorder}`,
            borderRadius: radius.lg,
            padding: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Lightbulb size={15} color={colors.brand} />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.brand }}>
                How to use your link
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { step: '1', text: 'Copy the link above' },
                { step: '2', text: 'Send it to customers — in an email, after a purchase, or on your thank-you page' },
                { step: '3', text: 'Testimonials arrive in your dashboard under Testimonials → approve the ones you love' },
                { step: '4', text: 'Once approved, they automatically appear in any widget you embed on your site' },
              ].map(item => (
                <div key={item.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: radius.full,
                    background: colors.brand, color: colors.white,
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 1,
                  }}>{item.step}</span>
                  <span style={{ fontSize: 14, color: colors.gray700, lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick share suggestions */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Mail size={15} color={colors.gray400} />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray900 }}>
                Quick share ideas
              </h3>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: colors.gray400 }}>
              Copy and paste these into your messages
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <QuickSnippet
                label="After a purchase"
                text={`Hi [name], thanks for your order! If you have a minute, I'd love to hear what you think: ${collectionUrl}`}
              />
              <QuickSnippet
                label="Email footer"
                text={`Love working with us? Share your experience → ${collectionUrl}`}
              />
              <QuickSnippet
                label="In Slack / DM"
                text={`Hey, would really appreciate a quick review if you have a sec: ${collectionUrl}`}
              />
            </div>
          </div>

          {!form.active && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: radius.lg, padding: '14px 18px',
              display: 'flex', gap: 10, alignItems: 'center',
            }}>
              <AlertTriangle size={16} color="#d97706" />
              <span style={{ fontSize: 13, color: '#92400e' }}>
                This form is currently paused — new submissions won't be accepted.
              </span>
            </div>
          )}
        </div>
      )}

      {!loading && !form && (
        <div style={{ ...card, textAlign: 'center', padding: 48 }}>
          <p style={{ color: colors.gray400, margin: '0 0 16px' }}>No collection form found.</p>
          <button onClick={load} style={{ ...btn.outline, gap: 6 }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}
    </div>
  )
}

// ── Send Request Card ────────────────────────────────────────────────────────

interface SendRequestCardProps {
  widgets: Widget[]
  request: <T = unknown>(path: string, options?: RequestInit) => Promise<T>
}

function SendRequestCard({ widgets, request }: SendRequestCardProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [widgetId, setWidgetId] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  // Default to first widget
  useEffect(() => {
    if (widgets.length > 0 && !widgetId) setWidgetId(widgets[0].id)
  }, [widgets])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    if (!widgetId) { setError('No widget found — create one first.'); return }
    setSending(true)
    setError('')
    try {
      await request('/testimonials/request', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          widget_id: widgetId,
          personal_note: note.trim() || undefined,
        }),
      })
      setSent(true)
      setEmail('')
      setName('')
      setNote('')
      setTimeout(() => setSent(false), 4000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || 'Failed to send request. Try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: radius.md,
          background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Send size={18} color="#16a34a" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.gray900 }}>
            Request by email
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: colors.gray400 }}>
            We'll send a personalised request email on your behalf
          </p>
        </div>
      </div>

      {sent && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: radius.md, padding: '10px 14px', marginBottom: 16,
        }}>
          <CheckCircle2 size={15} color="#16a34a" />
          <span style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>Request sent!</span>
        </div>
      )}

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: radius.md, padding: '10px 14px', marginBottom: 16,
          fontSize: 13, color: '#dc2626',
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray600, marginBottom: 4 }}>
              Customer email *
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="customer@example.com"
              required
              style={{
                width: '100%', padding: '9px 12px',
                border: `1px solid ${colors.gray200}`, borderRadius: radius.md,
                fontSize: 14, fontFamily: font.sans, color: colors.gray900,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray600, marginBottom: 4 }}>
              Their name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Smith"
              style={{
                width: '100%', padding: '9px 12px',
                border: `1px solid ${colors.gray200}`, borderRadius: radius.md,
                fontSize: 14, fontFamily: font.sans, color: colors.gray900,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray600, marginBottom: 4 }}>
            Personal note (optional)
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. We really enjoyed working together on your website redesign…"
            rows={2}
            style={{
              width: '100%', padding: '9px 12px',
              border: `1px solid ${colors.gray200}`, borderRadius: radius.md,
              fontSize: 14, fontFamily: font.sans, color: colors.gray900,
              outline: 'none', resize: 'vertical', boxSizing: 'border-box',
            }}
          />
        </div>

        {widgets.length > 1 && (
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray600, marginBottom: 4 }}>
              Widget
            </label>
            <select
              value={widgetId}
              onChange={e => setWidgetId(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px',
                border: `1px solid ${colors.gray200}`, borderRadius: radius.md,
                fontSize: 14, fontFamily: font.sans, color: colors.gray900,
                outline: 'none', background: colors.white, boxSizing: 'border-box',
              }}
            >
              {widgets.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={sending || !email.trim()}
          style={{
            ...btn.primary,
            gap: 8, alignSelf: 'flex-start',
            opacity: sending || !email.trim() ? 0.6 : 1,
            cursor: sending || !email.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          <Send size={14} />
          {sending ? 'Sending…' : 'Send request'}
        </button>
      </form>
    </div>
  )
}

// ── Quick Snippet ────────────────────────────────────────────────────────────

function QuickSnippet({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{
      background: colors.gray50, border: `1px solid ${colors.gray200}`,
      borderRadius: radius.md, padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: colors.gray400, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        <button
          onClick={copy}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: copied ? colors.success : colors.gray400,
            fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
            padding: '2px 6px',
          }}
        >
          {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: colors.gray700, lineHeight: 1.5 }}>{text}</p>
    </div>
  )
}
