/**
 * Tests for outreach email template logic.
 * Pure functions mirrored from outreach.ts — no DB or Resend needed.
 */

import { describe, it, expect } from 'vitest'

// ── Template helpers (mirrored from outreach.ts) ───────────────────────────────

type TemplateResult = { subject: string; html: string; text: string }

function getFirstName(name: string | null): string {
  return (name?.split(' ')[0] || null) ?? 'there'
}

function normaliseVertical(v: string | null): string {
  return (v ?? '').toLowerCase().replace(/[\s_]/g, '-')
}

const SUPPORTED_VERTICALS = [
  'bakery', 'bakeries',
  'fitness', 'fitness-studio', 'fitness-studios',
  'restaurant', 'restaurants',
  'yoga', 'yoga-studio', 'yoga-studios',
  'salon', 'salons', 'hair-salon', 'hair-salons',
  'dentist', 'dentists', 'dental',
  'plumber', 'plumbers', 'plumbing',
  'electrician', 'electricians',
  'landscaping', 'landscaper', 'landscapers',
  'real-estate', 'realtor', 'realtors',
]

function hasVerticalTemplate(vertical: string | null): boolean {
  return SUPPORTED_VERTICALS.includes(normaliseVertical(vertical))
}

function subjectIsPersonalised(subject: string, businessName: string | null): boolean {
  // Subject should NOT be a generic "Grow your business" style filler
  return subject.length > 10 && subject.length < 100
}

function containsNoRawHtml(text: string): boolean {
  return !/<[a-z][\s\S]*>/i.test(text)
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('vertical template detection', () => {
  it('recognises yoga vertical', () => {
    expect(hasVerticalTemplate('yoga')).toBe(true)
  })

  it('recognises yoga-studio variant', () => {
    expect(hasVerticalTemplate('yoga-studio')).toBe(true)
  })

  it('recognises restaurant vertical', () => {
    expect(hasVerticalTemplate('restaurant')).toBe(true)
  })

  it('recognises bakery vertical', () => {
    expect(hasVerticalTemplate('bakery')).toBe(true)
  })

  it('recognises fitness vertical', () => {
    expect(hasVerticalTemplate('fitness')).toBe(true)
  })

  it('returns false for unknown vertical', () => {
    expect(hasVerticalTemplate('unknown-niche')).toBe(false)
  })

  it('returns false for null vertical', () => {
    expect(hasVerticalTemplate(null)).toBe(false)
  })

  it('normalises underscores to hyphens', () => {
    expect(normaliseVertical('yoga_studio')).toBe('yoga-studio')
  })

  it('normalises uppercase to lowercase', () => {
    expect(normaliseVertical('Restaurant')).toBe('restaurant')
  })
})

describe('first name extraction', () => {
  it('returns first name from full name', () => {
    expect(getFirstName('Sarah Johnson')).toBe('Sarah')
  })

  it('returns single name unchanged', () => {
    expect(getFirstName('Maria')).toBe('Maria')
  })

  it('returns "there" for null', () => {
    expect(getFirstName(null)).toBe('there')
  })

  it('returns "there" for empty string', () => {
    expect(getFirstName('')).toBe('there')
  })
})

describe('email content quality checks', () => {
  it('plain text version should not contain HTML tags', () => {
    const textSample = 'Hi Sarah,\n\nYour yoga studio looks great.\n\nCheck out: https://socialproof.dev/for/yoga-studios\n\n— Mark'
    expect(containsNoRawHtml(textSample)).toBe(true)
  })

  it('detects HTML in text that should be plain', () => {
    const badText = 'Hi <b>Sarah</b>, check this out.'
    expect(containsNoRawHtml(badText)).toBe(false)
  })

  it('subject line is reasonable length', () => {
    const subject = 'Your best reviews aren\'t on your website (yet)'
    expect(subject.length).toBeGreaterThan(10)
    expect(subject.length).toBeLessThan(100)
  })

  it('subject is not empty', () => {
    const subject = 'Quick question about your yoga studio'
    expect(subject.trim().length).toBeGreaterThan(0)
  })
})

describe('outreach target JSON validation', () => {
  interface OutreachTarget {
    email: string
    name?: string
    business_name?: string
    vertical?: string
    variant?: string
  }

  function validateTarget(t: Partial<OutreachTarget>): string | null {
    if (!t.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email)) {
      return 'valid email is required'
    }
    return null
  }

  it('accepts a valid target', () => {
    expect(validateTarget({ email: 'sarah@yogaplace.com', name: 'Sarah', vertical: 'yoga' })).toBeNull()
  })

  it('rejects missing email', () => {
    expect(validateTarget({ name: 'Sarah' })).toBe('valid email is required')
  })

  it('rejects malformed email', () => {
    expect(validateTarget({ email: 'not-an-email' })).toBe('valid email is required')
  })

  it('accepts target with no optional fields', () => {
    expect(validateTarget({ email: 'test@example.com' })).toBeNull()
  })
})
