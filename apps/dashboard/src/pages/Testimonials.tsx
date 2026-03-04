import { useEffect, useState, useCallback } from 'react'
import { useApi, API_URL } from '../lib/auth'

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

export default function Testimonials() {
  const { request } = useApi()
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
    const [tData, wData] = await Promise.all([
      request('/testimonials') as Promise<{ testimonials: Testimonial[] }>,
      request('/widgets') as Promise<{ widgets: Widget[] }>,
    ])
    setTestimonials(tData.testimonials)
    setWidgets(wData.widgets)
    if (wData.widgets.length > 0 && !reqForm.widget_id) {
      setReqForm(f => ({ ...f, widget_id: wData.widgets[0].id }))
    }
    setLoading(false)
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

  async function copy() {
    const data = await request('/testimonials') as { testimonials: Testimonial[] }
    const rows = data.testimonials.map(t =>
      [t.display_name, t.company || '', t.title || '', t.rating || '', t.display_text, t.status, t.featured ? 'yes' : 'no', t.created_at].join(',')
    )
    const csv = ['Name,Company,Title,Rating,Text,Status,Featured,Date', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'testimonials.csv'; a.click()
    URL.revokeObjectURL(url)
  }


  async function exportCsv() {
    const params = new URLSearchParams()
    if (filter !== 'all') params.set('status', filter)
    // Use fetch with credentials, then trigger download
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

  const btnStyle = (primary = false) => ({
    padding: '8px 14px', border: primary ? 'none' : '1px solid #d1d5db',
    borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13,
    background: primary ? '#2563eb' : '#fff', color: primary ? '#fff' : '#374151',
  })

  const inputStyle = { padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: '100%', boxSizing: 'border-box' as const }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#111827', color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 14, zIndex: 9999 }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Testimonials</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copy} style={btnStyle()}>Export CSV</button>
          <button onClick={() => setModal('request')} style={btnStyle()}>✉ Request testimonial</button>
          <button onClick={() => setModal('add')} style={btnStyle(true)}>+ Add manually</button>        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6,
            background: filter === f ? '#2563eb' : '#fff', color: filter === f ? '#fff' : '#374151',
            cursor: 'pointer', fontSize: 13, fontWeight: filter === f ? 600 : 400,
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Modal: Request testimonial */}
      {modal === 'request' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={sendRequest} style={{ background: '#fff', borderRadius: 12, padding: 32, width: 460, boxShadow: '0 10px 40px rgba(0,0,0,.2)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18 }}>Request a testimonial</h2>
            <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: 14 }}>
              Send an email to a customer asking them to share their experience. It links directly to your collection form.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <input style={inputStyle} required type="email" placeholder="Customer email *" value={reqForm.email}
                onChange={e => setReqForm(f => ({ ...f, email: e.target.value }))} />
              <input style={inputStyle} type="text" placeholder="Customer name (optional)" value={reqForm.name}
                onChange={e => setReqForm(f => ({ ...f, name: e.target.value }))} />
              {widgets.length > 1 && (
                <select style={inputStyle} value={reqForm.widget_id} onChange={e => setReqForm(f => ({ ...f, widget_id: e.target.value }))}>
                  {widgets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              )}
              <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="Personal note (optional) — shown in the email" value={reqForm.personal_note}
                onChange={e => setReqForm(f => ({ ...f, personal_note: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={sending} style={btnStyle(true)}>{sending ? 'Sending…' : 'Send request'}</button>
              <button type="button" onClick={() => setModal(null)} style={btnStyle()}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add manually */}
      {modal === 'add' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={addManual} style={{ background: '#fff', borderRadius: 12, padding: 32, width: 460, boxShadow: '0 10px 40px rgba(0,0,0,.2)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18 }}>Add testimonial manually</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <input style={{ ...inputStyle, gridColumn: '1' }} placeholder="Name *" required value={addForm.display_name}
                onChange={e => setAddForm(f => ({ ...f, display_name: e.target.value }))} />
              <input style={{ ...inputStyle, gridColumn: '2' }} placeholder="Email (opt)" value={addForm.submitter_email}
                onChange={e => setAddForm(f => ({ ...f, submitter_email: e.target.value }))} />
              <input style={inputStyle} placeholder="Company (opt)" value={addForm.company}
                onChange={e => setAddForm(f => ({ ...f, company: e.target.value }))} />
              <input style={inputStyle} placeholder="Title (opt)" value={addForm.title}
                onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <select value={addForm.rating} onChange={e => setAddForm(f => ({ ...f, rating: e.target.value }))}
              style={{ ...inputStyle, marginBottom: 10 }}>
              <option value="">No rating</option>
              {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} stars</option>)}
            </select>
            <textarea placeholder="Testimonial text *" required value={addForm.display_text}
              onChange={e => setAddForm(f => ({ ...f, display_text: e.target.value }))}
              style={{ ...inputStyle, minHeight: 100, marginBottom: 16, resize: 'vertical', fontFamily: 'inherit' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={btnStyle(true)}>Add</button>
              <button type="button" onClick={() => setModal(null)} style={btnStyle()}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p style={{ margin: 0, fontSize: 15 }}>No {filter !== 'all' ? filter : ''} testimonials yet.</p>
          <p style={{ margin: '8px 0 0', fontSize: 13 }}>
            <button onClick={() => setModal('request')} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}>
              Request one from a customer
            </button>
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(t => (
            <div key={t.id} style={{
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px',
              borderLeft: t.status === 'approved' ? '3px solid #10b981' : t.status === 'pending' ? '3px solid #f59e0b' : '3px solid #ef4444',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <strong style={{ fontSize: 15 }}>{t.display_name}</strong>
                    {t.company && <span style={{ color: '#6b7280', fontSize: 13 }}>· {t.company}</span>}
                    {t.title && <span style={{ color: '#6b7280', fontSize: 13 }}>· {t.title}</span>}
                    {t.featured ? <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 11, padding: '1px 6px', borderRadius: 9999, fontWeight: 600 }}>Featured</span> : null}
                  </div>
                  {t.rating && (
                    <div style={{ fontSize: 14, color: '#f59e0b', marginBottom: 4 }}>{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</div>
                  )}
                  <p style={{ margin: 0, color: '#374151', fontSize: 14, lineHeight: 1.5 }}>{t.display_text}</p>
                  <p style={{ margin: '6px 0 0', color: '#9ca3af', fontSize: 12 }}>
                    {t.source} · {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {t.status === 'pending' && (
                    <>
                      <button onClick={() => setStatus(t.id, 'approved')} style={{ ...btnStyle(), color: '#059669', borderColor: '#059669', fontSize: 12 }}>Approve</button>
                      <button onClick={() => setStatus(t.id, 'rejected')} style={{ ...btnStyle(), color: '#dc2626', borderColor: '#dc2626', fontSize: 12 }}>Reject</button>
                    </>
                  )}
                  {t.status === 'approved' && (
                    <button onClick={() => setStatus(t.id, 'rejected')} style={{ ...btnStyle(), fontSize: 12 }}>Unpublish</button>
                  )}
                  {t.status === 'rejected' && (
                    <button onClick={() => setStatus(t.id, 'approved')} style={{ ...btnStyle(), fontSize: 12 }}>Restore</button>
                  )}
                  <button onClick={() => toggleFeatured(t.id, t.featured)} style={{ ...btnStyle(), fontSize: 12 }}>
                    {t.featured ? '★ Unfeature' : '☆ Feature'}
                  </button>
                  <button onClick={() => deleteTestimonial(t.id)} style={{ ...btnStyle(), color: '#dc2626', fontSize: 12 }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
