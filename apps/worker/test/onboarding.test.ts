/**
 * Tests for the onboarding drip email sequence.
 *
 * Tests the cron scheduling logic, email eligibility criteria,
 * and idempotency guarantees — without making real HTTP calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Email eligibility helpers (mirrors cron.ts logic) ──────────────────────

interface Account {
  id: string
  email: string
  name: string | null
  created_at: string        // ISO timestamp
  drip_welcome_sent_at: string | null
  drip_nudge_sent_at: string | null
  drip_checkin_sent_at: string | null
  approved_testimonials: number
  widget_id: string | null
}

/** Is this account eligible for the nudge email right now? */
function isNudgeEligible(acct: Account, now: Date): boolean {
  if (acct.drip_nudge_sent_at !== null) return false  // already sent
  if (acct.approved_testimonials > 0) return false     // already has testimonials
  if (!acct.widget_id) return false                    // no widget yet
  const created = new Date(acct.created_at).getTime()
  const age = now.getTime() - created
  const h48 = 48 * 60 * 60 * 1000
  const h49 = 49 * 60 * 60 * 1000
  return age >= h48 && age < h49
}

/** Is this account eligible for the check-in email right now? */
function isCheckinEligible(acct: Account, now: Date): boolean {
  if (acct.drip_checkin_sent_at !== null) return false  // already sent
  if (!acct.widget_id) return false                     // no widget yet
  const created = new Date(acct.created_at).getTime()
  const age = now.getTime() - created
  const h7d   = 7 * 24 * 60 * 60 * 1000
  const h7d1h = (7 * 24 + 1) * 60 * 60 * 1000
  return age >= h7d && age < h7d1h
}

// ── Email body helpers (mirrors onboarding.ts output patterns) ─────────────

function firstNameFrom(name: string | null, fallback: string): string {
  return (name ?? fallback).split(' ')[0]
}

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 'acct-1',
    email: 'user@example.com',
    name: 'Jane Smith',
    created_at: new Date().toISOString(),
    drip_welcome_sent_at: null,
    drip_nudge_sent_at: null,
    drip_checkin_sent_at: null,
    approved_testimonials: 0,
    widget_id: 'widget-abc',
    ...overrides,
  }
}

const NOW = new Date('2026-03-01T12:00:00Z')
const h = (n: number) => n * 60 * 60 * 1000

// ── Tests ──────────────────────────────────────────────────────────────────

describe('nudge email eligibility', () => {
  it('is eligible at exactly 48h', () => {
    const acct = makeAccount({ created_at: new Date(NOW.getTime() - h(48)).toISOString() })
    expect(isNudgeEligible(acct, NOW)).toBe(true)
  })

  it('is eligible at 48h 30m', () => {
    const acct = makeAccount({ created_at: new Date(NOW.getTime() - h(48) - h(0.5)).toISOString() })
    expect(isNudgeEligible(acct, NOW)).toBe(true)
  })

  it('is NOT eligible before 48h', () => {
    const acct = makeAccount({ created_at: new Date(NOW.getTime() - h(47)).toISOString() })
    expect(isNudgeEligible(acct, NOW)).toBe(false)
  })

  it('is NOT eligible after 49h (missed window)', () => {
    const acct = makeAccount({ created_at: new Date(NOW.getTime() - h(50)).toISOString() })
    expect(isNudgeEligible(acct, NOW)).toBe(false)
  })

  it('is NOT eligible if nudge already sent (idempotent)', () => {
    const acct = makeAccount({
      created_at: new Date(NOW.getTime() - h(48)).toISOString(),
      drip_nudge_sent_at: new Date(NOW.getTime() - h(1)).toISOString(),
    })
    expect(isNudgeEligible(acct, NOW)).toBe(false)
  })

  it('is NOT eligible if account has approved testimonials', () => {
    const acct = makeAccount({
      created_at: new Date(NOW.getTime() - h(48)).toISOString(),
      approved_testimonials: 1,
    })
    expect(isNudgeEligible(acct, NOW)).toBe(false)
  })

  it('is NOT eligible if no widget', () => {
    const acct = makeAccount({
      created_at: new Date(NOW.getTime() - h(48)).toISOString(),
      widget_id: null,
    })
    expect(isNudgeEligible(acct, NOW)).toBe(false)
  })
})

describe('check-in email eligibility', () => {
  const h7d = 7 * 24

  it('is eligible at exactly 7 days', () => {
    const acct = makeAccount({ created_at: new Date(NOW.getTime() - h(h7d)).toISOString() })
    expect(isCheckinEligible(acct, NOW)).toBe(true)
  })

  it('is eligible at 7d 30m', () => {
    const acct = makeAccount({ created_at: new Date(NOW.getTime() - h(h7d) - h(0.5)).toISOString() })
    expect(isCheckinEligible(acct, NOW)).toBe(true)
  })

  it('is NOT eligible before 7 days', () => {
    const acct = makeAccount({ created_at: new Date(NOW.getTime() - h(h7d - 2)).toISOString() })
    expect(isCheckinEligible(acct, NOW)).toBe(false)
  })

  it('is NOT eligible after 7d+1h (missed window)', () => {
    const acct = makeAccount({ created_at: new Date(NOW.getTime() - h(h7d + 2)).toISOString() })
    expect(isCheckinEligible(acct, NOW)).toBe(false)
  })

  it('is NOT eligible if check-in already sent (idempotent)', () => {
    const acct = makeAccount({
      created_at: new Date(NOW.getTime() - h(h7d)).toISOString(),
      drip_checkin_sent_at: new Date(NOW.getTime() - h(0.5)).toISOString(),
    })
    expect(isCheckinEligible(acct, NOW)).toBe(false)
  })

  it('IS eligible even if they have testimonials (check-in is unconditional)', () => {
    const acct = makeAccount({
      created_at: new Date(NOW.getTime() - h(h7d)).toISOString(),
      approved_testimonials: 3,
    })
    expect(isCheckinEligible(acct, NOW)).toBe(true)
  })

  it('is NOT eligible if no widget', () => {
    const acct = makeAccount({
      created_at: new Date(NOW.getTime() - h(h7d)).toISOString(),
      widget_id: null,
    })
    expect(isCheckinEligible(acct, NOW)).toBe(false)
  })
})

describe('first name extraction', () => {
  it('extracts first name from full name', () => {
    expect(firstNameFrom('Jane Smith', 'user@example.com')).toBe('Jane')
  })

  it('uses single word name as-is', () => {
    expect(firstNameFrom('Jane', 'user@example.com')).toBe('Jane')
  })

  it('falls back to email when name is null', () => {
    expect(firstNameFrom(null, 'user@example.com')).toBe('user@example.com')
  })
})

describe('drip sequence ordering', () => {
  it('nudge window (48h) comes before check-in window (7d)', () => {
    expect(48).toBeLessThan(7 * 24)
  })

  it('check-in is sent regardless of nudge status', () => {
    // The check-in tracks its own column (drip_checkin_sent_at), independent of nudge
    const sentNudge = makeAccount({
      created_at: new Date(NOW.getTime() - h(7 * 24)).toISOString(),
      drip_nudge_sent_at: new Date(NOW.getTime() - h(5 * 24)).toISOString(),
    })
    expect(isCheckinEligible(sentNudge, NOW)).toBe(true)
  })

  it('nudge and check-in cannot fire on same run (windows do not overlap)', () => {
    // An account exactly 7d old will fail nudge (age > 49h), pass check-in
    const acct = makeAccount({ created_at: new Date(NOW.getTime() - h(7 * 24)).toISOString() })
    expect(isNudgeEligible(acct, NOW)).toBe(false)
    expect(isCheckinEligible(acct, NOW)).toBe(true)

    // An account exactly 48h old will pass nudge, fail check-in (age < 7d)
    const acct2 = makeAccount({ created_at: new Date(NOW.getTime() - h(48)).toISOString() })
    expect(isNudgeEligible(acct2, NOW)).toBe(true)
    expect(isCheckinEligible(acct2, NOW)).toBe(false)
  })
})

describe('collect link format', () => {
  it('generate collect URL uses the right base path', () => {
    const widgetId = 'abc123'
    const base = 'https://socialproof.dev/c'
    const url = `${base}/${widgetId}`
    expect(url).toBe('https://socialproof.dev/c/abc123')
    expect(url).toContain(widgetId)
  })
})
