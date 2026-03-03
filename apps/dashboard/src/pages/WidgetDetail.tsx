import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useApi } from '../lib/auth'
import { Toast } from '../components/Toast'

interface Testimonial {
  id: string
  display_name: string
  display_text: string
  rating: number | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

interface Widget {
  id: string
  name: string
  slug: string
  theme: string
  layout: string
  created_at: string
}

type Tab = 'pending' | 'approved' | 'rejected'

const THEME_OPTIONS = ['light', 'dark', 'minimal']
const LAYOUT_OPTIONS = ['grid', 'list', 'carousel', 'popup']
const LAYOUT_LABELS: Record<string, string> = {
  grid: 'Grid — display testimonials in a card grid',
  list: 'List — vertical stack of testimonials',
  carousel: 'Carousel — auto-scrolling slideshow',
  popup: 'Activity Popup — notification bubble in page corner',
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} style={{
      padding: '6px 12px', background: copied ? '#10b981' : '#f3f4f6',
      border: '1px solid #e5e7eb', borderRadius: 5, cursor: 'pointer', fontSize: 12,
      color: copied ? '#fff' : '#374151', fontWeight: 500, transition: 'all .15s',
    }}>
      {copied ? '✓ Copied!' : (label || 'Copy')}
    </button>
  )
}

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return null
  return <span style={{ color: '#f59e0b', fontSize: 13 }}>{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
}

export default function WidgetDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { request } = useApi()
  const [widget, setWidget] = useState<Widget | null>(null)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [tab, setTab] = useState<Tab>('pending')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [theme, setTheme] = useState('light')
  const [layout, setLayout] = useState('grid')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)

  const showToast = (message: string, type: 'error' | 'success' = 'error') =>
    setToast({ message, type })

  const loadData = useCallback(async () => {
    try {
      const [wRes, tRes] = await Promise.all([
        request<{ widget: Widget }>(`/widgets/${id}`),
        request<{ testimonials: Testimonial[] }>(`/testimonials?widget_id=${id}`),
      ])
      setWidget(wRes.widget)
      setName(wRes.widget.name)
      setTheme(wRes.widget.theme || 'light')
      setLayout(wRes.widget.layout || 'grid')
      setTestimonials(tRes.testimonials)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  async function saveSettings() {
    setSaving(true)
    try {
      await request(`/widgets/${id}`, { method: 'PATCH', body: { name, theme, layout } })
      setWidget(w => w ? { ...w, name, theme, layout } : w)
      showToast('Settings saved!', 'success')
    } catch (e) {
      showToast((e as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(testimonialId: string, newStatus: 'approved' | 'rejected' | 'pending') {
    setActionLoading(testimonialId)
    try {
      await request(`/testimonials/${testimonialId}`, { method: 'PATCH', body: { status: newStatus } })
      setTestimonials(ts => ts.map(t => t.id === testimonialId ? { ...t, status: newStatus } : t))
      showToast(`Testimonial ${newStatus}`, 'success')
    } catch (e) {
      showToast((e as Error).message, 'error')
    } finally {
      setActionLoading(null)
    }
  }

  async function deleteWidget() {
    if (!confirm('Delete this widget? This cannot be undone.')) return
    try {
      await request(`/widgets/${id}`, { method: 'DELETE' })
      navigate('/widgets')
    } catch (e) {
      showToast((e as Error).message, 'error')
    }
  }

  const embedCode = widget?
    `<script src="https://proof.vouch.app/widget.js" data-widget="${widget.id}"></script>` : ''

  const wallUrl = widget ? `https://proof.vouch.app/wall/${widget.id}` : ''

  const filtered = testimonials.filter(t => t.status === tab)

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      Loading...
    </div>
  )

  if (!widget) return <div>Widget not found</div>

  return (
    <div>
      {Toast && toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      { /* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <Link to="/widgets" style={{ color: '#6374af', textDecoration: 'none', fontSize: 14 }}>
← Widgets
        </Link>
        <span style={{ color: '#d1d5db' }}>/</span>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{widget.name}</h1>
        <span style={{ background: '#f3f4f6', padding: '4px 10px', borderRadius: 12, fontSize: 12, color: '#6b7280' }}>
          {widget.layout} • {widget.theme}
        </span>
      </div>

      {/* Embed Code */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Embed Code</h2>
        <pre style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '12px 16px', fontSize: 12, overflowX: 'auto', margin: '0 0 12px' }}>{embedCode}</pre>
        <div style={{ display: 'flex', gap: 8 }}>
          <CopyButton text={embedCode} label="Copy embed code" />
          <CopyButton text={wallUrl} label="Copy wall URL" />
        </div>
      </div>

      {/* Settings */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Settings</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Widget name</label>
          <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Theme</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {THEME_OPTIONS.map(t => (
              <button key={t} onClick={() => setTheme(t)} style={{
                padding: '6px 16px', borderRadius: 6,
                background: theme === t ? '#2563eb' : '#f3f4f6',
                color: theme === t ? '#fff' : '#374151',
                border: theme === t ? '1px solid #2563eb' : '1px solid #e5e7eb',
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
              }}>
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Layout</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LAYOUT_OPTIONS.map(l => (
              <label key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="radio" name="layout" value={l} checked={layout === l} onChange={() => setLayout(l)} />
                <span style={{ fontSize: 13 }}>{LAYOUT_LABELS[l]}</span>
              </label>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={saveSettings} disabled={saving} style={{
            padding: '8px 16px', background: '#2563eb', color: '#fff',
            border: 'none', borderRadius: 6, cursor: saving ? 'default' : 'pointer',
            fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Saving...' : 'Save settings'}
          </button>
          <button onClick={deleteWidget} style={{
            padding: '8px 16px', background: '#fff', color: '#ef4444',
            border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            Delete widget
          </button>
        </div>
      </div>

      {/* Testimonials tabs */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
          {['Pending', 'Approved', 'Rejected'].map(label => {
            const value = label.toLowerCase() as Tab
            const count = testimonials.filter(t => t.status === value).length
            return (
              <button key={value} onClick={() => setTab(value)} style={{
                padding: '6px 12px', borderRadius: 6,
                background: tab === value ? '#2563eb' : 'transparent',
                color: tab === value ? '#fff' : '#6b7280',
                border: 'unset', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              }}>
                {label} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 ? (
          <div style={{ color: '#9ca3af', fontSize: 14, padding: '32px 0', textAlign: 'center' }}>
            No {tab} testimonials yet
          </div>
        ) : (
          <div>
            {filtered.map(t => (
              <div key={t.id} style={{ borderBottom: '1px solid #f3f4f6', padding: '16px 0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{t.display_name}</div>
                  <Stars rating={t.rating} />
                  <div style={{ fontSize: 14, color: '#374151', marginTop: 6, lineHeight: 1.5 }}>"{s.t.text}"</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{new Date(t.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {tab !== 'approved' && (
                    <button onClick={() => updateStatus(t.id, 'approved')} disabled={actionLoading === t.id} style={{
                      padding: '4px 10px', background: '#dcfce7', color: '#166534',
                      border: '1px solid #a7f3d0', borderRadius: 5, cursor: 'pointer', fontSize: 12,
                    }}>
                      {actionLoading === t.id ? '...' : '☓ Approve'}
                    </button>
                  )}
                  {tab !== 'rejected' && (
                    <button onClick={() => updateStatus(t.id, 'rejected')} disabled={actionLoading === t.id} style={{
                      padding: '4px 10px', background: '#fef2f2', color: '#ef4444',
                      border: '1px solid #fecaca', borderRadius: 5, cursor: 'pointer', fontSize: 12,
                    }}>
                      {actionLoading === t.id ? '...' : '✗ Reject'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
