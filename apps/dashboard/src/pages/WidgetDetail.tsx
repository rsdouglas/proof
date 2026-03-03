import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useApi } from '../lib/auth'

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


type Platform = 'html' | 'webflow' | 'shopify' | 'squarespace' | 'wordpress'

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'html', label: 'HTML / Custom' },
  { id: 'webflow', label: 'Webflow' },
  { id: 'shopify', label: 'Shopify' },
  { id: 'squarespace', label: 'Squarespace' },
  { id: 'wordpress', label: 'WordPress' },
]

const INSTALL_STEPS: Record<Platform, { title: string; steps: string[] }> = {
  html: {
    title: 'Any HTML website',
    steps: [
      'Open your HTML file or template in a code editor.',
      'Paste the snippet just before the closing </body> tag.',
      'Save and upload. The widget appears immediately.',
    ],
  },
  webflow: {
    title: 'Webflow',
    steps: [
      'Open your Webflow project and go to Project Settings → Custom Code.',
      'Paste the snippet into the "Footer Code" field.',
      'Click Save Changes, then Publish your site.',
      'Tip: you can also use an Embed element on a specific page instead of site-wide.',
    ],
  },
  shopify: {
    title: 'Shopify',
    steps: [
      'In your Shopify admin, go to Online Store → Themes.',
      'Click Actions → Edit Code on your active theme.',
      'Open theme.liquid (in the Layout folder).',
      'Paste the snippet just before the closing </body> tag.',
      'Click Save. The widget is now live on all pages.',
    ],
  },
  squarespace: {
    title: 'Squarespace',
    steps: [
      'In your Squarespace dashboard, go to Settings → Advanced → Code Injection.',
      'Paste the snippet into the "Footer" field.',
      'Click Save. Changes go live immediately.',
      'Note: Code Injection requires a Business plan or higher.',
    ],
  },
  wordpress: {
    title: 'WordPress',
    steps: [
      'Install the "Insert Headers and Footers" plugin (free, by WPCode).',
      'Go to Settings → Insert Headers and Footers → Scripts in Footer.',
      'Paste the snippet and click Save.',
      'Alternatively, add directly to your theme footer.php before </body>.',
    ],
  },
}

function InstallGuide({ embedCode }: { embedCode: string }) {
  const [platform, setPlatform] = useState<Platform>('html')
  const guide = INSTALL_STEPS[platform]
  return (
    <div>
      {/* Platform tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => setPlatform(p.id)}
            style={{
              padding: '5px 10px', fontSize: 12, borderRadius: 4, cursor: 'pointer',
              border: '1px solid',
              borderColor: platform === p.id ? '#2563eb' : '#d1d5db',
              background: platform === p.id ? '#eff6ff' : '#fff',
              color: platform === p.id ? '#1d4ed8' : '#374151',
              fontWeight: platform === p.id ? 600 : 400,
              transition: 'all 0.1s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      {/* Steps */}
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '14px 16px' }}>
        <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: '#374151' }}>{guide.title}</p>
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          {guide.steps.map((step, i) => (
            <li key={i} style={{ fontSize: 12, color: '#4b5563', marginBottom: 6, lineHeight: 1.5 }}>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
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
  }, [id, request])

  useEffect(() => { loadData() }, [loadData])

  async function updateWidget() {
    if (!widget) return
    setSaving(true)
    try {
      await request(`/widgets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, theme, layout }),
      })
      setWidget(w => w ? { ...w, name, theme, layout } : w)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function setStatus(testimonialId: string, status: 'approved' | 'rejected') {
    setActionLoading(testimonialId)
    try {
      await request(`/testimonials/${testimonialId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setTestimonials(ts => ts.map(t => t.id === testimonialId ? { ...t, status } : t))
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setActionLoading(null)
    }
  }

  async function deleteWidget() {
    if (!confirm(`Delete widget "${widget?.name}"? This cannot be undone.`)) return
    try {
      await request(`/widgets/${id}`, { method: 'DELETE' })
      navigate('/widgets')
    } catch (e) {
      alert((e as Error).message)
    }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: '#9ca3af' }}>Loading…</div>
  )

  if (!widget) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <p style={{ color: '#6b7280' }}>Widget not found.</p>
      <Link to="/widgets" style={{ color: '#2563eb' }}>← Back to widgets</Link>
    </div>
  )

  const filtered = testimonials.filter(t => t.status === tab)
  const WIDGET_URL = `https://cdn.socialproof.dev`
  const isPopup = layout === 'popup'
  const embedCode = isPopup
    ? `<!-- Proof activity popup: shows recent testimonials as notifications -->\n<div data-widget-popup="${widget.id}" data-popup-position="bottom-left"></div>\n<script src="${WIDGET_URL}/widget.js" async></script>`
    : `<div id="proof-widget" data-widget-id="${widget.id}" data-layout="${layout}"></div>\n<script src="${WIDGET_URL}/widget.js" async></script>`
  const collectUrl = `https://socialproof.dev/collect/${widget.slug || widget.id}`
  const wallUrl = `https://api.socialproof.dev/wall/${widget.slug || widget.id}`

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: 14 }}>
        <Link to="/widgets" style={{ color: '#6b7280', textDecoration: 'none' }}>Widgets</Link>
        <span>/</span>
        <span style={{ color: '#111827', fontWeight: 500 }}>{widget.name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Left: Testimonials */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ borderBottom: '1px solid #e5e7eb', display: 'flex' }}>
              {(['pending', 'approved', 'rejected'] as Tab[]).map(t => {
                const count = testimonials.filter(x => x.status === t).length
                const active = tab === t
                return (
                  <button key={t} onClick={() => setTab(t)} style={{
                    padding: '12px 20px', border: 'none', background: 'none',
                    borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
                    color: active ? '#2563eb' : '#6b7280', fontWeight: active ? 600 : 400,
                    cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
                    textTransform: 'capitalize',
                  }}>
                    {t} <span style={{
                      background: active ? '#dbeafe' : '#f3f4f6',
                      color: active ? '#1d4ed8' : '#9ca3af',
                      borderRadius: 10, padding: '1px 7px', fontSize: 11, marginLeft: 4,
                    }}>{count}</span>
                  </button>
                )
              })}
            </div>

            {/* List */}
            <div>
              {filtered.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                  No {tab} testimonials yet.
                  {tab === 'pending' && <><br /><span style={{ fontSize: 13, marginTop: 8, display: 'block' }}>Share the collection link to start gathering reviews.</span></>}
                </div>
              )}
              {filtered.map(t => (
                <div key={t.id} style={{
                  padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{t.display_name}</span>
                      <Stars rating={t.rating} />
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
                      "{t.display_text}"
                    </p>
                  </div>
                  {tab === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => setStatus(t.id, 'approved')}
                        disabled={actionLoading === t.id}
                        style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => setStatus(t.id, 'rejected')}
                        disabled={actionLoading === t.id}
                        style={{ padding: '6px 12px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 5, cursor: 'pointer', fontSize: 12 }}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}
                  {tab === 'approved' && (
                    <button
                      onClick={() => setStatus(t.id, 'rejected')}
                      disabled={actionLoading === t.id}
                      style={{ padding: '5px 10px', background: 'none', color: '#9ca3af', border: '1px solid #e5e7eb', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                    >
                      Unapprove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Collection link */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>Collection link</h3>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6b7280' }}>Share this with customers to collect reviews</p>
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 5, padding: '8px 10px', fontSize: 12, color: '#374151', wordBreak: 'break-all', marginBottom: 8, fontFamily: 'monospace' }}>
              {collectUrl}
            </div>
            <CopyButton text={collectUrl} label="Copy link" />
          </div>

          {/* Embed code + install guide */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>Embed code</h3>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6b7280' }}>Copy the snippet below and paste it into your site</p>
            <pre style={{
              background: '#1e1e2e', color: '#cdd6f4', borderRadius: 6, padding: 12,
              fontSize: 11, overflow: 'auto', margin: '0 0 8px', lineHeight: 1.6,
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>{embedCode}</pre>
            <CopyButton text={embedCode} label="Copy snippet" />

            {/* Platform install guide */}
            <div style={{ marginTop: 20 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#374151' }}>Installation guide</h4>
              <InstallGuide embedCode={embedCode} />
            </div>
          </div>

          {/* Public wall */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>Public testimonial wall</h3>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6b7280' }}>A shareable page showing all approved testimonials</p>
            <a
              href={wallUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, color: '#2563eb', wordBreak: 'break-all', display: 'block', marginBottom: 8 }}
            >{wallUrl}</a>
            <CopyButton text={wallUrl} label="Copy wall URL" />
          </div>

          {/* Widget config */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>Widget settings</h3>

            <label style={{ display: 'block', fontSize: 12, color: '#374151', marginBottom: 4, fontWeight: 500 }}>Name</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 5, fontSize: 13, boxSizing: 'border-box', marginBottom: 12, fontFamily: 'inherit' }}
            />

            <label style={{ display: 'block', fontSize: 12, color: '#374151', marginBottom: 4, fontWeight: 500 }}>Theme</label>
            <select value={theme} onChange={e => setTheme(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 5, fontSize: 13, marginBottom: 12, fontFamily: 'inherit' }}>
              {THEME_OPTIONS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
            </select>

            <label style={{ display: 'block', fontSize: 12, color: '#374151', marginBottom: 4, fontWeight: 500 }}>Layout</label>
            <select value={layout} onChange={e => setLayout(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 5, fontSize: 13, marginBottom: 16, fontFamily: 'inherit' }}>
              {LAYOUT_OPTIONS.map(o => <option key={o} value={o}>{LAYOUT_LABELS[o] || o}</option>)}
            </select>

            <button onClick={updateWidget} disabled={saving} style={{
              width: '100%', padding: '9px', background: saving ? '#93c5fd' : '#2563eb',
              color: '#fff', border: 'none', borderRadius: 5, fontWeight: 600, fontSize: 13,
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>

          {/* Danger zone */}
          <div style={{ background: '#fff', border: '1px solid #fee2e2', borderRadius: 8, padding: 20 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#dc2626' }}>Danger zone</h3>
            <button onClick={deleteWidget} style={{
              width: '100%', padding: '8px', background: '#fff', color: '#dc2626',
              border: '1px solid #fca5a5', borderRadius: 5, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
            }}>
              Delete widget
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
