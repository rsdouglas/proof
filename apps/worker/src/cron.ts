/**
 * Cloudflare Cron handler for onboarding drip emails.
 *
 * Revised per CEO spec (issue #231):
 * - Email 2 (Day 2): fires if account created ~48h ago and no approved testimonials yet
 * - Email 3 (Day 5): fires if account created ~120h ago and no approved testimonials yet
 * - Suppression: ≥1 approved testimonial stops all future drip emails
 * - Embed nudge: fires when user has ≥1 approved testimonial but widget not verified
 * - Celebration: fires when first testimonial approved
 *
 * - Email 4 (Day 4): fires if no approved testimonials yet (issue #243)
 * - Email 5 (Day 14): final win-back if still no approved testimonials (issue #243)
 *
 * Idempotent: uses drip_day2_sent_at, drip_day5_sent_at, drip_day4_sent_at, drip_day14_sent_at columns.
 * Cron: 0 * * * * (every hour on Cloudflare Workers)
 */

import {
  sendDay2NudgeEmail,
  sendDay5NudgeEmail,
  sendDay4NoTestimonialsEmail,
  sendDay14WinbackEmail,
  sendCelebrationEmail,
  sendEmbedNudgeEmail,
} from './lib/onboarding'
import type { Env } from './index'

export async function handleCron(_event: ScheduledController, env: Env): Promise<void> {
  const { DB, RESEND_API_KEY } = env

  if (!RESEND_API_KEY) {
    console.error('[drip-cron] RESEND_API_KEY not set — skipping')
    return
  }

  const now = new Date()

  // ── Day 2 nudge: "Did anyone see your collection link?" ──────────────────
  // Window: 48–49h after signup, no approved testimonials
  const day2Start = new Date(now.getTime() - 49 * 60 * 60 * 1000).toISOString()
  const day2End   = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()

  const day2Candidates = await DB.prepare(`
    SELECT a.id, a.email, a.name,
           (SELECT id FROM collection_forms WHERE account_id = a.id ORDER BY created_at ASC LIMIT 1) AS form_id
    FROM accounts a
    WHERE a.created_at >= ? AND a.created_at < ?
      AND a.drip_day2_sent_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM testimonials t
        WHERE t.account_id = a.id AND t.status = 'approved'
      )
  `).bind(day2Start, day2End).all<{
    id: string; email: string; name: string | null; form_id: string | null
  }>()

  for (const acct of day2Candidates.results) {
    if (!acct.form_id) continue
    try {
      await sendDay2NudgeEmail(RESEND_API_KEY, {
        email: acct.email,
        name: acct.name ?? acct.email,
        formId: acct.form_id,
      })
      await DB.prepare('UPDATE accounts SET drip_day2_sent_at = ? WHERE id = ?')
        .bind(now.toISOString(), acct.id).run()
      console.log(`[drip-cron] day2-nudge sent to ${acct.email}`)
    } catch (err) {
      console.error(`[drip-cron] day2-nudge failed for ${acct.email}:`, err)
    }
  }

  // ── Day 5 nudge: "One testimonial = 34% more conversions" ────────────────
  // Window: 120–121h after signup, no approved testimonials
  const day5Start = new Date(now.getTime() - 121 * 60 * 60 * 1000).toISOString()
  const day5End   = new Date(now.getTime() - 120 * 60 * 60 * 1000).toISOString()

  const day5Candidates = await DB.prepare(`
    SELECT a.id, a.email, a.name,
           (SELECT id FROM collection_forms WHERE account_id = a.id ORDER BY created_at ASC LIMIT 1) AS form_id
    FROM accounts a
    WHERE a.created_at >= ? AND a.created_at < ?
      AND a.drip_day5_sent_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM testimonials t
        WHERE t.account_id = a.id AND t.status = 'approved'
      )
  `).bind(day5Start, day5End).all<{
    id: string; email: string; name: string | null; form_id: string | null
  }>()

  for (const acct of day5Candidates.results) {
    if (!acct.form_id) continue
    try {
      await sendDay5NudgeEmail(RESEND_API_KEY, {
        email: acct.email,
        name: acct.name ?? acct.email,
        formId: acct.form_id,
      })
      await DB.prepare('UPDATE accounts SET drip_day5_sent_at = ? WHERE id = ?')
        .bind(now.toISOString(), acct.id).run()
      console.log(`[drip-cron] day5-nudge sent to ${acct.email}`)
    } catch (err) {
      console.error(`[drip-cron] day5-nudge failed for ${acct.email}:`, err)
    }
  }

  // ── Celebration email: first approved testimonial ─────────────────────────
  // For accounts that have just gotten their first approved testimonial
  const celebrationCandidates = await DB.prepare(`
    SELECT a.id, a.email, a.name,
           (SELECT id FROM widgets WHERE account_id = a.id ORDER BY created_at ASC LIMIT 1) AS widget_id,
           t.author_name, t.content
    FROM accounts a
    JOIN testimonials t ON t.account_id = a.id AND t.status = 'approved'
    WHERE a.drip_celebration_sent_at IS NULL
      AND (
        SELECT COUNT(*) FROM testimonials
        WHERE account_id = a.id AND status = 'approved'
      ) = 1
    GROUP BY a.id
    LIMIT 50
  `).all<{
    id: string; email: string; name: string | null; widget_id: string | null;
    author_name: string | null; content: string | null
  }>()

  for (const acct of celebrationCandidates.results) {
    if (!acct.widget_id) continue
    try {
      await sendCelebrationEmail(RESEND_API_KEY, {
        email: acct.email,
        name: acct.name ?? acct.email,
        widgetId: acct.widget_id,
        testimonialAuthor: acct.author_name ?? 'A customer',
        testimonialText: acct.content ?? '',
      })
      await DB.prepare('UPDATE accounts SET drip_celebration_sent_at = ? WHERE id = ?')
        .bind(now.toISOString(), acct.id).run()
      console.log(`[drip-cron] celebration sent to ${acct.email}`)
    } catch (err) {
      console.error(`[drip-cron] celebration failed for ${acct.email}:`, err)
    }
  }

  // ── Embed nudge: has testimonials but widget not yet verified ─────────────
  // Window: account created > 3 days ago, ≥1 approved testimonial, widget not embedded
  const embedNudgeCutoff = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString()

  const embedNudgeCandidates = await DB.prepare(`
    SELECT a.id, a.email, a.name,
           w.id AS widget_id,
           (SELECT COUNT(*) FROM testimonials WHERE account_id = a.id AND status = 'approved') AS approved_count
    FROM accounts a
    JOIN widgets w ON w.account_id = a.id
    WHERE a.created_at < ?
      AND a.embed_nudge_email_sent_at IS NULL
      AND w.embed_verified_at IS NULL
      AND (
        SELECT COUNT(*) FROM testimonials
        WHERE account_id = a.id AND status = 'approved'
      ) >= 1
    GROUP BY a.id
    LIMIT 50
  `).bind(embedNudgeCutoff).all<{
    id: string; email: string; name: string | null; widget_id: string | null; approved_count: number
  }>()

  for (const acct of embedNudgeCandidates.results) {
    if (!acct.widget_id) continue
    try {
      await sendEmbedNudgeEmail(RESEND_API_KEY, {
        email: acct.email,
        name: acct.name ?? acct.email,
        approvedCount: acct.approved_count,
        widgetId: acct.widget_id,
      })
      await DB.prepare('UPDATE accounts SET embed_nudge_email_sent_at = ? WHERE id = ?')
        .bind(now.toISOString(), acct.id).run()
      console.log(`[drip-cron] embed-nudge sent to ${acct.email}`)
    } catch (err) {
      console.error(`[drip-cron] embed-nudge failed for ${acct.email}:`, err)
    }
  }

  // ── Day 4: no-testimonials nudge (issue #243) ─────────────────────────────
  // Fires when: account created ~96h ago, 0 approved testimonials, not yet sent
  const day4Cutoff   = new Date(now.getTime() - 96 * 60 * 60 * 1000).toISOString()
  const day4Ceiling  = new Date(now.getTime() - 120 * 60 * 60 * 1000).toISOString()

  const day4Candidates = await DB.prepare(`
    SELECT a.id, a.email, a.name,
           (SELECT form_id FROM collection_forms WHERE account_id = a.id ORDER BY created_at ASC LIMIT 1) AS form_id
    FROM accounts a
    WHERE a.created_at < ?
      AND a.created_at > ?
      AND a.drip_day4_sent_at IS NULL
      AND (
        SELECT COUNT(*) FROM testimonials
        WHERE account_id = a.id AND status = 'approved'
      ) = 0
    LIMIT 50
  `).bind(day4Cutoff, day4Ceiling).all<{
    id: string; email: string; name: string | null; form_id: string | null
  }>()

  for (const acct of day4Candidates.results) {
    if (!acct.form_id) continue
    try {
      await sendDay4NoTestimonialsEmail(RESEND_API_KEY, {
        email: acct.email,
        name: acct.name ?? acct.email,
        formId: acct.form_id,
      })
      await DB.prepare('UPDATE accounts SET drip_day4_sent_at = ? WHERE id = ?')
        .bind(now.toISOString(), acct.id).run()
      console.log(`[drip-cron] day4-nudge sent to ${acct.email}`)
    } catch (err) {
      console.error(`[drip-cron] day4-nudge failed for ${acct.email}:`, err)
    }
  }

  // ── Day 14: win-back (issue #243) ─────────────────────────────────────────
  // Fires when: account created ~336h ago, 0 approved testimonials, not yet sent
  // This is the final drip email — after this we stop emailing.
  const day14Cutoff  = new Date(now.getTime() - 336 * 60 * 60 * 1000).toISOString()
  const day14Ceiling = new Date(now.getTime() - 360 * 60 * 60 * 1000).toISOString()

  const day14Candidates = await DB.prepare(`
    SELECT a.id, a.email, a.name,
           (SELECT form_id FROM collection_forms WHERE account_id = a.id ORDER BY created_at ASC LIMIT 1) AS form_id
    FROM accounts a
    WHERE a.created_at < ?
      AND a.created_at > ?
      AND a.drip_day14_sent_at IS NULL
      AND (
        SELECT COUNT(*) FROM testimonials
        WHERE account_id = a.id AND status = 'approved'
      ) = 0
    LIMIT 50
  `).bind(day14Cutoff, day14Ceiling).all<{
    id: string; email: string; name: string | null; form_id: string | null
  }>()

  for (const acct of day14Candidates.results) {
    if (!acct.form_id) continue
    try {
      await sendDay14WinbackEmail(RESEND_API_KEY, {
        email: acct.email,
        name: acct.name ?? acct.email,
        formId: acct.form_id,
      })
      await DB.prepare('UPDATE accounts SET drip_day14_sent_at = ? WHERE id = ?')
        .bind(now.toISOString(), acct.id).run()
      console.log(`[drip-cron] day14-winback sent to ${acct.email}`)
    } catch (err) {
      console.error(`[drip-cron] day14-winback failed for ${acct.email}:`, err)
    }
  }
}
