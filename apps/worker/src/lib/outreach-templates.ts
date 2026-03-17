export type TemplateResult = { subject: string; html: string; text: string }

/**
 * Returns vertical-specific email copy when the target's vertical is recognised.
 * Each vertical gets a tailored subject + body referencing the matching /for/ page.
 * Returns null for unknown verticals -> falls back to A/B/C generic variants.
 */
function getVerticalContent(target: {
  name: string | null
  business_name: string | null
  vertical: string | null
  variant?: string | null
}): TemplateResult | null {
  const firstName = target.name?.split(' ')[0] ?? 'there'
  const biz = target.business_name ?? 'your business'
  const v = (target.vertical ?? '').toLowerCase().replace(/[\s_]/g, '-')

  const footer = `<p style="color:#999;font-size:12px;">You received this because we thought SocialProof might be useful for ${biz}. <a href="mailto:hello@socialproof.dev?subject=unsubscribe">Unsubscribe</a></p>`
  const footerText = `\n\n---\nYou received this because we thought SocialProof might be useful for ${biz}. Reply "unsubscribe" to opt out.`

  if (v === 'bakery' || v === 'bakeries') {
    const forPage = 'https://socialproof.dev/for/bakeries'
    const subject = `Your best reviews aren't on your website (yet)`
    const text = `Hi ${firstName},\n\nI spent time on your site and it's clear you put serious craft into what you make.\n\nOne thing I noticed: your Google reviews are great, but they're stuck on Google. The people visiting your site right now can't see them.\n\nI built SocialProof — a free tool that lets bakeries embed a live testimonial widget on their site in about 2 minutes. Customers submit feedback, you approve it, it shows up on your site automatically.\n\nFree forever for one widget. No credit card.\n\nWorth a look: ${forPage}\n\n— Mark${footerText}`
    const html = `<p>Hi ${firstName},</p>
<p>I spent time on your site and it's clear you put serious craft into what you make.</p>
<p>One thing I noticed: your Google reviews are great, but they're stuck on Google. The people visiting your site right now can't see them.</p>
<p>I built <strong>SocialProof</strong> — a free tool that lets bakeries embed a live testimonial widget on their site in about 2 minutes. Customers submit feedback, you approve it, it shows up on your site automatically.</p>
<p>Free forever for one widget. No credit card.</p>
<p><a href="${forPage}">Worth a look: socialproof.dev/for/bakeries</a></p>
<p>— Mark</p>
${footer}`
    return { subject, html, text }
  }

  if (v === 'fitness' || v === 'fitness-studio' || v === 'fitness-studios') {
    const forPage = 'https://socialproof.dev/for/fitness-studios'
    const subject = `A free way to show off what your members say`
    const text = `Hi ${firstName},\n\nWord-of-mouth is how most fitness studios grow — but most of that word-of-mouth disappears into Instagram comments or Google, where new prospects might not find it.\n\nI built SocialProof to fix that. It's a free tool that lets you collect testimonials from members and display them on your site automatically. Takes about 2 minutes to set up.\n\nFree forever for one widget. No credit card.\n\nI made a page specifically for fitness studios: ${forPage}\n\n— Mark from SocialProof${footerText}`
    const html = `<p>Hi ${firstName},</p>
<p>Word-of-mouth is how most fitness studios grow — but most of that word-of-mouth disappears into Instagram comments or Google, where new prospects might not find it.</p>
<p>I built SocialProof to fix that. It's a free tool that lets you collect testimonials from members and display them on your site automatically. Takes about 2 minutes to set up.</p>
<p>Free forever for one widget. No credit card.</p>
<p><a href="${forPage}">I made a page specifically for fitness studios</a></p>
<p>— Mark from SocialProof</p>
${footer}`
    return { subject, html, text }
  }

  if (v === 'salon' || v === 'salons' || v === 'hair-salon') {
    const forPage = 'https://socialproof.dev/for/salons'
    const subject = `${firstName}, your 5-star reviews deserve more than Yelp`
    const text = `Hi ${firstName},\n\nSalons live and die by referrals. But when someone Googles "${biz}" for the first time, all they see is a Yelp page — not your voice, not your vibe.\n\nSocialProof lets you collect testimonials from happy clients and show them directly on your own site. One widget, 2 minutes to set up, free forever.\n\nBuilt for salons: ${forPage}\n\n— Mark${footerText}`
    const html = `<p>Hi ${firstName},</p>
<p>Salons live and die by referrals. But when someone Googles "${biz}" for the first time, all they see is a Yelp page — not your voice, not your vibe.</p>
<p>SocialProof lets you collect testimonials from happy clients and show them directly on your own site. One widget, 2 minutes to set up, free forever.</p>
<p><a href="${forPage}">Built for salons: socialproof.dev/for/salons</a></p>
<p>— Mark</p>
${footer}`
    return { subject, html, text }
  }

  if (v === 'restaurant' || v === 'restaurants') {
    const forPage = 'https://socialproof.dev/for/restaurants'
    const subject = `${biz}'s best reviews deserve to be on your website`
    const text = `Hi ${firstName},\n\nRestaurant guests trust what other diners say — but most of that trust lives on Google or Yelp, not on your own site where you control the experience.\n\nSocialProof lets you collect testimonials from your guests and display them on your site automatically. Two minutes to set up, free forever for one widget.\n\nDesigned for restaurants: ${forPage}\n\n— Mark from SocialProof${footerText}`
    const html = `<p>Hi ${firstName},</p>
<p>Restaurant guests trust what other diners say — but most of that trust lives on Google or Yelp, not on your own site where you control the experience.</p>
<p>SocialProof lets you collect testimonials from your guests and display them on your site automatically. Two minutes to set up, free forever for one widget.</p>
<p><a href="${forPage}">Designed for restaurants: socialproof.dev/for/restaurants</a></p>
<p>— Mark from SocialProof</p>
${footer}`
    return { subject, html, text }
  }

  if (v === 'photographer' || v === 'photographers') {
    const forPage = 'https://socialproof.dev/for/photographers'
    const subject = `${firstName} — what do your clients say after the shoot?`
    const text = `Hi ${firstName},\n\nYour portfolio shows what you can do. But testimonials show what it's like to work with you — and that's often what closes the booking.\n\nSocialProof lets you collect client feedback after every shoot and display it on your site automatically. Free forever for one widget.\n\nBuilt for photographers: ${forPage}\n\n— Mark${footerText}`
    const html = `<p>Hi ${firstName},</p>
<p>Your portfolio shows what you can do. But testimonials show what it's like to work with you — and that's often what closes the booking.</p>
<p>SocialProof lets you collect client feedback after every shoot and display it on your site automatically. Free forever for one widget.</p>
<p><a href="${forPage}">Built for photographers: socialproof.dev/for/photographers</a></p>
<p>— Mark</p>
${footer}`
    return { subject, html, text }
  }

  if (v === 'real-estate' || v === 'real-estate-agent' || v === 'real-estate-agents' || v === 'realtor') {
    const forPage = 'https://socialproof.dev/for/real-estate'
    const subject = `${firstName} — your past clients are your best salespeople`
    const text = `Hi ${firstName},\n\nBuyers and sellers pick agents based on trust. Zillow and Realtor.com help — but they don't let you control the story.\n\nSocialProof lets you collect client testimonials and display them on your own site, exactly where prospects are deciding whether to call you. Free forever for one widget.\n\nBuilt for real estate agents: ${forPage}\n\n— Mark from SocialProof${footerText}`
    const html = `<p>Hi ${firstName},</p>
<p>Buyers and sellers pick agents based on trust. Zillow and Realtor.com help — but they don't let you control the story.</p>
<p>SocialProof lets you collect client testimonials and display them on your own site, exactly where prospects are deciding whether to call you. Free forever for one widget.</p>
<p><a href="${forPage}">Built for real estate agents: socialproof.dev/for/real-estate</a></p>
<p>— Mark from SocialProof</p>
${footer}`
    return { subject, html, text }
  }

  if (v === 'coach' || v === 'coaches' || v === 'life-coach' || v === 'consultant' || v === 'consultants') {
    const forPage = 'https://socialproof.dev/for/coaches'
    const subject = `${firstName}, your clients' words sell better than your own`
    const text = `Hi ${firstName},\n\nCoaching and consulting is built on trust. The problem: by the time someone finds your site, they've already decided whether to believe you.\n\nSocialProof lets you surface what past clients actually say — automatically, on your own site. Free forever for one widget.\n\n${forPage}\n\n— Mark${footerText}`
    const html = `<p>Hi ${firstName},</p>
<p>Coaching and consulting is built on trust. The problem: by the time someone finds your site, they've already decided whether to believe you.</p>
<p>SocialProof lets you surface what past clients actually say — automatically, on your own site. Free forever for one widget.</p>
<p><a href="${forPage}">socialproof.dev/for/coaches</a></p>
<p>— Mark</p>
${footer}`
    return { subject, html, text }
  }

  return null
}

export function getEmailContent(variant: string, target: {
  name: string | null
  business_name: string | null
  vertical: string | null
}): TemplateResult {
  const verticalContent = getVerticalContent(target)
  if (verticalContent) return verticalContent

  const firstName = target.name?.split(' ')[0] ?? 'there'
  const biz = target.business_name ?? 'your business'

  if (variant === 'B') {
    const subject = `Quick question about ${biz}'s reviews`
    const text = `Hi ${firstName},\n\nDo you ever wish your best customer reviews showed up on your website automatically — not just on Google?\n\nSocialProof does exactly that. You collect once, it shows everywhere.\n\nFree to try: https://socialproof.dev\n\nMark\nSocialProof`
    const html = `<p>Hi ${firstName},</p>
<p>Do you ever wish your best customer reviews showed up on your website automatically — not just on Google?</p>
<p>SocialProof does exactly that. You collect once, it shows everywhere.</p>
<p><a href="https://socialproof.dev">Free to try: socialproof.dev</a></p>
<p>Mark<br>SocialProof</p>
<p style="color:#999;font-size:12px;">You received this because we thought SocialProof might be useful for ${biz}. <a href="mailto:hello@socialproof.dev?subject=unsubscribe">Unsubscribe</a></p>`
    return { subject, html, text }
  }

  if (variant === 'C') {
    const subject = `${firstName} — testimonials on autopilot for ${biz}?`
    const text = `Hi ${firstName},\n\nMost small business owners know testimonials matter but collecting them is a pain.\n\nSocialProof automates the whole thing — collect, display, done.\n\nWorth 60 seconds: https://socialproof.dev\n\nMark\nSocialProof`
    const html = `<p>Hi ${firstName},</p>
<p>Most small business owners know testimonials matter but collecting them is a pain.</p>
<p>SocialProof automates the whole thing — collect, display, done.</p>
<p><a href="https://socialproof.dev">Worth 60 seconds: socialproof.dev</a></p>
<p>Mark<br>SocialProof</p>
<p style="color:#999;font-size:12px;">You received this because we thought SocialProof might be useful for ${biz}. <a href="mailto:hello@socialproof.dev?subject=unsubscribe">Unsubscribe</a></p>`
    return { subject, html, text }
  }

  const subject = `Testimonials for ${biz}`
  const text = `Hi ${firstName},\n\nI'm Mark from SocialProof — we help small businesses collect and display customer testimonials on their websites.\n\nMost of our users are coaches, fitness studios, and service businesses who want social proof but don't have time to chase it.\n\nIf that sounds like ${biz}, it's free to start: https://socialproof.dev\n\nMark\nSocialProof`
  const html = `<p>Hi ${firstName},</p>
<p>I'm Mark from SocialProof — we help small businesses collect and display customer testimonials on their websites.</p>
<p>Most of our users are coaches, fitness studios, and service businesses who want social proof but don't have time to chase it.</p>
<p>If that sounds like ${biz}, it's free to start: <a href="https://socialproof.dev">socialproof.dev</a></p>
<p>Mark<br>SocialProof</p>
<p style="color:#999;font-size:12px;">You received this because we thought SocialProof might be useful for ${biz}. <a href="mailto:hello@socialproof.dev?subject=unsubscribe">Unsubscribe</a></p>`
  return { subject, html, text }
}
