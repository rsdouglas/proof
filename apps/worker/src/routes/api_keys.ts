import { Hono } from 'hono'
import type { Env, Variables } from '../index'

export const apiKeys = new Hono<{ Bindings: Env; Variables: Variables }>()

// ── helpers ──────────────────────────────────────────────────────────────────

function nanoid(len = 21): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const bytes = crypto.getRandomValues(new Uint8Array(len))
  for (const b of bytes) result += chars[b % chars.length]
  return result
}

async function hashKey(raw: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Generate a new API key: sk_live_<random32> */
function generateRawKey(): string {
  return 'sk_live_' + nanoid(32)
}

// ── List API keys ─────────────────────────────────────────────────────────────
apiKeys.get('/', async (c) => {
  const accountId = c.get('accountId')
  const { results } = await c.env.DB.prepare(
    'SELECT id, name, key_prefix, last_used_at, created_at FROM api_keys WHERE account_id = ? ORDER BY created_at DESC'
  ).bind(accountId).all()
  return c.json({ keys: results })
})

// ── Create API key ─────────────────────────────────────────────────────────────
apiKeys.post('/', async (c) => {
  const accountId = c.get('accountId')

  // Max 5 keys per account (same limit as webhooks)
  const { results: existing } = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM api_keys WHERE account_id = ?'
  ).bind(accountId).all()
  const count = (existing[0] as { count: number }).count
  if (count >= 5) {
    return c.json({ error: 'Maximum of 5 API keys allowed per account' }, 400)
  }

  const body = await c.req.json().catch(() => ({}))
  const name = (body as { name?: string })?.name?.trim()
  if (!name || name.length < 1 || name.length > 100) {
    return c.json({ error: 'name is required (max 100 chars)' }, 400)
  }

  const rawKey = generateRawKey()
  const keyHash = await hashKey(rawKey)
  const keyPrefix = rawKey.slice(0, 12) // "sk_live_XXXX"
  const id = 'key_' + nanoid()
  const now = new Date().toISOString()

  await c.env.DB.prepare(
    'INSERT INTO api_keys (id, account_id, name, key_hash, key_prefix, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, accountId, name, keyHash, keyPrefix, now).run()

  // Return the raw key ONCE — never stored, never shown again
  return c.json({
    key: {
      id,
      name,
      key_prefix: keyPrefix,
      created_at: now,
    },
    secret: rawKey, // shown once
  }, 201)
})

// ── Delete API key ─────────────────────────────────────────────────────────────
apiKeys.delete('/:id', async (c) => {
  const accountId = c.get('accountId')
  const id = c.req.param('id')

  const { meta } = await c.env.DB.prepare(
    'DELETE FROM api_keys WHERE id = ? AND account_id = ?'
  ).bind(id, accountId).run()

  if (meta.changes === 0) {
    return c.json({ error: 'Key not found' }, 404)
  }
  return c.json({ ok: true })
})

// ── Exported helper: resolve API key to accountId ──────────────────────────────
export async function resolveApiKey(rawKey: string, db: D1Database): Promise<{ accountId: string; keyId: string } | null> {
  const hash = await hashKey(rawKey)
  const row = await db.prepare(
    'SELECT id, account_id FROM api_keys WHERE key_hash = ?'
  ).bind(hash).first<{ id: string; account_id: string }>()

  if (!row) return null

  // Update last_used_at (fire-and-forget, don't await)
  db.prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), row.id).run()

  return { accountId: row.account_id, keyId: row.id }
}
