import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendEmail } from '../src/routes/email'

describe('sendEmail', () => {
  const payload = {
    to: 'user@example.com',
    subject: 'Your SocialProof verification code',
    html: '<p>123456</p>',
    text: '123456',
  }
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('sends through SES when configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 200 }))
    global.fetch = fetchMock as typeof fetch

    await sendEmail(payload, {
      ENVIRONMENT: 'production',
      SES_AWS_ACCESS_KEY_ID: 'AKIA_TEST',
      SES_AWS_SECRET_ACCESS_KEY: 'secret-test-key',
      SES_REGION: 'us-west-2',
      SES_FROM_EMAIL: 'hello@socialproof.dev',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://email.us-west-2.amazonaws.com/v2/email/outbound-emails')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toMatchObject({ 'content-type': 'application/json' })
    const parsed = JSON.parse(String(init?.body))
    expect(parsed.FromEmailAddress).toBe('hello@socialproof.dev')
    expect(parsed.Destination.ToAddresses).toEqual(['user@example.com'])
    expect(parsed.Content.Simple.Subject.Data).toBe('Your SocialProof verification code')
  })

  it('skips gracefully when SES config is missing', async () => {
    const fetchMock = vi.fn()
    global.fetch = fetchMock as typeof fetch
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await sendEmail(payload, {
      ENVIRONMENT: 'production',
      SES_REGION: 'us-west-2',
    })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith('[email] SES config missing — skipping:', payload.subject, 'to', payload.to)
  })
})
