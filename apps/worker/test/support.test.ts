import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Webhook } from 'svix'
import app from '../src/index'

type SupportRow = {
  id: string
  from_email: string
  from_name: string | null
  subject: string
  body_text: string | null
  body_html: string | null
  received_at: string
  status: string
}

const supportRows = new Map<string, SupportRow>()

const mockDB = {
  prepare: vi.fn((sql: string) => ({
    bind: (...params: unknown[]) => ({
      run: async () => {
        if (sql.includes('INSERT INTO support_messages')) {
          const [id, from_email, from_name, subject, body_text, body_html] = params as [string, string, string | null, string, string | null, string | null]
          supportRows.set(id, {
            id,
            from_email,
            from_name,
            subject,
            body_text,
            body_html,
            received_at: new Date().toISOString(),
            status: 'open',
          })
          return { success: true }
        }
        if (sql.includes('UPDATE support_messages SET status = ? WHERE id = ?')) {
          const [status, id] = params as [string, string]
          const row = supportRows.get(id)
          if (row) row.status = status
          return { success: true }
        }
        throw new Error(`Unhandled run SQL: ${sql}`)
      },
      first: async <T>() => {
        throw new Error(`Unhandled bound first SQL: ${sql}`)
      },
      all: async <T>() => {
        if (sql.includes('FROM support_messages')) {
          let rows = Array.from(supportRows.values())
          if (sql.includes('WHERE status = ?')) {
            rows = rows.filter((r) => r.status === params[0])
          }
          return { results: rows.slice(0, Number(params[params.length - 1] ?? 50)) } as T
        }
        throw new Error(`Unhandled bound all SQL: ${sql}`)
      },
    }),
    all: async <T>() => {
      if (sql.includes('FROM support_messages')) {
        return { results: Array.from(supportRows.values()) } as T
      }
      throw new Error(`Unhandled all SQL: ${sql}`)
    },
  })),
}

const baseEnv = {
  DB: mockDB as unknown as D1Database,
  WIDGET_KV: {} as KVNamespace,
  JWT_SECRET: 'test-secret',
  STRIPE_SECRET_KEY: '',
  STRIPE_WEBHOOK_SECRET: '',
  STRIPE_PRO_PRICE_ID: '',
  ADMIN_SECRET: 'legacy-secret',
  ADMIN_TOKEN: 'prod-token',
  RESEND_WEBHOOK_SECRET: 'whsec_' + Buffer.from('test_secret_1234567890').toString('base64'),
}

function supportPayload() {
  return {
    type: 'email.received',
    data: {
      from: 'Jane Doe <jane@example.com>',
      to: ['support@socialproof.dev'],
      subject: 'Need help',
      text: 'Hello there',
      html: '<p>Hello there</p>',
    },
  }
}

function signedHeaders(secret: string, body: string) {
  const wh = new Webhook(secret)
  const id = 'msg_test_123'
  const timestamp = new Date()
  const signature = wh.sign(id, timestamp, body)
  return {
    'Content-Type': 'application/json',
    'svix-id': id,
    'svix-timestamp': Math.floor(timestamp.getTime() / 1000).toString(),
    'svix-signature': signature,
  }
}

beforeEach(() => {
  supportRows.clear()
  vi.clearAllMocks()
})

describe('POST /api/support/inbound', () => {
  it('accepts a valid signed webhook and stores the message', async () => {
    const body = JSON.stringify(supportPayload())
    const res = await app.request('/api/support/inbound', {
      method: 'POST',
      headers: signedHeaders(baseEnv.RESEND_WEBHOOK_SECRET, body),
      body,
    }, baseEnv)

    expect(res.status).toBe(200)
    const json = await res.json() as { ok: boolean; id: string }
    expect(json.ok).toBe(true)
    expect(supportRows.get(json.id)).toMatchObject({
      from_email: 'jane@example.com',
      from_name: 'Jane Doe',
      subject: 'Need help',
      body_text: 'Hello there',
      status: 'open',
    })
  })

  it('rejects a tampered webhook payload', async () => {
    const body = JSON.stringify(supportPayload())
    const tampered = JSON.stringify({ ...supportPayload(), data: { ...supportPayload().data, subject: 'Tampered' } })
    const res = await app.request('/api/support/inbound', {
      method: 'POST',
      headers: signedHeaders(baseEnv.RESEND_WEBHOOK_SECRET, body),
      body: tampered,
    }, baseEnv)

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Invalid webhook signature' })
  })

  it('fails closed when webhook secret is missing', async () => {
    const body = JSON.stringify(supportPayload())
    const res = await app.request('/api/support/inbound', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'svix-id': 'id',
        'svix-timestamp': '123',
        'svix-signature': 'sig',
      },
      body,
    }, { ...baseEnv, RESEND_WEBHOOK_SECRET: '' })

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Invalid webhook signature' })
  })
})

describe('support admin auth', () => {
  beforeEach(() => {
    supportRows.set('msg_1', {
      id: 'msg_1',
      from_email: 'customer@example.com',
      from_name: null,
      subject: 'Help',
      body_text: 'Need assistance',
      body_html: null,
      received_at: new Date().toISOString(),
      status: 'open',
    })
  })

  it('accepts ADMIN_TOKEN for support admin list', async () => {
    const res = await app.request('/api/support/admin-list', {
      headers: { 'x-admin-key': baseEnv.ADMIN_TOKEN },
    }, baseEnv)

    expect(res.status).toBe(200)
    const json = await res.json() as { total: number }
    expect(json.total).toBe(1)
  })

  it('accepts ADMIN_TOKEN for support admin status update', async () => {
    const res = await app.request('/api/support/admin-list/msg_1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': baseEnv.ADMIN_TOKEN,
      },
      body: JSON.stringify({ status: 'closed' }),
    }, baseEnv)

    expect(res.status).toBe(200)
    expect(supportRows.get('msg_1')?.status).toBe('closed')
  })
})
