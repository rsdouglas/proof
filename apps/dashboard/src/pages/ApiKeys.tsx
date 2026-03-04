import { useState, useEffect } from 'react'
import { useApi } from '../lib/auth'
import { Copy, Key, Trash2, Plus } from 'lucide-react'
import { C, spacing, radius, shadow, btn, card, input as inputToken, fontSize } from '../design'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  created_at: string
  last_used_at: string | null
}

export default function ApiKeys() {
  const { request } = useApi()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    request<{ keys: ApiKey[] }>('/api-keys')
      .then(d => setKeys(d.keys || []))
      .catch(() => setMsg({ type: 'err', text: 'Failed to load API keys.' }))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  async function createKey(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setMsg(null)
    try {
      const data = await request<{ key: ApiKey & { plaintext: string } }>('/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim() }),
      })
      setKeys(prev => [data.key, ...prev])
      setRevealedKey(data.key.plaintext)
      setNewName('')
      setShowForm(false)
      setMsg({ type: 'ok', text: 'API key created. Copy it now — it won\'t be shown again.' })
    } catch (e) {
      setMsg({ type: 'err', text: (e as Error).message })
    } finally {
      setCreating(false)
    }
  }

  async function deleteKey(id: string) {
    if (!confirm('Delete this API key? Any integrations using it will stop working.')) return
    try {
      await request(`/api-keys/${id}`, { method: 'DELETE' })
      setKeys(prev => prev.filter(k => k.id !== id))
    } catch (e) {
      setMsg({ type: 'err', text: (e as Error).message })
    }
  }

  function copyKey(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: `${spacing[6]} ${spacing[4]}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6] }}>
        <div>
          <h1 style={{ margin: 0, fontSize: fontSize.xl, fontWeight: 700, color: C.gray[900] }}>API Keys</h1>
          <p style={{ margin: `${spacing[1]} 0 0`, fontSize: fontSize.sm, color: C.gray[500] }}>
            Use these keys to authenticate API requests from your code.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={btn.primary}>
          <Plus size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          New key
        </button>
      </div>

      {msg && (
        <div style={{
          padding: `${spacing[3]} ${spacing[4]}`,
          borderRadius: radius.md,
          marginBottom: spacing[4],
          background: msg.type === 'ok' ? C.success.bg : C.danger.bg,
          color: msg.type === 'ok' ? C.success.text : C.danger.text,
          border: `1px solid ${msg.type === 'ok' ? C.success.border : C.danger.border}`,
          fontSize: fontSize.sm,
        }}>
          {msg.text}
        </div>
      )}

      {revealedKey && (
        <div style={{
          ...card,
          marginBottom: spacing[5],
          background: '#fefce8',
          border: `1px solid #fde68a`,
        }}>
          <p style={{ margin: `0 0 ${spacing[2]}`, fontSize: fontSize.sm, fontWeight: 600, color: '#92400e' }}>
            ⚠ Copy your new API key now. It won't be shown again.
          </p>
          <div style={{ display: 'flex', gap: spacing[2], alignItems: 'center' }}>
            <code style={{
              flex: 1,
              padding: `${spacing[2]} ${spacing[3]}`,
              background: '#fff',
              border: '1px solid #fde68a',
              borderRadius: radius.sm,
              fontSize: fontSize.sm,
              fontFamily: 'monospace',
              wordBreak: 'break-all',
            }}>
              {revealedKey}
            </code>
            <button onClick={() => copyKey(revealedKey)} style={btn.outline}>
              <Copy size={14} />
              {copied ? ' Copied!' : ' Copy'}
            </button>
          </div>
          <button
            onClick={() => setRevealedKey(null)}
            style={{ marginTop: spacing[3], background: 'none', border: 'none', cursor: 'pointer', fontSize: fontSize.xs, color: C.gray[500] }}
          >
            I've saved it — dismiss
          </button>
        </div>
      )}

      {showForm && (
        <div style={{ ...card, marginBottom: spacing[5] }}>
          <h2 style={{ margin: `0 0 ${spacing[4]}`, fontSize: fontSize.base, fontWeight: 600, color: C.gray[900] }}>
            Create API Key
          </h2>
          <form onSubmit={createKey} style={{ display: 'flex', gap: spacing[3], alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: fontSize.sm, fontWeight: 600, color: C.gray[700], display: 'block', marginBottom: spacing[1] }}>
                Key name (e.g. "production", "zapier")
              </label>
              <input
                style={{ ...inputToken, width: '100%', boxSizing: 'border-box' }}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="My integration"
                autoFocus
              />
            </div>
            <button type="submit" disabled={creating} style={btn.primary}>
              {creating ? 'Creating…' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={btn.ghost}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: spacing[12], color: C.gray[400], fontSize: fontSize.sm }}>
          Loading keys…
        </div>
      ) : keys.length === 0 ? (
        <div style={{
          ...card,
          textAlign: 'center',
          padding: spacing[12],
        }}>
          <Key size={32} style={{ color: C.gray[300], marginBottom: spacing[3] }} />
          <p style={{ margin: 0, color: C.gray[500], fontSize: fontSize.sm }}>
            No API keys yet. Create one to authenticate API requests.
          </p>
        </div>
      ) : (
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          {keys.map((key, i) => (
            <div
              key={key.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3],
                padding: `${spacing[4]} ${spacing[5]}`,
                borderBottom: i < keys.length - 1 ? `1px solid ${C.gray[100]}` : 'none',
              }}
            >
              <Key size={16} style={{ color: C.gray[400], flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: fontSize.sm, color: C.gray[900] }}>{key.name}</p>
                <p style={{ margin: `2px 0 0`, fontSize: fontSize.xs, color: C.gray[400], fontFamily: 'monospace' }}>
                  {key.key_prefix}••••••••
                  {key.last_used_at && (
                    <span style={{ marginLeft: spacing[3], fontFamily: 'inherit' }}>
                      · Last used {new Date(key.last_used_at).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => deleteKey(key.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: spacing[2],
                  color: C.gray[400],
                  borderRadius: radius.sm,
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.15s',
                }}
                onMouseOver={e => (e.currentTarget.style.color = C.danger.text)}
                onMouseOut={e => (e.currentTarget.style.color = C.gray[400])}
                title="Delete key"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: spacing[6], padding: spacing[4], background: C.gray[50], borderRadius: radius.md, fontSize: fontSize.xs, color: C.gray[500] }}>
        <strong style={{ color: C.gray[700] }}>Using API keys:</strong> Pass your key in the <code>Authorization: Bearer &lt;key&gt;</code> header. 
        Keys grant full account access — keep them secret.
      </div>
    </div>
  )
}
