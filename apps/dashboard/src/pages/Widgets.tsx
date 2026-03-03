import { useEffect, useState, useCallback } from 'react'
import { useApi } from '../lib/auth'

interface Widget {
  id: string
  name: string
  type: string
  active: number
  created_at: string
}

const WIDGET_TYPES = ['grid', 'carousel', 'badge']
const API_URL = import.meta.env.VITE_API_URL || 'https://api.useproof.com'

export default function Widgets() {
  const { request } = useApi()
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('grid')
  const [loading, setLoading] = useState(true)
  const [embedCopied, setEmbedCopied] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await request('/widgets') as { widgets: Widget[] }
    setWidgets(data.widgets)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [])

  async function createWidget(e: React.FormEvent) {
    e.preventDefault()
    await request('/widgets', { method: 'POST', body: JSON.stringify({ name, type }) })
    setName(''); setType('grid'); setShowCreate(false)
    load()
  }

  async function deleteWidget(id: string) {
    if (!confirm('Delete this widget?')) return
    await request(`/widgets/${id}`, { method: 'DELETE' })
    setWidgets(ws => ws.filter(w => w.id !== id))
  }

  function copyEmbed(widgetId: string) {
    const code = `<!-- Proof Widget -->
<div data-proof-widget="${widgetId}"></div>
<script src="${API_URL}/w/${widgetId}.js"><\/script>`
    navigator.clipboard.writeText(code)
    setEmbedCopied(widgetId)
    setTimeout(() => setEmbedCopied(null), 2000)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Widgets</h1>
        <button onClick={() => setShowCreate(!showCreate)} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
          + New widget
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createWidget} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px' }}>Create widget</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Homepage testimonials"
                style={{ display: 'block', width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Type</label>
              <select value={type} onChange={e => setType(e.target.value)} style={{ display: 'block', width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }}>
                {WIDGET_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Create</button>
            <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>Cancel</button>
          </div>
        </form>
      )}

      {loading && <p style={{ color: '#9ca3af' }}>Loading…</p>}

      {widgets.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🧩</div>
          <p style={{ color: '#6b7280', margin: 0 }}>No widgets yet. Create one to embed testimonials on your site.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
        {widgets.map(w => (
          <div key={w.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <strong style={{ fontSize: 15 }}>{w.name}</strong>
                <span style={{ marginLeft: 8, padding: '2px 8px', background: '#f3f4f6', borderRadius: 4, fontSize: 12, color: '#6b7280' }}>{w.type}</span>
              </div>
              <span style={{ fontSize: 12, color: w.active ? '#10b981' : '#9ca3af' }}>{w.active ? 'Active' : 'Inactive'}</span>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: 4, padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: '#6b7280', marginBottom: 12, wordBreak: 'break-all' }}>
              {`<div data-proof-widget="${w.id}"></div>\n<script src="${API_URL}/w/${w.id}.js"></script>`}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => copyEmbed(w.id)} style={{
                flex: 1, padding: '6px', background: embedCopied === w.id ? '#10b981' : '#2563eb',
                color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13
              }}>
                {embedCopied === w.id ? '✓ Copied!' : 'Copy embed code'}
              </button>
              <button onClick={() => deleteWidget(w.id)} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', background: '#fff', color: '#6b7280', fontSize: 13 }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
