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

export default function Widgets() {
  const { request } = useApi()
  const [planLimitError, setPlanLimitError] = useState<PlanLimitError | null>(null)
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
          display: 'flex', gap: 10, boxShadow: shadow.sm,
        }}>
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
          <button type="submit" disabled={creating} style={btn.primary}>
            {creating ? 'Creating…' : 'Create'}
          </button>
          <button type="button" onClick={() => setShowForm(false)} style={btn.outline}>
            Cancel
          </button>
        </form>
      )}

      {loading && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: colors.gray400 }}>Loading…</div>
      )}

      {!loading && widgets.length === 0 && (
        <div style={{
          background: colors.white,
          border: `2px dashed ${colors.gray200}`,
          borderRadius: radius.lg, padding: 64, textAlign: 'center',
        }}>
          <div style={{ width: 48, height: 48, margin: '0 auto 16px', color: colors.gray300 }}>
            <LayoutGrid size={48} />
          </div>
          <h3 style={{ margin: '0 0 8px', color: colors.gray700, fontSize: 16, fontWeight: 700 }}>No widgets yet</h3>
          <p style={{ margin: '0 0 20px', color: colors.gray500, fontSize: 14 }}>
            Create a widget to display testimonials on your site.
          </p>
          <button onClick={() => setShowForm(true)} style={btn.primary}>
            <Plus size={15} /> Create your first widget
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {widgets.map(w => (
          <Link key={w.id} to={`/widgets/${w.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
            <div
              style={{
                background: colors.white, border: `1px solid ${colors.gray200}`,
                borderRadius: radius.lg, padding: 20,
                transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
                boxShadow: shadow.sm,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = colors.brandBorder
                el.style.boxShadow = `0 4px 16px rgba(79,70,229,0.12)`
                el.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = colors.gray200
                el.style.boxShadow = shadow.sm
                el.style.transform = 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.gray900 }}>{w.name}</h3>
                <span style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: radius.full, fontWeight: 600,
                  background: colors.brandLight, color: colors.brand,
                }}>
                  {w.layout || 'grid'}
                </span>
              </div>
              <div style={{ fontSize: 13, color: colors.gray500, marginBottom: 10 }}>
                Theme: {w.theme || 'light'} · {w.testimonial_count ?? 0} testimonials
              </div>
              <div style={{ fontSize: 12, color: colors.gray400 }}>
                Created {new Date(w.created_at).toLocaleDateString()}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
