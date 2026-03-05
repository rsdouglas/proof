import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useApi } from '../lib/auth'
import { Toast } from '../components/Toast'
import { Copy, Check, Trash2, Save, Code, Globe, Settings } from 'lucide-react'
import { colors, radius, shadow, font, btn, card } from '../design'

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
  embed_verified_at?: string | null
  embed_domain?: string | null
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
      padding: '6px 12px', background: copied ? colors.success : colors.gray100,
      border: '1px solid #e5e7eb', borderRadius: radius.sm, cursor: 'pointer', fontSize: 12,
      color: copied ? colors.white : colors.gray700, fontWeight: 500, transition: 'all .15s',
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
              padding: '5px 10px', fontSize: 12, borderRadius: radius.sm, cursor: 'pointer',
              border: '1px solid',
              borderColor: platform === p.id ? colors.brand : colors.gray300,
              background: platform === p.id ? colors.brandLight : colors.white,
              color: platform === p.id ? colors.brandHover : colors.gray700,
              fontWeight: platform === p.id ? 600 : 400,
              transition: 'all 0.1s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      {/* Steps */}
      <div style={{ background: colors.gray50, border: '1px solid #e5e7eb', borderRadius: radius.sm, padding: '14px 16px' }}>
        <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: colors.gray700 }}>{guide.title}</p>
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          {guide.steps.map((step, i) => (
            <li key={i} style={{ fontSize: 12, color: colors.gray600, marginBottom: 6, lineHeight: 1.5 }}>
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
  return <span style={{ color: colors.warning, fontSize: 13 }}>{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
}


function WidgetEmbedPreview({ widgetId, layout, theme, wallUrl }: {
  widgetId: string
  layout: string
  theme: string
  wallUrl: string
}) {
  const WIDGET_SCRIPT = 'https://widget.socialproof.dev/v1/widget.js'
  const isPopup = layout === 'popup'

  // Build srcdoc for the embed preview
  const bgColor = theme === 'dark' ? '#0f0f1a' : '#ffffff'
  const paddingStyle = layout === 'list' ? 'padding: 16px;' : 'padding: 16px;'

  const srcdoc = isPopup
    ? `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body { margin: 0; background: ${bgColor}; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; color: #888; font-size: 13px; }
      </style></head><body>
        <div style="text-align:center;padding:20px;">
          <div style="font-size:28px;margin-bottom:8px;">💬</div>
          <div>Activity Popup appears in the bottom corner of your website.</div>
          <div style="margin-top:8px;font-size:11px;opacity:0.6">It cannot be previewed inline — embed the snippet to see it live.</div>
        </div>
      </body></html>`
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body { margin: 0; background: ${bgColor}; ${paddingStyle} }
      </style></head><body>
        <div id="socialproof-widget" data-widget-id="${widgetId}" data-layout="${layout}" data-theme="${theme}"></div>
        <script src="${WIDGET_SCRIPT}" async></script>
      </body></html>`

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: colors.gray700 }}>
          Live preview
          <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 400, color: colors.gray400 }}>(reflects current layout &amp; theme)</span>
        </label>
        <a href={wallUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: colors.brand }}>Open wall page ↗</a>
      </div>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: radius.sm, overflow: 'hidden', background: bgColor }}>
        <iframe
          key={`${widgetId}-${layout}-${theme}`}
          srcDoc={srcdoc}
          style={{ width: '100%', height: 360, border: 'none', display: 'block' }}
          title="Widget preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 11, color: colors.gray400 }}>
        Preview reloads when you change layout or theme. Approve testimonials to see them here.
      </p>
    </div>
  )
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
      showToast('Widget saved!', 'success')
    } catch (e) {
      showToast((e as Error).message)
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
      showToast((e as Error).message)
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
      showToast((e as Error).message)
    }
  }

  if (loading) return <div style={{ padding: 40, color: colors.gray500 }}>Loading…</div>
  if (!widget) return <div style={{ padding: 40 }}><Link to="/widgets">← Back to widgets</Link> — Widget not found.</div>

  const WIDGET_URL = `https://widget.socialproof.dev/v1`
  const isPopup = layout === 'popup'
  const embedCode = isPopup
    ? `<!-- SocialProof activity popup: shows recent testimonials as notifications -->\n<div data-widget-popup="${widget.id}" data-popup-position="bottom-left"></div>\n<script src="${WIDGET_URL}/widget.js" async></script>`
    : `<div id="socialproof-widget" data-widget-id="${widget.id}" data-layout="${layout}"></div>\n<script src="${WIDGET_URL}/widget.js" async></script>`
  const collectUrl = `https://socialproof.dev/collect/${widget.slug || widget.id}`
  const wallUrl = `https://api.socialproof.dev/wall/${widget.slug || widget.id}`
  const badgeUrl = `https://api.socialproof.dev/wall/${widget.slug || widget.id}/badge`
  const badgeHtml = `<a href="${wallUrl}">\n  <img src="${badgeUrl}" alt="${widget.name} reviews" width="200" height="56">\n</a>`

  const filtered = testimonials.filter(t => t.status === tab)

  const tabStyle = (t: Tab) => ({
    padding: '8px 16px',
    borderRadius: radius.sm,
    border: 'none',
    cursor: 'pointer',
    fontWeight: tab === t ? 600 : 400,
    background: tab === t ? colors.brand : 'transparent',
    color: tab === t ? colors.white : colors.gray500,
    fontSize: 14,
  })

  return (
    <div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to="/widgets" style={{ color: colors.gray500, textDecoration: 'none', fontSize: 14 }}>← Widgets</Link>
        <span style={{ color: colors.gray300 }}>/</span>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{widget.name}</h1>
        {widget.embed_verified_at ? (
          <span title={`Verified live on ${widget.embed_domain || 'your site'} · Last seen ${new Date(widget.embed_verified_at).toLocaleDateString()}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
            borderRadius: 12, background: '#d1fae5', color: '#065f46',
            fontSize: 11, fontWeight: 600, marginLeft: 8,
          }}>
            ✓ Live on {widget.embed_domain || 'your site'}
          </span>
        ) : (
          <span title="We haven't detected this widget on your site yet. Paste the snippet and load your page." style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
            borderRadius: 12, background: colors.gray100, color: colors.gray500,
            fontSize: 11, fontWeight: 600, marginLeft: 8,
          }}>
            ○ Not detected yet
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Settings */}
        <div style={{ background: colors.white, border: '1px solid #e5e7eb', borderRadius: radius.md, padding: 24 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Widget settings</h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: colors.gray700 }}>Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: radius.sm, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: colors.gray700 }}>Theme</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {THEME_OPTIONS.map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  style={{
                    padding: '6px 14px', borderRadius: radius.sm, border: '1px solid',
                    borderColor: theme === t ? colors.brand : colors.gray300,
                    background: theme === t ? colors.brandLight : colors.white,
                    color: theme === t ? colors.brand : colors.gray700,
                    cursor: 'pointer', fontSize: 13, fontWeight: theme === t ? 600 : 400,
                  }}
                >{t}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: colors.gray700 }}>Layout</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {LAYOUT_OPTIONS.map(l => (
                <label key={l} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="radio" checked={layout === l} onChange={() => setLayout(l)} style={{ marginTop: 2 }} />
                  <span style={{ color: layout === l ? colors.brand : colors.gray700 }}>{LAYOUT_LABELS[l]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Embed code + install guide */}
          <div style={{ background: colors.white, border: '1px solid #e5e7eb', borderRadius: radius.md, padding: 20 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>Embed code</h3>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: colors.gray500 }}>Copy the snippet below and paste it into your site</p>
            <pre style={{
              background: '#1e1e2e', color: '#cdd6f4', borderRadius: radius.sm, padding: 12,
              fontSize: 11, overflow: 'auto', margin: '0 0 8px', lineHeight: 1.6,
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>{embedCode}</pre>
            <CopyButton text={embedCode} label="Copy snippet" />

            {/* Platform install guide */}
            <div style={{ marginTop: 20 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: colors.gray700 }}>Installation guide</h4>
              <InstallGuide embedCode={embedCode} />
            </div>
          </div>

          {/* Public wall */}
          <div style={{ background: colors.white, border: '1px solid #e5e7eb', borderRadius: radius.md, padding: 20 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>Public testimonial wall</h3>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: colors.gray500 }}>A shareable page showing all approved testimonials</p>
            <a
              href={wallUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, color: colors.brand, wordBreak: 'break-all', display: 'block', marginBottom: 8 }}
            >{wallUrl}</a>
            <CopyButton text={wallUrl} label="Copy wall URL" />
          </div>



          {/* Danger zone */}
          <div style={{ background: colors.white, border: '1px solid #fee2e2', borderRadius: radius.md, padding: 20 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: colors.danger }}>Danger zone</h3>
            <button onClick={deleteWidget} style={{
              width: '100%', padding: '8px', background: colors.white, color: colors.danger,
              border: '1px solid #fca5a5', borderRadius: radius.sm, cursor: 'pointer', fontSize: 13, fontFamily: font.sans,
            }}>
              Delete widget
            </button>
          </div>
        </div>

        {/* Embed */}
        <div style={{ background: colors.white, border: '1px solid #e5e7eb', borderRadius: radius.md, padding: 24 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Embed &amp; share</h2>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: colors.gray700 }}>Embed snippet</label>
              <CopyButton text={embedCode} label="Copy code" />
            </div>
            <pre style={{ background: colors.gray50, border: '1px solid #e5e7eb', borderRadius: radius.sm, padding: 12, fontSize: 12, overflow: 'auto', margin: 0, color: colors.gray700, whiteSpace: 'pre-wrap' }}>{embedCode}</pre>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: colors.gray700 }}>Collection form URL</label>
              <CopyButton text={collectUrl} />
            </div>
            <div style={{ background: colors.gray50, border: '1px solid #e5e7eb', borderRadius: radius.sm, padding: 10, fontSize: 12, color: colors.gray700, wordBreak: 'break-all' }}>{collectUrl}</div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: colors.gray700 }}>Public testimonial wall</label>
              <CopyButton text={wallUrl} />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, background: colors.gray50, border: '1px solid #e5e7eb', borderRadius: radius.sm, padding: 10, fontSize: 12, color: colors.gray700, wordBreak: 'break-all' }}>{wallUrl}</div>
              <a href={wallUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: colors.brand, whiteSpace: 'nowrap' }}>Open ↗</a>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: colors.gray700 }}>Rating badge <span style={{ fontWeight: 400, color: colors.gray400 }}>(embed on your site)</span></label>
              <CopyButton text={badgeHtml} label="Copy badge HTML" />
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: colors.gray50, border: '1px solid #e5e7eb', borderRadius: radius.sm, padding: 10 }}>
              <img src={badgeUrl} alt="Rating badge preview" width={160} height={44} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 11, color: colors.gray500 }}>Embed this on your website or email signature. Updates automatically.</div>
            </div>
          </div>

          {/* Live preview */}
          <WidgetEmbedPreview widgetId={widget.id} layout={layout} theme={theme} wallUrl={wallUrl} />
        </div>
      </div>

      {/* Testimonials */}
      <div style={{ background: colors.white, border: '1px solid #e5e7eb', borderRadius: radius.md, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Testimonials</h2>
          <a href={collectUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: colors.brand, textDecoration: 'none' }}>+ Share form ↗</a>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
          {(['pending', 'approved', 'rejected'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)} ({testimonials.filter(x => x.status === t).length})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ color: colors.gray400, fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
            {tab === 'pending' ? 'No pending testimonials. Share your collection form to get some!' : `No ${tab} testimonials.`}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(t => (
              <div key={t.id} style={{ border: '1px solid #e5e7eb', borderRadius: radius.md, padding: 16, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{t.display_name}</span>
                    <Stars rating={t.rating} />
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: colors.gray700, lineHeight: 1.5 }}>{t.display_text}</p>
                  <div style={{ fontSize: 12, color: colors.gray400, marginTop: 6 }}>
                    {new Date(t.created_at).toLocaleDateString()}
                  </div>
                </div>
                {tab === 'pending' && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => setStatus(t.id, 'approved')}
                      disabled={actionLoading === t.id}
                      style={{ padding: '6px 12px', background: colors.success, color: colors.white, border: 'none', borderRadius: radius.sm, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                    >✓ Approve</button>
                    <button
                      onClick={() => setStatus(t.id, 'rejected')}
                      disabled={actionLoading === t.id}
                      style={{ padding: '6px 12px', background: colors.white, color: colors.danger, border: '1px solid #fecaca', borderRadius: radius.sm, cursor: 'pointer', fontSize: 12 }}
                    >✗ Reject</button>
                  </div>
                )}
                {tab === 'approved' && (
                  <button
                    onClick={() => setStatus(t.id, 'rejected')}
                    disabled={actionLoading === t.id}
                    style={{ padding: '6px 12px', background: colors.white, color: colors.gray500, border: '1px solid #e5e7eb', borderRadius: radius.sm, cursor: 'pointer', fontSize: 12 }}
                  >Un-approve</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
