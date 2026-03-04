/**
 * Onboarding drip email sequence for new Vouch users.
 * Email 1: Welcome (Day 0, on signup)
 * Email 2: Nudge (Day 2, if no testimonials yet)
 * Email 3: Check-in (Day 7, personalized on testimonial count)
 * Copy: docs/onboarding-emails.md
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

/** Email 1: Welcome — sent immediately on signup */
export async function sendWelcomeEmail(
  apiKey: string,
  opts: { email: string; name: string; widgetId: string }
): Promise<void> {
  const first = opts.name.split(' ')[0]
  const link = `${COLLECT_BASE}/${opts.widgetId}`
  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#111;font-weight:700">You're in — here's your Vouch link 👇</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Hey ${first},</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Welcome to Vouch. You're 3 minutes away from your first testimonial.</p>
    <p style="margin:0 0 8px;color:#374151;font-size:15px">Here's your personal collection link:</p>
    <div style="background:#f3f0ff;border-radius:8px;padding:16px 20px;margin:0 0 20px">
      <a href="${link}" style="color:#6C5CE7;font-weight:700;font-size:15px;text-decoration:none;word-break:break-all">${link}</a>
    </div>
    <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6">Send this to one customer who had a great experience. Copy this into an email or DM:</p>
    <div style="background:#f9fafb;border-left:3px solid #6C5CE7;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 20px">
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;font-style:italic">"Hey [name] — I'm collecting a quick testimonial for my website. Would you mind sharing a few words? Takes 2 minutes: ${link}"</p>
    </div>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Once they submit, you'll get an email. You approve it, and a widget appears on your site with their words. The widget code is in your dashboard. One paste. Any website.</p>
    <a href="${DASH}" style="display:inline-block;background:#6C5CE7;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin:0 0 20px">Go to your dashboard →</a>
    <p style="margin:16px 0 4px;color:#374151;font-size:15px">Questions? Just reply to this email.</p>
    <p style="margin:0 0 20px;color:#374151;font-size:15px">— The Vouch team</p>
    <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5">P.S. Most people who get a testimonial in the first 24 hours stay with Vouch. Most people who don't... forget about it. Don't forget about it.</p>
  `)
  await send(apiKey, opts.email, "You're in — here's your Vouch link 👇", html)
}

/** Email 2: Nudge — sent 48h after signup if no testimonials yet */
export async function sendNudgeEmail(
  apiKey: string,
  opts: { email: string; name: string; widgetId: string }
): Promise<void> {
  const first = opts.name.split(' ')[0]
  const link = `${COLLECT_BASE}/${opts.widgetId}`
  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#111;font-weight:700">Did you send the link yet?</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Hey ${first},</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Quick check-in: have you sent your Vouch link to a customer yet?</p>
    <p style="margin:0 0 8px;color:#374151;font-size:15px">Here it is again:</p>
    <div style="background:#f3f0ff;border-radius:8px;padding:16px 20px;margin:0 0 20px">
      <a href="${link}" style="color:#6C5CE7;font-weight:700;font-size:15px;text-decoration:none;word-break:break-all">${link}</a>
    </div>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">I know it feels weird to ask for a testimonial. Here's what actually works:</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;font-weight:600">Just ask someone you already know liked your work.</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Not a prospect. Not a stranger. Someone who's already paid you and had a good experience.</p>
    <p style="margin:0 0 8px;color:#374151;font-size:14px;font-weight:600">The script that works:</p>
    <div style="background:#f9fafb;border-left:3px solid #6C5CE7;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 20px">
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;font-style:italic">"Hey — I'm trying to get some testimonials for my website. Would you be up for leaving a quick one? Here: ${link}. No pressure at all."</p>
    </div>
    <p style="margin:0 0 20px;color:#374151;font-size:15px;font-weight:600">One message. That's it.</p>
    <a href="${link}" style="display:inline-block;background:#6C5CE7;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin:0 0 16px">Send your collect link now →</a>
    <p style="margin:16px 0 16px;color:#374151;font-size:14px">Go send it right now, before you close this email.</p>
    <p style="margin:0;color:#374151;font-size:15px">— Vouch</p>
  `)
  await send(apiKey, opts.email, 'Did you send the link yet?', html)
}

/** Email 3: Check-in — sent 7 days after signup, personalized on testimonial count */
export async function sendCheckinEmail(
  apiKey: string,
  opts: { email: string; name: string; widgetId: string; testimonialCount: number }
): Promise<void> {
  const first = opts.name.split(' ')[0]
  const link = `${COLLECT_BASE}/${opts.widgetId}`
  const hasT = opts.testimonialCount > 0

  const personalizedBlock = hasT
    ? `<p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6"><strong>Nice work — you've got ${opts.testimonialCount} testimonial${opts.testimonialCount > 1 ? 's' : ''}.</strong> Now go get ${opts.testimonialCount >= 3 ? 'more' : '3'}. The widget looks way more compelling with multiple testimonials cycling through.</p>`
    : `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6"><strong>If you haven't sent the link yet:</strong> that's okay, but let's talk about why.</p>
       <ul style="margin:0 0 20px;padding-left:20px;color:#374151;font-size:14px;line-height:2.2">
         <li><strong>"I'm not sure who to ask"</strong> → Ask your last 3 happy customers. Just those 3.</li>
         <li><strong>"I feel awkward asking"</strong> → Your customers WANT to support you. Asking lets them.</li>
         <li><strong>"I'll do it when I have more time"</strong> → It takes 2 minutes. Now counts.</li>
       </ul>`

  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#111;font-weight:700">How's it going?</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Hey ${first},</p>
    <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6">It's been a week. Checking in — how's Vouch working for you?</p>
    ${personalizedBlock}
    <p style="margin:0 0 8px;color:#374151;font-size:15px">Your link:</p>
    <div style="background:#f3f0ff;border-radius:8px;padding:16px 20px;margin:0 0 20px">
      <a href="${link}" style="color:#6C5CE7;font-weight:700;font-size:15px;text-decoration:none;word-break:break-all">${link}</a>
    </div>
    <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6">If there's something about the product that's confusing or broken, reply and tell me. I read every response.</p>
    <p style="margin:0 0 8px;color:#374151;font-size:15px">— Vouch</p>
    <p style="margin:20px 0 0;color:#9ca3af;font-size:13px;line-height:1.5">P.S. If Vouch isn't the right fit for you, no hard feelings. Hit reply and let me know what you actually need — I'll point you somewhere useful.</p>
  `)
  await send(apiKey, opts.email, "How's it going?", html)
}

/** Email 4: T+1h nudge — sent 1 hour after signup if no testimonials yet */
export async function send1hNudgeEmail(
  apiKey: string,
  opts: { email: string; name: string; collectFormId: string }
): Promise<void> {
  const first = opts.name.split(' ')[0]
  const link = `https://socialproof.dev/c/${opts.collectFormId}`
  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#111;font-weight:700">Your Vouch link is ready — here's who to send it to</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Hi ${first},</p>
    <p style="margin:0 0 8px;color:#374151;font-size:15px">Your collection link is:</p>
    <div style="background:#f3f0ff;border-radius:8px;padding:16px 20px;margin:0 0 20px">
      <a href="${link}" style="color:#6C5CE7;font-weight:700;font-size:15px;text-decoration:none;word-break:break-all">${link}</a>
    </div>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">The fastest way to get your first testimonial? Send it to 3 people right now:</p>
    <ul style="margin:0 0 20px;padding-left:20px;color:#374151;font-size:15px;line-height:1.9">
      <li>A customer who left a positive review somewhere</li>
      <li>A client who thanked you recently</li>
      <li>Anyone who said "I love your product"</li>
    </ul>
    <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6">Takes 2 minutes for them. Takes you 10 seconds to forward this.</p>
    <p style="margin:0 0 8px;color:#374151;font-size:15px">— The Vouch team</p>
  `)
  await send(apiKey, opts.email, 'Your Vouch link is ready — here\'s who to send it to', html)
}

/** Email 5: First testimonial celebration — sent when the first testimonial is submitted */
export async function sendCelebrationEmail(
  apiKey: string,
  opts: { email: string; name: string; submitterName: string }
): Promise<void> {
  const first = opts.name.split(' ')[0]
  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#111;font-weight:700">🎉 You got your first testimonial!</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Hey ${first},</p>
    <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6"><strong>${opts.submitterName}</strong> just left you a testimonial on Vouch.</p>
    <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6">Approve it to make it public — then embed it on your site.</p>
    <a href="https://app.socialproof.dev/testimonials" style="display:inline-block;background:#6C5CE7;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin:0 0 20px">Review it now →</a>
    <p style="margin:16px 0 0;color:#9ca3af;font-size:13px;line-height:1.5">This is the moment that matters. One testimonial, live on your site, is more powerful than a hundred "coming soon" placeholders.</p>
  `)
  await send(apiKey, opts.email, '🎉 You got your first testimonial!', html)
}
