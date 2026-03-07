import { describe, it, expect, vi, beforeEach } from 'vitest'
import app from '../src/index'

type WaitlistEntry = {
  email: string
  plan: 'free' | 'pro'
  created_at: string
}

const waitlistRows = new Map<string, WaitlistEntry>()

const mockDB = {
  prepare: vi.fn((sql: string) => ({
    bind: (...params: unknown[]) => ({
      run: async () => {
        if (sql.includes('INSERT INTO waitlist')) {
          const [email, plan] = params as [string, 'free' | 'pro']
          if (!waitlistRows.has(email)) {
            waitlistRows.set(email, {
              email,
              plan,
              created_at: new Date().toISOString(),
            })
          }
          return { success: true }
        }
        throw new Error(`Unhandled run SQL: ${sql}`)
      },
      first: async <T>() => {
        if (sql.includes('SELECT COUNT(*) as count FROM waitlist')) {
          return { count: waitlistRows.size } as T
        }
        throw new Error(`Unhandled first SQL: ${sql}`)
      },
    }),
    first: async <T>() => {
      if (sql.includes('SELECT COUNT(*) as count FROM waitlist')) {
        return { count: waitlistRows.size } as T
      }
      throw new Error(`Unhandled first SQL: ${sql}`)
    },
    all: async <T>() => {
      if (sql.includes('SELECT email, plan, created_at FROM waitlist')) {
        return {
          results: Array.from(waitlistRows.values())
            .sort((a, b) => b.created_at.localeCompare(a.created_at)),
        } as T
      }
      throw new Error(`Unhandled all SQL: ${sql}`)
    },
  })),
}

const mockKV = {
  get: vi.fn(async (_key: string) => null),
  put: vi.fn(async (_key: string, _val: string) => undefined),
  list: vi.fn(async () => ({ keys: [] })),
}

const env = {
  DB: mockDB as unknown as D1Database,
  WIDGET_KV: mockKV as unknown as KVNamespace,
  JWT_SECRET: 'test-secret',
  STRIPE_SECRET_KEY: '',
  STRIPE_WEBHOOK_SECRET: '',
  STRIPE_PRO_PRICE_ID: '',
  ADMIN_TOKEN: 'admin-test-token',
}

beforeEach(() => {
  waitlistRows.clear()
  vi.clearAllMocks()
})

describe('POST /api/waitlist', () => {
  it('subscribes a new email with explicit plan', async () => {
    const res = await app.request('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://socialproof.dev' },
      body: JSON.stringify({ email: 'test@example.com', plan: 'pro' }),
    }, env)

    expect(res.status).toBe(200)
    expect(res.headers.get('access-control-allow-origin')).toBe('https://socialproof.dev')
    const body = await res.json() as { success: boolean }
    expect(body.success).toBe(true)
    expect(waitlistRows.get('test@example.com')?.plan).toBe('pro')
  })

  it('defaults plan to free', async () => {
    const res = await app.request('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'free@example.com' }),
    }, env)

    expect(res.status).toBe(200)
    expect(waitlistRows.get('free@example.com')?.plan).toBe('free')
  })

  it('deduplicates silently', async () => {
    const req = () => app.request('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dup@example.com', plan: 'pro' }),
    }, env)

    const first = await req()
    const second = await req()

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(waitlistRows.size).toBe(1)
    expect(await second.json()).toEqual({ success: true })
  })

  it('rejects invalid email', async () => {
    const res = await app.request('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    }, env)

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid email' })
  })
})

describe('GET /api/waitlist/count', () => {
  it('returns 0 initially', async () => {
    const res = await app.request('/api/waitlist/count', {}, env)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ count: 0 })
  })

  it('returns count after subscriptions', async () => {
    waitlistRows.set('a@b.com', { email: 'a@b.com', plan: 'free', created_at: '2026-01-01T00:00:00.000Z' })
    waitlistRows.set('c@d.com', { email: 'c@d.com', plan: 'pro', created_at: '2026-01-02T00:00:00.000Z' })

    const res = await app.request('/api/waitlist/count', {}, env)
    expect(await res.json()).toEqual({ count: 2 })
  })
})

describe('GET /api/waitlist/export', () => {
  it('rejects without token', async () => {
    const res = await app.request('/api/waitlist/export', {}, env)
    expect(res.status).toBe(401)
  })

  it('returns CSV with valid token', async () => {
    waitlistRows.set('test@example.com', {
      email: 'test@example.com',
      plan: 'pro',
      created_at: '2026-01-01T00:00:00.000Z',
    })

    const res = await app.request('/api/waitlist/export', {
      headers: { 'X-Admin-Token': 'admin-test-token' },
    }, env)

    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('email,plan,created_at')
    expect(text).toContain('test@example.com,pro,2026-01-01T00:00:00.000Z')
  })
})
