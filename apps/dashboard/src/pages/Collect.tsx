import { useEffect, useState, useCallback } from 'react'
import { useApi } from '../lib/auth'

interface CollectionForm {
  id: string
  name: string
  active: number
  created_at: string
}

const API_URL = import.meta.env.VITE_API_URL || 'https://api.useproof.com'

export default function Collect() {
  const { request } = useApi()
  const [forms, setForms] = useState<CollectionForm[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [formName, setFormName] = useState('')
  const [loading, setLoading] = useState(true)
  const [linkCopied, setLinkCopied] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await request('/collection-forms') as { forms: CollectionForm[] }
    setForms(data.forms)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [])

  async function createForm(e: React.FormEvent) {
    e.preventDefault()
    await request('/collection-forms', { method: 'POST', body: JSON.stringify({ name: formName }) })
    setFormName(''); setShowCreate(false)
    load()
  }

  async function deleteForm(id: string) {
    if (!confirm('Delete this collection form?')) return
    await request(`/collection-forms/${id}`, { method: 'DELETE' })
    setForms(fs => fs.filter(f => f.id !== id))
  }

  function copyLink(id: string) {
    const url = `${API_URL}/submit/${id}`
    navigator.clipboard.writeText(url)
    setLinkCopied(id)
    setTimeout(() => setLinkCopied(null), 2000)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700 }}>Collect Testimonials</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>Share a form link with your customers to collect reviews.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
          + New form
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createForm} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 12px' }}>Create collection form</h3>
          <input value={formName} onChange={e => setFormName(e.target.value)} required placeholder="Form name (e.g. 'Post-purchase review')"
            style={{ display: 'block', width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 12, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Create</button>
            <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>Cancel</button>
          </div>
        </form>
      )}

      {loading && <p style={{ color: '#9ca3af' }}>Loading…</p>}

      {forms.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📝</div>
          <p style={{ color: '#6b7280', margin: 0 }}>No collection forms yet. Create one and share the link with customers.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
        {forms.map(f => (
          <div key={f.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <strong style={{ fontSize: 15 }}>{f.name}</strong>
              <span style={{ fontSize: 12, color: f.active ? '#10b981' : '#9ca3af' }}>{f.active ? 'Active' : 'Inactive'}</span>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: 4, padding: '8px 12px', fontFamily: 'monospace', fontSize: 12, color: '#6b7280', marginBottom: 12, wordBreak: 'break-all' }}>
              {`${API_URL}/submit/${f.id}`}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => copyLink(f.id)} style={{
                flex: 1, padding: '6px', background: linkCopied === f.id ? '#10b981' : '#2563eb',
                color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13
              }}>
                {linkCopied === f.id ? '✓ Copied!' : '🔗 Copy link'}
              </button>
              <a href={`${API_URL}/submit/${f.id}`} target="_blank" rel="noreferrer" style={{
                padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 4, textDecoration: 'none',
                color: '#374151', fontSize: 13, background: '#fff'
              }}>
                Preview ↗
              </a>
              <button onClick={() => deleteForm(f.id)} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', background: '#fff', color: '#6b7280', fontSize: 13 }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
