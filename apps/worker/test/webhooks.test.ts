/**
 * Tests for webhooks feature.
 * Tests validation and HMAC signing logic.
 */

import { describe, it, expect } from 'vitest'

// ── validation helpers (mirrors webhooks.ts logic) ──────────────────────────

interface WebhookInput {
  url?: string
  events?: string[]
  secret?: string
}

const VALID_EVENTS = ['testimonial.submitted', 'testimonial.approved', 'testimonial.rejected']

function validateWebhook(input: WebhookInput): string | null {
  if (!input.url) return 'url is required'
  if (!/^https:\/\//i.test(input.url)) return 'url must use HTTPS'
  try {
    new URL(input.url)
  } catch {
    return 'url is invalid'
  }
  if (!input.events || input.events.length === 0) return 'at least one event is required'
  for (const event of input.events) {
    if (!VALID_EVENTS.includes(event)) return `unknown event: ${event}`
  }
  if (input.secret && input.secret.length > 256) return 'secret too long'
  return null
}

// ── HMAC signing (mirrors webhooks.ts sign logic) ────────────────────────────

async function signPayload(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return 'sha256=' + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── tests ────────────────────────────────────────────────────────────────────

describe('webhook validation', () => {
  it('rejects missing url', () => {
    expect(validateWebhook({ events: ['testimonial.submitted'] })).toBe('url is required')
  })

  it('rejects HTTP urls', () => {
    expect(validateWebhook({ url: 'http://example.com', events: ['testimonial.submitted'] })).toBe('url must use HTTPS')
  })

  it('rejects invalid urls', () => {
    expect(validateWebhook({ url: 'https://not a url', events: ['testimonial.submitted'] })).toBe('url is invalid')
  })

  it('rejects empty events', () => {
    expect(validateWebhook({ url: 'https://example.com/hook', events: [] })).toBe('at least one event is required')
  })

  it('rejects unknown events', () => {
    expect(validateWebhook({ url: 'https://example.com/hook', events: ['unknown.event'] })).toBe('unknown event: unknown.event')
  })

  it('accepts valid webhook', () => {
    expect(validateWebhook({
      url: 'https://example.com/hook',
      events: ['testimonial.submitted', 'testimonial.approved'],
    })).toBeNull()
  })

  it('accepts webhook with all valid events', () => {
    expect(validateWebhook({
      url: 'https://hooks.slack.com/services/abc',
      events: VALID_EVENTS,
      secret: 'my-secret',
    })).toBeNull()
  })

  it('rejects overly long secret', () => {
    expect(validateWebhook({
      url: 'https://example.com/hook',
      events: ['testimonial.submitted'],
      secret: 'x'.repeat(257),
    })).toBe('secret too long')
  })
})

describe('HMAC signing', () => {
  it('produces sha256= prefixed signature', async () => {
    const sig = await signPayload('secret', '{"event":"test"}')
    expect(sig).toMatch(/^sha256=[0-9a-f]{64}$/)
  })

  it('same payload + secret produces same signature', async () => {
    const payload = '{"event":"testimonial.submitted","id":"abc"}'
    const sig1 = await signPayload('my-secret', payload)
    const sig2 = await signPayload('my-secret', payload)
    expect(sig1).toBe(sig2)
  })

  it('different secrets produce different signatures', async () => {
    const payload = '{"event":"test"}'
    const sig1 = await signPayload('secret-a', payload)
    const sig2 = await signPayload('secret-b', payload)
    expect(sig1).not.toBe(sig2)
  })

  it('different payloads produce different signatures', async () => {
    const sig1 = await signPayload('secret', '{"event":"submitted"}')
    const sig2 = await signPayload('secret', '{"event":"approved"}')
    expect(sig1).not.toBe(sig2)
  })
})
