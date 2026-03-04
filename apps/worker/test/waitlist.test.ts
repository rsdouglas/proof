import { describe, it, expect, vi, beforeEach } from 'vitest'
import app from '../src/index'

// Mock KV
const kvStore: Record<string, string> = {}
const mockKV = {
  get: vi.fn(async (key: string) => kvStore[key] ?? null),
  put: vi.fn(async (key: string, val: string) => { kvStore[key] = val }),
  list: vi.fn(async ({ prefix }: { prefix: string }) => ({
    keys: Object.keys(kvStore)
      .filter(k => k.startsWith(prefix))
      .map(k => ({ name: k })),
  })),
}

const env = {
  DB: {} as D1Database,
  WIDGET_KV: mockKV as unknown as KVNamespace,
  JWT_SECRET: 'test-secret',
  STRIPE_SECRET_KEY: '',
  STRIPE_WEBHOOK_SECRET: '',
  STRIPE_PRO_PRICE_ID: '',
  ADMIN_TOKEN: 'admin-test-token',
}

beforeEach(() => {
  Object.keys(kvStore).forEach(k => delete kvStore[k])
  vi.clearAllMocks()
})

describe('POST /api/waitlist', () => {
  it('subscribes a new email', async () => {
    const res = await app.request('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', source: 'landing' }),
    }, env)
    expect(res.status).toBe(200)
    const body = await res.json() as { ok: boolean; already: boolean }
    expect(body.ok).toBe(true)
    expect(body.already).toBe(false)
  })

  it('is idempotent — second subscription returns already:true', async () => {
    const req = () => app.request('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dup@example.com' }),
    }, env)
    await req()
    const res = await req()
    const body = await res.json() as { ok: boolean; already: boolean }
    expect(body.ok).toBe(true)
    expect(body.already).toBe(true)
  })

  it('rejects invalid email', async () => {
    const res = await app.request('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    }, env)
    expect(res.status).toBe(400)
  })

  it('increments count', async () => {
    await app.request('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com' }),
    }, env)
    await app.request('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'c@d.com' }),
    }, env)
    expect(kvStore['waitlist:__count']).toBe('2')
  })
})

describe('GET /api/waitlist/count', () => {
  it('returns 0 initially', async () => {
    const res = await app.request('/api/waitlist/count', {}, env)
    expect(res.status).toBe(200)
    const body = await res.json() as { count: number }
    expect(body.count).toBe(0)
  })

  it('returns count after subscriptions', async () => {
    kvStore['waitlist:__count'] = '42'
    const res = await app.request('/api/waitlist/count', {}, env)
    const body = await res.json() as { count: number }
    expect(body.count).toBe(42)
  })
})

describe('GET /api/waitlist/export', () => {
  it('rejects without token', async () => {
    const res = await app.request('/api/waitlist/export', {}, env)
    expect(res.status).toBe(401)
  })

  it('returns CSV with valid token', async () => {
    kvStore['waitlist:test@example.com'] = JSON.stringify({
      email: 'test@example.com', source: 'landing', created_at: '2026-01-01T00:00:00.000Z'
    })
    const res = await app.request('/api/waitlist/export', {
      headers: { 'X-Admin-Token': 'admin-test-token' },
    }, env)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('email,source,created_at')
    expect(text).toContain('test@example.com')
  })
})
