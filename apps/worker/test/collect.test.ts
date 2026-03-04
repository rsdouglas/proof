/**
 * Tests for testimonial collection logic.
 * Tests validation rules inline.
 */

import { describe, it, expect } from 'vitest'

// ── validation helpers (mirrors collect.ts logic) ──────────────────────────

interface TestimonialInput {
  rating?: number
  body?: string
  author_name?: string
  author_email?: string
  source?: string
}

function validateTestimonial(input: TestimonialInput): string | null {
  if (!input.body || input.body.trim().length === 0) {
    return 'body is required'
  }
  if (input.body.length > 2000) {
    return 'body too long (max 2000 chars)'
  }
  if (!input.author_name || input.author_name.trim().length === 0) {
    return 'author_name is required'
  }
  if (input.author_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.author_email)) {
    return 'author_email is invalid'
  }
  if (input.rating !== undefined) {
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      return 'rating must be integer 1-5'
    }
  }
  return null
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('testimonial validation', () => {
  const valid: TestimonialInput = {
    body: 'This product changed my life!',
    author_name: 'Jane Smith',
    author_email: 'jane@example.com',
    rating: 5,
    source: 'web',
  }

  it('accepts a valid testimonial', () => {
    expect(validateTestimonial(valid)).toBeNull()
  })

  it('rejects missing body', () => {
    expect(validateTestimonial({ ...valid, body: '' })).toBe('body is required')
  })

  it('rejects undefined body', () => {
    const { body: _, ...rest } = valid
    expect(validateTestimonial(rest)).toBe('body is required')
  })

  it('rejects body > 2000 chars', () => {
    expect(validateTestimonial({ ...valid, body: 'x'.repeat(2001) })).toBe('body too long (max 2000 chars)')
  })

  it('rejects missing author_name', () => {
    expect(validateTestimonial({ ...valid, author_name: '' })).toBe('author_name is required')
  })

  it('rejects invalid email', () => {
    expect(validateTestimonial({ ...valid, author_email: 'not-an-email' })).toBe('author_email is invalid')
  })

  it('accepts missing email (optional)', () => {
    const { author_email: _, ...rest } = valid
    expect(validateTestimonial(rest)).toBeNull()
  })

  it('rejects rating < 1', () => {
    expect(validateTestimonial({ ...valid, rating: 0 })).toBe('rating must be integer 1-5')
  })

  it('rejects rating > 5', () => {
    expect(validateTestimonial({ ...valid, rating: 6 })).toBe('rating must be integer 1-5')
  })

  it('rejects non-integer rating', () => {
    expect(validateTestimonial({ ...valid, rating: 3.5 })).toBe('rating must be integer 1-5')
  })

  it('accepts missing rating (optional)', () => {
    const { rating: _, ...rest } = valid
    expect(validateTestimonial(rest)).toBeNull()
  })
})
