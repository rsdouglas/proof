import { describe, it, expect } from 'vitest'
import { Webhook } from 'svix'
import { getAdminKey, verifyResendWebhook } from '../src/routes/support'

function signedHeaders(secret: string, payload: string) {
  const wh = new Webhook(secret)
  const msgId = 'msg_test_123'
  const timestamp = new Date()
  const signature = wh.sign(msgId, timestamp, payload)
  return {
    'svix-id': msgId,
    'svix-timestamp': Math.floor(timestamp.getTime() / 1000).toString(),
    'svix-signature': signature,
  }
}

describe('verifyResendWebhook', () => {
  it('accepts a valid svix signature', () => {
    const secret = 'whsec_dGVzdF9zZWNyZXRfdmFsdWU='
    const payload = JSON.stringify({ type: 'email.received', data: { from: 'Ada <ada@example.com>' } })

    const ok = verifyResendWebhook(payload, new Headers(signedHeaders(secret, payload)), secret)
    expect(ok).toBe(true)
  })

  it('rejects when the payload is modified', () => {
    const secret = 'whsec_dGVzdF9zZWNyZXRfdmFsdWU='
    const payload = JSON.stringify({ type: 'email.received', data: { from: 'Ada <ada@example.com>' } })
    const headers = signedHeaders(secret, payload)

    const tampered = JSON.stringify({ type: 'email.received', data: { from: 'Mallory <mallory@example.com>' } })
    const ok = verifyResendWebhook(tampered, new Headers(headers), secret)
    expect(ok).toBe(false)
  })

  it('rejects when secret is missing', () => {
    const payload = JSON.stringify({ hello: 'world' })
    const ok = verifyResendWebhook(payload, new Headers(), undefined)
    expect(ok).toBe(false)
  })
})


describe('getAdminKey', () => {
  it('prefers ADMIN_TOKEN when present', () => {
    expect(getAdminKey({ ADMIN_TOKEN: 'token-value', ADMIN_SECRET: 'legacy-secret' } as any)).toBe('token-value')
  })

  it('falls back to ADMIN_SECRET for legacy envs', () => {
    expect(getAdminKey({ ADMIN_SECRET: 'legacy-secret' } as any)).toBe('legacy-secret')
  })

  it('returns undefined when no admin secret is configured', () => {
    expect(getAdminKey({} as any)).toBeUndefined()
  })
})
