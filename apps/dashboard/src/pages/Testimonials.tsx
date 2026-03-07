import { useEffect, useState, useCallback } from 'react'
import { useApi, API_URL, ApiError } from '../lib/auth'
import type { PlanLimitError } from '../lib/auth'
import UpgradeModal from '../components/UpgradeModal'
import { colors, font, shadow, radius, card, btn, C, spacing, fontSize } from '../design'
import { CheckCircle2, XCircle, Trash2, Download, Upload, Mail, Plus, Star, Share2 } from 'lucide-react'

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

type ModalMode = 'add' | 'request' | 'import' | null

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvImporting, setCsvImporting] = useState(false)
  const [csvResult, setCsvResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)

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
    // Optimistic update
    const prev = testimonials.find(t => t.id === id)?.status
    setTestimonials(ts => ts.map(t => t.id === id ? { ...t, status } : t))
    try {
      await request(`/testimonials/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      const label = status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Updated'
      showToast(`${label} ✓`)
    } catch (err: unknown) {
      // Revert optimistic update on failure
      if (prev !== undefined) setTestimonials(ts => ts.map(t => t.id === id ? { ...t, status: prev } : t))
      const msg = err instanceof Error ? err.message : 'Failed to update status'
      showToast(`Error: ${msg}`)
    }
  }

  async function toggleFeatured(id: string, featured: number) {
    const newFeatured = featured ? 0 : 1
    setTestimonials(ts => ts.map(t => t.id === id ? { ...t, featured: newFeatured } : t))
    try {
      await request(`/testimonials/${id}`, { method: 'PATCH', body: JSON.stringify({ featured: newFeatured }) })
    } catch (err: unknown) {
      // Revert on failure
      setTestimonials(ts => ts.map(t => t.id === id ? { ...t, featured } : t))
      showToast('Failed to update featured status')
    }
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

  const allSelected = filtered.length > 0 && filtered.every(t => selectedIds.has(t.id))

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(t => t.id)))
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function bulkAction(action: 'approve' | 'reject' | 'delete') {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    const ids = Array.from(selectedIds)
    try {
      if (action === 'delete') {
        await request('/testimonials/bulk', { method: 'DELETE', body: JSON.stringify({ ids }) })
        setTestimonials(ts => ts.filter(t => !selectedIds.has(t.id)))
      } else {
        const status = action === 'approve' ? 'approved' : 'rejected'
        await request('/testimonials/bulk', { method: 'PATCH', body: JSON.stringify({ ids, status }) })
        setTestimonials(ts => ts.map(t => selectedIds.has(t.id) ? { ...t, status } : t))
      }
      setSelectedIds(new Set())
      setToast(`${ids.length} testimonial${ids.length > 1 ? 's' : ''} ${action === 'delete' ? 'deleted' : action + 'd'}`)
    } finally {
      setBulkLoading(false)
    }
  }

  async function exportCsv() {
    const params = new URLSearchParams()
    if (filter !== 'all') params.set('status', filter)
    const token = document.cookie.match(/proof_token=([^;]+)/)?.[1] || ''
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


  async function importCsv() {
    if (!csvFile) return
    setCsvImporting(true)
    setCsvResult(null)
    try {
      const fd = new FormData()
      fd.append('csv', csvFile)
      const res = await request('/testimonials/import-csv', { method: 'POST', body: fd }) as Response
      const data = await res.json() as { imported: number; skipped: number; errors: string[] }
      setCsvResult(data)
      if (data.imported > 0) {
        // Refresh testimonials list
        const r = await request('/testimonials') as Response
        const json = await r.json() as { testimonials: Testimonial[] }
        setTestimonials(json.testimonials || [])
        showToast(`Imported ${data.imported} testimonial${data.imported !== 1 ? 's' : ''}`)
      }
    } catch (e) {
      setCsvResult({ imported: 0, skipped: 0, errors: [(e as Error).message] })
    } finally {
      setCsvImporting(false)
    }
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
          <button onClick={() => { setCsvFile(null); setCsvResult(null); setModal('import') }} style={btn.outline}>
            <Upload size={14} /> Import CSV
          </button>
          <button onClick={() => setModal('request')} style={btn.outline}>
            <Mail size={14} /> Request
          </button>
          <button onClick={() => setModal('add')} style={btn.primary}>
            <Plus size={14} /> Add manually
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8' }}>{selectedIds.size} selected</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => bulkAction('approve')} disabled={bulkLoading} style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Approve</button>
          <button onClick={() => bulkAction('reject')} disabled={bulkLoading} style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Reject</button>
          <button onClick={() => bulkAction('delete')} disabled={bulkLoading} style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Delete</button>
          <button onClick={() => setSelectedIds(new Set())} style={{ padding: '4px 8px', fontSize: 12, background: 'none', border: '1px solid #93c5fd', borderRadius: 6, cursor: 'pointer', color: '#3b82f6' }}>Clear</button>
        </div>
      )}

      {/* Select all row */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} style={{ width: 16, height: 16, cursor: 'pointer' }} />
          <span style={{ fontSize: 12, color: '#6b7280' }}>{allSelected ? 'Deselect all' : `Select all ${filtered.length}`}</span>
        </div>
      )}

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


      {/* Modal: Import CSV */}
      {modal === 'import' && (
        <Modal
          title="Import testimonials from CSV"
          onClose={() => setModal(null)}
          onSubmit={csvResult ? () => setModal(null) : importCsv}
          submitLabel={csvResult ? 'Done' : csvImporting ? 'Importing…' : 'Import'}
          submitting={csvImporting}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!csvResult ? (
              <>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                  Upload a CSV file with a header row. Required columns: <code>name</code>, <code>text</code>.<br />
                  Optional: <code>rating</code>, <code>company</code>, <code>title</code>, <code>email</code>, <code>status</code> (approved/pending/rejected).
                </p>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={e => setCsvFile(e.target.files?.[0] ?? null)}
                  style={{ fontSize: 13, fontFamily: 'inherit' }}
                />
                {csvFile && (
                  <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
                    Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ padding: '12px 16px', background: csvResult.imported > 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 8, border: `1px solid ${csvResult.imported > 0 ? '#bbf7d0' : '#fecaca'}` }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: csvResult.imported > 0 ? '#15803d' : '#dc2626' }}>
                    {csvResult.imported > 0 ? `✓ Imported ${csvResult.imported} testimonial${csvResult.imported !== 1 ? 's' : ''}` : 'Import failed'}
                  </p>
                  {csvResult.skipped > 0 && (
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Skipped {csvResult.skipped} row{csvResult.skipped !== 1 ? 's' : ''} (missing required fields or errors)</p>
                  )}
                </div>
                {csvResult.errors.length > 0 && (
                  <div style={{ maxHeight: 140, overflow: 'auto', background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 6, padding: 10 }}>
                    {csvResult.errors.map((e, i) => (
                      <p key={i} style={{ margin: '0 0 4px', fontSize: 12, color: '#dc2626', fontFamily: 'monospace' }}>{e}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
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
          {filtered.map(t => <TestimonialCard key={t.id} t={t} onStatus={setStatus} onDelete={deleteTestimonial} onToggleFeatured={toggleFeatured} selected={selectedIds.has(t.id)} onSelect={toggleSelect} />)}
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


function shareOnTwitter(t: Testimonial) {
  const maxLen = 240
  let quote = t.display_text
  if (quote.length > 120) quote = quote.slice(0, 119) + '…'
  const text = `"${quote}" — ${t.display_name}${t.company ? `, ${t.company}` : ''}\n\nCollected with SocialProof ✨ socialproof.dev`
  const trimmed = text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(trimmed)}`, '_blank', 'noopener,noreferrer,width=600,height=400')
}

function TestimonialCard({ t, onStatus, onDelete, onToggleFeatured, selected, onSelect }: {
  t: Testimonial
  onStatus: (id: string, status: string) => void
  onDelete: (id: string) => void
  onToggleFeatured: (id: string, featured: number) => void
  selected?: boolean
  onSelect?: (id: string) => void
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
        {/* Checkbox */}
        {onSelect && (
          <div style={{ paddingTop: 2 }}>
            <input type="checkbox" checked={!!selected} onChange={() => onSelect(t.id)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
          </div>
        )}
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
            {t.status === 'approved' && (
              <button
                onClick={() => shareOnTwitter(t)}
                title="Share on Twitter/X"
                style={{
                  padding: '5px 8px', background: 'none', color: colors.gray400,
                  border: 'none', borderRadius: radius.md, cursor: 'pointer', fontFamily: font.sans,
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#1da1f2')}
                onMouseLeave={e => (e.currentTarget.style.color = colors.gray400)}
              >
                <Share2 size={14} />
              </button>
            )}
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
