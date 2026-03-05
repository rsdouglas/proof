/**
 * Onboarding drip email sequence for new Vouch users.
 *
 * Revised per CEO spec (issue #231):
 *   Email 1 — Welcome (Day 0, immediate): drive collection link SENDING
 *   Email 2 — Day 2 nudge: "Did anyone see your collection link?"
 *   Email 3 — Day 5 nudge: "One testimonial = 34% more conversions"
 *
 * Suppression: stop all emails once user has ≥1 approved testimonial.
 */

const FROM = 'Vouch <hello@socialproof.dev>'
const COLLECT_BASE = 'https://collect.socialproof.dev/c'
const DASH = 'https://app.socialproof.dev'

function wrap(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:560px;margin:40px auto;padding:0 16px">
  <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="background:#6C5CE7;padding:24px 32px">
      <span style="color:#fff;font-weight:700;font-size:18px;letter-spacing:-0.3px">✦ Vouch</span>
    </div>
    <div style="padding:32px">${body}</div>
  </div>
  <p style="text-align:center;margin:20px 0;color:#9ca3af;font-size:12px">
    <a href="${DASH}" style="color:#6C5CE7;text-decoration:none">Vouch Dashboard</a>
    &nbsp;&middot;&nbsp;
    <a href="${DASH}/settings" style="color:#9ca3af;text-decoration:none">Unsubscribe</a>
  </p>
</div></body></html>`
}

async function send(
  apiKey: string,
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, reply_to: FROM, subject, html }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
}

/** Email 1: Welcome — sent immediately on signup. Drives collection link sending. */
export async function sendWelcomeEmail(
  apiKey: string,
  opts: { email: string; name: string; formId: string }
): Promise<void> {
  const first = opts.name.split(' ')[0]
  const link = `${COLLECT_BASE}/${opts.formId}`
  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#111;font-weight:700">You're in — do this one thing today</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Hey ${first},</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">You've got a collection link ready. Send it to one customer right now — takes 30 seconds.</p>
    <div style="background:#f3f0ff;border-radius:8px;padding:16px 20px;margin:0 0 20px">
      <a href="${link}" style="color:#6C5CE7;font-weight:700;font-size:15px;text-decoration:none;word-break:break-all">${link}</a>
    </div>
    <a href="${link}" style="display:inline-block;background:#6C5CE7;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin:0 0 24px">Copy your link →</a>
    <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6">Just paste this into a Slack message or email to one happy customer:</p>
    <div style="background:#f9fafb;border-left:3px solid #6C5CE7;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 24px">
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;font-style:italic">"Hey [name] — I'm collecting testimonials for my site. Would you mind leaving a quick one? Takes 2 minutes: ${link}"</p>
    </div>
    <p style="margin:0 0 4px;color:#374151;font-size:15px;line-height:1.6">When their testimonial arrives, we'll email you. You approve it. Then paste one line of code and you're live.</p>
    <p style="margin:16px 0 0;color:#6b7280;font-size:14px">— The Vouch team</p>
  `)
  await send(apiKey, opts.email, `You're in — do this one thing today`, html)
}

/** Email 2: Day 2 nudge — "Did anyone see your collection link?" */
export async function sendDay2NudgeEmail(
  apiKey: string,
  opts: { email: string; name: string; formId: string }
): Promise<void> {
  const first = opts.name.split(' ')[0]
  const link = `${COLLECT_BASE}/${opts.formId}`
  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#111;font-weight:700">Did anyone see your collection link?</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Hey ${first},</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Quick check — have you sent your Vouch collection link to a customer yet?</p>
    <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6">Here's your link:</p>
    <div style="background:#f3f0ff;border-radius:8px;padding:16px 20px;margin:0 0 20px">
      <a href="${link}" style="color:#6C5CE7;font-weight:700;font-size:15px;text-decoration:none;word-break:break-all">${link}</a>
    </div>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Most people send it to one happy customer by Slack or email and hear back same day. That's all it takes to get your first testimonial on your site.</p>
    <a href="${link}" style="display:inline-block;background:#6C5CE7;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin:0 0 20px">Send your collection link →</a>
    <p style="margin:16px 0 0;color:#6b7280;font-size:14px">— The Vouch team</p>
  `)
  await send(apiKey, opts.email, `Did anyone see your collection link?`, html)
}

/** Email 3: Day 5 nudge — "One testimonial = 34% more conversions" */
export async function sendDay5NudgeEmail(
  apiKey: string,
  opts: { email: string; name: string; formId: string }
): Promise<void> {
  const first = opts.name.split(' ')[0]
  const link = `${COLLECT_BASE}/${opts.formId}`
  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#111;font-weight:700">One testimonial = 34% more conversions</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Hey ${first},</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">You're one customer away from having social proof on your site.</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Studies show that a single testimonial on a landing page increases conversions by up to 34%. One happy customer saying "this worked for me" does more than any feature bullet point.</p>
    <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6">Here's how to get it in the next hour:</p>
    <ol style="margin:0 0 20px;padding-left:20px;color:#374151;font-size:15px;line-height:1.8">
      <li>Think of one customer who got a great result</li>
      <li>Send them this link by Slack, email, or text</li>
      <li>They fill it in — takes 2 minutes</li>
    </ol>
    <div style="background:#f3f0ff;border-radius:8px;padding:16px 20px;margin:0 0 20px">
      <a href="${link}" style="color:#6C5CE7;font-weight:700;font-size:15px;text-decoration:none;word-break:break-all">${link}</a>
    </div>
    <a href="${link}" style="display:inline-block;background:#6C5CE7;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin:0 0 20px">Get your first testimonial →</a>
    <p style="margin:16px 0 0;color:#6b7280;font-size:14px">— The Vouch team</p>
  `)
  await send(apiKey, opts.email, `One testimonial = 34% more conversions`, html)
}

// ── Legacy emails — kept for cron backward-compat, but drip now uses Day2/Day5 ──

/** @deprecated Use sendDay2NudgeEmail instead */
export async function sendNudgeEmail(
  apiKey: string,
  opts: { email: string; name: string; widgetId: string }
): Promise<void> {
  // Redirect to Day2 nudge with same formId
  await sendDay2NudgeEmail(apiKey, { email: opts.email, name: opts.name, formId: opts.widgetId })
}

/** @deprecated Use sendDay5NudgeEmail instead */
export async function sendCheckinEmail(
  apiKey: string,
  opts: { email: string; name: string; widgetId: string; testimonialCount: number }
): Promise<void> {
  await sendDay5NudgeEmail(apiKey, { email: opts.email, name: opts.name, formId: opts.widgetId })
}

/** @deprecated No longer used in revised drip */
export async function send1hNudgeEmail(
  _apiKey: string,
  opts: { email: string; name: string; collectFormId: string }
): Promise<void> {
  // Suppressed — 1h nudge removed from revised spec
  console.log(`[onboarding] 1h nudge suppressed (retired): ${opts.email}`)
}

/** Celebration email — sent when first testimonial is approved */
export async function sendCelebrationEmail(
  apiKey: string,
  opts: { email: string; name: string; widgetId: string; testimonialAuthor: string; testimonialText: string }
): Promise<void> {
  const first = opts.name.split(' ')[0]
  const snippet = `<script src="https://widget.socialproof.dev/v1/vouch.js" data-widget-id="${opts.widgetId}" async></script>`
  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#111;font-weight:700">🎉 Your first testimonial just arrived!</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Hey ${first},</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6"><strong>${opts.testimonialAuthor}</strong> just left you a testimonial:</p>
    <div style="background:#f9fafb;border-left:3px solid #6C5CE7;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 24px">
      <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;font-style:italic">"${opts.testimonialText}"</p>
    </div>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Now put it on your site. Paste this one line of code where you want your widget to appear:</p>
    <div style="background:#1e1e2e;border-radius:8px;padding:16px 20px;margin:0 0 20px;overflow-x:auto">
      <code style="color:#a6e3a1;font-size:13px;font-family:'Courier New',monospace;white-space:pre-wrap;word-break:break-all">${snippet.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>
    </div>
    <a href="${DASH}" style="display:inline-block;background:#6C5CE7;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin:0 0 20px">Go to dashboard →</a>
    <p style="margin:16px 0 0;color:#6b7280;font-size:14px">— The Vouch team</p>
  `)
  await send(apiKey, opts.email, `🎉 Your first testimonial just arrived`, html)
}

/** Embed nudge email — sent when user has testimonials but hasn't embedded the widget */
export async function sendEmbedNudgeEmail(
  apiKey: string,
  opts: { email: string; name: string; approvedCount: number; widgetId: string }
): Promise<void> {
  const first = opts.name.split(' ')[0]
  const snippet = `<script src="https://widget.socialproof.dev/v1/vouch.js" data-widget-id="${opts.widgetId}" async></script>`
  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#111;font-weight:700">Your testimonials are ready — add them to your site</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Hey ${first},</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">You've got <strong>${opts.approvedCount} approved testimonial${opts.approvedCount > 1 ? 's' : ''}</strong> sitting in Vouch — but they're not on your site yet.</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">One paste is all it takes:</p>
    <div style="background:#1e1e2e;border-radius:8px;padding:16px 20px;margin:0 0 20px;overflow-x:auto">
      <code style="color:#a6e3a1;font-size:13px;font-family:'Courier New',monospace;white-space:pre-wrap;word-break:break-all">${snippet.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>
    </div>
    <a href="${DASH}" style="display:inline-block;background:#6C5CE7;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin:0 0 20px">Get embed code →</a>
    <p style="margin:16px 0 0;color:#6b7280;font-size:14px">— The Vouch team</p>
  `)
  await send(apiKey, opts.email, `Your testimonials are ready — add them to your site`, html)
}
