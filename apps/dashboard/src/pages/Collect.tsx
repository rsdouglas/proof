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
  const [tab, setTab] = useState<'single' | 'bulk'>('single')

  // Single send state
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [widgetId, setWidgetId] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  // Bulk send state
  const [bulkEmails, setBulkEmails] = useState('')
  const [bulkNote, setBulkNote] = useState('')
  const [bulkSending, setBulkSending] = useState(false)
  const [bulkResult, setBulkResult] = useState<{ sent: number; failed: string[]; errors: string[] } | null>(null)
  const [bulkError, setBulkError] = useState('')

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

  async function handleBulkSend(e: React.FormEvent) {
    e.preventDefault()
    if (!widgetId) { setBulkError('No widget found — create one first.'); return }
    const emails = bulkEmails
      .split(/[,\n\r]+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0)
    if (emails.length === 0) { setBulkError('Enter at least one email.'); return }
    if (emails.length > 100) { setBulkError('Maximum 100 emails per bulk send.'); return }
    setBulkSending(true)
    setBulkError('')
    setBulkResult(null)
    try {
      const result = await request('/testimonials/request-bulk', {
        method: 'POST',
        body: JSON.stringify({
          emails,
          widget_id: widgetId,
          personal_note: bulkNote.trim() || undefined,
        }),
      }) as { sent: number; failed: string[]; errors: string[] }
      setBulkResult(result)
      if (result.sent > 0) setBulkEmails('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setBulkError(msg || 'Failed to send. Try again.')
    } finally {
      setBulkSending(false)
    }
  }

  function countBulkEmails(raw: string) {
    return raw.split(/[,\n\r]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 0).length
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
            {"We'll send a personalised request email on your behalf"}
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderRadius: radius.md, border: `1px solid ${colors.gray200}`, overflow: 'hidden', width: 'fit-content' }}>
        {(['single', 'bulk'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(''); setBulkError(''); setBulkResult(null) }}
            style={{
              padding: '7px 18px', fontSize: 13, fontWeight: 600, fontFamily: font.sans,
              border: 'none', cursor: 'pointer',
              background: tab === t ? colors.brand : '#fff',
              color: tab === t ? '#fff' : colors.gray600,
              transition: 'all 0.15s',
            }}
          >
            {t === 'single' ? 'Single' : 'Bulk (up to 100)'}
          </button>
        ))}
      </div>

      {tab === 'single' && (
        <>
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
                  autoFocus
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
                  Customer name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith (optional)"
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${colors.gray200}`, borderRadius: radius.md,
                    fontSize: 14, fontFamily: font.sans, color: colors.gray900,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
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
                    outline: 'none', background: '#fff',
                  }}
                >
                  {widgets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray600, marginBottom: 4 }}>
                Personal note <span style={{ fontWeight: 400, color: colors.gray400 }}>(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={"Thanks for being a customer! We'd love your feedback…"}
                rows={3}
                style={{
                  width: '100%', padding: '9px 12px',
                  border: `1px solid ${colors.gray200}`, borderRadius: radius.md,
                  fontSize: 14, fontFamily: font.sans, color: colors.gray900,
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={sending || !email.trim()}
              style={{
                ...btn.primary,
                display: 'flex', alignItems: 'center', gap: 8,
                justifyContent: 'center', padding: '10px 20px',
                opacity: sending || !email.trim() ? 0.6 : 1,
                cursor: sending || !email.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              <Send size={14} />
              {sending ? 'Sending…' : 'Send request'}
            </button>
          </form>
        </>
      )}

      {tab === 'bulk' && (
        <>
          {bulkResult && (
            <div style={{
              background: bulkResult.sent > 0 ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${bulkResult.sent > 0 ? '#bbf7d0' : '#fecaca'}`,
              borderRadius: radius.md, padding: '12px 16px', marginBottom: 16,
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: bulkResult.sent > 0 ? '#15803d' : '#dc2626', marginBottom: 4 }}>
                {bulkResult.sent > 0 ? `✓ ${bulkResult.sent} request${bulkResult.sent > 1 ? 's' : ''} sent!` : 'No emails sent'}
              </div>
              {bulkResult.failed.length > 0 && (
                <div style={{ fontSize: 12, color: '#dc2626' }}>
                  Failed: {bulkResult.failed.join(', ')}
                </div>
              )}
            </div>
          )}
          {bulkError && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: radius.md, padding: '10px 14px', marginBottom: 16,
              fontSize: 13, color: '#dc2626',
            }}>
              {bulkError}
            </div>
          )}
          <form onSubmit={handleBulkSend} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray600, marginBottom: 4 }}>
                Customer emails * <span style={{ fontWeight: 400, color: colors.gray400 }}>(one per line or comma-separated, max 100)</span>
              </label>
              <textarea
                value={bulkEmails}
                onChange={e => setBulkEmails(e.target.value)}
                placeholder={"alice@example.com\nbob@example.com\ncarla@example.com"}
                rows={6}
                style={{
                  width: '100%', padding: '9px 12px',
                  border: `1px solid ${colors.gray200}`, borderRadius: radius.md,
                  fontSize: 13, fontFamily: font.sans, color: colors.gray900,
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                }}
              />
              {bulkEmails.trim() && (
                <div style={{ fontSize: 11, color: colors.gray400, marginTop: 4 }}>
                  {countBulkEmails(bulkEmails)} email(s) detected
                </div>
              )}
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
                    outline: 'none', background: '#fff',
                  }}
                >
                  {widgets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray600, marginBottom: 4 }}>
                Personal note <span style={{ fontWeight: 400, color: colors.gray400 }}>(optional — same note sent to all)</span>
              </label>
              <textarea
                value={bulkNote}
                onChange={e => setBulkNote(e.target.value)}
                placeholder={"Thanks for being a customer! We'd love your feedback…"}
                rows={3}
                style={{
                  width: '100%', padding: '9px 12px',
                  border: `1px solid ${colors.gray200}`, borderRadius: radius.md,
                  fontSize: 14, fontFamily: font.sans, color: colors.gray900,
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={bulkSending || !bulkEmails.trim()}
              style={{
                ...btn.primary,
                display: 'flex', alignItems: 'center', gap: 8,
                justifyContent: 'center', padding: '10px 20px',
                opacity: bulkSending || !bulkEmails.trim() ? 0.6 : 1,
                cursor: bulkSending || !bulkEmails.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              <Send size={14} />
              {bulkSending
                ? 'Sending…'
                : `Send to ${countBulkEmails(bulkEmails)} customer${countBulkEmails(bulkEmails) !== 1 ? 's' : ''}`}
            </button>
          </form>
        </>
      )}
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
