import { useEffect, useState, useCallback } from 'react'
import { useApi } from '../lib/auth'

interface CollectionForm {
  id: string
  name: string
  active: number
  created_at: string
}

const API_URL = import.meta.env.VITE_API_URL || 'https://api.socialproof.dev'

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
        <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700 }}>Collect Testimonials</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 15 }}>
          Share your collection link with customers to gather testimonials.
        </p>
      </div>

      {loading && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 40, textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', margin: 0 }}>Loading…</p>
        </div>
      )}

      {!loading && form && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Main link card */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 32 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔗</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
              Your collection link
            </h2>
            <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>
              Send this link to your customers. They fill in a short form and their testimonial lands in your inbox — ready for you to approve.
            </p>

            {/* URL display + copy */}
            <div style={{
              display: 'flex', gap: 8, alignItems: 'center',
              background: '#f9fafb', border: '1px solid #e5e7eb',
              borderRadius: 8, padding: '12px 16px',
              marginBottom: 16,
            }}>
              <span style={{
                flex: 1, fontSize: 14, color: '#374151',
                fontFamily: 'monospace', wordBreak: 'break-all',
              }}>
                {collectionUrl}
              </span>
              <button
                onClick={copyLink}
                style={{
                  padding: '8px 18px',
                  background: copied ? '#16a34a' : '#2563eb',
                  color: '#fff', border: 'none', borderRadius: 6,
                  fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0,
                  transition: 'background 0.2s',
                }}
              >
                {copied ? '✓ Copied!' : 'Copy link'}
              </button>
            </div>

            <a
              href={collectionUrl}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}
            >
              Preview form ↗
            </a>
          </div>

          {/* How to use */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1e40af' }}>
              💡 How to use your link
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { step: '1', text: 'Copy the link above' },
                { step: '2', text: 'Send it to customers — in an email, after a purchase, or on your thank-you page' },
                { step: '3', text: 'Testimonials arrive in your dashboard under Testimonials → approve the ones you love' },
                { step: '4', text: 'Once approved, they automatically appear in any widget you embed on your site' },
              ].map(item => (
                <div key={item.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#2563eb', color: '#fff',
                    fontSize: 12, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 1,
                  }}>{item.step}</span>
                  <span style={{ fontSize: 14, color: '#1e3a5f', lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick share suggestions */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 24 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#111827' }}>
              📬 Quick share ideas
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>Copy and paste these into your messages</p>
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
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
          padding: 48, textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <p style={{ color: '#6b7280', margin: '0 0 16px' }}>
            No collection link found. This shouldn't happen — try refreshing.
          </p>
          <button
            onClick={load}
            style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
          >
            Retry
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
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
        <button
          onClick={copy}
          style={{
            padding: '4px 12px', fontSize: 12, fontWeight: 600,
            background: copied ? '#16a34a' : '#fff',
            color: copied ? '#fff' : '#374151',
            border: '1px solid #d1d5db', borderRadius: 5, cursor: 'pointer',
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{text}</p>
    </div>
  )
}
