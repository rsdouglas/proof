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

const FROM = 'SocialProof <hello@socialproof.dev>'
const SETTINGS_URL = 'https://app.socialproof.dev/settings'


function isNonCriticalEmailPaused(env: any): boolean {
  const value = env?.PAUSE_NONCRITICAL_EMAIL
  return value === '1' || value === 'true' || value === 'yes' || value === 'on'
}

/**
 * Send an email via Resend.
 * Falls back to a no-op in development or when RESEND_API_KEY is not set.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendEmail(payload: EmailPayload, env: any): Promise<void> {
  if (isNonCriticalEmailPaused(env)) {
    console.warn('[email] PAUSE_NONCRITICAL_EMAIL enabled — skipping:', payload.subject, 'to', payload.to)
    return
  }

  if (env?.ENVIRONMENT === 'development' || !env?.RESEND_API_KEY) {
    console.log('[email] Would send:', payload.subject, 'to', payload.to)
    return
  }

  console.log('[email] Attempting send:', payload.subject, 'to', payload.to)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
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
    console.log('[email] Sent OK:', payload.subject, 'status', res.status)
  }
}

/**
 * Email: New testimonial received (sent to widget owner)
 */
export function buildTestimonialReceivedEmail(opts: {
  ownerEmail: string
  ownerName: string
  widgetName: string
  customerName: string
  rating: number
  text: string
  reviewUrl: string
}): EmailPayload {
  const stars = '★'.repeat(opts.rating) + '☆'.repeat(5 - opts.rating)
  const firstName = opts.ownerName.split(' ')[0]

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.1);">
    <!-- Header -->
    <div style="background: #6C5CE7; padding: 24px 32px;">
      <div style="color: #fff; font-size: 18px; font-weight: 700;">✦ SocialProof</div>
    </div>
    <!-- Body -->
    <div style="padding: 32px;">
      <h2 style="margin: 0 0 8px; font-size: 20px; color: #111827;">New testimonial for <em>${opts.widgetName}</em> 🎉</h2>
      <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;">Hey ${firstName} — ${opts.customerName} just left you a review.</p>
      
      <!-- Card -->
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <div style="font-size: 20px; color: #f59e0b; margin-bottom: 8px; letter-spacing: 1px;">${stars}</div>
        <p style="margin: 0 0 12px; font-size: 16px; color: #374151; line-height: 1.6; font-style: italic;">"${opts.text}"</p>
        <div style="font-size: 13px; color: #9ca3af;">— ${opts.customerName}</div>
      </div>
      
      <a href="${opts.reviewUrl}" style="display: inline-block; background: #6C5CE7; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">Review &amp; Approve →</a>
    </div>
    <!-- Footer -->
    <div style="padding: 16px 32px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
      You're receiving this because you have a SocialProof account.<br>
      <a href="${SETTINGS_URL}" style="color: #6b7280;">Manage notifications</a> &nbsp;·&nbsp;
      To unsubscribe, reply to this email with "unsubscribe".
    </div>
  </div>
</body>
</html>`

  const text = `New testimonial for "${opts.widgetName}"

Hey ${firstName} — ${opts.customerName} left you a ${opts.rating}-star review:

"${opts.text}"

— ${opts.customerName}

Review and approve it here: ${opts.reviewUrl}

---
You're receiving this because you have a SocialProof account.
To unsubscribe, reply with "unsubscribe".`

  return {
    to: opts.ownerEmail,
    subject: `New testimonial from ${opts.customerName} 🎉`,
    html,
    text,
  }
}

/**
 * Email: Testimonial approved (sent to the customer who submitted)
 */
export function buildTestimonialApprovedEmail(opts: {
  customerEmail: string
  customerName: string
  widgetName: string
  text: string
  wallUrl: string
}): EmailPayload {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.1);">
    <div style="background: #6C5CE7; padding: 24px 32px;">
      <div style="color: #fff; font-size: 18px; font-weight: 700;">✦ SocialProof</div>
    </div>
    <div style="padding: 32px;">
      <h2 style="margin: 0 0 8px; font-size: 20px; color: #111827;">Your review is live! 🎉</h2>
      <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;">
        Hi ${opts.customerName}, your testimonial for <strong>${opts.widgetName}</strong> has been approved and is now public.
      </p>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6; font-style: italic;">"${opts.text}"</p>
      </div>
      <a href="${opts.wallUrl}" style="display: inline-block; background: #6C5CE7; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">View the testimonial wall →</a>
    </div>
    <div style="padding: 16px 32px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
      Thank you for sharing your experience!<br>
      <a href="${SETTINGS_URL}" style="color: #6b7280;">Manage preferences</a> &nbsp;·&nbsp;
      To unsubscribe, reply to this email with "unsubscribe".
    </div>
  </div>
</body>
</html>`

  const text = `Your review is live! 🎉

Hi ${opts.customerName}, your testimonial for "${opts.widgetName}" has been approved and is now public.

"${opts.text}"

View it here: ${opts.wallUrl}

---
Thank you for sharing your experience!
To unsubscribe, reply with "unsubscribe".`

  return {
    to: opts.customerEmail,
    subject: `Your review for ${opts.widgetName} is live! 🎉`,
    html,
    text,
  }
}

/**
 * Email: Testimonial request (sent to a customer asking for a review)
 */
export function buildTestimonialRequestEmail(opts: {
  customerEmail: string
  customerName?: string
  businessName: string
  ownerName: string
  personalNote?: string
  collectUrl: string
}): EmailPayload {
  const greeting = opts.customerName ? `Hi ${opts.customerName},` : 'Hi,'
  const noteHtml = opts.personalNote
    ? `<div style="background:#f3f0ff;border-left:3px solid #6C5CE7;padding:12px 16px;margin:0 0 24px;border-radius:0 6px 6px 0;">
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${opts.personalNote}</p>
       </div>`
    : ''
  const noteText = opts.personalNote ? `\n${opts.personalNote}\n` : ''

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:#6C5CE7;padding:24px 32px;">
      <div style="color:#fff;font-size:18px;font-weight:700;">✦ SocialProof</div>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Would you share your experience?</h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:14px;">${greeting}</p>
      ${noteHtml}
      <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
        ${opts.ownerName} from <strong>${opts.businessName}</strong> is asking if you'd be willing to share a quick testimonial about your experience.
        It only takes a minute, and it means a lot to their small business.
      </p>
      <a href="${opts.collectUrl}" style="display:inline-block;background:#6C5CE7;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">Share my experience →</a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;">
      You're receiving this because ${opts.ownerName} from ${opts.businessName} invited you.<br>
      To opt out, simply ignore this email or reply with "unsubscribe".
    </div>
  </div>
</body>
</html>`

  const text = `${greeting}
${noteText}
${opts.ownerName} from ${opts.businessName} is asking if you'd share a quick testimonial about your experience. It takes just a minute:

${opts.collectUrl}

---
To opt out, reply with "unsubscribe".`

  return {
    to: opts.customerEmail,
    subject: `${opts.ownerName} from ${opts.businessName} would love your feedback`,
    html,
    text,
  }
}
