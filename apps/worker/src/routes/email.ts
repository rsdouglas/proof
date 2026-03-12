
export interface EmailPayload {
  to: string
  toName?: string
  subject: string
  html: string
  text: string
}

const SETTINGS_URL = 'https://app.socialproof.dev/settings'


function isNonCriticalEmailPaused(env: any): boolean {
  const value = env?.PAUSE_NONCRITICAL_EMAIL
  return value === '1' || value === 'true' || value === 'yes' || value === 'on'
}

function hasSesConfig(env: any): boolean {
  return Boolean(
    env?.SES_AWS_ACCESS_KEY_ID &&
    env?.SES_AWS_SECRET_ACCESS_KEY &&
    env?.SES_REGION &&
    env?.SES_FROM_EMAIL
  )
}

function buildSesBody(payload: EmailPayload, env: any): string {
  return JSON.stringify({
    FromEmailAddress: env.SES_FROM_EMAIL,
    Destination: { ToAddresses: [payload.to] },
    Content: {
      Simple: {
        Subject: { Data: payload.subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: payload.html, Charset: 'UTF-8' },
          Text: { Data: payload.text, Charset: 'UTF-8' },
        },
      },
    },
  })
}

async function signAndSendSesEmail(payload: EmailPayload, env: any): Promise<Response> {
  const endpoint = `https://email.${env.SES_REGION}.amazonaws.com/v2/email/outbound-emails`
  const body = buildSesBody(payload, env)
  const url = new URL(endpoint)
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)

  const encoder = new TextEncoder()
  const toHex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('')
  const sha256Hex = async (value: string) => toHex(await crypto.subtle.digest('SHA-256', encoder.encode(value)))
  const importHmacKey = async (key: BufferSource) => crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const hmac = async (key: BufferSource, value: string) => crypto.subtle.sign('HMAC', await importHmacKey(key), encoder.encode(value))

  const payloadHash = await sha256Hex(body)
  const canonicalHeaders = [
    'content-type:application/json',
    `host:${url.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join('\n')
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date'
  const canonicalRequest = ['POST', url.pathname, '', `${canonicalHeaders}\n`, signedHeaders, payloadHash].join('\n')
  const credentialScope = `${dateStamp}/${env.SES_REGION}/ses/aws4_request`
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, await sha256Hex(canonicalRequest)].join('\n')

  const kDate = await hmac(encoder.encode(`AWS4${env.SES_AWS_SECRET_ACCESS_KEY}`), dateStamp)
  const kRegion = await hmac(kDate, env.SES_REGION)
  const kService = await hmac(kRegion, 'ses')
  const kSigning = await hmac(kService, 'aws4_request')
  const signature = toHex(await hmac(kSigning, stringToSign))
  const authorization = `AWS4-HMAC-SHA256 Credential=${env.SES_AWS_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      Authorization: authorization,
    },
    body,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendEmail(payload: EmailPayload, env: any): Promise<void> {
  if (isNonCriticalEmailPaused(env)) {
    console.warn('[email] PAUSE_NONCRITICAL_EMAIL enabled — skipping:', payload.subject, 'to', payload.to)
    return
  }

  if (env?.ENVIRONMENT === 'development') {
    console.log('[email] Would send:', payload.subject, 'to', payload.to)
    return
  }

  if (!hasSesConfig(env)) {
    console.warn('[email] SES config missing — skipping:', payload.subject, 'to', payload.to)
    return
  }

  console.log('[email] Attempting SES send:', payload.subject, 'to', payload.to)
  const res = await signAndSendSesEmail(payload, env)

  if (!res.ok) {
    const err = await res.text().catch(() => 'unknown')
    console.error('[email] SES error:', res.status, err)
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
