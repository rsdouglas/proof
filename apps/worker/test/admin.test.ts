import { beforeEach, describe, expect, it, vi } from 'vitest'
import app from '../src/index'

// ── Shared mock state ──────────────────────────────────────────────────────────

const supportRows = new Map<string, { id: string; from_email: string; from_name: string | null; subject: string; body_text: string | null; received_at: string; status: string }>()
const waitlistRows = new Map<string, { email: string; plan: string; created_at: string }>()
const outreachRows = new Map<string, { id: string; name: string | null; email: string; business_name: string | null; vertical: string | null; variant: string | null; status: string; sent_at: string | null; created_at: string }>()

const mockDB = {
  prepare: vi.fn((sql: string) => ({
    bind: (...params: unknown[]) => ({
      run: async () => {
        if (sql.includes('INSERT INTO outreach_targets')) {
          const [id, name, email, business_name, vertical, variant] = params as [string, string | null, string, string | null, string | null, string]
          if (!outreachRows.has(email)) {
            outreachRows.set(email, { id, name, email, business_name, vertical, variant, status: 'pending', sent_at: null, created_at: new Date().toISOString() })
          }
          return { success: true }
        }
        if (sql.includes('UPDATE outreach_targets SET status')) {
          const [status, sentAt, id] = sql.includes('sent_at') ? [params[0] as string, params[1] as string, params[2] as string] : [params[0] as string, null, params[1] as string]
          for (const row of outreachRows.values()) {
            if (row.id === (id ?? sentAt)) { row.status = status; break }
          }
          return { success: true }
        }
        if (sql.includes('UPDATE support_messages SET status')) {
          const [status, id] = params as [string, string]
          const row = supportRows.get(id)
          if (row) row.status = status
          return { success: true }
        }
        return { success: true }
      },
      first: async <T>() => {
        if (sql.includes('SELECT 1')) return { 1: 1 } as T
        if (sql.includes('SELECT COUNT(*)')) return { n: 0, count: 0 } as T
        return null as T
      },
      all: async <T>() => {
        if (sql.includes('FROM outreach_targets') && sql.includes('GROUP BY status')) {
          const counts: Record<string, number> = {}
          for (const r of outreachRows.values()) {
            counts[r.status] = (counts[r.status] ?? 0) + 1
          }
          return { results: Object.entries(counts).map(([status, n]) => ({ status, n })) } as T
        }
        if (sql.includes('FROM outreach_targets') && sql.includes('GROUP BY vertical')) {
          return { results: [] } as T
        }
        if (sql.includes('FROM outreach_targets')) {
          let rows = Array.from(outreachRows.values())
          if (sql.includes("status = 'pending'")) rows = rows.filter(r => r.status === 'pending')
          return { results: rows } as T
        }
        if (sql.includes('FROM support_messages')) {
          let rows = Array.from(supportRows.values())
          if (sql.includes('WHERE status = ?')) rows = rows.filter(r => r.status === params[0])
          return { results: rows.slice(0, Number(params[params.length - 1] ?? 50)) } as T
        }
        if (sql.includes('FROM waitlist')) {
          return { results: Array.from(waitlistRows.values()) } as T
        }
        if (sql.includes('FROM accounts') || sql.includes('FROM testimonials') || sql.includes('FROM widgets')) {
          return { results: [] } as T
        }
        return { results: [] } as T
      },
    }),
    first: async <T>() => {
      if (sql.includes('SELECT 1')) return { 1: 1 } as T
      if (sql.includes('SELECT COUNT(*)')) return { n: 0, count: 0 } as T
      return null as T
    },
    all: async <T>() => {
      if (sql.includes('FROM waitlist')) {
        return { results: Array.from(waitlistRows.values()) } as T
      }
      if (sql.includes('FROM outreach_targets') && sql.includes('GROUP BY status')) {
        const counts: Record<string, number> = {}
        for (const r of outreachRows.values()) {
          counts[r.status] = (counts[r.status] ?? 0) + 1
        }
        return { results: Object.entries(counts).map(([status, n]) => ({ status, n })) } as T
      }
      if (sql.includes('FROM outreach_targets') && sql.includes('GROUP BY vertical')) {
        return { results: [] } as T
      }
      if (sql.includes('FROM outreach_targets')) {
        return { results: Array.from(outreachRows.values()) } as T
      }
      return { results: [] } as T
    },
  })),
}

const mockKV = {
  get: vi.fn(async () => null),
  put: vi.fn(async () => undefined),
  list: vi.fn(async () => ({ keys: [] })),
}

const adminEnv = {
  DB: mockDB as unknown as D1Database,
  WIDGET_KV: mockKV as unknown as KVNamespace,
  JWT_SECRET: 'test-secret',
  STRIPE_SECRET_KEY: '',
  STRIPE_WEBHOOK_SECRET: '',
  STRIPE_PRO_PRICE_ID: '',
  ADMIN_TOKEN: 'test-admin-token',
  ENVIRONMENT: 'test',
}

function adminHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${adminEnv.ADMIN_TOKEN}`, ...extra }
}

beforeEach(() => {
  supportRows.clear()
  waitlistRows.clear()
  outreachRows.clear()
  vi.clearAllMocks()
})

// ── Auth middleware ─────────────────────────────────────────────────────────────

describe('admin auth middleware', () => {
  it('rejects requests without Authorization header', async () => {
    const res = await app.request('/api/admin/stats', {}, adminEnv)
    expect(res.status).toBe(401)
  })

  it('rejects requests with wrong token', async () => {
    const res = await app.request('/api/admin/stats', {
      headers: { Authorization: 'Bearer wrong-token' },
    }, adminEnv)
    expect(res.status).toBe(401)
  })

  it('rejects non-Bearer auth schemes', async () => {
    const res = await app.request('/api/admin/stats', {
      headers: { Authorization: `Token ${adminEnv.ADMIN_TOKEN}` },
    }, adminEnv)
    expect(res.status).toBe(401)
  })

  it('accepts valid Bearer token', async () => {
    const res = await app.request('/api/admin/stats', {
      headers: adminHeaders(),
    }, adminEnv)
    expect(res.status).toBe(200)
  })
})

// ── GET /api/admin/stats ───────────────────────────────────────────────────────

describe('GET /api/admin/stats', () => {
  it('returns structured stats', async () => {
    const res = await app.request('/api/admin/stats', {
      headers: adminHeaders(),
    }, adminEnv)

    expect(res.status).toBe(200)
    const json = await res.json() as Record<string, unknown>
    expect(json).toHaveProperty('users')
    expect(json).toHaveProperty('testimonials')
    expect(json).toHaveProperty('widgets')
    expect(json).toHaveProperty('generated_at')
    expect(json.users).toHaveProperty('total')
    expect(json.users).toHaveProperty('activation_rate')
  })
})

// ── GET /api/admin/status ──────────────────────────────────────────────────────

describe('GET /api/admin/status', () => {
  it('returns health checks for D1 and KV', async () => {
    const res = await app.request('/api/admin/status', {
      headers: adminHeaders(),
    }, adminEnv)

    const json = await res.json() as Record<string, any>
    expect(json).toHaveProperty('checks')
    expect(json.checks.d1).toHaveProperty('ok')
    expect(json.checks.d1).toHaveProperty('latency_ms')
    expect(json.checks.kv).toHaveProperty('ok')
    expect(json.checks.d1.ok).toBe(true)
    expect(json.checks.kv.ok).toBe(true)
  })

  it('reports env field', async () => {
    const res = await app.request('/api/admin/status', {
      headers: adminHeaders(),
    }, adminEnv)

    const json = await res.json() as Record<string, unknown>
    expect(json.env).toBe('test')
    expect(json).toHaveProperty('ts')
  })

  it('does not expose secrets inventory', async () => {
    const res = await app.request('/api/admin/status', {
      headers: adminHeaders(),
    }, adminEnv)

    const json = await res.json() as Record<string, unknown>
    expect(json).not.toHaveProperty('secrets')
  })

  it('reports missing integrations as failed checks', async () => {
    const res = await app.request('/api/admin/status', {
      headers: adminHeaders(),
    }, adminEnv)

    const json = await res.json() as Record<string, any>
    // No RESEND_API_KEY or STRIPE_SECRET_KEY in test env
    expect(json.checks.resend.ok).toBe(false)
    expect(json.checks.stripe.ok).toBe(false)
    expect(json.checks.ses.ok).toBe(false)
  })
})

// ── Outreach endpoints ─────────────────────────────────────────────────────────

describe('POST /api/admin/outreach/targets', () => {
  it('inserts valid targets', async () => {
    const res = await app.request('/api/admin/outreach/targets', {
      method: 'POST',
      headers: adminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify([
        { email: 'a@example.com', name: 'Alice', vertical: 'bakery' },
        { email: 'b@example.com', name: 'Bob' },
      ]),
    }, adminEnv)

    expect(res.status).toBe(200)
    const json = await res.json() as { inserted: number; skipped: number }
    expect(json.inserted).toBe(2)
    expect(json.skipped).toBe(0)
    expect(outreachRows.size).toBe(2)
  })

  it('rejects invalid emails', async () => {
    const res = await app.request('/api/admin/outreach/targets', {
      method: 'POST',
      headers: adminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify([{ email: 'not-an-email' }]),
    }, adminEnv)

    const json = await res.json() as { inserted: number; skipped: number; errors: string[] }
    expect(json.inserted).toBe(0)
    expect(json.skipped).toBe(1)
    expect(json.errors).toHaveLength(1)
  })

  it('accepts targets wrapped in object', async () => {
    const res = await app.request('/api/admin/outreach/targets', {
      method: 'POST',
      headers: adminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ targets: [{ email: 'c@example.com' }] }),
    }, adminEnv)

    const json = await res.json() as { inserted: number }
    expect(json.inserted).toBe(1)
  })
})

describe('GET /api/admin/outreach/stats', () => {
  it('returns counts by status', async () => {
    outreachRows.set('a@x.com', { id: '1', name: null, email: 'a@x.com', business_name: null, vertical: null, variant: 'A', status: 'pending', sent_at: null, created_at: '2026-01-01' })
    outreachRows.set('b@x.com', { id: '2', name: null, email: 'b@x.com', business_name: null, vertical: null, variant: 'A', status: 'sent', sent_at: '2026-01-02', created_at: '2026-01-01' })

    const res = await app.request('/api/admin/outreach/stats', {
      headers: adminHeaders(),
    }, adminEnv)

    expect(res.status).toBe(200)
    const json = await res.json() as { stats: Record<string, number> }
    expect(json.stats.pending).toBe(1)
    expect(json.stats.sent).toBe(1)
  })
})

describe('GET /api/admin/outreach/targets', () => {
  it('lists targets', async () => {
    outreachRows.set('a@x.com', { id: '1', name: 'Alice', email: 'a@x.com', business_name: 'Biz', vertical: 'bakery', variant: 'A', status: 'pending', sent_at: null, created_at: '2026-01-01' })

    const res = await app.request('/api/admin/outreach/targets', {
      headers: adminHeaders(),
    }, adminEnv)

    expect(res.status).toBe(200)
    const json = await res.json() as { targets: unknown[]; total: number }
    expect(json.targets).toHaveLength(1)
  })
})

// ── Support admin endpoints ────────────────────────────────────────────────────

describe('GET /api/admin/support', () => {
  it('lists support messages', async () => {
    supportRows.set('msg_1', { id: 'msg_1', from_email: 'user@example.com', from_name: 'User', subject: 'Help', body_text: 'Need help', received_at: '2026-01-01', status: 'open' })

    const res = await app.request('/api/admin/support', {
      headers: adminHeaders(),
    }, adminEnv)

    expect(res.status).toBe(200)
    const json = await res.json() as { messages: unknown[]; total: number }
    expect(json.messages).toHaveLength(1)
    expect(json.total).toBe(1)
  })

  it('rejects without auth', async () => {
    const res = await app.request('/api/admin/support', {}, adminEnv)
    expect(res.status).toBe(401)
  })
})

describe('PATCH /api/admin/support/:id', () => {
  it('updates support message status', async () => {
    supportRows.set('msg_1', { id: 'msg_1', from_email: 'user@example.com', from_name: null, subject: 'Help', body_text: 'Need help', received_at: '2026-01-01', status: 'open' })

    const res = await app.request('/api/admin/support/msg_1', {
      method: 'PATCH',
      headers: adminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status: 'closed' }),
    }, adminEnv)

    expect(res.status).toBe(200)
    expect(supportRows.get('msg_1')?.status).toBe('closed')
  })

  it('rejects invalid status', async () => {
    supportRows.set('msg_1', { id: 'msg_1', from_email: 'user@example.com', from_name: null, subject: 'Help', body_text: 'Need help', received_at: '2026-01-01', status: 'open' })

    const res = await app.request('/api/admin/support/msg_1', {
      method: 'PATCH',
      headers: adminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status: 'invalid' }),
    }, adminEnv)

    expect(res.status).toBe(400)
  })
})

// ── Waitlist export ────────────────────────────────────────────────────────────

describe('GET /api/admin/waitlist/export', () => {
  it('returns CSV with Bearer auth', async () => {
    waitlistRows.set('a@b.com', { email: 'a@b.com', plan: 'pro', created_at: '2026-01-01T00:00:00Z' })

    const res = await app.request('/api/admin/waitlist/export', {
      headers: adminHeaders(),
    }, adminEnv)

    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('email,plan,created_at')
    expect(text).toContain('a@b.com,pro,2026-01-01T00:00:00Z')
    expect(res.headers.get('content-type')).toBe('text/csv')
    expect(res.headers.get('content-disposition')).toContain('waitlist.csv')
  })

  it('rejects without auth', async () => {
    const res = await app.request('/api/admin/waitlist/export', {}, adminEnv)
    expect(res.status).toBe(401)
  })
})
