/**
 * Cloudflare Cron handler for onboarding drip emails.
 * 
 * Runs every hour. Sends:
 * - Email 2 (Nudge) to accounts created 48h ago with no approved testimonials
 * - Email 3 (Check-in) to accounts created 7 days ago
 *
 * Idempotent: tracks sent timestamp in drip_nudge_sent_at / drip_checkin_sent_at columns.
 */

import { sendNudgeEmail, sendCheckinEmail, send1hNudgeEmail, sendEmbedNudgeEmail } from './lib/onboarding'
import type { Env } from './index'

export async function handleCron(_event: ScheduledController, env: Env): Promise<void> {
  const { DB, RESEND_API_KEY } = env

  if (!RESEND_API_KEY) {
    console.error('[drip-cron] RESEND_API_KEY not set — skipping')
    return
  }

  const now = new Date()

  // ── Email 4: T+1h nudge (1h after signup, if no testimonials yet) ──────────
  const nudge1hAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString()
  const nudge2hAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()

  const nudge1hCandidates = await DB.prepare(`
    SELECT a.id, a.email, a.name,
           (SELECT id FROM widgets WHERE account_id = a.id ORDER BY created_at ASC LIMIT 1) as widget_id
    FROM accounts a
    WHERE a.created_at >= ? AND a.created_at < ?
      AND a.drip_1h_nudge_sent_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM testimonials t
        WHERE t.account_id = a.id
      )
  `).bind(nudge2hAgo, nudge1hAgo).all<{
    id: string; email: string; name: string | null; widget_id: string | null
  }>()

  for (const acct of nudge1hCandidates.results) {
    if (!acct.widget_id) continue
    try {
      await send1hNudgeEmail(RESEND_API_KEY, {
        email: acct.email,
        name: acct.name ?? acct.email,
        collectFormId: acct.widget_id,
      })
      await DB.prepare(
        'UPDATE accounts SET drip_1h_nudge_sent_at = ? WHERE id = ?'
      ).bind(now.toISOString(), acct.id).run()
      console.log(`[drip-cron] 1h-nudge sent to ${acct.email}`)
    } catch (err) {
      console.error(`[drip-cron] 1h-nudge failed for ${acct.email}:`, err)
    }
  }

  // ── Email 2: Nudge (48h after signup, if no approved testimonials yet) ──────
  const nudge48hAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
  const nudge49hAgo = new Date(now.getTime() - 49 * 60 * 60 * 1000).toISOString()

  const nudgeCandidates = await DB.prepare(`
    SELECT a.id, a.email, a.name,
           (SELECT id FROM widgets WHERE account_id = a.id ORDER BY created_at ASC LIMIT 1) as widget_id
    FROM accounts a
    WHERE a.created_at >= ? AND a.created_at < ?
      AND a.drip_nudge_sent_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM testimonials t
        WHERE t.account_id = a.id AND t.status = 'approved'
      )
  `).bind(nudge49hAgo, nudge48hAgo).all<{
    id: string; email: string; name: string | null; widget_id: string | null
  }>()

  for (const acct of nudgeCandidates.results) {
    if (!acct.widget_id) continue
    try {
      await sendNudgeEmail(RESEND_API_KEY, {
        email: acct.email,
        name: acct.name ?? acct.email,
        widgetId: acct.widget_id,
      })
      await DB.prepare(
        'UPDATE accounts SET drip_nudge_sent_at = ? WHERE id = ?'
      ).bind(now.toISOString(), acct.id).run()
      console.log(`[drip-cron] nudge sent to ${acct.email}`)
    } catch (err) {
      console.error(`[drip-cron] nudge failed for ${acct.email}:`, err)
    }
  }

  // ── Email 3: Check-in (7 days after signup) ───────────────────────────────
  const checkin7dAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const checkin7d1hAgo = new Date(now.getTime() - (7 * 24 + 1) * 60 * 60 * 1000).toISOString()

  const checkinCandidates = await DB.prepare(`
    SELECT a.id, a.email, a.name,
           (SELECT id FROM widgets WHERE account_id = a.id ORDER BY created_at ASC LIMIT 1) as widget_id,
           (SELECT COUNT(*) FROM testimonials t WHERE t.account_id = a.id AND t.status = 'approved') as testimonial_count
    FROM accounts a
    WHERE a.created_at >= ? AND a.created_at < ?
      AND a.drip_checkin_sent_at IS NULL
  `).bind(checkin7d1hAgo, checkin7dAgo).all<{
    id: string; email: string; name: string | null; widget_id: string | null; testimonial_count: number
  }>()

  for (const acct of checkinCandidates.results) {
    if (!acct.widget_id) continue
    try {
      await sendCheckinEmail(RESEND_API_KEY, {
        email: acct.email,
        name: acct.name ?? acct.email,
        widgetId: acct.widget_id,
        testimonialCount: acct.testimonial_count,
      })
      await DB.prepare(
        'UPDATE accounts SET drip_checkin_sent_at = ? WHERE id = ?'
      ).bind(now.toISOString(), acct.id).run()
      console.log(`[drip-cron] checkin sent to ${acct.email}`)
    } catch (err) {
      console.error(`[drip-cron] checkin failed for ${acct.email}:`, err)
    }
  }

  // ── Embed nudge email: 72h after signup, approved but no widget embedded ──
  const embed72hAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString()
  const embed73hAgo = new Date(now.getTime() - 73 * 60 * 60 * 1000).toISOString()

  const embedNudgeCandidates = await DB.prepare(`
    SELECT a.id, a.email, a.name,
           (SELECT id FROM widgets WHERE account_id = a.id ORDER BY created_at ASC LIMIT 1) as widget_id,
           (SELECT COUNT(*) FROM testimonials t WHERE t.account_id = a.id AND t.status = 'approved') as approved_count
    FROM accounts a
    WHERE a.created_at >= ? AND a.created_at < ?
      AND a.embed_nudge_email_sent_at IS NULL
      AND EXISTS (
        SELECT 1 FROM testimonials t
        WHERE t.account_id = a.id AND t.status = 'approved'
      )
      AND EXISTS (
        SELECT 1 FROM widgets w WHERE w.account_id = a.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM widgets w
        WHERE w.account_id = a.id AND w.embed_verified_at IS NOT NULL
      )
  `).bind(embed73hAgo, embed72hAgo).all<{
    id: string; email: string; name: string | null; widget_id: string | null; approved_count: number
  }>()

  for (const acct of embedNudgeCandidates.results) {
    if (!acct.widget_id) continue
    try {
      await sendEmbedNudgeEmail(RESEND_API_KEY, {
        email: acct.email,
        name: acct.name ?? acct.email,
        widgetId: acct.widget_id,
        approvedCount: acct.approved_count,
      })
      await DB.prepare(
        'UPDATE accounts SET embed_nudge_email_sent_at = ? WHERE id = ?'
      ).bind(now.toISOString(), acct.id).run()
      console.log(`[drip-cron] embed-nudge sent to ${acct.email}`)
    } catch (err) {
      console.error(`[drip-cron] embed-nudge failed for ${acct.email}:`, err)
    }
  }
}
