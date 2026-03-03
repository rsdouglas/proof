/**
 * Tests for the public testimonial wall helpers.
 * These are pure functions — no DB or KV mocking needed.
 */

import { describe, it, expect } from 'vitest'

// ── Pure helpers (mirrored from wall.ts) ─────────────────────────────────────

function stars(n: number | null): string {
  if (!n) return ''
  const full = Math.min(5, Math.max(0, Math.round(n)))
  return '★'.repeat(full) + '☆'.repeat(5 - full)
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ── Widget slug helpers ───────────────────────────────────────────────────────

function isValidWidgetId(id: string): boolean {
  // Widget IDs are UUIDs
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('stars()', () => {
  it('returns empty string for null', () => {
    expect(stars(null)).toBe('')
  })

  it('returns 5 filled stars for rating 5', () => {
    expect(stars(5)).toBe('★★★★★')
  })

  it('returns 1 filled star + 4 empty for rating 1', () => {
    expect(stars(1)).toBe('★☆☆☆☆')
  })

  it('returns 3 filled stars for rating 3', () => {
    expect(stars(3)).toBe('★★★☆☆')
  })

  it('clamps to 5 max', () => {
    expect(stars(10)).toBe('★★★★★')
  })

  it('clamps to 0 min', () => {
    expect(stars(-1)).toBe('☆☆☆☆☆') // 0 filled, 5 empty
  })

  it('rounds fractional ratings', () => {
    expect(stars(3.7)).toBe('★★★★☆') // rounds to 4
    expect(stars(3.2)).toBe('★★★☆☆') // rounds to 3
  })
})

describe('initials()', () => {
  it('returns first letter of first and last name', () => {
    expect(initials('Jane Smith')).toBe('JS')
  })

  it('handles single name', () => {
    expect(initials('Cher')).toBe('C')
  })

  it('uppercases initials', () => {
    expect(initials('john doe')).toBe('JD')
  })

  it('only uses first two words', () => {
    expect(initials('Mary Jane Watson')).toBe('MJ')
  })

  it('handles empty string gracefully', () => {
    expect(initials('')).toBe('')
  })
})

describe('escapeHtml()', () => {
  it('escapes & characters', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry')
  })

  it('escapes < and > characters', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;')
  })

  it('escapes single quotes', () => {
    expect(escapeHtml("it's great")).toBe('it&#39;s great')
  })

  it('handles XSS attempt', () => {
    const xss = '<script>alert("xss")</script>'
    const escaped = escapeHtml(xss)
    expect(escaped).not.toContain('<script>')
    expect(escaped).not.toContain('</script>')
    expect(escaped).toContain('&lt;script&gt;')
  })

  it('passes through clean strings unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World')
  })
})

describe('widget ID validation', () => {
  it('accepts valid UUID', () => {
    expect(isValidWidgetId('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isValidWidgetId('')).toBe(false)
  })

  it('rejects non-UUID string', () => {
    expect(isValidWidgetId('not-a-uuid')).toBe(false)
  })

  it('rejects UUID with wrong format', () => {
    expect(isValidWidgetId('550e8400-e29b-41d4-a716')).toBe(false)
  })

  it('rejects path traversal attempt', () => {
    expect(isValidWidgetId('../etc/passwd')).toBe(false)
  })
})
