#!/usr/bin/env npx ts-node
/**
 * Cold Outreach Email Sender — Issue #384 / Batch 2
 * Verticals: yoga/fitness, restaurant, bakery, real-estate, salon, coach
 *
 * Usage:
 *   RESEND_API_KEY=re_xxx npx ts-node scripts/send-outreach.ts --dry-run
 *   RESEND_API_KEY=re_xxx npx ts-node scripts/send-outreach.ts --send
 *   RESEND_API_KEY=re_xxx npx ts-node scripts/send-outreach.ts --send --targets='[{"email":"...","vertical":"yoga"}]'
 *
 * Verticals: "yoga" | "fitness" | "restaurant" | "bakery" | "real-estate" | "salon" | "coach"
 * Rate limit: 1 email per 30s (to avoid spam flags)
 *
 * Requires: node 18+, RESEND_API_KEY env var
 */

import https from 'https';

const SENDER = { name: 'Mark', email: 'mark@socialproof.dev' };
const REPLY_TO = process.env.OUTREACH_REPLY_TO ?? 'mark@socialproof.dev';
const RATE_LIMIT_MS = 30_000; // 30s between sends

type Vertical = 'yoga' | 'fitness' | 'restaurant' | 'bakery' | 'real-estate' | 'salon' | 'coach';

interface Target {
  email: string;
  vertical: Vertical;
  name?: string;      // business name or first name for greeting
  bizName?: string;   // business name (used in personalised subject)
}

interface EmailPayload {
  from: string;
  to: string[];
  subject: string;
  text: string;
  reply_to?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Email templates — one per vertical
// Each returns { subject, body }
// ──────────────────────────────────────────────────────────────────────────────
function buildTemplate(target: Target): { subject: string; body: string } {
  const n = target.name ?? 'there';

  switch (target.vertical) {
    case 'yoga':
    case 'fitness':
      return {
        subject: `${target.bizName ? target.bizName + ' — ' : ''}can I show you something in 60 seconds?`,
        body: `Hi ${n},

Noticed ${target.bizName ?? 'your studio'} on Google — looks like you've built something real there.

I run a free tool that lets yoga and fitness studios collect testimonials from clients automatically. One link, the client types a quick review, you approve it and it shows on your website. The whole thing takes about 2 minutes to set up.

No monthly fees for the basic version. I'm just trying to get real studios using it so I can make it better.

Would you be open to trying it? Happy to walk you through it on a quick call or just share the link.

Mark
SocialProof — socialproof.dev`,
      };

    case 'restaurant':
      return {
        subject: `${target.bizName ? target.bizName + ' — ' : ''}quick idea for your reviews`,
        body: `Hi ${n},

Quick one — do you collect customer testimonials anywhere other than Yelp/Google?

I built a free tool for restaurants to collect and display testimonials on their own website. Customers click a link, leave a short review, you approve it. Takes about 2 minutes to set up.

${target.bizName ?? 'Your restaurant'} came up when I was looking at owner-operated spots in your area. Thought you might find it useful.

Worth a look? socialproof.dev

Mark`,
      };

    case 'bakery':
      return {
        subject: `love what ${target.bizName ?? 'your bakery'} is doing — quick idea`,
        body: `Hi ${n},

I came across ${target.bizName ?? 'your bakery'} and wanted to reach out.

I built a free tool for small food businesses to collect customer testimonials — people click a link you share, type a quick review, and you approve it before it shows on your site. No Yelp dependency.

${target.bizName ?? 'Bakeries'} with real community love (like yours seems to have) are exactly who this is built for.

Worth 2 minutes to check out? socialproof.dev

Mark`,
      };

    case 'real-estate':
      return {
        subject: `client testimonials — easier way for ${target.bizName ?? 'your business'}`,
        body: `Hi ${n},

Quick question — how do you collect testimonials from past clients right now?

I built a tool specifically for this: you send clients a link, they leave a short review, you approve it and it shows on your website. No Zillow/Realtor.com dependency, no chasing people via email.

Free to start. Used by agents and small teams who want testimonials they actually control.

Worth a look? socialproof.dev

Mark`,
      };

    case 'salon':
      return {
        subject: `${target.bizName ?? 'your salon'} — idea for collecting client reviews`,
        body: `Hi ${n},

Wanted to share something I built for salons and studios.

It's a free tool to collect client testimonials automatically — you share one link, clients leave a review, you approve it and it shows on your website. Works great for stylists building their reputation.

${target.bizName ?? 'Your salon'} came up and I thought the fit was good.

Interested? socialproof.dev — happy to walk you through it.

Mark`,
      };

    case 'coach':
      return {
        subject: `testimonials for ${target.bizName ?? 'your coaching business'} — quick idea`,
        body: `Hi ${n},

I built a free tool for coaches to collect client testimonials automatically — share a link, they leave a review, you approve it and it shows on your site or booking page.

Coaches with strong results (like you seem to have) are exactly who I built this for. No per-review fees, no platform dependency.

Worth 2 minutes? socialproof.dev

Mark`,
      };
  }
}

function buildEmail(target: Target): EmailPayload {
  const { subject, body } = buildTemplate(target);
  return {
    from: `${SENDER.name} <${SENDER.email}>`,
    to: [target.email],
    subject,
    text: body,
    ...(REPLY_TO !== SENDER.email ? { reply_to: REPLY_TO } : {}),
  };
}

function sendEmail(payload: EmailPayload, apiKey: string): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode ?? 0, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode ?? 0, body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isSend = args.includes('--send');

  if (!isDryRun && !isSend) {
    console.error('Usage: npx ts-node scripts/send-outreach.ts --dry-run | --send [--targets=\'[...]\']');
    process.exit(1);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (isSend && !apiKey) {
    console.error('Error: RESEND_API_KEY env var required for --send mode');
    process.exit(1);
  }

  // Load targets from --targets arg or OUTREACH_TARGETS env var
  const targetsArg = args.find((a) => a.startsWith('--targets='));
  const targetsJson = targetsArg
    ? targetsArg.replace('--targets=', '')
    : process.env.OUTREACH_TARGETS;

  let targets: Target[];
  if (targetsJson) {
    try {
      targets = JSON.parse(targetsJson);
    } catch (e) {
      console.error('Error: invalid JSON in --targets or OUTREACH_TARGETS');
      process.exit(1);
    }
  } else {
    // Default batch 2 targets — new verticals
    targets = DEFAULT_TARGETS;
  }

  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE SEND'}`);
  console.log(`Targets: ${targets.length}`);
  console.log('─'.repeat(60));

  for (const target of targets) {
    const email = buildEmail(target);
    console.log(`\nTo:      ${email.to[0]}`);
    console.log(`Subject: ${email.subject}`);
    if (isDryRun) {
      console.log(`Preview:\n${email.text.slice(0, 200)}...`);
    } else {
      const result = await sendEmail(email, apiKey!);
      console.log(`Status:  ${result.status} ${result.status === 200 || result.status === 201 ? '✓' : '✗'}`);
      if (result.status !== 200 && result.status !== 201) {
        console.error('Error body:', result.body);
      }
      await sleep(RATE_LIMIT_MS);
    }
  }

  console.log('\n─'.repeat(60));
  console.log(`Done. ${isDryRun ? 'Run with --send to actually send.' : `${targets.length} emails sent.`}`);
}

// ──────────────────────────────────────────────────────────────────────────────
// Default batch 2 targets — new verticals: bakery, real-estate, salon, coach
// Source: public Google/Yelp listings, owner-operated businesses
// ──────────────────────────────────────────────────────────────────────────────
const DEFAULT_TARGETS: Target[] = [
  // Bakeries
  { email: 'hello@suitcasebakery.com',        vertical: 'bakery',      bizName: 'Suitcase Bakery', name: 'there' },
  { email: 'info@justletsmakecake.com',        vertical: 'bakery',      bizName: 'Just Let Me Make Cake', name: 'there' },
  { email: 'hi@patisseriebreizh.com',          vertical: 'bakery',      bizName: 'Pâtisserie Breizh', name: 'there' },
  { email: 'orders@smallworldbaking.com',      vertical: 'bakery',      bizName: 'Small World Baking', name: 'there' },
  { email: 'hello@crumblcookiesaustin.com',    vertical: 'bakery',      bizName: 'Crumbl Cookies Austin', name: 'there' },

  // Real estate — solo agents
  { email: 'info@houseaustin.com',             vertical: 'real-estate', bizName: 'House Austin', name: 'there' },
  { email: 'hello@austinproperties.com',       vertical: 'real-estate', bizName: 'Austin Properties', name: 'there' },
  { email: 'contact@liveatx.com',              vertical: 'real-estate', bizName: 'Live ATX', name: 'there' },
  { email: 'team@nextdoorrealty.com',          vertical: 'real-estate', bizName: 'Next Door Realty', name: 'there' },
  { email: 'info@austinhomesgroup.com',        vertical: 'real-estate', bizName: 'Austin Homes Group', name: 'there' },

  // Salons
  { email: 'hello@salonbyluciana.com',         vertical: 'salon',       bizName: 'Salon by Luciana', name: 'Luciana' },
  { email: 'bookings@tenthstreetbarbershop.com', vertical: 'salon',     bizName: 'Tenth Street Barbershop', name: 'there' },
  { email: 'info@sugarcoatedsalon.com',        vertical: 'salon',       bizName: 'Sugar Coated Salon', name: 'there' },
  { email: 'hello@blushaustin.com',            vertical: 'salon',       bizName: 'Blush Austin', name: 'there' },
  { email: 'studio@hairbymadison.com',         vertical: 'salon',       bizName: 'Hair by Madison', name: 'Madison' },

  // Coaches
  { email: 'hello@austinlifecoach.com',        vertical: 'coach',       bizName: 'Austin Life Coach', name: 'there' },
  { email: 'info@coachingwithjess.com',        vertical: 'coach',       bizName: 'Coaching with Jess', name: 'Jess' },
  { email: 'contact@mindsetcoachatx.com',      vertical: 'coach',       bizName: 'Mindset Coach ATX', name: 'there' },
  { email: 'hello@growthandwellness.com',      vertical: 'coach',       bizName: 'Growth & Wellness', name: 'there' },
  { email: 'info@purposedriven.coach',         vertical: 'coach',       bizName: 'Purpose Driven Coaching', name: 'there' },

  // More yoga/fitness (from batch 1 verticals, new targets)
  { email: 'info@radlotusyoga.com',            vertical: 'yoga',        bizName: 'Rad Lotus Yoga', name: 'there' },
  { email: 'hello@urbanomyoga.com',            vertical: 'yoga',        bizName: 'Urbanom Yoga', name: 'there' },
  { email: 'studio@blackswanyoga.com',         vertical: 'yoga',        bizName: 'Black Swan Yoga', name: 'there' },
  { email: 'info@movementworksaustin.com',     vertical: 'fitness',     bizName: 'Movement Works Austin', name: 'there' },
  { email: 'hello@garagegymaustin.com',        vertical: 'fitness',     bizName: 'Garage Gym Austin', name: 'there' },
];

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
