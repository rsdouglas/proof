import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../lib/auth'
import { Toast } from '../components/Toast'

interface Widget {
  id: string
  name: string
  slug: string
  theme: string
  layout: string
  created_at: string
  testimonial_count?: number
}

export default function Widgets() {
  const { request } = useApi()
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)

  useEffect(() => {
    request<{ widgets: Widget[] }>('/widgets')
      .then(d => setWidgets(d.widgets))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [request])

  async function createWidget(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const data = await request<{ widget: Widget }>('/widgets', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim() }),
      })
      setWidgets(ws => [data.widget, ...ws])
      setNewName('')
      setShowForm(false)
      setToast({ message: 'Widget created!', type: 'success' })
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>Widgets</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>Embed social proof anywhere on your site</p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          style={{ padding: '9px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          + Create widget
        </button>
      </div>

      {showForm && (
        <form onSubmit={createWidget} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20, display: 'flex', gap: 10 }}>
          <input
            value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Widget name (e.g. Homepage testimonials)"
            required
            autoFocus
            style={{ flex: 1, padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, fontFamily: 'inherit' }}
          />
          <button type="submit" disabled={creating} style={{
            padding: '9px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {creating ? 'Creating…' : 'Create'}
          </button>
          <button type="button" onClick={() => setShowForm(false)} style={{
            padding: '9px 14px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Cancel
          </button>
        </form>
      )}

      {loading && <p style={{ color: '#9ca3af', textAlign: 'center', padding: 40 }}>Loading…</p>}

      {!loading && widgets.length === 0 && (
        <div style={{ background: '#fff', border: '1px dashed #d1d5db', borderRadius: 8, padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🧩</div>
          <h3 style={{ margin: '0 0 8px', color: '#374151' }}>No widgets yet</h3>
          <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: 14 }}>Create your first widget to start collecting testimonials.</p>
          <button onClick={() => setShowForm(true)} style={{
            padding: '9px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
          }}>
            + Create your first widget
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {widgets.map(w => (
          <Link key={w.id} to={`/widgets/${w.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
            <div style={{
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20,
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#2563eb'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(37,99,235,0.1)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>{w.name}</h3>
                <span style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 500,
                  background: '#eff6ff', color: '#2563eb',
                }}>{w.layout || 'grid'}</span>
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                Theme: {w.theme || 'light'} · {w.testimonial_count ?? 0} testimonials
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>
                Created {new Date(w.created_at).toLocaleDateString()}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
