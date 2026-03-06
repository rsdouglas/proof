#!/usr/bin/env npx ts-node
/**
 * Cold Outreach Email Sender — Issue #384
 * Verticals: yoga/fitness, restaurant
 *
 * Usage:
 *   RESEND_API_KEY=re_xxx npx ts-node scripts/send-outreach.ts --dry-run
 *   RESEND_API_KEY=re_xxx npx ts-node scripts/send-outreach.ts --send
 *
 * Email list: pass targets as JSON via --targets='[{"email":"...","vertical":"yoga"}]'
 * or set OUTREACH_TARGETS env var to the same JSON string.
 *
 * Verticals: "yoga" | "restaurant"
 * Rate limit: 1 email per 30s (to avoid spam flags)
 *
 * Requires: node 18+, RESEND_API_KEY env var
 */

import https from 'https';

const SENDER = { name: 'Mark', email: 'mark@socialproof.dev' };
const RATE_LIMIT_MS = 30_000; // 30s between sends

interface Target {
  email: string;
  vertical: 'yoga' | 'fitness' | 'restaurant';
  name?: string; // optional first name for greeting
}

interface EmailPayload {
  from: string;
  to: string[];
  subject: string;
  text: string;
}

function buildEmail(target: Target): EmailPayload {
  const name = target.name ?? 'there';
  const isYogaOrFitness = target.vertical === 'yoga' || target.vertical === 'fitness';

  const yogaBody = `Hi ${name},

I help yoga studios collect client testimonials automatically — a short link your clients visit to leave a quick review. No login needed on their end, takes 60 seconds.

I built a free tool for it: socialproof.dev. You share one link, clients leave a testimonial, you approve it and it shows up on your site.

Would it be useful for you? Happy to show you a 2-minute demo.

Mark
SocialProof`;

  const restaurantBody = `Hi ${name},

I help local restaurants collect customer testimonials automatically — a short link your diners visit to leave a review. No login required, takes 60 seconds.

Free tool: socialproof.dev. One link, they leave a testimonial, you approve it and it shows on your site.

Would it help? Happy to walk you through it.

Mark
SocialProof`;

  return {
    from: `${SENDER.name} <${SENDER.email}>`,
    to: [target.email],
    subject: isYogaOrFitness
      ? 'Quick question about your studio reviews'
      : 'Quick question about your restaurant reviews',
    text: isYogaOrFitness ? yogaBody : restaurantBody,
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

  // Load targets from --targets arg or OUTREACH_TARGETS env
  const targetsArg = args.find((a) => a.startsWith('--targets='));
  const targetsJson = targetsArg
    ? targetsArg.slice('--targets='.length)
    : process.env.OUTREACH_TARGETS ?? '';

  if (!targetsJson) {
    console.error('Error: provide targets via --targets=\'[{"email":"...","vertical":"yoga"},...]\' or OUTREACH_TARGETS env var');
    process.exit(1);
  }

  let targets: Target[];
  try {
    targets = JSON.parse(targetsJson);
  } catch {
    console.error('Error: could not parse targets JSON');
    process.exit(1);
  }

  console.log(`\n🎯 Outreach script — ${isDryRun ? 'DRY RUN' : 'SENDING'}`);
  console.log(`📧 ${targets.length} recipient(s)\n`);

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const email = buildEmail(target);

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${i + 1}/${targets.length}] → ${target.email} (${target.vertical})`);
    console.log(`  Subject: ${email.subject}`);

    if (isDryRun) {
      console.log(`  Body preview: ${email.text.slice(0, 80)}...`);
      console.log('  ✓ DRY RUN — not sent\n');
      sent++;
      continue;
    }

    try {
      const result = await sendEmail(email, apiKey!);
      if (result.status >= 200 && result.status < 300) {
        console.log(`  ✅ Sent (status ${result.status})`);
        sent++;
      } else {
        console.error(`  ❌ Failed (status ${result.status}):`, JSON.stringify(result.body));
        failed++;
      }
    } catch (err) {
      console.error(`  ❌ Error:`, err);
      failed++;
    }

    // Rate limit: wait 30s between sends (skip after last email)
    if (i < targets.length - 1) {
      console.log(`  ⏱ Waiting 30s before next send...\n`);
      await sleep(RATE_LIMIT_MS);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  Sent:   ${sent}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total:  ${targets.length}`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
