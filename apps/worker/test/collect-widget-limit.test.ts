import { describe, it, expect, vi, beforeEach } from 'vitest'
import app from '../src/index'

let approvedCount = 24
const insertedRows: Array<Record<string, unknown>> = []

const mockDB = {
  prepare: vi.fn((sql: string) => ({
    bind: (...params: unknown[]) => ({
      first: async <T>() => {
        if (sql.includes('FROM widgets w JOIN accounts a')) {
          return {
            id: 'widget_123',
            account_id: 'acct_123',
            widget_name: 'Homepage',
            plan: 'free',
            owner_email: 'owner@example.com',
            owner_name: 'Owner',
          } as T
        }
        if (sql.includes('COUNT(*) as count FROM testimonials')) {
          return { count: approvedCount } as T
        }
        return null as T
      },
      run: async () => {
        if (sql.includes('INSERT INTO testimonials')) {
          insertedRows.push({ sql, params })
        }
        return { success: true }
      },
    }),
  })),
}

const env = {
  DB: mockDB as unknown as D1Database,
  WIDGET_KV: { get: vi.fn(), put: vi.fn(), list: vi.fn() } as unknown as KVNamespace,
  ENVIRONMENT: 'test',
  JWT_SECRET: 'test-secret',
}

beforeEach(() => {
  approvedCount = 24
  insertedRows.length = 0
  vi.clearAllMocks()
})

describe('POST /collect-widget/:widgetId', () => {
  it('allows free widgets to receive the 25th approved testimonial submission', async () => {
    const res = await app.request('/collect/widget_123', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: 'Jane',
        display_text: 'Love it',
        rating: 5,
      }),
    }, env)

    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ ok: true, message: 'Thank you! Your testimonial has been submitted for review.' })
    expect(insertedRows).toHaveLength(1)
  })

  it('blocks free widgets once 25 approved testimonials already exist', async () => {
    approvedCount = 25

    const res = await app.request('/collect/widget_123', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: 'Jane',
        display_text: 'Love it',
      }),
    }, env)

    expect(res.status).toBe(402)
    expect(await res.json()).toEqual({ error: 'This widget has reached its testimonial limit.' })
    expect(insertedRows).toHaveLength(0)
  })
})
