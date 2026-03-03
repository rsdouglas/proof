/**
 * Email notification helpers using Resend.
 * All sends are fire-and-forget — testimonial still saves if email fails.
 */

const FROM_ADDRESS = 'Proof <notifications@useproof.com>'
const DASHBOARD_URL = 'https://app.useproof.com'

function stars(rating: number): string {
  return '<span style="color:#f59e0b;font-size:20px">' +
    '★'.repeat(rating) + '☆'.repeat(5 - rating) +
    '</span>'
}

function emailWrapper(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:560px;margin:40px auto;padding:0 16px">
  <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="background:#6C5CE7;padding:24px 32px">
      <span style="color:#fff;font-weight:700;font-size:18px;letter-spacing:-0.3px">✦ Proof</span>
    </div>
    <div style="padding:32px">${content}</div>
  </div>
  <p style="text-align:center;margin:20px 0;color:#9ca3af;font-size:12px">
    <a href="${DASHBOARD_URL}" style="color:#6C5CE7;text-decoration:none">Proof Dashboard</a>
    &nbsp;&middot;&nbsp;
    <a href="${DASHBOARD_URL}/settings" style="color:#9ca3af;text-decoration:none">Manage notifications</a>
  </p>
</div></body></html>`
}

export interface NewTestimonialOptions {
  ownerEmail: string
  customerName: string
  testimonialText: string
  rating: number | null
  widgetName: string
  testimonialId: string
}

export interface ApprovalConfirmationOptions {
  customerEmail: string
  customerName: string
  businessName: string
}

export async function sendNewTestimonialEmail(
  apiKey: string,
  opts: NewTestimonialOptions
): Promise<void> {
  const ratingHtml = opts.rating
    ? `<p style="margin:0 0 16px">${stars(opts.rating)}</p>`
    : ''

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111;font-weight:700">Someone just left a review! ✨</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px">
      <strong>${opts.customerName}</strong> left a testimonial on <strong>${opts.widgetName}</strong>.
    </p>
    ${ratingHtml}
    <div style="background:#f9fafb;border-left:3px solid #6C5CE7;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 24px">
      <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;font-style:italic">"${opts.testimonialText}"</p>
      <p style="margin:12px 0 0;color:#6b7280;font-size:13px">— ${opts.customerName}</p>
    </div>
    <a href="${DASHBOARD_URL}/testimonials?highlight=${opts.testimonialId}"
       style="display:inline-block;background:#6C5CE7;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
      Approve or reject →
    </a>
    <p style="margin:20px 0 0;color:#9ca3af;font-size:13px">Once approved, it will appear live on your widget automatically.</p>
  `)

  await sendEmail(apiKey, {
    from: FROM_ADDRESS,
    to: opts.ownerEmail,
    subject: `New testimonial from ${opts.customerName} \u2728`,
    html,
  })
}

export async function sendApprovalConfirmationEmail(
  apiKey: string,
  opts: ApprovalConfirmationOptions
): Promise<void> {
  const firstName = opts.customerName.split(' ')[0]

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111;font-weight:700">Your review is live, ${firstName}! \uD83C\uDF89</h2>
    <p style="margin:0 0 16px;color:#6b7280;font-size:15px">
      <strong>${opts.businessName}</strong> approved your testimonial and it's now showing on their website.
    </p>
    <p style="margin:0;color:#374151;font-size:15px;line-height:1.6">
      Thank you for taking the time to share your experience. Your words genuinely help small businesses
      get discovered by the people who need them most.
    </p>
    <p style="margin:20px 0 0;color:#9ca3af;font-size:13px">With appreciation,<br>The Proof team</p>
  `)

  await sendEmail(apiKey, {
    from: FROM_ADDRESS,
    to: opts.customerEmail,
    subject: `Your review is live on ${opts.businessName}! \uD83C\uDF89`,
    html,
  })
}

async function sendEmail(
  apiKey: string,
  message: { from: string; to: string; subject: string; html: string }
): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(message),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error(`[email] send failed: ${res.status} ${body}`)
    // fire-and-forget: never throw
  }
}
