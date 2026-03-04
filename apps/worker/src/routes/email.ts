/**
 * Email notification helpers using Resend.
 *
 * All transactional email goes through Resend (https://resend.com).
 * Requires RESEND_API_KEY secret set via `wrangler secret put RESEND_API_KEY`.
 *
 * MailChannels ended their free Cloudflare Workers integration in 2024 — removed.
 */

export interface EmailPayload {
  to: string
  toName?: string
  subject: string
  html: string
  text: string
}

const FROM = 'Vouch <hello@socialproof.dev>'
const SETTINGS_URL = 'https://app.socialproof.dev/settings'

/**
 * Send an email via Resend.
 * Falls back to a no-op in development or when RESEND_API_KEY is not set.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendEmail(payload: EmailPayload, env: any): Promise<void> {
  if (env?.ENVIRONMENT === 'development' || !env?.RESEND_API_KEY) {
    console.log('[email] Would send:', payload.subject, 'to', payload.to)
    return
  }

  console.log('[email] Attempting send:', payload.subject, 'to', payload.to)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => 'unknown')
    console.error('[email] Resend error:', res.status, err)
    // Don't throw — email failure shouldn't break the main flow
  } else {
    const data = await res.json().catch(() => ({})) as { id?: string }
    console.log('[email] Resend success: status', res.status, 'id', data.id ?? 'unknown', 'subject:', payload.subject)
  }
}