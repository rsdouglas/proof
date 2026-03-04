/**
 * Tests for auth helper functions.
 * These test pure/crypto logic without needing the full CF runtime.
 */

import { describe, it, expect } from 'vitest'

// ── replicate helpers inline (they're not exported from auth.ts) ─────────────

function b64url(data: string | ArrayBuffer): string {
  const str = typeof data === 'string' ? data : String.fromCharCode(...new Uint8Array(data as ArrayBuffer))
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

async function generateToken(accountId: string, email: string, plan: string, secret: string): Promise<string> {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify({
    sub: accountId,
    email,
    plan,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
  }))
  const data = `${header}.${payload}`
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return `${data}.${b64url(sig)}`
}

async function verifyToken(token: string, secret: string): Promise<{ sub: string; email: string; plan: string } | null> {
  try {
    const [header, payload, sig] = token.split('.')
    if (!header || !payload || !sig) return null
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    )
    const sigBytes = Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(`${header}.${payload}`))
    if (!valid) return null
    const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    if (claims.exp < Math.floor(Date.now() / 1000)) return null
    return { sub: claims.sub, email: claims.email, plan: claims.plan }
  } catch {
    return null
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('JWT helpers', () => {
  const secret = 'test-secret-key-min-32-chars-long!!'

  it('generates a valid 3-part JWT', async () => {
    const token = await generateToken('acc_123', 'user@example.com', 'free', secret)
    expect(token.split('.')).toHaveLength(3)
  })

  it('verifies a token it generated', async () => {
    const token = await generateToken('acc_123', 'user@example.com', 'free', secret)
    const claims = await verifyToken(token, secret)
    expect(claims).not.toBeNull()
    expect(claims?.sub).toBe('acc_123')
    expect(claims?.email).toBe('user@example.com')
    expect(claims?.plan).toBe('free')
  })

  it('rejects a token with wrong secret', async () => {
    const token = await generateToken('acc_123', 'user@example.com', 'free', secret)
    const claims = await verifyToken(token, 'wrong-secret-key-min-32-chars!!')
    expect(claims).toBeNull()
  })

  it('rejects a tampered payload', async () => {
    const token = await generateToken('acc_123', 'user@example.com', 'free', secret)
    const parts = token.split('.')
    // Tamper with the payload by changing the base64
    const tamperedPayload = b64url(JSON.stringify({
      sub: 'acc_HACKED',
      email: 'hacker@evil.com',
      plan: 'pro',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
    }))
    const tampered = `${parts[0]}.${tamperedPayload}.${parts[2]}`
    const claims = await verifyToken(tampered, secret)
    expect(claims).toBeNull()
  })

  it('rejects a malformed token', async () => {
    expect(await verifyToken('not.a.token', secret)).toBeNull()
    expect(await verifyToken('', secret)).toBeNull()
    expect(await verifyToken('onlyone', secret)).toBeNull()
  })
})

describe('slugify helper', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('My Widget Name')).toBe('my-widget-name')
  })

  it('removes special characters', () => {
    expect(slugify('Café & Bakery!')).toBe('caf-bakery')
  })

  it('collapses multiple hyphens', () => {
    expect(slugify('a---b')).toBe('a-b')
  })

  it('trims leading/trailing whitespace', () => {
    expect(slugify('  trimmed  ')).toBe('trimmed')
  })

  it('limits to 60 chars', () => {
    const long = 'a'.repeat(100)
    expect(slugify(long).length).toBeLessThanOrEqual(60)
  })

  it('handles empty string', () => {
    expect(slugify('')).toBe('')
  })
})
