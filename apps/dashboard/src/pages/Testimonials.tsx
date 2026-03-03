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

export default function Testimonials() {
  const { request } = useApi()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({ display_name: '', display_text: '', rating: '', company: '', title: '', submitter_email: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const data = await request('/testimonials') as { testimonials: Testimonial[] }
    setTestimonials(data.testimonials)
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
        ...form,
        rating: form.rating ? Number(form.rating) : undefined,
        status: 'approved',
        source: 'manual',
      })
    })
    setForm({ display_name: '', display_text: '', rating: '', company: '', title: '', submitter_email: '' })
    setShowAdd(false)
    load()
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Testimonials</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportCsv} style={{ padding: '8px 16px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
            ↓ Export CSV
          </button>
          <button onClick={() => setShowAdd(!showAdd)} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
            + Add manually
          </button>
        </div>
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

      {/* Add form */}
      {showAdd && (
        <form onSubmit={addManual} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px' }}>Add testimonial</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input placeholder="Name *" value={form.display_name} required onChange={e => setForm(f => ({...f, display_name: e.target.value}))} style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
            <input placeholder="Email (opt)" value={form.submitter_email} onChange={e => setForm(f => ({...f, submitter_email: e.target.value}))} style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
            <input placeholder="Company (opt)" value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))} style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
            <input placeholder="Title (opt)" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
          </div>
          <select value={form.rating} onChange={e => setForm(f => ({...f, rating: e.target.value}))} style={{ display: 'block', width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 8 }}>
            <option value="">No rating</option>
            {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} stars</option>)}
          </select>
          <textarea placeholder="Testimonial text *" value={form.display_text} required onChange={e => setForm(f => ({...f, display_text: e.target.value}))}
            style={{ display: 'block', width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, minHeight: 100, marginBottom: 12, resize: 'vertical', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Add</button>
            <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>Cancel</button>
          </div>
        </form>
      )}

      {loading && <p style={{ color: '#9ca3af' }}>Loading…</p>}

      {filtered.length === 0 && !loading && (
        <p style={{ color: '#9ca3af', textAlign: 'center', padding: 40 }}>No testimonials in this category.</p>
      )}

      {filtered.map(t => (
        <div key={t.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <strong>{t.display_name}</strong>
              {t.company && <span style={{ color: '#6b7280', fontSize: 13, marginLeft: 8 }}>{t.title ? `${t.title} @ ${t.company}` : t.company}</span>}
              {t.rating && <span style={{ marginLeft: 8, color: '#f59e0b', fontSize: 13 }}>{'★'.repeat(t.rating)}</span>}
              <span style={{ marginLeft: 8, padding: '2px 6px', background: '#f3f4f6', borderRadius: 4, fontSize: 11, color: '#6b7280' }}>{t.source}</span>
            </div>
            <span style={{
              padding: '2px 8px', borderRadius: 4, fontSize: 12,
              background: t.status === 'approved' ? '#d1fae5' : t.status === 'rejected' ? '#fee2e2' : '#fef3c7',
              color: t.status === 'approved' ? '#065f46' : t.status === 'rejected' ? '#991b1b' : '#92400e'
            }}>{t.status}</span>
          </div>
          <p style={{ margin: '0 0 12px', color: '#374151', fontSize: 14, lineHeight: 1.5 }}>{t.display_text}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {t.status !== 'approved' && <button onClick={() => setStatus(t.id, 'approved')} style={{ padding: '4px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>✓ Approve</button>}
            {t.status !== 'rejected' && <button onClick={() => setStatus(t.id, 'rejected')} style={{ padding: '4px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>✗ Reject</button>}
            <button onClick={() => toggleFeatured(t.id, t.featured)} style={{ padding: '4px 12px', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', fontSize: 13, background: t.featured ? '#fef3c7' : '#fff' }}>
              {t.featured ? '⭐ Featured' : '☆ Feature'}
            </button>
            <button onClick={() => deleteTestimonial(t.id)} style={{ padding: '4px 12px', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', fontSize: 13, background: '#fff', color: '#6b7280', marginLeft: 'auto' }}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
