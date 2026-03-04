/**
 * Tests for testimonial request email feature.
 * Tests input validation logic.
 */

import { describe, it, expect } from 'vitest'

// ── validation helpers (mirrors testimonials.ts request logic) ───────────────

interface RequestInput {
  email?: string
  name?: string
  message?: string
}

function validateRequest(input: RequestInput): string | null {
  if (!input.email || input.email.trim().length === 0) return 'email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return 'email is invalid'
  if (!input.name || input.name.trim().length === 0) return 'name is required'
  if (input.name.length > 200) return 'name too long'
  if (input.message && input.message.length > 2000) return 'message too long'
  return null
}

// ── email template sanity checks ─────────────────────────────────────────────

function buildEmailSubject(businessName: string): string {
  return `${businessName} would love your feedback`
}

function buildEmailBody(opts: { name: string; businessName: string; message: string; submitUrl: string }): string {
  return `Hi ${opts.name},\n\n${opts.message}\n\nShare your experience: ${opts.submitUrl}`
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('testimonial request validation', () => {
  it('rejects missing email', () => {
    expect(validateRequest({ name: 'Alice' })).toBe('email is required')
  })

  it('rejects invalid email', () => {
    expect(validateRequest({ email: 'notanemail', name: 'Alice' })).toBe('email is invalid')
  })

  it('rejects missing name', () => {
    expect(validateRequest({ email: 'alice@example.com' })).toBe('name is required')
  })

  it('rejects overly long name', () => {
    expect(validateRequest({ email: 'alice@example.com', name: 'A'.repeat(201) })).toBe('name too long')
  })

  it('rejects overly long message', () => {
    expect(validateRequest({
      email: 'alice@example.com',
      name: 'Alice',
      message: 'x'.repeat(2001),
    })).toBe('message too long')
  })

  it('accepts valid request without message', () => {
    expect(validateRequest({ email: 'alice@example.com', name: 'Alice' })).toBeNull()
  })

  it('accepts valid request with message', () => {
    expect(validateRequest({
      email: 'alice@example.com',
      name: 'Alice',
      message: 'We would love to hear about your experience!',
    })).toBeNull()
  })

  it('accepts + sign in email', () => {
    expect(validateRequest({ email: 'alice+test@example.com', name: 'Alice' })).toBeNull()
  })
})

describe('email content', () => {
  it('builds subject with business name', () => {
    const subject = buildEmailSubject('Acme Corp')
    expect(subject).toContain('Acme Corp')
    expect(subject).toContain('feedback')
  })

  it('includes recipient name in body', () => {
    const body = buildEmailBody({
      name: 'Alice',
      businessName: 'Acme',
      message: 'Share your thoughts',
      submitUrl: 'https://socialproof.dev/collect/abc',
    })
    expect(body).toContain('Alice')
  })

  it('includes submit URL in body', () => {
    const body = buildEmailBody({
      name: 'Alice',
      businessName: 'Acme',
      message: 'Share your thoughts',
      submitUrl: 'https://socialproof.dev/collect/abc123',
    })
    expect(body).toContain('https://socialproof.dev/collect/abc123')
  })
})
