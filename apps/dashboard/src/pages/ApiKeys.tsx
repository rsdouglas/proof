import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.socialproof.dev'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  created_at: string
}

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchKeys = async () => {
    try {
      const res = await fetch(`${API_URL}/api/keys`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json() as { keys: ApiKey[] }
        setKeys(data.keys)
      }
    } catch {
      setError('Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchKeys() }, [])

  const createKey = async () => {
    if (!newName.trim()) return
    setCreating(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/keys`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const data = await res.json() as { key?: ApiKey; secret?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Failed to create key')
        return
      }
      setNewSecret(data.secret ?? null)
      setNewName('')
      await fetchKeys()
    } catch {
      setError('Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  const deleteKey = async (id: string) => {
    if (!confirm('Delete this API key? Any integrations using it will stop working.')) return
    const res = await fetch(`${API_URL}/api/keys/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok) {
      setKeys(prev => prev.filter(k => k.id !== id))
    }
  }

  const copySecret = async () => {
    if (!newSecret) return
    await navigator.clipboard.writeText(newSecret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (s: string | null) => {
    if (!s) return 'Never'
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', margin: 0 }}>🔑 API Keys</h1>
        <p style={{ color: '#6b7280', marginTop: 4 }}>
          Use API keys to access Proof programmatically — perfect for Zapier, Make, or custom integrations.
        </p>
      </div>

      {/* New secret reveal banner */}
      {newSecret && (
        <div style={{
          marginBottom: 24, padding: 16,
          background: '#fffbeb', border: '1px solid #fcd34d',
          borderRadius: 8
        }}>
          <p style={{ fontWeight: 600, color: '#92400e', marginBottom: 8 }}>
            ⚠️ Copy your API key now — it won't be shown again.
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <code style={{
              flex: 1, background: '#fff', border: '1px solid #fcd34d',
              borderRadius: 4, padding: '8px 12px', fontSize: 13,
              fontFamily: 'monospace', overflowX: 'auto', display: 'block'
            }}>
              {newSecret}
            </code>
            <button
              onClick={copySecret}
              style={{
                padding: '8px 16px', background: '#d97706', color: '#fff',
                border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
                whiteSpace: 'nowrap'
              }}
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          <button
            onClick={() => setNewSecret(null)}
            style={{
              marginTop: 8, background: 'none', border: 'none',
              color: '#92400e', cursor: 'pointer', fontSize: 12, textDecoration: 'underline'
            }}
          >
            I've saved it, dismiss
          </button>
        </div>
      )}

      {/* Create new key */}
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb',
        borderRadius: 8, padding: 16, marginBottom: 24
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
          Create new API key
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Key name (e.g. Zapier integration)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createKey()}
            maxLength={100}
            style={{
              flex: 1, border: '1px solid #d1d5db', borderRadius: 6,
              padding: '8px 12px', fontSize: 14,
              outline: 'none'
            }}
          />
          <button
            onClick={createKey}
            disabled={creating || !newName.trim()}
            style={{
              padding: '8px 16px', background: creating || !newName.trim() ? '#9ca3af' : '#2563eb',
              color: '#fff', border: 'none', borderRadius: 6, cursor: creating || !newName.trim() ? 'not-allowed' : 'pointer',
              fontSize: 14
            }}
          >
            {creating ? 'Creating…' : '+ Create'}
          </button>
        </div>
        {error && <p style={{ marginTop: 8, fontSize: 13, color: '#dc2626' }}>{error}</p>}
        <p style={{ marginTop: 8, fontSize: 12, color: '#9ca3af' }}>Maximum 5 keys per account.</p>
      </div>

      {/* Key list */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Loading…</div>
        ) : keys.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔑</div>
            <p style={{ color: '#6b7280', fontSize: 14 }}>No API keys yet. Create one above.</p>
          </div>
        ) : (
          keys.map((key, i) => (
            <div key={key.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px',
              borderTop: i > 0 ? '1px solid #f3f4f6' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18 }}>🔑</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: 0 }}>{key.name}</p>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>
                    <code style={{ fontFamily: 'monospace' }}>{key.key_prefix}…</code>
                    {' · '}Created {formatDate(key.created_at)}
                    {' · '}Last used: {formatDate(key.last_used_at)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteKey(key.id)}
                title="Delete key"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#9ca3af', fontSize: 16, padding: 4
                }}
                onMouseOver={e => (e.currentTarget.style.color = '#dc2626')}
                onMouseOut={e => (e.currentTarget.style.color = '#9ca3af')}
              >
                🗑
              </button>
            </div>
          ))
        )}
      </div>

      {/* Usage docs */}
      <div style={{
        marginTop: 24, padding: 16,
        background: '#f9fafb', border: '1px solid #e5e7eb',
        borderRadius: 8
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
          Using your API key
        </h3>
        <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 8 }}>
          Pass your key as a Bearer token in the Authorization header:
        </p>
        <code style={{
          display: 'block', background: '#fff', border: '1px solid #e5e7eb',
          borderRadius: 4, padding: '8px 12px', fontSize: 12,
          fontFamily: 'monospace', color: '#374151', whiteSpace: 'pre'
        }}>
{`curl https://api.socialproof.dev/api/testimonials \\
  -H "Authorization: Bearer sk_live_..."`}
        </code>
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
          API keys provide the same access as your account session. Keep them secret.
        </p>
      </div>
    </div>
  )
}
