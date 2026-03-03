import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../lib/auth'

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
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
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
            padding: '9px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Create first widget
          </button>
        </div>
      )}

      {!loading && widgets.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: '#6b7280', fontWeight: 500 }}>NAME</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: '#6b7280', fontWeight: 500 }}>THEME</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: '#6b7280', fontWeight: 500 }}>LAYOUT</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: '#6b7280', fontWeight: 500 }}>CREATED</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, color: '#6b7280', fontWeight: 500 }}></th>
              </tr>
            </thead>
            <tbody>
              {widgets.map(w => (
                <tr key={w.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: '#111827' }}>
                    <Link to={`/widgets/${w.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{w.name}</Link>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280', textTransform: 'capitalize' }}>{w.theme || 'light'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280', textTransform: 'capitalize' }}>{w.layout || 'grid'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af' }}>{new Date(w.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <Link to={`/widgets/${w.id}`} style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}>Manage →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
