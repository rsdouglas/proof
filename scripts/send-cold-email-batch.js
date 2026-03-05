#!/usr/bin/env node
/**
 * Cold Email Batch Sender — SocialProof Batch 1
 * Issue: #294
 * Sender: Mark (Marketing) <hello@socialproof.dev>
 * 
 * Usage:
 *   RESEND_API_KEY=re_xxx node scripts/send-cold-email-batch.js --dry-run
 *   RESEND_API_KEY=re_xxx node scripts/send-cold-email-batch.js --send --batch=1
 *
 * Requires: node 18+, RESEND_API_KEY env var
 */

const https = require('https');

const SENDER = { name: 'Mark from SocialProof', email: 'hello@socialproof.dev' };
const UNSUBSCRIBE_TEXT = '\n\n---\nYou received this because you are a small business owner. Reply STOP to opt out.';

// Email variant A — direct/functional
function buildEmail(target) {
  const { name, email, niche } = target;
  const firstName = name.split(' ')[0];
  
  // Personalize greeting
  const greeting = firstName === 'Contact' || firstName === 'Team' || firstName === 'Skills'
    ? 'Hi there,'
    : `Hi ${firstName},`;

  const body = `${greeting}

I noticed you run a ${niche.toLowerCase()} business — and I wanted to share a free tool that helps coaches and consultants collect client testimonials automatically.

SocialProof lets you:
→ Send customers a simple collection link
→ They leave a review in 30 seconds (no account needed)
→ You embed it on your site in one line of code

Free forever for your first widget. No credit card.

Try it free → https://socialproof.dev

— Mark
SocialProof${UNSUBSCRIBE_TEXT}`;

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
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isSend = args.includes('--send');
  const batchArg = args.find(a => a.startsWith('--batch='));
  const batchNum = batchArg ? parseInt(batchArg.split('=')[1]) : 1;
  
  if (!isDryRun && !isSend) {
    console.error('Usage: node send-cold-email-batch.js --dry-run | --send [--batch=N]');
    process.exit(1);
  }
  
  const apiKey = process.env.RESEND_API_KEY;
  if (isSend && !apiKey) {
    console.error('Error: RESEND_API_KEY env var required for --send mode');
    process.exit(1);
  }
  
  // Load targets
  const fs = require('fs');
  const path = require('path');
  const targetsFile = path.join(__dirname, '../docs/marketing/cold-email-targets-batch1.md');
  const content = fs.readFileSync(targetsFile, 'utf8');
  
  // Parse markdown table
  const targets = [];
  const lines = content.split('\n');
  let inTable = false;
  for (const line of lines) {
    if (line.startsWith('|') && !line.startsWith('| #') && !line.startsWith('|---')) {
      inTable = true;
      const cols = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cols.length >= 4 && cols[0] !== '#') {
        const [num, name, email, niche] = cols;
        if (email && email.includes('@')) {
          targets.push({ num: parseInt(num), name, email, niche });
        }
      }
    }
  }
  
  // Batch selection (batch 1 = targets 1-25, batch 2 = 26-51)
  const BATCH_SIZE = 25;
  const start = (batchNum - 1) * BATCH_SIZE;
  const batch = targets.slice(start, start + BATCH_SIZE);
  
  console.log(`\n=== SocialProof Cold Email — Batch ${batchNum} ===`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no emails sent)' : 'LIVE SEND'}`);
  console.log(`Targets: ${batch.length} emails\n`);
  
  const results = [];
  for (const target of batch) {
    const email = buildEmail(target);
    
    if (isDryRun) {
      console.log(`[DRY RUN] To: ${target.email}`);
      console.log(`  Subject: ${email.subject}`);
      console.log(`  Greeting: ${email.text.split('\n')[0]}`);
      console.log('');
      results.push({ target, status: 'dry-run' });
    } else {
      try {
        const result = await sendEmail(email, apiKey);
        const status = result.status === 200 || result.status === 201 ? 'sent' : 'failed';
        console.log(`[${status.toUpperCase()}] ${target.email} (${result.status})`);
        results.push({ target, status, response: result });
        // Rate limit: 1/second
        await new Promise(r => setTimeout(r, 1100));
      } catch (err) {
        console.error(`[ERROR] ${target.email}: ${err.message}`);
        results.push({ target, status: 'error', error: err.message });
      }
    }
  }
  
  // Summary
  const sent = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed' || r.status === 'error').length;
  console.log(`\n=== Summary ===`);
  console.log(`Sent: ${sent} | Failed: ${failed} | Total: ${batch.length}`);
  
  // Write log
  const logFile = path.join(__dirname, `../docs/marketing/send-log-batch${batchNum}.json`);
  fs.writeFileSync(logFile, JSON.stringify({ 
    batchNum, 
    timestamp: new Date().toISOString(),
    mode: isDryRun ? 'dry-run' : 'live',
    results 
  }, null, 2));
  console.log(`\nLog written to: ${logFile}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
