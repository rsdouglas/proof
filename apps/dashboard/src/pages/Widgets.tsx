import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi, ApiError } from '../lib/auth'
import type { PlanLimitError } from '../lib/auth'
import { Toast } from '../components/Toast'
import UpgradeModal from '../components/UpgradeModal'
import { colors, font, radius, shadow, btn } from '../design'
import { Plus, LayoutGrid } from 'lucide-react'

interface Widget {
  id: string
  name: string
  slug: string
  theme: string
  layout: string
  created_at: string
  testimonial_count?: number
}

const LAYOUT_OPTIONS = [
  { value: 'grid', label: 'Grid' },
  { value: 'list', label: 'List' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'popup', label: 'Popup' },
  { value: 'badge', label: 'Badge' },
]

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'minimal', label: 'Minimal' },
]

const selectStyle: React.CSSProperties = {
  padding: '9px 12px',
  border: `1px solid ${colors.gray200}`,
  borderRadius: radius.md,
  fontSize: 14,
  fontFamily: font.sans,
  color: colors.gray900,
  background: colors.white,
  cursor: 'pointer',
  outline: 'none',
}

export default function Widgets() {
  const { request } = useApi()
  const [planLimitError, setPlanLimitError] = useState<PlanLimitError | null>(null)
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newLayout, setNewLayout] = useState('grid')
  const [newTheme, setNewTheme] = useState('light')
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLayout, setEditLayout] = useState('grid')
  const [editTheme, setEditTheme] = useState('light')
  const [saving, setSaving] = useState(false)

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
        body: JSON.stringify({ name: newName.trim(), layout: newLayout, theme: newTheme }),
      })
      setWidgets(ws => [data.widget, ...ws])
      setNewName('')
      setNewLayout('grid')
      setNewTheme('light')
      setShowForm(false)
      setToast({ message: 'Widget created!', type: 'success' })
    } catch (err) {
      if (err instanceof ApiError && err.status === 402 && err.planLimit) {
        setShowForm(false)
        setPlanLimitError(err.planLimit)
      } else {
        setToast({ message: (err as Error).message, type: 'error' })
      }
    } finally {
      setCreating(false)
    }
  }

  function startEdit(w: Widget) {
    setEditingId(w.id)
    setEditLayout(w.layout || 'grid')
    setEditTheme(w.theme || 'light')
  }

  async function saveEdit(widgetId: string) {
    setSaving(true)
    try {
      await request(`/widgets/${widgetId}`, {
        method: 'PATCH',
        body: JSON.stringify({ layout: editLayout, theme: editTheme }),
      })
      setWidgets(ws => ws.map(w => w.id === widgetId ? { ...w, layout: editLayout, theme: editTheme } : w))
      setEditingId(null)
      setToast({ message: 'Widget updated!', type: 'success' })
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, fontFamily: font.sans }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {planLimitError && <UpgradeModal error={planLimitError} onClose={() => setPlanLimitError(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: colors.gray900, letterSpacing: '-0.5px' }}>
            Widgets
          </h1>
          <p style={{ margin: 0, color: colors.gray400, fontSize: 14 }}>Embed social proof anywhere on your site</p>
        </div>
        <button onClick={() => setShowForm(f => !f)} style={btn.primary}>
          <Plus size={15} /> Create widget
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={createWidget} style={{
          background: colors.white, border: `1px solid ${colors.gray200}`,
          borderRadius: radius.lg, padding: '20px', marginBottom: 20,
          boxShadow: shadow.sm,
        }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <input
              value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Widget name (e.g. Homepage testimonials)"
              required autoFocus
              style={{
                flex: 1, padding: '9px 12px',
                border: `1px solid ${colors.gray200}`,
                borderRadius: radius.md, fontSize: 14,
                fontFamily: font.sans, color: colors.gray900, outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' as const }}>
            <label style={{ fontSize: 13, color: colors.gray600, minWidth: 50 }}>Layout</label>
            <select value={newLayout} onChange={e => setNewLayout(e.target.value)} style={selectStyle}>
              {LAYOUT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <label style={{ fontSize: 13, color: colors.gray600, minWidth: 45 }}>Theme</label>
            <select value={newTheme} onChange={e => setNewTheme(e.target.value)} style={selectStyle}>
              {THEME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button type="submit" disabled={creating} style={btn.primary}>
                {creating ? 'Creating…' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={btn.outline}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {loading && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: colors.gray400 }}>Loading…</div>
      )}

      {!loading && widgets.length === 0 && (
        <div style={{
          padding: '48px 0', textAlign: 'center',
          background: colors.white, border: `1px solid ${colors.gray200}`,
          borderRadius: radius.xl, boxShadow: shadow.sm,
        }}>
          <LayoutGrid size={36} color={colors.gray300} style={{ marginBottom: 12 }} />
          <p style={{ margin: '0 0 4px', fontWeight: 600, color: colors.gray700 }}>No widgets yet</p>
          <p style={{ margin: '0 0 16px', color: colors.gray400, fontSize: 14 }}>Create your first widget to start embedding testimonials</p>
          <button onClick={() => setShowForm(true)} style={btn.primary}><Plus size={15} /> Create widget</button>
        </div>
      )}

      {!loading && widgets.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {widgets.map(w => (
            <div
              key={w.id}
              style={{
                background: colors.white, border: `1px solid ${colors.gray200}`,
                borderRadius: radius.lg, padding: '16px 20px',
                boxShadow: shadow.sm,
                transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
              }}
              onMouseEnter={el => {
                const t = el.currentTarget as HTMLDivElement
                t.style.borderColor = colors.brand
                t.style.boxShadow = shadow.md
                t.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={el => {
                const t = el.currentTarget as HTMLDivElement
                t.style.borderColor = colors.gray200
                t.style.boxShadow = shadow.sm
                t.style.transform = 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 10 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' as const }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: colors.gray900 }}>{w.name}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: '0.5px',
                      textTransform: 'uppercase' as const,
                      background: colors.brandLight, color: colors.brand,
                      borderRadius: radius.sm, padding: '2px 7px',
                    }}>
                      {w.layout || 'grid'}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: '0.5px',
                      textTransform: 'uppercase' as const,
                      background: (w.theme || 'light') === 'dark' ? '#1a1a2e' : colors.gray100,
                      color: (w.theme || 'light') === 'dark' ? '#e2e8f0' : colors.gray600,
                      borderRadius: radius.sm, padding: '2px 7px',
                    }}>
                      {w.theme || 'light'}
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: colors.gray300 }}>
                    {w.testimonial_count ?? 0} testimonials · Created {new Date(w.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
                  {editingId === w.id ? (
                    <>
                      <select value={editLayout} onChange={e => setEditLayout(e.target.value)} style={{ ...selectStyle, fontSize: 12, padding: '5px 8px' }}>
                        {LAYOUT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <select value={editTheme} onChange={e => setEditTheme(e.target.value)} style={{ ...selectStyle, fontSize: 12, padding: '5px 8px' }}>
                        {THEME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <button
                        onClick={() => saveEdit(w.id)}
                        disabled={saving}
                        style={{ ...btn.primary, fontSize: 12, padding: '5px 12px' }}
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{ ...btn.outline, fontSize: 12, padding: '5px 10px' }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEdit(w)}
                      style={{ ...btn.outline, fontSize: 12, padding: '5px 10px' }}
                    >
                      Edit
                    </button>
                  )}
                  <Link
                    to={`/widgets/${w.id}`}
                    style={{
                      fontSize: 13, fontWeight: 500, color: colors.brand,
                      textDecoration: 'none', padding: '5px 12px',
                      border: `1px solid ${colors.brand}`,
                      borderRadius: radius.md,
                    }}
                  >
                    Manage →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
