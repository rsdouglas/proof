#!/usr/bin/env node
/**
 * Cold Email Outreach v2 — receives targets as JSON env var (no emails in git)
 * Issue: #459
 * Sender: Mark <hello@socialproof.dev>
 * 
 * Environment vars:
 *   RESEND_API_KEY  - Resend API key (from GH Actions secret)
 *   TARGETS_JSON    - JSON array of targets (from workflow_dispatch input)
 *   DRY_RUN         - 'true' or 'false'
 *   BATCH_LABEL     - label for logging
 */

const https = require('https');

const SENDER = { name: 'Mark from SocialProof', email: 'hello@socialproof.dev' };
const UNSUBSCRIBE = '\n\n---\nYou received this because you are a local small business owner. Reply STOP to unsubscribe.';

function buildEmail(target) {
  const { name, email, niche, city } = target;
  
  // Smart greeting: if name looks like a real person name, use first name
  const words = (name || '').split(/\s+/);
  const firstWord = words[0] || '';
  const isGeneric = ['Contact', 'Team', 'Info', 'Hello', 'Admin', 'Business', 'Staff'].includes(firstWord);
  const greeting = isGeneric ? 'Hi there,' : `Hi ${firstWord},`;
  
  const cityLine = city ? ` in ${city}` : '';
  const nicheLabel = (niche || 'small business').toLowerCase();
  
  const body = `${greeting}

I noticed you run a ${nicheLabel}${cityLine} — and I wanted to share a free tool that helps small businesses collect client testimonials automatically.

SocialProof lets you:
→ Send customers a simple link to leave a review (30 seconds, no account needed)
→ Collect video or text testimonials effortlessly
→ Embed a testimonial widget on your site in one line of code

Free forever for your first widget. No credit card required.

Try it free → https://socialproof.dev

— Mark
SocialProof${UNSUBSCRIBE}`;

  return {
    from: `${SENDER.name} <${SENDER.email}>`,
    to: [email],
    subject: 'Free tool for collecting client testimonials',
    text: body,
  };
}

function sendEmail(payload, apiKey) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const targetsJson = process.env.TARGETS_JSON;
  const isDryRun = process.env.DRY_RUN !== 'false';
  const batchLabel = process.env.BATCH_LABEL || 'outreach';
  const apiKey = process.env.RESEND_API_KEY;

  if (!targetsJson) {
    console.error('Error: TARGETS_JSON env var is required');
    process.exit(1);
  }

  let targets;
  try {
    targets = JSON.parse(targetsJson);
  } catch (e) {
    console.error('Error: TARGETS_JSON is not valid JSON:', e.message);
    process.exit(1);
  }

  if (!Array.isArray(targets) || targets.length === 0) {
    console.error('Error: TARGETS_JSON must be a non-empty array');
    process.exit(1);
  }

  if (!isDryRun && !apiKey) {
    console.error('Error: RESEND_API_KEY is required for live send');
    process.exit(1);
  }

  console.log(`\n=== SocialProof Cold Email — ${batchLabel} ===`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no emails sent)' : 'LIVE SEND'}`);
  console.log(`Targets: ${targets.length}\n`);

  const results = [];

  for (const target of targets) {
    if (!target.email || !target.email.includes('@')) {
      console.warn(`[SKIP] Invalid email for ${target.name}: ${target.email}`);
      continue;
    }

    const email = buildEmail(target);

    if (isDryRun) {
      console.log(`[DRY RUN] To: ${target.email}`);
      console.log(`  Name: ${target.name} | Niche: ${target.niche} | City: ${target.city || 'N/A'}`);
      console.log(`  Subject: ${email.subject}`);
      console.log(`  Greeting line: ${email.text.split('\n')[0]}`);
      console.log('');
      results.push({ target: target.name, email: target.email, status: 'dry-run' });
    } else {
      try {
        const result = await sendEmail(email, apiKey);
        const status = (result.status === 200 || result.status === 201) ? 'sent' : 'failed';
        console.log(`[${status.toUpperCase()}] ${target.email} (HTTP ${result.status})`);
        results.push({ target: target.name, email: target.email, status, httpStatus: result.status });
        // Rate limit: 1 per second
        await new Promise(r => setTimeout(r, 1100));
      } catch (err) {
        console.error(`[ERROR] ${target.email}: ${err.message}`);
        results.push({ target: target.name, email: target.email, status: 'error', error: err.message });
      }
    }
  }

  // Summary
  const sent = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed' || r.status === 'error').length;
  const skipped = results.filter(r => r.status === 'dry-run').length;

  console.log(`\n=== Summary ===`);
  if (isDryRun) {
    console.log(`Would send: ${skipped} | Total: ${targets.length}`);
  } else {
    console.log(`Sent: ${sent} | Failed: ${failed} | Total: ${targets.length}`);
  }

  if (!isDryRun && sent > 0) {
    console.log('\nCheck Resend dashboard: https://resend.com/emails');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
