import { useEffect, useState, useCallback } from 'react'
import { useApi } from '../lib/auth'
import { Link2, Copy, Check, Lightbulb, Mail, AlertTriangle, RefreshCw } from 'lucide-react'
import { colors, radius, shadow, font, btn, card } from '../design'

interface CollectionForm {
  id: string
  name: string
  active: number
  created_at: string
}

export default function Collect() {
  const { request } = useApi()
  const [form, setForm] = useState<CollectionForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await request('/collection-forms') as { forms: CollectionForm[] }
      setForm(data.forms?.[0] ?? null)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function copyLink() {
    if (!form) return
    const url = `https://socialproof.dev/c/${form.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const collectionUrl = form ? `https://socialproof.dev/c/${form.id}` : ''

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: colors.gray900, letterSpacing: '-0.5px' }}>
          Collect Testimonials
        </h1>
        <p style={{ margin: 0, color: colors.gray400, fontSize: 14 }}>
          Share your collection link with customers to gather testimonials.
        </p>
      </div>

      {loading && (
        <div style={{ ...card, textAlign: 'center', padding: 48 }}>
          <p style={{ color: colors.gray400, margin: 0 }}>Loading…</p>
        </div>
      )}

      {!loading && form && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Main link card */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: radius.md,
                background: colors.brandLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Link2 size={18} color={colors.brand} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.gray900 }}>
                  Your collection link
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: colors.gray400 }}>
                  Send this to customers — they fill a short form, you approve
                </p>
              </div>
            </div>

            {/* URL display + copy */}
            <div style={{
              display: 'flex', gap: 8, alignItems: 'center',
              background: colors.gray50, border: `1px solid ${colors.gray200}`,
              borderRadius: radius.md, padding: '10px 14px',
              marginBottom: 14,
            }}>
              <span style={{
                flex: 1, fontSize: 13, color: colors.gray700,
                fontFamily: font.mono, wordBreak: 'break-all',
              }}>
                {collectionUrl}
              </span>
              <button
                onClick={copyLink}
                style={{
                  ...btn.primary,
                  background: copied ? colors.success : colors.brand,
                  gap: 6,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>

            <a
              href={collectionUrl}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 13, color: colors.gray400, textDecoration: 'none' }}
            >
              Preview form ↗
            </a>
          </div>

          {/* How to use */}
          <div style={{
            background: colors.brandLight,
            border: `1px solid ${colors.brandBorder}`,
            borderRadius: radius.lg,
            padding: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Lightbulb size={15} color={colors.brand} />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.brand }}>
                How to use your link
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { step: '1', text: 'Copy the link above' },
                { step: '2', text: 'Send it to customers — in an email, after a purchase, or on your thank-you page' },
                { step: '3', text: 'Testimonials arrive in your dashboard under Testimonials → approve the ones you love' },
                { step: '4', text: 'Once approved, they automatically appear in any widget you embed on your site' },
              ].map(item => (
                <div key={item.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: radius.full,
                    background: colors.brand, color: colors.white,
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 1,
                  }}>{item.step}</span>
                  <span style={{ fontSize: 14, color: colors.gray700, lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick share suggestions */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Mail size={15} color={colors.gray400} />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray900 }}>
                Quick share ideas
              </h3>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: colors.gray400 }}>
              Copy and paste these into your messages
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <QuickSnippet
                label="After a purchase"
                text={`Hi [name], thanks for your order! If you have a minute, I'd love to hear what you think: ${collectionUrl}`}
              />
              <QuickSnippet
                label="Email signature"
                text={`Enjoying [product]? Share your experience: ${collectionUrl}`}
              />
            </div>
          </div>
        </div>
      )}

      {!loading && !form && (
        <div style={{ ...card, padding: 48, textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: radius.lg,
            background: colors.warningLight, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={22} color={colors.warning} />
          </div>
          <p style={{ color: colors.gray500, margin: '0 0 20px', fontSize: 14 }}>
            No collection link found. This shouldn't happen — try refreshing.
          </p>
          <button onClick={load} style={btn.primary}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}
    </div>
  )
}

function QuickSnippet({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{
      background: colors.gray50, border: `1px solid ${colors.gray200}`,
      borderRadius: radius.md, padding: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: colors.gray600 }}>{label}</span>
        <button
          onClick={copy}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', background: copied ? colors.successLight : colors.white,
            color: copied ? colors.success : colors.gray600,
            border: `1px solid ${copied ? colors.successBorder : colors.gray200}`,
            borderRadius: radius.sm, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: font.sans, transition: 'all 0.15s',
          }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: colors.gray600, lineHeight: 1.5 }}>{text}</p>
    </div>
  )
}
