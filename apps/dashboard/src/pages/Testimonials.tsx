import { useEffect, useState, useCallback } from 'react'
import { useApi, API_URL, ApiError } from '../lib/auth'
import type { PlanLimitError } from '../lib/auth'
import UpgradeModal from '../components/UpgradeModal'
import { colors, font, shadow, radius, card, btn } from '../design'
import { CheckCircle2, XCircle, Trash2, Download, Mail, Plus, Star } from 'lucide-react'

interface Testimonial {
  id: string
  display_name: string
  display_text: string
  rating: number | null
  company: string | null
  title: string | null
  source: string
  status: string
  featured: number
  created_at: string
}

interface Widget {
  id: string
  name: string
}

type ModalMode = 'add' | 'request' | null

const inputStyle = {
  padding: '9px 12px',
  border: `1px solid ${colors.gray200}`,
  borderRadius: radius.md,
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box' as const,
  fontFamily: font.sans,
  color: colors.gray900,
  outline: 'none',
}

function Modal({ title, onClose, onSubmit, children, submitLabel, submitting }: {
  title: string
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  children: React.ReactNode
  submitLabel: string
  submitting?: boolean
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={onSubmit} style={{
        background: colors.white, borderRadius: radius.xl, padding: '32px',
        width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: colors.gray900 }}>{title}</h2>
        {children}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button type="submit" disabled={submitting} style={{ ...btn.primary, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Sending…' : submitLabel}
          </button>
          <button type="button" onClick={onClose} style={btn.outline}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

export default function Testimonials() {
  const { request } = useApi()
  const [planLimitError, setPlanLimitError] = useState<PlanLimitError | null>(null)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [modal, setModal] = useState<ModalMode>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  const [addForm, setAddForm] = useState({ display_name: '', display_text: '', rating: '', company: '', title: '', submitter_email: '' })
  const [reqForm, setReqForm] = useState({ email: '', name: '', widget_id: '', personal_note: '' })
  const [sending, setSending] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [tData, wData] = await Promise.all([
        request('/testimonials') as Promise<{ testimonials: Testimonial[] }>,
        request('/widgets') as Promise<{ widgets: Widget[] }>,
      ])
      setTestimonials(tData.testimonials)
      setWidgets(wData.widgets)
      if (wData.widgets.length > 0 && !reqForm.widget_id) {
        setReqForm(f => ({ ...f, widget_id: wData.widgets[0].id }))
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [])

  const filtered = filter === 'all' ? testimonials : testimonials.filter(t => t.status === filter)

  async function setStatus(id: string, status: string) {
    await request(`/testimonials/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
    setTestimonials(ts => ts.map(t => t.id === id ? { ...t, status } : t))
  }

  async function toggleFeatured(id: string, featured: number) {
    await request(`/testimonials/${id}`, { method: 'PATCH', body: JSON.stringify({ featured: featured ? 0 : 1 }) })
    setTestimonials(ts => ts.map(t => t.id === id ? { ...t, featured: featured ? 0 : 1 } : t))
  }

  async function deleteTestimonial(id: string) {
    if (!confirm('Delete this testimonial?')) return
    await request(`/testimonials/${id}`, { method: 'DELETE' })
    setTestimonials(ts => ts.filter(t => t.id !== id))
  }

  async function addManual(e: React.FormEvent) {
    e.preventDefault()
    try {
      await request('/testimonials', {
        method: 'POST',
        body: JSON.stringify({
          ...addForm,
          rating: addForm.rating ? Number(addForm.rating) : undefined,
          status: 'approved',
          source: 'manual',
        }),
      })
      setAddForm({ display_name: '', display_text: '', rating: '', company: '', title: '', submitter_email: '' })
      setModal(null)
      load()
      showToast('Testimonial added')
    } catch (err) {
      if (err instanceof ApiError && err.status === 402 && err.planLimit) {
        setModal(null)
        setPlanLimitError(err.planLimit)
      } else {
        showToast('Failed to add testimonial')
      }
    }
  }

  async function sendRequest(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      await request('/testimonials/request', {
        method: 'POST',
        body: JSON.stringify({
          email: reqForm.email,
          name: reqForm.name || undefined,
          widget_id: reqForm.widget_id,
          personal_note: reqForm.personal_note || undefined,
        }),
      })
      setReqForm(f => ({ ...f, email: '', name: '', personal_note: '' }))
      setModal(null)
      showToast(`Request sent to ${reqForm.email}`)
    } catch {
      showToast('Failed to send — please try again')
    } finally {
      setSending(false)
    }
  }

  async function exportCsv() {
    const params = new URLSearchParams()
    if (filter !== 'all') params.set('status', filter)
    const token = document.cookie.match(/vouch_token=([^;]+)/)?.[1] || ''
    const res = await fetch(`${API_URL}/api/testimonials/export/csv?${params}`, {
      credentials: 'include',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    })
    if (!res.ok) return alert('Export failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'testimonials.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const counts = {
    all: testimonials.length,
    pending: testimonials.filter(t => t.status === 'pending').length,
    approved: testimonials.filter(t => t.status === 'approved').length,
    rejected: testimonials.filter(t => t.status === 'rejected').length,
  }

  return (
    <div style={{ maxWidth: 860, fontFamily: font.sans }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20,
          background: colors.gray900, color: colors.white,
          padding: '10px 18px', borderRadius: radius.md,
          fontSize: 14, zIndex: 9999, boxShadow: shadow.lg,
        }}>
          {toast}
        </div>
      )}

      {planLimitError && <UpgradeModal error={planLimitError} onClose={() => setPlanLimitError(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: colors.gray900, letterSpacing: '-0.5px' }}>
            Testimonials
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: colors.gray400 }}>
            {testimonials.length} total · {counts.pending} pending review
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportCsv} style={btn.outline}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => setModal('request')} style={btn.outline}>
            <Mail size={14} /> Request
          </button>
          <button onClick={() => setModal('add')} style={btn.primary}>
            <Plus size={14} /> Add manually
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px',
            border: `1px solid ${filter === f ? colors.brand : colors.gray200}`,
            borderRadius: radius.full,
            background: filter === f ? colors.brandLight : colors.white,
            color: filter === f ? colors.brand : colors.gray600,
            cursor: 'pointer', fontSize: 13,
            fontWeight: filter === f ? 600 : 400,
            fontFamily: font.sans,
            transition: 'all 0.15s',
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Modal: Request */}
      {modal === 'request' && (
        <Modal title="Request a testimonial" onClose={() => setModal(null)} onSubmit={sendRequest} submitLabel="Send request" submitting={sending}>
          <p style={{ margin: '0 0 16px', color: colors.gray500, fontSize: 14 }}>
            Send an email to a customer asking them to share their experience. Links directly to your collection form.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input style={inputStyle} required type="email" placeholder="Customer email *"
              value={reqForm.email} onChange={e => setReqForm(f => ({ ...f, email: e.target.value }))} />
            <input style={inputStyle} type="text" placeholder="Customer name (optional)"
              value={reqForm.name} onChange={e => setReqForm(f => ({ ...f, name: e.target.value }))} />
            {widgets.length > 1 && (
              <select style={inputStyle} value={reqForm.widget_id} onChange={e => setReqForm(f => ({ ...f, widget_id: e.target.value }))}>
                {widgets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            )}
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Personal note (optional) — shown in the email"
              value={reqForm.personal_note}
              onChange={e => setReqForm(f => ({ ...f, personal_note: e.target.value }))} />
          </div>
        </Modal>
      )}

      {/* Modal: Add manually */}
      {modal === 'add' && (
        <Modal title="Add testimonial manually" onClose={() => setModal(null)} onSubmit={addManual} submitLabel="Add testimonial">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input style={inputStyle} required placeholder="Name *"
              value={addForm.display_name} onChange={e => setAddForm(f => ({ ...f, display_name: e.target.value }))} />
            <input style={inputStyle} placeholder="Email (optional)"
              value={addForm.submitter_email} onChange={e => setAddForm(f => ({ ...f, submitter_email: e.target.value }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input style={inputStyle} placeholder="Company (optional)"
                value={addForm.company} onChange={e => setAddForm(f => ({ ...f, company: e.target.value }))} />
              <input style={inputStyle} placeholder="Title (optional)"
                value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <select style={inputStyle} value={addForm.rating} onChange={e => setAddForm(f => ({ ...f, rating: e.target.value }))}>
              <option value="">No rating</option>
              {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} stars</option>)}
            </select>
            <textarea placeholder="Testimonial text *" required
              value={addForm.display_text} onChange={e => setAddForm(f => ({ ...f, display_text: e.target.value }))}
              style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} />
          </div>
        </Modal>
      )}

      {/* List */}
      {loading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: colors.gray400 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 20px', color: colors.gray400 }}>
          <MessageSquareEmpty />
          <p style={{ margin: '12px 0 4px', fontSize: 15, fontWeight: 500, color: colors.gray600 }}>
            No {filter !== 'all' ? filter : ''} testimonials yet.
          </p>
          <button onClick={() => setModal('request')} style={{
            background: 'none', border: 'none', color: colors.brand, cursor: 'pointer',
            fontSize: 13, fontFamily: font.sans, fontWeight: 500, padding: 0,
          }}>
            Request one from a customer →
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(t => <TestimonialCard key={t.id} t={t} onStatus={setStatus} onDelete={deleteTestimonial} onToggleFeatured={toggleFeatured} />)}
        </div>
      )}
    </div>
  )
}

function MessageSquareEmpty() {
  return (
    <div style={{ width: 48, height: 48, margin: '0 auto', opacity: 0.3 }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    </div>
  )
}

function TestimonialCard({ t, onStatus, onDelete, onToggleFeatured }: {
  t: Testimonial
  onStatus: (id: string, status: string) => void
  onDelete: (id: string) => void
  onToggleFeatured: (id: string, featured: number) => void
}) {
  const statusColor = t.status === 'approved' ? colors.success : t.status === 'pending' ? colors.warning : colors.gray300

  return (
    <div style={{
      background: colors.white,
      border: `1px solid ${colors.gray200}`,
      borderRadius: radius.lg,
      padding: '16px 20px',
      boxShadow: shadow.sm,
      borderLeft: `3px solid ${statusColor}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: colors.gray900 }}>{t.display_name}</span>
            {t.company && <span style={{ color: colors.gray400, fontSize: 13 }}>· {t.company}</span>}
            {t.title && <span style={{ color: colors.gray400, fontSize: 13 }}>· {t.title}</span>}
            {t.featured ? (
              <span style={{
                background: '#fef3c7', color: '#92400e',
                fontSize: 11, padding: '2px 7px', borderRadius: radius.full, fontWeight: 600,
              }}>
                Featured
              </span>
            ) : null}
          </div>
          {t.rating && (
            <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={13} fill={n <= t.rating! ? '#f59e0b' : 'none'} color={n <= t.rating! ? '#f59e0b' : colors.gray200} />
              ))}
            </div>
          )}
          <p style={{ margin: '0 0 8px', color: colors.gray700, fontSize: 14, lineHeight: 1.6 }}>
            {t.display_text}
          </p>
          <p style={{ margin: 0, color: colors.gray400, fontSize: 12 }}>
            {t.source} · {new Date(t.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, alignItems: 'flex-end' }}>
          {/* Status badge */}
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: radius.full,
            background: t.status === 'approved' ? colors.successLight : t.status === 'pending' ? colors.warningLight : colors.gray100,
            color: t.status === 'approved' ? colors.success : t.status === 'pending' ? colors.warning : colors.gray500,
          }}>
            {t.status}
          </span>

          {/* Primary actions */}
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            {t.status === 'pending' && (
              <>
                <button
                  onClick={() => onStatus(t.id, 'approved')}
                  title="Approve"
                  style={{
                    padding: '6px 12px', background: colors.success, color: colors.white,
                    border: 'none', borderRadius: radius.md, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: font.sans,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <CheckCircle2 size={13} /> Approve
                </button>
                <button
                  onClick={() => onStatus(t.id, 'rejected')}
                  title="Reject"
                  style={{
                    padding: '6px 10px', background: colors.white, color: colors.gray500,
                    border: `1px solid ${colors.gray200}`, borderRadius: radius.md,
                    fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: font.sans,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <XCircle size={13} /> Reject
                </button>
              </>
            )}
            {t.status === 'approved' && (
              <button
                onClick={() => onStatus(t.id, 'rejected')}
                style={{
                  padding: '6px 10px', background: colors.white, color: colors.gray500,
                  border: `1px solid ${colors.gray200}`, borderRadius: radius.md,
                  fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: font.sans,
                }}
              >
                Unpublish
              </button>
            )}
            {t.status === 'rejected' && (
              <button
                onClick={() => onStatus(t.id, 'approved')}
                style={{
                  padding: '6px 10px', background: colors.successLight, color: colors.success,
                  border: `1px solid ${colors.successBorder}`, borderRadius: radius.md,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: font.sans,
                }}
              >
                Restore
              </button>
            )}
          </div>

          {/* Secondary actions */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => onToggleFeatured(t.id, t.featured)}
              title={t.featured ? 'Remove from featured' : 'Mark as featured'}
              style={{
                padding: '5px 8px', background: 'none', color: t.featured ? '#f59e0b' : colors.gray300,
                border: 'none', borderRadius: radius.md, cursor: 'pointer', fontFamily: font.sans,
                display: 'flex', alignItems: 'center',
              }}
            >
              <Star size={14} fill={t.featured ? '#f59e0b' : 'none'} />
            </button>
            <button
              onClick={() => onDelete(t.id)}
              title="Delete"
              style={{
                padding: '5px 8px', background: 'none', color: colors.gray300,
                border: 'none', borderRadius: radius.md, cursor: 'pointer', fontFamily: font.sans,
                display: 'flex', alignItems: 'center',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = colors.danger)}
              onMouseLeave={e => (e.currentTarget.style.color = colors.gray300)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
