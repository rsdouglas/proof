/**
 * Email notification helpers using Cloudflare Email Workers / Mailchannels.
 * 
 * Cloudflare Workers can send transactional email via Mailchannels (free for CF workers).
 * Docs: https://developers.cloudflare.com/pages/functions/plugins/mailchannels/
 * 
 * We use the sendEmail helper which calls the Mailchannels API directly.
 * No API key required when called from a Cloudflare Worker with dkim configured.
 */

export interface EmailPayload {
  to: string
  toName?: string
  subject: string
  html: string
  text: string
}

/**
 * Send an email via MailChannels (Cloudflare Workers native).
 * Falls back to a no-op in development.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendEmail(payload: EmailPayload, env: any): Promise<void> {
  if (env?.ENVIRONMENT === 'development') {
    console.log('[email] Dev mode — would send:', payload.subject, 'to', payload.to)
    return
  }

  const body = {
    personalizations: [
      {
        to: [{ email: payload.to, name: payload.toName || payload.to }],
      },
    ],
    from: {
      email: 'notifications@socialproof.dev',
      name: 'SocialProof',
    },
    subject: payload.subject,
    content: [
      { type: 'text/plain', value: payload.text },
      { type: 'text/html', value: payload.html },
    ],
  }

  const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => 'unknown')
    console.error('[email] MailChannels error:', res.status, err)
    // Don't throw — email failure shouldn't break the main flow
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
  
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.1);">
    <!-- Header -->
    <div style="background: #2563eb; padding: 24px 32px;">
      <div style="color: #fff; font-size: 18px; font-weight: 700;">SocialProof</div>
    </div>
    <!-- Body -->
    <div style="padding: 32px;">
      <h2 style="margin: 0 0 8px; font-size: 20px; color: #111827;">New testimonial for <em>${opts.widgetName}</em> 🎉</h2>
      <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;">${opts.customerName} left you a review.</p>
      
      <!-- Card -->
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <div style="font-size: 20px; color: #f59e0b; margin-bottom: 8px; letter-spacing: 1px;">${stars}</div>
        <p style="margin: 0 0 12px; font-size: 16px; color: #374151; line-height: 1.6; font-style: italic;">"${opts.text}"</p>
        <div style="font-size: 13px; color: #9ca3af;">— ${opts.customerName}</div>
      </div>
      
      <a href="${opts.reviewUrl}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">Review &amp; Approve →</a>
    </div>
    <!-- Footer -->
    <div style="padding: 16px 32px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
      You're receiving this because you have a widget on SocialProof.<br>
      <a href="https://socialproof.dev/settings" style="color: #6b7280;">Manage notifications</a>
    </div>
  </div>
</body>
</html>`

  const text = `New testimonial for "${opts.widgetName}"

${opts.customerName} left you a ${opts.rating}-star review:

"${opts.text}"

Review and approve: ${opts.reviewUrl}

--
SocialProof | Manage notifications: https://socialproof.dev/settings`

  return {
    to: opts.ownerEmail,
    toName: opts.ownerName,
    subject: `⭐ New ${opts.rating}-star review for "${opts.widgetName}"`,
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
    <div style="background: #10b981; padding: 24px 32px;">
      <div style="color: #fff; font-size: 18px; font-weight: 700;">SocialProof</div>
    </div>
    <div style="padding: 32px;">
      <h2 style="margin: 0 0 8px; font-size: 20px; color: #111827;">Your review is live! 🎉</h2>
      <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;">
        Hi ${opts.customerName}, your testimonial for <strong>${opts.widgetName}</strong> has been approved and is now public.
      </p>
      
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6; font-style: italic;">"${opts.text}"</p>
      </div>
      
      <a href="${opts.wallUrl}" style="display: inline-block; background: #10b981; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">View the testimonial wall →</a>
    </div>
    <div style="padding: 16px 32px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
      Thank you for sharing your experience!
    </div>
  </div>
</body>
</html>`

  const text = `Your review is live!

Hi ${opts.customerName}, your testimonial for "${opts.widgetName}" has been approved.

"${opts.text}"

View the testimonial wall: ${opts.wallUrl}

Thank you for sharing your experience!
--
SocialProof`

  return {
    to: opts.customerEmail,
    toName: opts.customerName,
    subject: `Your review for "${opts.widgetName}" is now live!`,
    html,
    text,
  }
}
